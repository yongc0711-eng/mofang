import { initializeColorPools, snapshotPools, pickPracticeColors, colorBottom, paletteFor, type PracticeColors, type PracticeColorPools } from '../lib/practiceColors';
import { type Palette } from '../lib/colorScheme';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CaseDiagram } from '../components/CaseDiagram';
import { practiceViewFor } from '../components/CaseCard';
import { SETS, getCase, getSet } from '../data';
import { diagramColors2, is2x2Set } from '../lib/cases2';
import { compatiblePracticeSession } from '../lib/practiceRestore';
import { STICKERS2 } from '../lib/cube2';
import { sampleTarget2 } from '../lib/practice2';
import { CaseDiagram2 } from '../components/CaseDiagram2';
import { Recognition2 } from '../components/Recognition2';
import { getUi, setUi } from '../lib/uiState';
import { matchesMyCase, type MyCaseFilter } from '../lib/myCaseFilters';
import { pickCase } from '../lib/practice';
import { invalidateSpace, spaceDown, spaceUp, watchPressCancellation, type SpaceHold } from '../lib/practiceKeys';
import {
  DOC_ID,
  clearSession,
  elapsedOf,
  loadSession,
  resumeTimer,
  saveSession,
  startTimer,
  stopTimer,
  type PracticeSession,
  type Timer,
} from '../lib/practiceSession';
import { createWakeLock, type ScreenWakeLock } from '../lib/wakeLock';
import { sampleTarget } from '../lib/practiceSample';
import { invertMoves } from '../lib/cube';
import { movesToString, parseAlg } from '../lib/alg';
import { prepareSetup } from '../lib/prepareSetup';
import { type PreparedSetup } from '../lib/practiceTarget';
import { practiceInstructions } from '../lib/practiceInstructions';
import { setupText } from '../lib/setupText';
import { useDevicePrefs, type BottomColor } from '../store/devicePrefs';
import { PracticeColorsDialog } from '../components/PracticeColorsDialog';
import {
  STATUS_LABEL,
  addTime,
  formatTime,
  primaryAlgOf,
  timeStats,
  useUserData,
} from '../store/userStore';
import { type AlgCase, type CaseSet, type LearnStatus, type SetId } from '../types';

type StatusFilter = 'all' | 'favorite' | LearnStatus;
const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'favorite', label: '收藏' },
  { id: 'none', label: STATUS_LABEL.none },
  { id: 'learning', label: STATUS_LABEL.learning },
  { id: 'mastered', label: STATUS_LABEL.mastered },
];

type PracticeSize = 2 | 3;

interface PracticeFilters {
  sets: SetId[];
  group: string;
  filter: StatusFilter;
  picked: string[];
  showPicker: boolean;
}

interface PracticeSelection {
  size: PracticeSize;
  scopes: Record<PracticeSize, PracticeFilters>;
}

interface PracticeScope extends PracticeColorPools, PracticeSelection {
  bottoms?: BottomColor[];
}

const defaultFilters = (): PracticeFilters => ({ sets: [], group: '全部', filter: 'all', picked: [], showPicker: false });

function selectRequestedSet(selection: PracticeSelection, id: SetId): PracticeSelection {
  const size = is2x2Set(id) ? 2 : 3;
  const { sets } = selection.scopes[size];
  if (sets.length === 1 && sets[0] === id) {
    return size === selection.size ? selection : { ...selection, size };
  }
  return { size, scopes: { ...selection.scopes, [size]: { ...defaultFilters(), sets: [id] } } };
}

function selectRequestedScope(selection: PracticeSelection, id: SetId | null, filter: MyCaseFilter | null, size: PracticeSize): PracticeSelection {
  if (filter) {
    return { size, scopes: { ...selection.scopes, [size]: { ...defaultFilters(), filter } } };
  }
  return id ? selectRequestedSet(selection, id) : selection;
}

const IDLE: Timer = { phase: 'ready', elapsedMs: 0, runningSince: null };
interface Question {
  c: AlgCase;
  alg: string;
  scramble: string;
  bottom?: BottomColor;
  colors?: PracticeColors;
  prepared?: PreparedSetup;
  fromSession?: boolean;
}

const PRACTICE_SETS = SETS;
const isPracticeSet = (id: string) => PRACTICE_SETS.some((s) => s.id === id);

/** done 对照主公式；训练期间保留本题采样终态。仅选择图解输入，不变更目标。 */
export function PracticeQuestionDiagram({ c, set, bottom, prepared, phase, palette }: {
  c: AlgCase; set: Pick<CaseSet, 'view'>; bottom: BottomColor;
  prepared: Pick<PreparedSetup, 'state'> | null | undefined; phase: string; palette?: Palette;
}) {
  if (set.view === 'top2' || set.view === 'both2') {
    const colors = prepared && phase !== 'done'
      ? prepared.state.map(id => palette ? palette[STICKERS2[id].face] : STICKERS2[id].face)
      : diagramColors2(c, palette);
    return <CaseDiagram2 colors={colors} view={set.view} />;
  }
  return prepared && phase !== 'done'
    ? <CaseDiagram c={c} view={set.view} bottom={bottom} state={prepared.state} palette={palette} />
    : <CaseDiagram c={c} view={set.view} bottom={bottom} palette={palette} />;
}

export function PracticePage() {
  const [searchParams] = useSearchParams();
  const { key: locationKey } = useLocation();
  const requestedSet = searchParams.get('set');
  const validRequested = requestedSet && isPracticeSet(requestedSet) ? (requestedSet as SetId) : null;
  const favorites = searchParams.get('favorites');
  const status = searchParams.get('status');
  const sizeParam = searchParams.get('size');
  const requestsFavorites = favorites === '2' || favorites === '3';
  const directFilter = requestsFavorites ? 'favorite'
    : (sizeParam === '2' || sizeParam === '3') && (status === 'mastered' || status === 'learning') ? status : null;
  const directSize = (requestsFavorites ? favorites : sizeParam) === '2' ? 2 : 3;
  const requestKey = `practice:entry:${locationKey}`;
  const user = useUserData();
  const prefs = useDevicePrefs();
  const saved = getUi<Partial<PracticeScope & PracticeFilters>>('practice:scope', {});
  const [selection, setSelection] = useState<PracticeSelection>(() => {
    const size = saved.size ?? 3;
    const scopes = saved.scopes ?? { 2: defaultFilters(), 3: defaultFilters() };
    // 兼容此前只记一个阶数的内存快照。
    if (!saved.scopes) {
      scopes[size] = {
        sets: (saved.sets ?? []).filter(id => isPracticeSet(id) && is2x2Set(id) === (size === 2)),
        group: saved.group ?? '全部', filter: saved.filter ?? 'all',
        picked: saved.picked ?? [], showPicker: saved.showPicker ?? false,
      };
    }
    const initial = { size, scopes };
    return getUi(requestKey, false) ? initial : selectRequestedScope(initial, validRequested, directFilter, directSize);
  });
  // 公式组和「我的」直达只应用一次。详情返回时沿用之后的手动选择。
  useLayoutEffect(() => {
    if ((!validRequested && !directFilter) || getUi(requestKey, false)) return;
    setUi(requestKey, true);
    setSelection(current => selectRequestedScope(current, validRequested, directFilter, directSize));
  }, [requestKey, validRequested, directFilter, directSize]);
  const { size, scopes } = selection;
  const { sets, group, filter, picked, showPicker } = scopes[size];
  const [colorPools, setColorPools] = useState(() => initializeColorPools(saved, prefs));
  const { cfopBottoms, rouxBottoms, rouxPairsByBottom, twoByTwoBottoms } = colorPools;
  useEffect(() => {
    setUi<PracticeScope>('practice:scope', { size, scopes, cfopBottoms, rouxBottoms, rouxPairsByBottom, twoByTwoBottoms });
  }, [size, scopes, cfopBottoms, rouxBottoms, rouxPairsByBottom, twoByTwoBottoms]);
  // 有未过期的会话就直接进练习，不先闪设置页。读取时只会清掉无效会话，重复调用是安全的。
  // 同一文档里切路由回来的 running 会话仍在走；重载或冷启动回来的是 paused（见 practiceSession）
  const [restored, setRestored] = useState<PracticeSession | null>(() =>
    (() => {
      const session = loadSession(Date.now(), id => !!getCase(id), DOC_ID);
      if (!session) return null;
      if (!compatiblePracticeSession(session)) { clearSession(); return null; }
      return session;
    })(),
  );
  const [practicing, setPracticing] = useState(restored !== null);

  const availableSets = PRACTICE_SETS.filter(s => (s.method === '2x2') === (size === 2));
  const activeSets = availableSets.filter((s) => sets.length === 0 || sets.includes(s.id));
  const groups = [...new Set(activeSets.flatMap((s) => s.cases.map((c) => c.group)))];
  const candidates = activeSets.flatMap((s) => s.cases);

  const pool = useMemo(() => {
    if (picked.length) return candidates.filter((c) => picked.includes(c.id));
    return candidates.filter((c) => {
      if (group !== '全部' && c.group !== group) return false;
      if (filter === 'all') return true;
      return matchesMyCase(c, user, filter);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, sets, group, filter, picked, user]);

  const updateScope = (update: (scope: PracticeFilters) => Partial<PracticeFilters>) => {
    setSelection(current => {
      const scope = current.scopes[size];
      return { ...current, scopes: { ...current.scopes, [size]: { ...scope, ...update(scope) } } };
    });
  };
  const toggleSet = (id: SetId) => updateScope(scope => ({
    sets: scope.sets.includes(id) ? scope.sets.filter(set => set !== id) : [...scope.sets, id],
    group: '全部', picked: [],
  }));
  const togglePick = (id: string) => updateScope(scope => ({
    picked: scope.picked.includes(id) ? scope.picked.filter(caseId => caseId !== id) : [...scope.picked, id],
  }));

  if (practicing) {
    const sessionPool = restored ? restored.poolIds.map((id) => getCase(id)!) : pool;
    return (
      <Session
        pool={sessionPool}
        colorPools={colorPools}
        restore={restored}
        onExit={() => {
          setRestored(null);
          setPracticing(false);
        }}
      />
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">练习</h1>
      <div className="practice-settings-head">
        <div className="segmented practice-size" role="group" aria-label="魔方阶数">
          {([3, 2] as const).map(n => <button type="button" key={n} className={size === n ? 'seg-on' : ''} aria-pressed={size === n}
            onClick={() => setSelection(current => current.size === n ? current : { ...current, size: n })}>
            {n === 2 ? '二阶' : '三阶'}
          </button>)}
        </div>
        <PracticeColorsDialog key={size} size={size} colorPools={colorPools} onChange={setColorPools} />
      </div>

      <h2>公式组</h2>
      <div className="chips" role="group" aria-label="选择公式组">
        {availableSets.map((s) => (
          <button key={s.id} className={`chip ${sets.includes(s.id) ? 'chip-on' : ''}`} aria-pressed={sets.includes(s.id)} onClick={() => toggleSet(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      <p className="muted small">不选就是当前阶数的全部公式组</p>

      <div className={picked.length ? 'scope-off' : ''}>
        {/* 分组只有在单个公式组里才有意义，多个组混在一起时标签太多 */}
        {sets.length === 1 && groups.length > 1 && (
          <>
            <h2>分组</h2>
            <div className="chips wrap" role="group" aria-label="按分组筛选">
              {['全部', ...groups].map((g) => (
                <button key={g} className={`chip ${group === g ? 'chip-on' : ''}`} aria-pressed={group === g} onClick={() => updateScope(() => ({ group: g }))}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}
        <h2>学习状态</h2>
        <div className="chips" role="group" aria-label="按学习状态筛选">
          {FILTERS.map((f) => (
            <button key={f.id} className={`chip ${filter === f.id ? 'chip-on' : ''}`} aria-pressed={filter === f.id} onClick={() => updateScope(() => ({ filter: f.id }))}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <h2>
        只练选中的情形 {picked.length > 0 && <span className="muted small">已选 {picked.length}，会忽略上面的筛选</span>}
      </h2>
      <div className="button-row">
        <button className="btn" aria-expanded={showPicker} onClick={() => updateScope(scope => ({ showPicker: !scope.showPicker }))}>
          {showPicker ? '收起列表' : '选择情形'}
        </button>
        {picked.length > 0 && (
          <button className="btn" onClick={() => updateScope(() => ({ picked: [] }))}>
            清空选择
          </button>
        )}
      </div>
      {showPicker && (
        <div className="chips wrap" role="group" aria-label="选择情形">
          {candidates.map((c) => (
            <button key={c.id} className={`chip ${picked.includes(c.id) ? 'chip-on' : ''}`} aria-pressed={picked.includes(c.id)} onClick={() => togglePick(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="practice-start">
        <p className="muted">范围内共 {pool.length} 个情形。优先出“学习中”和用时最慢的。</p>
        <button className="btn btn-big" disabled={pool.length === 0} onClick={() => setPracticing(true)}>
          开始练习
        </button>
      </div>
    </div>
  );
}

function Session({
  pool: initialPool,
  colorPools: initialColorPools,
  restore,
  onExit,
}: {
  pool: AlgCase[];
  colorPools: PracticeColorPools;
  restore: PracticeSession | null;
  onExit: () => void;
}) {
  // 练习中记录用时会让用户数据变化，范围要在开始时固定，否则会中途换题
  const [pool] = useState(initialPool);
  const [colorPools] = useState(() => snapshotPools(initialColorPools));
  const user = useUserData();
  const prefs = useDevicePrefs();
  const userRef = useRef(user);
  userRef.current = user;
  const [requested, setQuestion] = useState<Question | null>(() => {
    const base = restore && getCase(restore.question.id);
    if (!restore || !base) return null;
    // Keep the stored string and timer, including legacy sessions with unknown original bottom.
    const { alg, prepared } = restore.question;
    if (alg === base.algs[0]) return { c: base, alg, scramble: restore.question.scramble, prepared, fromSession: true };
    const { view } = practiceViewFor(base, alg);
    const scramble = prepared?.scramble ?? restore.question.scramble;
    return { c: view, alg, scramble: view === base ? restore.question.scramble : scramble, prepared, fromSession: true };
  });
  const [question, setReadyQuestion] = useState<Question | null>(requested);
  const [preparationError, setPreparationError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!requested || requested.fromSession) return;
    const controller = new AbortController();
    setReadyQuestion(null);
    setPreparationError('');
    // Complete colors were frozen when this request was drawn; store updates never recolor it.
    const colors = requested.colors;
    if (!colors) { setPreparationError('题目缺少配色快照'); return; }
    try {
      const sample = is2x2Set(requested.c.set)
        ? { state: sampleTarget2(requested.c), auf: '', variation: 0 }
        : sampleTarget(requested.c, requested.scramble);
      void prepareSetup(sample.state, colors, controller.signal).then((prepared) => {
        if (!controller.signal.aborted) {
          const alg = requested.c.set === 'eolr' && sample.auf
            ? `${movesToString(invertMoves(parseAlg(sample.auf)))} ${requested.alg}` : requested.alg;
          setReadyQuestion({ ...requested, alg, scramble: prepared.scramble, prepared });
        }
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setPreparationError(error instanceof Error ? error.message : '准备失败');
      });
    } catch (error) {
      setPreparationError(error instanceof Error ? error.message : '准备失败');
    }
    return () => controller.abort();
    // Only a new request or explicit retry generates a target, not palette/store subscriptions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested, attempt]);
  // 同一文档恢复的 running 会话继续走（用时包含离开的时间）；重载或冷启动恢复的是 paused，点屏幕才继续
  const [timer, setTimer] = useState<Timer>(
    restore ? { phase: restore.phase, elapsedMs: restore.elapsedMs, runningSince: restore.runningSince } : IDLE,
  );
  const [now, setNow] = useState(() => Date.now());
  const [count, setCount] = useState(restore?.count ?? 0);
  // 同一文档里恢复 running 是无感的，不提示；其他情况（暂停、已停表）才提示“已恢复”
  const [banner, setBanner] = useState(restore !== null && restore.phase !== 'running');
  const phase = timer.phase;
  const lastId = useRef<string | null>(restore?.question.id ?? null);
  const lastColors = useRef<PracticeColors | null>(restore?.question.prepared && restore.question.prepared.version !== 1 ? restore.question.prepared.colors : null);
  const [pressing, setPressing] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);
  const heldPointer = useRef<{ id: number; phase: Timer['phase']; pad: HTMLDivElement; armed: boolean } | null>(null);
  const heldSpace = useRef<SpaceHold | null>(null);
  const clearPress = useCallback(() => {
    const held = heldPointer.current;
    heldPointer.current = null;
    heldSpace.current = null;
    setPressing(false);
    if (held?.pad.hasPointerCapture(held.id)) held.pad.releasePointerCapture(held.id);
  }, []);
  // A hold is transient UI state, never part of the persisted timer/session.
  useEffect(() => {
    const detach = watchPressCancellation(window, document, clearPress, () => document.visibilityState === 'hidden');
    return () => {
      detach();
      const held = heldPointer.current;
      heldPointer.current = null;
      heldSpace.current = null;
      if (held?.pad.hasPointerCapture(held.id)) held.pad.releasePointerCapture(held.id);
    };
  }, [clearPress]);
  useEffect(() => {
    // Disarm on phase changes, but retain physical ownership until release so inputs cannot cross-start.
    heldSpace.current = invalidateSpace(heldSpace.current);
    if (heldPointer.current) heldPointer.current.armed = false;
    setPressing(false);
  }, [phase]);
  const endedRef = useRef(false);

  const next = useCallback(() => {
    const c = pickCase(pool, userRef.current, lastId.current);
    if (!c) return;
    lastId.current = c.id;
    const alg = primaryAlgOf(c, userRef.current);
    const colors = pickPracticeColors(c, colorPools, lastColors.current);
    lastColors.current = colors;
    const { view, scramble } = practiceViewFor(c, alg);
    setReadyQuestion(null);
    setQuestion({ c: view, alg, scramble, colors });
    setTimer(IDLE);
  }, [pool, colorPools]);

  useEffect(() => {
    if (!restore) next();
  }, [next, restore]);

  // 计时用 Date.now()：后台时 rAF 会暂停，所以离开前一律先冻结（见下面的 leave）
  useEffect(() => {
    if (phase !== 'running') return;
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);
  const elapsed = elapsedOf(timer, now);

  // 持久化：状态变化时存一份；切后台、pagehide、卸载时各存一次。
  // 这些时机都只保存当前快照，不改计时状态：计时不会因为离开页面而停。
  // 计时中的 4 秒心跳在 practiceSession 里（模块级），离开练习页之后也继续。
  const live = useRef({ question, timer, count });
  live.current = { question, timer, count };
  const poolIds = useMemo(() => pool.map((c) => c.id), [pool]);
  const persist = useCallback(
    (t: Timer) => {
      const { question: q, count: n } = live.current;
      if (endedRef.current || !q) return;
      saveSession({
        poolIds,
        question: { id: q.c.id, alg: q.alg, scramble: q.scramble, ...(q.prepared ? { prepared: q.prepared } : {}) },
        count: n,
        ...t,
        savedAt: Date.now(),
        docId: DOC_ID,
      });
    },
    [poolIds],
  );
  useEffect(() => {
    persist(timer);
  }, [question, timer, count, persist]);
  useEffect(() => {
    const leave = () => persist(live.current.timer);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') leave();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', leave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', leave);
      // 卸载（点“查看详情”、切 tab、系统返回）也存一次当前快照
      if (!endedRef.current) persist(live.current.timer);
    };
  }, [persist]);

  // 屏幕常亮：只在正在计时且页面可见时申请；暂停、停止、隐藏、退出都释放。不支持就静默降级
  const wakeLock = useRef<ScreenWakeLock | null>(null);
  if (!wakeLock.current) wakeLock.current = createWakeLock();
  useEffect(() => {
    const lock = wakeLock.current!;
    const sync = () => {
      if (phase === 'running' && document.visibilityState === 'visible') void lock.acquire();
      else void lock.release();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      void lock.release();
    };
  }, [phase]);

  /** 结束或放弃：清掉保存的会话，之后不再保存 */
  const finish = () => {
    endedRef.current = true;
    clearSession();
    onExit();
  };

  const retryQuestion = () => {
    setBanner(false);
    setTimer(IDLE);
    padRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  };

  const advance = useCallback(() => {
    if (!question) return;
    const t = Date.now();
    setBanner(false);
    if (timer.phase === 'ready') {
      setNow(t);
      setTimer(startTimer(timer, t));
    } else if (timer.phase === 'paused') {
      setNow(t);
      setTimer(resumeTimer(timer, t));
    } else if (timer.phase === 'running') {
      const done = stopTimer(timer, t);
      setTimer(done);
      addTime(question.c.id, Math.round(done.elapsedMs));
      setCount((n) => n + 1);
    } else {
      next();
    }
  }, [timer, question, next]);

  useEffect(() => {
    const isSpace = (e: KeyboardEvent) => e.code === 'Space' || e.key === ' ';
    const context = (e: KeyboardEvent) => ({
      phase,
      blocked: !!(e.target as Element | null)?.closest?.('a,button,.practice-recognition'),
      pointerHeld: heldPointer.current !== null,
      enabled: question !== null && document.visibilityState === 'visible',
      repeat: e.repeat,
    });
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isSpace(e)) return;
      const result = spaceDown(heldSpace.current, context(e));
      if (!result.handled) return;
      e.preventDefault();
      heldSpace.current = result.hold;
      setPressing(!!result.hold?.armed);
      if (result.advance) advance();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isSpace(e) || !heldSpace.current) return;
      const result = spaceUp(heldSpace.current, context(e));
      heldSpace.current = result.hold;
      setPressing(false);
      if (result.handled) e.preventDefault();
      if (result.advance) advance();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [advance, phase, question]);

  if (!question) return (
    <div className="practice">
      <button className="back" onClick={finish}>‹ 结束</button>
      <p role={preparationError ? 'alert' : 'status'}>{preparationError ? '准备失败：' + preparationError : '正在准备训练打乱…'}</p>
      {preparationError && <button className="btn" onClick={() => setAttempt((n) => n + 1)}>重试</button>}
    </div>
  );
  const { c, alg, scramble, prepared } = question;
  const colors = prepared && prepared.version !== 1 ? prepared.colors : question.colors;
  const palette = colors ? paletteFor(colors) : undefined;
  const bottom = prepared?.version === 1 ? prepared.bottom : colors ? colorBottom(colors) : question.bottom ?? prefs.bottomColor;
  const set = getSet(c.set)!;
  const stats = timeStats(c.id, user);
  const hint =
    phase === 'ready'
      ? '按住后松手或按空格开始'
      : phase === 'running'
        ? '点屏幕或按空格停止'
        : phase === 'paused'
          ? '已暂停，松手或按空格继续'
          : '松手或按空格下一题';
  const padHint = pressing ? (phase === 'done' ? '松开下一题' : '松开开始') : hint;

  return (
    <div className="practice" data-phase={phase} data-size={is2x2Set(c.set) ? 2 : 3}>
      <div className="practice-bar">
        <button className="back" onClick={finish}>
          ‹ 结束
        </button>
        <span className="muted small">{is2x2Set(c.set) ? '二阶' : '三阶'} · 本次 {count} 题</span>
      </div>
      {banner && (
        <div className="practice-bar" role="status">
          <span className="muted small">已恢复上次练习</span>
          <button className="link-btn danger" onClick={finish}>
            放弃
          </button>
        </div>
      )}
      <div
        className="practice-pad"
        ref={padRef}
        role="button"
        tabIndex={0}
        aria-label={padHint}
        data-pressing={pressing}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (e.button !== 0 || !e.isPrimary || heldPointer.current || heldSpace.current) return;
          if ((e.target as Element).closest('a,button,.practice-recognition')) return;
          heldPointer.current = { id: e.pointerId, phase, pad: e.currentTarget, armed: phase !== 'running' };
          e.currentTarget.setPointerCapture(e.pointerId);
          if (phase === 'running') {
            // Keep ownership, without arming: this stop's pointerup must do nothing.
            advance();
            return;
          }
          setPressing(true);
        }}
        onPointerUp={(e) => {
          const held = heldPointer.current;
          if (!held || held.id !== e.pointerId) return;
          clearPress();
          if (held.armed && e.button === 0 && e.isPrimary && phase === held.phase && document.visibilityState === 'visible') advance();
        }}
        onPointerCancel={(e) => {
          if (heldPointer.current?.id === e.pointerId) clearPress();
        }}
        onLostPointerCapture={(e) => {
          if (heldPointer.current?.id === e.pointerId) clearPress();
        }}
        onKeyDown={(e) => {
          // 空格由全局监听处理，这里只处理回车；按住不放不连续触发
          if (e.key === 'Enter' && !e.repeat && e.target === e.currentTarget && !heldPointer.current && !heldSpace.current) advance();
        }}
      >
        <div className="practice-case">
          <PracticeQuestionDiagram c={c} set={set} bottom={bottom} prepared={prepared} phase={phase} palette={palette} />
          <div>
            <strong>{phase === 'ready' ? set.name : c.name}</strong>
            <p className="muted small">{set.name} · {c.group}{c.set === 'eolr' && <> · {c.targetTier === 'tier1' ? '化归中间态' : c.targetTier === 'tier2' ? '底层双槽' : 'LR 与顶角归位'}</>}</p>
          </div>
        </div>
        <p className="practice-scramble">
          {!prepared && <span className="muted small">旧版会话：原底色未知，以下是旧版参考说明与图解；保留原题及计时，新题使用求解器。</span>}
          <span className="muted small">摆出情形（setup）</span>
          <code className="alg">{scramble || '（已还原）'}</code>
          <span className="muted small">{prepared
            ? practiceInstructions(prepared)
            : setupText(bottom)}</span>
          {!is2x2Set(c.set) && <span className="muted small">{prepared ? '训练打乱由目标状态求解生成；图解显示本题实际终态，不是 WCA 随机打乱。' : '定点练习的 setup 是这条公式的逆，用来精确摆出情形；WCA 4b3 的随机打乱用于比赛，不能瞄准某个情形。'}</span>}
        </p>
        <div className="practice-time" aria-live="off">
          {formatTime(elapsed)}
        </div>
        {phase === 'done' && (
          <div className="practice-result">
            <p>
              <span className="muted small">公式</span>
              <code className="alg">{alg}</code>
            </p>
            {stats && (
              <p className="muted small">
                最近 {stats.count} 次：平均 {formatTime(stats.avg)} 秒 · 最快 {formatTime(stats.best)} 秒
              </p>
            )}
            {prepared?.version === 3 && palette && (
              <details className="practice-recognition">
                <summary>识别提示</summary>
                <Recognition2 c={c} palette={palette} showHeading={false} />
              </details>
            )}
            <div className="practice-result-actions">
              <button type="button" className="link-btn" onClick={retryQuestion}>再练这题</button>
              <Link className="link-btn" to={`/case/${c.id}`}>
                查看详情
              </Link>
            </div>
          </div>
        )}
        <p className="muted practice-hint">{padHint}</p>
      </div>
    </div>
  );
}

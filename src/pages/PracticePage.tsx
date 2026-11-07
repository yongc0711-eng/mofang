import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaseDiagram } from '../components/CaseDiagram';
import { SETS, getCase, getSet } from '../data';
import { getUi, setUi } from '../lib/uiState';
import { pickCase, scrambleFor } from '../lib/practice';
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
import {
  STATUS_LABEL,
  addTime,
  formatTime,
  primaryAlgOf,
  statusOf,
  timeStats,
  useUserData,
} from '../store/userStore';
import { type AlgCase, type LearnStatus, type SetId } from '../types';

type StatusFilter = 'all' | 'favorite' | LearnStatus;
const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'favorite', label: '收藏' },
  { id: 'none', label: STATUS_LABEL.none },
  { id: 'learning', label: STATUS_LABEL.learning },
  { id: 'mastered', label: STATUS_LABEL.mastered },
];

interface PracticeScope {
  sets: SetId[];
  group: string;
  filter: StatusFilter;
  picked: string[];
  showPicker: boolean;
}

const IDLE: Timer = { phase: 'ready', elapsedMs: 0, runningSince: null };
interface Question {
  c: AlgCase;
  alg: string;
  scramble: string;
}

export function PracticePage() {
  const user = useUserData();
  // 范围和筛选放在内存里，从“查看详情”返回时还在
  const saved = getUi<PracticeScope>('practice:scope', { sets: [], group: '全部', filter: 'all', picked: [], showPicker: false });
  const [sets, setSets] = useState<SetId[]>(saved.sets);
  const [group, setGroup] = useState(saved.group);
  const [filter, setFilter] = useState<StatusFilter>(saved.filter);
  const [picked, setPicked] = useState<string[]>(saved.picked);
  const [showPicker, setShowPicker] = useState(saved.showPicker);
  useEffect(() => {
    setUi<PracticeScope>('practice:scope', { sets, group, filter, picked, showPicker });
  }, [sets, group, filter, picked, showPicker]);
  // 有未过期的会话就直接进练习，不先闪设置页。读取时只会清掉无效会话，重复调用是安全的。
  // 同一文档里切路由回来的 running 会话仍在走；重载或冷启动回来的是 paused（见 practiceSession）
  const [restored, setRestored] = useState<PracticeSession | null>(() =>
    loadSession(Date.now(), (id) => !!getCase(id), DOC_ID),
  );
  const [practicing, setPracticing] = useState(restored !== null);

  const activeSets = SETS.filter((s) => sets.length === 0 || sets.includes(s.id));
  const groups = [...new Set(activeSets.flatMap((s) => s.cases.map((c) => c.group)))];
  const candidates = activeSets.flatMap((s) => s.cases);

  const pool = useMemo(() => {
    if (picked.length) return candidates.filter((c) => picked.includes(c.id));
    return candidates.filter((c) => {
      if (group !== '全部' && c.group !== group) return false;
      if (filter === 'all') return true;
      if (filter === 'favorite') return !!user.cases[c.id]?.favorite;
      return statusOf(c, user) === filter;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, group, filter, picked, user]);

  const toggleSet = (id: SetId) => {
    setSets((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    setGroup('全部');
    setPicked([]);
  };
  const togglePick = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  if (practicing) {
    const sessionPool = restored ? restored.poolIds.map((id) => getCase(id)!) : pool;
    return (
      <Session
        pool={sessionPool}
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

      <h2>公式组</h2>
      <div className="chips" role="group" aria-label="选择公式组">
        {SETS.map((s) => (
          <button key={s.id} className={`chip ${sets.includes(s.id) ? 'chip-on' : ''}`} aria-pressed={sets.includes(s.id)} onClick={() => toggleSet(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
      <p className="muted small">不选就是全部公式组</p>

      <div className={picked.length ? 'scope-off' : ''}>
        {/* 分组只有在单个公式组里才有意义，多个组混在一起时标签太多 */}
        {sets.length === 1 && groups.length > 1 && (
          <>
            <h2>分组</h2>
            <div className="chips wrap" role="group" aria-label="按分组筛选">
              {['全部', ...groups].map((g) => (
                <button key={g} className={`chip ${group === g ? 'chip-on' : ''}`} onClick={() => setGroup(g)}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}
        <h2>学习状态</h2>
        <div className="chips" role="group" aria-label="按学习状态筛选">
          {FILTERS.map((f) => (
            <button key={f.id} className={`chip ${filter === f.id ? 'chip-on' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <h2>
        只练选中的情形 {picked.length > 0 && <span className="muted small">已选 {picked.length}，会忽略上面的筛选</span>}
      </h2>
      <div className="button-row">
        <button className="btn" onClick={() => setShowPicker((v) => !v)}>
          {showPicker ? '收起列表' : '选择情形'}
        </button>
        {picked.length > 0 && (
          <button className="btn" onClick={() => setPicked([])}>
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
  restore,
  onExit,
}: {
  pool: AlgCase[];
  restore: PracticeSession | null;
  onExit: () => void;
}) {
  // 练习中记录用时会让用户数据变化，范围要在开始时固定，否则会中途换题
  const [pool] = useState(initialPool);
  const user = useUserData();
  const userRef = useRef(user);
  userRef.current = user;
  const [question, setQuestion] = useState<Question | null>(() => {
    const c = restore && getCase(restore.question.id);
    return restore && c ? { c, alg: restore.question.alg, scramble: restore.question.scramble } : null;
  });
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
  const skipClick = useRef(false);
  const endedRef = useRef(false);

  const next = useCallback(() => {
    const c = pickCase(pool, userRef.current, lastId.current);
    if (!c) return;
    lastId.current = c.id;
    const alg = primaryAlgOf(c, userRef.current);
    setQuestion({ c, alg, scramble: scrambleFor(c) });
    setTimer(IDLE);
  }, [pool]);

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

  // 持久化：状态变化时存一份；计时中每 4 秒刷新一次 savedAt；切后台、pagehide、卸载时各存一次。
  // 这些时机都只保存当前快照，不改计时状态：计时不会因为离开页面而停。
  const live = useRef({ question, timer, count });
  live.current = { question, timer, count };
  const poolIds = useMemo(() => pool.map((c) => c.id), [pool]);
  const persist = useCallback(
    (t: Timer) => {
      const { question: q, count: n } = live.current;
      if (endedRef.current || !q) return;
      saveSession({
        poolIds,
        question: { id: q.c.id, alg: q.alg, scramble: q.scramble },
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
    if (phase !== 'running') return;
    // 只更新 savedAt，runningSince 不变；进程被杀后冷启动按最后一次保存的时刻冻结
    const id = window.setInterval(() => persist(live.current.timer), 4000);
    return () => window.clearInterval(id);
  }, [phase, persist]);
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
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        // 焦点在按钮或链接上时，空格留给它们自己
        if ((e.target as Element | null)?.closest?.('a,button')) return;
        e.preventDefault();
        if (!e.repeat) advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  if (!question) return null;
  const { c, alg, scramble } = question;
  const set = getSet(c.set)!;
  const stats = timeStats(c.id, user);
  const hint =
    phase === 'ready'
      ? '点屏幕或按空格开始计时'
      : phase === 'running'
        ? '点屏幕或按空格停止'
        : phase === 'paused'
          ? '已暂停，点屏幕或按空格继续'
          : '点屏幕或按空格下一题';

  return (
    <div className="practice" data-phase={phase}>
      <div className="practice-bar">
        <button className="back" onClick={finish}>
          ‹ 结束
        </button>
        <span className="muted small">本次 {count} 题</span>
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
        role="button"
        tabIndex={0}
        aria-label={hint}
        // 停表要按下就响应（pointerdown）；开始和下一题用 click，滑动屏幕不会误触
        onPointerDown={(e) => {
          skipClick.current = false;
          if (phase !== 'running' || e.button !== 0 || !e.isPrimary) return;
          if ((e.target as Element).closest('a,button')) return;
          skipClick.current = true; // 同一次触摸随后的 click 不再前进
          advance();
        }}
        onClick={(e) => {
          if (skipClick.current) {
            skipClick.current = false;
            return;
          }
          if ((e.target as Element).closest('a,button')) return;
          advance();
        }}
        onKeyDown={(e) => {
          // 空格由全局监听处理，这里只处理回车；按住不放不连续触发
          if (e.key === 'Enter' && !e.repeat && e.target === e.currentTarget) advance();
        }}
      >
        <div className="practice-case">
          <CaseDiagram c={c} view={set.view} />
          <div>
            <strong>{phase === 'ready' ? set.name : c.name}</strong>
            <p className="muted small">{set.name} · {c.group}</p>
          </div>
        </div>
        <p className="practice-scramble">
          <span className="muted small">打乱</span>
          <code className="alg">{scramble || '（已还原）'}</code>
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
            <Link className="link-btn" to={`/case/${c.id}`}>
              查看详情
            </Link>
          </div>
        )}
        <p className="muted practice-hint">{hint}</p>
      </div>
    </div>
  );
}

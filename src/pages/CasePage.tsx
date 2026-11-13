import { displayAlg } from '../lib/algDisplay';
import { browsePalette, FACE_COLOR } from '../lib/colorScheme';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { diagramMask, playerMask, setDevicePrefs, useDevicePrefs } from '../store/devicePrefs';
import { recognitionFor } from '../lib/recognition';
import { setUi } from '../lib/uiState';
import { readCaseSelection, rememberCaseSelection } from '../lib/caseSelection';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlgKeyboard } from '../components/AlgKeyboard';
import { editAlgDraft } from '../lib/algKeyboard';
import { CaseDiagram } from '../components/CaseDiagram';
import { CaseDiagram2 } from '../components/CaseDiagram2';
import { CubePlayer } from '../components/CubePlayer';
import { getCase, getSet } from '../data';
import { moveCount, parseAlg } from '../lib/alg';
import { algSolvesCase, lintCaseAlg, viewCaseFor } from '../lib/cases';
import { algSolvesCase2, diagramColors2, is2x2Set, lintCaseAlg2, viewCaseFor2 } from '../lib/cases2';
import {
  STATUS_LABEL,
  addCustomAlg,
  clearTimes,
  formatTime,
  primaryAlgOf,
  timeStats,
  removeCustomAlg,
  setPrimaryAlg,
  setStatus,
  statusOf,
  toggleFavorite,
  useUserData,
} from '../store/userStore';
import { type LearnStatus } from '../types';

const STATUSES: LearnStatus[] = ['none', 'learning', 'mastered'];

export function CasePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const c = getCase(caseId ?? '');
  const user = useUserData();
  const [, refreshSelection] = useState(0);
  const selected = c ? readCaseSelection(c, user.cases[c.id]?.customAlgs ?? []) : null;
  const setSelected = (alg: string | null) => {
    if (!c) return;
    rememberCaseSelection(c.id, alg);
    refreshSelection((version) => version + 1);
  };
  const prefs = useDevicePrefs();
  const palette = useMemo(() => browsePalette(c ?? { set: '' }, prefs), [c, prefs]);
  const caseSet = c?.set;
  const caseGroup = c?.group;
  const is2x2 = !!caseSet && is2x2Set(caseSet);
  // 2D 和 3D 的掩码分开算：2D 里 OLL 固定只显示顶层的 9 张，其他组看“只看相关的块”；
  // 3D 所有组一样，默认完整魔方，开了“只看相关的块”才只显示相关的块
  const maskFor2D = useMemo(
    () => (!is2x2 && caseSet && caseGroup !== undefined ? diagramMask({ set: caseSet, group: caseGroup }, { focusRelevant: prefs.focusRelevant }) : null),
    [is2x2, prefs.focusRelevant, caseSet, caseGroup],
  );
  const maskFor3D = useMemo(
    () => (!is2x2 && caseSet && caseGroup !== undefined ? playerMask({ set: caseSet, group: caseGroup }, { focusRelevant: prefs.focusRelevant }) : null),
    [is2x2, prefs.focusRelevant, caseSet, caseGroup],
  );
  const [draft, setDraft] = useState('');
  const [keyboardOpen, setKeyboardOpenState] = useState(false);
  const [keyboardEntry, setKeyboardEntry] = useState(0);
  const keyboardOpenRef = useRef(false);
  const setKeyboardOpen = (value: boolean | ((open: boolean) => boolean)) => {
    const open = typeof value === 'function' ? value(keyboardOpenRef.current) : value;
    if (open && !keyboardOpenRef.current) setKeyboardEntry((entry) => entry + 1);
    keyboardOpenRef.current = open;
    setKeyboardOpenState(open);
  };
  const keyboardId = useId();
  const keyboardRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!keyboardOpen) return;
    const frame = requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      keyboardRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [keyboardOpen]);
  // 记住上次看的详情页，底部“公式”tab 从别的 tab 回来时用（T51）；只存内存
  const validId = c?.id;
  useEffect(() => {
    if (validId) setUi('lastCaseId', validId);
  }, [validId]);
  const [message, setMessage] = useState<{ kind: 'error' | 'warn'; text: string } | null>(null);
  const [continuationFor, setContinuationFor] = useState<string | null>(null);

  const primary = c ? primaryAlgOf(c, user) : '';
  const playing = selected ?? primary;
  const includeContinuation = continuationFor === c?.id && playing === c?.algs[0];
  const playbackAlg = includeContinuation ? [playing, c?.continuationAlg].filter(Boolean).join(' ') : playing;
  // 图解的起手要和 3D 播放器一致：播放器从 playing 的逆开始，所以图解也用 playing 推导。
  // 解决不了该情形（自定义的错公式）或判断出错时回退到 c，不显示错起手（见 viewCaseFor）
  const viewCase = useMemo(
    () => (!c ? c : is2x2Set(c.set) ? viewCaseFor2(c, playing) : viewCaseFor(c, playing)),
    [c, playing],
  );

  if (!c || !viewCase) {
    return (
      <div className="page">
        <p className="empty">
          找不到这个公式，<Link to="/">回首页</Link>
        </p>
      </div>
    );
  }

  const set = getSet(c.set)!;
  const custom = user.cases[c.id]?.customAlgs ?? [];
  const status = statusOf(c, user);
  const favorite = !!user.cases[c.id]?.favorite;
  const stats = timeStats(c.id, user);

  const save = (force: boolean) => {
    const alg = draft.trim();
    if (!alg) return;
    let solves: boolean;
    try {
      if (is2x2Set(c.set)) {
        const problem = lintCaseAlg2(alg);
        if (problem) {
          setMessage({ kind: 'error', text: problem });
          return;
        }
        solves = parseAlg(alg).length > 0 && algSolvesCase2(c, alg);
      } else {
        const problems = lintCaseAlg(c, alg);
        if (problems.length) {
          setMessage({ kind: 'error', text: problems.join('；') });
          return;
        }
        solves = parseAlg(alg).length > 0 && algSolvesCase(c, alg);
      }
    } catch (e) {
      setMessage({ kind: 'error', text: `公式格式有误：${(e as Error).message}` });
      return;
    }
    if (!solves && !force) {
      setMessage({ kind: 'warn', text: '这条公式解决不了这个情形，可能输错了。确定要保存吗？' });
      return;
    }
    // 解决不了情形的公式只保存，不成为主公式
    addCustomAlg(c.id, alg, solves);
    setSelected(alg);
    setDraft('');
    setMessage(null);
  };

  const customSolves = (alg: string) => {
    try {
      return is2x2Set(c.set) ? algSolvesCase2(c, alg) : algSolvesCase(c, alg);
    } catch {
      return false;
    }
  };

  const row = (alg: string, isCustom: boolean) => (
    <li key={alg} className={`alg-row ${alg === playing ? 'alg-row-on' : ''}`}>
      <button
        className="alg-play"
        onClick={() => setSelected(alg)}
        aria-label={`查看这条公式的起手 ${alg}`}
      >
        <code className="alg">{displayAlg(c.id, alg)}</code>
        <span className="muted small">
          {moveCount(alg)} 步{isCustom && ' · 我的公式'}
        </span>
      </button>
      <div className="alg-actions">
        {alg === primary ? (
          <span className="tag">主公式</span>
        ) : isCustom && !customSolves(alg) ? (
          <span className="muted small">解决不了此情形</span>
        ) : (
          <button className="link-btn" onClick={() => setPrimaryAlg(c.id, alg)}>
            设为主公式
          </button>
        )}
        {isCustom && (
          <button
            className="link-btn danger"
            onClick={() => {
              removeCustomAlg(c.id, alg);
              if (selected === alg) setSelected(null);
            }}
          >
            删除
          </button>
        )}
      </div>
    </li>
  );

  return (
    <div className="page case-page">
      <button className="back" onClick={() => navigate(-1)}>
        ‹ 返回
      </button>
      <header className="case-head">
        {set.view === 'top2' || set.view === 'both2'
          ? <CaseDiagram2 colors={diagramColors2(viewCase)} view={set.view} />
          : <CaseDiagram c={viewCase} view={set.view} mask={maskFor2D} palette={palette} />}
        <div className="case-identity">
          <div className="case-title-row" data-long-name={c.set === 'eolr' || c.name.length > 12}>
            <h1 className="page-title">{c.name}</h1>
            <button
              className={`fav-btn ${favorite ? 'fav-on' : ''}`}
              aria-pressed={favorite}
              onClick={() => toggleFavorite(c.id)}
            >
              {favorite ? '★ 已收藏' : '☆ 收藏'}
            </button>
          </div>
          <p className="muted">
            {set.name} · {c.group}
          </p>
        </div>
        <div className="case-status">
          <h2 className="case-status-title">学习状态</h2>
          <div className="segmented status-seg" role="group" aria-label="学习状态">
            <span className="seg-thumb" aria-hidden="true" style={{ transform: `translateX(${STATUSES.indexOf(status) * 100}%)` }} />
            {STATUSES.map((s) => (
              <button key={s} className={status === s ? 'seg-on' : ''} aria-pressed={status === s} onClick={() => setStatus(c.id, s)}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="case-layout">
        <div className="case-player">
          {set.method === '2x2'
            ? <CubePlayer alg={playing} autoPlay={false} finish={prefs.finish} size={2} />
            : c.setup !== undefined
              ? <CubePlayer alg={playbackAlg} setup={c.setup} autoPlay={false} mask={maskFor3D} finish={prefs.finish} palette={palette} />
              : <CubePlayer alg={playing} autoPlay={false} mask={maskFor3D} finish={prefs.finish} palette={palette} />}
          {c.continuationAlg && <button type="button" className={`chip eolr-continuation${includeContinuation ? ' chip-on' : ''}`} aria-pressed={includeContinuation} title="接续对应内置短公式" disabled={playing !== c.algs[0]} onClick={() => setContinuationFor(includeContinuation ? null : c.id)}>接续 4b</button>}
          {!is2x2 && (
            <button
              className={`chip focus-chip ${prefs.focusRelevant ? 'chip-on' : ''}`}
              aria-pressed={prefs.focusRelevant}
              onClick={() => setDevicePrefs({ focusRelevant: !prefs.focusRelevant })}
            >
              只看相关的块
            </button>
          )}
          {/* 手机上播放器占首屏，这个提示条告诉用户下面还有内容；宽屏两栏同屏，不显示（T48） */}
          <button
            className="peek-cue"
            onClick={() => {
              const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              sideRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
            }}
          >
            <span aria-hidden="true">↓</span> {c.recognition ? '识别与公式' : '公式'}
          </button>
        </div>
        <div className="case-side" ref={sideRef}>
          {c.set === 'eolr' && <p className="recognition"><strong>{c.targetTier === 'tier1' ? '化归中间态' : c.targetTier === 'tier2' ? '标准 EOLR · 底层双槽' : '严格 EOLRb · LR 与顶角归位'}</strong>{c.continuationAlg && <> · 接续 <code>{c.continuationAlg}</code></>}<br />接续从当前情形的同一起手播放。<Link to="/set/lse">基础 LSE</Link></p>}
          {c.recognition && (
            <p className="recognition">
              <strong>识别：</strong>
              {/* OLL 的“黄”指顶面颜色，选了别的底色要跟着换；其他组原样 */}
              {recognitionFor(c, FACE_COLOR[palette.U])}
            </p>
          )}

          {stats && (
            <p className="recognition">
              <strong>练习用时：</strong>
              最近 {formatTime(stats.last)} 秒 · 平均 {formatTime(stats.avg)} 秒 · 最快 {formatTime(stats.best)} 秒（{stats.count} 次）
              <button className="link-btn" onClick={() => clearTimes(c.id)}>
                清除
              </button>
            </p>
          )}

          <h2>公式</h2>
          <ul className="alg-list">
            {c.algs.map((a) => row(a, false))}
            {custom.map((a) => row(a, true))}
          </ul>

          <h2>添加我的公式</h2>
          <form
            className="alg-form"
            onSubmit={(e) => {
              e.preventDefault();
              save(false);
            }}
          >
            <input
              value={draft}
              inputMode="none"
              onFocus={() => setKeyboardOpen(true)}
              onChange={(e) => {
                setDraft(e.target.value);
                setMessage(null);
              }}
              placeholder="例如 R U R' U'"
              aria-label="公式"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button type="submit" disabled={!draft.trim()}>
              保存
            </button>
          </form>
          <button
            className="btn alg-keyboard-toggle"
            type="button"
            aria-expanded={keyboardOpen}
            aria-controls={keyboardId}
            onClick={() => setKeyboardOpen((open) => !open)}
          >
            {keyboardOpen ? '收起公式键盘' : '公式键盘'}
          </button>
          {keyboardOpen && (
            <div key={keyboardEntry} ref={keyboardRef} className="alg-keyboard-wrap">
              <AlgKeyboard
                id={keyboardId}
                empty={draft.length === 0}
                onEdit={(edit) => {
                  setDraft((current) => editAlgDraft(current, edit));
                  setMessage(null);
                }}
              />
            </div>
          )}
          {message && (
            <p className={`form-msg form-${message.kind}`}>
              {message.text}
              {message.kind === 'warn' && (
                <button className="link-btn" onClick={() => save(true)}>
                  仍然保存
                </button>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

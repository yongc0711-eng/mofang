import { useMemo, useState } from 'react';
import { setDevicePrefs, useDevicePrefs } from '../store/devicePrefs';
import { useScrollTop } from '../lib/uiState';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CaseDiagram } from '../components/CaseDiagram';
import { CubePlayer } from '../components/CubePlayer';
import { getCase, getSet } from '../data';
import { moveCount, parseAlg } from '../lib/alg';
import { algSolvesCase, displayMask } from '../lib/cases';
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
  useScrollTop(caseId);
  const navigate = useNavigate();
  const c = getCase(caseId ?? '');
  const user = useUserData();
  const [selected, setSelected] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const prefs = useDevicePrefs();
  const caseSet = c?.set;
  const caseGroup = c?.group;
  const mask = useMemo(
    () => (prefs.focusRelevant && caseSet && caseGroup !== undefined ? displayMask({ set: caseSet, group: caseGroup }) : null),
    [prefs.focusRelevant, caseSet, caseGroup],
  );
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState<{ kind: 'error' | 'warn'; text: string } | null>(null);

  if (!c) {
    return (
      <div className="page">
        <p className="empty">
          找不到这个公式，<Link to="/">回首页</Link>
        </p>
      </div>
    );
  }

  const set = getSet(c.set)!;
  const primary = primaryAlgOf(c, user);
  const custom = user.cases[c.id]?.customAlgs ?? [];
  const playing = selected ?? primary;
  const status = statusOf(c, user);
  const favorite = !!user.cases[c.id]?.favorite;
  const stats = timeStats(c.id, user);

  const save = (force: boolean) => {
    const alg = draft.trim();
    if (!alg) return;
    let solves: boolean;
    try {
      solves = parseAlg(alg).length > 0 && algSolvesCase(c, alg);
    } catch (e) {
      setMessage({ kind: 'error', text: `公式格式有误：${(e as Error).message}` });
      return;
    }
    if (!solves && !force) {
      setMessage({ kind: 'warn', text: '这条公式解决不了这个情形，可能输错了。确定要保存吗？' });
      return;
    }
    addCustomAlg(c.id, alg);
    setSelected(alg);
    setDraft('');
    setMessage(null);
  };

  const row = (alg: string, isCustom: boolean) => (
    <li key={alg} className={`alg-row ${alg === playing ? 'alg-row-on' : ''}`}>
      <button
        className="alg-play"
        onClick={() => {
          setSelected(alg);
          setReplayKey((k) => k + 1);
        }}
        aria-label={`播放 ${alg}`}
      >
        <code className="alg">{alg}</code>
        <span className="muted small">
          {moveCount(alg)} 步{isCustom && ' · 我的公式'}
        </span>
      </button>
      <div className="alg-actions">
        {alg === primary ? (
          <span className="tag">主公式</span>
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
        <CaseDiagram c={c} view={set.view} />
        <div>
          <h1 className="page-title">{c.name}</h1>
          <p className="muted">
            {set.name} · {c.group}
          </p>
          <button
            className={`fav-btn ${favorite ? 'fav-on' : ''}`}
            aria-pressed={favorite}
            onClick={() => toggleFavorite(c.id)}
          >
            {favorite ? '★ 已收藏' : '☆ 收藏'}
          </button>
        </div>
      </header>

      <div className="case-layout">
        <div className="case-player">
          <CubePlayer alg={playing} replayKey={replayKey} mask={mask} finish={prefs.finish} />
          <button
            className={`chip focus-chip ${prefs.focusRelevant ? 'chip-on' : ''}`}
            aria-pressed={prefs.focusRelevant}
            onClick={() => setDevicePrefs({ focusRelevant: !prefs.focusRelevant })}
          >
            只看相关的块
          </button>
        </div>
        <div className="case-side">
          <div className="segmented" role="group" aria-label="学习状态">
            <span className="seg-thumb" aria-hidden="true" style={{ transform: `translateX(${STATUSES.indexOf(status) * 100}%)` }} />
            {STATUSES.map((s) => (
              <button key={s} className={status === s ? 'seg-on' : ''} aria-pressed={status === s} onClick={() => setStatus(c.id, s)}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {c.recognition && (
            <p className="recognition">
              <strong>识别：</strong>
              {c.recognition}
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

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CaseCard } from '../components/CaseCard';
import { getSet, METHODS } from '../data';
import { getUi, setUi } from '../lib/uiState';
import { STATUS_LABEL, statusOf, useUserData } from '../store/userStore';
import { type LearnStatus } from '../types';

type StatusFilter = 'all' | 'favorite' | LearnStatus;
const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'favorite', label: '收藏' },
  { id: 'none', label: STATUS_LABEL.none },
  { id: 'learning', label: STATUS_LABEL.learning },
  { id: 'mastered', label: STATUS_LABEL.mastered },
];

export function SetPage() {
  const { setId } = useParams();
  const set = getSet(setId ?? '');
  const user = useUserData();
  const [filter, setFilterRaw] = useState<StatusFilter>(() => getUi(`filter:${setId}`, 'all'));
  const [group, setGroupRaw] = useState(() => getUi(`group:${setId}`, '全部'));
  const setFilter = (v: StatusFilter) => {
    setFilterRaw(v);
    setUi(`filter:${setId}`, v);
  };
  const setGroup = (v: string) => {
    setGroupRaw(v);
    setUi(`group:${setId}`, v);
  };

  if (!set) return <NotFound />;

  const groups = ['全部', ...new Set(set.cases.map((c) => c.group))];
  const cases = set.cases.filter((c) => {
    if (group !== '全部' && c.group !== group) return false;
    if (filter === 'all') return true;
    if (filter === 'favorite') return !!user.cases[c.id]?.favorite;
    return statusOf(c, user) === filter;
  });

  return (
    <div className="page set-page">
      <header className="set-head">
        <div className="set-topline">
          <Link to="/" className="set-back">‹ 公式库</Link>
          <span className="set-method">{METHODS.find((m) => m.id === set.method)?.name}</span>
        </div>
        <h1 className="page-title">
          {set.name} <span className="muted title-note">{set.description}</span>
        </h1>
      </header>
      <div className="chips set-status-filter" role="group" aria-label="按学习状态筛选">
        {FILTERS.map((f) => (
          <button key={f.id} className={`chip ${filter === f.id ? 'chip-on' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="set-toolbar">
        {groups.length > 2 && (
          <label className="set-category">
            <span>分类</span>
            <select aria-label="按分组筛选" value={group} onChange={(e) => setGroup(e.target.value)}>
              {groups.map((g) => <option key={g} value={g}>{g === '全部' ? '全部分类' : g}</option>)}
            </select>
          </label>
        )}
        <p className="set-count" role="status">{cases.length} 个情形</p>
      </div>
      {cases.length ? (
        <div className="case-grid">
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <div className="set-empty">
          <p>没有符合条件的情形</p>
          <p className="muted small">试试其他分类或学习状态。</p>
          <button className="link-btn" onClick={() => { setFilter('all'); setGroup('全部'); }}>查看全部情形</button>
        </div>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div className="page">
      <p className="empty">
        找不到这个公式组，<Link to="/">回首页</Link>
      </p>
    </div>
  );
}

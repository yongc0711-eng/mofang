import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CaseCard } from '../components/CaseCard';
import { getSet } from '../data';
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
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [group, setGroup] = useState('全部');

  if (!set) return <NotFound />;

  const groups = ['全部', ...new Set(set.cases.map((c) => c.group))];
  const cases = set.cases.filter((c) => {
    if (group !== '全部' && c.group !== group) return false;
    if (filter === 'all') return true;
    if (filter === 'favorite') return !!user.cases[c.id]?.favorite;
    return statusOf(c, user) === filter;
  });

  return (
    <div className="page">
      <h1 className="page-title">
        {set.name} <span className="muted title-note">{set.description}</span>
      </h1>
      <div className="chips" role="group" aria-label="按学习状态筛选">
        {FILTERS.map((f) => (
          <button key={f.id} className={`chip ${filter === f.id ? 'chip-on' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {groups.length > 2 && (
        <div className="chips" role="group" aria-label="按分组筛选">
          {groups.map((g) => (
            <button key={g} className={`chip ${group === g ? 'chip-on' : ''}`} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>
      )}
      {cases.length ? (
        <div className="case-grid">
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <p className="empty">这里还没有公式</p>
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

import { useMemo, useState } from 'react';
import { CaseCard } from '../components/CaseCard';
import { ALL_CASES } from '../data';
import { useUserData } from '../store/userStore';
import { matches } from '../lib/search';

export function SearchPage() {
  const [q, setQ] = useState('');
  const user = useUserData();
  const query = q.trim();
  const results = useMemo(
    () => (query ? ALL_CASES.filter((c) => matches(c, query, user)) : []),
    [query, user],
  );
  return (
    <div className="page">
      <h1 className="page-title">搜索</h1>
      <input
        className="search-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="名称、别名或公式片段，如 T、小鱼、R U R'"
        aria-label="搜索公式"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {query && <p className="muted small">找到 {results.length} 条</p>}
      {query && !results.length && <p className="empty">没有匹配的公式</p>}
      <div className="case-grid">
        {results.map((c) => (
          <CaseCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

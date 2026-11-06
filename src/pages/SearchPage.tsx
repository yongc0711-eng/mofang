import { useMemo, useState } from 'react';
import { CaseCard } from '../components/CaseCard';
import { ALL_CASES, getSet } from '../data';
import { primaryAlgOf, useUserData } from '../store/userStore';
import { type AlgCase, type UserData } from '../types';

// 公式片段比较时忽略空格、括号和中英文撇号差异
const squash = (s: string) => s.replace(/[\s()（）]/g, '').replace(/[’‘]/g, "'");

function matches(c: AlgCase, q: string, user: UserData): boolean {
  const lower = q.toLowerCase();
  const text = [c.name, c.id, c.group, getSet(c.set)?.name ?? '', ...(c.aliases ?? [])];
  if (text.some((t) => t.toLowerCase().includes(lower))) return true;
  // 公式区分大小写：r 和 R 是不同转动
  const needle = squash(q);
  const algs = [...c.algs, ...(user.cases[c.id]?.customAlgs ?? []), primaryAlgOf(c, user)];
  return algs.some((a) => squash(a).includes(needle));
}

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

import { FormulaColors } from '../components/FormulaColors';
import { browsePalette } from '../lib/colorScheme';
import { useMemo, useState } from 'react';
import { HomeMethodDeck } from '../components/HomeMethodDeck';
import { CaseDiagram } from '../components/CaseDiagram';
import { CaseDiagram2 } from '../components/CaseDiagram2';
import { CaseCard, viewForPrimary } from '../components/CaseCard';
import { ALL_CASES, METHODS, SETS, getCase } from '../data';
import { diagramColors2 } from '../lib/cases2';
import { useDevicePrefs } from '../store/devicePrefs';
import { primaryAlgOf, statusOf, useUserData } from '../store/userStore';
import { matches } from '../lib/search';
import { type SetId } from '../types';

/** 每组用一个有代表性的情形做缩略图 */
const COVER: Record<SetId, string> = {
  f2l: 'f2l-5',
  oll: 'oll-27',
  pll: 'pll-t',
  coll: 'coll-as-1',
  wv: 'wv-1',
  cmll: 'cmll-s-1',
  lse: 'lse-eo-7',
  sbls: 'sbls-u-ub',
  eolr: 'eolr-3-1-2',
  cll: 'cll-as-1',
  eg1: 'eg1-h-1',
  eg2: 'eg2-h-1',
};

export function HomePage() {
  const [q, setQ] = useState('');
  const user = useUserData();
  const query = q.trim();
  const results = useMemo(() => query ? ALL_CASES.filter((c) => matches(c, query, user)) : [], [query, user]);
  const prefs = useDevicePrefs();
  const mastered = ALL_CASES.filter((c) => statusOf(c, user) === 'mastered').length;
  return (
    <div className="page">
      <header className="home-head">
        <h1 className="page-title">魔方公式</h1>
        <p className="muted small">
          共 {ALL_CASES.length} 条公式，已掌握 {mastered} 条
        </p>
        <div className="home-search-row">
          <input
            className="search-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索公式、别名或片段"
            aria-label="搜索公式"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <FormulaColors iconOnly />
        </div>
      </header>
      {query && (
        <section className="home-results" aria-label="搜索结果">
          <p className="muted small" role="status">找到 {results.length} 条</p>
          {!results.length && <p className="empty">没有匹配的公式</p>}
          <div className="case-grid">
            {results.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </section>
      )}
      <section className="home-library" aria-labelledby="home-three-title">
        <h2 id="home-three-title">三阶</h2>
        <div className="home-decks">
          {METHODS.map((m) => <HomeMethodDeck key={m.id} method={m.id} name={m.id === 'roux' ? '桥式' : m.name} items={SETS.filter((s) => s.method === m.id).map((s) => {
            const cover = getCase(COVER[s.id]) ?? s.cases[0];
            return {
              id: s.id, name: s.name, description: s.description,
              done: s.cases.filter((c) => statusOf(c, user) === 'mastered').length,
              total: s.cases.length,
              diagram: s.view === 'top2' || s.view === 'both2'
                ? <CaseDiagram2 colors={diagramColors2(viewForPrimary(cover, primaryAlgOf(cover, user)))} view="top2" />
                : <CaseDiagram c={viewForPrimary(cover, primaryAlgOf(cover, user))} view={s.view === 'lse' ? 'top' : s.view} palette={browsePalette(cover, prefs)} />,
            };
          })} />)}
        </div>
      </section>
    </div>
  );
}

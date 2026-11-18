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

const TWO_BY_TWO_METHODS = METHODS.filter(({ id }) => id === '2x2');
const THREE_BY_THREE_METHODS = METHODS.filter(({ id }) => id !== '2x2');

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

const TWO_BY_TWO_SUMMARY: Partial<Record<SetId, string>> = {
  cll: '底层已还原 · 完成顶层',
  eg1: '底面完成 · 一条底层同色边',
  eg2: '底面完成 · 无底层同色边',
};

export function HomePage() {
  const [q, setQ] = useState('');
  const user = useUserData();
  const query = q.trim();
  const results = useMemo(() => query ? ALL_CASES.filter((c) => matches(c, query, user)) : [], [query, user]);
  const prefs = useDevicePrefs();
  const mastered = ALL_CASES.filter((c) => statusOf(c, user) === 'mastered').length;
  const renderDeck = (method: (typeof METHODS)[number]) => {
    const items = SETS.filter((set) => set.method === method.id).map((set) => {
      const cover = getCase(COVER[set.id]) ?? set.cases[0];
      const view = viewForPrimary(cover, primaryAlgOf(cover, user));
      return {
        id: set.id, name: set.name, description: set.description, summary: TWO_BY_TWO_SUMMARY[set.id],
        done: set.cases.filter((c) => statusOf(c, user) === 'mastered').length,
        total: set.cases.length,
        diagram: set.view === 'top2' || set.view === 'both2'
          ? <CaseDiagram2 colors={diagramColors2(view, browsePalette(cover, prefs))} view="top2" />
          : <CaseDiagram c={view} view={set.view === 'lse' ? 'top' : set.view} palette={browsePalette(cover, prefs)} />,
      };
    });
    return <HomeMethodDeck key={method.id} method={method.id} name={method.id === 'roux' ? '桥式' : method.name} items={items} />;
  };
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
      <section className="home-library" aria-labelledby="home-library-title">
        <h2 id="home-library-title">公式库</h2>
        {TWO_BY_TWO_METHODS.map(renderDeck)}
        <section className="home-three-by-three" aria-labelledby="home-three-by-three-title">
          <h3 id="home-three-by-three-title">三阶</h3>
          <div className="home-decks">{THREE_BY_THREE_METHODS.map(renderDeck)}</div>
        </section>
      </section>
    </div>
  );
}

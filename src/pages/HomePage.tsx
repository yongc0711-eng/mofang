import { Link } from 'react-router-dom';
import { CaseDiagram } from '../components/CaseDiagram';
import { viewForPrimary } from '../components/CaseCard';
import { ALL_CASES, METHODS, SETS, getCase } from '../data';
import { useDevicePrefs } from '../store/devicePrefs';
import { primaryAlgOf, statusOf, useUserData } from '../store/userStore';
import { type SetId } from '../types';

/** 每组用一个有代表性的情形做缩略图 */
const COVER: Record<SetId, string> = {
  f2l: 'f2l-5',
  oll: 'oll-27',
  pll: 'pll-t',
  cmll: 'cmll-s-1',
  lse: 'lse-eo-7',
};

export function HomePage() {
  const user = useUserData();
  const prefs = useDevicePrefs();
  const mastered = ALL_CASES.filter((c) => statusOf(c, user) === 'mastered').length;
  return (
    <div className="page">
      <header className="home-head">
        <h1 className="page-title">魔方公式</h1>
        <p className="muted small">
          共 {ALL_CASES.length} 条公式，已掌握 {mastered} 条
        </p>
      </header>
      {METHODS.map((m) => (
        <section key={m.id} className="method">
          <div className="method-head">
            <h2>{m.name}</h2>
            <span className="muted small">{m.hint}</span>
          </div>
          <div className="set-list">
            {SETS.filter((s) => s.method === m.id).map((s) => {
              const done = s.cases.filter((c) => statusOf(c, user) === 'mastered').length;
              const total = s.cases.length;
              const cover = getCase(COVER[s.id]) ?? s.cases[0];
              return (
                <Link key={s.id} to={`/set/${s.id}`} className="set-card">
                  <CaseDiagram c={viewForPrimary(cover, primaryAlgOf(cover, user))} view={s.view === 'lse' ? 'top' : s.view} bottom={prefs.bottomColor} />
                  <div className="set-body">
                    <div className="set-title">
                      <strong>{s.name}</strong>
                      <span className="muted small">{s.description}</span>
                    </div>
                    <div className="progress" aria-hidden="true">
                      <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                    </div>
                    <span className="muted small">
                      已掌握 {done} / {total}
                    </span>
                  </div>
                  <span className="chevron" aria-hidden="true">›</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

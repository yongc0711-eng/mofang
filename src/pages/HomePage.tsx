import { Link } from 'react-router-dom';
import { METHODS, SETS } from '../data';
import { statusOf, useUserData } from '../store/userStore';

export function HomePage() {
  const user = useUserData();
  return (
    <div className="page">
      <h1 className="page-title">魔方公式</h1>
      {METHODS.map((m) => (
        <section key={m.id} className="method">
          <h2>{m.name}</h2>
          <p className="muted">{m.hint}</p>
          <div className="set-grid">
            {SETS.filter((s) => s.method === m.id).map((s) => {
              const mastered = s.cases.filter((c) => statusOf(c, user) === 'mastered').length;
              const total = s.expectedCount ?? s.cases.length;
              return (
                <Link key={s.id} to={`/set/${s.id}`} className="set-card">
                  <strong>{s.name}</strong>
                  <span className="muted">{s.description}</span>
                  <div className="progress" aria-hidden="true">
                    <div style={{ width: `${total ? (mastered / total) * 100 : 0}%` }} />
                  </div>
                  <span className="muted small">
                    已掌握 {mastered} / {total}
                    {!s.complete && ` · 已录入 ${s.cases.length}`}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { getSet } from '../data';
import { useDevicePrefs } from '../store/devicePrefs';
import { primaryAlgOf, statusOf, useUserData } from '../store/userStore';
import { type AlgCase } from '../types';
import { CaseDiagram } from './CaseDiagram';

export function CaseCard({ c }: { c: AlgCase }) {
  const user = useUserData();
  const prefs = useDevicePrefs();
  const set = getSet(c.set)!;
  const status = statusOf(c, user);
  const favorite = user.cases[c.id]?.favorite;
  return (
    <Link to={`/case/${c.id}`} className="case-card">
      <CaseDiagram c={c} view={set.view} bottom={prefs.bottomColor} />
      <div className="case-card-body">
        <div className="case-card-title">
          <span className="case-name">{c.name}</span>
          {favorite && <span className="fav-mark" aria-label="已收藏">★</span>}
          {status !== 'none' && <span className={`status-dot status-${status}`} aria-hidden="true" />}
        </div>
        <code className="alg alg-small">{primaryAlgOf(c, user)}</code>
      </div>
    </Link>
  );
}

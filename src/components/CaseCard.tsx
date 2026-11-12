import { browsePalette } from '../lib/colorScheme';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSet } from '../data';
import { viewCaseFor } from '../lib/cases';
import { scrambleFor } from '../lib/practice';
import { useDevicePrefs } from '../store/devicePrefs';
import { primaryAlgOf, STATUS_LABEL, statusOf, useUserData } from '../store/userStore';
import { type AlgCase } from '../types';
import { CaseDiagram } from './CaseDiagram';

/**
 * 外面的图解（卡片、首页封面、练习页）按主公式的起手画，和详情页一致（T33）。
 * 没设主公式或主公式就是 algs[0] 时原样返回 c，不解析。
 */
export function viewForPrimary(c: AlgCase, alg: string): AlgCase {
  return alg === c.algs[0] ? c : viewCaseFor(c, alg);
}

/**
 * 练习题的图解和 setup 必须用同一个 view。主公式前面的 U 如果夹在整体转体前面（如 PLL Aa 的 "U x ..."），
 * scrambleFor 会因为“中间含整体转体”抛错，这时整题回退到 c（图解和 setup 都按 algs[0]），不能让练习页崩。
 */
export function practiceViewFor(c: AlgCase, alg: string, rand?: () => number): { view: AlgCase; scramble: string } {
  const view = viewForPrimary(c, alg);
  try {
    return { view, scramble: scrambleFor(view, rand) };
  } catch {
    return { view: c, scramble: scrambleFor(c, rand) };
  }
}

export function CaseCard({ c }: { c: AlgCase }) {
  const user = useUserData();
  const prefs = useDevicePrefs();
  const palette = useMemo(() => browsePalette(c, prefs), [c, prefs]);
  const set = getSet(c.set)!;
  const primary = primaryAlgOf(c, user);
  const view = useMemo(() => viewForPrimary(c, primary), [c, primary]);
  const status = statusOf(c, user);
  const favorite = user.cases[c.id]?.favorite;
  return (
    <Link to={`/case/${c.id}`} className={`case-card${c.isBadCase ? ' case-card-bad' : ''}`}>
      <CaseDiagram c={view} view={set.view} palette={palette} />
      <div className="case-card-body">
        <div className="case-card-title">
          <span className="case-name">{c.name}</span>
          {c.isBadCase && <span className="tag">BAD CASE</span>}
          {favorite && <span className="fav-mark" aria-label="已收藏">★</span>}
          {status !== 'none' && <span className={`case-state case-state-${status}`}>{STATUS_LABEL[status]}</span>}
        </div>
        <code className="alg alg-small">{primary}</code>
      </div>
      <span className="case-card-arrow" aria-hidden="true">›</span>
    </Link>
  );
}

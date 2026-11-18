import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CaseCard } from '../components/CaseCard';
import { SETS } from '../data';
import { useUserData } from '../store/userStore';

export function FavoritesPage() {
  const user = useUserData();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const groups = SETS.map(set => ({
    set,
    cases: set.cases.filter(c => user.cases[c.id]?.favorite),
  })).filter(group => group.cases.length > 0);
  const size = params.get('size') === '2' ? 2 : 3;
  const visible = groups.filter(({ set }) => (set.method === '2x2') === (size === 2));
  const backToMe = () => {
    if (state?.fromMe) navigate(-1);
    else navigate('/me', { replace: true });
  };

  return (
    <div className="page favorites-page">
      <button type="button" className="back" onClick={backToMe}>‹ 我的</button>
      <h1 className="page-title">我的收藏</h1>
      <div className="favorites-toolbar">
        <div className="segmented favorites-size" role="group" aria-label="收藏阶数">
          <span className="seg-thumb seg-thumb-2" aria-hidden="true" style={{ transform: `translateX(${size === 2 ? 0 : 100}%)` }} />
          {([2, 3] as const).map(n => <button key={n} type="button" className={size === n ? 'seg-on' : ''}
            aria-pressed={size === n} onClick={() => setParams({ size: String(n) }, { replace: true, state })}>
            {n === 2 ? '二阶' : '三阶'}
          </button>)}
        </div>
        {visible.length > 0 && <Link className="chip" to={`/practice?favorites=${size}`}>练习收藏</Link>}
      </div>
      {visible.length > 0 ? visible.map(({ set, cases }) => (
        <section className="favorites-group" key={set.id} aria-labelledby={`favorites-${set.id}`}>
          <h2 id={`favorites-${set.id}`}>{set.name}</h2>
          <div className="case-grid">{cases.map(c => <CaseCard key={c.id} c={c} />)}</div>
        </section>
      )) : <p className="empty" role="status">还没有{size === 2 ? '二阶' : '三阶'}收藏。去公式详情点「收藏」即可加入。</p>}
    </div>
  );
}

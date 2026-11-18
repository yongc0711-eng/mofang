import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CaseCard } from '../components/CaseCard';
import { SETS } from '../data';
import { matchesMyCase, type MyCaseList } from '../lib/myCaseFilters';
import { useUserData } from '../store/userStore';

export function MyCasesPage({ list }: { list: MyCaseList }) {
  const user = useUserData();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const size = params.get('size') === '2' ? 2 : 3;
  const { filter, label } = list;
  const isFavorites = filter === 'favorite';
  const visible = SETS.filter(set => (set.method === '2x2') === (size === 2)).map(set => ({
    set,
    cases: set.cases.filter(c => matchesMyCase(c, user, filter)),
  })).filter(group => group.cases.length > 0);
  const practiceTo = isFavorites ? `/practice?favorites=${size}` : `/practice?status=${filter}&size=${size}`;
  const sizeLabel = size === 2 ? '二阶' : '三阶';
  const backToMe = () => {
    if (state?.fromMe) navigate(-1);
    else navigate('/me', { replace: true });
  };

  return (
    <div className="page">
      <button type="button" className="back" onClick={backToMe}>‹ 我的</button>
      <h1 className="page-title">{isFavorites ? '我的收藏' : label}</h1>
      <div className="my-cases-toolbar">
        <div className="segmented my-cases-size" role="group" aria-label={isFavorites ? '收藏阶数' : '魔方阶数'}>
          <span className="seg-thumb seg-thumb-2" aria-hidden="true" style={{ transform: `translateX(${size === 2 ? 0 : 100}%)` }} />
          {([2, 3] as const).map(n => <button key={n} type="button" className={size === n ? 'seg-on' : ''}
            aria-pressed={size === n} onClick={() => setParams({ size: String(n) }, { replace: true, state })}>
            {n === 2 ? '二阶' : '三阶'}
          </button>)}
        </div>
        {visible.length > 0 && <Link className="chip" to={practiceTo}>练习{label}</Link>}
      </div>
      {visible.length > 0 ? visible.map(({ set, cases }) => (
        <section className="my-cases-group" key={set.id} aria-labelledby={`my-cases-${set.id}`}>
          <h2 id={`my-cases-${set.id}`}>{set.name}</h2>
          <div className="case-grid">{cases.map(c => <CaseCard key={c.id} c={c} />)}</div>
        </section>
      )) : <p className="empty" role="status">{isFavorites
        ? `还没有${sizeLabel}收藏。去公式详情点「收藏」即可加入。`
        : `还没有标为「${label}」的${sizeLabel}情形。可在公式详情修改学习状态。`}</p>}
    </div>
  );
}

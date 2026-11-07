import { type ReactNode, useEffect } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { formulaTabTarget, isFormulaPath, shouldPopToFormula, tabLinkState } from './lib/nav';
import { useScrollRestoration } from './lib/scrollRestoration';
import { getUi, setUi } from './lib/uiState';
import { CasePage } from './pages/CasePage';
import { HomePage } from './pages/HomePage';
import { MePage } from './pages/MePage';
import { PracticePage } from './pages/PracticePage';
import { SearchPage } from './pages/SearchPage';
import { SetPage } from './pages/SetPage';

const icon = (path: ReactNode) => (
  <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
    {path}
  </svg>
);

const ICONS = {
  formulas: icon(
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>,
  ),
  search: icon(
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>,
  ),
  practice: icon(
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 9.5v4l2.5 1.5M9.5 3h5" />
    </>,
  ),
  me: icon(
    <>
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.500 2 7.500 6" />
    </>,
  ),
};

const NAV = [
  { to: '/search', label: '搜索', icon: ICONS.search },
  { to: '/practice', label: '练习', icon: ICONS.practice },
  { to: '/me', label: '我的', icon: ICONS.me },
];

function Nav() {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  // 公式组和详情页都属于“公式”这个 tab
  const inFormulas = isFormulaPath(pathname);
  // 返回栈（T53）：详情和三个 tab 页是“临时落脚点”，从它们出去用 replace，不留在历史里；
  // 首页/组页出去用 push，保留，这样系统返回能回到首页/组页
  const inCase = pathname.startsWith('/case/');
  const inTab = pathname === '/search' || pathname === '/practice' || pathname === '/me';
  // 离开公式区前记住具体页面：组页没选公式时也要回到组页，而不是旧详情页
  useEffect(() => {
    if (isFormulaPath(pathname)) setUi('lastFormulaPath', pathname);
  }, [pathname]);
  // 其他 tab 点“公式”回到上次停留的公式页（只存在内存里，刷新后回首页）
  const formulaTo = formulaTabTarget(
    pathname,
    getUi<string | null>('lastFormulaPath', null),
    getUi<string | null>('lastCaseId', null),
  );
  // 去搜索/练习/我的的链接带上“从哪个公式页出来的”（T55）
  const tabState = tabLinkState(pathname, location.state);
  // 在别的 tab 点“公式”：这条历史就是从要回的公式页 push 出来的，直接后退一步，
  // 用 replace 会在历史里留下重复的一条，要按两次返回才能离开
  const onFormulaClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (shouldPopToFormula(pathname, location.state, getUi<string | null>('lastFormulaPath', null))) {
      event.preventDefault();
      navigate(-1);
    }
  };
  // 其他路径都会显示首页，所以找不到时滑块停在“公式”
  const active = Math.max(0, NAV.findIndex((n) => pathname.startsWith(n.to)) + 1);
  return (
    <nav className="nav" aria-label="主导航">
      <span className="nav-brand">魔方公式</span>
      <span className="nav-thumb" aria-hidden="true" style={{ transform: `translateX(${active * 100}%)` }} />
      <NavLink to={formulaTo} replace={!inFormulas || formulaTo === pathname} className={`nav-item ${inFormulas ? 'active' : ''}`} onClick={onFormulaClick}>
        {ICONS.formulas}
        <span>公式</span>
      </NavLink>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} replace={inCase || inTab} className="nav-item" state={tabState}>
          {n.icon}
          <span>{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/** 全局滚动恢复（T53）：返回/切 tab 恢复位置，新打开页面回顶部 */
function ScrollRestoration() {
  useScrollRestoration();
  return null;
}

function AnimatedRoutes() {
  const { pathname } = useLocation();
  // key 变化时重新挂载，触发进场动画
  return (
    <div className="route" key={pathname}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/set/:setId" element={<SetPage />} />
        <Route path="/case/:caseId" element={<CasePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Nav />
      <ScrollRestoration />
      <main>
        <AnimatedRoutes />
      </main>
    </HashRouter>
  );
}

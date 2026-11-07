import { type ReactNode } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { formulaTabTarget, isFormulaPath } from './lib/nav';
import { getUi } from './lib/uiState';
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
  const { pathname } = useLocation();
  // 公式组和详情页都属于“公式”这个 tab
  const inFormulas = isFormulaPath(pathname);
  // 其他 tab 点“公式”回到上次的详情页（只存在内存里，刷新后回首页）
  const formulaTo = formulaTabTarget(pathname, getUi<string | null>('lastCaseId', null));
  // 其他路径都会显示首页，所以找不到时滑块停在“公式”
  const active = Math.max(0, NAV.findIndex((n) => pathname.startsWith(n.to)) + 1);
  return (
    <nav className="nav" aria-label="主导航">
      <span className="nav-brand">魔方公式</span>
      <span className="nav-thumb" aria-hidden="true" style={{ transform: `translateX(${active * 100}%)` }} />
      <NavLink to={formulaTo} className={`nav-item ${inFormulas ? 'active' : ''}`}>
        {ICONS.formulas}
        <span>公式</span>
      </NavLink>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} className="nav-item">
          {n.icon}
          <span>{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );
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
      <main>
        <AnimatedRoutes />
      </main>
    </HashRouter>
  );
}

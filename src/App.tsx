import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { CasePage } from './pages/CasePage';
import { HomePage } from './pages/HomePage';
import { MePage } from './pages/MePage';
import { PracticePage } from './pages/PracticePage';
import { SearchPage } from './pages/SearchPage';
import { SetPage } from './pages/SetPage';

const NAV = [
  { to: '/search', label: '搜索' },
  { to: '/practice', label: '练习' },
  { to: '/me', label: '我的' },
];

function Nav() {
  const { pathname } = useLocation();
  // 公式组和详情页都属于“公式”这个 tab
  const inFormulas = pathname === '/' || pathname.startsWith('/set/') || pathname.startsWith('/case/');
  return (
    <nav className="nav" aria-label="主导航">
      <span className="nav-brand">魔方公式</span>
      <NavLink to="/" className={`nav-item ${inFormulas ? 'active' : ''}`}>
        公式
      </NavLink>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} className="nav-item">
          {n.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function App() {
  return (
    <HashRouter>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/set/:setId" element={<SetPage />} />
          <Route path="/case/:caseId" element={<CasePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

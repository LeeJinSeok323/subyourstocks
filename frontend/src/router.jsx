import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout      from './components/layout/Layout';
import Dashboard   from './pages/Dashboard';
import Screening   from './pages/Screening';
import Watchlist   from './pages/Watchlist';
import Portfolio   from './pages/Portfolio';
import MarketTrend from './pages/MarketTrend';
import Stock       from './pages/Stock';
import Login       from './pages/Login';
import Admin       from './pages/Admin';
import NotFound    from './pages/NotFound';
import { getToken, getRole } from './hooks/useAuth';

/** JWT 없으면 /login 으로 리다이렉트 */
function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

/** ADMIN role 아니면 대시보드로 리다이렉트 */
function RequireAdmin({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  if (getRole() !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

const router = createBrowserRouter([
  // 로그인 페이지 (레이아웃 없음)
  { path: '/login', element: <Login /> },

  // 404
  { path: '*', element: <NotFound /> },

  // 인증 필요 영역 (사이드바 + 헤더 레이아웃)
  {
    path: '/',
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { index: true,        element: <Dashboard /> },
      { path: 'screening',  element: <Screening /> },
      { path: 'watchlist',  element: <Watchlist /> },
      { path: 'portfolio',  element: <Portfolio /> },
      { path: 'market',     element: <MarketTrend /> },
      { path: 'stock/:ticker', element: <Stock /> },
      // 관리자 전용
      { path: 'admin',      element: <RequireAdmin><Admin /></RequireAdmin> },
    ],
  },
]);

export default router;

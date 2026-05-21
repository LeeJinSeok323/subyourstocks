import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, SlidersHorizontal, Star,
  PieChart, TrendingUp, LineChart, LogOut, ShieldCheck,
} from 'lucide-react';
import { getUser, getRole, clearAuth } from '../../hooks/useAuth';
import './sidebar.css';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard,   label: '대시보드' },
  { to: '/screening',  icon: SlidersHorizontal, label: '조건 검색' },
  { to: '/watchlist',  icon: Star,              label: '관심 종목' },
  { to: '/portfolio',  icon: PieChart,           label: '포트폴리오' },
  { to: '/market',     icon: TrendingUp,         label: '시장 동향' },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const username  = getUser() ?? '사용자';
  const role      = getRole();
  const initial   = username.charAt(0).toUpperCase();

  const now     = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <LineChart size={20} className="sidebar__logo-icon" />
        <span>StockScreener</span>
      </div>

      <div className="sidebar__user">
        <div className="sidebar__avatar">{initial}</div>
        <div>
          <div className="sidebar__username">
            {username}님{role === 'ADMIN' && <span className="sidebar__admin-badge">관리자</span>}
          </div>
          <div className="sidebar__date">{dateStr}</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
            }
          >
            <Icon size={17} className="sidebar__nav-icon" />
            {label}
          </NavLink>
        ))}

        {/* 관리자 전용 메뉴 */}
        {role === 'ADMIN' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
            }
          >
            <ShieldCheck size={17} className="sidebar__nav-icon" />
            가입신청 관리
          </NavLink>
        )}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__settings sidebar__logout" onClick={handleLogout}>
          <LogOut size={17} className="sidebar__nav-icon" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}

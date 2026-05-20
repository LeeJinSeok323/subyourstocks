import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, SlidersHorizontal, Star,
  PieChart, TrendingUp, Settings, LineChart,
} from 'lucide-react';
import './sidebar.css';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard,    label: '대시보드' },
  { to: '/screening',  icon: SlidersHorizontal,  label: '조건 검색' },
  { to: '/watchlist',  icon: Star,               label: '관심 종목' },
  { to: '/portfolio',  icon: PieChart,            label: '포트폴리오' },
  { to: '/market',     icon: TrendingUp,          label: '시장 동향' },
];

export default function Sidebar() {
  const now = new Date();
  const dateStr = `지금: ${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <LineChart size={20} className="sidebar__logo-icon" />
        <span>StockScreener</span>
      </div>

      <div className="sidebar__user">
        <div className="sidebar__avatar">김</div>
        <div>
          <div className="sidebar__username">김투자님, 환영합니다!</div>
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
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__settings">
          <Settings size={17} className="sidebar__nav-icon" />
          설정
        </button>
      </div>
    </aside>
  );
}

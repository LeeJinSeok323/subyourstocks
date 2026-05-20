import { Search, Bell, MessageCircle, Zap } from 'lucide-react';
import './header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header__search">
        <Search className="header__search-icon" />
        <input type="text" placeholder="종목명, 티커, 키워드 검색..." />
      </div>

      <div className="header__right">
        <button className="header__icon-btn">
          <Bell size={18} />
          <span className="header__badge" />
        </button>
        <button className="header__icon-btn">
          <MessageCircle size={18} />
        </button>
        <button className="header__realtime-btn">
          <span className="header__realtime-dot" />
          <Zap size={14} />
          실시간 연동
        </button>
      </div>
    </header>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Zap, Menu, LogOut, ShieldCheck, User } from 'lucide-react';
import { getUser, getRole, clearAuth, authFetch } from '../../hooks/useAuth';
import './header.css';

/* ── 유저 드롭다운 ── */
function UserDropdown() {
  const navigate  = useNavigate();
  const username  = getUser() ?? '사용자';
  const role      = getRole();
  const initial   = username.charAt(0).toUpperCase();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="header__user-wrap" ref={ref}>
      <button
        className="header__avatar"
        onClick={() => setOpen((v) => !v)}
        aria-label="프로필 메뉴"
      >
        {initial}
        {role === 'ADMIN' && <span className="header__avatar-dot" />}
      </button>

      {open && (
        <div className="header__dropdown">
          {/* 유저 정보 */}
          <div className="header__dropdown-info">
            <div className="header__dropdown-avatar">{initial}</div>
            <div>
              <div className="header__dropdown-name">{username}</div>
              <div className="header__dropdown-role">
                {role === 'ADMIN' ? (
                  <span className="header__dropdown-admin">
                    <ShieldCheck size={11} /> 관리자
                  </span>
                ) : (
                  <span className="header__dropdown-user">
                    <User size={11} /> 일반 사용자
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="header__dropdown-divider" />

          {/* 관리자 메뉴 */}
          {role === 'ADMIN' && (
            <button
              className="header__dropdown-item"
              onClick={() => { navigate('/admin'); setOpen(false); }}
            >
              <ShieldCheck size={14} />
              가입신청 관리
            </button>
          )}

          {/* 로그아웃 */}
          <button
            className="header__dropdown-item header__dropdown-item--danger"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 종목 검색 ── */
function StockSearch() {
  const navigate = useNavigate();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [focused, setFocused]   = useState(-1);
  const timerRef = useRef(null);
  const wrapRef  = useRef(null);

  const search = useCallback((q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    authFetch(`/api/stocks/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => { setResults(Array.isArray(data) ? data : []); setOpen(true); setFocused(-1); })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 200);
  };

  const handleSelect = (ticker) => {
    setQuery('');
    setResults([]);
    setOpen(false);
    navigate(`/stock/${ticker}`);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter' && focused >= 0) handleSelect(results[focused].ticker);
    if (e.key === 'Escape') { setOpen(false); setFocused(-1); }
  };

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="header__search-wrap" ref={wrapRef}>
      <div className="header__search">
        <Search className="header__search-icon" size={15} />
        <input
          type="text"
          placeholder="종목명, 티커 검색..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="header__search-dropdown">
          {results.map((r, i) => (
            <li
              key={r.ticker}
              className={`header__search-item${focused === i ? ' header__search-item--focused' : ''}`}
              onMouseDown={() => handleSelect(r.ticker)}
              onMouseEnter={() => setFocused(i)}
            >
              <span className="header__search-ticker">{r.ticker}</span>
              <span className="header__search-name">{r.company_name}</span>
              <span className="header__search-exch">{r.exchange}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── 헤더 ── */
export default function Header({ onMenuOpen }) {
  return (
    <header className="header">
      {/* 모바일 햄버거 */}
      <button className="header__menu-btn" onClick={onMenuOpen} aria-label="메뉴 열기">
        <Menu size={20} />
      </button>

      {/* 검색 */}
      <StockSearch />

      <div className="header__right">
        {/* 실시간 상태 */}
        <div className="header__realtime">
          <span className="header__realtime-dot" />
          <span className="header__realtime-text">실시간</span>
        </div>

        {/* 알림 */}
        <button className="header__icon-btn" aria-label="알림">
          <Bell size={18} />
          <span className="header__badge" />
        </button>

        {/* 유저 아바타 + 드롭다운 */}
        <UserDropdown />
      </div>
    </header>
  );
}

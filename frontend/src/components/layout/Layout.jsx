import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer  = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="layout">
      {/* 모바일 드로어 백드롭 */}
      {drawerOpen && (
        <div className="layout__backdrop" onClick={closeDrawer} />
      )}

      <Sidebar isOpen={drawerOpen} onClose={closeDrawer} />

      <div className="layout__main">
        <Header onMenuOpen={openDrawer} />
        <div className="layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Download, RotateCcw, Settings } from 'lucide-react';
import DashboardGrid from './DashboardGrid';
import WidgetSettingsPopover from './WidgetSettingsModal';
import { useWidgetLayout } from '../../hooks/useWidgetLayout';
import './dashboard.css';

export default function Dashboard() {
  const { widgets, reorder, toggleLock, toggleVisibility, resetLayout } = useWidgetLayout();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="dashboard__title">
          <h1>시장 요약</h1>
          <p>오늘의 주요 지표와 관심 종목의 변동을 확인하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>

          {/* 설정 버튼 + 말풍선 팝오버 */}
          <div style={{ position: 'relative' }}>
            <button
              className={`dashboard__report-btn${settingsOpen ? ' dashboard__report-btn--active' : ''}`}
              onClick={() => setSettingsOpen(v => !v)}
              title="위젯 설정"
            >
              <Settings size={14} />
              설정
            </button>
            {settingsOpen && (
              <WidgetSettingsPopover
                widgets={widgets}
                onToggleVisibility={toggleVisibility}
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </div>

          <button className="dashboard__report-btn" onClick={resetLayout} title="레이아웃 초기화">
            <RotateCcw size={14} />
            초기화
          </button>
          <button className="dashboard__report-btn">
            <Download size={14} />
            리포트 다운로드
          </button>
        </div>
      </div>

      <DashboardGrid
        widgets={widgets}
        onReorder={reorder}
        onToggleLock={toggleLock}
      />
    </div>
  );
}

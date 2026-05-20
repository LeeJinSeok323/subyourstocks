import { Download, RotateCcw } from 'lucide-react';
import DashboardGrid from './DashboardGrid';
import { useWidgetLayout } from '../../hooks/useWidgetLayout';
import './dashboard.css';

export default function Dashboard() {
  const { widgets, reorder, toggleLock, resetLayout } = useWidgetLayout();

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="dashboard__title">
          <h1>시장 요약</h1>
          <p>오늘의 주요 지표와 관심 종목의 변동을 확인하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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

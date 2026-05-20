import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock, LockOpen } from 'lucide-react';
import '../Dashboard/dashboard.css';

function SortableWidget({ widget, children, onToggleLock }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: widget.locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget${isDragging ? ' widget--dragging' : ''}`}
    >
      <div className="widget__bar">
        {widget.locked ? (
          <span style={{ width: 20 }} />
        ) : (
          <button
            className="widget__drag-handle"
            {...attributes}
            {...listeners}
            title="드래그해서 순서 변경"
          >
            <GripVertical size={15} />
          </button>
        )}
        <span className="widget__label">{widget.label}</span>
        <button
          className={`widget__lock-btn${widget.locked ? ' widget__lock-btn--locked' : ''}`}
          onClick={() => onToggleLock(widget.id)}
          title={widget.locked ? '고정 해제' : '위치 고정'}
        >
          {widget.locked ? <Lock size={13} /> : <LockOpen size={13} />}
        </button>
      </div>
      <div className="widget__body">
        {children}
      </div>
    </div>
  );
}

const WIDGET_COMPONENTS = {
  'market-alert':    () => import('./widgets/MarketAlert'),
  'market-indices':  () => import('./widgets/MarketIndexCards'),
  'charts':          () => import('./widgets/SectorAndAssetCharts'),
  'screening-table': () => import('./widgets/ScreeningTable'),
};

import { Suspense, lazy } from 'react';

const LAZY_WIDGETS = {
  'market-alert':    lazy(() => import('./widgets/MarketAlert')),
  'market-indices':  lazy(() => import('./widgets/MarketIndexCards')),
  'charts':          lazy(() => import('./widgets/SectorAndAssetCharts')),
  'screening-table': lazy(() => import('./widgets/ScreeningTable')),
};

export default function DashboardGrid({ widgets, onReorder, onToggleLock }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd({ active, over }) {
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {widgets.map(widget => {
            const WidgetComponent = LAZY_WIDGETS[widget.id];
            return (
              <SortableWidget key={widget.id} widget={widget} onToggleLock={onToggleLock}>
                <Suspense fallback={<div style={{ padding: 24, color: 'var(--text-3)' }}>로딩 중...</div>}>
                  {WidgetComponent && <WidgetComponent />}
                </Suspense>
              </SortableWidget>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

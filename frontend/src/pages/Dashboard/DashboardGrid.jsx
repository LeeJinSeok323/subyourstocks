import { Suspense, lazy } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Lock, LockOpen } from 'lucide-react';
import '../Dashboard/dashboard.css';

const LAZY_WIDGETS = {
  'market-alert':    lazy(() => import('./widgets/MarketAlert')),
  'market-indices':  lazy(() => import('./widgets/MarketIndexCards')),
  'charts':          lazy(() => import('./widgets/SectorAndAssetCharts')),
  'screening-table': lazy(() => import('./widgets/ScreeningTable')),
};

const Loading = () => (
  <div style={{ padding: 24, color: 'var(--text-3)' }}>로딩 중...</div>
);

/* ── 잠긴 위젯: SortableContext 밖 — 드래그·드롭 대상 모두 제외 ── */
function LockedWidget({ widget, onToggleLock }) {
  const WidgetComponent = LAZY_WIDGETS[widget.id];
  return (
    <div className="widget widget--locked" data-widget-id={widget.id}>
      <div className="widget__bar">
        <span className="widget__drag-placeholder" />
        <span className="widget__label">{widget.label}</span>
        <button
          className="widget__lock-btn widget__lock-btn--locked"
          onClick={() => onToggleLock(widget.id)}
          title="고정 해제"
        >
          <Lock size={13} />
        </button>
      </div>
      <div className="widget__body">
        <Suspense fallback={<Loading />}>
          {WidgetComponent && <WidgetComponent />}
        </Suspense>
      </div>
    </div>
  );
}

/* ── 드래그 가능한 위젯 ── */
function DraggableWidget({ widget, onToggleLock }) {
  const {
    attributes, listeners,
    setNodeRef, transform, transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
  };

  const WidgetComponent = LAZY_WIDGETS[widget.id];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget${isDragging ? ' widget--dragging' : ''}`}
      data-widget-id={widget.id}
    >
      <div className="widget__bar">
        <button
          className="widget__drag-handle"
          {...attributes}
          {...listeners}
          title="드래그해서 순서 변경"
        >
          <GripVertical size={15} />
        </button>
        <span className="widget__label">{widget.label}</span>
        <button
          className="widget__lock-btn"
          onClick={() => onToggleLock(widget.id)}
          title="위치 고정"
        >
          <LockOpen size={13} />
        </button>
      </div>
      <div className="widget__body">
        <Suspense fallback={<Loading />}>
          {WidgetComponent && <WidgetComponent />}
        </Suspense>
      </div>
    </div>
  );
}

/* ── 그리드 ── */
export default function DashboardGrid({ widgets, onReorder, onToggleLock }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // 잠기지 않은 위젯만 SortableContext에 등록 → 잠긴 위젯은 드롭 대상에서 완전 제외
  const draggableIds = widgets.filter(w => !w.locked).map(w => w.id);

  function handleDragEnd({ active, over }) {
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={draggableIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {widgets.map(widget =>
            widget.locked
              ? <LockedWidget    key={widget.id} widget={widget} onToggleLock={onToggleLock} />
              : <DraggableWidget key={widget.id} widget={widget} onToggleLock={onToggleLock} />
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

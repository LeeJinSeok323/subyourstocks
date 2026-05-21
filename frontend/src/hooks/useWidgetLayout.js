import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

const STORAGE_KEY = 'dashboard-widget-layout';

export const DEFAULT_WIDGETS = [
  { id: 'market-alert',    label: '시장 경고',        locked: false, visible: true },
  { id: 'market-indices',  label: '시장 지수',        locked: false, visible: true },
  { id: 'charts',          label: '섹터 / 자산 추이', locked: false, visible: true },
  { id: 'screening-table', label: '조건검색 결과',    locked: false, visible: true },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const saved = JSON.parse(raw);
    // 새 위젯이 추가됐을 경우 병합 + visible 필드 없으면 true로 보정
    const savedIds = new Set(saved.map(w => w.id));
    const merged = [
      ...saved.map(w => ({ visible: true, ...w })),
      ...DEFAULT_WIDGETS.filter(w => !savedIds.has(w.id)),
    ];
    return merged;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

function save(widgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

export function useWidgetLayout() {
  const [widgets, setWidgets] = useState(load);

  const reorder = useCallback((activeId, overId) => {
    setWidgets(prev => {
      const oldIdx = prev.findIndex(w => w.id === activeId);
      const newIdx = prev.findIndex(w => w.id === overId);
      if (oldIdx === -1 || newIdx === -1) return prev;
      if (prev[oldIdx].locked || prev[newIdx].locked) return prev;
      const next = arrayMove(prev, oldIdx, newIdx);
      save(next);
      return next;
    });
  }, []);

  const toggleLock = useCallback((id) => {
    setWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, locked: !w.locked } : w);
      save(next);
      return next;
    });
  }, []);

  const toggleVisibility = useCallback((id) => {
    setWidgets(prev => {
      const next = prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
      save(next);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    save(DEFAULT_WIDGETS);
    setWidgets(DEFAULT_WIDGETS);
  }, []);

  return { widgets, reorder, toggleLock, toggleVisibility, resetLayout };
}

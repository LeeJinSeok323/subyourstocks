import './dashboard.css';

export default function WidgetSettingsPopover({ widgets, onToggleVisibility, onClose }) {
  return (
    <>
      {/* 클릭 외부 감지용 투명 오버레이 */}
      <div className="ws-backdrop" onClick={onClose} />

      <div className="ws-popover">
        {/* 꼬리 */}
        <div className="ws-popover__tail" />

        <p className="ws-popover__title">위젯 표시 설정</p>
        <ul className="ws-popover__list">
          {widgets.map(w => (
            <li key={w.id} className="ws-popover__item">
              <label className="ws-popover__label">
                <input
                  type="checkbox"
                  checked={w.visible}
                  onChange={() => onToggleVisibility(w.id)}
                  className="ws-popover__checkbox"
                />
                {w.label}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

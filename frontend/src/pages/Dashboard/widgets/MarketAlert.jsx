import { AlertTriangle } from 'lucide-react';
import './widgets.css';

export default function MarketAlert() {
  return (
    <div className="market-alert">
      <AlertTriangle size={16} className="market-alert__icon" />
      <div>
        <div className="market-alert__title">시장 경고</div>
        <div className="market-alert__text">
          미국 CPI 발표가 2시간 남았습니다. 변동성에 유의하세요.
        </div>
      </div>
    </div>
  );
}

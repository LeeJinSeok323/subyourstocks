import { ChevronRight } from 'lucide-react';
import './widgets.css';

const INDICES = [
  { name: 'KOSPI',      dot: '#3B82F6', value: '2,742.14',    change: '+1.24%', sub: '전일 대비 +33.82', up: true },
  { name: 'NASDAQ',     dot: '#6366F1', value: '16,428.82',   change: '-0.45%', sub: '전일 대비 -74.12', up: false },
  { name: 'USD/KRW',    dot: '#F59E0B', value: '1,352.40',    change: '+0.15%', sub: '전일 대비 +2.10',  up: true },
  { name: '내 포트폴리오', dot: '#10B981', value: '₩45,210,000', change: '+2.4%',  sub: '미번 달 수익 +₩1,050,000', up: true },
];

export default function MarketIndexCards() {
  return (
    <div className="index-cards">
      {INDICES.map(idx => (
        <div key={idx.name} className="index-card">
          <div className="index-card__header">
            <span className="index-card__name">
              <span className="index-card__dot" style={{ background: idx.dot }} />
              {idx.name}
            </span>
            <ChevronRight size={14} className="index-card__arrow" />
          </div>
          <div className="index-card__value">{idx.value}</div>
          <div className={`index-card__change index-card__change--${idx.up ? 'up' : 'down'}`}>
            {idx.change}
            <span className="index-card__sub">&nbsp;{idx.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

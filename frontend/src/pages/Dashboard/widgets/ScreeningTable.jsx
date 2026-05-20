import { Plus } from 'lucide-react';
import './widgets.css';

const MOCK_ROWS = [
  { icon: 'S', color: '#3B82F6', name: '삼성전자', code: '005930', price: '82,400원', change: '+1.23%', volume: '1.2조', signal: '골든크로스', signalType: 'buy' },
  { icon: 'N', color: '#10B981', name: 'NAVER',   code: '035420', price: '192,500원', change: '-0.52%', volume: '450억',  signal: '관망',      signalType: 'hold' },
  { icon: 'K', color: '#F59E0B', name: '카카오',   code: '035720', price: '45,200원',  change: '+2.11%', volume: '820억',  signal: '매수 고려',  signalType: 'buy' },
  { icon: 'H', color: '#6366F1', name: '현대차',   code: '005380', price: '218,000원', change: '-1.30%', volume: '2.1조',  signal: '매도 고려',  signalType: 'sell' },
];

export default function ScreeningTable() {
  return (
    <div className="screening-table-wrap">
      <div className="screening-table-header">
        <h3>실시간 조건 검색 결과</h3>
        <a href="/screening">전체보기 →</a>
      </div>
      <table className="screening-table">
        <thead>
          <tr>
            <th>종목명</th>
            <th>현재가</th>
            <th>등락률</th>
            <th>거래대금</th>
            <th>시그널</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_ROWS.map(row => (
            <tr key={row.code}>
              <td>
                <div className="stock-cell">
                  <div className="stock-icon" style={{ background: row.color }}>{row.icon}</div>
                  <div>
                    <div className="stock-name">{row.name}</div>
                    <div className="stock-code">{row.code}</div>
                  </div>
                </div>
              </td>
              <td>{row.price}</td>
              <td className={row.change.startsWith('+') ? 'change--up' : 'change--down'}>{row.change}</td>
              <td>{row.volume}</td>
              <td>
                <span className={`signal-badge signal-badge--${row.signalType}`}>{row.signal}</span>
              </td>
              <td>
                <button className="action-btn"><Plus size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import './widgets.css';

const SECTOR_DATA = [
  { name: '기술주',   value: 45, color: '#3B82F6' },
  { name: '금융주',   value: 25, color: '#9CA3AF' },
  { name: '헬스케어', value: 30, color: '#93C5FD' },
];

const ASSET_DATA = {
  '1W': [
    { date: 'Oct 12', value: 40000000 },
    { date: 'Oct 13', value: 40800000 },
    { date: 'Oct 14', value: 41200000 },
    { date: 'Oct 15', value: 41000000 },
    { date: 'Oct 16', value: 42500000 },
    { date: 'Oct 17', value: 45210000 },
  ],
  '1M': [
    { date: 'Sep 20', value: 38000000 },
    { date: 'Sep 27', value: 39500000 },
    { date: 'Oct 04', value: 40200000 },
    { date: 'Oct 11', value: 41800000 },
    { date: 'Oct 17', value: 45210000 },
  ],
  '3M': [
    { date: 'Jul', value: 35000000 },
    { date: 'Aug', value: 37000000 },
    { date: 'Sep', value: 39500000 },
    { date: 'Oct', value: 45210000 },
  ],
  '1Y': [
    { date: '26/01', value: 30000000 },
    { date: '26/04', value: 33000000 },
    { date: '26/07', value: 37000000 },
    { date: '26/10', value: 45210000 },
  ],
};

const TABS = ['1W', '1M', '3M', '1Y'];

function formatY(v) {
  if (v >= 10000000) return `${(v / 10000000).toFixed(0)}천만`;
  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
  return v;
}

export default function SectorAndAssetCharts() {
  const [tab, setTab] = useState('1W');

  return (
    <div className="charts-row">
      {/* 섹터 비중 */}
      <div className="sector-chart">
        <div className="chart-header">
          <span className="chart-title">섹터 비중</span>
          <select className="chart-select">
            <option>내 포트폴리오</option>
          </select>
        </div>
        <div className="sector-chart__inner">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={SECTOR_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={70} dataKey="value" strokeWidth={0}>
                {SECTOR_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="sector-legend">
            {SECTOR_DATA.map(s => (
              <div key={s.name} className="sector-legend__item">
                <span className="sector-legend__dot-label">
                  <span className="sector-legend__dot" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="sector-legend__pct">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 자산 추이 */}
      <div className="asset-chart">
        <div className="chart-header">
          <span className="chart-title">자산 추이</span>
          <div className="chart-tabs">
            {TABS.map(t => (
              <button
                key={t}
                className={`chart-tab${tab === t ? ' chart-tab--active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={ASSET_DATA[tab]} margin={{ top: 4, right: 8, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={48} />
            <Tooltip formatter={(v) => `₩${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

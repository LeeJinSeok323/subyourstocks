import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { authFetch } from '../../../hooks/useAuth';
import './widgets.css';

// symbol → 카드 설정 매핑
const SYMBOL_META = {
  '^KS11':  { label: 'KOSPI',   dot: '#3B82F6' },
  '^KQ11':  { label: 'KOSDAQ',  dot: '#8B5CF6' },
  '^GSPC':  { label: 'S&P 500', dot: '#EC4899' },
  '^IXIC':  { label: 'NASDAQ',  dot: '#6366F1' },
  'KRW=X':  { label: 'USD/KRW', dot: '#F59E0B' },
};

// 카드에 표시할 symbol 순서 (4개)
const DISPLAY_SYMBOLS = ['^KS11', '^IXIC', 'KRW=X', '^GSPC'];

function fmt(value, symbol) {
  if (value == null) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  // USD/KRW: 소수 2자리, 나머지도 2자리
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtChange(pct, amt) {
  const p = parseFloat(pct);
  const a = parseFloat(amt);
  if (isNaN(p) || isNaN(a)) return { pctStr: '—', amtStr: '—', up: null };
  const sign = p >= 0 ? '+' : '';
  return {
    pctStr: `${sign}${p.toFixed(2)}%`,
    amtStr: `전일 대비 ${sign}${a.toFixed(2)}`,
    up: p >= 0,
  };
}

export default function MarketIndexCards() {
  const [data, setData] = useState({});   // { symbol: row }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch('/api/market/indices')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(rows => {
        const map = {};
        rows.forEach(row => { map[row.symbol] = row; });
        setData(map);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // DISPLAY_SYMBOLS 순서대로 카드 데이터 구성
  const cards = DISPLAY_SYMBOLS.map(symbol => {
    const meta = SYMBOL_META[symbol];
    const row = data[symbol];
    if (!row) {
      return { symbol, label: meta.label, dot: meta.dot, value: '—', pctStr: '—', amtStr: '—', up: null };
    }
    const { pctStr, amtStr, up } = fmtChange(row.change_pct, row.change_amt);
    return {
      symbol,
      label: meta.label,
      dot: meta.dot,
      value: fmt(row.price, symbol),
      pctStr,
      amtStr,
      up,
    };
  });

  return (
    <div className="index-cards">
      {cards.map((card, i) => (
        <div key={card.symbol ?? i} className="index-card">
          <div className="index-card__header">
            <span className="index-card__name">
              <span className="index-card__dot" style={{ background: card.dot }} />
              {card.label}
            </span>
            <ChevronRight size={14} className="index-card__arrow" />
          </div>

          {loading && !card.symbol?.startsWith('portfolio') ? (
            <div className="index-card__value" style={{ fontSize: 14, color: 'var(--text-3)' }}>로딩 중…</div>
          ) : error ? (
            <div className="index-card__value" style={{ fontSize: 12, color: 'var(--red)' }}>오류</div>
          ) : (
            <>
              <div className="index-card__value">{card.value}</div>
              <div
                className={`index-card__change ${
                  card.up === true  ? 'index-card__change--up'   :
                  card.up === false ? 'index-card__change--down' : ''
                }`}
              >
                {card.pctStr}
                <span className="index-card__sub">&nbsp;{card.amtStr}</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { authFetch } from '../../hooks/useAuth';
import './stock.css';

/* ── Mock OHLCV 생성 ── */
function generateMockOHLCV(days, basePrice) {
  const data = [];
  let price = basePrice;
  const now = new Date('2026-05-20');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const delta  = (Math.random() - 0.47) * price * 0.025;
    const open   = price;
    const close  = Math.max(1, price + delta);
    const high   = Math.max(open, close) * (1 + Math.random() * 0.012);
    const low    = Math.min(open, close) * (1 - Math.random() * 0.012);
    const volume = Math.floor(20_000_000 + Math.random() * 60_000_000);
    data.push({ date: `${d.getMonth()+1}/${d.getDate()}`, open: +open.toFixed(2), close: +close.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), volume });
    price = close;
  }
  return data;
}

const PERIODS = { '1주': 7, '1개월': 30, '3개월': 90, '6개월': 180, '1년': 365 };

const MOCK_META = {
  NVDA:     { name: 'NVIDIA Corp.',      price: 875.40,  prevClose: 699.0  },
  AMD:      { name: 'Advanced Micro',    price: 168.20,  prevClose: 137.1  },
  TSLA:     { name: 'Tesla Inc.',         price: 182.50,  prevClose: 154.4  },
  PLTR:     { name: 'Palantir Tech.',     price:  23.80,  prevClose:  20.5  },
  '005930': { name: '삼성전자',            price: 78400,   prevClose: 70600  },
  '000660': { name: 'SK하이닉스',          price: 198000,  prevClose: 181000 },
};

const SEC_TYPES = [
  { type: '8-K',     desc: '중요 이벤트' },
  { type: '10-K',    desc: '연간 보고서' },
  { type: '10-Q',    desc: '분기 보고서' },
  { type: 'S-1',     desc: '상장 신청'   },
  { type: 'DEF 14A', desc: '주주총회'    },
  { type: 'Form 4',  desc: '내부자 거래' },
];

const DEFAULT_TYPES = ['8-K', '10-K']; // 기본 활성화 유형

/* ── 커스텀 툴팁 ── */
function PriceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d  = payload[0].payload;
  const up = d.close >= d.open;
  return (
    <div className="stock-tooltip">
      <div className="stock-tooltip__date">{label}</div>
      <div className="stock-tooltip__price" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
        ${d.close.toLocaleString()}
      </div>
      <div className="stock-tooltip__row"><span>시가</span><b>${d.open.toLocaleString()}</b></div>
      <div className="stock-tooltip__row"><span>고가</span><b>${d.high.toLocaleString()}</b></div>
      <div className="stock-tooltip__row"><span>저가</span><b>${d.low.toLocaleString()}</b></div>
    </div>
  );
}

function VolumeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="stock-tooltip">
      <div className="stock-tooltip__row"><span>거래량</span><b>{Number(payload[0].value).toLocaleString()}</b></div>
    </div>
  );
}

/* ── 텔레그램 등록 팝업 ── */
function TelegramRegisterPopup({ onRegistered, onClose }) {
  const [link, setLink] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    authFetch('/api/telegram/link-token', { method: 'POST' })
      .then(r => r.json())
      .then(d => setLink(d.link))
      .catch(() => {});

    pollRef.current = setInterval(() => {
      authFetch('/api/telegram/status')
        .then(r => r.json())
        .then(d => { if (d.registered) { clearInterval(pollRef.current); onRegistered(); } })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [onRegistered]);

  return (
    <>
      <div className="alert-backdrop" onClick={onClose} />
      <div className="tg-register-popup">
        <div className="tg-register-popup__title">텔레그램 연결 필요</div>
        <p className="tg-register-popup__desc">
          알림을 받으려면 텔레그램 봇을 등록해야 해요.<br />
          아래 버튼을 눌러 봇에서 시작을 눌러주세요.
        </p>
        {link ? (
          <a className="tg-register-popup__btn" href={link} target="_blank" rel="noreferrer">
            텔레그램에서 등록하기
          </a>
        ) : (
          <div className="tg-register-popup__loading">링크 생성 중...</div>
        )}
        <p className="tg-register-popup__hint">등록 완료 시 자동으로 닫힙니다.</p>
      </div>
    </>
  );
}

/* ── 알림 팝오버 ── */
function AlertPopover({ enabledTypes, onToggle, onTurnOff, onClose }) {
  return (
    <>
      <div className="alert-backdrop" onClick={onClose} />
      <div className="alert-popover">
        <div className="alert-popover__tail" />
        <div className="alert-popover__section-label">SEC 공시 유형</div>
        <ul className="alert-popover__list">
          {SEC_TYPES.map(s => (
            <li key={s.type} className="alert-popover__item">
              <label>
                <input
                  type="checkbox"
                  checked={enabledTypes.includes(s.type)}
                  onChange={() => onToggle(s.type)}
                />
                <span>{s.type}</span>
                <span className="alert-popover__item-sub">{s.desc}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="alert-popover__footer">
          <button className="alert-popover__off-btn" onClick={onTurnOff}>
            알림 끄기
          </button>
        </div>
      </div>
    </>
  );
}

/* ── 메인 ── */
export default function StockPage() {
  const { ticker } = useParams();
  const navigate   = useNavigate();
  const [period, setPeriod]             = useState('3개월');
  const [alertOn, setAlertOn]           = useState(false);
  const [popoverOpen, setPopover]       = useState(false);
  const [enabledTypes, setEnabledTypes] = useState(DEFAULT_TYPES);
  const [tgRegistered, setTgRegistered] = useState(true);
  const [tgPopup, setTgPopup]           = useState(false);

  const meta      = MOCK_META[ticker] ?? { name: ticker, price: 100, prevClose: 95 };
  const change    = meta.price - meta.prevClose;
  const changePct = (change / meta.prevClose) * 100;
  const up        = change >= 0;

  const data = useMemo(
    () => generateMockOHLCV(PERIODS[period], meta.prevClose),
    [period, meta.prevClose]
  );

  const prices      = data.map(d => d.close);
  const pMin        = Math.min(...prices);
  const pMax        = Math.max(...prices);
  const pPad        = (pMax - pMin) * 0.08;
  const tickInterval = Math.max(1, Math.floor(data.length / 5));

  /* 서버에서 알림 상태 + 텔레그램 등록 여부 로드 */
  useEffect(() => {
    authFetch(`/api/alerts/${ticker}`)
      .then(r => r.json())
      .then(d => {
        if (d.active) {
          setAlertOn(true);
          setEnabledTypes(d.types ?? DEFAULT_TYPES);
        }
      })
      .catch(() => {});

    authFetch('/api/telegram/status')
      .then(r => r.json())
      .then(d => setTgRegistered(d.registered))
      .catch(() => {});
  }, [ticker]);

  /* 알림 저장 */
  const saveAlert = useCallback((types) => {
    authFetch(`/api/alerts/${ticker}`, {
      method: 'POST',
      body: JSON.stringify({ types }),
    }).catch(() => {});
  }, [ticker]);

  /* 벨 버튼 클릭 */
  const handleBellClick = () => {
    if (alertOn) {
      setPopover(v => !v);
    } else {
      if (!tgRegistered) { setTgPopup(true); return; }
      setAlertOn(true);
      setPopover(true);
      saveAlert(enabledTypes);
    }
  };

  /* 텔레그램 등록 완료 후 */
  const handleTgRegistered = () => {
    setTgRegistered(true);
    setTgPopup(false);
    setAlertOn(true);
    setPopover(true);
    saveAlert(enabledTypes);
  };

  /* 유형 토글 */
  const handleToggleType = (type) => {
    const next = enabledTypes.includes(type)
      ? enabledTypes.filter(t => t !== type)
      : [...enabledTypes, type];
    setEnabledTypes(next);
    saveAlert(next);
  };

  /* 알림 끄기 */
  const handleTurnOff = () => {
    setAlertOn(false);
    setPopover(false);
    authFetch(`/api/alerts/${ticker}`, { method: 'DELETE' }).catch(() => {});
  };

  return (
    <div className="stock-page">

      {/* 상단 네비 */}
      <div className="stock-nav">
        <div className="stock-nav__left">
          <button className="stock-back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={17} />
          </button>
          <div>
            <div className="stock-nav__name">{meta.name}</div>
            <div className="stock-nav__ticker">{ticker}</div>
          </div>
        </div>

        {/* 알림 버튼 */}
        <div className="stock-alert-wrap">
          <button
            className={`stock-alert-btn${alertOn ? ' stock-alert-btn--on' : ''}`}
            onClick={handleBellClick}
          >
            {alertOn ? <Bell size={14} fill="currentColor" /> : <Bell size={14} />}
            {alertOn ? '알림 ON' : '알림 설정'}
          </button>
          {tgPopup && (
            <TelegramRegisterPopup
              onRegistered={handleTgRegistered}
              onClose={() => setTgPopup(false)}
            />
          )}
          {alertOn && popoverOpen && (
            <AlertPopover
              enabledTypes={enabledTypes}
              onToggle={handleToggleType}
              onTurnOff={handleTurnOff}
              onClose={() => setPopover(false)}
            />
          )}
        </div>
      </div>

      {/* 가격 헤더 */}
      <div className="stock-price-header">
        <div className="stock-price-main">
          <span className="stock-price-value">${meta.price.toLocaleString()}</span>
          <span className={`stock-price-change ${up ? 'up' : 'down'}`}>
            {up ? '+' : ''}{change.toFixed(2)}&nbsp;
            ({up ? '+' : ''}{changePct.toFixed(2)}%)
          </span>
        </div>
        <div className="stock-price-stats">
          {[
            { label: '전일 종가', value: `$${meta.prevClose.toLocaleString()}` },
            { label: '기간 고가', value: `$${Math.max(...prices).toLocaleString()}` },
            { label: '기간 저가', value: `$${Math.min(...prices).toLocaleString()}` },
            { label: '거래량',    value: data.at(-1)?.volume.toLocaleString() ?? '—' },
          ].map(s => (
            <div key={s.label} className="stock-price-stat">
              <span className="stock-price-stat__label">{s.label}</span>
              <span className="stock-price-stat__value">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 차트 카드 */}
      <div className="stock-chart-card">

        {/* 기간 탭 */}
        <div className="stock-period-tabs">
          {Object.keys(PERIODS).map(p => (
            <button
              key={p}
              className={`stock-period-tab${period === p ? ' stock-period-tab--active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* 가격 차트 */}
        <div className="stock-chart-body">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} syncId="stock" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={up ? '#22C55E' : '#EF4444'} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={up ? '#22C55E' : '#EF4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" interval={tickInterval}
                tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[pMin - pPad, pMax + pPad]}
                tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}`}
                tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={58} />
              <Tooltip content={<PriceTooltip />}
                cursor={{ stroke: 'var(--text-3)', strokeWidth: 1, strokeDasharray: '4 3' }} />
              <Area type="monotone" dataKey="close"
                stroke={up ? '#22C55E' : '#EF4444'} strokeWidth={2}
                fill="url(#pg)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 구분 */}
        <div className="stock-chart-divider" />
        <div className="stock-vol-label">거래량</div>

        {/* 거래량 차트 */}
        <div className="stock-vol-body">
          <ResponsiveContainer width="100%" height={72}>
            <BarChart data={data} syncId="stock" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`}
                tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={58} />
              <Tooltip content={<VolumeTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="volume" radius={[2, 2, 0, 0]} maxBarSize={10}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.close >= d.open ? '#86EFAC' : '#FCA5A5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 종목 정보 */}
      <div className="stock-info-card">
        <div className="stock-info-card__title">종목 정보</div>
        <div className="stock-info-grid">
          {[
            { label: '전일 종가',   value: `$${meta.prevClose.toLocaleString()}` },
            { label: '시가',        value: `$${data[0]?.open.toLocaleString() ?? '—'}` },
            { label: '고가',        value: `$${Math.max(...data.map(d => d.high)).toFixed(2)}` },
            { label: '저가',        value: `$${Math.min(...data.map(d => d.low)).toFixed(2)}` },
            { label: '거래량',      value: data.at(-1)?.volume.toLocaleString() ?? '—' },
            { label: '기간 최고',   value: `$${pMax.toLocaleString()}` },
            { label: '기간 최저',   value: `$${pMin.toLocaleString()}` },
            { label: '등락률',      value: `${up ? '+' : ''}${changePct.toFixed(2)}%`,
              style: { color: up ? 'var(--green)' : 'var(--red)' } },
          ].map(item => (
            <div key={item.label} className="stock-info-item">
              <div className="stock-info-item__label">{item.label}</div>
              <div className="stock-info-item__value" style={item.style}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

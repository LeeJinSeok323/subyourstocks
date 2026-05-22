import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell } from 'lucide-react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { authFetch } from '../../hooks/useAuth';
import './stock.css';

const SEC_TYPES = [
  { type: '8-K',     desc: '중요 이벤트' },
  { type: '10-K',    desc: '연간 보고서' },
  { type: '10-Q',    desc: '분기 보고서' },
  { type: 'S-1',     desc: '상장 신청'   },
  { type: 'DEF 14A', desc: '주주총회'    },
  { type: 'Form 4',  desc: '내부자 거래' },
];
const DEFAULT_TYPES = ['8-K', '10-K'];

const INTERVALS = [
  { label: '5분',  value: '5m',   group: 'min' },
  { label: '10분', value: '10m',  group: 'min' },
  { label: '15분', value: '15m',  group: 'min' },
  { label: '60분', value: '60m',  group: 'min' },
  { label: '240분',value: '240m', group: 'min' },
  { label: '일',   value: '1d',   group: 'day' },
  { label: '주',   value: '1w',   group: 'day' },
  { label: '월',   value: '1M',   group: 'day' },
  { label: '년',   value: '1y',   group: 'day' },
];

/* ── 캔들+거래량 차트 ── */
function CandleChart({ ticker, interval }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94A3B8',
      },
      grid: {
        vertLines: { color: 'rgba(148,163,184,0.08)' },
        horzLines:  { color: 'rgba(148,163,184,0.08)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(148,163,184,0.15)' },
      timeScale: {
        borderColor: 'rgba(148,163,184,0.15)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const d = new Date(time * 1000);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        },
      },
      localization: {
        timeFormatter: (time) => {
          const d = new Date(time * 1000);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const h = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return `${y}-${m}-${day} ${h}:${min}`;
        },
      },
      height: 380,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:   '#EF4444',
      downColor: '#3B82F6',
      borderUpColor:   '#EF4444',
      borderDownColor: '#3B82F6',
      wickUpColor:   '#EF4444',
      wickDownColor: '#3B82F6',
      priceScaleId: 'right',
    });

    const volSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: 'vol',
      priceFormat: { type: 'volume' },
    });

    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volRef.current = volSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  useEffect(() => {
    if (!candleRef.current || !volRef.current) return;

    authFetch(`/api/stocks/${ticker}/candles?interval=${interval}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;

        const candles = data.map(d => ({
          time:  Number(d.time),
          open:  Number(d.open),
          high:  Number(d.high),
          low:   Number(d.low),
          close: Number(d.close),
        }));

        const volumes = data.map(d => ({
          time:  Number(d.time),
          value: Number(d.volume),
          color: Number(d.close) >= Number(d.open)
            ? 'rgba(239,68,68,0.4)'
            : 'rgba(59,130,246,0.4)',
        }));

        candleRef.current.setData(candles);
        volRef.current.setData(volumes);
        chartRef.current.timeScale().fitContent();
      })
      .catch(() => {});
  }, [ticker, interval]);

  return <div ref={containerRef} className="stock-candle-container" />;
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
          <button className="alert-popover__off-btn" onClick={onTurnOff}>알림 끄기</button>
        </div>
      </div>
    </>
  );
}

/* ── 메인 ── */
export default function StockPage() {
  const { ticker } = useParams();
  const navigate   = useNavigate();

  const [interval, setInterval]         = useState('1d'); // eslint-disable-line no-unused-vars
  const [meta, setMeta]                 = useState(null);
  const [alertOn, setAlertOn]           = useState(false);
  const [popoverOpen, setPopover]       = useState(false);
  const [enabledTypes, setEnabledTypes] = useState(DEFAULT_TYPES);
  const [tgRegistered, setTgRegistered] = useState(true);
  const [tgPopup, setTgPopup]           = useState(false);

  /* 종목 메타 + 알림 상태 로드 */
  useEffect(() => {
    authFetch(`/api/stocks/search?q=${ticker}`)
      .then(r => r.json())
      .then(data => {
        const found = Array.isArray(data) && data.find(s => s.ticker === ticker);
        if (found) setMeta({ name: found.company_name, exchange: found.exchange });
      })
      .catch(() => {});

    authFetch(`/api/alerts/${ticker}`)
      .then(r => r.json())
      .then(d => { if (d.active) { setAlertOn(true); setEnabledTypes(d.types ?? DEFAULT_TYPES); } })
      .catch(() => {});

    authFetch('/api/telegram/status')
      .then(r => r.json())
      .then(d => setTgRegistered(d.registered))
      .catch(() => {});
  }, [ticker]);

  const saveAlert = useCallback((types) => {
    authFetch(`/api/alerts/${ticker}`, {
      method: 'POST',
      body: JSON.stringify({ types }),
    }).catch(() => {});
  }, [ticker]);

  const handleBellClick = () => {
    if (alertOn) { setPopover(v => !v); }
    else {
      if (!tgRegistered) { setTgPopup(true); return; }
      setAlertOn(true); setPopover(true); saveAlert(enabledTypes);
    }
  };

  const handleTgRegistered = () => {
    setTgRegistered(true); setTgPopup(false);
    setAlertOn(true); setPopover(true); saveAlert(enabledTypes);
  };

  const handleToggleType = (type) => {
    const next = enabledTypes.includes(type)
      ? enabledTypes.filter(t => t !== type)
      : [...enabledTypes, type];
    setEnabledTypes(next); saveAlert(next);
  };

  const handleTurnOff = () => {
    setAlertOn(false); setPopover(false);
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
            <div className="stock-nav__name">{meta?.name ?? ticker}</div>
            <div className="stock-nav__ticker">{ticker} {meta?.exchange && <span className="stock-nav__exch">{meta.exchange}</span>}</div>
          </div>
        </div>

        <div className="stock-alert-wrap">
          <button
            className={`stock-alert-btn${alertOn ? ' stock-alert-btn--on' : ''}`}
            onClick={handleBellClick}
          >
            {alertOn ? <Bell size={14} fill="currentColor" /> : <Bell size={14} />}
            {alertOn ? '알림 ON' : '알림 설정'}
          </button>
          {tgPopup && <TelegramRegisterPopup onRegistered={handleTgRegistered} onClose={() => setTgPopup(false)} />}
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

      {/* 차트 카드 */}
      <div className="stock-chart-card">
        {/* 기간 탭 */}
        <div className="stock-interval-tabs">
          {INTERVALS.map(iv => (
            <button
              key={iv.value}
              className={`stock-interval-tab${interval === iv.value ? ' stock-interval-tab--active' : ''}`}
              onClick={() => setInterval(iv.value)}
            >
              {iv.label}
            </button>
          ))}
        </div>

        <CandleChart ticker={ticker} interval={interval} />
      </div>
    </div>
  );
}

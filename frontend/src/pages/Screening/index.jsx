import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw, TrendingUp, BarChart2, SlidersHorizontal, X } from 'lucide-react';
import { authFetch } from '../../hooks/useAuth';
import './screening.css';

/* ── Preset 정의 ── */
const PRESETS = [
  { id: 'price',    label: '급등주',     icon: <TrendingUp size={13} />, desc: '단기 가격 급등 종목' },
  { id: 'volume',   label: '거래량 급증', icon: <BarChart2 size={13} />,  desc: '평균 대비 거래량 급증' },
  { id: 'new-high', label: '신고가',      icon: null, desc: '52주 신고가 종목', disabled: true },
  { id: 'low-per',  label: '저PER',       icon: null, desc: 'PER 10 이하',      disabled: true },
];

const DEFAULT_PARAMS = {
  price:  { days: 20, minChangePercent: 10.0, limit: 50 },
  volume: { days: 5,  minVolumeRatio: 3.0,    limit: 50 },
};

/* 6자리 숫자 → 국내, 그 외 → 해외 */
const inferMarket = ticker => /^\d{6}$/.test(ticker) ? 'kr' : 'us';

/* ── 정렬 아이콘 ── */
function SortIcon({ col, sortKey, sortDir }) {
  return sortKey === col
    ? <span style={{ color: 'var(--primary)' }}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
    : <span style={{ opacity: 0.3 }}> ↕</span>;
}

/* ── 숫자 입력: 포커스 시 전체 선택, 빈값 → 0, 앞자리 0 제거 ── */
function NumInput({ value, onChange, isFloat = false, ...props }) {
  return (
    <input
      {...props}
      type="number"
      className="scr-input"
      value={value}
      onFocus={e => e.target.select()}
      onChange={e => {
        const raw = e.target.value;
        if (raw === '') { onChange(0); return; }
        const num = isFloat ? parseFloat(raw) : parseInt(raw, 10);
        if (!isNaN(num)) onChange(num);
      }}
    />
  );
}

/* ── 상세 검색 패널 ── */
function AdvancedPanel({ params, activePresets, onChangeParam, onClose }) {
  return (
    <div className="scr-adv-backdrop" onClick={onClose}>
      <div className="scr-adv-panel" onClick={e => e.stopPropagation()}>
        <div className="scr-adv-panel__header">
          <span className="scr-adv-panel__title">상세 검색 조건</span>
          <button className="scr-adv-panel__close" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="scr-adv-panel__body">
          {activePresets.has('price') && (
            <div className="scr-adv-group">
              <div className="scr-adv-group__name">📈 급등주</div>
              <div className="scr-adv-row">
                <label>기간</label>
                <NumInput min={1} max={365}
                  value={params.price.days}
                  onChange={v => onChangeParam('price', 'days', v)} />
                <span>일</span>
              </div>
              <div className="scr-adv-row">
                <label>최소 변동률</label>
                <NumInput min={0} step={0.5} isFloat
                  value={params.price.minChangePercent}
                  onChange={v => onChangeParam('price', 'minChangePercent', v)} />
                <span>%</span>
              </div>
              <div className="scr-adv-row">
                <label>최대 결과 수</label>
                <NumInput min={10} max={200} step={10}
                  value={params.price.limit}
                  onChange={v => onChangeParam('price', 'limit', v)} />
                <span>건</span>
              </div>
            </div>
          )}

          {activePresets.has('volume') && (
            <div className="scr-adv-group">
              <div className="scr-adv-group__name">📊 거래량 급증</div>
              <div className="scr-adv-row">
                <label>기간</label>
                <NumInput min={1} max={30}
                  value={params.volume.days}
                  onChange={v => onChangeParam('volume', 'days', v)} />
                <span>일</span>
              </div>
              <div className="scr-adv-row">
                <label>최소 배율</label>
                <NumInput min={1} step={0.5} isFloat
                  value={params.volume.minVolumeRatio}
                  onChange={v => onChangeParam('volume', 'minVolumeRatio', v)} />
                <span>x</span>
              </div>
              <div className="scr-adv-row">
                <label>최대 결과 수</label>
                <NumInput min={10} max={200} step={10}
                  value={params.volume.limit}
                  onChange={v => onChangeParam('volume', 'limit', v)} />
                <span>건</span>
              </div>
            </div>
          )}

          {activePresets.size === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '8px 0' }}>
              활성화된 조건이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 메인 ── */
export default function Screening() {
  const navigate = useNavigate();
  const [activePresets, setActivePresets] = useState(new Set(['price', 'volume']));
  const [params, setParams]     = useState(DEFAULT_PARAMS);
  const [market, setMarket]     = useState('all');
  const [advOpen, setAdvOpen]   = useState(false);
  const [sortKey, setSortKey]   = useState('change_pct');
  const [sortDir, setSortDir]   = useState('desc');
  const [rawRows, setRawRows]   = useState([]);
  const [loading, setLoading]   = useState(false);

  const doFetch = useCallback(async (presets, p) => {
    if (presets.size === 0) { setRawRows([]); return; }
    setLoading(true);
    const merged = {};
    try {
      if (presets.has('price')) {
        const { days, minChangePercent, limit } = p.price;
        const res  = await authFetch(`/api/screening/price?days=${days}&minChangePercent=${minChangePercent}&limit=${limit}`);
        const data = await res.json();
        (Array.isArray(data) ? data : []).forEach(r => {
          merged[r.ticker] = { ...merged[r.ticker], ticker: r.ticker,
            change_pct: r.change_percent ?? 0, last_date: r.last_date,
            tags: [...(merged[r.ticker]?.tags ?? []), 'price'] };
        });
      }
      if (presets.has('volume')) {
        const { days, minVolumeRatio, limit } = p.volume;
        const res  = await authFetch(`/api/screening/volume?days=${days}&minVolumeRatio=${minVolumeRatio}&limit=${limit}`);
        const data = await res.json();
        (Array.isArray(data) ? data : []).forEach(r => {
          merged[r.ticker] = { ...merged[r.ticker], ticker: r.ticker,
            volume_ratio: r.volume_ratio ?? 0, last_date: r.last_date,
            tags: [...(merged[r.ticker]?.tags ?? []), 'volume'] };
        });
      }
      setRawRows(Object.values(merged).map(r => ({
        ...r,
        change_pct:   r.change_pct   ?? 0,
        volume_ratio: r.volume_ratio ?? 0,
        market: inferMarket(r.ticker),
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 프리셋 토글 시 자동 재조회
  useEffect(() => { doFetch(activePresets, params); }, [activePresets]); // eslint-disable-line

  const togglePreset = useCallback((id) => {
    setActivePresets(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const setParam = useCallback((presetId, key, value) => {
    setParams(prev => ({ ...prev, [presetId]: { ...prev[presetId], [key]: value } }));
  }, []);

  const handleReset = () => {
    const defaultPresets = new Set(['price', 'volume']);
    setActivePresets(defaultPresets);
    setParams(DEFAULT_PARAMS);
    setMarket('all');
    doFetch(defaultPresets, DEFAULT_PARAMS);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const rows = rawRows
    .filter(r => market === 'all' || r.market === market)
    .sort((a, b) => (sortDir === 'asc' ? 1 : -1) * (a[sortKey] - b[sortKey]));

  return (
    <div>
      {/* 헤더 */}
      <div className="scr-header">
        <div className="scr-header__title">
          <h1>조건 검색</h1>
          <p>Preset 조건을 조합해 종목을 스크리닝하세요.</p>
        </div>
        <div className="scr-header__actions">
          <button className="scr-btn" onClick={() => setAdvOpen(true)} title="상세 조건 설정">
            <SlidersHorizontal size={14} /> 상세 검색
          </button>
          <button className="scr-btn" onClick={handleReset}>
            <RotateCcw size={14} /> 초기화
          </button>
          <button className="scr-btn scr-btn--primary" onClick={() => doFetch(activePresets, params)} disabled={loading}>
            <Search size={14} /> {loading ? '조회 중...' : '검색'}
          </button>
        </div>
      </div>

      {/* Preset 칩 + 마켓 필터 */}
      <div className="scr-presets">
        <div className="scr-presets__row">
          <div className="scr-presets__chips">
            {PRESETS.map(p => (
              <button
                key={p.id}
                className={`scr-chip${activePresets.has(p.id) ? ' scr-chip--active' : ''}${p.disabled ? ' scr-chip--disabled' : ''}`}
                onClick={() => !p.disabled && togglePreset(p.id)}
                title={p.desc}
              >
                {activePresets.has(p.id) && <span className="scr-chip__dot" />}
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>

          <div className="scr-market-filter">
            {[
              { value: 'all', label: '전체' },
              { value: 'us',  label: '🇺🇸 해외' },
              { value: 'kr',  label: '🇰🇷 국내' },
            ].map(m => (
              <button
                key={m.value}
                className={`scr-market-btn${market === m.value ? ' scr-market-btn--active' : ''}`}
                onClick={() => setMarket(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 결과 테이블 */}
      <div className="scr-results">
        <div className="scr-results__bar">
          <span className="scr-results__count">
            결과 <strong>{rows.length}건</strong>
          </span>
          <select className="scr-select" value={`${sortKey}_${sortDir}`} onChange={e => {
            const [k, d] = e.target.value.split('_');
            setSortKey(k); setSortDir(d);
          }}>
            <option value="change_pct_desc">변동률 높은순</option>
            <option value="change_pct_asc">변동률 낮은순</option>
            <option value="volume_ratio_desc">거래량배율 높은순</option>
            <option value="volume_ratio_asc">거래량배율 낮은순</option>
          </select>
        </div>

        {activePresets.size === 0 ? (
          <div className="scr-empty">조건을 하나 이상 선택하세요.</div>
        ) : loading ? (
          <div className="scr-empty">조회 중...</div>
        ) : rows.length === 0 ? (
          <div className="scr-empty">조건에 맞는 종목이 없습니다.</div>
        ) : (
          <div className="scr-table-scroll">
            <table className="scr-table">
              <thead>
                <tr>
                  <th>종목</th>
                  <th className={sortKey === 'change_pct' ? 'sorted' : ''} onClick={() => handleSort('change_pct')}>
                    변동률<SortIcon col="change_pct" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={sortKey === 'volume_ratio' ? 'sorted' : ''} onClick={() => handleSort('volume_ratio')}>
                    거래량 배율<SortIcon col="volume_ratio" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th>최종일</th>
                  <th>조건</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.ticker} onClick={() => navigate(`/stock/${row.ticker}`)}>
                    <td>
                      <div className="scr-ticker">{row.name}</div>
                      <div className="scr-name">{row.ticker}</div>
                    </td>
                    <td className={row.change_pct >= 0 ? 'up' : 'down'}>
                      {row.change_pct >= 0 ? '+' : ''}{row.change_pct.toFixed(2)}%
                    </td>
                    <td>{row.volume_ratio.toFixed(1)}x</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{row.last_date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {row.tags.includes('price')  && <span className="scr-badge scr-badge--price">급등</span>}
                        {row.tags.includes('volume') && <span className="scr-badge scr-badge--volume">거래량</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상세 검색 패널 */}
      {advOpen && (
        <AdvancedPanel
          params={params}
          activePresets={activePresets}
          onChangeParam={setParam}
          onClose={() => setAdvOpen(false)}
        />
      )}
    </div>
  );
}

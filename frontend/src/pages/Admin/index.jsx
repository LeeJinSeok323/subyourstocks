import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../hooks/useAuth';
import './admin.css';

const STATUS_LABEL = {
  PENDING:  { text: '대기 중',  icon: Clock,        cls: 'status--pending'  },
  APPROVED: { text: '승인됨',   icon: CheckCircle,  cls: 'status--approved' },
  REJECTED: { text: '거절됨',   icon: XCircle,      cls: 'status--rejected' },
};

export default function AdminPage() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');   // ALL | PENDING | APPROVED | REJECTED
  const [busy, setBusy]       = useState(null);    // 처리 중인 id

  const load = async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/admin/applications');
      const data = await res.json();
      setList(data);
    } catch {
      /* 에러 처리 생략 */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    setBusy(id);
    try {
      await authFetch(`/api/admin/${action}/${id}`, { method: 'POST' });
      setList((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : u
        )
      );
    } finally {
      setBusy(null);
    }
  };

  const filtered = filter === 'ALL' ? list : list.filter((u) => u.status === filter);
  const counts   = {
    ALL:      list.length,
    PENDING:  list.filter((u) => u.status === 'PENDING').length,
    APPROVED: list.filter((u) => u.status === 'APPROVED').length,
    REJECTED: list.filter((u) => u.status === 'REJECTED').length,
  };

  return (
    <div className="admin-page">
      {/* 헤더 */}
      <div className="admin-header">
        <div className="admin-title-row">
          <ShieldCheck size={20} className="admin-title-icon" />
          <h1 className="admin-title">가입신청 관리</h1>
        </div>
        <button className="admin-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          새로고침
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="admin-filters">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
          <button
            key={f}
            className={`admin-filter${filter === f ? ' admin-filter--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? '전체' : STATUS_LABEL[f].text}
            <span className="admin-filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="admin-loading">불러오는 중…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">신청 내역이 없습니다.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>아이디</th>
                <th>신청일시</th>
                <th>신청 메시지</th>
                <th>상태</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const s = STATUS_LABEL[u.status] ?? STATUS_LABEL.PENDING;
                const Icon = s.icon;
                return (
                  <tr key={u.id}>
                    <td className="admin-td-username">{u.username}</td>
                    <td className="admin-td-date">{u.createdAt?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="admin-td-msg">
                      {u.message || <span className="admin-no-msg">-</span>}
                    </td>
                    <td>
                      <span className={`admin-status ${s.cls}`}>
                        <Icon size={13} />
                        {s.text}
                      </span>
                    </td>
                    <td>
                      {u.status === 'PENDING' ? (
                        <div className="admin-actions">
                          <button
                            className="admin-btn admin-btn--approve"
                            onClick={() => handleAction(u.id, 'approve')}
                            disabled={busy === u.id}
                          >
                            승인
                          </button>
                          <button
                            className="admin-btn admin-btn--reject"
                            onClick={() => handleAction(u.id, 'reject')}
                            disabled={busy === u.id}
                          >
                            거절
                          </button>
                        </div>
                      ) : (
                        <span className="admin-processed">처리 완료</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Eye, EyeOff, LogIn, SendHorizonal, CheckCircle } from 'lucide-react';
import { setAuth } from '../../hooks/useAuth';
import './login.css';

/* ── 비밀번호 유효성 검사 ── */
function validatePassword(pw) {
  if (pw.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw))
    return '특수문자(!@#$% 등)를 1개 이상 포함해야 합니다.';
  return null;
}

/* ── 로그인 폼 ── */
function LoginForm() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [autoLogin, setAutoLogin] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, autoLogin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '로그인에 실패했습니다.'); return; }
      setAuth(data.token, data.username, data.role, autoLogin);
      navigate('/', { replace: true });
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="login-field">
        <label htmlFor="l-username">아이디</label>
        <input
          id="l-username" name="username" type="text"
          placeholder="아이디를 입력하세요"
          value={form.username} onChange={handleChange}
          autoComplete="username" required
        />
      </div>

      <div className="login-field">
        <label htmlFor="l-password">비밀번호</label>
        <div className="login-pw-wrap">
          <input
            id="l-password" name="password"
            type={showPw ? 'text' : 'password'}
            placeholder="비밀번호를 입력하세요"
            value={form.password} onChange={handleChange}
            autoComplete="current-password" required
          />
          <button type="button" className="login-pw-toggle"
            onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* 자동 로그인 체크박스 */}
      <label className="login-remember">
        <input
          type="checkbox"
          checked={autoLogin}
          onChange={(e) => setAutoLogin(e.target.checked)}
        />
        <span>자동 로그인 (30일)</span>
      </label>

      {error && <p className="login-error">{error}</p>}

      <button type="submit" className="login-btn" disabled={loading}>
        <LogIn size={15} />
        {loading ? '로그인 중…' : '로그인'}
      </button>
    </form>
  );
}

/* ── 회원가입 폼 ── */
function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ username: '', password: '', confirm: '', message: '' });
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [pwError, setPwError] = useState('');
  const [cfError, setCfError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'password') {
      setPwError(validatePassword(value) ?? '');
      setCfError(form.confirm && value !== form.confirm ? '비밀번호가 일치하지 않습니다.' : '');
    }
    if (name === 'confirm') {
      setCfError(value !== form.password ? '비밀번호가 일치하지 않습니다.' : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pwErr = validatePassword(form.password);
    if (pwErr) { setPwError(pwErr); return; }
    if (form.password !== form.confirm) { setCfError('비밀번호가 일치하지 않습니다.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: form.username, password: form.password, message: form.message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '가입신청에 실패했습니다.'); return; }
      onSuccess();
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {/* 아이디 */}
      <div className="login-field">
        <label htmlFor="r-username">아이디</label>
        <input
          id="r-username" name="username" type="text"
          placeholder="사용할 아이디를 입력하세요"
          value={form.username} onChange={handleChange}
          autoComplete="username" required
        />
      </div>

      {/* 비밀번호 */}
      <div className="login-field">
        <label htmlFor="r-password">비밀번호 <span className="login-hint">(8자 이상, 특수문자 포함)</span></label>
        <div className="login-pw-wrap">
          <input
            id="r-password" name="password"
            type={showPw ? 'text' : 'password'}
            placeholder="비밀번호를 입력하세요"
            value={form.password} onChange={handleChange}
            autoComplete="new-password" required
          />
          <button type="button" className="login-pw-toggle"
            onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {pwError && <span className="login-field-error">{pwError}</span>}
      </div>

      {/* 비밀번호 확인 */}
      <div className="login-field">
        <label htmlFor="r-confirm">비밀번호 확인</label>
        <div className="login-pw-wrap">
          <input
            id="r-confirm" name="confirm"
            type={showCf ? 'text' : 'password'}
            placeholder="비밀번호를 다시 입력하세요"
            value={form.confirm} onChange={handleChange}
            autoComplete="new-password" required
          />
          <button type="button" className="login-pw-toggle"
            onClick={() => setShowCf((v) => !v)} tabIndex={-1}>
            {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {cfError && <span className="login-field-error">{cfError}</span>}
      </div>

      {/* 가입신청 메시지 (선택) */}
      <div className="login-field">
        <label htmlFor="r-message">
          가입신청 메시지 <span className="login-hint">(선택)</span>
        </label>
        <textarea
          id="r-message" name="message"
          placeholder="관리자에게 전달할 메시지를 입력하세요 (미입력 가능)"
          value={form.message} onChange={handleChange}
          className="login-textarea"
          rows={3}
        />
      </div>

      {error && <p className="login-error">{error}</p>}

      <button type="submit" className="login-btn" disabled={loading}>
        <SendHorizonal size={15} />
        {loading ? '신청 중…' : '가입신청'}
      </button>
    </form>
  );
}

/* ── 메인 로그인/회원가입 페이지 ── */
export default function LoginPage() {
  const [tab, setTab]         = useState('login');
  const [registered, setRegistered] = useState(false);

  const handleRegisterSuccess = () => {
    setRegistered(true);
    setTab('login');
    // 3초 후 메시지 숨김
    setTimeout(() => setRegistered(false), 6000);
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* 로고 */}
        <div className="login-logo">
          <LineChart size={24} className="login-logo__icon" />
          <span className="login-logo__text">StockScreener</span>
        </div>

        {/* 탭 */}
        <div className="login-tabs">
          <button
            className={`login-tab${tab === 'login' ? ' login-tab--active' : ''}`}
            onClick={() => setTab('login')}
          >
            로그인
          </button>
          <button
            className={`login-tab${tab === 'register' ? ' login-tab--active' : ''}`}
            onClick={() => setTab('register')}
          >
            회원가입 신청
          </button>
        </div>

        {/* 가입신청 완료 배너 */}
        {registered && (
          <div className="login-success">
            <CheckCircle size={16} />
            가입신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.
          </div>
        )}

        {tab === 'login'
          ? <LoginForm />
          : <RegisterForm onSuccess={handleRegisterSuccess} />
        }

      </div>
    </div>
  );
}

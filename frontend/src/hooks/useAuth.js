/**
 * 인증 상태 관리
 * - 자동 로그인: 쿠키 30일 저장
 * - 일반 로그인: sessionStorage (탭/브라우저 닫으면 사라짐)
 */

const COOKIE_KEY   = 'stocker_session';
const SESSION_KEY  = 'stocker_session';

/* ── 쿠키 유틸 ── */
function setCookie(value, days) {
  document.cookie =
    `${COOKIE_KEY}=${encodeURIComponent(value)}; max-age=${days * 24 * 60 * 60}; path=/; SameSite=Strict`;
}

function getCookie() {
  const match = document.cookie.match(new RegExp('(^| )' + COOKIE_KEY + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie() {
  document.cookie = `${COOKIE_KEY}=; max-age=0; path=/`;
}

/* ── 저장된 인증 데이터 읽기 (쿠키 우선, 없으면 sessionStorage) ── */
function getAuthData() {
  try {
    const raw = getCookie() || sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** JWT 토큰 반환 */
export function getToken()  { return getAuthData()?.token    ?? null; }

/** 유저명 반환 */
export function getUser()   { return getAuthData()?.username ?? null; }

/** role 반환: 'USER' | 'ADMIN' | null */
export function getRole()   { return getAuthData()?.role     ?? null; }

/**
 * 로그인 성공 시 저장
 * @param {boolean} autoLogin - true면 쿠키 30일, false면 sessionStorage
 */
export function setAuth(token, username, role, autoLogin = false) {
  const data = JSON.stringify({ token, username, role });
  if (autoLogin) {
    setCookie(data, 30);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, data);
    deleteCookie();
  }
}

/** 로그아웃 */
export function clearAuth() {
  deleteCookie();
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * JWT를 Authorization 헤더에 자동으로 붙여주는 fetch 래퍼
 */
export function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

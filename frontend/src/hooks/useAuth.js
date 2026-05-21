/**
 * 인증 상태 관리 유틸
 * JWT 토큰, 유저명, role을 localStorage에 저장.
 */

const TOKEN_KEY = 'stocker_token';
const USER_KEY  = 'stocker_user';
const ROLE_KEY  = 'stocker_role';

/** 저장된 JWT 토큰 반환 (없으면 null) */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** 저장된 유저명 반환 (없으면 null) */
export function getUser() {
  return localStorage.getItem(USER_KEY);
}

/** 저장된 role 반환: 'USER' | 'ADMIN' | null */
export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

/** 로그인 성공 시 토큰 + 유저명 + role 저장 */
export function setAuth(token, username, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
  localStorage.setItem(ROLE_KEY, role);
}

/** 로그아웃 — 저장된 인증 정보 전부 삭제 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

/**
 * JWT를 Authorization 헤더에 자동으로 붙여주는 fetch 래퍼.
 * 사용: authFetch('/api/screening/price')
 *       authFetch('/api/admin/applications')
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

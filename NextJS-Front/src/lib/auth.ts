/**
 * JWT 토큰/회원정보 저장 유틸
 * - 초기 구현은 localStorage (XSS 주의, 향후 httpOnly 쿠키 마이그레이션 권장)
 * - 클라이언트 전용
 */

const TOKEN_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const MEMBER_KEY = "memberInfo";

export interface MemberInfo {
  id: number;
  mid: string;
  mname: string;
  email?: string;
  region?: string;
  role?: string;
  profileImg?: string;
  regDate?: string;
}

/**
 * JWT 액세스 토큰과 리프레시 토큰을 로컬 스토리지에 저장합니다.
 * 백엔드에서 쿠키를 전송하는 경우에도 사용될 수 있으나 현재는 localStorage 구현을 사용합니다.
 * @param token 저장할 액세스 토큰
 * @param refresh 저장할 리프레시 토큰 (선택)
 */
export function saveToken(token: string, refresh?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

/**
 * 로컬 스토리지에서 액세스 토큰을 불러옵니다.
 * 서버사이드 렌더링 환경인 경우 null을 반환합니다.
 * @returns 로드된 액세스 토큰 또는 null
 */
export function loadToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function loadRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

/**
 * 토큰 및 회원정보를 로컬 스토리지에서 모두 삭제 (만료/로그아웃 시 호출)
 */
export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(MEMBER_KEY);
}

/**
 * 회원정보 (MemberInfo 객체)를 JSON 문자열로 변환하여 로컬 스토리지에 저장합니다.
 * @param member 저장할 회원정보 객체
 */
export function saveMember(member: MemberInfo): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
}

/**
 * 로컬 스토리지에서 회원정보 JSON을 파싱하여 MemberInfo 객체로 불러옵니다.
 * 데이터가 없거나 파싱 오류가 발생하는 경우 null을 반환합니다.
 * @returns 파싱된 회원정보 객체 또는 null
 */
export function loadMember(): MemberInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MemberInfo;
  } catch {
    return null;
  }
}

/**
 * JWT exp(초 단위 epoch) 파싱 → 남은 ms 반환. 파싱 실패 시 null.
 */
export function getTokenRemainingMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (typeof decoded.exp !== "number") return null;
    return decoded.exp * 1000 - Date.now();
  } catch {
    return null;
  }
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  clearToken,
  getTokenRemainingMs,
  loadMember,
  loadToken,
  MemberInfo,
  saveMember,
  saveToken,
} from "./auth";

/**
 * 전역 인증 컨텍스트가 가지는 값의 타입 정의
 */
interface AuthContextValue {
  token: string | null;  // JWT 토큰
  member: MemberInfo | null; // 현재 로그인한 사용자 정보
  loading: boolean; // 인증 상태 초기화 중 여부
  login: (token: string, member: MemberInfo, refresh?: string) => void; // 로그인 처리 함수
  logout: () => void; // 로그아웃 처리 함수
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * 인증 상태를 관리하고 하위 컴포넌트에 공급하는 Auth Provider 컴포넌트
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 전역 상태 및 로컬 스토리지에서 인증 정보를 삭제하는 로그아웃 함수
  const logout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearToken();
    setToken(null);
    setMember(null);
  }, []);

  const scheduleAutoLogout = useCallback(
    (t: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const remaining = getTokenRemainingMs(t);
      if (remaining === null) return;
      if (remaining <= 0) {
        logout();
        return;
      }
      timerRef.current = setTimeout(() => {
        logout();
        if (typeof window !== "undefined") window.location.href = "/login";
      }, remaining);
    },
    [logout],
  );

  useEffect(() => {
    const t = loadToken();
    const m = loadMember();
    setToken(t);
    setMember(m);
    if (t) scheduleAutoLogout(t);
    setLoading(false);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleAutoLogout]);

  const login = (newToken: string, newMember: MemberInfo, refresh?: string) => {
    saveToken(newToken, refresh);
    saveMember(newMember);
    setToken(newToken);
    setMember(newMember);
    scheduleAutoLogout(newToken);
  };

  return (
    <AuthContext.Provider value={{ token, member, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * AuthContext 값을 쉽게 가져오기 위한 커스텀 훅
 * Provider 내부에서 호출하지 않으면 에러를 발생시킵니다.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

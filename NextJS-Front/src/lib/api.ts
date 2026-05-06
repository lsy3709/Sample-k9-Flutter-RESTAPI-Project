/**
 * axios 인스턴스 + JWT 인터셉터
 *
 * - 요청 시 localStorage 의 accessToken 을 Authorization 헤더에 자동 주입
 * - 401 응답 시 토큰 정리 후 /login 으로 리다이렉트
 */
import axios, { AxiosInstance } from "axios";
import { API_BASE_URL } from "@/constants/api";
import { clearToken, loadToken } from "./auth";

// axios 인스턴스 초기화. 백엔드의 기본 API URL을 baseURL로 설정
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request Interceptor: 모든 API 요청이 전송되기 직전에 실행
// 스토리지에 존재하는 토큰을 파싱하여 HTTP 헤더의 'Authorization'에 삽입
api.interceptors.request.use((config) => {
  const token = loadToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`; // JWT 인증 토큰 첨부
  }
  return config;
});

// Response Interceptor: 응답을 받았을 때 오류를 가로채어 처리
// 401 Unauthorized 오류가 발생하면 토큰이 만료되었거나 유효하지 않으므로 강제 로그아웃 처리
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      clearToken(); // 스토리지의 토큰 파기
      // 로그인 창에 있지 않은 경우에만 /login 경로로 강제 이동 및 인증 정보 초기화
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

/**
 * Spring Framework 의 Page<T> 객체 구조와 인터페이스를 일치시키는 공통 응답 타입
 * 페이징 처리된 데이터를 관리하기 위해 주로 사용됩니다
 */
export interface PageResponse<T> {
  content: T[]; // 실제 데이터 배열
  totalElements: number; // 전체 데이터 항목 수
  totalPages: number; // 전체 페이지 수
  number: number; // 현재 페이지 (0부터 시작)
  size: number; // 페이지 당 항목 사이즈
  first: boolean; // 첫번째 페이지 여부
  last: boolean; // 마지막 페이지 여부
}

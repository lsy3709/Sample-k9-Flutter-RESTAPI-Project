# NextJS-Front Internal Docs

`NextJS-Front`는 Next.js 15 App Router 기반의 웹 프론트엔드이며, `Spring-Back`의 REST API를 그대로 소비하는 클라이언트 레이어다.

## 문서 구성

- `ARCHITECTURE.md`
  - 인증, 라우팅, API 호출, 상태 관리 구조 설명
- `ROUTES_AND_FLOWS.md`
  - 사용자/관리자 화면별 동작 흐름 설명
- `FILE_INDEX.md`
  - 주요 파일별 책임, 연관 API, 읽을 포인트 정리

## 빠른 이해 순서

1. `src/constants/api.ts`
   - 백엔드 연결 기준 URL 계산 방식 확인
2. `src/lib/auth.ts`
   - 토큰/회원정보 저장 방식 확인
3. `src/lib/api.ts`
   - axios 인터셉터와 공통 응답 타입 확인
4. `src/lib/auth-context.tsx`
   - 전역 인증 상태와 자동 로그아웃 구조 확인
5. `src/components/Protected.tsx`
   - 로그인/권한 보호 방식 확인
6. `src/app/layout.tsx`
   - 전역 Provider와 Navbar 연결 확인
7. 각 라우트 페이지
   - 도메인별 UI와 API 연동 방식 확인

## 현재 코드의 큰 특징

- 거의 모든 화면이 `"use client"` 기반 클라이언트 컴포넌트다.
- 인증 정보는 `localStorage`에 저장되고, 새로고침 후 `AuthProvider`가 복구한다.
- API 호출은 `api` axios 인스턴스를 공통 사용하며, JWT는 요청 인터셉터에서 자동 주입된다.
- 관리자 화면과 사용자 화면 모두 별도 BFF 없이 Spring API와 직접 통신한다.
- 페이지네이션은 Spring `Page<T>` 응답 구조를 그대로 받아 사용한다.

# File Index

## Root And Config

- `package.json`
  - 실행, 빌드, 테스트 스크립트 정의
- `next.config.mjs`
  - Next.js 런타임 설정
- `tailwind.config.ts`
  - Tailwind 확장 설정
- `vitest.config.ts`
  - 단위 테스트 실행 환경 설정
- `README.md`
  - 실행 방법과 개발 환경 가이드
- `PLAN.md`
  - 초기 설계 문서와 체크리스트

## App Router

- `src/app/layout.tsx`
  - 전역 레이아웃
  - `AuthProvider`와 `Navbar`를 모든 페이지에 연결
- `src/app/page.tsx`
  - 홈 화면
- `src/app/login/page.tsx`
  - 로그인 플로우 담당
- `src/app/signup/page.tsx`
  - 회원가입 플로우 담당
- `src/app/books/page.tsx`
  - 도서 검색/목록/페이지네이션
- `src/app/books/[id]/page.tsx`
  - 도서 상세/대여 신청
- `src/app/notices/page.tsx`
  - 공지 목록
- `src/app/notices/[id]/page.tsx`
  - 공지 상세
- `src/app/inquiries/page.tsx`
  - 문의 목록과 비밀글 마스킹
- `src/app/inquiries/new/page.tsx`
  - 문의 작성
- `src/app/inquiries/[id]/page.tsx`
  - 문의 상세와 답변 표시
- `src/app/events/page.tsx`
  - 행사 목록/신청
- `src/app/facility/page.tsx`
  - 시설예약 신청 및 내역
- `src/app/mypage/page.tsx`
  - 마이페이지 메인
- `src/app/mypage/edit/page.tsx`
  - 회원정보 수정
- `src/app/mypage/rentals/page.tsx`
  - 내 대여 이력
- `src/app/admin/page.tsx`
  - 관리자 대시보드
- `src/app/admin/members/page.tsx`
  - 회원 관리
- `src/app/admin/books/page.tsx`
  - 도서/대여 관리자 화면
- `src/app/admin/notices/page.tsx`
  - 공지 관리자 화면
- `src/app/admin/inquiries/page.tsx`
  - 문의 답변 관리자 화면
- `src/app/admin/events/page.tsx`
  - 행사 관리자 화면
- `src/app/admin/facility/page.tsx`
  - 시설예약 관리자 화면

## Shared Components

- `src/components/Navbar.tsx`
  - 로그인 상태별 메뉴 분기
  - 관리자 링크 노출
  - 로그아웃 처리
- `src/components/Protected.tsx`
  - 로그인 체크
  - 관리자 권한 체크
  - 리다이렉트 처리

## Core Libraries

- `src/constants/api.ts`
  - API 주소 상수 계산
- `src/lib/auth.ts`
  - 토큰/회원정보 저장 유틸
  - JWT 남은 시간 계산
- `src/lib/api.ts`
  - axios 인스턴스
  - JWT 헤더 주입
  - 401 공통 처리
- `src/lib/auth-context.tsx`
  - 전역 인증 상태
  - 자동 로그아웃 스케줄링
- `src/lib/auth.test.ts`
  - 인증 유틸 단위 테스트

## Types

- `src/types/member.ts`
  - 회원 DTO와 회원가입 payload
- `src/types/book.ts`
  - 도서 DTO와 상태 라벨/색상 맵
- `src/types/notice.ts`
  - 공지 DTO와 첨부 이미지 DTO
- `src/types/inquiry.ts`
  - 문의 DTO와 답변 DTO
- `src/types/event.ts`
  - 행사 DTO와 행사 신청 DTO
- `src/types/rental.ts`
  - 대여 DTO
- `src/types/apply.ts`
  - 시설예약 DTO와 상태 메타데이터

## 읽을 때 보면 좋은 연결 고리

- 인증 흐름
  - `src/app/login/page.tsx`
  - `src/lib/auth-context.tsx`
  - `src/lib/auth.ts`
  - `src/components/Protected.tsx`
- 공통 API 흐름
  - `src/constants/api.ts`
  - `src/lib/api.ts`
- 사용자 개인화 기능
  - `src/app/mypage/*`
  - `src/app/facility/page.tsx`
  - `src/app/events/page.tsx`
- 관리자 기능
  - `src/app/admin/*`

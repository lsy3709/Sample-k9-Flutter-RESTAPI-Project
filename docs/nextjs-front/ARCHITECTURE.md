# Architecture

## 1. 런타임 구조

- 프레임워크: Next.js 15 App Router
- 렌더링 방식: 대부분 클라이언트 컴포넌트
- 스타일링: Tailwind CSS
- HTTP 클라이언트: `axios`
- 인증 상태: React Context (`AuthProvider`)

## 2. 디렉터리 역할

### `src/app`

- App Router 실제 라우트가 위치한다.
- `page.tsx`는 각 URL 엔트리 역할을 한다.
- 사용자 화면과 관리자 화면이 모두 여기에 있다.

### `src/components`

- 여러 페이지가 공통으로 쓰는 UI와 가드 컴포넌트가 있다.
- `Navbar.tsx`: 상단 전역 내비게이션
- `Protected.tsx`: 로그인/권한 보호

### `src/lib`

- 프론트엔드 공통 동작을 담당한다.
- `auth.ts`: 토큰/회원정보 저장, JWT 만료 계산
- `api.ts`: axios 인스턴스, 인터셉터, `PageResponse<T>`
- `auth-context.tsx`: 전역 인증 상태 공급

### `src/constants`

- URL 같은 전역 상수를 관리한다.

### `src/types`

- Spring 응답 DTO를 프론트에서 소비하기 위한 타입 정의 모음이다.

## 3. 인증 흐름

1. 로그인 페이지에서 `AUTH_BASE_URL/generateToken`으로 토큰 발급 요청
2. 토큰 발급 성공 후 `/member/me`로 회원 상세 조회
3. `login()` 호출
4. `login()` 내부에서
   - `saveToken()`
   - `saveMember()`
   - React state 갱신
   - 자동 로그아웃 타이머 설정
5. 이후 모든 API 요청은 `api.ts` 인터셉터가 `Authorization: Bearer ...`를 자동 부착
6. 401 응답이 오면 토큰 제거 후 `/login`으로 이동

## 4. 자동 로그아웃 구조

- `auth.ts`의 `getTokenRemainingMs()`가 JWT payload의 `exp` 값을 읽는다.
- `auth-context.tsx`의 `scheduleAutoLogout()`가 남은 시간을 계산한다.
- 남은 시간이 0 이하이면 즉시 로그아웃한다.
- 남은 시간이 있으면 `setTimeout()`으로 만료 시점에 로그아웃한다.

## 5. 라우트 보호 방식

- `Protected.tsx`는 `useAuth()`를 통해 현재 회원 상태를 읽는다.
- 비로그인 상태면 `/login`으로 리다이렉트한다.
- `requireRole="ADMIN"`이면 관리자 권한도 추가 검사한다.
- 인증 판별 중에는 `확인 중...` 상태 화면을 보여준다.

## 6. API 호출 패턴

코드 전반에서 반복되는 패턴은 아래와 같다.

1. `loading`, `error`, `msg` 상태 선언
2. `useEffect` 또는 `useCallback`으로 데이터 조회 함수 구성
3. 성공 시 목록/상세 state 갱신
4. 실패 시 axios 에러에서 서버 메시지 추출
5. 생성/수정/삭제 후 재조회 또는 페이지 이동

## 7. 페이지네이션 처리

- `PageResponse<T>` 타입은 Spring `Page<T>` 구조를 그대로 반영한다.
- 대부분의 목록 페이지는 `page`, `totalPages`를 state로 가진다.
- 사용자 화면은 이전/다음 버튼 중심이다.
- 관리자 화면 일부는 숫자 페이지 버튼까지 함께 제공한다.

## 8. 상태 관리 성격

- 전역 상태
  - 인증 관련 정보만 `AuthProvider`로 관리
- 지역 상태
  - 각 페이지의 폼 입력값, 로딩, 메시지, 페이지네이션 상태는 컴포넌트 내부 `useState` 사용

즉, 현재 구조는 중앙 집중형 상태관리보다 페이지별 독립성을 우선한 구조다.

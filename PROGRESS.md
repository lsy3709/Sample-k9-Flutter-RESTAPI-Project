# 작업 현황 & 체크리스트 (PROGRESS)

> **📌 작업 전 반드시 이 문서를 먼저 읽고, 작업 후 상태를 갱신한 뒤 커밋하세요.**
>
> 프로젝트 전체(Flutter-Front / Spring-Back / NextJS-Front) 의 진행 상황을
> 한 곳에서 추적하는 **단일 출처(Single Source of Truth)** 문서입니다.

---

## 0. 문서 사용 규칙

1. **세션 시작 시**: 이 파일을 먼저 Read 하여 현재 상황 파악.
2. **작업 중**: "다음 작업 후보" 중 우선순위 높은 항목부터 진행.
3. **작업 완료 시**:
   - 해당 체크박스를 `[x]` 로 전환.
   - "작업 이력" 섹션 상단에 날짜 + 요약 + 커밋 해시 추가.
   - "다음 작업 후보" 갱신 (완료 항목 제거, 새 항목 추가).
4. **커밋 포함**: 본 문서 갱신은 관련 작업 커밋에 함께 포함 (별도 커밋 금지).
5. **범위 질문**: 할 일이 모호하면 "다음 작업 후보" 항목을 기준으로 사용자에게 확인.

---

## 1. 프로젝트 개요

| 영역 | 위치 | 상태 |
|---|---|---|
| 백엔드 (Spring Boot 3 + JPA + MariaDB) | [Spring-Back/SpringBasic/api5012/](Spring-Back/SpringBasic/api5012/) | ✅ 운영 중 |
| 모바일 프론트 (Flutter) | [Flutter-Front/](Flutter-Front/) | ✅ 주요 기능 구현 완료 |
| 웹 프론트 (Next.js 15) | [NextJS-Front/](NextJS-Front/) | 🚧 Phase 0 스캐폴딩 완료, Phase 1 진행 예정 |
| Flask 예측 서비스 | [Flask-Back/](Flask-Back/) | 🔧 보조 (선택) |

### 핵심 연관 문서
- [SETUP.md](SETUP.md) — 프로젝트 클론/포크, 백엔드·Flutter 실행, 에뮬레이터/실기기 IP 주의사항
- [README.md](README.md) — 프로젝트 소개
- [API_DOCS.md](API_DOCS.md) — API 명세
- [FEATURE_FILES.md](FEATURE_FILES.md) — 기능별 파일 매핑
- [docs/ADMIN_FEATURE_FLOW.md](docs/ADMIN_FEATURE_FLOW.md) — 관리자 기능 흐름
- [NextJS-Front/PLAN.md](NextJS-Front/PLAN.md) — Next.js 포팅 기획서 및 Phase 체크리스트
- [NextJS-Front/README.md](NextJS-Front/README.md) — Next.js 실행 가이드

---

## 2. 현재 작업 중

*(현재 활성 작업 없음 — 다음 작업 후보에서 선택)*

---

## 3. 다음 작업 후보 (우선순위 순)

### 🔴 P0 — 즉시 진행 가능 / 기반 검증
- [ ] **Next.js 로컬 검증**: 사용자 로컬에서 `cd NextJS-Front && npm install && npm run dev` 실행 후 오류 확인
- [ ] **로그인 API 스키마 정합성 확인**: Spring `MemberController` 의 `/api/member/login` 실제 요청/응답 필드와 [NextJS-Front/src/app/login/page.tsx](NextJS-Front/src/app/login/page.tsx) 매칭 검증 후 필요 시 수정
- [ ] **CORS 설정 점검**: [CustomSecurityConfig.java](Spring-Back/SpringBasic/api5012/src/main/java/com/busanit501/api5012/config/CustomSecurityConfig.java) 가 `http://localhost:3000` Origin 을 허용하는지 확인

### 🟠 P1 — Next.js Phase 1 (인증 & 홈)
- [ ] `/signup` 페이지 — 회원가입 폼
- [ ] `Navbar.tsx` 공통 컴포넌트 (로그인/로그아웃 토글, 관리자 배지)
- [ ] `Protected.tsx` 인증 가드 컴포넌트
- [ ] JWT 만료 시간 파싱 → 자동 로그아웃 타이머

### 🟡 P2 — Next.js Phase 2 (도서 / 마이페이지)
- [ ] `/books` 검색 바 + 페이지네이션
- [ ] `/books/[id]` 도서 상세 (이미지, 재고, 대여 버튼)
- [ ] 대여 신청 / 반납 API 호출 플로우
- [ ] `/mypage` 내 정보
- [ ] `/mypage/rentals` 대여 이력
- [ ] 프로필 이미지 업로드 (multipart/form-data)

### 🟢 P3 — Next.js Phase 3 (공지/문의/행사)
- [ ] `/notices` 공지 목록 + 상단고정
- [ ] `/notices/[id]` 상세 + 이미지
- [ ] `/inquiries` 목록 (비밀글 마스킹)
- [ ] `/inquiries/new` 작성
- [ ] `/events` 목록 + 신청

### 🔵 P4 — Next.js Phase 4 (관리자)
- [ ] `/admin` 대시보드
- [ ] `/admin/books` 도서 CRUD
- [ ] `/admin/notices` 공지 CRUD + 이미지
- [ ] `/admin/inquiries` 답변
- [ ] `/admin/events` 행사 관리
- [ ] `/admin/members` 회원 관리
- [ ] `/admin/facility` 시설예약 관리

### ⚪ P5 — 부가/선택
- [ ] `/ai` AI 예측 (Flask 연동)
- [ ] 다크모드
- [ ] E2E 테스트 (Playwright)

### 🔧 기술 부채 / 개선
- [ ] Spring `BookDTO` 실제 필드와 [NextJS-Front/src/types/book.ts](NextJS-Front/src/types/book.ts) 재대조
- [ ] JWT 저장소를 localStorage → httpOnly 쿠키로 마이그레이션 (XSS 방어)
- [ ] Next.js 페이지별 Suspense / loading.tsx 추가
- [ ] Flutter 앱의 상수·API 주소를 dotenv 로 분리

---

## 4. 작업 이력 (최신순)

### 2026-04-11 — 작업 현황 문서 추가
- `PROGRESS.md` 신설 (본 문서): 전 영역 체크리스트/이력 통합 관리
- **커밋**: *(이번 작업 커밋 해시로 기록)*

### 2026-04-11 — NextJS-Front 초기 스캐폴딩 (`a80bb67`)
- Next.js 15 (App Router) + TypeScript + Tailwind 프로젝트 구조 생성
- [NextJS-Front/PLAN.md](NextJS-Front/PLAN.md) 기획/Phase 체크리스트, [README.md](NextJS-Front/README.md) 실행 가이드
- 인프라: `constants/api.ts`, `lib/auth.ts`, `lib/api.ts` (axios + JWT 인터셉터), `lib/auth-context.tsx`
- Phase 1 참고 구현: `/` 홈, `/login`, `/books`
- 웹 환경 주의사항 명시: `10.0.2.2` 사용 금지, 로컬 `localhost`, 모바일 브라우저 실기기는 호스트 사설 IP

### 2026-04-11 — .gitignore 정비 & 빌드 산출물 untrack (`3e53205`)
- 루트 `.gitignore` 신설: `.gradle/`, `build/`, `bin/`, `.omc/`, Flutter/Dart 산출물 제외
- 기존 잘못 추적되던 빌드/IDE 캐시 **339 파일** index 에서 제거
- `NoticeServiceImpl` / `InquiryServiceImpl` delete 메서드 중복 코드 정리 (JOIN FETCH + cascade=ALL 만 유지)
- [SETUP.md](SETUP.md) 신설: 클론/포크, 실행, 에뮬 `10.0.2.2`·실기기 사설 IP 주의사항

### 2026-04-11 — Notice/Inquiry 삭제 FK 오류 & 시설예약 초기 로드 (`6e1d514`)
- **백엔드**: `deleteNotice`/`deleteInquiry` 가 `findById` → `findWithImagesById`/`findWithRepliesById` (JOIN FETCH) 로 변경. LAZY 자식 컬렉션을 로딩해야 cascade=ALL + orphanRemoval 이 안전하게 자식 삭제 후 부모 삭제 수행
- **Flutter**: [admin_facility_screen.dart](Flutter-Front/lib/screen/admin/admin_facility_screen.dart) 초기 `_fetchApplies` 를 `WidgetsBinding.instance.addPostFrameCallback` 으로 지연 호출, 캐시 회피 타임스탬프 + `Cache-Control: no-cache`, `List<dynamic>.from(...)` 참조 변경 유도, `mounted` 가드 추가

### 이전 이력 (요약)
- `4a14533` 마이페이지 프로필 이미지 표시 & 내 정보 수정 화면 개선
- `b238972` 4가지 신규 기능 (프로필 이미지, 마이페이지, 관리자 모드, 이벤트 신청)
- `cb7665b` APIUser 제거 및 Member 엔티티로 인증 통합

---

## 5. 알려진 이슈 / 주의사항

1. **Android 에뮬레이터 전용 IP**: `10.0.2.2` 는 **Flutter Android 에뮬레이터에서만** 동작.
   - Flutter 실기기 → 호스트 사설 IP (예: `192.168.x.x`)
   - Next.js 웹 → `localhost` 또는 호스트 사설 IP
   - iOS 시뮬레이터 → `localhost`
2. **JWT 저장**: 현재 Next.js 는 `localStorage` 사용 중. XSS 취약 가능성 인지.
3. **DB 스키마**: `spring.jpa.hibernate.ddl-auto=update` — 엔티티 변경 시 컬럼 삭제는 수동 필요.
4. **CORS**: Next.js dev(`http://localhost:3000`) 가 Spring CORS 허용 목록에 있는지 작업 전 확인.
5. **공용 Wi-Fi AP 격리**: 학교/카페 공유 네트워크는 Client Isolation 이 활성화되어 실기기 테스트가 차단될 수 있음.

---

## 6. 브랜치 / 원격 정보

- **Main 브랜치**: `main`
- **원격**: `https://github.com/lsy3709/Sample-k9-Flutter-RESTAPI-Project.git`
- **작업 방식**: 포크 사용자는 feature 브랜치로 작업 후 PR, 직접 권한자는 main 에 작은 단위 커밋.

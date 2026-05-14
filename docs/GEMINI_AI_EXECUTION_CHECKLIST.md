# Gemini AI 실행 체크리스트

> 작성일: 2026-04-30
> 기준 문서: [GEMINI_AI_PLAN.md](E:\0-sample-flutter-projectt-k9\docs\GEMINI_AI_PLAN.md)
> 대상 범위: `Spring-Back` / `NextJS-Front` / `Flutter-Front`
> 목적: Gemini AI REST 연동 작업을 실제 구현 순서대로 추적하고, 진행할 때마다 체크 상태를 갱신하기 위한 실행 문서

---

## 1. 사용 규칙

- 구현을 시작하거나 완료할 때 이 문서를 함께 갱신한다.
- 체크 상태 기준
  - `[ ]` 미착수
  - `[/]` 진행 중
  - `[x]` 완료
  - `[-]` 보류 또는 범위 외
- 각 Phase마다
  - 현재 상태
  - 다음 작업
  - 검증 방법
  - 관련 파일
  를 함께 적는다.

---

## 2. 현재 상태 스냅샷

### 설계 문서

- [x] Gemini 전체 설계 문서 존재
  - 파일: [GEMINI_AI_PLAN.md](E:\0-sample-flutter-projectt-k9\docs\GEMINI_AI_PLAN.md)

### Spring-Back 현재 상태

- [x] 기존 AI 관련 컨트롤러 존재
  - [AiRestController.java](E:\0-sample-flutter-projectt-k9\Spring-Back\SpringBasic\api5012\src\main\java\com\busanit501\api5012\controller\ai\AiRestController.java)
  - 현재는 기존 이미지 AI 업로드 연동 중심
- [x] 기존 AI 관련 서비스/DTO 일부 존재
  - `service/ai/AiUploadService*`
  - `service/ai/StockPredictionService*`
  - `dto/ai/image/*`
  - `dto/ai/stock/*`
- [ ] Gemini 전용 Controller/Service/DTO는 아직 없음

### NextJS-Front 현재 상태

- [x] 일반 도서관 웹 기능은 구현되어 있음
- [ ] `src/app/ai/*` 라우트는 아직 없음
- [ ] AI 호출 전용 유틸(`lib/ai-api.ts`, `types/ai.ts`) 없음
- [ ] Navbar AI 메뉴 없음

### Flutter-Front 현재 상태

- [x] 기존 AI 탭 존재
  - [ai_tab.dart](E:\0-sample-flutter-projectt-k9\Flutter-Front\lib\screen\tab\ai_tab.dart)
- [x] 기존 AI 이미지/주가 화면 존재
  - [ai_image_screen.dart](E:\0-sample-flutter-projectt-k9\Flutter-Front\lib\screen\ai\image\ai_image_screen.dart)
  - [ai_stock_screen.dart](E:\0-sample-flutter-projectt-k9\Flutter-Front\lib\screen\ai\stock\ai_stock_screen.dart)
- [x] 라우트 등록 존재
  - [my_app.dart](E:\0-sample-flutter-projectt-k9\Flutter-Front\lib\my_app.dart)
- [ ] Gemini 전용 챗봇 / OCR / 멀티모달 화면은 아직 없음

### Notion 참고 링크

- 참고 링크: `https://www.notion.so/34c0741730ea8074adc0e595cc5540d8?source=copy_link`
- 상태: 현재 세션에서는 공개 접근 불가로 내용 직접 확인 불가
- 처리 원칙: 지금은 저장소 내부의 [GEMINI_AI_PLAN.md](E:\0-sample-flutter-projectt-k9\docs\GEMINI_AI_PLAN.md)를 기준 설계서로 사용

---

## 3. 전체 목표 기능

- [ ] F-01 텍스트 챗봇
- [ ] F-02 이미지 인식/분석
- [ ] F-03 명함 OCR
- [ ] F-04 명함 기반 회원 검색
- [ ] F-05 이미지 + 질문 멀티모달 Q&A

---

## 4. 구현 순서 체크리스트

## Phase 0. 작업 기반 정리

### 상태

- [x] 실행 체크리스트 문서 생성
- [x] 기준 설계 문서 연결
- [ ] 이번 작업용 브랜치/커밋 전략 확정
- [ ] 환경 변수 파일 위치와 키 관리 방식 확정

### 다음 작업

- `Spring-Back` Gemini 환경 설정 파일 위치 확정
- `NextJS-Front` AI 프록시 여부 결정
- `Flutter-Front` 기존 AI 화면 재사용 범위 결정

### 관련 파일

- [GEMINI_AI_PLAN.md](E:\0-sample-flutter-projectt-k9\docs\GEMINI_AI_PLAN.md)
- [GEMINI_AI_EXECUTION_CHECKLIST.md](E:\0-sample-flutter-projectt-k9\docs\GEMINI_AI_EXECUTION_CHECKLIST.md)
- [GEMINI_AI_POSTMAN_MULTIMODAL_TEST.md](E:\0-sample-flutter-projectt-k9\docs\GEMINI_AI_POSTMAN_MULTIMODAL_TEST.md)

---

## Phase 1. Spring-Back Gemini 기반 구축

### 상태

- [x] `build.gradle`에 WebClient 의존성 확인/추가
- [x] `application-secret.properties` 템플릿 준비
- [x] `application-secret.properties` 또는 동등 비밀 설정 준비
- [x] Gemini API Key 주입 구조 구성
- [x] `controller/ai/GeminiController.java` 생성
- [x] `service/ai/GeminiService.java` 생성
- [x] `service/ai/GeminiServiceImpl.java` 생성
- [ ] 공통 Gemini 요청/응답 파싱 유틸 정리
- [x] 기본 텍스트 호출 smoke test

### 세부 체크

- [ ] 기존 `AiRestController`와 경로 충돌 없는지 확인
- [x] `@RequestMapping("/api/ai")` 하위 라우트 규칙 확정
- [/] Gemini base URL / model / timeout 설정
- [ ] 예외 처리 정책 정의
- [ ] 로그에 민감정보(API Key, 원본 이미지) 남기지 않게 처리

### 검증

- [x] 애플리케이션 컴파일 확인
- [x] 애플리케이션 기동 확인
- [/] Swagger 또는 Postman으로 health 수준 호출 확인
- [/] Gradle 테스트 확인
  - 결과: 새 Gemini 뼈대는 컴파일 통과
  - 결과: 기존 `SampleDataInsertTest` 2건은 SQL 문법 오류로 실패
- [x] `application-secret.properties` 로딩 경로 수정
  - `spring.config.import=optional:classpath:application-secret.properties,optional:file:./src/main/resources/application-secret.properties,optional:file:application-secret.properties`
  - 결과: `gemini.api.key 설정이 필요합니다.` 오류는 해소됨

### 키 설정 메모

- 템플릿 파일
  - [application-secret.properties.example](E:\0-sample-flutter-projectt-k9\Spring-Back\SpringBasic\api5012\src\main\resources\application-secret.properties.example)
- 실제 사용 파일
  - `Spring-Back/SpringBasic/api5012/src/main/resources/application-secret.properties`
- 실제 입력 값
  - `gemini.api.key=발급받은_실제_GEMINI_API_KEY`
- Git ignore
  - 루트 `.gitignore` 에 `**/application-secret.properties` 추가 완료

### 관련 파일 예정

- `Spring-Back/SpringBasic/api5012/src/main/java/.../controller/ai/GeminiController.java`
- `Spring-Back/SpringBasic/api5012/src/main/java/.../service/ai/GeminiService.java`
- `Spring-Back/SpringBasic/api5012/src/main/java/.../service/ai/GeminiServiceImpl.java`

---

## Phase 2. 텍스트 챗봇 REST

### 상태

- [ ] `ChatRequestDTO` 작성
- [ ] `ChatResponseDTO` 작성
- [x] `ChatRequestDTO` 작성
- [x] `ChatResponseDTO` 작성
- [x] `GeminiServiceImpl.chat()` 구현
- [x] `GeminiController.chat()` 구현
- [x] `/api/ai/chat` 수동 테스트
  - JWT 포함 호출로 인증 통과 확인
  - `GeminiController` 및 `GeminiServiceImpl.chat()` 진입 확인
  - `application-secret.properties` 로딩 확인
  - `gemini.api.model=gemini-2.5-flash` 로 교체 후 정상 응답 확인
  - 테스트 포트: `18081`
- [x] `/api/ai/chat` 예외 응답 JSON 정리
  - 빈 `prompt` 요청 시 `400 Bad Request` 와 JSON 본문 확인
  - 응답 필드: `timestamp`, `status`, `error`, `code`, `message`, `path`

### NextJS-Front

- [x] `/ai` 허브 페이지 생성
- [x] `/ai/chat` 페이지 생성
- [x] 채팅 UI 구현
- [x] 서버 호출 유틸 작성
- [x] 에러/로딩/빈 입력 처리
- [x] Navbar AI 메뉴 추가
- [x] 홈 화면 AI 바로가기 추가
- [x] 마이페이지 AI 바로가기 추가

### Flutter-Front

- [ ] AI 홈에서 챗봇 진입 링크 추가
- [ ] Gemini 채팅 화면 생성
- [ ] HTTP 서비스 메서드 추가
- [ ] 메시지 리스트, 로딩, 오류 처리 구현

### 검증

- [x] Spring 단독 API 응답 확인
- JWT 인증 통과, 컨트롤러/서비스 진입, 외부 Gemini 호출, 실제 응답 반환까지 확인
- [/] Next.js 화면에서 질문/응답 확인
- 페이지 연결 및 타입/에러 처리 구현 완료
- 자동 테스트: `vitest` 9건 통과
- [ ] Flutter 화면에서 질문/응답 확인

---

## Phase 3. 이미지 분석 REST

### 상태

- [ ] `ImageAnalysisResponseDTO` 작성
- [ ] `GeminiServiceImpl.analyzeImage()` 구현
- [ ] `GeminiController.analyzeImage()` 구현
- [ ] multipart 또는 base64 전송 방식 최종 결정
- [ ] `/api/ai/analyze-image` 테스트
- [x] `ImageAnalysisResponseDTO` 작성
- [x] `GeminiServiceImpl.analyzeImage()` 구현
- [x] `GeminiController.analyzeImage()` 구현
- [x] multipart 업로드 + 서버 Base64 변환 방식 적용

### NextJS-Front

- [ ] `/ai/image` 페이지 생성
- [ ] 파일 선택 UI 구현
- [ ] 업로드/미리보기/응답 렌더링 구현
- [x] `/ai/image` 페이지 생성
- [x] 파일 선택 UI 구현
- [x] 업로드/미리보기/응답 렌더링 구현

### Flutter-Front

- [ ] 기존 [ai_image_screen.dart](E:\0-sample-flutter-projectt-k9\Flutter-Front\lib\screen\ai\image\ai_image_screen.dart) 재사용 여부 결정
- [ ] Gemini 이미지 분석용 서비스 연결
- [ ] 권한/이미지 선택/응답 처리 확인

### 검증

- [/] 샘플 이미지 1개 이상으로 Spring/웹/모바일 동작 확인
- [x] Spring `compileJava` 통과
- [x] Next.js `npm run build` 통과

---

## Phase 4. 명함 OCR

### 상태

- [x] `BusinessCardDTO` 작성
- [x] JSON schema 기반 OCR 응답 전략 확정
- [x] `GeminiServiceImpl.ocrBusinessCard()` 구현
- [x] `GeminiController.ocrBusinessCard()` 구현
- [x] OCR 파싱 실패 대응 로직 작성

### NextJS-Front

- [ ] `/ai/business-card` 또는 동등 페이지 생성
- [ ] 명함 업로드 후 구조화 결과 표시
- [x] `/ai/business-card` 페이지 생성
- [x] 명함 업로드 후 구조화 결과 표시

### Flutter-Front

- [ ] 명함 촬영/선택 화면 생성 또는 기존 이미지 화면 확장
- [ ] OCR 결과 카드 UI 구현

### 검증

- [/] 샘플 명함으로 이름/이메일/전화번호 추출 확인
- [x] Spring `compileJava` 통과
- [x] Next.js `npm run build` 통과

---

## Phase 5. 명함 기반 회원 검색

### 상태

- [x] `BusinessCardSearchResponseDTO` 작성
- [x] OCR 결과와 `MemberRepository` 연결
- [x] `GeminiServiceImpl.searchByBusinessCard()` 구현
- [x] `GeminiController.searchByBusinessCard()` 구현
- [ ] 매칭 규칙 확정
  - [x] 이메일 우선
  - [-] 전화번호 보조
  - [x] 이름 fallback 여부
  - 메모: 현재 `Member` 엔티티에 전화번호 필드가 없어 전화번호 매칭은 보류

### NextJS-Front

- [ ] 검색 결과 페이지/섹션 구현
- [x] `/ai/business-card` 회원 검색 결과 섹션 구현

### Flutter-Front

- [ ] 검색 결과 리스트 화면 구현

### 검증

- [ ] DB 회원과 명함 매칭 성공 케이스 확인
- [ ] 비매칭 케이스 확인
- [x] Spring `compileJava` 통과
- [x] Next.js `npm run build` 통과

---

## Phase 6. 멀티모달 Q&A

### 상태

- [-] `MultimodalRequestDTO` 작성
- [x] `MultimodalResponseDTO` 작성
- [x] `GeminiServiceImpl.multimodal()` 구현
- [x] `GeminiController.multimodal()` 구현
- [ ] `/api/ai/multimodal` 테스트
  - 메모: multipart 요청은 `image` + `question` 파라미터로 받아 별도 요청 DTO 없이 구현

### NextJS-Front

- [x] `/ai/multimodal` 페이지 생성
- [x] Navbar에 AI 링크 추가

### Flutter-Front

- [ ] AI 탭 또는 AI 홈에서 멀티모달 진입 링크 추가
- [ ] 화면 구현

### 검증

- [/] 동일 이미지 + 질문으로 Spring/웹/모바일 응답 비교
- [x] Spring `compileJava` 통과
- [x] Next.js `npm run build` 통과

---

## Phase 7. 공통 품질 정리

### 상태

- [ ] 에러 메시지 표준화
- [ ] 응답 DTO 필드명 최종 통일
- [ ] 업로드 파일 크기 제한 정리
- [ ] 타임아웃/재시도 정책 정리
- [ ] README 갱신
- [ ] API 문서 갱신

### 테스트

- [ ] Spring 단위 테스트
- [ ] Spring 통합 테스트
- [ ] NextJS-Front 테스트
- [ ] Flutter 테스트

### 배포/운영

- [ ] 환경변수 문서화
- [ ] 로컬/운영 분기 확인
- [ ] 민감정보 `.gitignore` 확인

---

## 5. 우선 추천 작업 순서

1. Spring Gemini 기반 구축
2. 텍스트 챗봇 REST 먼저 완성
3. NextJS-Front `/ai/chat` 연결
4. Flutter Gemini 채팅 화면 연결
5. 이미지 분석
6. 명함 OCR
7. 명함 기반 회원 검색
8. 멀티모달 Q&A

---

## 6. 작업 로그

### 2026-04-30

- [x] 실행 체크리스트 문서 생성
- [x] 저장소 현재 상태 스냅샷 반영
- [x] 기존 설계 문서와 연결
- [x] Spring-Back Gemini Controller/Service 뼈대 생성
- [x] Gemini DTO 기본 구조 생성
- [x] `application.properties`에 Gemini 기본 설정 진입점 추가
- [x] `application-secret.properties.example` 템플릿 생성
- [x] secret ignore 규칙 추가
- [x] `build.gradle`에 `spring-boot-starter-webflux` 추가
- [/] Spring Gradle 테스트 실행
  - 새 Gemini 코드 자체는 컴파일됨
  - 기존 `SampleDataInsertTest` 2건 실패는 별도 이슈

---

## 7. 다음 작업 후보

- 1안: `Spring-Back` `GeminiServiceImpl.chat()` 실제 Gemini REST 호출 구현
- 2안: `NextJS-Front`에 `/ai` 허브 + `/ai/chat` UI 생성
- 3안: `application-secret.properties` 템플릿 정리와 API Key 주입 마무리

### 2026-05-06

- [x] `GeminiServiceImpl.ocrBusinessCard()` 실제 Gemini Vision 호출 구현
- [x] OCR 요청에 `response_mime_type=application/json` 및 응답 스키마 적용
- [x] OCR JSON 파싱 및 `parseSuccess` 필드 추가
- [x] `GeminiServiceImpl.searchByBusinessCard()`를 `MemberRepository`와 연결
  - 이메일 exact match 우선
  - 이름 포함 검색 fallback
  - 전화번호 매칭은 회원 엔티티에 전화번호 필드가 없어 보류
- [x] `GeminiServiceImpl.multimodal()` 실제 Gemini Vision 호출 구현
- [x] Next.js `/ai/business-card` 페이지 추가
- [x] Next.js `/ai/multimodal` 페이지 추가
- [x] Next.js AI 허브에 명함 OCR/멀티모달 카드 추가
- [x] Flutter AI 탭에 Gemini 텍스트 챗봇 진입 카드 추가
- [x] Spring `./gradlew compileJava` 통과
- [x] Next.js `npm run build` 통과
- [/] Flutter `flutter analyze` 실행
  - 결과: 기존 lint/info/warning 169건으로 실패 코드 반환
  - 이번 추가 코드의 컴파일 에러는 확인되지 않음

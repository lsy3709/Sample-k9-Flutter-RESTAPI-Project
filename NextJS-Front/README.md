# NextJS-Front

Next.js 15 (App Router) + TypeScript + Tailwind CSS 기반의 부산도서관 관리 시스템 웹 프론트엔드.
기존 Flutter 앱과 **동일한 Spring Boot 백엔드**(`/api`)를 공유합니다.

전체 기획/체크리스트는 [PLAN.md](./PLAN.md) 참조.

---

## 1. 사전 준비

| 도구 | 권장 버전 |
|---|---|
| Node.js | 18.17 이상 (권장 20 LTS) |
| npm | 9.x 이상 (또는 pnpm / yarn) |

## 2. 초기 설정

### 2-1. 의존성 설치

본 저장소에는 **`package.json` 만 포함**되어 있으므로 최초 1회 의존성 설치가 필요합니다.

```bash
cd NextJS-Front
npm install
```

### 2-2. 환경 변수 설정

`.env.local.example` 을 복사하여 `.env.local` 생성:

```bash
cp .env.local.example .env.local
```

`.env.local` 내용:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

> ⚠️ **중요**
> - **웹 브라우저**에서 실행되므로 `10.0.2.2`(안드로이드 에뮬레이터 전용)를 쓰면 **안 됩니다**.
> - 로컬 PC 에서 테스트: `http://localhost:8080/api`
> - 모바일 브라우저로 실기기 테스트: 호스트 PC 의 내부 사설 IP 사용 (예: `http://192.168.0.12:8080/api`). 동일 Wi-Fi + 방화벽 8080 허용 필요. 상세는 루트 [SETUP.md](../SETUP.md) 참고.

### 2-3. 백엔드(Spring Boot) CORS 확인

`CustomSecurityConfig.java` 에서 Next.js dev 포트(`http://localhost:3000`) 가 허용 Origin 에 포함되어 있어야 합니다. 기존 Flutter 용 설정이 `*` 또는 여러 Origin 을 허용 중이면 그대로 동작합니다.

## 3. 개발 서버 실행

```bash
npm run dev
```

기본 포트 **3000** — 브라우저에서 http://localhost:3000 접속.

백엔드(Spring Boot)가 **8080** 포트에서 먼저 기동 중이어야 합니다.

## 4. 빌드 / 프로덕션 실행

```bash
npm run build
npm start
```

## 5. 주요 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (Hot Reload) |
| `npm run dev:turbo` | 개발 서버 — **Turbopack 사용** (Windows 권장, 더 빠름) |
| `npm run dev:clean` | `.next` 캐시 삭제 후 개발 서버 시작 |
| `npm run dev:clean:turbo` | `.next` 캐시 삭제 후 Turbopack으로 개발 서버 시작 |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npm test` | 단위 테스트 (Vitest) |
| `npm run test:watch` | 테스트 감시 모드 |

## 6. 처음 프로젝트를 `create-next-app` 으로 다시 생성하고 싶다면

(본 저장소는 수동 스캐폴딩으로 시작했으나, 빈 상태에서 새로 만들고 싶다면 아래 명령을 참고)

```bash
npx create-next-app@latest NextJS-Front \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

이후 본 저장소의 `src/lib`, `src/constants`, `src/types` 를 복사해 오면 됩니다.

## 7. 폴더 구조

자세한 내용은 [PLAN.md §5](./PLAN.md#5-폴더-구조-nextjs-15-app-router) 참고.

```
src/
├── app/          # App Router 라우트
├── components/   # 재사용 UI
├── lib/          # axios, 인증, 유틸
├── constants/    # API URL 등 상수
└── types/        # TypeScript 타입 정의
```

## 8. 트러블슈팅

### 8-1. Windows — `.next` 파일 잠금 오류 (가장 흔한 문제)

#### 증상
```
[Error: UNKNOWN: unknown error, open '...\NextJS-Front\.next\static\chunks\app\layout.js']
errno: -4094, code: 'UNKNOWN'
```
메인 페이지는 열리지만 다른 페이지로 이동 시 위 오류와 함께 라우팅이 멈춥니다.

#### 원인
**Windows Defender(또는 기업용 백신)** 가 `.next` 빌드 캐시 폴더를 실시간으로 검사하면서
Next.js 가 컴파일된 청크 파일을 열려는 순간 파일 핸들이 충돌합니다.

#### 해결책 (우선순위 순)

**① 즉시 해결 — Turbopack으로 실행 (권장)**
```bash
npm run dev:turbo
```
Turbopack은 파일 I/O 방식이 달라 Defender 간섭이 훨씬 적습니다.
이후 매번 `dev:turbo`로 실행하면 대부분 재현되지 않습니다.

**② 캐시 손상 시 1회 초기화**
```bash
# 서버 종료 후 (Ctrl+C)
npm run dev:clean
# 또는 Turbopack과 함께
npm run dev:clean:turbo
```

**③ 영구 해결 — Windows Defender 제외 폴더 등록**

> 이 설정을 하면 이후에는 `npm run dev`로도 문제없이 실행됩니다.

1. `Windows 보안` 앱 열기 (시작 메뉴 검색)
2. `바이러스 및 위협 방지` → `바이러스 및 위협 방지 설정 관리`
3. 스크롤 내려 `제외` → `제외 추가 또는 제거`
4. `+ 제외 추가` → `폴더` 선택
5. 아래 두 경로를 각각 추가:
   ```
   E:\0-sample-flutter-projectt-k9\NextJS-Front\.next
   E:\0-sample-flutter-projectt-k9\NextJS-Front\node_modules
   ```
6. 서버를 재시작하면 이후 정상 동작합니다.

> **기업 PC / 그룹 정책 환경**: IT 관리자 제외 폴더 설정이 필요할 수 있습니다.

---

### 8-2. 일반 오류

| 증상 | 원인 | 해결 |
|---|---|---|
| 로그인 시 CORS 에러 | Spring 측 Origin 미허용 | `CustomSecurityConfig` 에 `http://localhost:3000` 추가 |
| `ECONNREFUSED` | 백엔드 미기동 | `./gradlew bootRun` 으로 Spring 먼저 실행 |
| 401 로 즉시 로그아웃 | JWT 만료/누락 | 재로그인, 토큰 저장 상태 확인 |
| `localhost` 로 모바일 브라우저 접속 불가 | 모바일은 호스트 루프백 접근 불가 | 호스트 사설 IP 사용 |
| 빌드 후 페이지 흰 화면 | `.next` 캐시 오염 | `npm run dev:clean` 실행 |

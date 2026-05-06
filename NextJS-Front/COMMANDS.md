# Next.js 프론트엔드 실행 명령어 가이드

이 문서는 `NextJS-Front` 프로젝트에서 사용 가능한 주요 실행 명령어들을 정리한 가이드입니다. 패키지 매니저로 `yarn`을 사용하는 것을 기준으로 작성되었습니다. (`npm`을 사용하는 경우 `yarn` 대신 `npm run`을 사용하세요.)

## 🚀 개발 서버 실행 (Development)

Windows 환경에서는 Next.js 기본 Webpack 번들러 사용 시 파일 시스템 잠금 에러(`UNKNOWN: unknown error, open ...`)가 종종 발생할 수 있습니다. **따라서 `yarn dev` 대신 터보팩(Turbopack) 기반의 `yarn dev:turbo` 사용을 적극 권장합니다.**

| 명령어 | 설명 | 비고 |
| --- | --- | --- |
| `yarn dev:turbo` | **(권장)** Turbopack을 사용하여 개발 서버를 실행합니다. | 속도가 빠르고 Windows 파일 잠금 에러를 우회합니다. |
| `yarn dev` | Next.js 기본 개발 서버를 실행합니다. | Windows 환경에서 `layout.js` 관련 open 에러가 발생할 수 있습니다. |
| `yarn dev:clean:turbo` | 기존 빌드 캐시(`.next` 폴더)를 삭제하고 터보팩으로 개발 서버를 실행합니다. | 알 수 없는 캐시 오류가 발생할 때 초기화 용도로 사용합니다. |
| `yarn dev:clean` | 기존 빌드 캐시를 삭제하고 기본 개발 서버를 실행합니다. | 캐시 초기화 후 Webpack 환경 구동 시 사용합니다. |

## 📦 프로덕션 빌드 및 실행 (Production)

실제 서비스 환경(운영)에 배포하기 전에 앱을 빌드하고 테스트하는 명령어입니다.

| 명령어 | 설명 |
| --- | --- |
| `yarn build` | 프로덕션용으로 애플리케이션을 최적화하여 빌드합니다. |
| `yarn start` | `yarn build`로 생성된 프로덕션 빌드 결과물을 실행합니다. (반드시 build가 선행되어야 함) |

## 🧪 테스트 (Testing)

Vitest 기반의 단위 테스트 및 통합 테스트를 실행합니다.

| 명령어 | 설명 |
| --- | --- |
| `yarn test` | 전체 테스트 코드를 1회 실행하고 결과를 출력합니다. |
| `yarn test:watch` | 테스트를 감시(Watch) 모드로 실행하여, 코드 변경 시 자동으로 테스트를 재실행합니다. |

## 🧹 코드 품질 검사 (Linting)

| 명령어 | 설명 |
| --- | --- |
| `yarn lint` | ESLint를 실행하여 코드의 문법적 오류나 컨벤션 위반 사항을 검사합니다. |

---

### 💡 팁 (Troubleshooting)
- `.next` 폴더 내부 파일 접근(open) 권한 오류 발생 시: 서버를 종료(`Ctrl + C`)한 후, **`yarn dev:clean:turbo`** 명령어를 사용해 보세요.
- 환경 변수 설정: 프로젝트 루트의 `.env.local` 파일에 백엔드 API 주소 등의 필요한 환경 변수가 올바르게 설정되어 있는지 확인 후 서버를 실행하세요.

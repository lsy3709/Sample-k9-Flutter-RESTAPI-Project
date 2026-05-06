# Spring Boot Run Commands

대상 프로젝트:
- `Spring-Back/SpringBasic/api5012`

기본 작업 위치:

```powershell
cd E:\0-sample-flutter-projectt-k9\Spring-Back\SpringBasic\api5012
```

---

## 1. 기본 실행

가장 일반적인 개발 서버 실행:

```powershell
.\gradlew.bat bootRun
```

기본 포트:
- `8080`

주의:
- 이미 `8080` 포트를 다른 프로세스가 사용 중이면 실행 실패합니다.

---

## 2. 특정 포트로 실행

예: `18081` 포트로 실행

```powershell
.\gradlew.bat bootRun --args="--server.port=18081"
```

예: `18080` 포트로 실행

```powershell
.\gradlew.bat bootRun --args="--server.port=18080"
```

포트 충돌이 있을 때 가장 실용적인 방식입니다.

---

## 3. 컴파일만 확인

서버를 띄우지 않고 Java 컴파일만 검증:

```powershell
.\gradlew.bat compileJava
```

Gemini 관련 코드 추가 후 빠르게 문법/의존성 확인할 때 유용합니다.

---

## 4. 테스트 실행

전체 테스트 실행:

```powershell
.\gradlew.bat test
```

주의:
- 현재 프로젝트에는 기존 테스트 데이터/SQL 상태 때문에 실패하는 테스트가 있을 수 있습니다.
- 새 기능 컴파일 확인만 필요하면 `compileJava`가 더 빠릅니다.

---

## 5. 실행 전 필수 확인

`application-secret.properties` 파일 확인:

경로:

```text
Spring-Back/SpringBasic/api5012/src/main/resources/application-secret.properties
```

필수 예시:

```properties
gemini.api.key=발급받은_실제_GEMINI_API_KEY
```

템플릿 파일:

```text
Spring-Back/SpringBasic/api5012/src/main/resources/application-secret.properties.example
```

---

## 6. 포트 사용 여부 확인

`8080` 포트 확인:

```powershell
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
```

`18081` 포트 확인:

```powershell
Get-NetTCPConnection -LocalPort 18081 -ErrorAction SilentlyContinue
```

결과가 나오면 해당 포트는 이미 사용 중입니다.

---

## 7. Gemini chat 수동 테스트 예시

예: 서버가 `18081` 포트에서 실행 중일 때

```powershell
$token = "YOUR_JWT_TOKEN"
$body = @{ prompt = "부산도서관 운영시간을 한 줄로 알려줘." } | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:18081/api/ai/chat" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json; charset=utf-8" `
  -Body $body
```

참고:
- 현재 보안 설정상 `/api/ai/chat`는 JWT 없이 호출하면 차단됩니다.
- 따라서 테스트 시 `Authorization: Bearer ...` 헤더가 필요합니다.

---

## 8. 자주 쓰는 추천 순서

1. 프로젝트 폴더 이동

```powershell
cd E:\0-sample-flutter-projectt-k9\Spring-Back\SpringBasic\api5012
```

2. 컴파일 확인

```powershell
.\gradlew.bat compileJava
```

3. 포트 충돌 없으면 기본 실행

```powershell
.\gradlew.bat bootRun
```

4. 충돌 있으면 대체 포트 실행

```powershell
.\gradlew.bat bootRun --args="--server.port=18081"
```

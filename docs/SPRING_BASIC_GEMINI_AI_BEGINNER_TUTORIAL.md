# SpringBasic Gemini AI 초보자 튜토리얼

> 대상 폴더: `Spring-Back/SpringBasic/api5012`  
> 목표: Spring Boot에서 Gemini AI 설정, 컨트롤러, 서비스, DTO, 예외 처리, Swagger, Postman 실습 흐름을 한 번에 이해한다.

---

## 1. 전체 구조 한눈에 보기

현재 SpringBasic의 Gemini 기능은 다음 흐름으로 동작한다.

```text
Postman / Swagger / Frontend
  -> GeminiController
      -> GeminiService 인터페이스
          -> GeminiServiceImpl
              -> Google Gemini REST API 호출
              -> 응답 DTO로 변환
```

핵심 파일은 아래와 같다.

| 역할 | 파일 |
|---|---|
| AI REST API 입구 | `src/main/java/com/busanit501/api5012/controller/ai/GeminiController.java` |
| Gemini 서비스 인터페이스 | `src/main/java/com/busanit501/api5012/service/ai/GeminiService.java` |
| 실제 Gemini API 호출 구현 | `src/main/java/com/busanit501/api5012/service/ai/GeminiServiceImpl.java` |
| Gemini 전용 에러 응답 처리 | `src/main/java/com/busanit501/api5012/controller/ai/GeminiExceptionHandler.java` |
| Gemini 외부 API 예외 타입 | `src/main/java/com/busanit501/api5012/exception/GeminiApiException.java` |
| 요청/응답 DTO | `src/main/java/com/busanit501/api5012/dto/ai/gemini/*` |
| Swagger 설정 | `src/main/java/com/busanit501/api5012/config/SwaggerConfig.java` |
| JWT/Security 설정 | `src/main/java/com/busanit501/api5012/config/CustomSecurityConfig.java` |
| Gemini 기본 설정 | `src/main/resources/application.properties` |
| Gemini API Key 예시 | `src/main/resources/application-secret.properties.example` |

처음부터 JWT, DB, Security 없이 Gemini만 빠르게 테스트하고 싶다면 아래 문서를 먼저 진행한다.

```text
docs/SPRING_BOOT_GEMINI_NO_JWT_TEST_PROJECT_TUTORIAL.md
```

---

## 2. 사용하는 주요 라이브러리

파일: `Spring-Back/SpringBasic/api5012/build.gradle`

Gemini 실습과 직접 관련 있는 의존성은 다음과 같다.

| 라이브러리 | 용도 |
|---|---|
| `spring-boot-starter-web` | REST Controller, JSON API, Multipart 파일 업로드 |
| `spring-boot-starter-webflux` | `WebClient`로 Gemini REST API 호출 |
| `springdoc-openapi-starter-webmvc-ui:2.8.3` | Swagger UI 제공 |
| `spring-boot-starter-security` | JWT 인증 필터 적용 |
| `jjwt-*` | JWT Access Token / Refresh Token 생성 및 검증 |
| `lombok` | DTO, 생성자, 로그 코드 간소화 |
| `mariadb-java-client` | 회원 DB 조회, 명함 OCR 기반 회원 검색 |
| `jackson` | Spring Boot 기본 JSON 변환, Gemini 응답 파싱 |

Gemini 전용 공식 SDK를 쓰는 구조가 아니라, 현재 코드는 Google Gemini REST API를 `WebClient`로 직접 호출한다.

---

## 3. 설정 파일 이해하기

### 3-1. 기본 Gemini 설정

파일: `src/main/resources/application.properties`

```properties
gemini.api.base-url=https://generativelanguage.googleapis.com/v1beta/models
gemini.api.model=gemini-2.5-flash
```

의미:

| 설정 | 설명 |
|---|---|
| `gemini.api.base-url` | Gemini REST API 기본 주소 |
| `gemini.api.model` | 사용할 Gemini 모델명 |

서비스에서는 아래처럼 값을 주입받는다.

```java
@Value("${gemini.api.base-url}")
private String baseUrl;

@Value("${gemini.api.model}")
private String model;
```

### 3-2. Gemini API Key 설정

API Key는 Git에 올리면 안 되므로 별도 secret 파일에 둔다.

예시 파일:

```text
src/main/resources/application-secret.properties.example
```

실제 사용할 파일:

```text
src/main/resources/application-secret.properties
```

내용:

```properties
gemini.api.key=발급받은_실제_GEMINI_API_KEY
```

`application.properties`에는 secret 파일을 읽도록 아래 설정이 들어 있다.

```properties
spring.config.import=optional:classpath:application-secret.properties,\
  optional:file:./src/main/resources/application-secret.properties,\
  optional:file:application-secret.properties
```

그래서 다음 위치 중 하나에 `application-secret.properties`가 있으면 자동으로 읽힌다.

```text
src/main/resources/application-secret.properties
프로젝트 실행 위치/application-secret.properties
```

---

## 4. 컨트롤러 이해하기

파일: `GeminiController.java`

```java
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "Gemini AI API", description = "텍스트/이미지 멀티모달 AI 기능")
public class GeminiController {

    private final GeminiService geminiService;
}
```

초보자 관점에서 중요한 점:

- `@RestController`: JSON 응답을 반환하는 API 컨트롤러다.
- `@RequestMapping("/api/ai")`: 모든 AI API 주소가 `/api/ai`로 시작한다.
- `GeminiService`를 직접 생성하지 않고, Spring이 주입해준다.
- 컨트롤러는 요청을 받고 서비스에 위임한다.
- 실제 Gemini API 호출 로직은 컨트롤러에 두지 않는다.

현재 제공하는 API는 다음 5개다.

| 기능 | Method | URL | Body 형식 |
|---|---|---|---|
| 텍스트 챗봇 | POST | `/api/ai/chat` | JSON |
| 이미지 분석 | POST | `/api/ai/analyze-image` | multipart/form-data |
| 명함 OCR | POST | `/api/ai/ocr/business-card` | multipart/form-data |
| 명함 기반 회원 검색 | POST | `/api/ai/ocr/search` | multipart/form-data |
| 이미지 + 질문 멀티모달 | POST | `/api/ai/multimodal` | multipart/form-data |

---

## 5. 서비스 계층 이해하기

### 5-1. 인터페이스

파일: `GeminiService.java`

```java
public interface GeminiService {
    ChatResponseDTO chat(ChatRequestDTO requestDTO);
    ImageAnalysisResponseDTO analyzeImage(MultipartFile image, String prompt);
    BusinessCardDTO ocrBusinessCard(MultipartFile image);
    BusinessCardSearchResponseDTO searchByBusinessCard(MultipartFile image);
    MultimodalResponseDTO multimodal(MultipartFile image, String question);
}
```

인터페이스는 “Gemini 서비스가 어떤 기능을 제공해야 하는지”를 약속한다.

### 5-2. 구현체

파일: `GeminiServiceImpl.java`

주요 멤버:

```java
private final WebClient webClient;
private final ObjectMapper objectMapper;
private final MemberRepository memberRepository;
```

| 멤버 | 역할 |
|---|---|
| `WebClient` | Gemini REST API로 HTTP 요청 전송 |
| `ObjectMapper` | Gemini가 준 JSON 문자열을 DTO로 변환 |
| `MemberRepository` | 명함 OCR 결과로 회원 DB 검색 |

Gemini 호출 주소는 내부적으로 아래 형태가 된다.

```text
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

예:

```text
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=...
```

---

## 6. DTO 이해하기

DTO는 Controller와 Client가 주고받는 데이터 모양이다.

| DTO | 용도 |
|---|---|
| `ChatRequestDTO` | 텍스트 질문 요청 |
| `ChatResponseDTO` | 텍스트 답변 응답 |
| `ImageAnalysisResponseDTO` | 이미지 분석 결과 |
| `BusinessCardDTO` | 명함 OCR 구조화 결과 |
| `BusinessCardSearchResponseDTO` | 명함 OCR 후 회원 DB 매칭 결과 |
| `MultimodalResponseDTO` | 이미지 + 질문 답변 결과 |
| `AiErrorResponseDTO` | AI API 에러 공통 응답 |

예: 텍스트 챗봇 요청 DTO

```java
public class ChatRequestDTO {
    @NotBlank(message = "prompt 는 비어 있을 수 없습니다.")
    private String prompt;
}
```

`@NotBlank`가 있으므로 `prompt`가 비어 있으면 정상 요청으로 처리하지 않는다.

---

## 7. 에러 처리 구조

파일: `GeminiExceptionHandler.java`

Gemini 컨트롤러에서 발생한 예외는 JSON 형태로 통일해서 반환한다.

예시 에러 응답:

```json
{
  "timestamp": "2026-05-15T10:00:00+09:00",
  "status": 400,
  "error": "Bad Request",
  "code": "INVALID_REQUEST",
  "message": "prompt 는 비어 있을 수 없습니다.",
  "path": "/api/ai/chat"
}
```

주요 에러 코드:

| 코드 | 의미 |
|---|---|
| `INVALID_REQUEST` | 요청값이 비어 있거나 잘못됨 |
| `MODEL_UNAVAILABLE` | 설정한 Gemini 모델을 사용할 수 없음 |
| `INVALID_IMAGE_TYPE` | 이미지 MIME 타입이 지원되지 않음 |
| `RATE_LIMITED` | Gemini 요청 제한 |
| `UPSTREAM_TEMPORARY_ERROR` | Gemini 서버 일시 오류 |
| `AI_INTERNAL_ERROR` | 내부 처리 오류 |

---

## 8. 실행 준비

### 8-1. DB 확인

현재 설정은 MariaDB `webdb`를 사용한다.

파일: `application.properties`

```properties
spring.datasource.url=jdbc:mariadb://localhost:3306/webdb
spring.datasource.username=webuser
spring.datasource.password=webuser
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
```

JWT 로그인과 명함 기반 회원 검색은 DB 회원 정보가 있어야 정상 동작한다.

### 8-2. Gemini API Key 준비

`src/main/resources/application-secret.properties` 파일을 만들고 아래처럼 입력한다.

```properties
gemini.api.key=발급받은_실제_GEMINI_API_KEY
```

### 8-3. Spring Boot 실행

작업 위치:

```powershell
cd E:\0-sample-flutter-projectt-k9\Spring-Back\SpringBasic\api5012
```

실행:

```powershell
.\gradlew.bat bootRun
```

기본 주소:

```text
http://localhost:8080
```

포트 충돌 시:

```powershell
.\gradlew.bat bootRun --args="--server.port=18081"
```

---

## 9. JWT 인증 준비

현재 보안 설정상 `/api/ai/**` 요청은 JWT 인증이 필요하다.

토큰 발급 API:

```text
POST http://localhost:8080/generateToken
```

Body:

```json
{
  "mid": "apiuser10",
  "mpw": "11111"
}
```

성공 응답 예:

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

AI API를 호출할 때는 Header에 아래 값을 넣는다.

| Key | Value |
|---|---|
| `Authorization` | `Bearer 발급받은_accessToken` |

참고:

- `src/main/resources/static/apiLogin.html`에 `apiuser10` / `11111` 예시가 있다.
- DB에 해당 사용자가 없으면 로그인부터 실패한다.

---

## 10. Swagger 실습

Swagger 주소:

```text
http://localhost:8080/swagger-ui/index.html
```

포트를 바꿔 실행했다면:

```text
http://localhost:18081/swagger-ui/index.html
```

실습 순서:

1. Spring Boot를 실행한다.
2. 브라우저에서 Swagger UI 주소로 접속한다.
3. `Gemini AI API` 그룹을 찾는다.
4. 우측 상단 `Authorize` 버튼을 누른다.
5. `Bearer accessToken값` 형식으로 JWT를 입력한다.
6. `/api/ai/chat`부터 테스트한다.

주의:

- Swagger의 `Authorize`에는 `Bearer`까지 포함해서 입력한다.
- 이미지 업로드 API는 Swagger보다 Postman에서 연습하는 편이 더 직관적이다.

---

## 11. Postman 실습 1: 텍스트 챗봇

### 요청

```text
POST http://localhost:8080/api/ai/chat
```

Headers:

| Key | Value |
|---|---|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer accessToken값` |

Body > raw > JSON:

```json
{
  "prompt": "Spring Boot에서 Controller와 Service의 차이를 초보자에게 설명해줘."
}
```

### 성공 응답 예

```json
{
  "reply": "Controller는 요청을 받고 Service는 실제 비즈니스 로직을 처리합니다...",
  "model": "gemini-2.5-flash",
  "implemented": true
}
```

### 일부러 실패 테스트

Body:

```json
{
  "prompt": ""
}
```

예상:

```json
{
  "status": 400,
  "code": "INVALID_REQUEST",
  "message": "prompt 는 비어 있을 수 없습니다.",
  "path": "/api/ai/chat"
}
```

---

## 12. Postman 실습 2: 이미지 분석

### 요청

```text
POST http://localhost:8080/api/ai/analyze-image
```

Headers:

| Key | Value |
|---|---|
| `Authorization` | `Bearer accessToken값` |

중요:

- `Content-Type`은 직접 입력하지 않는다.
- Postman이 `multipart/form-data; boundary=...`를 자동 생성하게 둔다.

Body > form-data:

| Key | Type | Value |
|---|---|---|
| `image` | File | 분석할 이미지 |
| `prompt` | Text | `이 이미지를 한국어로 자세히 설명해주세요.` |

### 성공 응답 예

```json
{
  "description": "이미지에는 ...",
  "filename": "sample.jpg",
  "mimeType": "image/jpeg",
  "model": "gemini-2.5-flash",
  "implemented": true
}
```

---

## 13. Postman 실습 3: 명함 OCR

### 요청

```text
POST http://localhost:8080/api/ai/ocr/business-card
```

Headers:

| Key | Value |
|---|---|
| `Authorization` | `Bearer accessToken값` |

Body > form-data:

| Key | Type | Value |
|---|---|---|
| `image` | File | 명함 이미지 |

### 성공 응답 예

```json
{
  "name": "홍길동",
  "company": "부산IT",
  "department": "개발팀",
  "position": "팀장",
  "phone": "010-1234-5678",
  "email": "hong@example.com",
  "address": "부산광역시 ...",
  "rawText": "{...}",
  "parseSuccess": true,
  "model": "gemini-2.5-flash",
  "implemented": true
}
```

내부 동작:

1. 명함 이미지를 `MultipartFile`로 받는다.
2. 서버에서 이미지 bytes를 Base64로 변환한다.
3. Gemini에 JSON 형식으로 응답하라고 요청한다.
4. `ObjectMapper`로 `BusinessCardDTO`에 매핑한다.

---

## 14. Postman 실습 4: 명함 기반 회원 검색

### 요청

```text
POST http://localhost:8080/api/ai/ocr/search
```

Headers:

| Key | Value |
|---|---|
| `Authorization` | `Bearer accessToken값` |

Body > form-data:

| Key | Type | Value |
|---|---|---|
| `image` | File | 명함 이미지 |

### 성공 응답 예

```json
{
  "matched": true,
  "matchType": "EMAIL_MATCH",
  "memberId": 1,
  "mid": "member001",
  "memberName": "홍길동",
  "email": "hong@example.com",
  "region": "부산광역시 해운대구",
  "role": "USER",
  "extractedCard": {
    "name": "홍길동",
    "email": "hong@example.com"
  },
  "implemented": true
}
```

매칭 순서:

1. OCR 결과에서 `email`이 있으면 `memberRepository.findByEmail(email)`로 검색한다.
2. 이메일 매칭이 없고 `name`이 있으면 `findByMnameContaining(name)`으로 검색한다.
3. 둘 다 없으면 `NO_MATCH`를 반환한다.

---

## 15. Postman 실습 5: 이미지 + 질문 멀티모달

### 요청

```text
POST http://localhost:8080/api/ai/multimodal
```

Headers:

| Key | Value |
|---|---|
| `Authorization` | `Bearer accessToken값` |

Body > form-data:

| Key | Type | Value |
|---|---|---|
| `image` | File | 질문할 이미지 |
| `question` | Text | `이 사진에서 위험해 보이는 부분이 있나요?` |

### 성공 응답 예

```json
{
  "question": "이 사진에서 위험해 보이는 부분이 있나요?",
  "answer": "사진을 보면 ...",
  "model": "gemini-2.5-flash",
  "implemented": true
}
```

---

## 16. 자주 막히는 문제

### 16-1. `gemini.api.key 설정이 필요합니다.`

원인:

- `application-secret.properties`가 없거나
- `gemini.api.key` 값이 비어 있다.

해결:

```properties
gemini.api.key=실제_API_KEY
```

### 16-2. 401 또는 토큰 에러

원인:

- `Authorization` 헤더가 없다.
- `Bearer` 형식이 아니다.
- accessToken이 만료되었다.

해결:

1. `/generateToken`으로 토큰을 다시 발급한다.
2. Header에 `Authorization: Bearer accessToken값`을 넣는다.

### 16-3. 이미지 API에서 400 에러

원인:

- form-data key 이름이 `image`가 아니다.
- File 타입이 아니라 Text 타입으로 보냈다.
- 지원하지 않는 이미지 형식이다.

해결:

- Postman Body를 `form-data`로 선택한다.
- `image` key의 타입을 `File`로 바꾼다.
- PNG, JPG, WEBP 파일로 테스트한다.

### 16-4. 명함 OCR JSON 파싱 실패

원인:

- Gemini가 순수 JSON이 아닌 설명 문장을 함께 반환했다.
- 이미지 품질이 낮아 필드 추출이 흔들렸다.

해결:

- 선명한 명함 이미지를 사용한다.
- `GeminiServiceImpl.buildBusinessCardOcrRequestBody()`의 prompt를 더 강하게 조정한다.

### 16-5. DB 회원 매칭이 안 됨

원인:

- OCR된 이메일이 DB의 `tbl_lib_member.email`과 다르다.
- OCR된 이름이 DB의 `mname`과 다르다.

해결:

- OCR 응답의 `extractedCard.email`, `extractedCard.name`을 먼저 확인한다.
- DB 회원 데이터와 같은 값이 있는지 확인한다.

---

## 17. 초보자 연습 과제

### 과제 1. 텍스트 챗봇 prompt 바꿔보기

`/api/ai/chat`에 아래 질문을 보내본다.

```json
{
  "prompt": "Java에서 interface를 왜 사용하는지 예제로 설명해줘."
}
```

확인할 것:

- `reply`가 정상 출력되는가?
- `model`이 `gemini-2.5-flash`로 나오는가?
- `implemented`가 `true`인가?

### 과제 2. 이미지 분석 prompt 바꿔보기

같은 이미지를 두 번 보내되 prompt만 바꿔본다.

```text
이 이미지를 한 문장으로 설명해줘.
```

```text
이 이미지에서 객체를 목록으로 정리해줘.
```

확인할 것:

- 같은 이미지라도 prompt에 따라 응답이 달라지는가?

### 과제 3. 에러 일부러 만들기

`/api/ai/multimodal`에서 `question`을 비워서 보내본다.

예상:

```json
{
  "code": "INVALID_REQUEST",
  "message": "question 은 비어 있을 수 없습니다."
}
```

### 과제 4. Swagger와 Postman 비교하기

같은 `/api/ai/chat` 요청을 Swagger와 Postman에서 각각 보내본다.

확인할 것:

- 둘 다 같은 컨트롤러 메서드로 들어가는가?
- JWT 인증 방식은 어떻게 다른가?

---

## 18. 코드 읽는 순서 추천

처음 보는 사람은 아래 순서로 읽으면 이해가 쉽다.

1. `GeminiController.java`
2. `GeminiService.java`
3. `ChatRequestDTO.java`, `ChatResponseDTO.java`
4. `GeminiServiceImpl.chat()`
5. `GeminiServiceImpl.buildChatRequestBody()`
6. `GeminiServiceImpl.extractText()`
7. `GeminiExceptionHandler.java`
8. 이미지 기능: `analyzeImage()`, `buildImageRequestBody()`
9. 명함 기능: `ocrBusinessCard()`, `parseBusinessCard()`
10. 회원 검색 기능: `searchByBusinessCard()`, `findMemberByBusinessCard()`

---

## 19. 핵심 정리

- Controller는 요청을 받고 Service에 넘긴다.
- ServiceImpl은 Gemini API 호출, 이미지 Base64 변환, 응답 파싱을 담당한다.
- DTO는 요청과 응답의 데이터 모양을 정한다.
- Gemini API Key는 `application-secret.properties`에 둔다.
- `/api/ai/**`는 JWT 인증이 필요하다.
- Swagger는 API 목록 확인과 간단 테스트에 좋다.
- Postman은 multipart 이미지 업로드 테스트에 좋다.
- 명함 검색 기능은 Gemini OCR 결과와 DB 회원 정보를 함께 사용한다.

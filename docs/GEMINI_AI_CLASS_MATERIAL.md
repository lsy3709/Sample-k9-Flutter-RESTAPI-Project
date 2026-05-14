# Gemini AI 멀티모달 수업 자료

> 대상: Spring Boot, Next.js, Flutter를 처음 접하거나 AI API 연동을 처음 실습하는 학습자
> 기준 문서: `docs/GEMINI_AI_PLAN.md`
> 기준 프로젝트: `Spring-Back`, `NextJS-Front`, `Flutter-Front`
> 수업 목표: Gemini API를 이용해 텍스트 챗봇, 이미지 분석, 명함 OCR, 멀티모달 Q&A를 풀스택 프로젝트에 연결한다.

---

## 수업 전체 흐름

| 차시 | 주제 | 핵심 결과물 |
|---|---|---|
| 1 | AI&생성형 AI 이해 | AI, 생성형 AI, 프롬프트, 토큰, 모델 개념 이해 |
| 2 | AI모델 실습환경 구축 | Gemini API Key, Spring 설정, Postman 테스트 |
| 3 | 멀티모달 AI 응용 | 텍스트 + 이미지 입력 구조 이해, OCR 실습 |
| 4 | 풀스택 프로젝트에 연계 | Spring API를 Next.js, Flutter 화면과 연결 |

---

# 1. AI&생성형 AI 이해

## 1-1. AI란?

AI는 Artificial Intelligence의 약자입니다.

- Artificial: 인공적인
- Intelligence: 지능
- AI: 사람이 하던 판단, 분류, 예측, 생성 작업을 컴퓨터가 수행하도록 만드는 기술

예시:

| 작업 | 기존 프로그램 | AI 프로그램 |
|---|---|---|
| 사진 분류 | 파일명이나 규칙으로 구분 | 이미지 내용을 보고 판단 |
| 고객 응답 | 정해진 문구만 출력 | 질문 의도를 파악해 답변 생성 |
| 명함 인식 | OCR 전용 규칙 필요 | 이미지에서 의미 있는 필드 추출 |

## 1-2. 생성형 AI란?

생성형 AI는 Generative AI라고 부릅니다.

- Generate: 만들어내다
- Generative: 생성하는
- Generative AI: 학습한 패턴을 바탕으로 새로운 텍스트, 이미지, 코드, 요약, 분석 결과를 생성하는 AI

일반 AI와 생성형 AI의 차이:

| 구분 | 설명 | 예시 |
|---|---|---|
| 분류형 AI | 입력을 보고 정답 카테고리를 고름 | 스팸/정상 메일 분류 |
| 예측형 AI | 과거 데이터를 바탕으로 미래 값 예측 | 주가, 날씨 예측 |
| 생성형 AI | 새로운 결과물을 만들어냄 | 챗봇 답변, 코드 생성, OCR JSON 생성 |

## 1-3. LLM이란?

LLM은 Large Language Model의 약자입니다.

- Large: 큰
- Language: 언어
- Model: 입력과 출력의 관계를 학습한 구조

LLM은 많은 텍스트 데이터를 학습해 다음 단어, 문장, 코드, 구조화된 응답을 생성합니다.

이 프로젝트에서는 Google Gemini 모델을 사용합니다.

```properties
gemini.api.model=gemini-2.5-flash
```

## 1-4. 프롬프트란?

Prompt는 "재촉하다", "입력을 주다"라는 뜻입니다.

AI에서 프롬프트는 모델에게 전달하는 지시문입니다.

좋은 프롬프트 예시:

```text
이 명함 이미지에서 정보를 추출하여 반드시 JSON 객체 하나로만 응답하세요.
값이 보이지 않으면 빈 문자열("")로 채우세요.
필드: name, company, department, position, phone, email, address
```

나쁜 프롬프트 예시:

```text
이거 봐줘
```

좋은 프롬프트의 조건:

| 조건 | 설명 |
|---|---|
| 역할이 명확함 | "명함 정보 추출"처럼 목적이 분명함 |
| 출력 형식이 명확함 | JSON, 표, 문장 등 지정 |
| 예외 처리가 있음 | 값이 없으면 빈 문자열 등 |
| 불필요한 설명을 막음 | "JSON만 응답"처럼 제한 |

## 1-5. 토큰이란?

Token은 "작은 단위"라는 뜻입니다.

AI 모델은 문장을 글자 그대로 처리하지 않고 토큰 단위로 처리합니다.

예시:

```text
부산도서관 운영시간 알려줘
```

모델 내부에서는 대략 다음과 같은 조각으로 나뉠 수 있습니다.

```text
부산 / 도서관 / 운영 / 시간 / 알려 / 줘
```

토큰이 중요한 이유:

- 입력이 길수록 비용이 증가할 수 있음
- 출력이 길수록 응답 시간이 길어질 수 있음
- `maxOutputTokens` 옵션으로 최대 응답 길이를 제한할 수 있음

## 1-6. 기본 용어 정리

| 용어 | 뜻 | 프로젝트 예시 |
|---|---|---|
| Model | AI 엔진 이름 | `gemini-2.5-flash` |
| Prompt | AI에게 주는 지시문 | "이 이미지를 한국어로 설명해주세요." |
| API | 프로그램끼리 통신하는 약속 | Spring이 Gemini API 호출 |
| Endpoint | API 주소 | `/api/ai/chat` |
| Request | 요청 데이터 | 질문 텍스트, 이미지 파일 |
| Response | 응답 데이터 | AI 답변, OCR 결과 |
| JSON | 데이터 교환 형식 | `{ "reply": "..." }` |
| Multipart | 파일 업로드 요청 형식 | 이미지 업로드 |
| Base64 | 바이너리 파일을 문자열로 바꾸는 방식 | 이미지 파일을 Gemini JSON에 포함 |

## 1-7. 실습 문제

### 문제 1

다음 중 생성형 AI에 가장 가까운 예시는 무엇인가요?

1. 회원 ID 중복 확인
2. 사용자의 질문에 새로운 답변 생성
3. 버튼 클릭 시 페이지 이동
4. DB에서 이메일로 회원 검색

### 정답 1

2번입니다.

생성형 AI는 새로운 텍스트, 이미지, 코드, 분석 결과를 만들어내는 AI입니다.

### 문제 2

명함 OCR에서 "반드시 JSON으로만 응답하세요"라는 문장이 중요한 이유를 적어보세요.

### 정답 2

서버가 AI 응답을 `ObjectMapper`로 파싱해야 하므로, 설명 문장이나 마크다운이 섞이면 JSON 파싱에 실패할 수 있기 때문입니다.

---

# 2. AI모델 실습환경 구축

## 2-1. 전체 실행 구조

이 프로젝트의 AI 호출 흐름은 다음과 같습니다.

```text
Next.js 또는 Flutter
  ↓
Spring Boot /api/ai/*
  ↓
GeminiServiceImpl
  ↓
Google Gemini API
  ↓
Spring Boot 응답 DTO
  ↓
Next.js 또는 Flutter 화면 출력
```

핵심 포인트:

- 클라이언트가 Gemini API Key를 직접 들고 있지 않음
- Spring Boot가 Gemini Proxy 역할을 함
- API Key는 `application-secret.properties`에 숨김

## 2-2. API Key 설정

파일 위치:

```text
Spring-Back/SpringBasic/api5012/src/main/resources/application-secret.properties
```

내용:

```properties
gemini.api.key=YOUR_REAL_GEMINI_API_KEY
```

주의:

```text
application-secret.properties는 절대 Git에 커밋하지 않습니다.
```

예제 템플릿 파일:

```text
Spring-Back/SpringBasic/api5012/src/main/resources/application-secret.properties.example
```

## 2-3. Spring 기본 설정

파일:

```text
Spring-Back/SpringBasic/api5012/src/main/resources/application.properties
```

핵심 설정:

```properties
spring.config.import=optional:classpath:application-secret.properties,optional:file:./src/main/resources/application-secret.properties,optional:file:application-secret.properties

gemini.api.base-url=https://generativelanguage.googleapis.com/v1beta/models
gemini.api.model=gemini-2.5-flash
```

설명:

| 설정 | 의미 |
|---|---|
| `spring.config.import` | secret 파일을 추가로 읽도록 설정 |
| `gemini.api.base-url` | Gemini API 기본 주소 |
| `gemini.api.model` | 사용할 Gemini 모델 이름 |

## 2-4. Gradle 의존성

파일:

```text
Spring-Back/SpringBasic/api5012/build.gradle
```

필요 의존성:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-webflux'
```

왜 필요한가요?

`WebClient`를 사용하기 위해 필요합니다.

용어:

| 용어 | 뜻 |
|---|---|
| Gradle | Java 프로젝트 빌드 도구 |
| Dependency | 외부 라이브러리 |
| WebClient | Spring에서 HTTP 요청을 보내는 도구 |
| WebFlux | 비동기 HTTP 처리 기능을 제공하는 Spring 모듈 |

## 2-5. Spring Boot 실행

터미널 위치:

```text
Spring-Back/SpringBasic/api5012
```

명령어:

```bash
./gradlew bootRun
```

Windows PowerShell:

```powershell
.\gradlew bootRun
```

컴파일만 확인:

```powershell
.\gradlew compileJava
```

## 2-6. 텍스트 챗봇 API 테스트

Endpoint:

```text
POST /api/ai/chat
```

Request Body:

```json
{
  "prompt": "부산도서관 이용 방법을 알려줘"
}
```

Response 예시:

```json
{
  "reply": "부산도서관 이용 방법은 회원가입 후 도서를 검색하고 대출 신청을 진행하면 됩니다.",
  "model": "gemini-2.5-flash",
  "implemented": true
}
```

주의:

현재 실제 DTO는 `message`가 아니라 `prompt` 필드를 사용합니다.

```java
public class ChatRequestDTO {
    @NotBlank(message = "prompt 는 비어 있을 수 없습니다.")
    private String prompt;
}
```

## 2-7. WebClient 기본 문법

실제 코드:

```java
Map<String, Object> response = webClient.post()
        .uri(uriBuilder -> uriBuilder
                .path("/{model}:generateContent")
                .queryParam("key", apiKey)
                .build(model))
        .bodyValue(buildChatRequestBody(prompt))
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
        .block();
```

문법 설명:

| 코드 | 의미 |
|---|---|
| `webClient.post()` | POST 요청 시작 |
| `.uri(...)` | 요청 주소 설정 |
| `.queryParam("key", apiKey)` | URL 뒤에 `?key=...` 추가 |
| `.bodyValue(...)` | 요청 Body 설정 |
| `.retrieve()` | 응답 받기 시작 |
| `.bodyToMono(...)` | 응답 JSON을 Java 객체로 변환 |
| `.block()` | 비동기 결과가 올 때까지 기다림 |

## 2-8. Gemini 요청 Body 기본 구조

텍스트 요청:

```java
private Map<String, Object> buildChatRequestBody(String prompt) {
    return Map.of(
            "contents", List.of(
                    Map.of(
                            "role", "user",
                            "parts", List.of(
                                    Map.of("text", prompt)
                            )
                    )
            ),
            "generationConfig", Map.of(
                    "temperature", 0.7,
                    "maxOutputTokens", 1024
            )
    );
}
```

구조를 JSON으로 보면:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "질문 내용" }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}
```

옵션 설명:

| 옵션 | 의미 | 값이 낮을 때 | 값이 높을 때 |
|---|---|---|---|
| `temperature` | 답변의 창의성 | 안정적, 보수적 | 다양함, 창의적 |
| `maxOutputTokens` | 최대 출력 길이 | 짧은 답변 | 긴 답변 |

## 2-9. 실습 문제

### 문제 1

`temperature`를 0.1로 낮추면 어떤 답변이 나올 가능성이 커질까요?

### 정답 1

더 안정적이고 예측 가능한 답변이 나올 가능성이 커집니다.

### 문제 2

Spring Boot에서 API Key를 Next.js나 Flutter에 직접 넣지 않는 이유는 무엇인가요?

### 정답 2

클라이언트 앱은 사용자가 열어볼 수 있기 때문에 API Key가 노출될 위험이 있습니다. 따라서 Spring Boot 서버가 API Key를 보관하고, 클라이언트는 Spring API만 호출하게 만드는 것이 안전합니다.

### 문제 3

빈 질문을 막기 위해 `ChatRequestDTO`에 들어간 검증 어노테이션은 무엇인가요?

### 정답 3

```java
@NotBlank(message = "prompt 는 비어 있을 수 없습니다.")
```

---

# 3. 멀티모달 AI 응용

## 3-1. 멀티모달이란?

Multimodal은 여러 방식을 함께 사용한다는 뜻입니다.

- Multi: 여러 개
- Modal: 방식, 양식
- Multimodal AI: 텍스트, 이미지, 음성, 영상 등 여러 입력을 함께 이해하는 AI

이 프로젝트의 멀티모달 예시:

| 기능 | 입력 | 출력 |
|---|---|---|
| 이미지 분석 | 이미지 + 프롬프트 | 이미지 설명 |
| 명함 OCR | 명함 이미지 + JSON 지시문 | 명함 정보 JSON |
| 이미지 Q&A | 이미지 + 질문 | 이미지 기반 답변 |

## 3-2. 이미지 업로드 방식

클라이언트에서 Spring으로 보낼 때:

```text
multipart/form-data
```

Spring에서 Gemini로 보낼 때:

```text
Base64 문자열로 변환 후 JSON Body에 포함
```

이유:

- 이미지 파일은 바이너리 데이터입니다.
- Gemini REST API의 JSON 요청에는 텍스트 형태로 넣어야 합니다.
- 그래서 `Base64.getEncoder().encodeToString(image.getBytes())`를 사용합니다.

## 3-3. Spring Controller 문법

이미지 분석 API:

```java
@PostMapping("/analyze-image")
public ResponseEntity<ImageAnalysisResponseDTO> analyzeImage(
        @RequestPart MultipartFile image,
        @RequestParam(defaultValue = "이 이미지를 한국어로 설명해주세요.") String prompt) {
    return ResponseEntity.ok(geminiService.analyzeImage(image, prompt));
}
```

문법 설명:

| 코드 | 의미 |
|---|---|
| `@PostMapping` | POST 요청을 받음 |
| `@RequestPart MultipartFile image` | multipart 파일을 받음 |
| `@RequestParam String prompt` | 일반 텍스트 파라미터를 받음 |
| `ResponseEntity.ok(...)` | HTTP 200 응답 반환 |

## 3-4. 이미지 요청 Body 만들기

핵심 코드:

```java
String encodedImage = Base64.getEncoder().encodeToString(image.getBytes());

return Map.of(
        "contents", List.of(
                Map.of(
                        "role", "user",
                        "parts", List.of(
                                Map.of("text", prompt),
                                Map.of(
                                        "inline_data", Map.of(
                                                "mime_type", mimeType,
                                                "data", encodedImage
                                        )
                                )
                        )
                )
        ),
        "generationConfig", generationConfig
);
```

JSON 구조:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "이 이미지를 분석해주세요" },
        {
          "inline_data": {
            "mime_type": "image/png",
            "data": "Base64로 변환된 이미지 문자열"
          }
        }
      ]
    }
  ]
}
```

## 3-5. 명함 OCR JSON 스키마

명함 OCR은 자유로운 문장보다 JSON이 좋습니다.

이유:

- 화면에 이름, 회사, 이메일을 따로 표시해야 함
- DB 검색에 이메일과 이름을 사용해야 함
- JSON이면 서버에서 객체로 쉽게 변환 가능

실제 옵션:

```java
Map.of(
        "response_mime_type", "application/json",
        "response_schema", Map.of(
                "type", "object",
                "properties", Map.of(
                        "name", Map.of("type", "string"),
                        "company", Map.of("type", "string"),
                        "department", Map.of("type", "string"),
                        "position", Map.of("type", "string"),
                        "phone", Map.of("type", "string"),
                        "email", Map.of("type", "string"),
                        "address", Map.of("type", "string")
                )
        )
)
```

용어:

| 용어 | 뜻 |
|---|---|
| MIME Type | 파일 형식 표시 방식 |
| `application/json` | JSON 문서 형식 |
| Schema | 데이터 구조 규칙 |
| Property | JSON 객체의 필드 |

## 3-6. OCR 응답 파싱

```java
private BusinessCardDTO parseBusinessCard(String rawText) {
    String json = stripJsonFence(rawText);
    try {
        BusinessCardDTO dto = objectMapper.readValue(json, BusinessCardDTO.class);
        dto.setRawText(rawText);
        dto.setParseSuccess(true);
        return dto;
    } catch (JsonProcessingException e) {
        throw new IllegalStateException("Gemini 명함 OCR JSON 파싱에 실패했습니다.", e);
    }
}
```

문법 설명:

| 코드 | 의미 |
|---|---|
| `ObjectMapper` | JSON 문자열을 Java 객체로 변환 |
| `readValue(json, BusinessCardDTO.class)` | JSON을 DTO로 파싱 |
| `try-catch` | 파싱 실패 시 예외 처리 |
| `parseSuccess` | 파싱 성공 여부 표시 |

## 3-7. 회원 검색 로직

현재 회원 엔티티에는 전화번호 필드가 없습니다.

그래서 검색 순서는 다음과 같습니다.

```text
1. 이메일 exact match
2. 이름 포함 검색 fallback
3. 없으면 NO_MATCH
```

실제 코드:

```java
private MatchResult findMemberByBusinessCard(BusinessCardDTO card) {
    String email = normalizeBlank(card.getEmail());
    if (email != null) {
        Optional<Member> member = memberRepository.findByEmail(email);
        if (member.isPresent()) {
            return new MatchResult(member, "EMAIL_MATCH");
        }
    }

    String name = normalizeBlank(card.getName());
    if (name != null) {
        List<Member> members = memberRepository.findByMnameContaining(name);
        if (!members.isEmpty()) {
            return new MatchResult(Optional.of(members.get(0)), "NAME_MATCH");
        }
    }

    return new MatchResult(Optional.empty(), "NO_MATCH");
}
```

## 3-8. 샘플 이미지 위치

명함 OCR 실습용 샘플 이미지:

```text
sampleImages/business-card-ocr-samples.png
```

주의:

현재 샘플 파일은 명함 3장이 한 이미지 안에 들어있는 형태입니다.

## 3-9. Postman 실습

### 이미지 분석

```text
POST http://localhost:8080/api/ai/analyze-image
```

Body:

```text
form-data
image: sampleImages/business-card-ocr-samples.png
prompt: 이 이미지에 있는 명함들을 설명해줘
```

### 명함 OCR

```text
POST http://localhost:8080/api/ai/ocr/business-card
```

Body:

```text
form-data
image: sampleImages/business-card-ocr-samples.png
```

### 멀티모달 Q&A

```text
POST http://localhost:8080/api/ai/multimodal
```

Body:

```text
form-data
image: sampleImages/business-card-ocr-samples.png
question: 이 이미지에서 이메일 주소만 정리해줘
```

## 3-10. 실습 문제

### 문제 1

이미지 파일을 Gemini API에 보내기 전에 Base64로 바꾸는 이유는 무엇인가요?

### 정답 1

Gemini REST API 요청 Body는 JSON 형식이고, JSON은 텍스트 기반이기 때문에 이미지 바이너리를 그대로 넣기 어렵습니다. 그래서 이미지를 Base64 문자열로 변환해 JSON 안에 넣습니다.

### 문제 2

명함 OCR에서 `temperature`를 0.1로 설정한 이유는 무엇일까요?

### 정답 2

명함 OCR은 창의적인 답변보다 정확하고 일관된 구조화 결과가 중요합니다. 그래서 낮은 temperature를 사용해 응답을 안정적으로 만듭니다.

### 문제 3

회원 검색에서 전화번호 매칭을 보류한 이유는 무엇인가요?

### 정답 3

현재 `Member` 엔티티에 전화번호 필드가 없기 때문입니다. DB에 phone 필드가 추가되면 전화번호 매칭을 구현할 수 있습니다.

### 문제 4

다음 필드 중 multipart 요청에서 파일을 받을 때 사용하는 Spring 타입은 무엇인가요?

1. `String`
2. `MultipartFile`
3. `ObjectMapper`
4. `ResponseEntity`

### 정답 4

2번 `MultipartFile`입니다.

---

# 4. 풀스택 프로젝트에 연계

## 4-1. 백엔드 API 목록

| 기능 | Method | URL | 입력 |
|---|---|---|---|
| 텍스트 챗봇 | POST | `/api/ai/chat` | JSON |
| 이미지 분석 | POST | `/api/ai/analyze-image` | multipart |
| 명함 OCR | POST | `/api/ai/ocr/business-card` | multipart |
| 명함 회원 검색 | POST | `/api/ai/ocr/search` | multipart |
| 멀티모달 Q&A | POST | `/api/ai/multimodal` | multipart |

## 4-2. Next.js 연결 구조

Next.js AI 페이지:

```text
NextJS-Front/src/app/ai/
├── page.tsx
├── chat/page.tsx
├── image/page.tsx
├── business-card/page.tsx
└── multimodal/page.tsx
```

공통 API 유틸:

```text
NextJS-Front/src/lib/api.ts
```

AI 타입:

```text
NextJS-Front/src/types/ai.ts
```

## 4-3. Next.js 기본 문법

클라이언트 컴포넌트:

```tsx
"use client";
```

왜 필요한가요?

Next.js App Router에서 `useState`, `useEffect`, 이벤트 핸들러, 브라우저 API를 사용하려면 클라이언트 컴포넌트로 선언해야 합니다.

상태 관리:

```tsx
const [file, setFile] = useState<File | null>(null);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<AiErrorDisplay | null>(null);
```

문법 설명:

| 코드 | 의미 |
|---|---|
| `useState` | 화면 상태를 저장 |
| `File \| null` | 파일이 있거나 없을 수 있음 |
| `setFile(...)` | 상태 변경 |
| `submitting` | 요청 중인지 표시 |

## 4-4. Next.js multipart 요청

명함 OCR 요청:

```tsx
const formData = new FormData();
formData.append("image", file);

const response = await api.post<BusinessCardResponse>(
  "/ai/ocr/business-card",
  formData,
);
```

문법 설명:

| 코드 | 의미 |
|---|---|
| `new FormData()` | multipart 요청 Body 생성 |
| `append("image", file)` | 서버의 `@RequestPart MultipartFile image`와 이름 일치 |
| `api.post<T>` | 응답 타입을 TypeScript로 지정 |

## 4-5. Next.js 파일 미리보기

```tsx
const nextFile = e.target.files?.[0] ?? null;
setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
```

설명:

| 코드 | 의미 |
|---|---|
| `e.target.files?.[0]` | 선택한 첫 번째 파일 |
| `?? null` | 없으면 null |
| `URL.createObjectURL` | 브라우저에서 임시 미리보기 URL 생성 |
| `URL.revokeObjectURL` | 메모리 정리 |

## 4-6. Flutter 연결 구조

Flutter AI 관련 파일:

```text
Flutter-Front/lib/service/ai_service.dart
Flutter-Front/lib/screen/ai/gemini/chat_screen.dart
Flutter-Front/lib/screen/tab/ai_tab.dart
Flutter-Front/lib/my_app.dart
```

라우트 등록:

```dart
'/ai-chat': (_) => const ChatScreen(),
```

AI 탭에서 이동:

```dart
onTap: () => Navigator.pushNamed(context, '/ai-chat'),
```

## 4-7. Flutter HTTP 기본 문법

텍스트 챗봇 요청:

```dart
final res = await http.post(
  Uri.parse('$_baseUrl/chat'),
  headers: headers,
  body: jsonEncode({'prompt': message}),
);
```

문법 설명:

| 코드 | 의미 |
|---|---|
| `http.post` | POST 요청 |
| `Uri.parse` | 문자열 URL을 URI 객체로 변환 |
| `headers` | Content-Type, Authorization 설정 |
| `jsonEncode` | Dart Map을 JSON 문자열로 변환 |

## 4-8. Flutter multipart 요청

```dart
final req = http.MultipartRequest(
  'POST',
  Uri.parse('$_baseUrl/ocr/business-card'),
);
await _addAuth(req);
req.files.add(await http.MultipartFile.fromPath('image', image.path));

final streamed = await req.send();
final body = await _readStream(streamed);
```

문법 설명:

| 코드 | 의미 |
|---|---|
| `MultipartRequest` | 파일 업로드 요청 |
| `fromPath` | 파일 경로에서 업로드 파일 생성 |
| `req.send()` | 요청 전송 |
| `StreamedResponse` | 스트림 형태의 응답 |
| `utf8.decode` | 바이트를 문자열로 변환 |

## 4-9. 실행 순서

### 1단계: Spring Boot 실행

```powershell
cd Spring-Back/SpringBasic/api5012
.\gradlew bootRun
```

### 2단계: Next.js 실행

```powershell
cd NextJS-Front
npm install
npm run dev
```

브라우저:

```text
http://localhost:3000/ai
```

### 3단계: Flutter 실행

```powershell
cd Flutter-Front
flutter pub get
flutter run
```

## 4-10. 초보자 오류 해결표

| 증상 | 원인 | 해결 |
|---|---|---|
| `gemini.api.key 설정이 필요합니다.` | secret 파일 없음 | `application-secret.properties` 생성 |
| 401 Unauthorized | JWT 없음 또는 만료 | 로그인 후 다시 요청 |
| 415 Unsupported Media Type | multipart 형식 오류 | `FormData`, `MultipartRequest` 사용 |
| OCR JSON 파싱 실패 | AI 응답에 설명문 섞임 | `response_mime_type`, schema 확인 |
| 이미지 형식 오류 | MIME type이 image가 아님 | JPG, PNG, WEBP 사용 |
| Next에서 API 호출 실패 | Spring 서버 꺼짐 | Spring Boot 먼저 실행 |
| Flutter에서 localhost 연결 실패 | 에뮬레이터 네트워크 차이 | `ApiConstants.springBaseUrl2` 확인 |

## 4-11. 실습 문제

### 문제 1

Next.js에서 이미지 파일 업로드를 위해 사용하는 객체는 무엇인가요?

### 정답 1

```tsx
FormData
```

### 문제 2

Spring Controller의 `@RequestPart MultipartFile image`와 클라이언트 코드에서 반드시 맞춰야 하는 이름은 무엇인가요?

### 정답 2

```text
image
```

예:

```tsx
formData.append("image", file);
```

```dart
req.files.add(await http.MultipartFile.fromPath('image', image.path));
```

### 문제 3

Flutter에서 JSON 문자열을 Dart 객체로 바꾸는 함수는 무엇인가요?

### 정답 3

```dart
jsonDecode()
```

### 문제 4

Next.js 페이지에서 `useState`를 쓰려면 파일 상단에 무엇을 작성해야 하나요?

### 정답 4

```tsx
"use client";
```

---

# 5. 미니 프로젝트 과제

## 과제 1. 텍스트 챗봇 프롬프트 바꾸기

요구사항:

- `/api/ai/chat`에 질문을 보낸다.
- 질문 앞에 "도서관 직원처럼 친절하게 답변해줘"라는 문장을 붙인다.
- 응답을 화면에 출력한다.

힌트:

```java
String prompt = "도서관 직원처럼 친절하게 답변해줘.\n질문: " + requestDTO.getPrompt();
```

정답 예시:

```java
private String validatePrompt(ChatRequestDTO requestDTO) {
    if (requestDTO == null || requestDTO.getPrompt() == null || requestDTO.getPrompt().isBlank()) {
        throw new IllegalArgumentException("prompt 는 비어 있을 수 없습니다.");
    }
    return "도서관 직원처럼 친절하게 답변해줘.\n질문: " + requestDTO.getPrompt().trim();
}
```

## 과제 2. 이미지 분석 기본 프롬프트 바꾸기

요구사항:

- 기본 프롬프트를 "이 이미지의 주요 객체 3개와 전체 분위기를 한국어로 설명해주세요."로 변경한다.

정답 예시:

```java
String normalizedPrompt = (prompt == null || prompt.isBlank())
        ? "이 이미지의 주요 객체 3개와 전체 분위기를 한국어로 설명해주세요."
        : prompt.trim();
```

## 과제 3. 명함 OCR 결과에 `parseSuccess` 표시하기

요구사항:

- Next.js 명함 OCR 화면에서 `parseSuccess`가 true이면 "파싱 성공" 배지를 보여준다.
- false이면 "파싱 실패" 배지를 보여준다.

정답 예시:

```tsx
{ocrResult && (
  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
    {ocrResult.parseSuccess ? "파싱 성공" : "파싱 실패"}
  </span>
)}
```

## 과제 4. 회원 검색 결과가 없을 때 안내 문구 바꾸기

요구사항:

- `NO_MATCH`일 때 "회원 DB에 등록되지 않은 명함입니다."라고 표시한다.

정답 예시:

```tsx
{!searchResult.matched && (
  <p className="mt-4 text-sm leading-6 text-emerald-900">
    회원 DB에 등록되지 않은 명함입니다.
  </p>
)}
```

---

# 6. 수업 마무리 체크리스트

## 개념 체크

- [ ] AI와 생성형 AI의 차이를 설명할 수 있다.
- [ ] 프롬프트와 토큰의 의미를 설명할 수 있다.
- [ ] 멀티모달 AI가 무엇인지 설명할 수 있다.
- [ ] API Key를 클라이언트에 넣으면 안 되는 이유를 설명할 수 있다.

## 백엔드 체크

- [ ] `application-secret.properties`에 Gemini API Key를 설정했다.
- [ ] `./gradlew compileJava`가 성공한다.
- [ ] `/api/ai/chat`이 응답한다.
- [ ] `/api/ai/analyze-image`가 이미지 설명을 반환한다.
- [ ] `/api/ai/ocr/business-card`가 JSON을 반환한다.
- [ ] `/api/ai/multimodal`이 이미지 기반 답변을 반환한다.

## 프론트엔드 체크

- [ ] Next.js `/ai` 허브 페이지가 열린다.
- [ ] Next.js `/ai/chat`에서 질문을 보낼 수 있다.
- [ ] Next.js `/ai/business-card`에서 명함 이미지를 업로드할 수 있다.
- [ ] Flutter AI 탭에서 Gemini 챗봇으로 이동할 수 있다.

## 실습 제출물

- [ ] 텍스트 챗봇 응답 캡처
- [ ] 이미지 분석 응답 캡처
- [ ] 명함 OCR JSON 응답 캡처
- [ ] 멀티모달 Q&A 응답 캡처
- [ ] 오늘 배운 용어 5개 정리

---

# 7. 한 장 요약

```text
AI = 컴퓨터가 지능적인 작업을 수행하는 기술
생성형 AI = 새로운 텍스트, 이미지, 코드, 분석 결과를 만드는 AI
프롬프트 = AI에게 주는 지시문
토큰 = AI가 문장을 처리하는 작은 단위
멀티모달 = 텍스트, 이미지 등 여러 입력을 함께 처리하는 방식
Spring Boot = Gemini API Key를 숨기고 AI Gateway 역할
Next.js / Flutter = 사용자 화면과 파일 업로드 담당
Multipart = 파일 업로드 요청 형식
Base64 = 이미지를 JSON에 넣기 위해 문자열로 바꾸는 방식
JSON Schema = AI가 정해진 구조로 응답하게 만드는 규칙
```


# Gemini AI 멀티모달 통합 기획 문서

> **작성일**: 2026-04-24
> **대상 프로젝트**: Flutter-Front / NextJS-Front / Spring-Back
> **AI 엔진**: Google Gemini AI Studio API
> **핵심 아키텍처**: 클라이언트 → Spring Boot (Gemini Proxy) → Gemini API

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [전체 아키텍처](#2-전체-아키텍처)
3. [구현 기능 목록](#3-구현-기능-목록)
4. [Spring Boot 백엔드 설계](#4-spring-boot-백엔드-설계)
5. [Flutter 프론트 설계](#5-flutter-프론트-설계)
6. [Next.js 프론트 설계](#6-nextjs-프론트-설계)
7. [Gemini API 연동 상세](#7-gemini-api-연동-상세)
8. [파일 구조](#8-파일-구조)
9. [구현 단계별 로드맵](#9-구현-단계별-로드맵)
10. [환경 설정 가이드](#10-환경-설정-가이드)

---

## 1. 프로젝트 개요

### 목적

Google Gemini AI Studio API를 활용하여 **텍스트 · 이미지 멀티모달 AI 기능**을
Spring Boot 백엔드를 중심으로 Flutter(모바일), Next.js(웹) 양쪽 클라이언트에 제공하는
실전형 튜토리얼 예제를 구현합니다.

### 구현 기능 요약

| 번호 | 기능명 | 입력 | 출력 |
|------|--------|------|------|
| F-01 | **텍스트 챗봇** | 텍스트 질문 | 텍스트 응답 |
| F-02 | **이미지 인식 · 분석** | 이미지 파일 | 이미지 내용 설명 |
| F-03 | **명함 OCR 인식** | 명함 이미지 | 이름·연락처·회사 구조화 JSON |
| F-04 | **명함 기반 회원 검색** | 명함 이미지 | DB 회원 매칭 결과 |
| F-05 | **멀티모달 Q&A** | 이미지 + 텍스트 질문 | 이미지 기반 답변 |

### 기술 스택

| 영역 | 기술 |
|------|------|
| AI API | Google Gemini 2.0 Flash (`gemini-2.0-flash`) |
| 백엔드 | Spring Boot 3.x, Spring WebFlux(WebClient), Spring MVC |
| 모바일 | Flutter 3.x, Dart, `image_picker`, `http` |
| 웹 | Next.js 15, TypeScript, Tailwind CSS |
| 이미지 처리 | Base64 인코딩 (클라이언트 → 서버 전송) |
| 환경 변수 | `.env` / `application-secret.properties` |

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        클라이언트                            │
│                                                             │
│   Flutter (모바일)          Next.js (웹)                    │
│   ┌─────────────────┐      ┌─────────────────┐             │
│   │  텍스트 입력     │      │  텍스트 입력     │             │
│   │  이미지 선택     │      │  이미지 업로드   │             │
│   │  명함 촬영       │      │  명함 파일 선택  │             │
│   └────────┬────────┘      └────────┬────────┘             │
│            │  REST API (JSON/multipart)  │                  │
└────────────┼────────────────────────────┼──────────────────┘
             │                            │
             ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Spring Boot 백엔드 (AI Gateway)                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GeminiController  /api/ai/*                         │  │
│  │  ├── POST /chat          텍스트 챗봇                  │  │
│  │  ├── POST /analyze-image 이미지 분석                  │  │
│  │  ├── POST /ocr/business-card  명함 OCR               │  │
│  │  ├── POST /ocr/search         명함 → DB 검색          │  │
│  │  └── POST /multimodal    이미지 + 텍스트 Q&A          │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │  GeminiService                                        │  │
│  │  WebClient → Gemini REST API 호출                    │  │
│  │  응답 파싱 → DTO 변환                                 │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │ (명함 검색 시 DB 조회)             │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │  MemberRepository (기존 도서관 회원 DB)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│             Google Gemini AI Studio API                      │
│                                                             │
│  POST https://generativelanguage.googleapis.com/            │
│       v1beta/models/gemini-2.0-flash:generateContent        │
│                                                             │
│  지원 입력: text, image (base64 / mimeType)                 │
└─────────────────────────────────────────────────────────────┘
```

### 데이터 흐름 요약

```
[클라이언트]
  텍스트 전송    → POST /api/ai/chat          → Gemini text → 텍스트 응답
  이미지 전송    → POST /api/ai/analyze-image → Gemini vision → 이미지 설명
  명함 이미지    → POST /api/ai/ocr/business-card → Gemini OCR → 구조화 JSON
  명함 + 검색   → POST /api/ai/ocr/search    → OCR → DB 조회 → 회원 정보
  이미지 + 질문  → POST /api/ai/multimodal   → Gemini multimodal → 답변
```

---

## 3. 구현 기능 목록

### F-01. 텍스트 챗봇

**설명**: 사용자가 텍스트로 질문하면 Gemini가 답변을 반환하는 간단한 Q&A 챗봇.
대화 이력(history)을 포함하여 맥락 있는 대화 지원.

**요청/응답 예시**:
```json
// Request  POST /api/ai/chat
{
  "message": "부산도서관의 운영시간을 알려줘",
  "history": [
    { "role": "user", "text": "안녕하세요" },
    { "role": "model", "text": "안녕하세요! 무엇을 도와드릴까요?" }
  ]
}

// Response
{
  "reply": "부산도서관은 평일 09:00~21:00, 주말 09:00~18:00 운영합니다.",
  "model": "gemini-2.0-flash",
  "tokensUsed": 142
}
```

---

### F-02. 이미지 인식 · 분석

**설명**: 이미지를 업로드하면 Gemini Vision이 이미지 내용을 한국어로 설명.
도서 표지 인식, 사진 내용 파악 등 다양한 용도로 활용.

**요청/응답 예시**:
```json
// Request  POST /api/ai/analyze-image  (multipart/form-data)
// Form: image=<파일>, prompt="이 이미지를 설명해줘" (선택)

// Response
{
  "description": "이 이미지는 '스프링 부트 핵심 가이드' 도서 표지입니다. ...",
  "confidence": "high",
  "tags": ["도서", "프로그래밍", "Spring Boot"]
}
```

---

### F-03. 명함 OCR 인식

**설명**: 명함 이미지를 Gemini Vision으로 분석하여
이름, 직책, 회사, 이메일, 전화번호, 주소를 구조화된 JSON으로 추출.

**요청/응답 예시**:
```json
// Request  POST /api/ai/ocr/business-card  (multipart/form-data)
// Form: image=<명함이미지>

// Response
{
  "name": "김부산",
  "company": "부산IT솔루션",
  "department": "개발팀",
  "position": "백엔드 개발자",
  "email": "kim@busanit.co.kr",
  "phone": "010-1234-5678",
  "address": "부산광역시 해운대구 APEC로 55",
  "rawText": "김부산 / 백엔드 개발자 / 부산IT솔루션 ...",
  "parseSuccess": true
}
```

**Gemini 프롬프트 전략**:
```
이 명함 이미지에서 정보를 추출하여 반드시 아래 JSON 형식으로만 응답하세요.
다른 텍스트는 포함하지 마세요.
{
  "name": "이름",
  "company": "회사명",
  "department": "부서",
  "position": "직책",
  "email": "이메일",
  "phone": "전화번호",
  "address": "주소"
}
값이 없으면 빈 문자열("")로 채우세요.
```

---

### F-04. 명함 기반 회원 검색

**설명**: 명함 OCR로 추출한 이름/이메일/전화번호를 기존
`tbl_lib_member` DB에서 검색하여 매칭되는 회원 정보를 반환.

**요청/응답 예시**:
```json
// Request  POST /api/ai/ocr/search  (multipart/form-data)
// Form: image=<명함이미지>

// Response
{
  "ocrResult": {
    "name": "김부산",
    "email": "user01@test.com",
    "phone": "010-1234-5678"
  },
  "matchedMember": {
    "id": 2,
    "mid": "user01",
    "mname": "김부산",
    "email": "user01@test.com",
    "region": "부산광역시 해운대구",
    "role": "USER"
  },
  "matchType": "EMAIL_MATCH",
  "found": true
}
```

---

### F-05. 멀티모달 Q&A (이미지 + 텍스트)

**설명**: 이미지와 텍스트 질문을 함께 전송하면
Gemini가 이미지 내용을 참고하여 질문에 답변.

**요청/응답 예시**:
```json
// Request  POST /api/ai/multimodal  (multipart/form-data)
// Form: image=<파일>, question="이 도서의 주요 내용은 무엇인가요?"

// Response
{
  "question": "이 도서의 주요 내용은 무엇인가요?",
  "answer": "이 도서는 스프링 부트를 활용한 RESTful API 개발을 다루고 있으며...",
  "imageAnalyzed": true
}
```

---

## 4. Spring Boot 백엔드 설계

### 4-1. 디렉토리 구조

```
Spring-Back/SpringBasic/api5012/src/main/java/com/busanit501/api5012/
├── controller/ai/
│   └── GeminiController.java          # AI API 엔드포인트 5개
├── service/ai/
│   ├── GeminiService.java             # 인터페이스
│   └── GeminiServiceImpl.java         # Gemini API 호출 구현
├── dto/ai/
│   ├── ChatRequestDTO.java            # 채팅 요청
│   ├── ChatResponseDTO.java           # 채팅 응답
│   ├── ImageAnalysisResponseDTO.java  # 이미지 분석 응답
│   ├── BusinessCardDTO.java           # 명함 OCR 결과
│   ├── BusinessCardSearchDTO.java     # 명함 검색 응답
│   └── MultimodalRequestDTO.java      # 멀티모달 요청
└── config/
    └── WebClientConfig.java           # WebClient Bean 설정
```

### 4-2. GeminiController

```java
// ★ 이 파일 위치: controller/ai/GeminiController.java
// ★ REST 컨트롤러 = 브라우저/앱에서 요청을 받는 "창구" 역할

@RestController                          // JSON 응답을 반환하는 REST 컨트롤러임을 선언
@RequestMapping("/api/ai")              // 모든 엔드포인트 앞에 /api/ai 가 붙음
@RequiredArgsConstructor                 // final 필드를 자동으로 생성자 주입 (Lombok)
@Tag(name = "Gemini AI API", description = "텍스트/이미지 멀티모달 AI 기능")  // Swagger 문서용
public class GeminiController {

    // GeminiService를 주입받음 (실제 AI 호출 로직은 Service에 있음)
    private final GeminiService geminiService;

    // ────────────────────────────────────────────────────────────
    // F-01: 텍스트 챗봇
    // URL: POST /api/ai/chat
    // 요청 Body (JSON): { "message": "질문", "history": [...] }
    // ────────────────────────────────────────────────────────────
    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDTO> chat(
            @RequestBody ChatRequestDTO dto) {  // 요청 Body를 DTO 객체로 자동 변환
        // geminiService.chat()를 호출하고 결과를 200 OK로 반환
        return ResponseEntity.ok(geminiService.chat(dto));
    }

    // ────────────────────────────────────────────────────────────
    // F-02: 이미지 분석
    // URL: POST /api/ai/analyze-image
    // 요청 형식: multipart/form-data (파일 전송 시 사용하는 형식)
    // ────────────────────────────────────────────────────────────
    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageAnalysisResponseDTO> analyzeImage(
        @RequestPart MultipartFile image,   // 업로드된 이미지 파일
        @RequestParam(defaultValue = "이 이미지를 한국어로 설명해주세요.") String prompt) {
        // prompt를 전달하지 않으면 기본값("이 이미지를 한국어로 설명해주세요.")을 사용
        return ResponseEntity.ok(geminiService.analyzeImage(image, prompt));
    }

    // ────────────────────────────────────────────────────────────
    // F-03: 명함 OCR (이미지 → 구조화된 텍스트 추출)
    // URL: POST /api/ai/ocr/business-card
    // ────────────────────────────────────────────────────────────
    @PostMapping(value = "/ocr/business-card", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BusinessCardDTO> ocrBusinessCard(
        @RequestPart MultipartFile image) {  // 명함 이미지 파일 하나만 받음
        return ResponseEntity.ok(geminiService.ocrBusinessCard(image));
    }

    // ────────────────────────────────────────────────────────────
    // F-04: 명함 이미지 → DB 회원 검색
    // URL: POST /api/ai/ocr/search
    // OCR로 이름/이메일 추출 후 DB에서 매칭 회원 조회
    // ────────────────────────────────────────────────────────────
    @PostMapping(value = "/ocr/search", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BusinessCardSearchDTO> searchByBusinessCard(
        @RequestPart MultipartFile image) {
        return ResponseEntity.ok(geminiService.searchByBusinessCard(image));
    }

    // ────────────────────────────────────────────────────────────
    // F-05: 멀티모달 Q&A (이미지 + 텍스트 질문 동시 전송)
    // URL: POST /api/ai/multimodal
    // Form: image=<파일>, question="이 도서의 주제는 무엇인가요?"
    // ────────────────────────────────────────────────────────────
    @PostMapping(value = "/multimodal", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> multimodal(
        @RequestPart MultipartFile image,   // 이미지 파일
        @RequestParam String question) {    // 텍스트 질문
        return ResponseEntity.ok(geminiService.multimodal(image, question));
    }
}
```

### 4-3. GeminiService 핵심 로직

```java
// ★ 이 파일 위치: service/ai/GeminiServiceImpl.java
// ★ 실제 Gemini API 를 호출하는 "핵심 로직"이 모두 여기에 있습니다.

@Service  // Spring이 이 클래스를 서비스 Bean으로 관리하도록 선언
public class GeminiServiceImpl implements GeminiService {

    // application-secret.properties 의 gemini.api.key 값을 자동으로 주입
    // 예: gemini.api.key=AIzaSy_YOUR_KEY_HERE
    @Value("${gemini.api.key}")
    private String apiKey;

    // Gemini REST API 의 기본 URL (모델 이름이 경로에 포함됨)
    private static final String BASE_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/";

    // 사용할 모델 이름 (빠르고 저렴한 Flash 모델 권장)
    private static final String MODEL = "gemini-2.0-flash";

    // WebClient: Spring WebFlux의 비동기 HTTP 클라이언트
    // RestTemplate의 최신 대체제 (논블로킹 방식)
    private final WebClient webClient;

    // ── 텍스트 전용 요청 ──────────────────────────────────────────
    // 텍스트만 보낼 때 사용 (챗봇 F-01)
    public String generateText(String prompt) {
        // 요청할 URL: BASE_URL + MODEL + ":generateContent?key=" + apiKey
        String url = BASE_URL + MODEL + ":generateContent?key=" + apiKey;

        // Gemini API 에 보낼 요청 Body를 Map 으로 구성
        // JSON 형태: { "contents": [{ "parts": [{ "text": "질문내용" }] }] }
        Map<String, Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)  // 사용자가 보낸 텍스트 질문
                ))
            )
        );

        // WebClient 로 POST 요청 전송 후 응답 받기
        Map<String, Object> response = webClient.post()
            .uri(url)                          // 요청 URL 설정
            .bodyValue(body)                   // 요청 Body 설정
            .retrieve()                        // 응답 수신 시작
            .bodyToMono(Map.class)             // 응답을 Map 타입으로 변환
            .block();                          // 비동기를 동기로 전환(결과 기다림)

        return extractText(response);          // 응답에서 텍스트 추출
    }

    // ── 이미지 + 텍스트 (멀티모달) 요청 ─────────────────────────
    // 이미지와 텍스트를 함께 보낼 때 사용 (이미지 분석 F-02, 명함 OCR F-03)
    public String generateWithImage(byte[] imageBytes, String mimeType, String prompt) {
        String url = BASE_URL + MODEL + ":generateContent?key=" + apiKey;

        // 이미지를 Base64 문자열로 인코딩
        // Base64: 바이너리(이진) 데이터를 텍스트로 변환하는 방식
        // JSON은 텍스트 기반이라 이미지를 직접 담을 수 없어서 변환이 필요함
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        // 요청 Body: parts 배열에 이미지와 텍스트를 순서대로 넣음
        Map<String, Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("inline_data", Map.of(
                        "mime_type", mimeType,    // 이미지 형식 (예: "image/jpeg")
                        "data", base64Image       // Base64로 인코딩된 이미지 데이터
                    )),
                    Map.of("text", prompt)        // 이미지와 함께 보낼 텍스트 질문
                ))
            )
        );

        Map<String, Object> response = webClient.post()
            .uri(url)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(Map.class)
            .block();

        return extractText(response);
    }

    // ── Gemini 응답에서 텍스트만 꺼내는 헬퍼 메서드 ──────────────
    // Gemini 응답 JSON 구조:
    // { "candidates": [{ "content": { "parts": [{ "text": "AI답변" }] } }] }
    @SuppressWarnings("unchecked")  // 제네릭 캐스팅 경고 무시 (Map 형변환)
    private String extractText(Map<String, Object> response) {
        // candidates 배열 꺼내기
        List<Map<String, Object>> candidates =
            (List<Map<String, Object>>) response.get("candidates");
        // 첫 번째 후보의 content 꺼내기
        Map<String, Object> content =
            (Map<String, Object>) candidates.get(0).get("content");
        // parts 배열 꺼내기
        List<Map<String, Object>> parts =
            (List<Map<String, Object>>) content.get("parts");
        // 첫 번째 part의 text 값 반환
        return (String) parts.get(0).get("text");
    }
}
```

### 4-4. Gemini API 요청 Body 구조

```json
// ★ Gemini API에 POST 요청 시 보내는 JSON Body 예시입니다.
// ★ 아래 구조를 그대로 복사해서 Postman으로 테스트해 볼 수 있습니다.

// ── 텍스트 전용 요청 ────────────────────────────────────────────
{
  "contents": [              // 대화 내용을 담는 배열 (여러 턴의 대화를 넣을 수 있음)
    {
      "role": "user",        // 이 메시지를 보내는 역할: "user"(사용자) 또는 "model"(AI)
      "parts": [
        { "text": "질문 내용" }   // 실제 질문 텍스트
      ]
    }
  ],
  "generationConfig": {          // AI 응답 생성 옵션 설정
    "temperature": 0.7,          // 창의성 수준 (0.0=정확, 1.0=창의적, 기본 0.7 권장)
    "maxOutputTokens": 1024      // 최대 응답 길이 (토큰 수, 1토큰 ≈ 1~2 한글 글자)
  }
}

// ── 이미지 + 텍스트 동시 전송 (멀티모달) ──────────────────────
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "inline_data": {              // 이미지 데이터를 직접 포함하는 방식
            "mime_type": "image/jpeg",  // 이미지 형식 (jpeg/png/webp/gif 지원)
            "data": "<base64_encoded_image>"  // 이미지를 Base64로 인코딩한 문자열
            // Base64 변환 예: Base64.getEncoder().encodeToString(imageBytes)
          }
        },
        { "text": "이 이미지를 분석해주세요" }  // 이미지에 대한 질문
      ]
    }
  ]
  // generationConfig 생략 시 기본값 사용
}
```

### 4-5. 환경 변수 설정

```properties
# application-secret.properties (gitignore)
gemini.api.key=AIzaSy...your-api-key-here

# application.properties
spring.profiles.include=secret
gemini.api.key=${GEMINI_API_KEY:}
gemini.model=gemini-2.0-flash
gemini.max-tokens=2048
gemini.temperature=0.7
```

### 4-6. CORS 추가 (CustomSecurityConfig)

```java
// 기존 CORS 설정에 /api/ai/** 경로 허용 추가
// 현재 설정에서 자동 포함됨 (전체 /api/** 허용)
```

---

## 5. Flutter 프론트 설계

### 5-1. 화면 구성

```
lib/
├── screens/ai/
│   ├── ai_home_screen.dart          # AI 기능 허브 화면
│   ├── chat_screen.dart             # F-01: 텍스트 챗봇
│   ├── image_analyze_screen.dart    # F-02: 이미지 분석
│   ├── business_card_screen.dart    # F-03 + F-04: 명함 OCR + 검색
│   └── multimodal_screen.dart       # F-05: 이미지 + 질문
├── services/
│   └── ai_service.dart              # API 호출 로직
└── models/ai/
    ├── chat_message.dart
    ├── business_card.dart
    └── ai_response.dart
```

### 5-2. AI 기능 홈 화면 (ai_home_screen.dart)

```dart
class AiHomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('AI 기능 체험')),
      body: GridView.count(
        crossAxisCount: 2,
        children: [
          _AiFeatureCard(
            icon: Icons.chat,
            title: '텍스트 챗봇',
            subtitle: 'AI와 대화하기',
            onTap: () => Navigator.push(...ChatScreen()),
          ),
          _AiFeatureCard(
            icon: Icons.image_search,
            title: '이미지 분석',
            subtitle: '사진 내용 파악',
            onTap: () => Navigator.push(...ImageAnalyzeScreen()),
          ),
          _AiFeatureCard(
            icon: Icons.contact_page,
            title: '명함 인식',
            subtitle: 'OCR + 회원 검색',
            onTap: () => Navigator.push(...BusinessCardScreen()),
          ),
          _AiFeatureCard(
            icon: Icons.auto_awesome,
            title: '이미지 Q&A',
            subtitle: '사진 관련 질문',
            onTap: () => Navigator.push(...MultimodalScreen()),
          ),
        ],
      ),
    );
  }
}
```

### 5-3. 명함 인식 화면 (business_card_screen.dart)

```dart
// ★ 이 파일 위치: lib/screens/ai/business_card_screen.dart
// ★ StatefulWidget: 상태(데이터)가 변하는 화면에 사용
//   예) 이미지 선택 후 화면이 바뀌어야 하므로 StatefulWidget 사용

class BusinessCardScreen extends StatefulWidget {
  @override
  _BusinessCardScreenState createState() => _BusinessCardScreenState();
}

class _BusinessCardScreenState extends State<BusinessCardScreen> {
  File? _image;           // 선택한 이미지 파일 (null = 아직 선택 안 함)
  BusinessCard? _ocrResult;    // OCR 결과 (null = 아직 인식 안 함)
  Member? _matchedMember;      // 검색된 회원 정보 (null = 검색 전 또는 없음)
  bool _loading = false;       // true이면 로딩 중 (버튼 비활성화, 스피너 표시)

  // ── 카메라 또는 갤러리에서 이미지 선택 ──────────────────────────
  // source: ImageSource.camera (카메라) 또는 ImageSource.gallery (갤러리)
  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();  // image_picker 패키지의 핵심 클래스
    final picked = await picker.pickImage(source: source);  // 이미지 선택 대화상자 열기
    if (picked != null) {
      // setState: 내부 변수를 바꾸면서 화면을 다시 그리도록 Flutter에 알림
      setState(() => _image = File(picked.path));  // 선택한 파일 경로로 File 객체 생성
    }
  }

  // ── 명함 OCR 요청 ─────────────────────────────────────────────
  Future<void> _recognizeCard() async {
    setState(() => _loading = true);  // 로딩 시작: 버튼 비활성화 등
    final result = await AiService.ocrBusinessCard(_image!);
    // _image! : null이 아님을 보장하는 느낌표 연산자 (null이면 런타임 에러)
    setState(() {
      _ocrResult = result;   // OCR 결과 저장
      _loading = false;      // 로딩 종료
    });
  }

  // ── 회원 검색 요청 ────────────────────────────────────────────
  Future<void> _searchMember() async {
    setState(() => _loading = true);
    final result = await AiService.searchByBusinessCard(_image!);
    setState(() {
      _matchedMember = result.matchedMember;  // 검색된 회원 정보만 꺼냄
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('명함 인식 & 검색')),
      body: SingleChildScrollView(  // 내용이 길어질 때 스크롤 가능하게
        child: Column(
          children: [
            // 이미지 프리뷰: _image가 null이 아니면 선택한 이미지 표시
            if (_image != null)
              Image.file(_image!, height: 200, fit: BoxFit.cover),

            // 촬영/갤러리 선택 버튼 Row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  icon: Icon(Icons.camera_alt),
                  label: Text('촬영'),
                  onPressed: () => _pickImage(ImageSource.camera),
                ),
                SizedBox(width: 12),
                ElevatedButton.icon(
                  icon: Icon(Icons.photo_library),
                  label: Text('갤러리'),
                  onPressed: () => _pickImage(ImageSource.gallery),
                ),
              ],
            ),

            // OCR 실행 버튼: 이미지가 선택된 경우에만 활성화
            ElevatedButton(
              onPressed: (_image != null && !_loading) ? _recognizeCard : null,
              child: _loading ? CircularProgressIndicator() : Text('명함 인식'),
            ),

            // OCR 결과 표시: _ocrResult가 있을 때만 표시
            if (_ocrResult != null) ...[
              ListTile(title: Text('이름'), subtitle: Text(_ocrResult!.name)),
              ListTile(title: Text('회사'), subtitle: Text(_ocrResult!.company)),
              ListTile(title: Text('전화'), subtitle: Text(_ocrResult!.phone)),
              ListTile(title: Text('이메일'), subtitle: Text(_ocrResult!.email)),
              // 회원 검색 버튼
              ElevatedButton(
                onPressed: !_loading ? _searchMember : null,
                child: Text('회원 검색'),
              ),
            ],

            // 회원 검색 결과: _matchedMember가 있을 때만 표시
            if (_matchedMember != null)
              Card(
                child: ListTile(
                  title: Text('매칭 회원: ${_matchedMember!.mname}'),
                  subtitle: Text(_matchedMember!.email),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
```

### 5-4. AiService (api 호출)

```dart
// ★ 이 파일 위치: lib/services/ai_service.dart
// ★ 모든 AI 관련 HTTP 요청을 여기서 처리합니다.
// ★ static 메서드로 구성되어 AiService.chat(...) 처럼 인스턴스 없이 바로 호출 가능

class AiService {
  // 서버 주소: 실제 배포 시 IP를 변경하세요
  // 안드로이드 에뮬레이터에서 localhost = 10.0.2.2
  // 실제 기기 테스트 시 컴퓨터의 실제 IP 주소 사용
  static const _base = 'http://YOUR_SERVER_IP:8080/api/ai';

  // ── F-01: 텍스트 챗봇 ──────────────────────────────────────────
  // message: 사용자가 보내는 현재 메시지
  // history: 이전 대화 내역 (맥락 유지를 위해 함께 전송)
  static Future<String> chat(String message, List<Map> history) async {
    final res = await http.post(
      Uri.parse('$_base/chat'),               // 요청 URL
      headers: {'Content-Type': 'application/json'},  // JSON 형식으로 전송
      body: jsonEncode({                       // Map → JSON 문자열 변환
        'message': message,
        'history': history,
      }),
    );
    // res.body: 서버 응답 JSON 문자열
    // jsonDecode: JSON 문자열 → Map 변환
    // ['reply']: 서버가 반환한 ChatResponseDTO 의 reply 필드
    return jsonDecode(res.body)['reply'];
  }

  // ── F-02: 이미지 분석 ─────────────────────────────────────────
  // MultipartRequest: 파일(이미지)을 포함한 multipart/form-data 요청
  static Future<String> analyzeImage(File image, {String? prompt}) async {
    // MultipartRequest: 일반 http.post 와 달리 파일 전송이 가능
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$_base/analyze-image'),
    );
    // files에 이미지 파일 추가: 서버의 @RequestPart("image")와 이름 일치해야 함
    request.files.add(await http.MultipartFile.fromPath('image', image.path));
    // 선택적 prompt 필드 추가
    if (prompt != null) request.fields['prompt'] = prompt;

    final res = await request.send();  // 요청 전송
    // StreamedResponse는 스트림이라 bytesToString()으로 문자열 변환 필요
    final body = await res.stream.bytesToString();
    return jsonDecode(body)['description'];  // 이미지 설명 텍스트 반환
  }

  // ── F-03: 명함 OCR ────────────────────────────────────────────
  // 반환 타입이 String이 아닌 BusinessCard 객체 (구조화된 데이터)
  static Future<BusinessCard> ocrBusinessCard(File image) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$_base/ocr/business-card'),
    );
    request.files.add(await http.MultipartFile.fromPath('image', image.path));
    final res = await request.send();
    final body = await res.stream.bytesToString();
    // fromJson: JSON Map을 BusinessCard 객체로 변환하는 팩토리 생성자
    return BusinessCard.fromJson(jsonDecode(body));
  }

  // ── F-04: 명함 → 회원 검색 ───────────────────────────────────
  static Future<BusinessCardSearchResult> searchByBusinessCard(File image) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$_base/ocr/search'),
    );
    request.files.add(await http.MultipartFile.fromPath('image', image.path));
    final res = await request.send();
    final body = await res.stream.bytesToString();
    return BusinessCardSearchResult.fromJson(jsonDecode(body));
  }

  // ── F-05: 멀티모달 (이미지 + 질문 동시 전송) ─────────────────
  static Future<String> multimodal(File image, String question) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$_base/multimodal'),
    );
    request.files.add(await http.MultipartFile.fromPath('image', image.path));
    request.fields['question'] = question;  // 텍스트 질문은 fields에 추가
    final res = await request.send();
    final body = await res.stream.bytesToString();
    return jsonDecode(body)['answer'];  // 서버가 반환한 answer 필드
  }
}
```

### 5-5. pubspec.yaml 추가 의존성

```yaml
dependencies:
  image_picker: ^1.0.7      # 카메라/갤러리 이미지 선택
  http: ^1.2.0              # HTTP 요청
  path: ^1.9.0              # 파일 경로
  flutter_markdown: ^0.7.0  # AI 응답 마크다운 렌더링
```

---

## 6. Next.js 프론트 설계

### 6-1. 페이지 구성

```
NextJS-Front/src/app/
├── ai/
│   ├── page.tsx                     # AI 기능 허브 페이지
│   ├── chat/
│   │   └── page.tsx                 # F-01: 텍스트 챗봇
│   ├── image/
│   │   └── page.tsx                 # F-02: 이미지 분석
│   ├── business-card/
│   │   └── page.tsx                 # F-03 + F-04: 명함 OCR + 검색
│   └── multimodal/
│       └── page.tsx                 # F-05: 이미지 + 질문
└── api/
    └── (기존 api 라우트 유지)
```

### 6-2. AI 허브 페이지 (ai/page.tsx)

```tsx
export default function AiHubPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">🤖 AI 기능 체험</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AiFeatureCard
          href="/ai/chat"
          icon="💬"
          title="텍스트 챗봇"
          description="AI와 자유롭게 대화하세요. 도서관 관련 질문도 OK!"
        />
        <AiFeatureCard
          href="/ai/image"
          icon="🖼️"
          title="이미지 분석"
          description="이미지를 업로드하면 AI가 내용을 설명해드립니다."
        />
        <AiFeatureCard
          href="/ai/business-card"
          icon="📇"
          title="명함 OCR · 회원 검색"
          description="명함을 찍으면 정보를 추출하고 회원을 검색합니다."
        />
        <AiFeatureCard
          href="/ai/multimodal"
          icon="🔍"
          title="이미지 Q&A"
          description="이미지와 질문을 함께 보내 AI의 답변을 받아보세요."
        />
      </div>
    </main>
  );
}
```

### 6-3. 텍스트 챗봇 페이지 (ai/chat/page.tsx)

```tsx
// ★ 이 파일 위치: src/app/ai/chat/page.tsx
// ★ "use client" : 이 컴포넌트는 브라우저에서 실행됨 (useState, fetch 사용 가능)
//   Next.js 13+ App Router에서 클라이언트 컴포넌트임을 선언하는 필수 지시어
"use client";

// 채팅 메시지 하나의 타입 정의
// role: "user" = 사용자 메시지, "model" = AI 메시지
interface ChatMessage { role: "user" | "model"; text: string; }

export default function ChatPage() {
  // messages: 화면에 표시할 전체 대화 목록 (초기값: 빈 배열)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // input: 현재 입력창에 타이핑 중인 텍스트
  const [input, setInput] = useState("");
  // loading: true면 AI가 응답 중 (입력창 비활성화, 로딩 표시)
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;  // 빈 문자열은 전송하지 않음

    // 사용자 메시지 객체 생성
    const userMsg: ChatMessage = { role: "user", text: input };
    // 기존 메시지 목록에 사용자 메시지를 추가한 새 배열
    const history = [...messages, userMsg];
    setMessages(history);   // 화면에 사용자 메시지 즉시 표시
    setInput("");            // 입력창 초기화
    setLoading(true);        // 로딩 시작

    // Next.js 프록시 라우트를 통해 Spring Boot로 전달
    // 직접 Spring Boot를 호출하지 않아 CORS 문제 없음
    const res = await fetch("/api/ai/proxy/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // history: 이전 대화 내역을 함께 보내 맥락 있는 대화 가능
      body: JSON.stringify({ message: input, history: messages }),
    });
    const data = await res.json();
    // AI 응답을 대화 목록에 추가
    setMessages([...history, { role: "model", text: data.reply }]);
    setLoading(false);  // 로딩 종료
  };

  return (
    <main className="flex h-screen flex-col">
      {/* 메시지 목록 영역: flex-1로 남은 공간 채움, 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          // 사용자 메시지: 오른쪽 정렬 / AI 메시지: 왼쪽 정렬
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className={`inline-block rounded-lg px-4 py-2 text-sm
              ${m.role === "user"
                ? "bg-brand-600 text-white"  // 사용자: 파란 배경 흰 글자
                : "bg-gray-100"              // AI: 회색 배경
              }`}>
              {m.text}
            </span>
          </div>
        ))}
        {/* loading이 true일 때만 "AI가 답변 중..." 표시 */}
        {loading && <div className="text-gray-400 text-sm">AI가 답변 중...</div>}
      </div>

      {/* 입력창 영역: 화면 하단에 고정 */}
      <div className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}       // 타이핑할 때마다 상태 업데이트
          onKeyDown={e => e.key === "Enter" && sendMessage()}  // Enter 키로 전송
          placeholder="질문을 입력하세요..."
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={loading}  // 로딩 중에는 버튼 비활성화
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50">
          전송
        </button>
      </div>
    </main>
  );
}
```

### 6-4. 명함 OCR 페이지 (ai/business-card/page.tsx)

```tsx
// ★ 이 파일 위치: src/app/ai/business-card/page.tsx
"use client";

// TypeScript 타입 정의 (서버 응답 구조와 일치해야 함)
interface BusinessCard {
  name: string; company: string; email: string;
  phone: string; position: string; address: string;
}
interface SearchResult {
  ocrResult: BusinessCard;
  matchedMember: { id: number; mid: string; mname: string; email: string } | null;
  found: boolean;
}

export default function BusinessCardPage() {
  const [file, setFile] = useState<File | null>(null);          // 선택한 파일
  const [preview, setPreview] = useState<string | null>(null);  // 미리보기 URL
  const [ocrResult, setOcrResult] = useState<BusinessCard | null>(null);    // OCR 결과
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null); // 검색 결과
  const [loading, setLoading] = useState(false);

  // 파일 입력창에서 파일 선택 시 호출
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];  // 첫 번째 파일 (없으면 undefined)
    if (f) {
      setFile(f);
      // URL.createObjectURL: 파일을 브라우저 메모리 URL로 변환 (미리보기용)
      setPreview(URL.createObjectURL(f));
    }
  };

  // 명함 OCR 버튼 클릭
  const handleOcr = async () => {
    if (!file) return;
    setLoading(true);
    // FormData: 파일을 포함한 multipart/form-data 요청을 만들 때 사용
    const form = new FormData();
    form.append("image", file);  // 서버의 @RequestPart("image")와 이름 일치
    const res = await fetch("/api/ai/proxy/ocr/business-card", {
      method: "POST",
      body: form,  // Content-Type은 자동으로 multipart/form-data로 설정됨
    });
    setOcrResult(await res.json());  // 응답 JSON을 BusinessCard 타입으로 파싱
    setLoading(false);
  };

  // 회원 검색 버튼 클릭
  const handleSearch = async () => {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/ai/proxy/ocr/search", { method: "POST", body: form });
    setSearchResult(await res.json());
    setLoading(false);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">📇 명함 인식 & 회원 검색</h1>

      {/* 파일 선택 입력창 (이미지 파일만 허용) */}
      <input type="file" accept="image/*" onChange={handleFileChange}
        className="mb-4 block w-full text-sm" />

      {/* 미리보기: 파일 선택 후 표시 */}
      {preview && (
        <img src={preview} alt="명함 미리보기"
          className="mb-4 max-h-48 rounded border object-contain" />
      )}

      {/* 버튼 그룹 */}
      <div className="flex gap-2 mb-4">
        <button onClick={handleOcr} disabled={!file || loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40">
          {loading ? "처리 중..." : "명함 인식 (OCR)"}
        </button>
        <button onClick={handleSearch} disabled={!file || loading}
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-40">
          회원 검색
        </button>
      </div>

      {/* OCR 결과 카드 */}
      {ocrResult && (
        <div className="rounded border p-4 mb-4 bg-gray-50">
          <h2 className="font-bold mb-2">인식 결과</h2>
          <p>이름: {ocrResult.name}</p>
          <p>회사: {ocrResult.company}</p>
          <p>직책: {ocrResult.position}</p>
          <p>전화: {ocrResult.phone}</p>
          <p>이메일: {ocrResult.email}</p>
        </div>
      )}

      {/* 회원 검색 결과 */}
      {searchResult && (
        <div className="rounded border p-4 bg-gray-50">
          <h2 className="font-bold mb-2">
            {searchResult.found ? "✅ 회원 발견" : "❌ 일치하는 회원 없음"}
          </h2>
          {searchResult.matchedMember && (
            <p>회원명: {searchResult.matchedMember.mname} ({searchResult.matchedMember.mid})</p>
          )}
        </div>
      )}
    </main>
  );
}
```

### 6-5. Next.js API Route (프록시, 선택사항)

CORS 문제 방지 또는 API Key 보안을 위해
Next.js에서 Spring Boot로 프록시하는 Route Handler 활용 가능.

```typescript
// ★ 이 파일 위치: src/app/api/ai/proxy/[...path]/route.ts
// ★ [...path] : 동적 경로 — /api/ai/proxy/chat, /api/ai/proxy/ocr/search 등
//   모든 AI 프록시 요청을 이 파일 하나에서 처리합니다.
// ★ 이 파일이 있으면 클라이언트에서 직접 Spring Boot를 호출하지 않아도 됩니다.
//   CORS 에러 없음 + API 서버 주소 숨김

export async function POST(
  req: Request,
  { params }: { params: { path: string[] } }  // [...path] 부분이 배열로 들어옴
) {
  // path 배열을 "/"로 합쳐서 실제 경로 구성
  // 예: ["ocr", "business-card"] → "ocr/business-card"
  const path = params.path.join("/");

  // 요청 Body를 Blob으로 읽음 (텍스트 JSON이든 multipart 파일이든 그대로 전달)
  const body = await req.blob();

  // Spring Boot 서버로 요청 전달 (환경변수에서 서버 주소 읽음)
  // process.env.SPRING_API_URL: .env.local 의 SPRING_API_URL 값
  const res = await fetch(`${process.env.SPRING_API_URL}/api/ai/${path}`, {
    method: "POST",
    body,
    // Content-Type 헤더를 그대로 전달 (JSON이면 JSON, multipart면 multipart)
    headers: { "Content-Type": req.headers.get("Content-Type") ?? "" },
  });

  // Spring Boot 응답을 클라이언트에 그대로 전달 (상태 코드 포함)
  return new Response(await res.blob(), { status: res.status });
}
```

---

## 7. Gemini API 연동 상세

### 7-1. API 엔드포인트

| 용도 | Method | URL |
|------|--------|-----|
| 콘텐츠 생성 | POST | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}` |
| 스트리밍 | POST | `...{model}:streamGenerateContent?key={API_KEY}` |
| 모델 목록 | GET | `https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}` |

### 7-2. 사용 모델 권장

| 모델 | 특징 | 용도 |
|------|------|------|
| `gemini-2.0-flash` | 빠름, 저비용, 멀티모달 | **기본 추천** (챗봇, OCR, 이미지 분석) |
| `gemini-1.5-pro` | 고성능, 긴 컨텍스트 | 복잡한 문서 분석 |
| `gemini-1.5-flash` | 균형 | 일반 용도 |

### 7-3. 응답 구조 파싱

```json
// Gemini API 응답 형식
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "AI 응답 텍스트" }],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 50,
    "candidatesTokenCount": 142,
    "totalTokenCount": 192
  },
  "modelVersion": "gemini-2.0-flash"
}
```

```java
// ★ Gemini API 응답 JSON 에서 실제 텍스트만 꺼내는 파싱 코드입니다.
// ★ 응답 구조가 중첩(nested)되어 있어서 단계적으로 접근해야 합니다.

@SuppressWarnings("unchecked")  // Map 제네릭 캐스팅 시 발생하는 컴파일 경고 억제
private String extractText(Map<String, Object> response) {
    // 1단계: 최상위에서 "candidates" 배열을 꺼냄
    // 응답 예: { "candidates": [ {...} ], "usageMetadata": {...} }
    List<Map<String, Object>> candidates =
        (List<Map<String, Object>>) response.get("candidates");

    // 2단계: candidates[0] (첫 번째 후보) 의 "content" 꺼냄
    // candidates[0] 예: { "content": { "parts": [...], "role": "model" } }
    Map<String, Object> content =
        (Map<String, Object>) candidates.get(0).get("content");

    // 3단계: content 안의 "parts" 배열을 꺼냄
    // parts 예: [ { "text": "AI 답변 텍스트" } ]
    List<Map<String, Object>> parts =
        (List<Map<String, Object>>) content.get("parts");

    // 4단계: parts[0].text 가 실제 AI 답변 텍스트
    return (String) parts.get(0).get("text");
}
```

### 7-4. 명함 OCR JSON 파싱 전략

Gemini는 JSON만 반환하도록 프롬프트 엔지니어링 + `response_mime_type` 설정:

```json
// ★ response_mime_type 을 "application/json" 으로 설정하면
// ★ Gemini가 순수 JSON 만 반환하여 파싱이 훨씬 쉬워집니다.
// ★ response_schema 로 원하는 JSON 구조를 미리 정의할 수 있습니다.
{
  "contents": [
    // ... (이미지 + "명함에서 정보를 추출해줘" 프롬프트)
  ],
  "generationConfig": {
    "response_mime_type": "application/json",  // JSON 형식으로만 응답하도록 강제
    "response_schema": {                        // 응답 JSON의 스키마(구조) 정의
      "type": "object",                         // 최상위가 JSON 객체임을 지정
      "properties": {
        "name":    { "type": "string" },  // 이름 필드
        "company": { "type": "string" },  // 회사명 필드
        "email":   { "type": "string" },  // 이메일 필드
        "phone":   { "type": "string" }   // 전화번호 필드
      }
      // 이 스키마대로 Gemini가 JSON을 구성해서 반환함
    }
  }
}
```

---

## 8. 파일 구조

### 8-1. Spring Boot 신규 파일

```
Spring-Back/SpringBasic/api5012/src/main/java/com/busanit501/api5012/
├── controller/ai/
│   └── GeminiController.java
├── service/ai/
│   ├── GeminiService.java
│   └── GeminiServiceImpl.java
├── dto/ai/
│   ├── ChatRequestDTO.java
│   ├── ChatResponseDTO.java
│   ├── GeminiRequestDTO.java          # Gemini API 요청 래퍼
│   ├── ImageAnalysisResponseDTO.java
│   ├── BusinessCardDTO.java
│   └── BusinessCardSearchResponseDTO.java
└── config/
    └── WebClientConfig.java           # WebClient Bean

resources/
├── application.properties             # gemini.* 설정 추가
└── application-secret.properties      # API 키 (gitignore)
```

### 8-2. Flutter 신규 파일

```
Flutter-Front/lib/
├── screens/ai/
│   ├── ai_home_screen.dart
│   ├── chat_screen.dart
│   ├── image_analyze_screen.dart
│   ├── business_card_screen.dart
│   └── multimodal_screen.dart
├── services/
│   └── ai_service.dart
└── models/ai/
    ├── chat_message.dart
    ├── business_card.dart
    └── image_analysis_result.dart
```

### 8-3. Next.js 신규 파일

```
NextJS-Front/src/
├── app/ai/
│   ├── page.tsx
│   ├── chat/page.tsx
│   ├── image/page.tsx
│   ├── business-card/page.tsx
│   └── multimodal/page.tsx
├── app/api/ai/proxy/[...path]/
│   └── route.ts                       # 선택: 프록시 라우트
├── lib/
│   └── ai-api.ts                      # AI API 호출 유틸
└── types/
    └── ai.ts                          # AI 관련 TypeScript 타입
```

---

## 9. 구현 단계별 로드맵

### Phase 1: 백엔드 기반 설정 (Day 1)

- [ ] `build.gradle`에 `spring-boot-starter-webflux` 추가 (WebClient)
- [ ] `WebClientConfig.java` 작성 (WebClient Bean)
- [ ] `application.properties`에 `gemini.*` 설정 추가
- [ ] `application-secret.properties` 생성 (API 키, .gitignore 등록)
- [ ] `GeminiService` 인터페이스 + `GeminiServiceImpl` 기본 구조 작성
- [ ] **텍스트 전용 Gemini 호출 테스트** (단위 테스트)

### Phase 2: 텍스트 챗봇 (Day 1~2)

- [ ] `ChatRequestDTO`, `ChatResponseDTO` 작성
- [ ] `GeminiServiceImpl.chat()` 구현
- [ ] `GeminiController.chat()` 엔드포인트 구현
- [ ] Postman/Swagger로 `/api/ai/chat` 동작 확인
- [ ] Next.js 채팅 페이지 구현 (`/ai/chat`)
- [ ] Flutter 채팅 화면 구현

### Phase 3: 이미지 분석 (Day 2~3)

- [ ] `ImageAnalysisResponseDTO` 작성
- [ ] `GeminiServiceImpl.analyzeImage()` 구현 (Base64 변환 포함)
- [ ] `GeminiController.analyzeImage()` 엔드포인트 구현
- [ ] Next.js 이미지 분석 페이지 구현 (`/ai/image`)
- [ ] Flutter 이미지 선택 + 분석 화면 구현
- [ ] `image_picker` 권한 설정 (Android `AndroidManifest.xml`, iOS `Info.plist`)

### Phase 4: 명함 OCR (Day 3~4)

- [ ] `BusinessCardDTO` 작성 (JSON 구조화 스키마)
- [ ] `GeminiServiceImpl.ocrBusinessCard()` 구현
  - Gemini `response_mime_type: application/json` + JSON Schema 활용
- [ ] `GeminiController.ocrBusinessCard()` 구현
- [ ] OCR JSON 파싱 유틸 작성
- [ ] Next.js 명함 OCR 페이지 구현
- [ ] Flutter 명함 촬영/선택 + OCR 화면 구현

### Phase 5: 명함 → 회원 검색 (Day 4)

- [ ] `BusinessCardSearchResponseDTO` 작성
- [ ] `GeminiServiceImpl.searchByBusinessCard()` 구현
  - OCR → 이름/이메일/전화번호 추출 → `MemberRepository` 조회
- [ ] `GeminiController.searchByBusinessCard()` 구현
- [ ] 검색 결과 화면 (Next.js, Flutter) 연결

### Phase 6: 멀티모달 Q&A + 통합 (Day 5)

- [ ] `GeminiServiceImpl.multimodal()` 구현
- [ ] `GeminiController.multimodal()` 구현
- [ ] Next.js 멀티모달 페이지 구현
- [ ] Flutter 멀티모달 화면 구현
- [ ] Navbar에 AI 메뉴 링크 추가 (Next.js)
- [ ] Flutter 바텀 네비게이션에 AI 탭 추가

### Phase 7: 마무리 (Day 5~6)

- [ ] 에러 처리 통일 (Gemini API 오류 코드별 메시지)
- [ ] 로딩 상태, 빈 응답 처리
- [ ] API 호출 제한(Rate Limit) 대응 (retry 로직)
- [ ] README 업데이트
- [ ] 단위 테스트 작성 (`GeminiServiceTest`)
- [ ] Git 커밋 + 푸시

---

## 10. 환경 설정 가이드

### 10-1. Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/) 접속
2. 로그인 후 **"Get API Key"** 클릭
3. **"Create API Key"** 클릭 → API 키 복사
4. 무료 티어: 분당 15 요청 / 일 1,500 요청 (2024년 기준)

### 10-2. Spring Boot 설정

```properties
# application-secret.properties (절대 커밋 금지)
gemini.api.key=AIzaSy_YOUR_KEY_HERE
```

```
# .gitignore 에 추가
**/application-secret.properties
**/.env.local
```

### 10-3. Flutter 권한 설정

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

```xml
<!-- ios/Runner/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>명함 촬영을 위해 카메라 접근이 필요합니다.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>명함 이미지 선택을 위해 사진 접근이 필요합니다.</string>
```

### 10-4. Next.js 환경 변수

```bash
# NextJS-Front/.env.local (절대 커밋 금지)
SPRING_API_URL=http://localhost:8080
NEXT_PUBLIC_AI_ENABLED=true
```

### 10-5. build.gradle 추가 의존성

```groovy
dependencies {
    // 기존 의존성 유지
    ...
    // WebClient (Gemini API 비동기 호출)
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    // JSON 파싱 (이미 포함되어 있을 수 있음)
    implementation 'com.fasterxml.jackson.core:jackson-databind'
}
```

---

## 참고 자료

| 자료 | URL |
|------|-----|
| Gemini API 공식 문서 | https://ai.google.dev/api/generate-content |
| Gemini API 모델 목록 | https://ai.google.dev/gemini-api/docs/models |
| Google AI Studio | https://aistudio.google.com/ |
| Gemini Vision (이미지) | https://ai.google.dev/gemini-api/docs/vision |
| JSON 응답 스키마 | https://ai.google.dev/gemini-api/docs/structured-output |
| Flutter image_picker | https://pub.dev/packages/image_picker |

---

> **다음 단계**: 이 문서를 기반으로 Phase 1부터 순서대로 구현을 시작합니다.
> 구현 시작 전 Gemini API 키를 먼저 발급받아 `application-secret.properties`에 등록하세요.

---

## 11. 단위 테스트 코드

> **사용법**: 아래 코드를 각 플랫폼의 테스트 디렉토리에 파일을 만들어 붙여 넣으세요.
> 실제 Gemini API를 호출하지 않고 **Mock(가짜 객체)**으로 테스트하므로 API 키 없이도 실행됩니다.

---

### 11-1. Spring Boot 단위 테스트

**파일 위치**: `src/test/java/com/busanit501/api5012/service/ai/GeminiServiceTest.java`

```java
// ★ Spring Boot 단위 테스트 파일
// ★ Mockito로 WebClient를 Mock하여 실제 API 호출 없이 로직만 검증합니다.
// ★ 실행: IntelliJ에서 클래스명 옆 ▶ 버튼 클릭, 또는 ./gradlew test

package com.busanit501.api5012.service.ai;

import com.busanit501.api5012.dto.ai.BusinessCardDTO;
import com.busanit501.api5012.dto.ai.ChatRequestDTO;
import com.busanit501.api5012.dto.ai.ChatResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

// @ExtendWith(MockitoExtension.class): Mockito를 JUnit 5와 함께 사용하기 위한 설정
@ExtendWith(MockitoExtension.class)
class GeminiServiceTest {

    // @Mock: 실제 객체 대신 가짜(Mock) 객체를 생성
    // WebClient는 외부 API를 호출하므로 테스트에서는 가짜로 대체
    @Mock
    private WebClient webClient;

    // WebClient 내부 체이닝 메서드들도 Mock으로 준비
    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock
    private WebClient.RequestBodySpec requestBodySpec;
    @Mock
    private WebClient.ResponseSpec responseSpec;

    // @InjectMocks: @Mock으로 만든 가짜 객체들을 이 클래스에 주입
    @InjectMocks
    private GeminiServiceImpl geminiService;

    // Gemini API가 반환하는 응답 JSON 구조를 Map으로 표현
    // 실제 API 응답과 동일한 구조여야 extractText()가 올바르게 파싱됨
    private Map<String, Object> mockGeminiResponse;

    @BeforeEach  // 각 테스트 메서드 실행 전에 호출됨
    void setUp() {
        // Gemini API 응답 Mock 데이터 준비
        // 실제 응답: { "candidates": [{ "content": { "parts": [{ "text": "답변" }] } }] }
        mockGeminiResponse = Map.of(
            "candidates", List.of(
                Map.of("content", Map.of(
                    "parts", List.of(Map.of("text", "Mock AI 응답입니다.")),
                    "role", "model"
                ))
            )
        );
    }

    // ── 테스트 1: 텍스트 챗봇 ────────────────────────────────────
    @Test
    @DisplayName("텍스트 챗봇 - 정상적인 질문에 응답을 반환해야 한다")
    void chat_shouldReturnReply_whenValidRequest() {
        // given: 테스트 입력 데이터 준비
        ChatRequestDTO request = new ChatRequestDTO();
        request.setMessage("안녕하세요");
        request.setHistory(List.of());

        // WebClient Mock 동작 설정: post() → uri() → bodyValue() → retrieve() → bodyToMono() 체인
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        // bodyToMono()가 호출되면 준비한 Mock 응답 반환
        when(responseSpec.bodyToMono(Map.class)).thenReturn(Mono.just(mockGeminiResponse));

        // when: 실제 테스트 대상 메서드 호출
        ChatResponseDTO result = geminiService.chat(request);

        // then: 결과 검증
        assertThat(result).isNotNull();
        assertThat(result.getReply()).isEqualTo("Mock AI 응답입니다.");
        assertThat(result.getModel()).isEqualTo("gemini-2.0-flash");
    }

    // ── 테스트 2: 이미지 분석 ────────────────────────────────────
    @Test
    @DisplayName("이미지 분석 - 이미지와 프롬프트를 받아 설명을 반환해야 한다")
    void analyzeImage_shouldReturnDescription() throws IOException {
        // given: MultipartFile Mock 준비
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.getBytes()).thenReturn("fake-image-bytes".getBytes());
        when(mockFile.getContentType()).thenReturn("image/jpeg");

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(Map.class)).thenReturn(Mono.just(mockGeminiResponse));

        // when
        var result = geminiService.analyzeImage(mockFile, "이미지를 설명해주세요");

        // then
        assertThat(result).isNotNull();
        assertThat(result.getDescription()).isEqualTo("Mock AI 응답입니다.");
    }

    // ── 테스트 3: 명함 OCR ───────────────────────────────────────
    @Test
    @DisplayName("명함 OCR - 명함 이미지에서 구조화된 정보를 추출해야 한다")
    void ocrBusinessCard_shouldReturnStructuredData() throws IOException {
        // given: OCR 결과로 반환될 JSON 형식의 Mock 응답
        Map<String, Object> ocrGeminiResponse = Map.of(
            "candidates", List.of(
                Map.of("content", Map.of(
                    "parts", List.of(Map.of("text",
                        // Gemini가 JSON으로 반환하는 명함 정보
                        "{\"name\":\"김부산\",\"company\":\"부산IT\",\"email\":\"kim@busanit.co.kr\"," +
                        "\"phone\":\"010-1234-5678\",\"position\":\"개발자\",\"address\":\"부산\"}"
                    )),
                    "role", "model"
                ))
            )
        );

        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.getBytes()).thenReturn("fake-card-bytes".getBytes());
        when(mockFile.getContentType()).thenReturn("image/jpeg");

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(Map.class)).thenReturn(Mono.just(ocrGeminiResponse));

        // when
        BusinessCardDTO result = geminiService.ocrBusinessCard(mockFile);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("김부산");
        assertThat(result.getCompany()).isEqualTo("부산IT");
        assertThat(result.getEmail()).isEqualTo("kim@busanit.co.kr");
    }

    // ── 테스트 4: 빈 메시지 예외 처리 ───────────────────────────
    @Test
    @DisplayName("빈 메시지 입력 시 IllegalArgumentException이 발생해야 한다")
    void chat_shouldThrowException_whenEmptyMessage() {
        // given
        ChatRequestDTO request = new ChatRequestDTO();
        request.setMessage("");  // 빈 메시지

        // when & then: 예외 발생 검증
        org.junit.jupiter.api.Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> geminiService.chat(request)
        );
    }
}
```

---

### 11-2. Flutter 단위 테스트

**파일 위치**: `Flutter-Front/test/services/ai_service_test.dart`

**사전 준비** - `pubspec.yaml`에 추가:
```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  mockito: ^5.4.4        # Mock 객체 생성 라이브러리
  build_runner: ^2.4.8   # mockito Mock 코드 자동 생성 도구
  http_mock_adapter: ^0.6.1  # http 패키지 Mock
```

```dart
// ★ Flutter 단위 테스트 파일
// ★ 실행: 터미널에서 flutter test test/services/ai_service_test.dart
// ★ http.Client를 Mock으로 교체하여 실제 서버 없이 테스트합니다.

import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';  // MockClient 제공
import 'package:path_provider_platform_interface/path_provider_platform_interface.dart';

// 테스트할 서비스 import (실제 파일 경로에 맞게 수정)
import 'package:your_app/services/ai_service.dart';
import 'package:your_app/models/ai/business_card.dart';

void main() {
  // ── 테스트 그룹 1: 텍스트 챗봇 ──────────────────────────────
  group('AiService.chat()', () {

    test('정상 질문 시 AI 응답 텍스트를 반환해야 한다', () async {
      // given: 서버가 반환할 Mock 응답 설정
      final mockClient = MockClient((request) async {
        // 요청 URL이 /chat 인지 확인
        expect(request.url.path, contains('/chat'));
        // 요청 Body에 message 포함 여부 확인
        final body = jsonDecode(request.body);
        expect(body['message'], equals('안녕하세요'));

        // Mock 서버 응답 반환
        return http.Response(
          jsonEncode({'reply': 'Mock 응답입니다.', 'model': 'gemini-2.0-flash'}),
          200,  // HTTP 상태 코드 200 OK
          headers: {'content-type': 'application/json'},
        );
      });

      // when: MockClient를 사용하여 API 호출
      // 실제 AiService는 외부에서 http.Client를 주입받아야 테스트 가능
      final result = await AiService.chatWithClient(
        '안녕하세요', [], mockClient
      );

      // then: 결과 검증
      expect(result, equals('Mock 응답입니다.'));
    });

    test('서버 오류(500) 시 예외를 던져야 한다', () async {
      final mockClient = MockClient((request) async {
        return http.Response('Internal Server Error', 500);
      });

      // expect(..., throwsException): 예외가 발생하는지 검증
      expect(
        () => AiService.chatWithClient('질문', [], mockClient),
        throwsException,
      );
    });
  });

  // ── 테스트 그룹 2: 이미지 분석 ──────────────────────────────
  group('AiService.analyzeImage()', () {

    test('이미지 파일 전송 후 설명 텍스트를 반환해야 한다', () async {
      final mockClient = MockClient((request) async {
        // multipart 요청인지 확인
        expect(request.headers['content-type'], contains('multipart/form-data'));

        return http.Response(
          jsonEncode({'description': '이것은 도서 표지 이미지입니다.', 'confidence': 'high'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      // 임시 테스트용 파일 생성
      final tempDir = Directory.systemTemp;
      final tempFile = File('${tempDir.path}/test_image.jpg');
      await tempFile.writeAsBytes([0xFF, 0xD8, 0xFF]);  // JPEG 헤더 바이트

      final result = await AiService.analyzeImageWithClient(
        tempFile, client: mockClient
      );

      expect(result, equals('이것은 도서 표지 이미지입니다.'));

      await tempFile.delete();  // 테스트 후 임시 파일 삭제
    });
  });

  // ── 테스트 그룹 3: 명함 OCR ──────────────────────────────────
  group('AiService.ocrBusinessCard()', () {

    test('명함 이미지에서 이름과 연락처를 추출해야 한다', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'name': '김부산',
            'company': '부산IT솔루션',
            'email': 'kim@busanit.co.kr',
            'phone': '010-1234-5678',
            'position': '개발자',
            'address': '부산광역시',
            'parseSuccess': true,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final tempFile = File('${Directory.systemTemp.path}/card.jpg');
      await tempFile.writeAsBytes([0xFF, 0xD8, 0xFF]);

      final result = await AiService.ocrBusinessCardWithClient(tempFile, mockClient);

      // BusinessCard 객체의 필드 검증
      expect(result.name, equals('김부산'));
      expect(result.company, equals('부산IT솔루션'));
      expect(result.email, equals('kim@busanit.co.kr'));
      expect(result.parseSuccess, isTrue);

      await tempFile.delete();
    });

    test('OCR 파싱 실패 시 parseSuccess가 false여야 한다', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'name': '', 'company': '', 'email': '', 'phone': '',
            'position': '', 'address': '', 'parseSuccess': false,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final tempFile = File('${Directory.systemTemp.path}/blurry.jpg');
      await tempFile.writeAsBytes([0x00]);  // 빈 파일 (판독 불가 이미지 시뮬레이션)

      final result = await AiService.ocrBusinessCardWithClient(tempFile, mockClient);
      expect(result.parseSuccess, isFalse);

      await tempFile.delete();
    });
  });

  // ── 테스트 그룹 4: 멀티모달 ─────────────────────────────────
  group('AiService.multimodal()', () {

    test('이미지와 질문을 함께 보내 답변을 받아야 한다', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'question': '이 도서의 주제는?',
            'answer': '이 도서는 스프링 부트에 관한 내용입니다.',
            'imageAnalyzed': true,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final tempFile = File('${Directory.systemTemp.path}/book.jpg');
      await tempFile.writeAsBytes([0xFF, 0xD8, 0xFF]);

      final result = await AiService.multimodalWithClient(
        tempFile, '이 도서의 주제는?', mockClient
      );

      expect(result, contains('스프링 부트'));
      await tempFile.delete();
    });
  });
}
```

---

### 11-3. Next.js 단위 테스트

**파일 위치**: `NextJS-Front/src/app/ai/chat/__tests__/page.test.tsx`

**사전 준비**:
```bash
# NextJS-Front 디렉토리에서 실행
npm install --save-dev jest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom jest-environment-jsdom ts-jest
```

**jest.config.ts** (NextJS-Front 루트에 생성):
```typescript
// ★ Jest 설정 파일 — Next.js + TypeScript 환경에서 테스트 실행 설정
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

// next/jest: Next.js 환경에 맞는 Jest 설정을 자동으로 구성해 주는 헬퍼
const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',        // 코드 커버리지 측정 방식
  testEnvironment: 'jsdom',      // 브라우저 환경 시뮬레이션 (DOM API 사용 가능)
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
};

export default createJestConfig(config);
```

**jest.setup.ts**:
```typescript
// @testing-library/jest-dom: toBeInTheDocument() 같은 DOM 검증 matcher 추가
import '@testing-library/jest-dom';
```

**ChatPage 테스트** (`src/app/ai/chat/__tests__/page.test.tsx`):

```tsx
// ★ ChatPage 컴포넌트 단위 테스트
// ★ 실행: NextJS-Front 디렉토리에서 npm test

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPage from '../page';

// fetch를 Mock으로 교체 (실제 서버 호출 방지)
global.fetch = jest.fn();

describe('ChatPage', () => {

  beforeEach(() => {
    // 각 테스트 전에 Mock 초기화
    jest.clearAllMocks();
  });

  // ── 테스트 1: 페이지 초기 렌더링 ──────────────────────────
  test('초기 렌더링 시 입력창과 전송 버튼이 보여야 한다', () => {
    render(<ChatPage />);

    // 입력창이 화면에 있는지 확인
    expect(screen.getByPlaceholderText('질문을 입력하세요...')).toBeInTheDocument();
    // 전송 버튼이 화면에 있는지 확인
    expect(screen.getByRole('button', { name: '전송' })).toBeInTheDocument();
    // 초기에는 메시지가 없음
    expect(screen.queryByText('Mock 응답입니다.')).not.toBeInTheDocument();
  });

  // ── 테스트 2: 메시지 전송 및 응답 표시 ──────────────────
  test('메시지 전송 후 사용자 메시지와 AI 응답이 화면에 표시되어야 한다', async () => {
    // fetch Mock: 서버 응답을 흉내냄
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ reply: 'AI Mock 응답입니다.', model: 'gemini-2.0-flash' }),
      ok: true,
    });

    render(<ChatPage />);
    const input = screen.getByPlaceholderText('질문을 입력하세요...');
    const sendBtn = screen.getByRole('button', { name: '전송' });

    // 입력창에 텍스트 입력
    await userEvent.type(input, '안녕하세요');
    // 전송 버튼 클릭
    await userEvent.click(sendBtn);

    // 사용자 메시지가 화면에 표시되는지 확인
    expect(screen.getByText('안녕하세요')).toBeInTheDocument();

    // AI 응답이 올 때까지 대기 (비동기 처리)
    await waitFor(() => {
      expect(screen.getByText('AI Mock 응답입니다.')).toBeInTheDocument();
    });

    // 전송 후 입력창이 비워졌는지 확인
    expect(input).toHaveValue('');
  });

  // ── 테스트 3: Enter 키로 전송 ────────────────────────────
  test('Enter 키를 누르면 메시지가 전송되어야 한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ reply: 'Enter 응답' }),
      ok: true,
    });

    render(<ChatPage />);
    const input = screen.getByPlaceholderText('질문을 입력하세요...');

    await userEvent.type(input, '테스트 질문{enter}');  // {enter}: Enter 키 입력

    await waitFor(() => {
      expect(screen.getByText('테스트 질문')).toBeInTheDocument();
    });
  });

  // ── 테스트 4: 로딩 상태 표시 ─────────────────────────────
  test('전송 중에는 "AI가 답변 중..." 메시지가 표시되어야 한다', async () => {
    // 응답이 늦게 오는 상황 시뮬레이션
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() =>
        resolve({ json: async () => ({ reply: '늦은 응답' }) }), 100
      ))
    );

    render(<ChatPage />);
    await userEvent.type(screen.getByPlaceholderText('질문을 입력하세요...'), '질문');
    await userEvent.click(screen.getByRole('button', { name: '전송' }));

    // 로딩 중 메시지 확인
    expect(screen.getByText('AI가 답변 중...')).toBeInTheDocument();

    // 응답 완료 후 로딩 메시지 사라짐
    await waitFor(() => {
      expect(screen.queryByText('AI가 답변 중...')).not.toBeInTheDocument();
    });
  });

  // ── 테스트 5: 서버 오류 처리 ─────────────────────────────
  test('서버 오류 발생 시 에러 메시지가 표시되어야 한다', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    render(<ChatPage />);
    await userEvent.type(screen.getByPlaceholderText('질문을 입력하세요...'), '질문');
    await userEvent.click(screen.getByRole('button', { name: '전송' }));

    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();
    });
  });
});
```

**BusinessCardPage 테스트** (`src/app/ai/business-card/__tests__/page.test.tsx`):

```tsx
// ★ 명함 OCR 페이지 단위 테스트
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BusinessCardPage from '../page';

global.fetch = jest.fn();

describe('BusinessCardPage', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  // ── 테스트 1: 초기 렌더링 ────────────────────────────────
  test('초기 렌더링 시 파일 업로드 입력창이 보여야 한다', () => {
    render(<BusinessCardPage />);
    // 파일 입력창 존재 확인
    expect(screen.getByRole('textbox', { hidden: true }) ||
           document.querySelector('input[type="file"]')).toBeTruthy();
    // 버튼들이 비활성화 상태인지 확인 (파일 미선택)
    expect(screen.getByText('명함 인식 (OCR)')).toBeDisabled();
  });

  // ── 테스트 2: 파일 선택 후 버튼 활성화 ──────────────────
  test('이미지 파일 선택 후 OCR 버튼이 활성화되어야 한다', async () => {
    render(<BusinessCardPage />);

    // 테스트용 가짜 파일 생성
    const fakeFile = new File(['fake-image-content'], 'card.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // 파일 선택 이벤트 발생
    await userEvent.upload(fileInput, fakeFile);

    // 파일 선택 후 버튼 활성화 확인
    expect(screen.getByText('명함 인식 (OCR)')).not.toBeDisabled();
  });

  // ── 테스트 3: OCR 결과 표시 ──────────────────────────────
  test('OCR 실행 후 이름과 회사명이 화면에 표시되어야 한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        name: '김부산', company: '부산IT', email: 'kim@test.com',
        phone: '010-0000-0000', position: '개발자', address: '부산',
      }),
      ok: true,
    });

    render(<BusinessCardPage />);

    const fakeFile = new File(['img'], 'card.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(fileInput, fakeFile);
    await userEvent.click(screen.getByText('명함 인식 (OCR)'));

    // OCR 결과가 화면에 표시되는지 확인
    await waitFor(() => {
      expect(screen.getByText('김부산')).toBeInTheDocument();
      expect(screen.getByText('부산IT')).toBeInTheDocument();
    });
  });

  // ── 테스트 4: 회원 검색 결과 표시 ───────────────────────
  test('회원 검색 후 매칭 결과가 화면에 표시되어야 한다', async () => {
    // OCR 응답 Mock
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ name: '김부산', company: '부산IT', email: 'kim@test.com',
                             phone: '010-0000-0000', position: '', address: '' }),
        ok: true,
      })
      // 회원 검색 응답 Mock
      .mockResolvedValueOnce({
        json: async () => ({
          ocrResult: { name: '김부산', email: 'kim@test.com' },
          matchedMember: { id: 1, mid: 'user01', mname: '김부산', email: 'kim@test.com' },
          found: true,
        }),
        ok: true,
      });

    render(<BusinessCardPage />);

    const fakeFile = new File(['img'], 'card.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(fileInput, fakeFile);

    // OCR 먼저 실행
    await userEvent.click(screen.getByText('명함 인식 (OCR)'));
    await waitFor(() => expect(screen.getByText('김부산')).toBeInTheDocument());

    // 회원 검색 실행
    await userEvent.click(screen.getByText('회원 검색'));
    await waitFor(() => {
      expect(screen.getByText(/매칭 회원/)).toBeInTheDocument();
      expect(screen.getByText(/김부산/)).toBeInTheDocument();
    });
  });
});
```

**테스트 실행 명령어 요약**:

| 플랫폼 | 명령어 | 위치 |
|--------|--------|------|
| Spring Boot | `./gradlew test` 또는 IntelliJ ▶ | `Spring-Back/SpringBasic/api5012/` |
| Flutter | `flutter test` | `Flutter-Front/` |
| Next.js | `npm test` | `NextJS-Front/` |
| Next.js (커버리지) | `npm test -- --coverage` | `NextJS-Front/` |

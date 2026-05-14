# Gemini AI 멀티모달 이미지 Postman 테스트 가이드

> 대상: `Spring-Back/SpringBasic/api5012`
> 목적: Postman에서 Spring Boot AI REST API에 이미지 파일을 전달하고 Gemini 멀티모달 응답을 확인한다.

---

## 1. 현재 전송 구조

현재 `Spring-Back`의 Gemini 이미지 관련 API는 다음 구조로 동작한다.

```text
Postman / Next.js / Flutter
  -> Spring Boot /api/ai/*
      -> MultipartFile image 수신
      -> 서버에서 image.getBytes()를 Base64 인코딩
      -> Gemini REST API inline_data.data로 전달
```

중요:

- Postman에서 Spring 백엔드를 테스트할 때는 이미지를 직접 Base64 문자열로 넣지 않는다.
- Postman에서는 `multipart/form-data`의 `File` 타입으로 이미지를 첨부한다.
- Base64 변환은 `GeminiServiceImpl` 내부에서 수행한다.
- 현재 Next.js와 Flutter도 이미지를 직접 Base64로 변환하지 않고, multipart 파일로 Spring에 전달한다.

관련 코드:

```java
String encodedImage = Base64.getEncoder().encodeToString(image.getBytes());

"inline_data", Map.of(
    "mime_type", mimeType,
    "data", encodedImage
)
```

---

## 1-1. React/Next.js가 현재 이미지를 보내는 방식

현재 Next.js 화면은 이미지를 Base64 문자열로 바꾸지 않는다.

이미지 분석 화면:

```ts
const formData = new FormData();
formData.append("image", file);
formData.append("prompt", prompt.trim() || "이 이미지를 한국어로 설명해주세요.");

await api.post("/ai/analyze-image", formData);
```

멀티모달 Q&A 화면:

```ts
const formData = new FormData();
formData.append("image", file);
formData.append("question", nextQuestion);

await api.post("/ai/multimodal", formData);
```

즉 현재 실제 흐름은 다음과 같다.

```text
React/Next.js
  -> FormData에 File 객체 추가
  -> multipart/form-data 요청 전송

Spring
  -> @RequestPart MultipartFile image 수신
  -> image.getBytes()
  -> Base64.getEncoder().encodeToString(...)
  -> Gemini API JSON에 inline_data.data로 포함
```

브라우저의 `File` 객체는 바이너리 파일이고, `FormData`에 담기면 HTTP multipart 요청으로 전송된다. 이 단계에서는 Base64 문자열이 아니다.

---

## 1-2. Postman에서 가능한 테스트 방식

Postman에서는 크게 두 가지 방식이 있다.

| 방식 | 현재 Spring API에서 가능 여부 | 설명 |
|---|---:|---|
| form-data File 업로드 | 가능 | 현재 `/api/ai/analyze-image`, `/api/ai/multimodal`, `/api/ai/ocr/*`가 사용하는 방식 |
| raw JSON + Base64 문자열 | 현재는 불가 | 별도의 Base64 JSON 요청 DTO와 컨트롤러 메서드가 필요 |

현재 코드의 컨트롤러는 다음처럼 `MultipartFile`을 받는다.

```java
@RequestPart MultipartFile image
```

따라서 Postman에서 이미지를 문자열로 변환해 JSON Body에 넣어 보내면, 현재 엔드포인트는 그 값을 받을 수 없다.

---

## 2. 테스트 전 준비

### 2-1. Gemini API Key 설정

파일:

```text
Spring-Back/SpringBasic/api5012/src/main/resources/application-secret.properties
```

예시:

```properties
gemini.api.key=발급받은_실제_GEMINI_API_KEY
```

기본 설정은 `application.properties`에서 확인한다.

```properties
gemini.api.base-url=https://generativelanguage.googleapis.com/v1beta/models
gemini.api.model=gemini-2.5-flash
```

### 2-2. Spring Boot 실행

작업 위치:

```powershell
cd E:\0-sample-flutter-projectt-k9\Spring-Back\SpringBasic\api5012
```

기본 실행:

```powershell
.\gradlew.bat bootRun
```

기본 포트:

```text
http://localhost:8080
```

포트 충돌 시 예시:

```powershell
.\gradlew.bat bootRun --args="--server.port=18081"
```

---

## 3. JWT 토큰 발급

현재 보안 설정상 `/api/ai/*` 요청은 인증이 필요하다.

### Postman 요청

```text
POST http://localhost:8080/generateToken
```

Headers:

| Key | Value |
|---|---|
| Content-Type | application/json |

Body:

```json
{
  "mid": "사용자아이디",
  "mpw": "비밀번호"
}
```

성공 응답 예시:

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

이후 AI API 요청에는 다음 헤더를 추가한다.

| Key | Value |
|---|---|
| Authorization | Bearer `accessToken값` |

---

## 4. 이미지 분석 API 테스트

### 요청 정보

```text
POST http://localhost:8080/api/ai/analyze-image
```

Headers:

| Key | Value |
|---|---|
| Authorization | Bearer `accessToken값` |

주의:

- `Content-Type`은 직접 입력하지 않는다.
- Postman이 `multipart/form-data; boundary=...`를 자동으로 넣게 둔다.

Body:

Postman의 `Body` 탭에서 `form-data` 선택.

| Key | Type | Value |
|---|---|---|
| image | File | 분석할 이미지 파일 |
| prompt | Text | 이 이미지를 한국어로 자세히 설명해주세요. |

`prompt`는 선택값이다. 생략하면 서버 기본 문구가 사용된다.

성공 응답 예시:

```json
{
  "description": "이미지에는 ...",
  "filename": "sample.png",
  "mimeType": "image/png",
  "model": "gemini-2.5-flash",
  "implemented": true
}
```

---

## 5. 명함 OCR API 테스트

### 요청 정보

```text
POST http://localhost:8080/api/ai/ocr/business-card
```

Headers:

| Key | Value |
|---|---|
| Authorization | Bearer `accessToken값` |

Body:

`form-data` 선택.

| Key | Type | Value |
|---|---|---|
| image | File | 명함 이미지 파일 |

성공 응답 예시:

```json
{
  "name": "홍길동",
  "company": "부산IT",
  "department": "개발팀",
  "position": "매니저",
  "phone": "010-0000-0000",
  "email": "test@example.com",
  "address": "부산광역시 ...",
  "model": "gemini-2.5-flash",
  "implemented": true,
  "parseSuccess": true
}
```

---

## 6. 멀티모달 Q&A API 테스트

### 요청 정보

```text
POST http://localhost:8080/api/ai/multimodal
```

Headers:

| Key | Value |
|---|---|
| Authorization | Bearer `accessToken값` |

Body:

`form-data` 선택.

| Key | Type | Value |
|---|---|---|
| image | File | 질문 대상 이미지 파일 |
| question | Text | 이 이미지에서 가장 중요한 정보는 무엇인가요? |

성공 응답 예시:

```json
{
  "question": "이 이미지에서 가장 중요한 정보는 무엇인가요?",
  "answer": "이 이미지에서 가장 중요한 정보는 ...",
  "model": "gemini-2.5-flash",
  "implemented": true
}
```

---

## 7. 명함 OCR + 회원 검색 API 테스트

### 요청 정보

```text
POST http://localhost:8080/api/ai/ocr/search
```

Headers:

| Key | Value |
|---|---|
| Authorization | Bearer `accessToken값` |

Body:

`form-data` 선택.

| Key | Type | Value |
|---|---|---|
| image | File | 검색할 명함 이미지 파일 |

성공 응답 예시:

```json
{
  "matched": true,
  "matchType": "EMAIL_MATCH",
  "extractedCard": {
    "name": "홍길동",
    "email": "test@example.com"
  },
  "mid": "user1",
  "memberName": "홍길동",
  "email": "test@example.com",
  "implemented": true
}
```

---

## 8. Postman에서 자주 틀리는 부분

### 8-1. `raw JSON`에 Base64를 넣는 경우

현재 Spring 컨트롤러는 다음처럼 파일을 받는다.

```java
@RequestPart MultipartFile image
```

따라서 아래 방식은 현재 API와 맞지 않는다.

```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "question": "이미지를 설명해주세요."
}
```

이 방식으로 테스트하려면 별도의 JSON DTO와 Base64 디코딩용 엔드포인트가 추가로 필요하다.

예를 들어 이런 요청을 받고 싶다면:

```json
{
  "mimeType": "image/png",
  "base64Image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "question": "이 이미지를 설명해주세요."
}
```

Spring에는 대략 다음 형태의 DTO와 엔드포인트가 추가되어야 한다.

```java
public class MultimodalBase64RequestDTO {
    private String mimeType;
    private String base64Image;
    private String question;
}
```

```java
@PostMapping("/multimodal/base64")
public ResponseEntity<MultimodalResponseDTO> multimodalBase64(
        @RequestBody MultimodalBase64RequestDTO request) {
    return ResponseEntity.ok(geminiService.multimodalBase64(request));
}
```

서비스에서는 `base64Image`를 다시 파일로 만들 필요 없이 Gemini 요청의 `inline_data.data`에 그대로 넣을 수 있다. 다만 `data:image/png;base64,` 같은 Data URL 접두사가 붙어 있으면 제거해야 한다.

### 8-2. `image` 키 이름이 다른 경우

반드시 `image`로 보낸다.

틀린 예:

```text
file
upload
imageFile
```

맞는 예:

```text
image
```

### 8-3. `question` / `prompt`를 File 타입으로 넣는 경우

`question`과 `prompt`는 `Text` 타입이어야 한다.

### 8-4. Content-Type을 수동으로 넣는 경우

Postman에서 `Content-Type: multipart/form-data`를 직접 입력하면 boundary가 빠져서 실패할 수 있다.

권장:

- Headers에는 `Authorization`만 직접 추가한다.
- Body에서 `form-data`를 선택한다.
- Postman이 Content-Type을 자동 생성하게 둔다.

---

## 8-5. 그래도 Postman에서 Base64 JSON을 만들어 보고 싶을 때

현재 엔드포인트에는 바로 보낼 수 없지만, 이미지 파일을 Base64 문자열로 바꾸는 방법은 다음과 같다.

PowerShell 예시:

```powershell
$path = "E:\0-sample-flutter-projectt-k9\sampleImages\sample.png"
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($path))
$base64 | Set-Clipboard
```

클립보드에 복사된 값을 Postman raw JSON에 붙이면 된다.

```json
{
  "mimeType": "image/png",
  "base64Image": "여기에_복사한_base64_문자열",
  "question": "이 이미지에서 중요한 내용을 알려줘."
}
```

주의:

- 이 JSON은 현재 `/api/ai/multimodal`에는 사용할 수 없다.
- 현재 `/api/ai/multimodal`은 `form-data`의 `image` 파일과 `question` 텍스트를 기대한다.
- Base64 문자열은 원본 파일보다 약 33% 커진다.
- Postman Pre-request Script만으로 로컬 파일을 안정적으로 읽어 Base64로 변환하는 방식은 권장하지 않는다. 로컬 파일은 Postman Body의 `File` 타입으로 선택하는 편이 가장 단순하다.

---

## 9. 오류별 확인 포인트

| 증상 | 가능 원인 | 확인 방법 |
|---|---|---|
| 401 Unauthorized | JWT 없음 또는 만료 | `/generateToken`으로 토큰 재발급 |
| 403 Forbidden | Authorization 형식 오류 | `Bearer 토큰값` 형식 확인 |
| 400 Bad Request | `image` 파트 누락 | form-data 키가 `image`인지 확인 |
| 415 Unsupported Media Type | multipart 요청 형식 오류 | raw JSON이 아니라 form-data 사용 |
| `지원하지 않는 이미지 형식입니다` | MIME type이 image가 아님 | PNG, JPG, JPEG, WEBP 사용 |
| `gemini.api.key 설정이 필요합니다` | API Key 미설정 | `application-secret.properties` 확인 |
| 502 Bad Gateway | Gemini API 호출 실패 | 모델명, API Key, Gemini 사용량 제한 확인 |

---

## 10. 빠른 체크리스트

- [ ] Spring Boot 서버가 실행 중이다.
- [ ] `application-secret.properties`에 `gemini.api.key`가 있다.
- [ ] Postman에서 `/generateToken`으로 `accessToken`을 발급했다.
- [ ] AI API Headers에 `Authorization: Bearer accessToken값`을 넣었다.
- [ ] Body는 `form-data`를 선택했다.
- [ ] 이미지 필드명은 `image`, 타입은 `File`이다.
- [ ] `question` 또는 `prompt`는 `Text` 타입이다.
- [ ] `Content-Type`을 수동으로 고정하지 않았다.

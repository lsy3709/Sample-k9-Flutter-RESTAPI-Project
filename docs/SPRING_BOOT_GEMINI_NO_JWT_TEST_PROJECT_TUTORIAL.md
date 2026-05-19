# Spring Boot Gemini 무인증 테스트 프로젝트 튜토리얼

> 목표: 기존 `SpringBasic/api5012`의 JWT, DB, Security 설정을 모두 제외하고, 완전히 새 Spring Boot 프로젝트에서 Gemini API만 빠르게 테스트한다.  
> 대상: 초보자 실습용, Postman/Swagger로 바로 호출하는 버전

---

## 1. 이 문서가 필요한 이유

기존 프로젝트 `Spring-Back/SpringBasic/api5012`는 실제 서비스 구조에 가깝다.

- JWT 인증 필요
- DB 연결 필요
- 회원 테이블 필요
- Security Filter 동작
- 기존 도서관 기능과 함께 실행

처음 Gemini만 연습할 때는 위 요소들이 방해가 될 수 있다.  
그래서 새 프로젝트에서는 아래만 남긴다.

```text
Postman / Swagger
  -> GeminiController
      -> GeminiService
          -> Gemini REST API
```

이번 버전에는 JWT 인증이 없다.

---

## 2. 새 프로젝트 생성 위치 예시

루트 작업 폴더:

```text
E:\0-sample-flutter-projectt-k9
```

새 프로젝트 위치 예시:

```text
E:\0-sample-flutter-projectt-k9\Spring-Back\GeminiNoJwtTest
```

폴더명은 자유롭게 바꿔도 된다.

---

## 3. Spring Initializr 설정

Spring Initializr에서 새 프로젝트를 만든다.

주소:

```text
https://start.spring.io
```

설정:

| 항목 | 값 |
|---|---|
| Project | Gradle - Groovy |
| Language | Java |
| Spring Boot | 3.x |
| Group | `com.example` |
| Artifact | `gemini-no-jwt-test` |
| Name | `gemini-no-jwt-test` |
| Package name | `com.example.gemininojwttest` |
| Packaging | Jar |
| Java | 17 |

Dependencies:

| 의존성 | 이유 |
|---|---|
| Spring Web | REST Controller 작성 |
| Spring WebFlux | `WebClient`로 Gemini API 호출 |
| Validation | 요청값 검증 |
| Lombok | DTO 코드 간소화 |
| Springdoc OpenAPI | Swagger UI 사용 |

Spring Initializr에 Springdoc이 없다면 나중에 `build.gradle`에 직접 추가한다.

---

## 4. 최종 폴더 구조

완성 후 구조는 대략 아래처럼 만든다.

```text
GeminiNoJwtTest
  build.gradle
  src/main/resources/application.properties
  src/main/resources/application-secret.properties
  src/main/java/com/example/gemininojwttest
    GeminiNoJwtTestApplication.java
    controller/GeminiController.java
    dto/ChatRequestDTO.java
    dto/ChatResponseDTO.java
    dto/ImageAnalysisResponseDTO.java
    dto/AiErrorResponseDTO.java
    service/GeminiService.java
    service/GeminiServiceImpl.java
    exception/GeminiApiException.java
    handler/GeminiExceptionHandler.java
```

---

## 5. build.gradle

파일: `build.gradle`

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.4.1'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.3'

    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

중요:

- `spring-boot-starter-security`를 넣지 않는다.
- JWT 관련 라이브러리도 넣지 않는다.
- DB 관련 JPA/MariaDB도 넣지 않는다.

---

## 6. application.properties

파일: `src/main/resources/application.properties`

```properties
spring.application.name=gemini-no-jwt-test

server.port=18082

spring.config.import=optional:classpath:application-secret.properties,\
  optional:file:./src/main/resources/application-secret.properties,\
  optional:file:application-secret.properties

gemini.api.base-url=https://generativelanguage.googleapis.com/v1beta/models
gemini.api.model=gemini-2.5-flash

spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=20MB

logging.level.com.example.gemininojwttest=debug
```

기존 프로젝트와 동시에 실행할 수 있도록 포트를 `18082`로 잡았다.

---

## 7. application-secret.properties

파일: `src/main/resources/application-secret.properties`

```properties
gemini.api.key=발급받은_실제_GEMINI_API_KEY
```

주의:

- 이 파일은 Git에 올리지 않는다.
- 실습용이라도 API Key는 공개하면 안 된다.

---

## 8. 메인 클래스

파일:

```text
src/main/java/com/example/gemininojwttest/GeminiNoJwtTestApplication.java
```

```java
package com.example.gemininojwttest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GeminiNoJwtTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(GeminiNoJwtTestApplication.class, args);
    }
}
```

---

## 9. DTO 작성

### 9-1. ChatRequestDTO

파일:

```text
src/main/java/com/example/gemininojwttest/dto/ChatRequestDTO.java
```

```java
package com.example.gemininojwttest.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequestDTO {

    @NotBlank(message = "prompt 는 비어 있을 수 없습니다.")
    private String prompt;
}
```

### 9-2. ChatResponseDTO

파일:

```text
src/main/java/com/example/gemininojwttest/dto/ChatResponseDTO.java
```

```java
package com.example.gemininojwttest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponseDTO {

    private String reply;
    private String model;
    private boolean implemented;
}
```

### 9-3. ImageAnalysisResponseDTO

파일:

```text
src/main/java/com/example/gemininojwttest/dto/ImageAnalysisResponseDTO.java
```

```java
package com.example.gemininojwttest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageAnalysisResponseDTO {

    private String description;
    private String filename;
    private String mimeType;
    private String model;
    private boolean implemented;
}
```

### 9-4. AiErrorResponseDTO

파일:

```text
src/main/java/com/example/gemininojwttest/dto/AiErrorResponseDTO.java
```

```java
package com.example.gemininojwttest.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiErrorResponseDTO {

    private final String timestamp;
    private final int status;
    private final String error;
    private final String code;
    private final String message;
    private final String path;
}
```

---

## 10. 예외 클래스

파일:

```text
src/main/java/com/example/gemininojwttest/exception/GeminiApiException.java
```

```java
package com.example.gemininojwttest.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class GeminiApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public GeminiApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
```

---

## 11. 서비스 인터페이스

파일:

```text
src/main/java/com/example/gemininojwttest/service/GeminiService.java
```

```java
package com.example.gemininojwttest.service;

import com.example.gemininojwttest.dto.ChatRequestDTO;
import com.example.gemininojwttest.dto.ChatResponseDTO;
import com.example.gemininojwttest.dto.ImageAnalysisResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface GeminiService {

    ChatResponseDTO chat(ChatRequestDTO requestDTO);

    ImageAnalysisResponseDTO analyzeImage(MultipartFile image, String prompt);
}
```

무인증 테스트 프로젝트에서는 처음부터 기능을 많이 넣지 말고, 텍스트와 이미지 분석 2개만 먼저 만든다.

---

## 12. 서비스 구현체

파일:

```text
src/main/java/com/example/gemininojwttest/service/GeminiServiceImpl.java
```

```java
package com.example.gemininojwttest.service;

import com.example.gemininojwttest.dto.ChatRequestDTO;
import com.example.gemininojwttest.dto.ChatResponseDTO;
import com.example.gemininojwttest.dto.ImageAnalysisResponseDTO;
import com.example.gemininojwttest.exception.GeminiApiException;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Log4j2
public class GeminiServiceImpl implements GeminiService {

    private final WebClient webClient;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.model}")
    private String model;

    public GeminiServiceImpl(
            WebClient.Builder webClientBuilder,
            @Value("${gemini.api.base-url}") String baseUrl) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
    }

    @Override
    public ChatResponseDTO chat(ChatRequestDTO requestDTO) {
        validateApiKey();

        String prompt = requestDTO.getPrompt().trim();
        log.info("Gemini chat request. model={}, promptLength={}", model, prompt.length());

        try {
            Map<String, Object> response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(model))
                    .bodyValue(buildChatRequestBody(prompt))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            return ChatResponseDTO.builder()
                    .reply(extractText(response))
                    .model(model)
                    .implemented(true)
                    .build();
        } catch (WebClientResponseException e) {
            throw toGeminiApiException(e);
        } catch (Exception e) {
            throw new IllegalStateException("Gemini 응답 처리 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public ImageAnalysisResponseDTO analyzeImage(MultipartFile image, String prompt) {
        validateApiKey();
        validateImage(image);

        String normalizedPrompt = prompt == null || prompt.isBlank()
                ? "이 이미지를 한국어로 설명해주세요."
                : prompt.trim();

        try {
            Map<String, Object> response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(model))
                    .bodyValue(buildImageRequestBody(image, normalizedPrompt))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            return ImageAnalysisResponseDTO.builder()
                    .description(extractText(response))
                    .filename(image.getOriginalFilename())
                    .mimeType(resolveImageMimeType(image))
                    .model(model)
                    .implemented(true)
                    .build();
        } catch (WebClientResponseException e) {
            throw toGeminiApiException(e);
        } catch (IOException e) {
            throw new IllegalStateException("업로드한 이미지를 읽는 중 오류가 발생했습니다.", e);
        } catch (Exception e) {
            throw new IllegalStateException("Gemini 이미지 분석 처리 중 오류가 발생했습니다.", e);
        }
    }

    private Map<String, Object> buildChatRequestBody(String prompt) {
        return Map.of(
                "contents", List.of(
                        Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", prompt))
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 1024
                )
        );
    }

    private Map<String, Object> buildImageRequestBody(MultipartFile image, String prompt) throws IOException {
        String mimeType = resolveImageMimeType(image);
        if (!mimeType.startsWith("image/")) {
            throw new IllegalArgumentException("지원하지 않는 이미지 형식입니다. PNG, JPG, WEBP 등을 사용해주세요.");
        }

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
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "maxOutputTokens", 1024
                )
        );
    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        if (response == null) {
            throw new IllegalStateException("Gemini 응답이 비어 있습니다.");
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini candidates 응답이 없습니다.");
        }

        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        Object text = parts.get(0).get("text");

        if (!(text instanceof String reply) || reply.isBlank()) {
            throw new IllegalStateException("Gemini text 응답이 비어 있습니다.");
        }

        return reply;
    }

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("gemini.api.key 설정이 필요합니다.");
        }
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("image 파일은 비어 있을 수 없습니다.");
        }
    }

    private String resolveImageMimeType(MultipartFile image) {
        String contentType = image.getContentType();
        if (contentType != null && !contentType.isBlank() && !"application/octet-stream".equals(contentType)) {
            return contentType;
        }

        return MediaTypeFactory.getMediaType(image.getOriginalFilename())
                .map(MediaType::toString)
                .orElse("application/octet-stream");
    }

    private GeminiApiException toGeminiApiException(WebClientResponseException e) {
        if (e.getStatusCode().value() == 429) {
            return new GeminiApiException(HttpStatus.BAD_GATEWAY, "RATE_LIMITED", "AI 요청이 잠시 많습니다. 잠시 후 다시 시도해주세요.");
        }

        if (e.getStatusCode().is5xxServerError()) {
            return new GeminiApiException(HttpStatus.BAD_GATEWAY, "UPSTREAM_TEMPORARY_ERROR", "Gemini 서비스가 일시적으로 불안정합니다.");
        }

        return new GeminiApiException(HttpStatus.BAD_GATEWAY, "GEMINI_HTTP_ERROR", "Gemini API 호출에 실패했습니다.");
    }
}
```

---

## 13. 컨트롤러

파일:

```text
src/main/java/com/example/gemininojwttest/controller/GeminiController.java
```

```java
package com.example.gemininojwttest.controller;

import com.example.gemininojwttest.dto.ChatRequestDTO;
import com.example.gemininojwttest.dto.ChatResponseDTO;
import com.example.gemininojwttest.dto.ImageAnalysisResponseDTO;
import com.example.gemininojwttest.service.GeminiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "Gemini AI No JWT API", description = "JWT 없이 테스트하는 Gemini AI API")
public class GeminiController {

    private final GeminiService geminiService;

    @PostMapping("/chat")
    @Operation(summary = "Gemini 텍스트 챗봇")
    public ResponseEntity<ChatResponseDTO> chat(@Valid @RequestBody ChatRequestDTO requestDTO) {
        return ResponseEntity.ok(geminiService.chat(requestDTO));
    }

    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Gemini 이미지 분석")
    public ResponseEntity<ImageAnalysisResponseDTO> analyzeImage(
            @RequestPart MultipartFile image,
            @RequestParam(defaultValue = "이 이미지를 한국어로 설명해주세요.") String prompt) {
        return ResponseEntity.ok(geminiService.analyzeImage(image, prompt));
    }
}
```

핵심:

- `Authorization` 헤더를 요구하지 않는다.
- Security 설정 파일도 없다.
- 테스트 주소는 기존 프로젝트와 거의 같다.

---

## 14. 예외 핸들러

파일:

```text
src/main/java/com/example/gemininojwttest/handler/GeminiExceptionHandler.java
```

```java
package com.example.gemininojwttest.handler;

import com.example.gemininojwttest.dto.AiErrorResponseDTO;
import com.example.gemininojwttest.exception.GeminiApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;

@RestControllerAdvice
public class GeminiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AiErrorResponseDTO> handleValidation(
            MethodArgumentNotValidException e,
            HttpServletRequest request) {
        String message = e.getBindingResult().getFieldErrors().isEmpty()
                ? "요청값이 올바르지 않습니다."
                : e.getBindingResult().getFieldErrors().get(0).getDefaultMessage();

        return buildErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AiErrorResponseDTO> handleBadRequest(
            IllegalArgumentException e,
            HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", e.getMessage(), request);
    }

    @ExceptionHandler(GeminiApiException.class)
    public ResponseEntity<AiErrorResponseDTO> handleGeminiApiException(
            GeminiApiException e,
            HttpServletRequest request) {
        return buildErrorResponse(e.getStatus(), e.getCode(), e.getMessage(), request);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<AiErrorResponseDTO> handleIllegalState(
            IllegalStateException e,
            HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "AI_INTERNAL_ERROR", e.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AiErrorResponseDTO> handleUnexpected(
            Exception e,
            HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "UNEXPECTED_ERROR", "알 수 없는 오류가 발생했습니다.", request);
    }

    private ResponseEntity<AiErrorResponseDTO> buildErrorResponse(
            HttpStatus status,
            String code,
            String message,
            HttpServletRequest request) {
        AiErrorResponseDTO body = AiErrorResponseDTO.builder()
                .timestamp(OffsetDateTime.now().toString())
                .status(status.value())
                .error(status.getReasonPhrase())
                .code(code)
                .message(message)
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(status).body(body);
    }
}
```

---

## 15. 실행

프로젝트 폴더로 이동:

```powershell
cd E:\0-sample-flutter-projectt-k9\Spring-Back\GeminiNoJwtTest
```

실행:

```powershell
.\gradlew.bat bootRun
```

정상 실행 주소:

```text
http://localhost:18082
```

---

## 16. Swagger 테스트

Swagger 주소:

```text
http://localhost:18082/swagger-ui/index.html
```

기존 프로젝트와 다른 점:

| 기존 SpringBasic | 새 무인증 프로젝트 |
|---|---|
| JWT 필요 | JWT 불필요 |
| `Authorize` 필요 | `Authorize` 불필요 |
| DB 연결 필요 | DB 불필요 |
| Security Filter 동작 | Security 없음 |

Swagger에서 바로 `/api/ai/chat`을 실행할 수 있다.

---

## 17. Postman 테스트 1: 텍스트 챗봇

요청:

```text
POST http://localhost:18082/api/ai/chat
```

Headers:

| Key | Value |
|---|---|
| `Content-Type` | `application/json` |

Body > raw > JSON:

```json
{
  "prompt": "Spring Boot Controller와 Service의 차이를 초보자에게 설명해줘."
}
```

성공 응답 예:

```json
{
  "reply": "Controller는 HTTP 요청을 받고 Service는 실제 로직을 처리합니다...",
  "model": "gemini-2.5-flash",
  "implemented": true
}
```

---

## 18. Postman 테스트 2: 이미지 분석

요청:

```text
POST http://localhost:18082/api/ai/analyze-image
```

Headers:

- 직접 `Content-Type`을 넣지 않는다.

Body > form-data:

| Key | Type | Value |
|---|---|---|
| `image` | File | 분석할 이미지 |
| `prompt` | Text | `이 이미지를 한국어로 자세히 설명해줘.` |

성공 응답 예:

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

## 19. 기존 SpringBasic 버전과 비교

| 항목 | 기존 `api5012` | 새 무인증 테스트 프로젝트 |
|---|---|---|
| 목적 | 실제 앱 구조와 통합 | Gemini API만 단독 연습 |
| JWT | 필요 | 없음 |
| DB | 필요 | 없음 |
| 명함 회원 검색 | 가능 | 없음 |
| Swagger Authorize | 필요 | 불필요 |
| Postman Authorization | 필요 | 불필요 |
| 학습 난이도 | 중간 | 낮음 |

추천 학습 순서:

1. 먼저 새 무인증 프로젝트에서 `/api/ai/chat` 성공시키기
2. 이미지 분석 multipart 업로드 성공시키기
3. 기존 `SpringBasic/api5012`로 돌아가 JWT 포함 버전 테스트하기
4. 마지막에 명함 OCR, 회원 검색 기능 테스트하기

---

## 20. 자주 나는 오류

### `gemini.api.key 설정이 필요합니다.`

`application-secret.properties`가 없거나 값이 비어 있다.

```properties
gemini.api.key=실제_API_KEY
```

### `Unsupported MIME type`

이미지 파일이 아니거나 MIME 타입 추론이 실패했다.

해결:

- JPG, PNG, WEBP로 테스트한다.
- Postman에서 `image`를 Text가 아니라 File로 보낸다.

### Swagger는 뜨는데 API 호출이 500

대부분 API Key 문제다.

확인:

- `application-secret.properties` 위치
- `gemini.api.key` 오타
- Google AI Studio에서 발급한 키가 정상인지

### 기존 프로젝트와 포트 충돌

기존 프로젝트가 `8080`을 쓰고 있다면 새 프로젝트는 `18082`를 사용한다.

```properties
server.port=18082
```

---

## 21. 핵심 정리

- 새 프로젝트에는 Security/JWT/DB를 넣지 않는다.
- Gemini 테스트에 필요한 것은 Web, WebFlux, Validation, Lombok, Swagger 정도다.
- 텍스트 API는 JSON으로 보낸다.
- 이미지 API는 multipart/form-data로 보낸다.
- API Key는 반드시 secret 파일에 둔다.
- 이 프로젝트에서 Gemini 기본 호출을 익힌 뒤 기존 `SpringBasic/api5012`로 넘어가면 이해가 훨씬 쉽다.


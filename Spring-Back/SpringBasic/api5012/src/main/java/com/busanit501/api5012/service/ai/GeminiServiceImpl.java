package com.busanit501.api5012.service.ai;

import com.busanit501.api5012.dto.ai.gemini.BusinessCardDTO;
import com.busanit501.api5012.dto.ai.gemini.BusinessCardSearchResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.ChatRequestDTO;
import com.busanit501.api5012.dto.ai.gemini.ChatResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.ImageAnalysisResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.MultimodalResponseDTO;
import com.busanit501.api5012.domain.library.Member;
import com.busanit501.api5012.exception.GeminiApiException;
import com.busanit501.api5012.repository.library.MemberRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * GeminiServiceImpl - Gemini AI 서비스 구현체
 *
 * 텍스트 챗봇과 이미지 분석은 실제 Gemini REST API를 호출하고,
 * 나머지 기능은 단계적으로 확장합니다.
 */
@Service
@Log4j2
public class GeminiServiceImpl implements GeminiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final MemberRepository memberRepository;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.base-url}")
    private String baseUrl;

    @Value("${gemini.api.model}")
    private String model;

    public GeminiServiceImpl(WebClient.Builder webClientBuilder,
                             ObjectMapper objectMapper,
                             MemberRepository memberRepository,
                             @Value("${gemini.api.base-url}") String baseUrl) {
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();
        this.objectMapper = objectMapper;
        this.memberRepository = memberRepository;
    }

    @Override
    public ChatResponseDTO chat(ChatRequestDTO requestDTO) {
        validateApiKey();
        String prompt = validatePrompt(requestDTO);

        log.info("Gemini chat request. model={}, baseUrl={}, promptLength={}",
                model, baseUrl, prompt.length());

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

            String reply = extractText(response);

            return ChatResponseDTO.builder()
                    .reply(reply)
                    .model(model)
                    .implemented(true)
                    .build();
        } catch (WebClientResponseException e) {
            log.error("Gemini chat HTTP error. status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new GeminiApiException(
                    HttpStatus.BAD_GATEWAY,
                    resolveGeminiErrorCode(e),
                    buildGeminiHttpErrorMessage(e)
            );
        } catch (Exception e) {
            log.error("Gemini chat unexpected error", e);
            throw new IllegalStateException("Gemini 응답 처리 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public ImageAnalysisResponseDTO analyzeImage(MultipartFile image, String prompt) {
        validateImage(image);
        validateApiKey();
        String normalizedPrompt = (prompt == null || prompt.isBlank())
                ? "이 이미지를 한국어로 설명해주세요."
                : prompt.trim();

        log.info("Gemini image analysis request. model={}, filename={}, mimeType={}, promptLength={}",
                model, image.getOriginalFilename(), image.getContentType(), normalizedPrompt.length());

        try {
            Map<String, Object> response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(model))
                    .bodyValue(buildImageAnalysisRequestBody(image, normalizedPrompt))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            return ImageAnalysisResponseDTO.builder()
                    .description(extractText(response))
                    .filename(image.getOriginalFilename())
                    .mimeType(image.getContentType())
                    .model(model)
                    .implemented(true)
                    .build();
        } catch (WebClientResponseException e) {
            log.error("Gemini image analysis HTTP error. status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new GeminiApiException(
                    HttpStatus.BAD_GATEWAY,
                    resolveGeminiErrorCode(e),
                    buildGeminiHttpErrorMessage(e)
            );
        } catch (IOException e) {
            log.error("Failed to read image bytes for Gemini image analysis", e);
            throw new IllegalStateException("업로드한 이미지를 읽는 중 오류가 발생했습니다.", e);
        } catch (Exception e) {
            log.error("Gemini image analysis unexpected error", e);
            throw new IllegalStateException("Gemini 이미지 분석 처리 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public BusinessCardDTO ocrBusinessCard(MultipartFile image) {
        validateImage(image);
        validateApiKey();

        log.info("Gemini business card OCR request. model={}, filename={}, mimeType={}",
                model, image.getOriginalFilename(), image.getContentType());

        try {
            Map<String, Object> response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(model))
                    .bodyValue(buildBusinessCardOcrRequestBody(image))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            String rawText = extractText(response);
            BusinessCardDTO parsed = parseBusinessCard(rawText);
            parsed.setRawText(rawText);
            parsed.setModel(model);
            parsed.setImplemented(true);
            parsed.setParseSuccess(true);
            return parsed;
        } catch (WebClientResponseException e) {
            log.error("Gemini business card OCR HTTP error. status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new GeminiApiException(
                    HttpStatus.BAD_GATEWAY,
                    resolveGeminiErrorCode(e),
                    buildGeminiHttpErrorMessage(e)
            );
        } catch (IOException e) {
            log.error("Failed to read image bytes for Gemini business card OCR", e);
            throw new IllegalStateException("업로드한 명함 이미지를 읽는 중 오류가 발생했습니다.", e);
        } catch (Exception e) {
            log.error("Gemini business card OCR unexpected error", e);
            throw new IllegalStateException("Gemini 명함 OCR 처리 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public BusinessCardSearchResponseDTO searchByBusinessCard(MultipartFile image) {
        validateImage(image);

        BusinessCardDTO extractedCard = ocrBusinessCard(image);
        log.info("제미나이 서비스 확인중 : 이미지로 ocr 후, 해당 멤버 조회 1차 ocr 결과 내용 확인 :");
        log.info(extractedCard);
        MatchResult matchResult = findMemberByBusinessCard(extractedCard);
        log.info("제미나이 서비스 확인중 : 이미지로 ocr 후, 해당 멤버 조회 4차 matchResult 결과 내용 확인 :" + matchResult);

        BusinessCardSearchResponseDTO.BusinessCardSearchResponseDTOBuilder builder =
                BusinessCardSearchResponseDTO.builder()
                .matched(matchResult.member().isPresent())
                .matchType(matchResult.matchType())
                .extractedCard(extractedCard)
                .implemented(true);


        matchResult.member().ifPresent(member -> builder
                .memberId(member.getId())
                .mid(member.getMid())
                .memberName(member.getMname())
                .email(member.getEmail())
                .region(member.getRegion())
                .role(member.getRole() == null ? null : member.getRole().name()));

        BusinessCardSearchResponseDTO responseDTO = builder.build();

        log.info("제미나이 서비스 확인중 : 이미지로 ocr 후, 해당 멤버 조회 5차 responseDTO 결과 내용 확인 :" + responseDTO);

        return responseDTO;
    }

    @Override
    public MultimodalResponseDTO multimodal(MultipartFile image, String question) {
        validateImage(image);
        validateApiKey();
        String normalizedQuestion = validateQuestion(question);

        log.info("Gemini multimodal request. model={}, filename={}, mimeType={}, questionLength={}",
                model, image.getOriginalFilename(), image.getContentType(), normalizedQuestion.length());

        try {
            Map<String, Object> response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/{model}:generateContent")
                            .queryParam("key", apiKey)
                            .build(model))
                    .bodyValue(buildMultimodalRequestBody(image, normalizedQuestion))
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            return MultimodalResponseDTO.builder()
                    .question(normalizedQuestion)
                    .answer(extractText(response))
                    .model(model)
                    .implemented(true)
                    .build();
        } catch (WebClientResponseException e) {
            log.error("Gemini multimodal HTTP error. status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new GeminiApiException(
                    HttpStatus.BAD_GATEWAY,
                    resolveGeminiErrorCode(e),
                    buildGeminiHttpErrorMessage(e)
            );
        } catch (IOException e) {
            log.error("Failed to read image bytes for Gemini multimodal", e);
            throw new IllegalStateException("업로드한 이미지를 읽는 중 오류가 발생했습니다.", e);
        } catch (Exception e) {
            log.error("Gemini multimodal unexpected error", e);
            throw new IllegalStateException("Gemini 멀티모달 처리 중 오류가 발생했습니다.", e);
        }
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("image 파일은 비어 있을 수 없습니다.");
        }
    }

    private void validateApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("gemini.api.key 설정이 필요합니다.");
        }
    }

    private String validatePrompt(ChatRequestDTO requestDTO) {
        if (requestDTO == null || requestDTO.getPrompt() == null || requestDTO.getPrompt().isBlank()) {
            throw new IllegalArgumentException("prompt 는 비어 있을 수 없습니다.");
        }
        return requestDTO.getPrompt().trim();
    }

    private String validateQuestion(String question) {
        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException("question 은 비어 있을 수 없습니다.");
        }
        return question.trim();
    }

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

    private Map<String, Object> buildImageAnalysisRequestBody(MultipartFile image, String prompt) throws IOException {
        return buildImageRequestBody(image, prompt, 0.4, 1024, null);
    }

    private Map<String, Object> buildBusinessCardOcrRequestBody(MultipartFile image) throws IOException {
        String prompt = """
                이 명함 이미지에서 정보를 추출하여 반드시 JSON 객체 하나로만 응답하세요.
                다른 설명, 마크다운 코드블록, 주석은 포함하지 마세요.
                값이 보이지 않으면 빈 문자열("")로 채우세요.
                필요한 필드:
                name, company, department, position, phone, email, address
                """;

        return buildImageRequestBody(
                image,
                prompt,
                0.1,
                1024,
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
        );
    }

    private Map<String, Object> buildMultimodalRequestBody(MultipartFile image, String question) throws IOException {
        return buildImageRequestBody(image, question, 0.4, 1024, null);
    }

    private Map<String, Object> buildImageRequestBody(
            MultipartFile image,
            String prompt,
            double temperature,
            int maxOutputTokens,
            Map<String, Object> additionalGenerationConfig) throws IOException {
        String mimeType = resolveImageMimeType(image);
        if (!mimeType.startsWith("image/")) {
            throw new IllegalArgumentException("지원하지 않는 이미지 형식입니다. PNG, JPG, WEBP 등을 사용해주세요.");
        }

        String encodedImage = Base64.getEncoder().encodeToString(image.getBytes());
        Map<String, Object> generationConfig = buildGenerationConfig(
                temperature,
                maxOutputTokens,
                additionalGenerationConfig
        );

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
    }

    private Map<String, Object> buildGenerationConfig(
            double temperature,
            int maxOutputTokens,
            Map<String, Object> additionalGenerationConfig) {
        List<Map.Entry<String, Object>> entries = new ArrayList<>();
        entries.add(Map.entry("temperature", temperature));
        entries.add(Map.entry("maxOutputTokens", maxOutputTokens));
        if (additionalGenerationConfig != null) {
            entries.addAll(additionalGenerationConfig.entrySet());
        }
        return Map.ofEntries(entries.toArray(Map.Entry[]::new));
    }

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

    private String stripJsonFence(String rawText) {
        String value = rawText == null ? "" : rawText.trim();
        if (value.startsWith("```")) {
            value = value.replaceFirst("^```(?:json)?\\s*", "");
            value = value.replaceFirst("\\s*```$", "");
        }
        return value.trim();
    }

    private MatchResult findMemberByBusinessCard(BusinessCardDTO card) {
        String email = normalizeBlank(card.getEmail());
        if (email != null) {
            log.info("제미나이 서비스 확인중 : 이메일 정보 확인 : " + email);
            Optional<Member> member = memberRepository.findByEmail(email);
            if (member.isPresent()) {
                log.info("제미나이 서비스 확인중 : member 정보 확인 : " + member);
                return new MatchResult(member, "EMAIL_MATCH");
            }
        }

        String name = normalizeBlank(card.getName());
        if (name != null) {
            log.info("제미나이 서비스 확인중 : name 정보 확인 : " + name);
            List<Member> members = memberRepository.findByMnameContaining(name);
            if (!members.isEmpty()) {

                return new MatchResult(Optional.of(members.get(0)), "NAME_MATCH");
            }
        }

        return new MatchResult(Optional.empty(), "NO_MATCH");
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record MatchResult(Optional<Member> member, String matchType) {

    }

    @SuppressWarnings("unchecked")
    private String extractText(Map<String, Object> response) {
        if (response == null) {
            throw new IllegalStateException("Gemini 응답이 비어 있습니다.");
        }

        List<Map<String, Object>> candidates =
                (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini candidates 응답이 없습니다.");
        }

        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) {
            throw new IllegalStateException("Gemini content 응답이 없습니다.");
        }

        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new IllegalStateException("Gemini parts 응답이 없습니다.");
        }

        Object text = parts.get(0).get("text");
        if (!(text instanceof String reply) || reply.isBlank()) {
            throw new IllegalStateException("Gemini text 응답이 비어 있습니다.");
        }

        return reply;
    }

    private String buildGeminiHttpErrorMessage(WebClientResponseException e) {
        String responseBody = e.getResponseBodyAsString();

        if (responseBody != null && responseBody.contains("no longer available to new users")) {
            return "현재 설정된 Gemini 모델을 사용할 수 없습니다. 최신 지원 모델명으로 변경해주세요.";
        }

        if (responseBody != null && responseBody.contains("Unsupported MIME type")) {
            return "지원하지 않는 이미지 형식입니다. PNG, JPG, WEBP 등을 사용해주세요.";
        }

        if (e.getStatusCode().value() == 429) {
            return "AI 요청이 잠시 많습니다. 잠시 후 다시 시도해주세요.";
        }

        if (e.getStatusCode().is5xxServerError()) {
            return "Gemini 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.";
        }

        return "Gemini API 호출에 실패했습니다. upstream status=" + e.getStatusCode().value();
    }

    private String resolveGeminiErrorCode(WebClientResponseException e) {
        String responseBody = e.getResponseBodyAsString();

        if (responseBody != null && responseBody.contains("no longer available to new users")) {
            return "MODEL_UNAVAILABLE";
        }

        if (responseBody != null && responseBody.contains("Unsupported MIME type")) {
            return "INVALID_IMAGE_TYPE";
        }

        if (e.getStatusCode().value() == 429) {
            return "RATE_LIMITED";
        }

        if (e.getStatusCode().is5xxServerError()) {
            return "UPSTREAM_TEMPORARY_ERROR";
        }

        return "GEMINI_HTTP_ERROR";
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
}

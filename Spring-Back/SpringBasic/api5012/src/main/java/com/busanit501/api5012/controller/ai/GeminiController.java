package com.busanit501.api5012.controller.ai;

import com.busanit501.api5012.dto.ai.gemini.BusinessCardDTO;
import com.busanit501.api5012.dto.ai.gemini.BusinessCardSearchResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.ChatRequestDTO;
import com.busanit501.api5012.dto.ai.gemini.ChatResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.ImageAnalysisResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.MultimodalResponseDTO;
import com.busanit501.api5012.service.ai.GeminiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * GeminiController - Gemini AI REST 컨트롤러 뼈대
 *
 * 클라이언트는 이 컨트롤러만 호출하고, 실제 Gemini API 연동은 서비스 계층에 위임합니다.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Log4j2
@Tag(name = "Gemini AI API", description = "텍스트/이미지 멀티모달 AI 기능")
public class GeminiController {

    private final GeminiService geminiService;

    @PostMapping("/chat")
    @Operation(summary = "Gemini 텍스트 챗봇", description = "텍스트 질문을 전달하고 Gemini 응답을 반환합니다.")
    public ResponseEntity<ChatResponseDTO> chat(@Valid @RequestBody ChatRequestDTO requestDTO) {
        log.info("Gemini chat request received");
        return ResponseEntity.ok(geminiService.chat(requestDTO));
    }

    @PostMapping("/analyze-image")
    @Operation(summary = "Gemini 이미지 분석", description = "이미지 파일을 분석하고 설명 텍스트를 반환합니다.")
    public ResponseEntity<ImageAnalysisResponseDTO> analyzeImage(
            @RequestPart MultipartFile image,
            @RequestParam(defaultValue = "이 이미지를 한국어로 설명해주세요.") String prompt) {
        return ResponseEntity.ok(geminiService.analyzeImage(image, prompt));
    }

    @PostMapping("/ocr/business-card")
    @Operation(summary = "Gemini 명함 OCR", description = "명함 이미지를 분석해 구조화된 명함 정보를 반환합니다.")
    public ResponseEntity<BusinessCardDTO> ocrBusinessCard(@RequestPart MultipartFile image) {
        return ResponseEntity.ok(geminiService.ocrBusinessCard(image));
    }

    @PostMapping("/ocr/search")
    @Operation(summary = "명함 기반 회원 검색", description = "명함 이미지를 OCR한 뒤 회원 DB 매칭 결과를 반환합니다.")
    public ResponseEntity<BusinessCardSearchResponseDTO> searchByBusinessCard(
            @RequestPart MultipartFile image) {
        return ResponseEntity.ok(geminiService.searchByBusinessCard(image));
    }

    @PostMapping("/multimodal")
    @Operation(summary = "Gemini 멀티모달 Q&A", description = "이미지와 질문을 함께 전달해 답변을 반환합니다.")
    public ResponseEntity<MultimodalResponseDTO> multimodal(
            @RequestPart MultipartFile image,
            @RequestParam String question) {
        return ResponseEntity.ok(geminiService.multimodal(image, question));
    }
}

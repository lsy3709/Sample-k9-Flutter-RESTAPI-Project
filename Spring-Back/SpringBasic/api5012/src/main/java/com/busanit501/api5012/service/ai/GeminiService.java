package com.busanit501.api5012.service.ai;

import com.busanit501.api5012.dto.ai.gemini.BusinessCardDTO;
import com.busanit501.api5012.dto.ai.gemini.BusinessCardSearchResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.ChatRequestDTO;
import com.busanit501.api5012.dto.ai.gemini.ChatResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.ImageAnalysisResponseDTO;
import com.busanit501.api5012.dto.ai.gemini.MultimodalResponseDTO;
import org.springframework.web.multipart.MultipartFile;

/**
 * GeminiService - Gemini AI 기능 진입점 인터페이스
 *
 * 실제 Gemini REST API 연동은 구현체에서 담당합니다.
 */
public interface GeminiService {

    ChatResponseDTO chat(ChatRequestDTO requestDTO);

    ImageAnalysisResponseDTO analyzeImage(MultipartFile image, String prompt);

    BusinessCardDTO ocrBusinessCard(MultipartFile image);

    BusinessCardSearchResponseDTO searchByBusinessCard(MultipartFile image);

    MultimodalResponseDTO multimodal(MultipartFile image, String question);
}

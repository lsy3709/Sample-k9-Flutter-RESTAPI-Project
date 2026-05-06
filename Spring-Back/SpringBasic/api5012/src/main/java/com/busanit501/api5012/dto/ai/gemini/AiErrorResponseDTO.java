package com.busanit501.api5012.dto.ai.gemini;

import lombok.Builder;
import lombok.Getter;

/**
 * AI API 오류를 프론트엔드가 일관되게 처리할 수 있도록 반환하는 공통 응답 DTO입니다.
 */
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

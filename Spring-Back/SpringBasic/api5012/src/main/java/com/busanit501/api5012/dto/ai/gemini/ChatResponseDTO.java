package com.busanit501.api5012.dto.ai.gemini;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ChatResponseDTO - Gemini 텍스트 응답 DTO
 *
 * 현재 단계에서는 뼈대 응답 구조만 제공합니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponseDTO {

    /** AI 답변 텍스트 */
    private String reply;

    /** 호출 대상으로 설정된 Gemini 모델명 */
    private String model;

    /** 실제 Gemini API 호출 여부 */
    private boolean implemented;
}

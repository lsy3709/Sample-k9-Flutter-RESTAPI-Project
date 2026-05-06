package com.busanit501.api5012.dto.ai.gemini;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ChatRequestDTO - Gemini 텍스트 챗봇 요청 DTO
 *
 * 클라이언트가 `/api/ai/chat` 으로 보내는 기본 요청 객체입니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequestDTO {

    /** 사용자가 입력한 질문 */
    @NotBlank(message = "prompt 는 비어 있을 수 없습니다.")
    private String prompt;
}

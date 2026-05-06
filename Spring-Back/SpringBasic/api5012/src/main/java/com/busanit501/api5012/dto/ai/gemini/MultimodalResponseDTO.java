package com.busanit501.api5012.dto.ai.gemini;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * MultimodalResponseDTO - 이미지 + 질문 멀티모달 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MultimodalResponseDTO {

    /** 사용자가 이미지와 함께 전달한 질문 */
    private String question;

    /** 이미지와 질문을 바탕으로 생성된 답변 */
    private String answer;

    /** 호출 대상으로 설정된 Gemini 모델명 */
    private String model;

    /** 실제 Gemini API 호출 여부 */
    private boolean implemented;
}

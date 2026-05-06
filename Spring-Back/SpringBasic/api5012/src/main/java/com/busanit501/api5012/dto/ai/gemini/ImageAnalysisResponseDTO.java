package com.busanit501.api5012.dto.ai.gemini;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ImageAnalysisResponseDTO - 이미지 분석 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageAnalysisResponseDTO {

    /** 이미지에 대한 설명 또는 분석 결과 */
    private String description;

    /** 업로드된 파일명 */
    private String filename;

    /** 업로드된 MIME 타입 */
    private String mimeType;

    /** 호출 대상으로 설정된 Gemini 모델명 */
    private String model;

    /** 실제 Gemini API 호출 여부 */
    private boolean implemented;
}

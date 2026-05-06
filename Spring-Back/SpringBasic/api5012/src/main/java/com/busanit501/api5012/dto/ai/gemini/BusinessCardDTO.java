package com.busanit501.api5012.dto.ai.gemini;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * BusinessCardDTO - 명함 OCR 구조화 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessCardDTO {

    private String name;
    private String company;
    private String department;
    private String position;
    private String phone;
    private String email;
    private String address;

    /** OCR 원문 또는 보조 설명 */
    private String rawText;

    /** JSON 파싱 성공 여부 */
    private boolean parseSuccess;

    /** 호출 대상으로 설정된 Gemini 모델명 */
    private String model;

    /** 실제 Gemini API 호출 여부 */
    private boolean implemented;
}

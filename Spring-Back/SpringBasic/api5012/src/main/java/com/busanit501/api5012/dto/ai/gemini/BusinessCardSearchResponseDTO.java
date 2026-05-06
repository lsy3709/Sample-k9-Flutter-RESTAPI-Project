package com.busanit501.api5012.dto.ai.gemini;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * BusinessCardSearchResponseDTO - 명함 OCR 기반 회원 검색 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessCardSearchResponseDTO {

    /** DB 회원 매칭 성공 여부 */
    private boolean matched;

    /** 매칭 기준 예: EMAIL_MATCH, PHONE_MATCH */
    private String matchType;

    /** 매칭된 회원 ID */
    private Long memberId;

    /** 매칭된 회원 아이디 */
    private String mid;

    /** 매칭된 회원 이름 */
    private String memberName;

    /** 매칭된 회원 이메일 */
    private String email;

    /** 매칭된 회원 지역 */
    private String region;

    /** 매칭된 회원 역할 */
    private String role;

    /** 매칭에 사용된 명함 추출 정보 */
    private BusinessCardDTO extractedCard;

    /** 실제 Gemini API 호출 여부 */
    private boolean implemented;
}

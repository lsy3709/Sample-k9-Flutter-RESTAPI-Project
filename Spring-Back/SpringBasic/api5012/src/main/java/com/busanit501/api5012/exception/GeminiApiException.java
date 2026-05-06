package com.busanit501.api5012.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Gemini 외부 API 호출 실패를 애플리케이션 내부 예외와 구분하기 위한 예외 타입입니다.
 */
@Getter
public class GeminiApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public GeminiApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

import axios from "axios";
import type { AiErrorResponse } from "@/types/ai";

export type AiErrorTone = "amber" | "red" | "blue" | "slate";

export interface AiErrorDisplay {
  code: string;
  label: string;
  tone: AiErrorTone;
  message: string;
}

/**
 * 백엔드 AI 오류 응답을 사용자 친화적인 프론트 표시 정보로 변환합니다.
 */
export function classifyAiError(error: unknown): AiErrorDisplay {
  if (axios.isAxiosError<AiErrorResponse>(error)) {
    const payload = error.response?.data;
    const code = payload?.code ?? "REQUEST_FAILED";
    const message =
      payload?.message ?? error.message ?? "AI 요청 중 오류가 발생했습니다.";

    switch (code) {
      case "INVALID_REQUEST":
        return {
          code,
          label: "입력 확인",
          tone: "amber",
          message,
        };
      case "RATE_LIMITED":
        return {
          code,
          label: "잠시 대기",
          tone: "blue",
          message,
        };
      case "MODEL_UNAVAILABLE":
        return {
          code,
          label: "모델 점검",
          tone: "amber",
          message,
        };
      case "INVALID_IMAGE_TYPE":
        return {
          code,
          label: "이미지 형식 확인",
          tone: "amber",
          message,
        };
      case "UPSTREAM_TEMPORARY_ERROR":
        return {
          code,
          label: "일시 장애",
          tone: "blue",
          message,
        };
      case "AI_INTERNAL_ERROR":
        return {
          code,
          label: "서버 처리 오류",
          tone: "red",
          message,
        };
      default:
        return {
          code,
          label: "요청 실패",
          tone: "red",
          message,
        };
    }
  }

  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      label: "알 수 없는 오류",
      tone: "red",
      message: error.message,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    label: "알 수 없는 오류",
    tone: "red",
    message: "AI 요청 중 오류가 발생했습니다.",
  };
}

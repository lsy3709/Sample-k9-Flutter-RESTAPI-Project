import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { classifyAiError } from "./ai-error";
import type { AiErrorResponse } from "@/types/ai";

function makeAxiosError(data: AiErrorResponse) {
  return new AxiosError<AiErrorResponse>(
    data.message,
    undefined,
    undefined,
    undefined,
    {
      data,
      status: data.status,
      statusText: data.error,
      headers: {},
      config: {} as never,
    },
  );
}

describe("classifyAiError", () => {
  it("maps invalid request errors to amber input badge", () => {
    const result = classifyAiError(
      makeAxiosError({
        timestamp: "2026-04-30T00:00:00+09:00",
        status: 400,
        error: "Bad Request",
        code: "INVALID_REQUEST",
        message: "prompt 는 비어 있을 수 없습니다.",
        path: "/api/ai/chat",
      }),
    );

    expect(result.label).toBe("입력 확인");
    expect(result.tone).toBe("amber");
  });

  it("maps upstream rate limits to blue waiting badge", () => {
    const result = classifyAiError(
      makeAxiosError({
        timestamp: "2026-04-30T00:00:00+09:00",
        status: 502,
        error: "Bad Gateway",
        code: "RATE_LIMITED",
        message: "AI 요청이 잠시 많습니다. 잠시 후 다시 시도해주세요.",
        path: "/api/ai/chat",
      }),
    );

    expect(result.label).toBe("잠시 대기");
    expect(result.tone).toBe("blue");
  });

  it("falls back to generic red error for unknown cases", () => {
    const result = classifyAiError(new Error("boom"));
    expect(result.label).toBe("알 수 없는 오류");
    expect(result.tone).toBe("red");
  });
});

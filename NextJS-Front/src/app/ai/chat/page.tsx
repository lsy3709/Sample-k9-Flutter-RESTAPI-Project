"use client";

import { FormEvent, useMemo, useState } from "react";
import Protected from "@/components/Protected";
import AiErrorNotice from "@/components/AiErrorNotice";
import { classifyAiError, type AiErrorDisplay } from "@/lib/ai-error";
import { api } from "@/lib/api";
import type { ChatResponse } from "@/types/ai";

/**
 * Gemini AI 채팅 페이지입니다.
 * - 로그인한 사용자만 접근할 수 있습니다.
 * - Spring `/api/ai/chat` 엔드포인트를 호출해 텍스트 답변을 보여줍니다.
 * - 성공/실패 응답을 대화형 UI로 정리해 다음 AI 기능 확장 시 재사용할 수 있게 구성합니다.
 */
export default function AiChatPage() {
  return (
    <Protected>
      <AiChatClient />
    </Protected>
  );
}

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

function AiChatClient() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "안녕하세요. 도서관 이용, 행사, 서비스 안내를 도와드릴게요.",
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AiErrorDisplay | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => prompt.trim().length > 0 && !submitting,
    [prompt, submitting],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextPrompt = prompt.trim();
    if (!nextPrompt) {
      setError({
        code: "NO_PROMPT",
        label: "입력 확인",
        tone: "amber",
        message: "질문을 입력해주세요.",
      });
      return;
    }

    setError(null);
    setSubmitting(true);
    setMessages((prev) => [...prev, { role: "user", text: nextPrompt }]);
    setPrompt("");

    try {
      const response = await api.post<ChatResponse>("/ai/chat", {
        prompt: nextPrompt,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: response.data.reply },
      ]);
      setLastModel(response.data.model);
    } catch (err: unknown) {
      const nextError = classifyAiError(err);
      setError(nextError);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `요청을 처리하지 못했습니다. ${nextError.message}`,
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-amber-200 bg-white/90 p-6 shadow-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
            AI Concierge
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Gemini 도서관 챗봇
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                도서관 이용 방법, 시설 안내, 행사 정보처럼 텍스트로 답할 수
                있는 질문을 빠르게 확인할 수 있는 내부 AI 화면입니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-100">
              <p className="font-medium">현재 연결</p>
              <p className="text-slate-300">
                {lastModel ? lastModel : "첫 요청 전"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex h-[58vh] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                      message.role === "user"
                        ? "bg-amber-500 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
                      {message.role === "user" ? "You" : "Gemini"}
                    </p>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))}

              {submitting && (
                <div className="flex justify-start">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Gemini가 답변을 정리하고 있습니다...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 bg-slate-50 p-4"
            >
              <label className="mb-2 block text-sm font-medium text-slate-700">
                질문 입력
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="예: 도서 대출 기간과 연장 방법을 알려줘"
                  rows={4}
                  className="min-h-28 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? "전송 중..." : "질문 보내기"}
                </button>
              </div>

              {error && <div className="mt-3"><AiErrorNotice error={error} /></div>}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

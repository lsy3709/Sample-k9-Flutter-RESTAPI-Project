"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Protected from "@/components/Protected";
import AiErrorNotice from "@/components/AiErrorNotice";
import { classifyAiError, type AiErrorDisplay } from "@/lib/ai-error";
import { api } from "@/lib/api";
import type { MultimodalResponse } from "@/types/ai";

export default function AiMultimodalPage() {
  return (
    <Protected>
      <AiMultimodalClient />
    </Protected>
  );
}

function AiMultimodalClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("이 이미지에서 중요한 내용을 알려줘.");
  const [result, setResult] = useState<MultimodalResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AiErrorDisplay | null>(null);

  const canSubmit = useMemo(
    () => !!file && question.trim().length > 0 && !submitting,
    [file, question, submitting],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    setError(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError({
        code: "NO_IMAGE",
        label: "파일 필요",
        tone: "amber",
        message: "질문에 사용할 이미지를 먼저 선택해주세요.",
      });
      return;
    }

    const nextQuestion = question.trim();
    if (!nextQuestion) {
      setError({
        code: "NO_QUESTION",
        label: "질문 필요",
        tone: "amber",
        message: "이미지와 함께 보낼 질문을 입력해주세요.",
      });
      return;
    }

    setSubmitting(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("question", nextQuestion);

      const response = await api.post<MultimodalResponse>(
        "/ai/multimodal",
        formData,
      );
      setResult(response.data);
    } catch (err: unknown) {
      setError(classifyAiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fff1f2_0%,_#ffffff_38%,_#eff6ff_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[2rem] border border-rose-200 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">
            Multimodal Workspace
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Gemini 이미지 Q&A
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            이미지를 선택하고 질문을 함께 보내면 Gemini가 이미지 내용을
            바탕으로 답변합니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                이미지 선택
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                질문
              </span>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-500"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "답변 생성 중..." : "이미지 질문 보내기"}
            </button>

            {error && <AiErrorNotice error={error} />}
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">답변</h2>
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="질문 이미지 미리보기"
                className="h-72 w-full object-contain"
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-slate-400">
                선택한 이미지가 여기에 표시됩니다.
              </div>
            )}
          </div>

          {result ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  {result.model}
                </span>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                  Image analyzed
                </span>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Question
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {result.question}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                  Answer
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                  {result.answer}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">
              아직 답변이 없습니다. 이미지와 질문을 입력하면 결과가 여기에
              표시됩니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

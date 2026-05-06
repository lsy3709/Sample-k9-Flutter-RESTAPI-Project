"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Protected from "@/components/Protected";
import AiErrorNotice from "@/components/AiErrorNotice";
import { classifyAiError, type AiErrorDisplay } from "@/lib/ai-error";
import { api } from "@/lib/api";
import type { ImageAnalysisResponse } from "@/types/ai";

/**
 * Gemini 이미지 분석 페이지입니다.
 * - 사용자가 이미지를 업로드하면 Spring `/api/ai/analyze-image`로 multipart 요청을 보냅니다.
 * - 분석 결과와 파일 메타데이터를 함께 보여줍니다.
 */
export default function AiImagePage() {
  return (
    <Protected>
      <AiImageClient />
    </Protected>
  );
}

function AiImageClient() {
  const [prompt, setPrompt] = useState("이 이미지를 한국어로 설명해주세요.");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ImageAnalysisResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AiErrorDisplay | null>(null);

  const canSubmit = useMemo(() => !!file && !submitting, [file, submitting]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    setError(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (nextFile) {
      setPreviewUrl(URL.createObjectURL(nextFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError({
        code: "NO_IMAGE",
        label: "파일 필요",
        tone: "amber",
        message: "분석할 이미지를 먼저 선택해주세요.",
      });
      return;
    }

    setSubmitting(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("prompt", prompt.trim() || "이 이미지를 한국어로 설명해주세요.");

      const response = await api.post<ImageAnalysisResponse>(
        "/ai/analyze-image",
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
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eff6ff_0%,_#ffffff_35%,_#fefce8_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-sky-200 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Vision Workspace
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Gemini 이미지 분석
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            이미지를 업로드하면 Gemini가 장면, 주요 객체, 분위기, 읽을 수 있는
            맥락을 한국어로 설명합니다.
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
                분석 프롬프트
              </span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "분석 중..." : "이미지 분석 요청"}
            </button>

            {error && <AiErrorNotice error={error} />}
          </form>
        </section>

        <section className="rounded-[2rem] border border-amber-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">결과 미리보기</h2>

          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="업로드 미리보기"
                className="h-72 w-full object-cover"
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
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                  {result.mimeType}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  {result.filename}
                </span>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Analysis
                </p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {result.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">
              분석 결과가 아직 없습니다. 이미지를 선택하고 요청을 보내면
              모델명, 파일 정보, 설명 결과가 여기에 표시됩니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

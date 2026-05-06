"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Protected from "@/components/Protected";
import AiErrorNotice from "@/components/AiErrorNotice";
import { classifyAiError, type AiErrorDisplay } from "@/lib/ai-error";
import { api } from "@/lib/api";
import type {
  BusinessCardResponse,
  BusinessCardSearchResponse,
} from "@/types/ai";

export default function AiBusinessCardPage() {
  return (
    <Protected>
      <AiBusinessCardClient />
    </Protected>
  );
}

function AiBusinessCardClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<BusinessCardResponse | null>(null);
  const [searchResult, setSearchResult] =
    useState<BusinessCardSearchResponse | null>(null);
  const [submitting, setSubmitting] = useState<"ocr" | "search" | null>(null);
  const [error, setError] = useState<AiErrorDisplay | null>(null);

  const canSubmit = useMemo(() => !!file && !submitting, [file, submitting]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    setOcrResult(null);
    setSearchResult(null);
    setError(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const buildFormData = () => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("image", file);
    return formData;
  };

  const handleOcr = async (e: FormEvent) => {
    e.preventDefault();
    const formData = buildFormData();
    if (!formData) {
      setError({
        code: "NO_IMAGE",
        label: "파일 필요",
        tone: "amber",
        message: "인식할 명함 이미지를 먼저 선택해주세요.",
      });
      return;
    }

    setSubmitting("ocr");
    setError(null);
    setSearchResult(null);

    try {
      const response = await api.post<BusinessCardResponse>(
        "/ai/ocr/business-card",
        formData,
      );
      setOcrResult(response.data);
    } catch (err: unknown) {
      setError(classifyAiError(err));
    } finally {
      setSubmitting(null);
    }
  };

  const handleSearch = async () => {
    const formData = buildFormData();
    if (!formData) return;

    setSubmitting("search");
    setError(null);

    try {
      const response = await api.post<BusinessCardSearchResponse>(
        "/ai/ocr/search",
        formData,
      );
      setSearchResult(response.data);
      setOcrResult(response.data.extractedCard);
    } catch (err: unknown) {
      setError(classifyAiError(err));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#ecfdf5_0%,_#ffffff_38%,_#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            OCR Workspace
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Gemini 명함 인식
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            명함 이미지를 업로드해 이름, 회사, 직책, 연락처를 구조화하고
            도서관 회원 DB와 매칭합니다.
          </p>

          <form onSubmit={handleOcr} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                명함 이미지
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting === "ocr" ? "인식 중..." : "명함 OCR"}
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSearch}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting === "search" ? "검색 중..." : "회원 검색"}
              </button>
            </div>

            {error && <AiErrorNotice error={error} />}
          </form>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="명함 미리보기"
                className="h-64 w-full object-contain"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                선택한 명함 이미지가 여기에 표시됩니다.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">인식 결과</h2>

          {ocrResult ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ResultField label="이름" value={ocrResult.name} />
              <ResultField label="회사" value={ocrResult.company} />
              <ResultField label="부서" value={ocrResult.department} />
              <ResultField label="직책" value={ocrResult.position} />
              <ResultField label="전화" value={ocrResult.phone} />
              <ResultField label="이메일" value={ocrResult.email} />
              <div className="sm:col-span-2">
                <ResultField label="주소" value={ocrResult.address} />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              OCR 결과가 아직 없습니다. 명함 OCR 또는 회원 검색을 실행하면
              추출 필드가 표시됩니다.
            </div>
          )}

          {searchResult && (
            <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">
                  {searchResult.matched ? "MATCHED" : "NO MATCH"}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                  {searchResult.matchType}
                </span>
              </div>
              {searchResult.matched ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ResultField label="회원 ID" value={searchResult.memberId} />
                  <ResultField label="계정" value={searchResult.mid} />
                  <ResultField label="회원명" value={searchResult.memberName} />
                  <ResultField label="이메일" value={searchResult.email} />
                  <ResultField label="지역" value={searchResult.region} />
                  <ResultField label="역할" value={searchResult.role} />
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-emerald-900">
                  일치하는 회원을 찾지 못했습니다. 현재 매칭은 이메일 우선,
                  이름 보조 기준으로 수행됩니다.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ResultField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 min-h-5 break-words text-sm text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

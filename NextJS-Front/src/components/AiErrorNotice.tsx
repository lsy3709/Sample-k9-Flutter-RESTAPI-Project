"use client";

import type { AiErrorDisplay, AiErrorTone } from "@/lib/ai-error";

const toneClassMap: Record<AiErrorTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-sky-200 bg-sky-50 text-sky-900",
  red: "border-red-200 bg-red-50 text-red-900",
  slate: "border-slate-200 bg-slate-50 text-slate-900",
};

const badgeClassMap: Record<AiErrorTone, string> = {
  amber: "bg-amber-200 text-amber-800",
  blue: "bg-sky-200 text-sky-800",
  red: "bg-red-200 text-red-800",
  slate: "bg-slate-200 text-slate-800",
};

/**
 * AI 에러를 배지 + 설명 블록으로 표시하는 공통 컴포넌트입니다.
 */
export default function AiErrorNotice({
  error,
}: {
  error: AiErrorDisplay;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClassMap[error.tone]}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClassMap[error.tone]}`}
        >
          {error.label}
        </span>
        <span className="text-xs uppercase tracking-wide opacity-70">
          {error.code}
        </span>
      </div>
      <p className="mt-2 leading-6">{error.message}</p>
    </div>
  );
}

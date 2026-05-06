"use client";

import Link from "next/link";
import Protected from "@/components/Protected";

/**
 * AI 기능 허브 페이지입니다.
 * Gemini AI 기능 진입점을 모아둔 허브 페이지입니다.
 */
export default function AiHubPage() {
  return (
    <Protected>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#ffffff_45%,_#e0f2fe)] px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-[2rem] border border-amber-200 bg-white/90 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">
              AI Workspace
            </p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900">
              도서관 AI 작업 공간
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Gemini 기반 텍스트, 이미지 분석, 명함 OCR, 멀티모달 질문응답을
              한곳에서 확인하는 내부 AI 허브입니다.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Link
                href="/ai/chat"
                className="rounded-[1.5rem] border border-slate-200 bg-slate-900 p-6 text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                  Ready
                </p>
                <h2 className="mt-3 text-2xl font-bold">Gemini Chat</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  텍스트 질문과 답변 흐름을 먼저 연결한 기본 챗봇 화면입니다.
                </p>
              </Link>

              <Link
                href="/ai/image"
                className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-6 text-slate-700 transition hover:-translate-y-0.5 hover:bg-sky-100"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Ready
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">
                  Gemini Image
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  이미지를 업로드하고 한국어 설명을 받는 분석 화면입니다.
                </p>
              </Link>

              <Link
                href="/ai/business-card"
                className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-6 text-slate-700 transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  Ready
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">
                  Business Card OCR
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  명함 이미지를 구조화하고 회원 DB 매칭 결과를 확인합니다.
                </p>
              </Link>

              <Link
                href="/ai/multimodal"
                className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-6 text-slate-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
                  Ready
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">
                  Multimodal Q&A
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  이미지와 질문을 함께 보내 이미지 기반 답변을 받습니다.
                </p>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Protected>
  );
}

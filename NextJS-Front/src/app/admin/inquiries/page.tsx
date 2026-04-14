"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Protected from "@/components/Protected";
import { api, PageResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Inquiry } from "@/types/inquiry";

export default function AdminInquiriesPage() {
  return (
    <Protected requireRole="ADMIN">
      <Inner />
    </Protected>
  );
}

type AnsweredFilter = "ALL" | "PENDING" | "DONE";

const FILTER_LABEL: Record<AnsweredFilter, string> = {
  ALL: "전체",
  PENDING: "답변대기",
  DONE: "답변완료",
};

const PAGE_SIZE = 10;

function Inner() {
  const { member } = useAuth();

  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // 페이지네이션
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 필터 탭
  const [filter, setFilter] = useState<AnsweredFilter>("ALL");

  // 강제 재조회 트리거 (답변 등록·삭제 후)
  const [tick, setTick] = useState(0);

  // 답변 입력 상태
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<number, boolean>>({});

  // ── 목록 조회: filter / page / tick 이 바뀔 때마다 실행 ──
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, size: PAGE_SIZE };
        if (filter === "PENDING") params.answered = false;
        if (filter === "DONE")    params.answered = true;

        const res = await api.get<PageResponse<Inquiry>>("/inquiry", { params });
        if (!cancelled) {
          setItems(res.data.content ?? []);
          setTotalPages(res.data.totalPages ?? 0);
        }
      } catch {
        // 에러 시 목록 비움
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [page, filter, tick]);

  // ── 필터 탭 클릭 ──
  const handleFilterChange = (f: AnsweredFilter) => {
    setFilter(f);  // 항상 filter 먼저
    setPage(0);    // 첫 페이지로 초기화
  };

  // ── 답변 등록·삭제 후 현재 page/filter 그대로 재조회 ──
  const reload = () => setTick((t) => t + 1);

  // ── 답변 등록 ──
  const handleReply = async (id: number) => {
    const text = replyText[id]?.trim();
    if (!text) return;
    try {
      await api.post(`/inquiry/${id}/reply`, {
        replyText: text,
        replier: member?.mname ?? "관리자",
        inquiryId: id,
      });
      setMsg("답변이 등록되었습니다.");
      setReplyText((prev) => ({ ...prev, [id]: "" }));
      setReplyOpen((prev) => ({ ...prev, [id]: false }));
      reload();
    } catch (err: unknown) {
      setMsg(
        axios.isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ?? "답변 실패"
          : "답변 실패"
      );
    }
  };

  // ── 삭제 ──
  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await api.delete(`/inquiry/${id}`);
      setMsg("삭제되었습니다.");
      // 마지막 항목 삭제 시 이전 페이지로
      if (items.length === 1 && page > 0) setPage((p) => p - 1);
      else reload();
    } catch (err: unknown) {
      setMsg(
        axios.isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ?? "삭제 실패"
          : "삭제 실패"
      );
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">문의 답변</h1>
        <Link href="/admin" className="text-sm text-brand-600">← 대시보드</Link>
      </div>

      {/* 메시지 */}
      {msg && (
        <p className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-700">{msg}</p>
      )}

      {/* 필터 탭 */}
      <div className="mb-4 flex gap-1 border-b">
        {(["ALL", "PENDING", "DONE"] as AnsweredFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              filter === f
                ? "border-b-2 border-brand-600 text-brand-600"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {f === "PENDING" && (
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-400" />
            )}
            {f === "DONE" && (
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-400" />
            )}
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : items.length === 0 ? (
        <p className="rounded border bg-white p-8 text-center text-sm text-gray-400">
          {filter === "PENDING" ? "답변 대기 중인 문의가 없습니다."
            : filter === "DONE" ? "답변 완료된 문의가 없습니다."
            : "문의사항이 없습니다."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((inq) => (
            <li
              key={inq.id}
              className={[
                "rounded border bg-white p-4 shadow-sm",
                inq.answered
                  ? "border-l-4 border-l-green-400"
                  : "border-l-4 border-l-orange-400",
              ].join(" ")}
            >
              {/* 문의 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {inq.secret && <span className="text-xs text-gray-400">🔒</span>}
                    <h2 className="text-sm font-semibold">{inq.title}</h2>
                    {inq.answered ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        답변완료
                      </span>
                    ) : (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                        답변대기
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {inq.writer ?? "-"}
                    {inq.regDate && <span className="ml-2">{inq.regDate.slice(0, 10)}</span>}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(inq.id)}
                  className="shrink-0 rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                >
                  삭제
                </button>
              </div>

              {/* 문의 내용 */}
              <p className="mt-2 rounded bg-gray-50 p-3 text-sm whitespace-pre-wrap text-gray-700">
                {inq.content}
              </p>

              {/* 기존 답변 */}
              {inq.replies && inq.replies.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500">등록된 답변</p>
                  {inq.replies.map((r) => (
                    <div key={r.id} className="rounded border border-green-200 bg-green-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-green-700">
                          {r.replier ?? "관리자"}
                        </span>
                        {r.regDate && (
                          <span className="text-xs text-gray-400">{r.regDate.slice(0, 10)}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700">{r.replyText}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 답변 입력 */}
              <div className="mt-3">
                {!replyOpen[inq.id] ? (
                  <button
                    onClick={() => setReplyOpen((prev) => ({ ...prev, [inq.id]: true }))}
                    className={`text-xs font-medium ${
                      inq.answered
                        ? "text-gray-400 hover:text-gray-600"
                        : "text-brand-600 hover:text-brand-700"
                    }`}
                  >
                    {inq.answered ? "+ 추가 답변 작성" : "+ 답변 작성"}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <textarea
                      rows={3}
                      placeholder="답변 내용을 입력하세요..."
                      value={replyText[inq.id] ?? ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({ ...prev, [inq.id]: e.target.value }))
                      }
                      className="flex-1 rounded border px-3 py-2 text-sm"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReply(inq.id)}
                        disabled={!replyText[inq.id]?.trim()}
                        className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-40"
                      >
                        등록
                      </button>
                      <button
                        onClick={() => {
                          setReplyOpen((prev) => ({ ...prev, [inq.id]: false }));
                          setReplyText((prev) => ({ ...prev, [inq.id]: "" }));
                        }}
                        className="rounded border px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={[
                "rounded border px-3 py-1 text-sm",
                i === page
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </main>
  );
}

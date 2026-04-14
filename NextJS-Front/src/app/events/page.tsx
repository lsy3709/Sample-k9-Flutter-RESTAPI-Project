"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { api, PageResponse } from "@/lib/api";
import { LibraryEvent } from "@/types/event";
import { useAuth } from "@/lib/auth-context";

const PAGE_SIZE = 9;

export default function EventsPage() {
  const { member } = useAuth();
  const [events, setEvents] = useState<LibraryEvent[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get<PageResponse<LibraryEvent>>("/event", {
          params: { page, size: PAGE_SIZE },
        });
        if (!cancelled) {
          setEvents(res.data.content ?? []);
          setTotalPages(res.data.totalPages ?? 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, tick]);

  const handleApply = async (id: number) => {
    if (!member) {
      alert("로그인이 필요합니다.");
      return;
    }
    setMsg(null);
    try {
      // memberId 는 @RequestParam — body 가 아닌 쿼리 파라미터로 전송
      await api.post(`/event/${id}/apply`, null, {
        params: { memberId: member.id },
      });
      setMsg("신청이 완료되었습니다.");
      setTick((t) => t + 1);
    } catch (err: unknown) {
      let m = "신청 실패";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        if (d?.message) m = d.message;
      }
      setMsg(m);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">🎉 도서관 행사</h1>

      {msg && (
        <p className="mb-4 rounded bg-blue-50 p-3 text-sm text-blue-700">
          {msg}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500">등록된 행사가 없습니다.</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <li key={ev.id} className="rounded border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  {ev.category && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                      {ev.category}
                    </span>
                  )}
                  <h2 className="truncate font-semibold">{ev.title}</h2>
                </div>
                {ev.place && (
                  <p className="mt-1 text-sm text-gray-600">📍 {ev.place}</p>
                )}
                {ev.maxParticipants != null && (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      ev.remainingSlots === 0
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    신청 {ev.currentParticipants ?? 0} / {ev.maxParticipants}명
                    {ev.remainingSlots === 0 && " (마감)"}
                  </p>
                )}
                {ev.content && (
                  <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                    {ev.content}
                  </p>
                )}
                <button
                  onClick={() => handleApply(ev.id)}
                  disabled={ev.remainingSlots === 0}
                  className="mt-3 w-full rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {ev.remainingSlots === 0 ? "마감" : "신청"}
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

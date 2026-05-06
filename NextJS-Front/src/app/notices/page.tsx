"use client";

/**
 * Notice list page.
 * Displays paged notices and visually highlights pinned items.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, PageResponse } from "@/lib/api";
import { Notice } from "@/types/notice";

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<PageResponse<Notice>>("/notice", {
          params: { page, size: 10 },
        });
        setNotices(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "공지 로딩 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">📢 공지사항</h1>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <ul className="space-y-2">
          {notices.length === 0 ? (
            <li className="text-gray-500">등록된 공지가 없습니다.</li>
          ) : (
            notices.map((n) => (
              <li
                key={n.id}
                className={`rounded border p-4 shadow-sm ${
                  n.topFixed ? "border-amber-300 bg-amber-50" : "bg-white"
                }`}
              >
                <Link href={`/notices/${n.id}`} className="block">
                  <div className="flex items-center gap-2">
                    {n.topFixed && (
                      <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        공지
                      </span>
                    )}
                    <h2 className="font-semibold">{n.title}</h2>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {n.writer ?? "관리자"} · {n.regDate ?? ""}
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}

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
    </main>
  );
}

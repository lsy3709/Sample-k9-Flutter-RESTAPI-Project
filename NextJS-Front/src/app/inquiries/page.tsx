"use client";

/**
 * Inquiry board list page.
 * Masks secret posts unless the current user is the owner or an admin.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, PageResponse } from "@/lib/api";
import { Inquiry } from "@/types/inquiry";
import { useAuth } from "@/lib/auth-context";

export default function InquiriesPage() {
  const { member } = useAuth();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<PageResponse<Inquiry>>("/inquiry", {
          params: { page, size: 10 },
        });
        setItems(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const canView = (inq: Inquiry) =>
    !inq.secret ||
    (member && (inq.memberId === member.id || member.role?.includes("ADMIN")));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">💬 문의</h1>
        <Link
          href="/inquiries/new"
          className="rounded bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700"
        >
          문의 작성
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">등록된 문의가 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((inq) => (
            <li
              key={inq.id}
              className="rounded border bg-white p-4 shadow-sm"
            >
              {canView(inq) ? (
                <Link href={`/inquiries/${inq.id}`} className="block">
                  <div className="flex items-center gap-2">
                    {inq.secret && <span className="text-xs">🔒</span>}
                    <h2 className="font-semibold">{inq.title}</h2>
                    {inq.answered && (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        답변 완료
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {inq.writer ?? "-"} · {inq.regDate ?? ""}
                  </p>
                </Link>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>🔒</span>
                    <span>비밀글입니다</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {inq.writer ?? "-"} · {inq.regDate ?? ""}
                  </p>
                </div>
              )}
            </li>
          ))}
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

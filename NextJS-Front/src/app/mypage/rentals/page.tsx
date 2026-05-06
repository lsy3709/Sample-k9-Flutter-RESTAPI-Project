"use client";

/**
 * Member rental history page.
 * Supports return and extend actions for active rentals.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Protected from "@/components/Protected";
import { api, PageResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Rental } from "@/types/rental";

export default function MyRentalsPage() {
  return (
    <Protected>
      <MyRentalsInner />
    </Protected>
  );
}

function MyRentalsInner() {
  const { member } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchRentals = useCallback(async () => {
    if (!member) return;
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Rental>>("/rental", {
        params: { memberId: member.id, page, size: 10 },
      });
      setRentals(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }, [member, page]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  const handleReturn = async (id: number) => {
    if (!confirm("반납 처리하시겠습니까?")) return;
    try {
      await api.put(`/rental/${id}/return`);
      setMsg("반납이 완료되었습니다.");
      fetchRentals();
    } catch (err: unknown) {
      let m = "반납 실패";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        if (d?.message) m = d.message;
      }
      setMsg(m);
    }
  };

  const handleExtend = async (id: number) => {
    try {
      await api.put(`/rental/${id}/extend`);
      setMsg("대여 기간이 연장되었습니다.");
      fetchRentals();
    } catch (err: unknown) {
      let m = "연장 실패";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        if (d?.message) m = d.message;
      }
      setMsg(m);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 대여 이력</h1>
        <Link href="/mypage" className="text-sm text-brand-600">
          ← 마이페이지
        </Link>
      </div>

      {msg && (
        <p className="mb-4 rounded bg-blue-50 p-3 text-sm text-blue-700">
          {msg}
        </p>
      )}
      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : rentals.length === 0 ? (
        <p className="text-gray-500">대여 이력이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {rentals.map((r) => (
            <li
              key={r.id}
              className="rounded border bg-white p-4 shadow-sm"
            >
              <p className="font-semibold">{r.bookTitle}</p>
              <p className="text-sm text-gray-600">{r.bookAuthor}</p>
              <p className="mt-1 text-xs text-gray-500">
                상태: {r.status ?? "-"}
                {r.overdue && (
                  <span className="ml-2 text-red-600">⚠️ 연체</span>
                )}
              </p>
              {(r.rentalDate || r.dueDate) && (
                <p className="text-xs text-gray-400">
                  대여일: {r.rentalDate ?? "-"} / 반납기한: {r.dueDate ?? "-"}
                </p>
              )}
              {r.status !== "RETURNED" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleReturn(r.id)}
                    className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    반납
                  </button>
                  <button
                    onClick={() => handleExtend(r.id)}
                    className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    연장
                  </button>
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

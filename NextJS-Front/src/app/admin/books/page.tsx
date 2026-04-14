"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import Protected from "@/components/Protected";
import { api, PageResponse } from "@/lib/api";
import { Book, BookStatus, BOOK_STATUS_LABEL, BOOK_STATUS_COLOR } from "@/types/book";
import { Rental } from "@/types/rental";

export default function AdminBooksPage() {
  return (
    <Protected requireRole="ADMIN">
      <Inner />
    </Protected>
  );
}

// ────────────────────────────────────────────────────────────
// 탭 타입
// ────────────────────────────────────────────────────────────
type Tab = "books" | "rentals";

function Inner() {
  const [tab, setTab] = useState<Tab>("books");
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">도서 관리</h1>
        <Link href="/admin" className="text-sm text-brand-600">← 대시보드</Link>
      </div>

      {msg && (
        <p className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-700">{msg}</p>
      )}

      {/* 탭 */}
      <div className="mb-4 flex gap-1 border-b">
        {(["books", "rentals"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-brand-600 text-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "books" ? "📚 도서 목록" : "📋 대여 관리"}
          </button>
        ))}
      </div>

      {tab === "books" && <BooksTab setMsg={setMsg} />}
      {tab === "rentals" && <RentalsTab setMsg={setMsg} />}
    </main>
  );
}

// ────────────────────────────────────────────────────────────
// 도서 목록 탭
// ────────────────────────────────────────────────────────────
function BooksTab({ setMsg }: { setMsg: (m: string) => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editBook, setEditBook] = useState<Book | null>(null);
  // 행별 임시 선택 상태 (select 변경 후 적용 버튼 클릭 전)
  const [pendingStatus, setPendingStatus] = useState<Record<number, BookStatus>>({});

  // 등록 폼 상태
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [isbn, setIsbn] = useState("");
  const [description, setDescription] = useState("");

  const fetchBooks = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Book>>("/book", {
        params: { page: p, size: 20 },
      });
      setBooks(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBooks(page); }, [fetchBooks, page]);

  // 도서 등록
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/book", {
        bookTitle, author,
        publisher: publisher || undefined,
        isbn: isbn || undefined,
        description: description || undefined,
      });
      setMsg("도서가 등록되었습니다.");
      setBookTitle(""); setAuthor(""); setPublisher(""); setIsbn(""); setDescription("");
      fetchBooks(0); setPage(0);
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "등록 실패"
        : "등록 실패");
    }
  };

  // 도서 수정
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editBook) return;
    try {
      await api.put(`/book/${editBook.id}`, {
        bookTitle: editBook.bookTitle,
        author: editBook.author,
        publisher: editBook.publisher,
        description: editBook.description,
      });
      setMsg("도서 정보가 수정되었습니다.");
      setEditBook(null);
      fetchBooks(page);
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "수정 실패"
        : "수정 실패");
    }
  };

  // 상태 변경
  const handleStatusChange = async (id: number, status: BookStatus | undefined) => {
    if (!status) return;
    try {
      await api.patch(`/book/${id}/status`, { status });
      setMsg(`상태가 "${BOOK_STATUS_LABEL[status]}"로 변경되었습니다.`);
      fetchBooks(page);
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "상태 변경 실패"
        : "상태 변경 실패");
    }
  };

  // 도서 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까? 대여 중인 도서는 삭제할 수 없습니다.")) return;
    try {
      await api.delete(`/book/${id}`);
      setMsg("삭제되었습니다.");
      fetchBooks(page);
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "삭제 실패"
        : "삭제 실패");
    }
  };

  return (
    <>
      {/* 도서 등록 폼 */}
      <details className="mb-4 rounded border bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-brand-600">
          + 새 도서 등록
        </summary>
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2"
        >
          <input required placeholder="도서명" value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="rounded border px-3 py-2" />
          <input required placeholder="저자" value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="rounded border px-3 py-2" />
          <input placeholder="출판사" value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="rounded border px-3 py-2" />
          <input placeholder="ISBN" value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            className="rounded border px-3 py-2" />
          <textarea placeholder="설명" value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2} className="col-span-full rounded border px-3 py-2" />
          <button type="submit"
            className="col-span-full rounded bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700">
            등록
          </button>
        </form>
      </details>

      {/* 수정 모달 */}
      {editBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-bold">도서 정보 수정</h2>
            <div className="space-y-2">
              <input required placeholder="도서명" value={editBook.bookTitle}
                onChange={(e) => setEditBook({ ...editBook, bookTitle: e.target.value })}
                className="w-full rounded border px-3 py-2" />
              <input required placeholder="저자" value={editBook.author}
                onChange={(e) => setEditBook({ ...editBook, author: e.target.value })}
                className="w-full rounded border px-3 py-2" />
              <input placeholder="출판사" value={editBook.publisher ?? ""}
                onChange={(e) => setEditBook({ ...editBook, publisher: e.target.value })}
                className="w-full rounded border px-3 py-2" />
              <textarea placeholder="설명" value={editBook.description ?? ""}
                onChange={(e) => setEditBook({ ...editBook, description: e.target.value })}
                rows={3} className="w-full rounded border px-3 py-2" />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit"
                className="flex-1 rounded bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700">
                저장
              </button>
              <button type="button" onClick={() => setEditBook(null)}
                className="flex-1 rounded border py-2 text-gray-600 hover:bg-gray-50">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 도서 목록 테이블 */}
      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">도서명</th>
                  <th className="p-2">저자</th>
                  <th className="p-2">출판사</th>
                  <th className="p-2">상태</th>
                  <th className="p-2 min-w-[200px]">동작</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 text-gray-400">{b.id}</td>
                    <td className="p-2 font-medium">{b.bookTitle}</td>
                    <td className="p-2">{b.author}</td>
                    <td className="p-2 text-gray-500">{b.publisher ?? "-"}</td>
                    <td className="p-2">
                      {b.status && (
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${BOOK_STATUS_COLOR[b.status]}`}>
                          {BOOK_STATUS_LABEL[b.status]}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {/* 수정 */}
                        <button onClick={() => setEditBook(b)}
                          className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50">
                          수정
                        </button>
                        {/* 상태 변경 */}
                        <select
                          value={pendingStatus[b.id] ?? b.status ?? ""}
                          onChange={(e) =>
                            setPendingStatus((prev) => ({
                              ...prev,
                              [b.id]: e.target.value as BookStatus,
                            }))
                          }
                          className="rounded border px-1 py-0.5 text-xs text-gray-600"
                        >
                          <option value="" disabled>상태변경</option>
                          {(["AVAILABLE", "RENTED", "RESERVED", "LOST"] as BookStatus[]).map((s) => (
                            <option key={s} value={s}>{BOOK_STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                        {/* 적용 버튼: 현재 상태와 다를 때만 활성화 */}
                        {pendingStatus[b.id] && pendingStatus[b.id] !== b.status && (
                          <button
                            onClick={() => {
                              handleStatusChange(b.id, pendingStatus[b.id]);
                              setPendingStatus((prev) => {
                                const next = { ...prev };
                                delete next[b.id];
                                return next;
                              });
                            }}
                            className="rounded border border-brand-600 px-2 py-0.5 text-xs text-brand-600 hover:bg-brand-50"
                          >
                            적용
                          </button>
                        )}
                        {/* 삭제 */}
                        <button onClick={() => handleDelete(b.id)}
                          className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border px-3 py-1 disabled:opacity-40">이전</button>
              <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40">다음</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────
// 대여 관리 탭
// ────────────────────────────────────────────────────────────
const RENTAL_STATUS_LABEL: Record<string, string> = {
  RENTING: "대여중",
  EXTENDED: "연장중",
  RETURNED: "반납완료",
  OVERDUE: "연체",
};
const RENTAL_STATUS_COLOR: Record<string, string> = {
  RENTING: "bg-blue-100 text-blue-700",
  EXTENDED: "bg-yellow-100 text-yellow-700",
  RETURNED: "bg-gray-100 text-gray-500",
  OVERDUE: "bg-red-100 text-red-600",
};

function RentalsTab({ setMsg }: { setMsg: (m: string) => void }) {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchRentals = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Rental>>("/rental/all", {
        params: { page: p, size: 20 },
      });
      setRentals(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRentals(page); }, [fetchRentals, page]);

  const handleReturn = async (id: number) => {
    if (!confirm("반납 처리하시겠습니까?")) return;
    try {
      await api.put(`/rental/${id}/return`);
      setMsg("반납 처리되었습니다.");
      fetchRentals(page);
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "반납 실패"
        : "반납 실패");
    }
  };

  const handleExtend = async (id: number) => {
    if (!confirm("7일 연장하시겠습니까?")) return;
    try {
      await api.put(`/rental/${id}/extend`);
      setMsg("7일 연장되었습니다.");
      fetchRentals(page);
    } catch (err: unknown) {
      setMsg(axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message ?? "연장 실패"
        : "연장 실패");
    }
  };

  const displayed = filter === "ALL"
    ? rentals
    : rentals.filter((r) => r.status === filter);

  const isActive = (r: Rental) =>
    r.status === "RENTING" || r.status === "EXTENDED" || r.status === "OVERDUE";

  return (
    <>
      {/* 상태 필터 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {["ALL", "RENTING", "EXTENDED", "OVERDUE", "RETURNED"].map((s) => (
          <button key={s}
            onClick={() => setFilter(s)}
            className={`rounded border px-3 py-1 text-xs font-medium transition ${
              filter === s
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}>
            {s === "ALL" ? "전체" : RENTAL_STATUS_LABEL[s] ?? s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : displayed.length === 0 ? (
        <p className="text-gray-400">대여 기록이 없습니다.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">회원</th>
                  <th className="p-2">도서명</th>
                  <th className="p-2">대여일</th>
                  <th className="p-2">반납기한</th>
                  <th className="p-2">상태</th>
                  <th className="p-2">동작</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 text-gray-400">{r.id}</td>
                    <td className="p-2">
                      <span className="font-medium">{r.memberName ?? "-"}</span>
                      {r.memberMid && (
                        <span className="ml-1 text-xs text-gray-400">({r.memberMid})</span>
                      )}
                    </td>
                    <td className="p-2">{r.bookTitle ?? "-"}</td>
                    <td className="p-2 text-xs text-gray-500">{r.rentalDate?.slice(0, 10) ?? "-"}</td>
                    <td className={`p-2 text-xs font-medium ${
                      r.overdue ? "text-red-600" : "text-gray-600"
                    }`}>
                      {r.dueDate?.slice(0, 10) ?? "-"}
                      {r.overdue && <span className="ml-1">(연체)</span>}
                    </td>
                    <td className="p-2">
                      {r.status && (
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                          RENTAL_STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-500"
                        }`}>
                          {RENTAL_STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {isActive(r) && (
                        <div className="flex gap-1">
                          <button onClick={() => handleReturn(r.id)}
                            className="rounded border border-green-300 px-2 py-0.5 text-xs text-green-700 hover:bg-green-50">
                            반납
                          </button>
                          <button onClick={() => handleExtend(r.id)}
                            className="rounded border border-yellow-300 px-2 py-0.5 text-xs text-yellow-700 hover:bg-yellow-50">
                            연장
                          </button>
                        </div>
                      )}
                      {r.status === "RETURNED" && (
                        <span className="text-xs text-gray-400">
                          {r.returnDate?.slice(0, 10)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border px-3 py-1 disabled:opacity-40">이전</button>
              <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40">다음</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

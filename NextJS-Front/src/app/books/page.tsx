"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { api, PageResponse } from "@/lib/api";
import { Book, BOOK_STATUS_LABEL, BOOK_STATUS_COLOR } from "@/types/book";

/**
 * 도서 목록 — GET /api/book?keyword=&page=&size=
 */
export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const size = 12;

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<PageResponse<Book>>("/book", {
        params: {
          keyword: submittedKeyword || undefined,
          page,
          size,
        },
      });
      setBooks(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "도서 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [submittedKeyword, page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSubmittedKeyword(keyword.trim());
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">📚 도서 목록</h1>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="도서명 / 저자 / 출판사 검색"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
        >
          검색
        </button>
      </form>

      {loading && <p className="text-gray-500">로딩 중...</p>}
      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.length === 0 ? (
              <li className="col-span-full text-gray-500">
                검색 결과가 없습니다.
              </li>
            ) : (
              books.map((book) => (
                <li
                  key={book.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <Link href={`/books/${book.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-lg font-semibold">
                        {book.bookTitle}
                      </h2>
                      {book.status && (
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${BOOK_STATUS_COLOR[book.status]}`}
                        >
                          {BOOK_STATUS_LABEL[book.status]}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{book.author}</p>
                    {book.publisher && (
                      <p className="mt-1 text-xs text-gray-400">
                        {book.publisher}
                      </p>
                    )}
                  </Link>
                </li>
              ))
            )}
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

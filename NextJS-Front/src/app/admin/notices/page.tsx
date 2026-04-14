"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import Protected from "@/components/Protected";
import { api, PageResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Notice } from "@/types/notice";

export default function AdminNoticesPage() {
  return (
    <Protected requireRole="ADMIN">
      <Inner />
    </Protected>
  );
}

function Inner() {
  const { member } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // 페이지네이션
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;

  // 검색
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 등록 폼
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topFixed, setTopFixed] = useState(false);

  // 수정 모달
  const [editNotice, setEditNotice] = useState<Notice | null>(null);

  // ── 목록 조회 ──────────────────────────────────────
  const fetchNotices = useCallback(async (p = 0, kw = "") => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: p, size: PAGE_SIZE };
      if (kw.trim()) params.keyword = kw.trim();
      const res = await api.get<PageResponse<Notice>>("/notice", { params });
      setNotices(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices(page, keyword);
  }, [fetchNotices, page, keyword]);

  // ── 검색 실행 ──────────────────────────────────────
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    setKeyword(searchInput);
  };

  const handleSearchReset = () => {
    setSearchInput("");
    setKeyword("");
    setPage(0);
  };

  // ── 등록 ──────────────────────────────────────────
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/notice", {
        title,
        content,
        writer: member?.mname ?? "관리자",
        topFixed,
      });
      setMsg("등록되었습니다.");
      setTitle("");
      setContent("");
      setTopFixed(false);
      fetchNotices(page, keyword);
    } catch (err: unknown) {
      setMsg(
        axios.isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ?? "등록 실패"
          : "등록 실패"
      );
    }
  };

  // ── 수정 저장 ──────────────────────────────────────
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editNotice) return;
    try {
      await api.put(`/notice/${editNotice.id}`, {
        title: editNotice.title,
        content: editNotice.content,
        writer: editNotice.writer,
        topFixed: editNotice.topFixed ?? false,
      });
      setMsg("수정되었습니다.");
      setEditNotice(null);
      fetchNotices(page, keyword);
    } catch (err: unknown) {
      setMsg(
        axios.isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message ?? "수정 실패"
          : "수정 실패"
      );
    }
  };

  // ── 삭제 ──────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await api.delete(`/notice/${id}`);
      setMsg("삭제되었습니다.");
      // 마지막 항목 삭제 시 이전 페이지로
      const newPage = notices.length === 1 && page > 0 ? page - 1 : page;
      setPage(newPage);
      fetchNotices(newPage, keyword);
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
        <h1 className="text-2xl font-bold">공지 관리</h1>
        <Link href="/admin" className="text-sm text-brand-600">
          ← 대시보드
        </Link>
      </div>

      {/* 메시지 */}
      {msg && (
        <p className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-700">
          {msg}
        </p>
      )}

      {/* 공지 등록 폼 */}
      <details className="mb-4 rounded border bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-brand-600">
          + 새 공지 등록
        </summary>
        <form onSubmit={handleCreate} className="space-y-2 p-4">
          <input
            required
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
          <textarea
            required
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full rounded border px-3 py-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={topFixed}
              onChange={(e) => setTopFixed(e.target.checked)}
            />
            상단 고정
          </label>
          <button
            type="submit"
            className="w-full rounded bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700"
          >
            공지 등록
          </button>
        </form>
      </details>

      {/* 검색 바 */}
      <form
        onSubmit={handleSearch}
        className="mb-4 flex gap-2"
      >
        <input
          type="text"
          placeholder="제목 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          검색
        </button>
        {keyword && (
          <button
            type="button"
            onClick={handleSearchReset}
            className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            초기화
          </button>
        )}
      </form>

      {/* 검색 중 안내 */}
      {keyword && (
        <p className="mb-2 text-sm text-gray-500">
          &quot;{keyword}&quot; 검색 결과
        </p>
      )}

      {/* 목록 */}
      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : notices.length === 0 ? (
        <p className="rounded border bg-white p-6 text-center text-sm text-gray-400">
          {keyword ? "검색 결과가 없습니다." : "등록된 공지사항이 없습니다."}
        </p>
      ) : (
        <ul className="space-y-2">
          {notices.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between rounded border bg-white p-3 shadow-sm"
            >
              <Link href={`/notices/${n.id}`} className="flex-1 truncate pr-2">
                {n.topFixed && (
                  <span className="mr-2 rounded bg-amber-200 px-2 py-0.5 text-xs text-amber-800">
                    공지
                  </span>
                )}
                <span className="text-sm">{n.title}</span>
                {n.regDate && (
                  <span className="ml-2 text-xs text-gray-400">
                    {n.regDate.slice(0, 10)}
                  </span>
                )}
              </Link>
              <div className="flex gap-1">
                {/* 수정 버튼 */}
                <button
                  onClick={() => setEditNotice(n)}
                  className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50"
                >
                  수정
                </button>
                {/* 삭제 버튼 */}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                >
                  삭제
                </button>
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
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`rounded border px-3 py-1 text-sm ${
                i === page
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
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

      {/* 수정 모달 */}
      {editNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-bold">공지 수정</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  제목
                </label>
                <input
                  required
                  value={editNotice.title}
                  onChange={(e) =>
                    setEditNotice({ ...editNotice, title: e.target.value })
                  }
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  내용
                </label>
                <textarea
                  required
                  rows={6}
                  value={editNotice.content}
                  onChange={(e) =>
                    setEditNotice({ ...editNotice, content: e.target.value })
                  }
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editNotice.topFixed ?? false}
                  onChange={(e) =>
                    setEditNotice({ ...editNotice, topFixed: e.target.checked })
                  }
                />
                상단 고정
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setEditNotice(null)}
                className="flex-1 rounded border py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

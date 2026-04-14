"use client";

import { useEffect, useState, FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import Protected from "@/components/Protected";
import { api, PageResponse } from "@/lib/api";
import { LibraryEvent } from "@/types/event";

export default function AdminEventsPage() {
  return (
    <Protected requireRole="ADMIN">
      <Inner />
    </Protected>
  );
}

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  OPEN: "신청가능",
  CLOSED: "마감",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-200 text-gray-500",
};

function Inner() {
  const [events, setEvents]       = useState<LibraryEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState<string | null>(null);

  // 페이지네이션
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 검색
  const [keyword, setKeyword]     = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 강제 재조회 트리거
  const [tick, setTick]           = useState(0);
  const reload = () => setTick((t) => t + 1);

  // 등록 폼
  const [newTitle, setNewTitle]               = useState("");
  const [newCategory, setNewCategory]         = useState("");
  const [newPlace, setNewPlace]               = useState("");
  const [newContent, setNewContent]           = useState("");
  const [newEventDate, setNewEventDate]       = useState("");
  const [newMaxParticipants, setNewMaxParticipants] = useState(20);

  // 수정 모달
  const [editEvent, setEditEvent] = useState<LibraryEvent | null>(null);

  // ── 목록 조회 ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page, size: PAGE_SIZE };
        if (keyword.trim()) params.keyword = keyword.trim();

        const res = await api.get<PageResponse<LibraryEvent>>("/event", { params });
        if (!cancelled) {
          setEvents(res.data.content ?? []);
          setTotalPages(res.data.totalPages ?? 0);
        }
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, keyword, tick]);

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

  // ── 행사 등록 ──────────────────────────────────────
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/event", {
        title: newTitle,
        category: newCategory || undefined,
        place: newPlace || undefined,
        content: newContent || undefined,
        eventDate: newEventDate || undefined,
        maxParticipants: newMaxParticipants,
      });
      setMsg("등록되었습니다.");
      setNewTitle(""); setNewCategory(""); setNewPlace("");
      setNewContent(""); setNewEventDate(""); setNewMaxParticipants(20);
      setPage(0);
      reload();
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
    if (!editEvent) return;
    try {
      await api.put(`/event/${editEvent.id}`, {
        title:           editEvent.title,
        category:        editEvent.category,
        place:           editEvent.place,
        content:         editEvent.content,
        eventDate:       editEvent.eventDate,
        maxParticipants: editEvent.maxParticipants,
        status:          editEvent.status,
      });
      setMsg("수정되었습니다.");
      setEditEvent(null);
      reload();
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
      await api.delete(`/event/${id}`);
      setMsg("삭제되었습니다.");
      if (events.length === 1 && page > 0) setPage((p) => p - 1);
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
    <main className="mx-auto max-w-5xl p-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">행사 관리</h1>
        <Link href="/admin" className="text-sm text-brand-600">← 대시보드</Link>
      </div>

      {/* 메시지 */}
      {msg && (
        <p className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-700">{msg}</p>
      )}

      {/* 행사 등록 폼 */}
      <details className="mb-4 rounded border bg-white shadow-sm">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-brand-600">
          + 새 행사 등록
        </summary>
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2"
        >
          <input required placeholder="행사명" value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="rounded border px-3 py-2 text-sm" />
          <input placeholder="카테고리 (예: 문화행사)" value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded border px-3 py-2 text-sm" />
          <input placeholder="장소" value={newPlace}
            onChange={(e) => setNewPlace(e.target.value)}
            className="rounded border px-3 py-2 text-sm" />
          <input type="date" placeholder="행사일" value={newEventDate}
            onChange={(e) => setNewEventDate(e.target.value)}
            className="rounded border px-3 py-2 text-sm" />
          <input type="number" min={1} placeholder="최대 인원"
            value={newMaxParticipants}
            onChange={(e) => setNewMaxParticipants(Number(e.target.value))}
            className="rounded border px-3 py-2 text-sm" />
          <textarea placeholder="내용" value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={2} className="col-span-full rounded border px-3 py-2 text-sm" />
          <button type="submit"
            className="col-span-full rounded bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700">
            행사 등록
          </button>
        </form>
      </details>

      {/* 검색 바 */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="행사명 또는 내용 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          검색
        </button>
        {keyword && (
          <button type="button" onClick={handleSearchReset}
            className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            초기화
          </button>
        )}
      </form>

      {keyword && (
        <p className="mb-2 text-sm text-gray-500">&quot;{keyword}&quot; 검색 결과</p>
      )}

      {/* 행사 목록 */}
      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : events.length === 0 ? (
        <p className="rounded border bg-white p-8 text-center text-sm text-gray-400">
          {keyword ? "검색 결과가 없습니다." : "등록된 행사가 없습니다."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="p-3">행사명</th>
                <th className="p-3">카테고리</th>
                <th className="p-3">행사일</th>
                <th className="p-3">장소</th>
                <th className="p-3">인원</th>
                <th className="p-3">상태</th>
                <th className="p-3">동작</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{ev.title}</td>
                  <td className="p-3 text-gray-500">{ev.category ?? "-"}</td>
                  <td className="p-3 text-gray-500">{ev.eventDate ?? "-"}</td>
                  <td className="p-3 text-gray-500">{ev.place ?? "-"}</td>
                  <td className="p-3 text-gray-500">
                    {ev.currentParticipants ?? 0} / {ev.maxParticipants ?? "-"}
                  </td>
                  <td className="p-3">
                    {ev.status && (
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[ev.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABEL[ev.status] ?? ev.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditEvent(ev)}
                        className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40">
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
            <button key={i} onClick={() => setPage(i)}
              className={[
                "rounded border px-3 py-1 text-sm",
                i === page
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}>
              {i + 1}
            </button>
          ))}
          <button disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40">
            다음
          </button>
        </div>
      )}

      {/* 수정 모달 */}
      {editEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-bold">행사 수정</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="col-span-full">
                <label className="mb-1 block text-xs font-medium text-gray-600">행사명 *</label>
                <input required value={editEvent.title}
                  onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">카테고리</label>
                <input value={editEvent.category ?? ""}
                  onChange={(e) => setEditEvent({ ...editEvent, category: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">행사일</label>
                <input type="date" value={editEvent.eventDate ?? ""}
                  onChange={(e) => setEditEvent({ ...editEvent, eventDate: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">장소</label>
                <input value={editEvent.place ?? ""}
                  onChange={(e) => setEditEvent({ ...editEvent, place: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">최대 인원</label>
                <input type="number" min={1} value={editEvent.maxParticipants ?? 20}
                  onChange={(e) => setEditEvent({ ...editEvent, maxParticipants: Number(e.target.value) })}
                  className="w-full rounded border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">상태</label>
                <select value={editEvent.status ?? "OPEN"}
                  onChange={(e) => setEditEvent({ ...editEvent, status: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm">
                  <option value="OPEN">신청가능</option>
                  <option value="CLOSED">마감</option>
                </select>
              </div>
              <div className="col-span-full">
                <label className="mb-1 block text-xs font-medium text-gray-600">내용</label>
                <textarea rows={4} value={editEvent.content ?? ""}
                  onChange={(e) => setEditEvent({ ...editEvent, content: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit"
                className="flex-1 rounded bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                저장
              </button>
              <button type="button" onClick={() => setEditEvent(null)}
                className="flex-1 rounded border py-2 text-sm text-gray-600 hover:bg-gray-50">
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

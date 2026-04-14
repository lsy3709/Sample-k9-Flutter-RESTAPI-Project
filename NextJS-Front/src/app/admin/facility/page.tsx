"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import Protected from "@/components/Protected";
import { api, PageResponse } from "@/lib/api";
import {
  Apply,
  ApplyStatus,
  APPLY_STATUS_LABEL,
  APPLY_STATUS_COLOR,
  FACILITY_TYPES,
} from "@/types/apply";

const PAGE_SIZE = 15;

export default function AdminFacilityPage() {
  return (
    <Protected requireRole="ADMIN">
      <Inner />
    </Protected>
  );
}

function Inner() {
  // ── 목록 상태 ──
  const [items, setItems] = useState<Apply[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // ── 검색 / 필터 ──
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState<ApplyStatus | "ALL">("ALL");
  const [filterFacility, setFilterFacility] = useState<string>("ALL");

  // ── 수정 모달 ──
  const [editTarget, setEditTarget] = useState<Apply | null>(null);
  const [editFacility, setEditFacility] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editParticipants, setEditParticipants] = useState(1);
  const [editStatus, setEditStatus] = useState<ApplyStatus>("PENDING");
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await api.get<PageResponse<Apply> | Apply[]>("/apply", {
          params: { page: p, size: PAGE_SIZE },
        });
        // Spring이 Page 또는 배열로 반환하는 경우 모두 처리
        if (Array.isArray(res.data)) {
          setItems(res.data);
          setTotalPages(1);
          setTotalElements(res.data.length);
        } else {
          setItems(res.data.content ?? []);
          setTotalPages(res.data.totalPages ?? 1);
          setTotalElements(res.data.totalElements ?? 0);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) setMsg(err.message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchItems(page);
  }, [fetchItems, page]);

  // 클라이언트 측 필터링
  const filtered = items.filter((a) => {
    const matchStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchFacility =
      filterFacility === "ALL" || a.facilityType === filterFacility;
    const matchName =
      !searchName ||
      (a.applicantName ?? "").toLowerCase().includes(searchName.toLowerCase()) ||
      (a.memberName ?? "").toLowerCase().includes(searchName.toLowerCase());
    return matchStatus && matchFacility && matchName;
  });

  // ── 승인 / 반려 / 삭제 ──
  const approve = async (id: number) => {
    try {
      await api.put(`/apply/${id}/approve`);
      setMsg("승인되었습니다.");
      fetchItems(page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setMsg(err.response?.data?.message ?? err.message);
    }
  };

  const reject = async (id: number) => {
    try {
      await api.put(`/apply/${id}/reject`);
      setMsg("반려되었습니다.");
      fetchItems(page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setMsg(err.response?.data?.message ?? err.message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await api.delete(`/apply/${id}`);
      setMsg("삭제되었습니다.");
      fetchItems(page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setMsg(err.response?.data?.message ?? err.message);
    }
  };

  // ── 수정 모달 열기 ──
  const openEdit = (a: Apply) => {
    setEditTarget(a);
    setEditFacility(a.facilityType ?? FACILITY_TYPES[0]);
    setEditDate(a.reserveDate ?? "");
    setEditPhone(a.phone ?? "");
    setEditParticipants(a.participants ?? 1);
    setEditStatus(a.status ?? "PENDING");
    setMsg(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await api.put(`/apply/${editTarget.id}`, {
        facilityType: editFacility,
        reserveDate: editDate,
        phone: editPhone,
        participants: editParticipants,
        status: editStatus,
      });
      setMsg("수정되었습니다.");
      setEditTarget(null);
      fetchItems(page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err))
        setMsg(err.response?.data?.message ?? "수정 실패");
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const s = status as ApplyStatus;
    const label = APPLY_STATUS_LABEL[s] ?? status;
    const cls = APPLY_STATUS_COLOR[s] ?? "rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600";
    return <span className={cls}>{label}</span>;
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏛️ 시설예약 관리</h1>
        <Link href="/admin" className="text-sm text-brand-600">
          ← 대시보드
        </Link>
      </div>

      {msg && (
        <p className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-700">{msg}</p>
      )}

      {/* 검색 / 필터 바 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm">
        {/* 신청자 검색 */}
        <input
          type="text"
          placeholder="신청자 이름 검색"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="rounded border px-3 py-1.5 text-sm w-44"
        />

        {/* 상태 필터 */}
        <div className="flex gap-1">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded px-3 py-1 text-xs font-medium border ${
                filterStatus === s
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s === "ALL" ? "전체" : APPLY_STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* 시설 종류 필터 */}
        <select
          value={filterFacility}
          onChange={(e) => setFilterFacility(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        >
          <option value="ALL">시설 전체</option>
          {FACILITY_TYPES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <span className="ml-auto text-xs text-gray-500">
          전체 {totalElements}건 · 필터 {filtered.length}건
        </span>
      </div>

      {/* 테이블 */}
      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">예약 신청이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">신청자</th>
                <th className="p-3">시설</th>
                <th className="p-3">예약일</th>
                <th className="p-3">인원</th>
                <th className="p-3">연락처</th>
                <th className="p-3">상태</th>
                <th className="p-3">동작</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-gray-400">{a.id}</td>
                  <td className="p-3 font-medium">
                    {a.applicantName ?? a.memberName ?? "-"}
                  </td>
                  <td className="p-3">{a.facilityType ?? "-"}</td>
                  <td className="p-3">{a.reserveDate ?? "-"}</td>
                  <td className="p-3 text-center">{a.participants ?? "-"}</td>
                  <td className="p-3">{a.phone ?? "-"}</td>
                  <td className="p-3">{statusBadge(a.status ?? "PENDING")}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => openEdit(a)}
                        className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50"
                      >
                        수정
                      </button>
                      {a.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => approve(a.id)}
                            className="rounded border border-green-300 px-2 py-0.5 text-xs text-green-700 hover:bg-green-50"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => reject(a.id)}
                            className="rounded border border-yellow-300 px-2 py-0.5 text-xs text-yellow-700 hover:bg-yellow-50"
                          >
                            반려
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => remove(a.id)}
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
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page + 1} / {totalPages}
          </span>
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
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">예약 수정 (ID: {editTarget.id})</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium">시설 종류</span>
                <select
                  value={editFacility}
                  onChange={(e) => setEditFacility(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2"
                >
                  {FACILITY_TYPES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">예약 날짜</span>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">연락처</span>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  인원 <span className="text-brand-600">{editParticipants}명</span>
                </span>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditParticipants((n) => Math.max(1, n - 1))}
                    className="rounded border px-3 py-1"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold">{editParticipants}</span>
                  <button
                    type="button"
                    onClick={() => setEditParticipants((n) => Math.min(10, n + 1))}
                    className="rounded border px-3 py-1"
                  >
                    +
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium">상태</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ApplyStatus)}
                  className="mt-1 w-full rounded border px-3 py-2"
                >
                  {(["PENDING", "APPROVED", "REJECTED"] as ApplyStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {APPLY_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-gray-400"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

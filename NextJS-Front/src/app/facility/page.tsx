"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import axios from "axios";
import Protected from "@/components/Protected";
import { api, PageResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  Apply,
  ApplyStatus,
  APPLY_STATUS_LABEL,
  APPLY_STATUS_COLOR,
  FACILITY_TYPES,
} from "@/types/apply";

const PAGE_SIZE = 10;

// 오늘 기준 +1일 ~ +60일 범위 반환
function dateRange(): { min: string; max: string } {
  const now = new Date();
  const min = new Date(now);
  min.setDate(min.getDate() + 1);
  const max = new Date(now);
  max.setDate(max.getDate() + 60);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { min: fmt(min), max: fmt(max) };
}

export default function FacilityPage() {
  return (
    <Protected>
      <FacilityInner />
    </Protected>
  );
}

function FacilityInner() {
  const { member } = useAuth();
  const { min: dateMin, max: dateMax } = dateRange();

  // ── 예약 신청 폼 ──
  const [facilityType, setFacilityType] = useState<string>(FACILITY_TYPES[0]);
  const [reserveDate, setReserveDate] = useState(dateMin);
  const [applicantName, setApplicantName] = useState("");
  const [phone, setPhone] = useState("");
  const [participants, setParticipants] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  // ── 내 예약 현황 ──
  const [applies, setApplies] = useState<Apply[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ApplyStatus | "ALL">("ALL");
  const [searchDate, setSearchDate] = useState("");
  const [listLoading, setListLoading] = useState(false);

  // 이름 초기화
  useEffect(() => {
    if (member?.mname) setApplicantName(member.mname);
  }, [member]);

  const fetchApplies = useCallback(
    async (p: number) => {
      if (!member) return;
      setListLoading(true);
      try {
        const res = await api.get<PageResponse<Apply>>("/apply/my", {
          params: { memberId: member.id, page: p, size: PAGE_SIZE },
        });
        setApplies(res.data.content ?? []);
        setTotalPages(res.data.totalPages ?? 0);
      } finally {
        setListLoading(false);
      }
    },
    [member],
  );

  useEffect(() => {
    fetchApplies(page);
  }, [fetchApplies, page]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSubmitting(true);
    setFormMsg(null);
    try {
      await api.post(
        "/apply",
        { facilityType, reserveDate, applicantName, phone, participants },
        { params: { memberId: member.id } },
      );
      setFormMsg("예약 신청이 완료되었습니다.");
      setPage(0);
      fetchApplies(0);
    } catch (err: unknown) {
      let m = "신청 실패";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        if (d?.message) m = d.message;
      }
      setFormMsg(m);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("예약을 취소하시겠습니까?")) return;
    try {
      await api.delete(`/apply/${id}`);
      fetchApplies(page);
    } catch {
      alert("취소 실패");
    }
  };

  // 필터링 (클라이언트)
  const filtered = applies.filter((a) => {
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchDate = !searchDate || a.reserveDate === searchDate;
    return matchStatus && matchDate;
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">🏢 시설 예약</h1>

      {/* 예약 신청 폼 */}
      <section className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">예약 신청</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">시설 종류</span>
              <select
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value)}
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
                value={reserveDate}
                min={dateMin}
                max={dateMax}
                onChange={(e) => setReserveDate(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">신청자 이름</span>
              <input
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">연락처</span>
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">
              참가 인원 <span className="text-brand-600">{participants}명</span>
            </span>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setParticipants((n) => Math.max(1, n - 1))}
                className="rounded border px-3 py-1 text-lg"
              >
                −
              </button>
              <span className="w-8 text-center font-semibold">{participants}</span>
              <button
                type="button"
                onClick={() => setParticipants((n) => Math.min(10, n + 1))}
                className="rounded border px-3 py-1 text-lg"
              >
                +
              </button>
              <span className="text-xs text-gray-500">(최대 10명)</span>
            </div>
          </label>

          {formMsg && (
            <p
              className={`rounded p-3 text-sm ${
                formMsg.includes("완료")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {formMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:bg-gray-400"
          >
            {submitting ? "신청 중..." : "예약 신청"}
          </button>
        </form>
      </section>

      {/* 내 예약 현황 */}
      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">내 예약 현황</h2>

        {/* 검색 / 필터 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded px-3 py-1 text-xs font-medium border ${
                  statusFilter === s
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {s === "ALL" ? "전체" : APPLY_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
            placeholder="날짜 검색"
          />
          {searchDate && (
            <button
              onClick={() => setSearchDate("")}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              초기화
            </button>
          )}
        </div>

        {listLoading ? (
          <p className="text-gray-500">로딩 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">예약 내역이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.facilityType}</span>
                    <span className={APPLY_STATUS_COLOR[a.status]}>
                      {APPLY_STATUS_LABEL[a.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    📅 {a.reserveDate} · 👤 {a.applicantName} · 👥 {a.participants}명
                  </p>
                  <p className="text-xs text-gray-500">📞 {a.phone}</p>
                </div>
                {a.status === "PENDING" && (
                  <button
                    onClick={() => handleCancel(a.id)}
                    className="ml-4 rounded border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    취소
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

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
      </section>
    </main>
  );
}

"use client";

/**
 * Admin member management page.
 * Loads the full member list and supports destructive member removal.
 */
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Protected from "@/components/Protected";
import { api } from "@/lib/api";
import { Member } from "@/types/member";

export default function AdminMembersPage() {
  return (
    <Protected requireRole="ADMIN">
      <Inner />
    </Protected>
  );
}

function Inner() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Member[]>("/member/list");
      setMembers(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 관련 데이터가 함께 처리됩니다.")) return;
    try {
      await api.delete(`/member/${id}`);
      setMsg("삭제되었습니다.");
      fetchMembers();
    } catch (err: unknown) {
      let m = "삭제 실패";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        if (d?.message) m = d.message;
      }
      setMsg(m);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <Link href="/admin" className="text-sm text-brand-600">
          ← 대시보드
        </Link>
      </div>

      {msg && (
        <p className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-700">
          {msg}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : (
        <table className="w-full rounded border bg-white text-sm shadow-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">아이디</th>
              <th className="p-2">이름</th>
              <th className="p-2">이메일</th>
              <th className="p-2">권한</th>
              <th className="p-2">동작</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2">{m.id}</td>
                <td className="p-2">{m.mid}</td>
                <td className="p-2">{m.mname}</td>
                <td className="p-2">{m.email ?? "-"}</td>
                <td className="p-2">{m.role ?? "-"}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

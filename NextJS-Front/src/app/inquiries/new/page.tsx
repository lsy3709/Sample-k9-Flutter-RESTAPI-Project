"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Protected from "@/components/Protected";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function NewInquiryPage() {
  return (
    <Protected>
      <NewInquiryInner />
    </Protected>
  );
}

function NewInquiryInner() {
  const router = useRouter();
  const { member } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [secret, setSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(
        "/inquiry",
        { title, content, writer: member.mname, secret },
        { params: { memberId: member.id } },
      );
      router.push("/inquiries");
    } catch (err: unknown) {
      let m = "등록 실패";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        if (d?.message) m = d.message;
      }
      setError(m);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">문의 작성</h1>
      <form onSubmit={handleSubmit} className="space-y-3 rounded bg-white p-6 shadow">
        <label className="block">
          <span className="text-sm font-medium">제목</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">내용</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={secret}
            onChange={(e) => setSecret(e.target.checked)}
          />
          🔒 비밀글 (본인/관리자만 열람)
        </label>

        {error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:bg-gray-400"
        >
          {submitting ? "등록 중..." : "등록"}
        </button>
      </form>
    </main>
  );
}

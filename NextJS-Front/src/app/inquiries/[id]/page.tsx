"use client";

/**
 * Inquiry detail page.
 * Renders the inquiry body and any admin replies returned by the API.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Inquiry } from "@/types/inquiry";

export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const [inq, setInq] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Inquiry>(`/inquiry/${params.id}`);
        setInq(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "로딩 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) return <main className="p-6 text-gray-500">로딩 중...</main>;
  if (error || !inq)
    return (
      <main className="p-6">
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">
          {error ?? "문의를 찾을 수 없습니다."}
        </p>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/inquiries" className="text-sm text-brand-600">
        ← 문의 목록
      </Link>
      <article className="mt-4 rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-2">
          {inq.secret && <span className="text-xs">🔒</span>}
          <h1 className="text-2xl font-bold">{inq.title}</h1>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {inq.writer ?? "-"} · {inq.regDate ?? ""}
        </p>
        <hr className="my-4" />
        <div className="whitespace-pre-wrap text-sm text-gray-800">
          {inq.content}
        </div>

        {inq.replies && inq.replies.length > 0 && (
          <section className="mt-6 space-y-2 border-t pt-4">
            <h2 className="font-semibold">답변</h2>
            {inq.replies.map((r) => (
              <div
                key={r.id}
                className="rounded border border-blue-100 bg-blue-50 p-3"
              >
                <p className="whitespace-pre-wrap text-sm">{r.replyText}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {r.replier ?? "관리자"} · {r.regDate ?? ""}
                </p>
              </div>
            ))}
          </section>
        )}
      </article>
    </main>
  );
}

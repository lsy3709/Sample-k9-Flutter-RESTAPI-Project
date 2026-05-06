"use client";

/**
 * Notice detail page.
 * Renders body content and attached images for a single notice.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Notice } from "@/types/notice";

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Notice>(`/notice/${params.id}`);
        setNotice(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "로딩 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) return <main className="p-6 text-gray-500">로딩 중...</main>;
  if (error || !notice)
    return (
      <main className="p-6">
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">
          {error ?? "공지를 찾을 수 없습니다."}
        </p>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/notices" className="text-sm text-brand-600">
        ← 공지 목록
      </Link>
      <article className="mt-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">{notice.title}</h1>
        <p className="mt-1 text-xs text-gray-500">
          {notice.writer ?? "관리자"} · {notice.regDate ?? ""}
        </p>
        <hr className="my-4" />
        <div className="whitespace-pre-wrap text-sm text-gray-800">
          {notice.content}
        </div>
        {notice.images && notice.images.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {notice.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.uuid}
                src={`/api/notice/image/${img.uuid}_${img.fileName}`}
                alt={img.fileName}
                className="rounded border"
              />
            ))}
          </div>
        )}
      </article>
    </main>
  );
}

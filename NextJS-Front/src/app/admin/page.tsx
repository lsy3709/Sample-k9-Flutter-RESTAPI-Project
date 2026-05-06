"use client";

/**
 * Admin dashboard route.
 * Provides entry links to each admin feature area.
 */
import Link from "next/link";
import Protected from "@/components/Protected";

const menus = [
  { href: "/admin/members", label: "👥 회원 관리" },
  { href: "/admin/books", label: "📚 도서 관리" },
  { href: "/admin/notices", label: "📢 공지 관리" },
  { href: "/admin/inquiries", label: "💬 문의 답변" },
  { href: "/admin/events", label: "🎉 행사 관리" },
  { href: "/admin/facility", label: "🏛️ 시설예약 관리" },
];

export default function AdminDashboardPage() {
  return (
    <Protected requireRole="ADMIN">
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-2xl font-bold">관리자 대시보드</h1>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {menus.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className="block rounded-lg border bg-white p-6 text-center shadow-sm transition hover:shadow-md"
              >
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </Protected>
  );
}

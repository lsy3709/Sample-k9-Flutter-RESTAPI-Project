"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { member, loading, logout } = useAuth();
  const router = useRouter();
  const isAdmin = member?.role === "ADMIN" || member?.role === "ROLE_ADMIN";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          📚 부산도서관
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/books" className="hover:text-brand-600">
            도서
          </Link>
          <Link href="/notices" className="hover:text-brand-600">
            공지
          </Link>
          <Link href="/inquiries" className="hover:text-brand-600">
            문의
          </Link>
          <Link href="/events" className="hover:text-brand-600">
            행사
          </Link>
          <Link href="/facility" className="hover:text-brand-600">
            시설예약
          </Link>

          {!loading && member && (
            <>
              <Link href="/mypage" className="hover:text-brand-600">
                마이페이지
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                >
                  관리자
                </Link>
              )}
              <span className="hidden text-gray-500 sm:inline">
                {member.mname} 님
              </span>
              <button
                onClick={handleLogout}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
              >
                로그아웃
              </button>
            </>
          )}
          {!loading && !member && (
            <>
              <Link
                href="/login"
                className="rounded bg-brand-600 px-3 py-1 text-white hover:bg-brand-700"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded border border-brand-600 px-3 py-1 text-brand-600 hover:bg-brand-50"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

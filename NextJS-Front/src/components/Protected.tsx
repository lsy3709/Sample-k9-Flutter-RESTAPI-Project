"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface Props {
  children: ReactNode;
  /** "ADMIN" 권한 지정 시 관리자 여부를 체크하며, 미충족 시 접근을 제한합니다. */
  requireRole?: "ADMIN";
}

/**
 * 인증 가드 컴포넌트 역할 수행.
 * - 사용자가 미로그인 상태일 경우 `/login` 경로로 리다이렉트 처리합니다.
 * - requireRole="ADMIN" 속성이 지정된 경우 관리자 권한을 추가로 확인하고 권한 미달 시 홈(`/`)으로 리다이렉트합니다.
 */
export default function Protected({ children, requireRole }: Props) {
  const { member, loading } = useAuth();
  const router = useRouter();
  const isAdmin = member?.role === "ADMIN" || member?.role === "ROLE_ADMIN";

  useEffect(() => {
    if (loading) return;
    if (!member) {
      router.replace("/login");
      return;
    }
    if (requireRole === "ADMIN" && !isAdmin) {
      router.replace("/");
    }
  }, [loading, member, isAdmin, requireRole, router]);

  if (loading || !member || (requireRole === "ADMIN" && !isAdmin)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">확인 중...</p>
      </main>
    );
  }

  return <>{children}</>;
}

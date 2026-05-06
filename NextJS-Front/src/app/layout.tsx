import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "부산도서관 관리 시스템",
  description: "Next.js 웹 프론트 — 기존 Spring Boot 백엔드 연동",
};

/**
 * 애플리케이션의 최상위 레이아웃 컴포넌트입니다.
 * - 전역 스타일시트(globals.css)를 적용합니다.
 * - 애플리케이션 전체에 인증 상태(AuthProvider)를 제공합니다.
 * - 모든 페이지의 상단에 공통 네비게이션 바(Navbar)를 렌더링합니다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

"use client";

/**
 * Login page.
 * Exchanges credentials for JWT tokens and then loads member profile data.
 */
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MemberInfo } from "@/lib/auth";
import { AUTH_BASE_URL } from "@/constants/api";

/**
 * 로그인 페이지
 *
 * Spring Security APILoginFilter:
 *   POST {AUTH_BASE_URL}/generateToken  body: { mid, mpw }
 *   응답: { accessToken, refreshToken, profileImg? }
 * 이후 GET /api/member/me?mid={mid} 로 회원 상세 취득.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [mid, setMid] = useState("");
  const [mpw, setMpw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const tokenRes = await axios.post<{
        accessToken: string;
        refreshToken?: string;
        profileImg?: string;
      }>(`${AUTH_BASE_URL}/generateToken`, { mid, mpw }, { timeout: 10000 });

      const { accessToken, refreshToken, profileImg } = tokenRes.data;
      if (!accessToken) throw new Error("토큰을 받지 못했습니다.");

      const meRes = await api.get<MemberInfo>("/member/me", {
        params: { mid },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const member: MemberInfo = {
        ...meRes.data,
        profileImg: meRes.data.profileImg ?? profileImg,
      };

      login(accessToken, member, refreshToken);
      router.push("/");
    } catch (err: unknown) {
      let msg = "로그인 중 오류가 발생했습니다.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          msg = "아이디 또는 비밀번호가 올바르지 않습니다.";
        } else if (err.message) {
          msg = err.message;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-center text-2xl font-bold">로그인</h1>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            아이디
          </span>
          <input
            type="text"
            value={mid}
            onChange={(e) => setMid(e.target.value)}
            required
            autoComplete="username"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            비밀번호
          </span>
          <input
            type="password"
            value={mpw}
            onChange={(e) => setMpw(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </label>

        {error && (
          <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:bg-gray-400"
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>

        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <Link href="/" className="hover:underline">
            ← 홈으로
          </Link>
          <Link href="/signup" className="text-brand-600 hover:underline">
            회원가입
          </Link>
        </div>
      </form>
    </main>
  );
}

"use client";

/**
 * Signup page.
 * Checks duplicate member id/email and sends the final signup payload.
 */
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { api } from "@/lib/api";

/**
 * 회원가입 페이지
 *
 * POST /api/member/signup  body: MemberSignupDTO
 *   { mid, mpw, mpwConfirm, mname, email, region?, profileImageBase64? }
 * 중복 확인: GET /api/member/check-mid?mid=, /api/member/check-email?email=
 */
export default function SignupPage() {
  const router = useRouter();

  const [mid, setMid] = useState("");
  const [mpw, setMpw] = useState("");
  const [mpwConfirm, setMpwConfirm] = useState("");
  const [mname, setMname] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(
    null,
  );

  const [midChecked, setMidChecked] = useState<boolean | null>(null);
  const [emailChecked, setEmailChecked] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkMid = async () => {
    if (!mid) return;
    try {
      const res = await api.get<{ available: boolean }>("/member/check-mid", {
        params: { mid },
      });
      setMidChecked(res.data.available);
    } catch {
      setMidChecked(null);
      setError("아이디 확인 중 오류가 발생했습니다.");
    }
  };

  const checkEmail = async () => {
    if (!email) return;
    try {
      const res = await api.get<{ available: boolean }>(
        "/member/check-email",
        { params: { email } },
      );
      setEmailChecked(res.data.available);
    } catch {
      setEmailChecked(null);
      setError("이메일 확인 중 오류가 발생했습니다.");
    }
  };

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        setProfileImageBase64(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mpw !== mpwConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (midChecked === false) {
      setError("이미 사용 중인 아이디입니다.");
      return;
    }
    if (emailChecked === false) {
      setError("이미 사용 중인 이메일입니다.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/member/signup", {
        mid,
        mpw,
        mpwConfirm,
        mname,
        email,
        region: region || undefined,
        profileImageBase64: profileImageBase64 || undefined,
      });
      alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      router.push("/login");
    } catch (err: unknown) {
      let msg = "회원가입 중 오류가 발생했습니다.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        if (data?.message) msg = data.message;
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
        <h1 className="mb-6 text-center text-2xl font-bold">회원가입</h1>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            아이디
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={mid}
              onChange={(e) => {
                setMid(e.target.value);
                setMidChecked(null);
              }}
              required
              className="flex-1 rounded border border-gray-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={checkMid}
              className="rounded border border-brand-600 px-3 text-sm text-brand-600 hover:bg-brand-50"
            >
              중복확인
            </button>
          </div>
          {midChecked === true && (
            <p className="mt-1 text-xs text-green-600">사용 가능한 아이디</p>
          )}
          {midChecked === false && (
            <p className="mt-1 text-xs text-red-600">이미 사용 중인 아이디</p>
          )}
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            비밀번호
          </span>
          <input
            type="password"
            value={mpw}
            onChange={(e) => setMpw(e.target.value)}
            required
            minLength={4}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            비밀번호 확인
          </span>
          <input
            type="password"
            value={mpwConfirm}
            onChange={(e) => setMpwConfirm(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            이름
          </span>
          <input
            type="text"
            value={mname}
            onChange={(e) => setMname(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            이메일
          </span>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailChecked(null);
              }}
              required
              className="flex-1 rounded border border-gray-300 px-3 py-2"
            />
            <button
              type="button"
              onClick={checkEmail}
              className="rounded border border-brand-600 px-3 text-sm text-brand-600 hover:bg-brand-50"
            >
              중복확인
            </button>
          </div>
          {emailChecked === true && (
            <p className="mt-1 text-xs text-green-600">사용 가능한 이메일</p>
          )}
          {emailChecked === false && (
            <p className="mt-1 text-xs text-red-600">이미 사용 중인 이메일</p>
          )}
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            지역 (선택)
          </span>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            프로필 이미지 (선택)
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImage(f);
            }}
            className="w-full text-sm"
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
          {submitting ? "가입 중..." : "회원가입"}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            로그인
          </Link>
        </div>
      </form>
    </main>
  );
}

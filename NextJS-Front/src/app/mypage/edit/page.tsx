"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import Protected from "@/components/Protected";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { saveMember, MemberInfo } from "@/lib/auth";

export default function EditMyPage() {
  return (
    <Protected>
      <EditInner />
    </Protected>
  );
}

function EditInner() {
  const { member, token, login } = useAuth();
  const [mname, setMname] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(
    null,
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!member) return;
    setMname(member.mname);
    setEmail(member.email ?? "");
    setRegion(member.region ?? "");
  }, [member]);

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") {
        setProfileImageBase64(r.includes(",") ? r.split(",")[1] : r);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!member || !token) return;
    setSubmitting(true);
    setMsg(null);
    try {
      await api.put("/member/update", {
        id: member.id,
        mid: member.mid,
        mname,
        email,
        region,
      });
      let newProfileImg = member.profileImg;
      if (profileImageBase64) {
        // 서버가 저장된 UUID 파일명을 { profileImg: "xxx.jpg" } 로 반환
        const imgRes = await api.put<{ profileImg?: string }>("/member/profile-image", {
          mid: member.mid,
          base64Image: profileImageBase64,
        });
        newProfileImg = imgRes.data.profileImg ?? member.profileImg;
      }
      const updated: MemberInfo = {
        ...member,
        mname,
        email,
        region,
        profileImg: newProfileImg,
      };
      saveMember(updated);
      login(token, updated);
      setMsg("수정되었습니다.");
    } catch (err: unknown) {
      let m = "수정 실패";
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        if (d?.message) m = d.message;
      }
      setMsg(m);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 정보 수정</h1>
        <Link href="/mypage" className="text-sm text-brand-600">
          ← 마이페이지
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded bg-white p-6 shadow">
        <label className="block">
          <span className="text-sm font-medium">이름</span>
          <input
            value={mname}
            onChange={(e) => setMname(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">지역</span>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">프로필 이미지 변경</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImage(f);
            }}
            className="mt-1 w-full text-sm"
          />
        </label>

        {msg && (
          <p className="rounded bg-blue-50 p-3 text-sm text-blue-700">{msg}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:bg-gray-400"
        >
          {submitting ? "저장 중..." : "저장"}
        </button>
      </form>
    </main>
  );
}

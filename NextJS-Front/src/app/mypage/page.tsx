"use client";

import Link from "next/link";
import Protected from "@/components/Protected";
import { useAuth } from "@/lib/auth-context";
import { UPLOAD_BASE_URL } from "@/constants/api";

/** profileImg 필드 → 표시용 URL 변환
 *  - "data:..." 형식 → base64 그대로 사용 (편집 직후 미리보기)
 *  - UUID 파일명     → Spring /upload/{파일명} 경로로 변환
 */
function resolveProfileImg(profileImg: string): string {
  if (profileImg.startsWith("data:")) return profileImg;
  return `${UPLOAD_BASE_URL}/upload/${profileImg}`;
}

export default function MyPage() {
  return (
    <Protected>
      <MyPageInner />
    </Protected>
  );
}

function MyPageInner() {
  const { member } = useAuth();
  if (!member) return null;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">마이페이지</h1>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-4">
          {member.profileImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveProfileImg(member.profileImg)}
              alt={member.mname}
              className="h-20 w-20 rounded-full border object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-gray-500">
              없음
            </div>
          )}
          <div>
            <p className="text-lg font-semibold">{member.mname}</p>
            <p className="text-sm text-gray-600">{member.mid}</p>
            {member.email && (
              <p className="text-xs text-gray-500">{member.email}</p>
            )}
            {member.region && (
              <p className="text-xs text-gray-500">지역: {member.region}</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/mypage/rentals"
            className="rounded border p-4 hover:bg-gray-50"
          >
            📖 내 대여 이력
          </Link>
          <Link
            href="/mypage/edit"
            className="rounded border p-4 hover:bg-gray-50"
          >
            ✏️ 내 정보 수정
          </Link>
        </div>
      </div>
    </main>
  );
}

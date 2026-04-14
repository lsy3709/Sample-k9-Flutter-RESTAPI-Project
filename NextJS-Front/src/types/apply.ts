export type ApplyStatus = "PENDING" | "APPROVED" | "REJECTED";

export const APPLY_STATUS_LABEL: Record<ApplyStatus, string> = {
  PENDING: "대기중",
  APPROVED: "승인",
  REJECTED: "거절",
};

export const APPLY_STATUS_COLOR: Record<ApplyStatus, string> = {
  PENDING: "rounded px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700",
  APPROVED: "rounded px-2 py-0.5 text-xs bg-green-100 text-green-700",
  REJECTED: "rounded px-2 py-0.5 text-xs bg-red-100 text-red-700",
};

export const FACILITY_TYPES = ["열람실", "스터디룸", "회의실", "세미나실"] as const;
export type FacilityType = (typeof FACILITY_TYPES)[number];

export interface Apply {
  id: number;
  memberId: number;
  memberName?: string;
  applicantName: string;
  facilityType: string;
  phone: string;
  participants: number;
  reserveDate: string; // yyyy-MM-dd
  status: ApplyStatus;
  regDate?: string;
}

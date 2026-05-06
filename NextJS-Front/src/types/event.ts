/** 도서관에서 진행하는 행사 정보에 대한 타입 정의입니다 */
export interface LibraryEvent {
  id: number;
  category?: string;
  title: string;
  content?: string;
  eventDate?: string;   // yyyy-MM-dd
  place?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  remainingSlots?: number;
  status?: string;
  regDate?: string;     // yyyy-MM-dd HH:mm:ss
}

export interface EventApplication {
  id: number;
  eventId: number;
  eventTitle?: string;
  eventCategory?: string;
  eventPlace?: string;
  memberId?: number;
  memberName?: string;
  applyDate?: string;
  status?: string;
}

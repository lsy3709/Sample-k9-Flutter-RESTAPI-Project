/** 문의사항 게시판의 답변(Reply)에 대한 타입 정의입니다 */
export interface Reply {
  id: number;
  replyText: string;
  replier?: string;
  inquiryId: number;
  regDate?: string;
}

export interface Inquiry {
  id: number;
  title: string;
  content: string;
  writer?: string;
  memberId?: number;
  answered?: boolean;
  secret?: boolean;
  regDate?: string;
  replies?: Reply[];
}

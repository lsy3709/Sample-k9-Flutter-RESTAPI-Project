/** 공지사항 게시물에 첨부된 이미지에 대한 타입 정의입니다 */
export interface NoticeImage {
  id?: number;
  fileName: string;
  uuid: string;
  ord: number;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  writer?: string;
  topFixed?: boolean;
  regDate?: string;
  images?: NoticeImage[];
}

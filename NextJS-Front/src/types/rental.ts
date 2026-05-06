/** 도서 대출(대여) 정보에 대한 타입 정의입니다 */
export interface Rental {
  id: number;
  memberId?: number;
  memberName?: string;
  memberMid?: string;
  bookId?: number;
  bookTitle?: string;
  bookAuthor?: string;
  rentalDate?: string;
  dueDate?: string;
  returnDate?: string;
  status?: string;
  overdue?: boolean;
}

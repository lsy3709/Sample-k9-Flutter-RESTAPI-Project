export type BookStatus = "AVAILABLE" | "RENTED" | "RESERVED" | "LOST";

export const BOOK_STATUS_LABEL: Record<BookStatus, string> = {
  AVAILABLE: "대여가능",
  RENTED: "대여중",
  RESERVED: "예약중",
  LOST: "분실",
};

export const BOOK_STATUS_COLOR: Record<BookStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  RENTED: "bg-red-100 text-red-600",
  RESERVED: "bg-yellow-100 text-yellow-700",
  LOST: "bg-gray-200 text-gray-500",
};

export interface Book {
  id: number;
  bookTitle: string;
  author: string;
  publisher?: string;
  isbn?: string;
  status?: BookStatus;
  description?: string;
  coverImage?: string;
  publishDate?: string;
  regDate?: string;
}

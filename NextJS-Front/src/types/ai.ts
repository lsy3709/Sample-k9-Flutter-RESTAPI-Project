/**
 * Gemini 텍스트 챗봇 요청/응답과 오류 응답을 프론트에서 일관되게 다루기 위한 타입 모음입니다.
 */
export interface ChatRequest {
  prompt: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  implemented: boolean;
}

export interface ImageAnalysisResponse {
  description: string;
  filename: string;
  mimeType: string;
  model: string;
  implemented: boolean;
}

export interface BusinessCardResponse {
  name: string;
  company: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  address: string;
  rawText: string;
  parseSuccess: boolean;
  model: string;
  implemented: boolean;
}

export interface BusinessCardSearchResponse {
  matched: boolean;
  matchType: string;
  memberId: number | null;
  mid: string | null;
  memberName: string | null;
  email: string | null;
  region: string | null;
  role: string | null;
  extractedCard: BusinessCardResponse;
  implemented: boolean;
}

export interface MultimodalResponse {
  question: string;
  answer: string;
  model: string;
  implemented: boolean;
}

export interface AiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
}

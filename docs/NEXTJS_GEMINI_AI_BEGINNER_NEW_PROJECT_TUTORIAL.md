# Next.js Gemini AI 초보자 새 프로젝트 튜토리얼

> 목표: 기존 `NextJS-Front` 앱과 분리해서, 완전히 새 Next.js 프로젝트를 만들고 Gemini AI 화면과 기능을 하나씩 확인한다.  
> 권장 백엔드: `docs/SPRING_BOOT_GEMINI_NO_JWT_TEST_PROJECT_TUTORIAL.md`의 JWT 없는 Spring Boot 테스트 서버  
> 실습 기능: 홈 화면, 텍스트 챗봇, 이미지 분석, 이미지 Q&A

---

## 1. 전체 그림

이번 실습에서는 Next.js가 Gemini API를 직접 호출하지 않는다.

```text
Next.js 화면
  -> Spring Boot 테스트 서버
      -> Gemini API
```

이 구조의 장점:

- 브라우저에 Gemini API Key를 노출하지 않는다.
- Next.js는 화면, 입력값, 파일 업로드, 응답 표시만 담당한다.
- Spring Boot가 Gemini API Key와 Gemini 호출 로직을 관리한다.

---

## 2. 먼저 준비할 것

### 2-1. Spring Boot 무인증 테스트 서버 실행

아래 문서를 먼저 진행한다.

```text
docs/SPRING_BOOT_GEMINI_NO_JWT_TEST_PROJECT_TUTORIAL.md
```

문서 기준 서버 주소:

```text
http://localhost:18082
```

기본 API:

| 기능 | Method | URL |
|---|---|---|
| 텍스트 챗봇 | POST | `http://localhost:18082/api/ai/chat` |
| 이미지 분석 | POST | `http://localhost:18082/api/ai/analyze-image` |

이미지 Q&A까지 연습하려면 Spring Boot 쪽에 아래 API가 있어야 한다.

```text
POST http://localhost:18082/api/ai/multimodal
```

기존 `SpringBasic/api5012`에는 `/api/ai/multimodal`이 이미 있지만 JWT 인증이 필요하다.  
이번 새 Next.js 실습은 무인증 서버를 기준으로 한다.

### 2-2. Postman으로 백엔드 먼저 확인

Next.js를 만들기 전에 Postman에서 백엔드가 성공하는지 확인한다.

```text
POST http://localhost:18082/api/ai/chat
```

Body:

```json
{
  "prompt": "Next.js를 초보자에게 설명해줘."
}
```

Postman에서 실패하면 Next.js에서도 실패한다.

---

## 3. 새 Next.js 프로젝트 생성

작업 위치 예시:

```powershell
cd E:\0-sample-flutter-projectt-k9\NextJS-Front
npx create-next-app@latest gemini-ai-practice
cd gemini-ai-practice
```

질문이 나오면 아래처럼 선택한다.

| 질문 | 선택 |
|---|---|
| TypeScript? | Yes |
| ESLint? | Yes |
| Tailwind CSS? | Yes |
| `src/` directory? | Yes |
| App Router? | Yes |
| Turbopack? | No 또는 Yes |
| import alias? | Yes |

실행 확인:

```powershell
npm run dev
```

브라우저:

```text
http://localhost:3000
```

기본 Next.js 화면이 나오면 성공이다.

---

## 4. 환경 변수 설정

파일:

```text
.env.local
```

내용:

```properties
NEXT_PUBLIC_API_BASE_URL=http://localhost:18082/api
```

주의:

- `NEXT_PUBLIC_`으로 시작하는 값은 브라우저에 노출된다.
- 여기에 Gemini API Key를 넣으면 안 된다.
- 여기에는 Spring Boot 서버 주소만 둔다.

환경 변수를 추가하거나 바꾸면 Next.js 개발 서버를 재시작한다.

```powershell
Ctrl + C
npm run dev
```

---

## 5. 추천 폴더 구조

`src` 폴더를 아래처럼 구성한다.

```text
src
  app
    page.tsx
    ai
      page.tsx
      chat
        page.tsx
      image
        page.tsx
      multimodal
        page.tsx
  lib
    gemini-api.ts
  types
    ai.ts
```

역할:

| 파일 | 역할 |
|---|---|
| `types/ai.ts` | API 응답 타입 정의 |
| `lib/gemini-api.ts` | Spring Boot API 호출 함수 |
| `app/page.tsx` | 첫 화면 |
| `app/ai/page.tsx` | AI 기능 선택 화면 |
| `app/ai/chat/page.tsx` | 텍스트 챗봇 |
| `app/ai/image/page.tsx` | 이미지 분석 |
| `app/ai/multimodal/page.tsx` | 이미지 Q&A |

---

## 6. 타입 만들기

파일:

```text
src/types/ai.ts
```

```ts
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

export interface MultimodalResponse {
  question: string;
  answer: string;
  model: string;
  implemented: boolean;
}

export interface AiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  path?: string;
}
```

타입은 “백엔드가 어떤 JSON을 돌려주는지”를 프론트에서 미리 약속하는 역할을 한다.

---

## 7. API 호출 함수 만들기

파일:

```text
src/lib/gemini-api.ts
```

```ts
import type {
  AiErrorResponse,
  ChatResponse,
  ImageAnalysisResponse,
  MultimodalResponse,
} from "@/types/ai";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:18082/api";

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as AiErrorResponse;
    if (data.message) return data.message;
  } catch {
    // JSON 에러가 아닐 수 있으므로 상태 코드로 처리한다.
  }

  return `요청 실패: HTTP ${response.status}`;
}

export async function requestChat(prompt: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<ChatResponse>;
}

export async function requestImageAnalysis(
  file: File,
  prompt: string,
): Promise<ImageAnalysisResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("prompt", prompt);

  const response = await fetch(`${API_BASE_URL}/ai/analyze-image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<ImageAnalysisResponse>;
}

export async function requestMultimodal(
  file: File,
  question: string,
): Promise<MultimodalResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("question", question);

  const response = await fetch(`${API_BASE_URL}/ai/multimodal`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<MultimodalResponse>;
}
```

중요:

- JSON 요청에는 `Content-Type: application/json`을 직접 넣는다.
- `FormData` 요청에는 `Content-Type`을 직접 넣지 않는다.
- 브라우저가 multipart boundary를 자동으로 붙여야 한다.
- Spring Controller의 파일 이름이 `image`이므로 `formData.append("image", file)`로 맞춘다.

---

## 8. 첫 화면 만들기

파일:

```text
src/app/page.tsx
```

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Gemini Practice
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Next.js Gemini AI 연습
        </h1>
        <p className="mt-4 text-slate-600">
          Spring Boot 테스트 서버를 호출해서 텍스트 챗봇, 이미지 분석,
          이미지 Q&A를 하나씩 확인합니다.
        </p>
        <Link
          href="/ai"
          className="mt-8 inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          AI 기능 시작하기
        </Link>
      </section>
    </main>
  );
}
```

확인:

```powershell
npm run dev
```

브라우저:

```text
http://localhost:3000
```

---

## 9. AI 기능 선택 화면

파일:

```text
src/app/ai/page.tsx
```

```tsx
import Link from "next/link";

const menus = [
  {
    href: "/ai/chat",
    title: "텍스트 챗봇",
    description: "질문을 보내고 Gemini 답변을 확인합니다.",
  },
  {
    href: "/ai/image",
    title: "이미지 분석",
    description: "이미지를 업로드하고 한국어 설명을 받습니다.",
  },
  {
    href: "/ai/multimodal",
    title: "이미지 Q&A",
    description: "이미지와 질문을 함께 보내 답변을 받습니다.",
  },
];

export default function AiHomePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900">AI 기능 선택</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <h2 className="font-semibold text-slate-900">{menu.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {menu.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
```

확인:

```text
http://localhost:3000/ai
```

카드 3개가 보이면 성공이다.

---

## 10. 텍스트 챗봇 화면

파일:

```text
src/app/ai/chat/page.tsx
```

```tsx
"use client";

import { FormEvent, useMemo, useState } from "react";
import { requestChat } from "@/lib/gemini-api";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "안녕하세요. 무엇을 도와드릴까요?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => prompt.trim().length > 0 && !loading,
    [prompt, loading],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextPrompt = prompt.trim();
    if (!nextPrompt) {
      setError("질문을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: nextPrompt }]);
    setPrompt("");

    try {
      const data = await requestChat(nextPrompt);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply },
      ]);
      setModel(data.model);
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `오류: ${message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-200 p-4">
          <h1 className="text-xl font-bold text-slate-900">텍스트 챗봇</h1>
          <p className="mt-1 text-sm text-slate-500">
            {model ? `연결 모델: ${model}` : "첫 요청 전"}
          </p>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-6 ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            );
          })}
          {loading && (
            <p className="text-sm text-slate-500">
              Gemini가 답변을 작성하고 있습니다...
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="예: Next.js App Router를 초보자에게 설명해줘"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              {loading ? "전송 중" : "전송"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
```

확인 질문:

```text
Next.js에서 client component가 필요한 상황을 설명해줘.
```

---

## 11. 이미지 분석 화면

파일:

```text
src/app/ai/image/page.tsx
```

```tsx
"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { requestImageAnalysis } from "@/lib/gemini-api";
import type { ImageAnalysisResponse } from "@/types/ai";

export default function ImageAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("이 이미지를 한국어로 자세히 설명해주세요.");
  const [result, setResult] = useState<ImageAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => !!file && !loading, [file, loading]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    setError(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError("이미지를 먼저 선택해주세요.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await requestImageAnalysis(
        file,
        prompt.trim() || "이 이미지를 한국어로 설명해주세요.",
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <h1 className="text-xl font-bold text-slate-900">이미지 분석</h1>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              이미지 파일
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              분석 프롬프트
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {loading ? "분석 중..." : "이미지 분석 요청"}
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">미리보기와 결과</h2>
          <div className="mt-4 flex h-72 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="업로드 이미지 미리보기"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm text-slate-400">
                선택한 이미지가 여기에 표시됩니다.
              </span>
            )}
          </div>

          {result && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-white">
                  {result.model}
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                  {result.mimeType}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {result.description}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
```

확인:

1. 이미지 선택
2. 미리보기 표시
3. 이미지 분석 요청
4. 설명 결과 표시

---

## 12. 이미지 Q&A 화면

이 화면은 Spring Boot에 `/api/ai/multimodal`이 있을 때 동작한다.

파일:

```text
src/app/ai/multimodal/page.tsx
```

```tsx
"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { requestMultimodal } from "@/lib/gemini-api";
import type { MultimodalResponse } from "@/types/ai";

export default function MultimodalPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("이 이미지에서 중요한 내용을 알려줘.");
  const [result, setResult] = useState<MultimodalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => !!file && question.trim().length > 0 && !loading,
    [file, question, loading],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    setError(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setError("이미지를 먼저 선택해주세요.");
      return;
    }

    const nextQuestion = question.trim();
    if (!nextQuestion) {
      setError("질문을 입력해주세요.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await requestMultimodal(file, nextQuestion);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <h1 className="text-xl font-bold text-slate-900">이미지 Q&A</h1>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              질문할 이미지
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              질문
            </span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {loading ? "답변 생성 중..." : "질문 전송"}
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">답변</h2>

          <div className="mt-4 flex h-72 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="질문 이미지 미리보기"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm text-slate-400">
                선택한 이미지가 여기에 표시됩니다.
              </span>
            )}
          </div>

          {result && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Question
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {result.question}
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase text-indigo-700">
                  Answer
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                  {result.answer}
                </p>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
```

확인 질문:

```text
이 이미지에서 보이는 내용을 3가지로 요약해줘.
```

---

## 13. CORS 확인

Next.js는 보통 `http://localhost:3000`에서 실행되고, Spring Boot는 `http://localhost:18082`에서 실행된다.  
포트가 다르기 때문에 브라우저 기준으로는 서로 다른 출처다.

Spring Boot 쪽에서 CORS가 허용되어야 한다.

무인증 Spring Boot 테스트 프로젝트에 CORS 설정이 없다면 아래 설정을 추가한다.

```java
package com.example.gemininojwttest.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
```

CORS 에러 예시:

```text
Access to fetch at ... from origin http://localhost:3000 has been blocked by CORS policy
```

이 에러가 보이면 Next.js 코드보다 Spring Boot CORS 설정을 먼저 확인한다.

---

## 14. 기존 NextJS-Front와 비교

기존 프로젝트의 핵심 파일:

| 역할 | 파일 |
|---|---|
| API 기본 주소 | `NextJS-Front/src/constants/api.ts` |
| axios 인스턴스 + JWT | `NextJS-Front/src/lib/api.ts` |
| AI 타입 | `NextJS-Front/src/types/ai.ts` |
| 채팅 화면 | `NextJS-Front/src/app/ai/chat/page.tsx` |
| 이미지 분석 화면 | `NextJS-Front/src/app/ai/image/page.tsx` |
| 이미지 Q&A 화면 | `NextJS-Front/src/app/ai/multimodal/page.tsx` |
| 명함 OCR 화면 | `NextJS-Front/src/app/ai/business-card/page.tsx` |

기존 앱은 JWT가 있는 SpringBasic 프로젝트를 호출한다.

```ts
api.interceptors.request.use((config) => {
  const token = loadToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
```

새 연습 프로젝트는 인증 없는 Spring Boot 테스트 서버를 호출하므로 JWT 인터셉터가 필요 없다.

| 항목 | 기존 NextJS-Front | 새 연습 프로젝트 |
|---|---|---|
| 목적 | 도서관 앱에 AI 기능 통합 | Gemini 기능만 단독 연습 |
| 인증 | JWT 사용 | 인증 없음 |
| API 호출 | axios 인스턴스 | 기본 `fetch` |
| 화면 보호 | `Protected` 사용 | 사용 안 함 |
| 기능 | 챗봇, 이미지, 명함, 멀티모달 | 챗봇, 이미지, 멀티모달 |
| 난이도 | 중간 | 낮음 |

---

## 15. 실행 확인 순서

1. Spring Boot 무인증 서버 실행
2. Postman에서 `/api/ai/chat` 성공 확인
3. Next.js 실행

```powershell
npm run dev
```

4. 브라우저 접속

```text
http://localhost:3000
```

5. `/ai/chat`에서 텍스트 질문 성공 확인
6. `/ai/image`에서 이미지 업로드 성공 확인
7. `/ai/multimodal`에서 이미지 Q&A 성공 확인

---

## 16. 자주 막히는 문제

### 16-1. 환경 변수를 바꿨는데 적용이 안 됨

`.env.local`을 수정한 뒤 개발 서버를 재시작한다.

```powershell
Ctrl + C
npm run dev
```

### 16-2. CORS 에러

브라우저 콘솔에 아래처럼 보인다.

```text
blocked by CORS policy
```

해결:

- Spring Boot에 CORS 설정을 추가한다.
- `allowedOrigins("http://localhost:3000")`가 맞는지 확인한다.

### 16-3. `Failed to fetch`

원인:

- Spring Boot 서버가 꺼져 있다.
- API 주소 또는 포트가 틀렸다.
- CORS 문제다.

확인:

```text
http://localhost:18082/swagger-ui/index.html
```

### 16-4. 이미지 업로드가 400

원인:

- `FormData` key가 Spring Controller와 다르다.

Spring:

```java
@RequestPart MultipartFile image
```

Next.js:

```ts
formData.append("image", file);
```

둘 다 `image`여야 한다.

### 16-5. multipart 요청에 Content-Type을 직접 넣음

아래처럼 직접 넣으면 boundary가 빠져 실패할 수 있다.

```ts
headers: {
  "Content-Type": "multipart/form-data",
}
```

FormData를 보낼 때는 header를 직접 넣지 않는다.

```ts
await fetch(url, {
  method: "POST",
  body: formData,
});
```

### 16-6. 이미지 Q&A만 실패

원인:

- 무인증 Spring Boot 테스트 서버에 `/api/ai/multimodal`이 아직 없다.

해결:

- 먼저 `/api/ai/chat`, `/api/ai/analyze-image`를 완료한다.
- Spring Boot에 multimodal API를 추가하거나 기존 `SpringBasic/api5012`를 사용한다.

---

## 17. 연습 과제

### 과제 1. 채팅 입력 개선

질문이 비어 있을 때 alert 대신 화면에 에러 박스를 표시한다.

이미 위 예제에서는 `error` state로 처리했다. 문구를 바꿔본다.

```ts
setError("질문 내용이 비어 있습니다.");
```

### 과제 2. 이미지 prompt 바꿔보기

이미지 분석 화면의 기본 프롬프트를 바꿔본다.

```text
이 이미지에서 보이는 객체를 목록으로 정리해줘.
```

```text
이 이미지를 블로그 제목처럼 표현해줘.
```

### 과제 3. 모델명 표시하기

채팅 응답의 `model`을 화면 상단에 표시한다.

```tsx
setModel(data.model);
```

### 과제 4. 명함 OCR 화면 추가하기

기존 `NextJS-Front/src/app/ai/business-card/page.tsx`를 참고해서 새 프로젝트에도 명함 OCR 페이지를 추가한다.

필요 API:

```text
POST /api/ai/ocr/business-card
```

단, 무인증 Spring Boot 테스트 프로젝트에는 명함 OCR API를 별도로 추가해야 한다.

---

## 18. 학습 순서 추천

1. Spring Boot 무인증 테스트 서버 만들기
2. Postman으로 텍스트 챗봇 확인
3. 새 Next.js 프로젝트 생성
4. 환경 변수와 API 함수 작성
5. 홈 화면 만들기
6. 채팅 화면 만들기
7. 이미지 분석 화면 만들기
8. FormData/multipart 구조 이해
9. 이미지 Q&A 화면 만들기
10. 기존 `NextJS-Front`의 JWT 통합 버전과 비교

---

## 19. 핵심 정리

- Next.js에는 Gemini API Key를 넣지 않는다.
- Next.js는 Spring Boot 백엔드만 호출한다.
- 텍스트 요청은 JSON으로 보낸다.
- 이미지 요청은 `FormData`로 보낸다.
- `FormData` 요청에는 `Content-Type`을 직접 넣지 않는다.
- 브라우저에서 호출하므로 CORS 설정이 중요하다.
- 새 프로젝트에서는 JWT 없이 기능 흐름을 먼저 익힌다.
- 기존 `NextJS-Front`에 통합할 때는 `api.ts`의 JWT axios 인스턴스, `Protected`, 라우팅을 함께 고려한다.


# 📊 프로젝트 상세 분석 보고서 (Detailed Project Analysis Report)

본 문서는 **부산도서관 관리 시스템**의 각 주요 모듈별 구체적인 구조와 구현 상세를 분석한 보고서입니다.

---

## 1. 📱 Flutter-Front (Mobile Application)
사용자용 크로스 플랫폼 앱으로, 기능별 Controller-Screen 분리 구조를 따릅니다.

### 📂 주요 디렉토리 구조
- **`lib/controller/`**: 비즈니스 로직 및 API 연동 (Provider 패턴 기반)
    - `auth/`: 로그인, 회원가입 처리
    - `book_controller.dart`: 도서 검색 및 상세 정보 관리
    - `rental_controller.dart`: 대여 및 반납 로직
    - `ai/`: Flask AI 서버 연동 및 결과 처리
    - `admin/`: 관리자 전용 기능 (도서 등록, 회원 관리 등)
- **`lib/screen/`**: 사용자 UI 구성
    - `login_screen.dart`, `signup_screen.dart`: 인증 화면
    - `book/`, `rental/`, `reserve/`: 도서 서비스 관련 화면
    - `ai/`: 이미지 분석 및 주가 예측 UI
    - `mypage/`: 사용자 정보 및 대여 이력 확인
- **`lib/model/`**: 백엔드 응답 데이터 구조화 (fromJson/toJson)
- **`lib/const/`**: API Base URL (`api_constants.dart`), 앱 테마 색상 등

---

## 🌐 2. NextJS-Front (Web Application)
최신 Next.js 15 App Router를 기반으로 한 반응형 웹 서비스입니다.

### 📂 주요 디렉토리 구조
- **`src/app/`**: 페이지 기반 라우팅 (Next.js 15 App Router)
    - `(auth)/login`, `signup`: 인증 페이지
    - `books/`, `events/`, `notices/`: 도서관 정보 서비스
    - `ai/`: AI 분석 대시보드
    - `admin/`: 통합 관리자 웹 콘솔
    - `mypage/`: 개인화 서비스
- **`src/components/`**: 원자 단위(Atomic) 또는 기능 단위 UI 컴포넌트
- **`src/lib/`**: Axios 인스턴스 설정 및 JWT 토큰 관리 로직
- **`src/types/`**: TypeScript 인터페이스 및 타입 정의

---

## 🍃 3. Spring-Back (Main Backend)
시스템의 데이터 중심부로, 확장성 있는 계층형 아키텍처를 가집니다.

### 📂 패키지 구조 (`com.busanit501.api5012`)
- **`controller/`**: REST API 엔드포인트 정의
    - `library/`: Book, Rental, Notice, Inquiry 등 핵심 도메인 제어
    - `ai/`: Gemini 연동 및 Flask 서버 프록시/연동 컨트롤러
    - `MemberController`: 인증 및 회원 관리
- **`service/`**: 트랜잭션 및 비즈니스 로직 처리
    - `BookService`, `RentalService`, `MemberService` 등
- **`domain/`**: JPA Entity 정의 (Database Schema)
    - `Book`, `Member`, `Rental`, `Notice`, `Inquiry` 등
- **`repository/`**: Spring Data JPA 기반 데이터 액세스 계층
- **`dto/`**: 계층 간 데이터 교환을 위한 객체 (Request/Response)
- **`security/`**: JWT Filter, TokenCheckFilter, SuccessHandler 등 보안 설정

---

## 🤖 4. Flask-Back (AI Backend)
딥러닝 모델의 서빙 및 추론을 전담하는 특화 서버입니다.

### 📂 주요 구성
- **`routes/`**: Flask Blueprint를 이용한 API 분리
    - `vision_routes.py`: 이미지 분류 및 YOLO 탐지
    - `stock_routes.py`: LSTM/RNN 기반 주가 예측
- **`services/`**: 모델 로드 및 전처리를 담당하는 Singleton 구조
- **`models/`**: `.pth` (PyTorch), `.pt` (YOLO) 모델 가중치 파일 저장소
- **`utils/s3_uploader.py`**: 결과 이미지의 클라우드 저장을 위한 AWS S3 연동

---

## 🔄 시스템 연동 워크플로우
1.  **인증:** Flutter/Next.js -> Spring Boot (JWT 발급) -> 이후 요청에 JWT 포함
2.  **도서 대여:** 프론트엔드 -> Spring Boot (DB 업데이트) -> 성공 응답
3.  **AI 분석:** 프론트엔드 -> Flask (추론 결과) -> (필요 시) Spring Boot에 결과 저장

---
*최종 업데이트: 2026-05-08 | 분석 도구: Gemini CLI*

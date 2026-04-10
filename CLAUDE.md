# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
```

lint, test 스크립트 및 테스트 프레임워크는 설정되어 있지 않음.

## 기술 스택

- **Next.js 16** App Router, **React 19**, **TypeScript**
- **Tailwind CSS v4** + `tw-animate-css`, UI 컴포넌트는 **shadcn/ui** (`src/components/ui/`)
- **Supabase** — PostgreSQL DB 및 인증 (`@supabase/ssr`)
- **Stripe** — 구독 결제 (Pro/Team 플랜)
- **OpenAI API** — AI 집중 분석
- **Google Calendar API** — 캘린더 연동
- **MDX** — 블로그 콘텐츠 (`content/blog/`)
- PWA 지원 (서비스 워커, 설치 프롬프트)

## 아키텍처

### 라우트 구조

- `src/app/(dashboard)/` — 공개 랜딩 페이지 레이아웃
- `src/app/(auth)/` — 로그인/회원가입 페이지
- `src/app/app/` — 인증 필요 영역 (타이머, 통계, 설정, 결제, 리더보드). 미인증 시 `/login`으로 리다이렉트
- `src/app/blog/` — `content/blog/`의 MDX 파일 기반 블로그
- `src/app/u/` — 공개 사용자 프로필
- `src/app/share/` — 세션 공유 페이지
- `src/app/focus-test/` — 집중력 테스트

### Supabase 클라이언트 패턴

`src/lib/supabase/`에 3가지 클라이언트 팩토리:

- `server.ts` → `createClient()` — Server Component 및 Route Handler용 (쿠키 기반)
- `client.ts` → `createClient()` — Client Component용 (브라우저 클라이언트)
- `service.ts` → `createServiceClient()` — `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 관리자 작업용 (RLS 우회)

모두 `src/types/database.ts`의 `Database` 타입으로 제네릭 지정. 타입 재생성: `supabase gen types typescript --linked`

### 인증 흐름

미들웨어(`middleware.ts`)가 모든 라우트에서 실행되어 Supabase 서버 클라이언트로 인증 상태 확인:
- `/app/*` 라우트 — 미인증 사용자를 `/login`으로 리다이렉트
- `/login`, `/signup` — 인증된 사용자를 `/app`으로 리다이렉트
- `src/app/app/layout.tsx`에서도 서버 사이드 인증 체크 수행

### API 라우트

`src/app/api/` 하위:
- `ai/` — OpenAI 기반 집중 분석
- `calendar/` — Google Calendar OAuth 흐름 및 동기화
- `stripe/` — 체크아웃 세션 및 웹훅 핸들러
- `sessions/` — 집중 세션 CRUD
- `share/` — 세션 공유
- `cron/` — 스케줄 작업 (AI 인사이트, 매일 오전 9시, `vercel.json`에서 설정)
- `rss/` — 블로그 RSS 피드

### 데이터베이스

SQL 마이그레이션 파일은 `supabase/migrations/`에 순서대로 실행:
1. `001_initial_schema.sql` — profiles, focus_sessions, ai_insights
2. `002_social_features.sql` — 소셜/공유 기능

주요 테이블: `profiles` (사용자 데이터 + 구독 티어), `focus_sessions` (타이머 기록), `ai_insights` (AI 분석 결과)

### 주요 컨벤션

- 한국어 UI (`lang="ko"`) — 모든 사용자 대면 텍스트는 한국어
- 경로 별칭 `@/`는 `src/`에 매핑
- 컴포넌트는 기능 도메인별 구성 (`timer/`, `stats/`, `ai/`, `billing/`, `ambient/`, `pwa/`)
- 커스텀 훅: `useTimer` (타이머 로직), `useAmbientSound` (앰비언트 사운드)
- 외부 서비스 클라이언트: `src/lib/stripe.ts`, `src/lib/google-calendar.ts`, `src/lib/blog.ts`
- `extension/` 디렉터리는 독립적인 Chrome 확장 프로그램 (Next.js 빌드에 포함되지 않음)

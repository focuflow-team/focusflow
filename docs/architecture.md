---
name: Architecture Map
description: 도메인·레이어링·경계의 최상위 지도. 새 코드 배치 전에 반드시 참고
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Architecture — FocusFlow

## 레이어링 (의존 방향: 왼쪽 → 오른쪽만 허용)

```
[UI Components] → [Hooks] → [Lib (infra clients)] → [External Services]
     │                          │
     ▼                          ▼
[Server Components / Route Handlers] → [Supabase (DB+Auth)]
```

왼쪽 레이어는 오른쪽을 import할 수 있다. **역방향은 금지** (Axis 2에서 `dependency-cruiser`로 강제).

## 도메인 맵

| 도메인          | 위치                                                                     | 진입 파일            |
| --------------- | ------------------------------------------------------------------------ | -------------------- |
| 타이머/포모도로 | `src/components/timer/`, `src/hooks/useTimer.ts`                         | `TimerPage.tsx`      |
| 통계            | `src/components/stats/`, `src/app/app/stats/`                            | `StatsClient.tsx`    |
| AI 인사이트     | `src/components/ai/`, `src/app/api/ai/`, `src/app/api/cron/ai-insights/` | `AICoachCard.tsx`    |
| 결제 (PortOne)  | `src/components/billing/`, `src/app/api/payment/`, `src/lib/portone.ts`  | `PricingClient.tsx`  |
| 결제 (Stripe)   | `src/app/api/stripe/`, `src/lib/stripe.ts`                               | `route.ts` (webhook) |
| 캘린더          | `src/app/api/calendar/`, `src/lib/google-calendar.ts`                    | —                    |
| 앰비언트 사운드 | `src/components/ambient/`, `src/hooks/useAmbientSound.ts`                | —                    |
| 소셜/리더보드   | `src/app/app/leaderboard/`, `src/app/u/`, `src/app/share/`               | —                    |
| 블로그 (MDX)    | `src/app/blog/`, `content/blog/`, `src/lib/blog.ts`                      | —                    |
| PWA             | `src/components/pwa/`, `public/sw.js`(서비스 워커)                       | —                    |

## 경계

### 1. Supabase 3-factory 경계 (ADR-0001)

- `src/lib/supabase/client.ts` → **Client Component**(`'use client'`)만
- `src/lib/supabase/server.ts` → **Server Component / Route Handler**
- `src/lib/supabase/service.ts` → **서버 전용 관리자 작업** (RLS 우회). 허용 위치: `src/app/api/**/route.ts`, `src/app/api/cron/**`. 절대 클라이언트에서 import 금지.

### 2. 인증 경계 (ADR-0002)

- `/app/*` = 보호. 미인증은 middleware.ts가 `/login` 리다이렉트 + `src/app/app/layout.tsx`에서 2차 확인.
- `/login`, `/signup` = 인증 시 `/app` 리다이렉트.
- 새 보호 라우트는 반드시 `/app/**` 하위에 두거나 명시적 ADR 필요.

### 3. 결제 경계

- **금액 → 플랜 매핑은 단일 출처**: `src/app/api/payment/webhook/route.ts`의 `amountKRW >= 18000 ? 'team' : amountKRW >= 6900 ? 'pro' : null`. 이 로직을 프런트에서 중복 계산하지 말 것. (현재 `PricingClient.tsx`도 별도로 가격을 표시 — 향후 단일 상수로 통합 예정)
- **웹훅 서명 검증 필수**: `verifyWebhookSignature` 로직 변경은 반드시 `docs/agent-failures.md`의 F-2026-04-11-A 참고 후 ADR 작성.

### 4. 환경변수 경계

- `NEXT_PUBLIC_*`만 브라우저에서 참조 가능.
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `PORTONE_*_SECRET`, `PORTONE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, Google Calendar 시크릿 — **서버 전용**. Client Component 파일(`'use client'`)에서 `process.env.X`로 참조 금지(Public prefix 예외).

## 크로스커팅

| 관심사      | 단일 진입점                                   |
| ----------- | --------------------------------------------- |
| DB 접근     | `src/lib/supabase/{client,server,service}.ts` |
| 로깅        | `src/lib/logger.ts` (Axis 3에서 도입)         |
| 결제 SDK    | `src/lib/portone.ts`, `src/lib/stripe.ts`     |
| 캘린더 SDK  | `src/lib/google-calendar.ts`                  |
| 블로그 로딩 | `src/lib/blog.ts`                             |

각 컴포넌트/라우트는 **외부 SDK를 직접 import하지 말고** 위 래퍼를 경유한다.

## 제외 영역

- `extension/` — 독립 Chrome 확장. Next.js 빌드·린트에서 제외. 자체 규약 사용.
- `content/blog/**/*.mdx` — 콘텐츠. 코드 규약 미적용.

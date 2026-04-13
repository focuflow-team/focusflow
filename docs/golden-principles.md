---
name: Golden Principles
description: 누적된 "이건 하지 말 것" 리스트. 각 원칙은 근거 + 대안 + 가능하면 기계적 강제 명시.
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Golden Principles

> 세 번 같은 리뷰 코멘트를 달게 되면 원칙으로 승격. 가능한 것은 린트/테스트로 내린다.

## G-01 — 웹훅 시크릿은 raw 문자열로 HMAC 키로 쓰지 마라

- **왜**: PortOne V2(및 Stripe 등 대다수)의 webhook secret은 접두사(`whsec_`)가 붙은 base64 문자열. 그대로 HMAC 키로 쓰면 서명 검증 실패. (F-2026-04-11-A)
- **대신**: `whsec_` prefix 제거 → `Buffer.from(secret, 'base64')` → HMAC 키.
- **강제**: `src/app/api/payment/webhook/route.ts` 내 `verifyWebhookSignature`가 단일 구현. 이 함수 외에서 `crypto.createHmac` 사용 금지 (depcruise 규칙 후보 — Axis 2에서 등록).

## G-02 — PortOne V2 `requestIssueBillingKey`에 `amount` 쓰지 마라

- **왜**: 타입상 존재하지 않는 필드. LLM 훈련 데이터가 틀림. (F-2026-04-11-B)
- **대신**: `displayAmount: number` + `currency: 'KRW'`.
- **강제**: playbook `payment-change.md` A 체크리스트, references/portone-v2-llms.txt.

## G-03 — 간편결제 빌링키 발급 시 amount/currency 필수

- **왜**: KakaoPay/NaverPay/TossPay는 빌링키 발급에도 amount/currency가 필요. 누락 시 "onetime order should have amount!" 런타임 에러. (F-2026-04-11-C)
- **대신**: 모든 간편결제 채널에서 `displayAmount`, `currency: 'KRW'` 명시.
- **강제**: 동일 playbook.

## G-04 — env 의존 Client Component 페이지는 `force-dynamic`

- **왜**: Vercel 빌드가 프리렌더 시도 → Supabase env 없이 `createClient()` → 크래시. (F-2026-04-11-D)
- **대신**: `(auth)/login/page.tsx`, `(auth)/signup/page.tsx` 등에 `export const dynamic = 'force-dynamic'`.
- **강제**: ADR-0002 §3. 신규 env 의존 페이지 추가 시 self-review 스크립트에서 경고 (Axis 4).

## G-05 — 외부 SDK 클라이언트는 lazy init

- **왜**: 모듈 톱레벨에서 `new Stripe()`, `new OpenAI()`를 하면 빌드/테스트 환경에서 env 미설정 시 터짐.
- **대신**: `getStripe()`처럼 함수 호출 시점에 1회 생성 후 캐싱.
- **강제**: `src/lib/stripe.ts`, `src/lib/portone.ts`, `src/lib/*.ts` 패턴 리뷰 체크리스트.

## G-06 — Client Component에서 `@/lib/supabase/service` 절대 import 금지

- **왜**: `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트 번들에 노출되며 RLS가 우회됨.
- **대신**: Client Component는 `@/lib/supabase/client`만. 관리자 작업은 서버 Route Handler로 옮긴다.
- **강제**: depcruise 규칙 `no-service-from-client` (Axis 2).

## G-07 — 인가 판단에 `getSession()` 쓰지 말 것

- **왜**: session은 쿠키에서 읽어 변조 가능. `getUser()`가 서버에서 실제 토큰 검증을 수행.
- **대신**: `supabase.auth.getUser()`.
- **강제**: lint 커스텀 메시지 (Axis 2 후보).

## G-08 — 한국어 UI 일관성

- **왜**: 제품 원칙. 사용자 대면 텍스트는 한국어.
- **대신**: 에러 메시지·버튼·알림 모두 한국어. 코드 주석과 개발자용 로그는 자유.
- **강제**: 코드 리뷰. (자동화는 낮은 가성비 — 현재 미강제)

## G-09 — 루트 `CLAUDE.md`는 ≤100줄 목차

- **왜**: 컨텍스트 희소성. 본문이 늘면 읽지 않게 됨.
- **대신**: 본문은 `docs/` 또는 스코프 `CLAUDE.md`.
- **강제**: drift-detector가 줄 수 체크.

## 승격 정책

- 같은 F-항목이 3회 발생 → 린트 자동화 필수.
- 린트로 불가능한 것은 `scripts/self-review.sh` 경고 + playbook 체크리스트.

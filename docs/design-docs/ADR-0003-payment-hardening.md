---
name: ADR-0003 Payment hardening (PortOne V2)
description: 결제 도메인에서 반복된 실수를 구조적으로 차단하기 위한 규약
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# ADR-0003 — 결제(PortOne V2) 하드닝 규약

- 상태: Accepted
- 날짜: 2026-04-13

## Context

최근 4개 커밋(2026-04-11)이 모두 결제 관련 핫픽스였다:

- F-2026-04-11-A: 웹훅 시크릿 형식 오류 (`whsec_` prefix를 그대로 HMAC 키로 사용).
- F-2026-04-11-B: `requestIssueBillingKey`에서 `amount` 필드 → `displayAmount`로 수정.
- F-2026-04-11-C: 간편결제 채널(KakaoPay/NaverPay/TossPay)에서 billing key 발급 시에도 `amount`/`currency` 필요.
- F-2026-04-11-D: 인증 페이지 정적 프리렌더가 Supabase env 없이 실행되어 빌드 실패.

공통 패턴: **PortOne SDK/웹훅 규약에 대한 지식이 LLM 훈련 데이터에 부정확하게 반영되어 있다.**

## Decision

### 1. 웹훅 서명 검증 단일 구현

- `src/app/api/payment/webhook/route.ts`의 `verifyWebhookSignature`만 유일한 구현. 프로젝트 내 다른 HMAC 검증 함수 작성 금지.
- 시크릿은 반드시 `whsec_` prefix 제거 후 **base64 디코드**한 바이트(`secretBytes`)를 HMAC 키로 사용.
- 서명 헤더 3종(`webhook-id`, `webhook-timestamp`, `webhook-signature`) 누락 시 400.
- 검증 실패 시 401, 성공 시만 이벤트 처리.
- 이 로직 수정은 **반드시 휴먼 승인** (escalation-policy.md).

### 2. 결제 도메인 타입·상수 단일 출처

- 플랜↔금액 매핑 상수는 `src/lib/portone.ts`에 다음 형태로 고정:
  ```ts
  export const PORTONE_PLAN_AMOUNTS_KRW = { pro: 6900, team: 18000 } as const
  export type PortOnePlan = keyof typeof PORTONE_PLAN_AMOUNTS_KRW
  ```
  (아직 추가 전이면 다음 결제 변경 시 같이 도입)
- `PricingClient.tsx`와 `webhook/route.ts`가 **같은 상수**를 참조. 숫자 리터럴 직접 사용 금지.

### 3. PortOne V2 SDK 필드 규약

- `requestIssueBillingKey`는 금액 관련 필드로 `displayAmount: number` + `currency: 'KRW'` 사용.
- `amount`는 일회성 결제(`requestPayment`)에서만.
- 수정할 땐 먼저 `docs/references/portone-v2-llms.txt` 확인.

### 4. 서버 전용 자원

- PortOne secret, Stripe secret, OpenAI API key 등은 `src/lib/*.ts`에서 **lazy init**으로 감쌀 것 (F-2026-04-11-D의 교훈 — 모듈 import 시점에 env 접근 시 빌드 단계에서 터짐).

### 5. 인증 페이지 static 금지

- `(auth)/login/page.tsx`, `(auth)/signup/page.tsx`는 `export const dynamic = 'force-dynamic'` 유지.

## Enforcement

1. `dependency-cruiser`:
   - `no-portone-from-client-amount`: Client Component에서 PortOne 금액 리터럴(`6900`, `18000`) 사용 시 경고 (grep 기반 보조 린트).
2. `eslint-plugin-boundaries`로 `src/app/api/payment/webhook/**` 외부에서 `crypto.createHmac` 사용 금지.
3. `scripts/self-review.sh`에서 `src/app/api/payment/webhook/route.ts` 변경 시 **승인 필요 경고** 출력.
4. `docs/agent-failures.md`에 결제 관련 F-항목은 상시 유지.

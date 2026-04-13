---
name: Playbook — Payment change
description: 결제 도메인 변경 시 반드시 따를 절차와 체크리스트
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Playbook — 결제 변경 (PortOne V2 / Stripe)

> 이 영역은 최근 4개 커밋이 모두 핫픽스였던 고위험 도메인입니다.
> 변경 전 `docs/agent-failures.md` F-2026-04-11-A~D와 ADR-0003을 반드시 읽으세요.

## 변경 유형별 체크리스트

### A. UI/컴포넌트 변경 (`src/components/billing/*`)

- [ ] `PORTONE_PLAN_AMOUNTS_KRW` 상수(또는 `src/lib/portone.ts`)를 경유하는가?
- [ ] `requestIssueBillingKey` 호출 시 `displayAmount`(정확한 필드), `currency: 'KRW'` 포함했는가?
- [ ] `requestPayment`는 `amount` 필드 사용 (V2 SDK 문서 확인).
- [ ] 간편결제 채널(KakaoPay/NaverPay/TossPay)에 `amount`/`currency` 누락 시 "onetime order should have amount!" 에러 재발.

### B. 웹훅 변경 (`src/app/api/payment/webhook/route.ts`)

- [ ] **서명 검증 수정은 휴먼 에스컬레이션 필수.**
- [ ] 시크릿 처리: `secret.replace(/^whsec_/, '')` → `Buffer.from(..., 'base64')`. 문자열 그대로 HMAC 키로 쓰지 말 것.
- [ ] 서명 헤더 3종(`webhook-id`, `webhook-timestamp`, `webhook-signature`) 누락 시 400, 검증 실패 시 401.
- [ ] 이벤트 처리 전에 `payment.customer?.id` 존재 확인.
- [ ] 금액 → 플랜 매핑 변경 시 동일 매핑을 쓰는 모든 코드 검색 (`grep -r '18000\|6900' src`).

### C. 금액 / 플랜 매핑 변경

- [ ] `src/lib/portone.ts`의 단일 상수에서만 변경.
- [ ] 프런트·웹훅·설정 모두 같은 상수 참조 확인.
- [ ] 이메일/안내 텍스트에 금액이 하드코딩돼 있는지 grep.
- [ ] 마이그레이션 필요 시 DB에 티어를 숫자로 들고 있는 컬럼 검토.

### D. 서버 env 추가

- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `PORTONE_*_SECRET`, `STRIPE_SECRET_KEY`는 **서버 전용**. `NEXT_PUBLIC_` prefix 사용 금지.
- [ ] `src/lib/*.ts`에서 **lazy init** (모듈 import 시 생성자 호출 금지).
- [ ] README.md `.env.local.example` 섹션 업데이트.

## 실패 시 복기

실패했다면 즉시 `docs/agent-failures.md`에 다음 형식으로 추가:

```
| F-YYYY-MM-DD-X | <증상> | <근본 원인> | <강화책(ADR/린트/문서)> | <도메인> |
```

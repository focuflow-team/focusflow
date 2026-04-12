---
name: verify-portone-billing
description: PortOne V2 결제 통합 규칙을 검증합니다. 플랜 가격 일관성, KakaoPay 처리, webhook 서명 검증, CDN 스크립트 preload를 확인합니다. 결제 관련 파일 변경 후 사용.
---

# PortOne V2 결제 통합 검증

## Purpose

1. **플랜 가격 일관성** — `src/lib/portone.ts`의 `PORTONE_PLANS`, webhook handler, `PricingClient.tsx`의 가격이 동일한지 확인
2. **KakaoPay easyPayProvider 미사용** — KakaoPay는 PG사 자체가 간편결제사이므로 `easyPayProvider` 필드 전달 금지
3. **Webhook 서명 검증** — `whsec_` prefix 제거 후 base64 디코딩하여 HMAC 키로 사용하는 로직 존재 확인
4. **PortOne CDN Script preload** — `src/app/layout.tsx`에 PortOne V2 browser SDK Script 태그 존재 확인
5. **subscribe API에서 PORTONE_PLANS 참조** — 서버 결제 시 `src/lib/portone.ts`의 `PORTONE_PLANS` 상수를 사용하는지 확인 (하드코딩 금지)

## When to Run

- `src/components/billing/PricingClient.tsx` 수정 후
- `src/app/api/payment/` 하위 route handler 수정 후
- `src/lib/portone.ts` 수정 후 (플랜 가격 변경 시)
- `src/app/layout.tsx` 수정 후
- 새 결제 수단(간편결제) 추가 후

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/portone.ts` | PORTONE_PLANS 상수 및 결제 API 헬퍼 (가격 진실 공급원) |
| `src/components/billing/PricingClient.tsx` | 클라이언트 결제 UI, 빌링키 발급 |
| `src/app/api/payment/webhook/route.ts` | PortOne webhook 수신 및 서명 검증 |
| `src/app/api/payment/subscribe/route.ts` | 빌링키 등록 및 첫 결제 수행 |
| `src/app/layout.tsx` | PortOne CDN script preload |

## Workflow

### Step 1: 플랜 가격 진실 공급원 확인

**파일:** `src/lib/portone.ts`

**검사:** `PORTONE_PLANS` 상수에서 pro, team 플랜의 `priceKRW` 값을 읽어 기준값으로 기록합니다.

```bash
grep -n "priceKRW" src/lib/portone.ts
```

**PASS 기준:** `pro: { priceKRW: 6900 }`, `team: { priceKRW: 18000 }` 존재

**FAIL:** 값이 없거나 다른 경우 → 아래 Step들의 비교 기준으로 사용

---

### Step 2: PricingClient의 플랜 가격 일관성

**파일:** `src/components/billing/PricingClient.tsx`

**검사:** 클라이언트 UI에서 하드코딩된 플랜 가격이 `PORTONE_PLANS`의 값과 일치하는지 확인합니다.

```bash
grep -n "planPriceKRW\|6900\|18000\|priceKRW" src/components/billing/PricingClient.tsx
```

**PASS 기준:** `pro` → 6900, `team` → 18000 이 올바르게 사용됨

**FAIL:** `pro: 6900` 또는 `team: 18000`이 다른 값으로 하드코딩된 경우 → `src/lib/portone.ts`의 `PORTONE_PLANS`에서 import하거나 값을 일치시킵니다.

---

### Step 3: Webhook handler의 플랜 가격 일관성

**파일:** `src/app/api/payment/webhook/route.ts`

**검사:** webhook에서 결제 금액으로 플랜을 결정하는 로직의 금액 기준값이 `PORTONE_PLANS`와 일치하는지 확인합니다.

```bash
grep -n "amountKRW\|6900\|18000\|plan\b" src/app/api/payment/webhook/route.ts
```

**PASS 기준:** `>= 18000 → 'team'`, `>= 6900 → 'pro'` 로직이 존재하고 값이 일치함

**FAIL:** 금액 기준이 `PORTONE_PLANS.pro.priceKRW` / `PORTONE_PLANS.team.priceKRW`와 다른 경우 → `src/lib/portone.ts`의 상수를 import하여 사용합니다.

---

### Step 4: KakaoPay easyPayProvider 미사용 규칙

**파일:** `src/components/billing/PricingClient.tsx`

**검사:** KakaoPay 결제 시 `easyPayProvider`를 조건부로 제외하는 로직이 올바르게 구현되어 있는지 확인합니다.

```bash
grep -n "isKakaoPay\|easyPayProvider\|EASY_PAY_KAKAOPAY" src/components/billing/PricingClient.tsx
```

**PASS 기준:**
- `isKakaoPay` 플래그가 존재함
- `easyPayProvider`는 `!isKakaoPay` 조건하에서만 전달됨

**FAIL 예시:** 아래와 같이 KakaoPay에도 `easyPayProvider`를 전달하는 경우:
```typescript
// 잘못된 코드
easyPay: { easyPayProvider: selectedMethod.replace('EASY_PAY_', '') }
// KakaoPay의 경우 easyPayProvider: 'KAKAOPAY' 전달 → PortOne 오류 발생
```

**수정 방법:** `isKakaoPay && !isEasyPay` 조건이 아닌, `isEasyPay && !isKakaoPay` 조건으로 `easyPayProvider` spread

---

### Step 5: Webhook 서명 검증 로직

**파일:** `src/app/api/payment/webhook/route.ts`

**검사:** `whsec_` prefix 제거 후 base64 디코딩하여 HMAC 키로 사용하는 `verifyWebhookSignature` 함수가 올바르게 구현되어 있는지 확인합니다.

```bash
grep -n "whsec_\|replace\|base64\|secretBytes\|createHmac" src/app/api/payment/webhook/route.ts
```

**PASS 기준:**
- `secret.replace(/^whsec_/, '')` 로 prefix 제거
- `Buffer.from(..., 'base64')` 로 디코딩하여 `secretBytes` 생성
- `crypto.createHmac('sha256', secretBytes)` 로 HMAC 생성

**FAIL 예시:** `secret` 문자열 전체를 HMAC 키로 직접 사용하는 경우:
```typescript
// 잘못된 코드
crypto.createHmac('sha256', secret)  // whsec_ prefix가 포함된 문자열 전체 사용
```

---

### Step 6: PortOne CDN Script preload 확인

**파일:** `src/app/layout.tsx`

**검사:** PortOne V2 browser SDK CDN 스크립트가 `<Script>` 컴포넌트로 로드되는지 확인합니다.

```bash
grep -n "portone\|browser-sdk" src/app/layout.tsx
```

**PASS 기준:** `https://cdn.portone.io/v2/browser-sdk.js` 를 `strategy="afterInteractive"`로 로드하는 `<Script>` 태그 존재

**FAIL:** 스크립트가 없거나 다른 전략(beforeInteractive 등)을 사용하는 경우 → `afterInteractive` 전략으로 추가합니다.

---

### Step 7: subscribe API의 PORTONE_PLANS 참조

**파일:** `src/app/api/payment/subscribe/route.ts`

**검사:** 서버 결제 시 플랜 가격을 `PORTONE_PLANS`에서 참조하는지 확인합니다.

```bash
grep -n "PORTONE_PLANS\|portone\|6900\|18000" src/app/api/payment/subscribe/route.ts
```

**PASS 기준:** `PORTONE_PLANS`를 `src/lib/portone.ts`에서 import하여 사용

**FAIL:** 결제 금액을 하드코딩하는 경우 → `import { PORTONE_PLANS } from '@/lib/portone'` 후 `PORTONE_PLANS[plan].priceKRW` 사용

## Output Format

```markdown
| 검사 | 파일 | 결과 | 상세 |
|------|------|------|------|
| 플랜 가격 기준값 | `src/lib/portone.ts` | PASS | pro=6900, team=18000 |
| PricingClient 가격 | `PricingClient.tsx` | PASS | 일치 확인 |
| Webhook 가격 | `webhook/route.ts` | PASS | >= 18000 team, >= 6900 pro |
| KakaoPay easyPayProvider | `PricingClient.tsx` | PASS | isKakaoPay 조건 존재 |
| Webhook 서명 검증 | `webhook/route.ts` | PASS | whsec_ 처리 및 HMAC 확인 |
| CDN Script | `layout.tsx` | PASS | afterInteractive 전략 |
| subscribe PORTONE_PLANS | `subscribe/route.ts` | PASS | import 확인 |
```

## Exceptions

1. **플랜 가격이 의도적으로 변경된 경우** — `PORTONE_PLANS`를 먼저 업데이트하면 나머지 파일의 값도 함께 바뀌어야 합니다. PORTONE_PLANS 변경이 선행되면 FAIL이 아닙니다.
2. **개발/테스트 환경의 소액 결제** — 테스트용으로 의도적으로 낮은 금액(100원 등)을 사용하는 경우, 실제 webhook에서 플랜 매칭이 안 될 수 있으나 이는 테스트 목적의 의도된 동작입니다.
3. **`PORTONE_WEBHOOK_SECRET` 미설정 시** — webhook 서명 검증 블록이 건너뛰어지는 것은 정상입니다. `if (webhookSecret)` 조건부 실행이 의도된 패턴입니다.
4. **새 간편결제 수단 추가** — `EASY_PAY_KAKAOPAY`가 아닌 새 간편결제 수단(`EASY_PAY_NAVERPAY` 등)은 `easyPayProvider`를 제공해야 합니다. KakaoPay에만 해당하는 예외임을 주의합니다.

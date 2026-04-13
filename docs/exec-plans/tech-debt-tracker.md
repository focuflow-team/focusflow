---
name: Tech Debt Tracker
description: 즉시 수정은 보류하되 장기적으로 해결해야 하는 항목
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Tech Debt Tracker

| ID     | 항목                                                                                                       | 영역     | 생성일     | 비고                                        |
| ------ | ---------------------------------------------------------------------------------------------------------- | -------- | ---------- | ------------------------------------------- |
| TD-001 | 플랜 금액 상수 단일 출처화 (`PricingClient` ↔ webhook)                                                     | 결제     | 2026-04-13 | ADR-0003 §2 참고                            |
| TD-002 | Vitest 도입 검토 (결제·인증 도메인 unit 커버리지)                                                          | 테스트   | 2026-04-13 | Axis 4에서 권고만                           |
| TD-003 | `src/app/api/payment/webhook/route.ts` PortOne SDK 타입 import (`PortOneWebhookEvent`를 SDK 타입으로 대체) | 결제     | 2026-04-13 | 현재 수제 interface                         |
| TD-004 | Stripe vs PortOne — 결제 게이트웨이 중복. 한쪽으로 수렴 결정 필요                                          | 결제     | 2026-04-13 | 제품 결정 필요                              |
| TD-005 | Structured logger 도입 (Axis 3)                                                                            | 운영     | 2026-04-13 | `src/lib/logger.ts`                         |
| TD-006 | `supabase gen types` 자동화 (pre-commit 또는 CI)                                                           | DB       | 2026-04-13 |                                             |
| TD-007 | 기존 ESLint 위반 정리 (react-hooks/immutability 외 5 errors)                                               | 코드품질 | 2026-04-13 | 완료 전까지 CI lint job은 non-blocking      |
| TD-008 | Next 16 `proxy.ts` 마이그레이션 검토 (현재 `middleware.ts`)                                                | 라우팅   | 2026-04-13 | Next 공식 업그레이드 가이드 확인 필요       |
| TD-009 | Prettier baseline 일괄 포매팅 (npx prettier --write .)                                                     | 포매팅   | 2026-04-13 | 적용 전까지 self-review·CI에서 non-blocking |

## 처리 방법

- 해결 시 행 삭제 + 커밋 메시지에 `refs: TD-XXX` 포함.
- 대응 ADR이 생기면 ID 옆에 링크.

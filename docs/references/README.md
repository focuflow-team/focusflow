---
name: References index
description: 외부 라이브러리에 대한 LLM용 요약본 위치
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# References — `*-llms.txt`

외부 라이브러리의 훈련-데이터-와-다른-부분을 **요약**한 파일들.

| 파일                                                 | 대상                   |
| ---------------------------------------------------- | ---------------------- |
| [nextjs-16-llms.txt](./nextjs-16-llms.txt)           | Next.js 16 App Router  |
| [supabase-ssr-llms.txt](./supabase-ssr-llms.txt)     | `@supabase/ssr`        |
| [portone-v2-llms.txt](./portone-v2-llms.txt)         | PortOne V2 Browser SDK |
| [stripe-webhook-llms.txt](./stripe-webhook-llms.txt) | Stripe Webhook         |

## 갱신 정책

- 라이브러리 메이저 업그레이드 시 해당 파일도 업데이트.
- 새 핫픽스가 특정 SDK의 오해에서 비롯됐다면, `agent-failures.md`와 함께 해당 `*-llms.txt`에 항목 추가.
- `last_verified` 90일 초과 시 drift-detector가 경고.

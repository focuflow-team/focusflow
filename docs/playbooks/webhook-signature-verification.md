---
name: Playbook — Webhook signature verification
description: PortOne V2 웹훅 서명 검증의 정확한 절차
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Playbook — Webhook 서명 검증

> 현재 유일한 구현: `src/app/api/payment/webhook/route.ts` `verifyWebhookSignature`.
> **이 로직을 수정할 땐 ADR-0003 + 휴먼 승인 필수.**

## PortOne V2 스펙 (검증된 절차)

1. 헤더 3종 수신:
   - `webhook-id`
   - `webhook-timestamp`
   - `webhook-signature` (형식: `"v1,<base64>"` 공백 구분으로 복수 가능)
2. 요청 body는 **raw text** (`await request.text()`) — 먼저 `.json()` 호출하지 말 것.
3. signedContent = `${webhookId}.${webhookTimestamp}.${body}`
4. HMAC 키: `secret`(환경변수)에서 `whsec_` prefix 제거 → **base64 디코드** → `Buffer`
5. `crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')`로 expected 생성
6. 헤더의 각 `v1,<hash>` 항목에 대해 `hash === expected`인지 timing-safe 비교(추후 `crypto.timingSafeEqual` 도입 TD 등록 가능).

## 흔한 실수

| 실수                                    | 증상                                      | 방지                                            |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| 시크릿 문자열을 HMAC 키로 그대로 사용   | 서명 검증 실패                            | `whsec_` 제거 후 base64 디코드 (F-2026-04-11-A) |
| `await request.json()`으로 body 소비    | raw body 불일치 → 서명 실패               | `await request.text()` 한 번만                  |
| 헤더 이름 camelCase 가정                | `null` 반환                               | 모든 헤더 이름은 lower-case                     |
| PORTONE_WEBHOOK_SECRET 미설정 상태 배포 | 검증 스킵(현재 구현)으로 위장 트래픽 수락 | 프로덕션 배포 전 env 존재 확인                  |

## 수정 제안 (TD 등록 검토)

- `crypto.timingSafeEqual`로 비교 → 타이밍 공격 방어.
- 시크릿 미설정을 프로덕션에서 `fail-closed`로 (현재 `fail-open`).

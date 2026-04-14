---
name: Agent Failures Log
description: 에이전트·사람의 실수를 기록하고 하네스 강화책과 연결. 하네스 진화의 연료.
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Agent Failures Log

> 규칙: 실수가 발생하면 즉시 이 파일에 행 추가. 조용히 넘기지 말 것.
> ID 포맷: `F-YYYY-MM-DD-X` (X는 A부터)

## 기록 가이드

- **증상**: 외부에서 관찰 가능한 현상 (에러 메시지, 빌드 실패, 잘못된 결과).
- **근본 원인**: "왜"에 대한 한 줄 답. "try harder"로 해결 안 되는 구조적 사유.
- **강화책**: ADR 링크, 린트 규칙명, 문서 업데이트. 없으면 **반드시 만들어서** 붙일 것.
- **도메인**: 결제/인증/DB/빌드/기타.

## 회고 시드 (2026-04-11 결제 핫픽스 시리즈)

| ID             | 증상                                                                             | 근본 원인                                                                                                                               | 강화책                                                                                                                                         | 도메인    |
| -------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| F-2026-04-11-A | PortOne 웹훅 서명 검증 실패                                                      | `PORTONE_WEBHOOK_SECRET`(예: `whsec_xxx`)을 문자열 그대로 HMAC 키로 사용. 실제로는 `whsec_` prefix 제거 후 base64 디코드한 바이트가 키. | [ADR-0003 §1](design-docs/ADR-0003-payment-hardening.md), [playbook](playbooks/webhook-signature-verification.md), `golden-principles.md` G-01 | 결제/웹훅 |
| F-2026-04-11-B | `requestIssueBillingKey` TypeScript 타입 에러 (`amount` 필드 없음)               | PortOne V2 `IssueBillingKeyRequest`는 `amount` 필드가 없고 `displayAmount: number`를 사용. LLM 훈련 데이터가 잘못된 필드명을 제공.      | [references/portone-v2-llms.txt](references/portone-v2-llms.txt), [playbook](playbooks/payment-change.md) 체크리스트 A, G-02                   | 결제/SDK  |
| F-2026-04-11-C | 간편결제(KakaoPay/NaverPay/TossPay)에서 "onetime order should have amount!"      | 일부 V2 채널은 빌링키 발급 시에도 `amount`/`currency` 필요하지만 SDK 타입은 이를 강제하지 않음. 누락 시 채널별 상이한 런타임 에러.      | references/portone-v2-llms.txt, playbook A, G-03                                                                                               | 결제/SDK  |
| F-2026-04-11-D | Vercel 빌드 중 `(auth)/login`·`signup` 페이지 prerender 에러 (Supabase env 없음) | Client Component 페이지가 모듈 로딩 시점에 `createClient()`를 호출 → 빌드 환경엔 env 없음. `force-dynamic` 누락.                        | [ADR-0002 §3](design-docs/ADR-0002-auth-boundary.md), G-04, references/nextjs-16-llms.txt                                                      | 빌드/인증 |

## 현재 항목

| ID             | 증상                                                      | 근본 원인                                                                                                                    | 강화책                                                                                       | 도메인      |
| -------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------- |
| F-2026-04-15-A | `pre-edit-check.sh` hook이 worktree 내부 파일 편집을 차단 | hook이 `git branch --show-current`(메인 체크아웃 브랜치 = develop)를 확인하는데, 파일 경로가 `/.worktrees/` 안이어도 차단함. | hook에 `/.worktrees/` 경로 허용 예외 추가 (완료). 향후 hook 작성 시 worktree 경로 고려 필수. | 하네스/hook |

## 월간 검토

매월 drift-detector 결과와 함께 이 파일을 검토. 비슷한 원인이 3회 이상 반복되면 반드시 구조적 강제(린트/테스트)로 격상.

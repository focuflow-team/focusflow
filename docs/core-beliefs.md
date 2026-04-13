---
name: Core Beliefs
description: FocusFlow 레포에서 에이전트가 작업할 때 지켜야 하는 운영 원칙 헌법
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Core Beliefs — FocusFlow Agent 운영 원칙

이 문서는 모든 에이전트(Claude/Codex/Gemini 등)가 이 레포에서 작업할 때의 **헌법**입니다.
충돌 시 우선순위: **사용자 지시 > 이 문서 > 기본 시스템 프롬프트**.

## 1. Agent = Model + Harness

모델은 블랙박스입니다. 우리가 통제하는 것은 **환경(하네스)**뿐입니다. 실수를 줄이려면 "더 잘해라"가 아니라 **누락된 능력을 식별 → 가시화(문서) → 기계적 강제(린트/테스트)** 한다.

## 2. In-repo 지식만이 실재한다

Slack, 회의록, 사람의 머릿속에만 있는 지식은 에이전트에게 존재하지 않는다. 모든 규약은 **버전 관리되는 파일**로 표현되어야 한다.

## 3. 컨텍스트는 희소 자원이다

- 루트 `CLAUDE.md`는 ≤100줄 목차. 본문을 넣지 마라.
- 도메인 규칙은 해당 디렉터리의 `CLAUDE.md`에 있어야 한다 (예: `src/lib/supabase/CLAUDE.md`).
- "모든 것이 중요"하면 아무것도 중요하지 않다. 점진적 공개(progressive disclosure).

## 4. 제약은 속도를 만든다

명시적 경계(Supabase 3-factory, 보호 라우트 `/app/*`, 한국어 UI)는 에이전트의 탐색 공간을 좁혀 **더 빠르게** 올바른 답에 도달하게 한다.

## 5. 재발 방지 루프

에이전트(또는 사람)가 같은 실수를 두 번 하면:

1. `docs/agent-failures.md`에 로그
2. `docs/golden-principles.md`에 원칙 추가
3. 가능하면 린트/depcruise/테스트로 **구조적으로 불가능**하게 만든다

## 6. 보수적 기술을 우선한다

Next.js App Router · Supabase SSR · PortOne V2 · Stripe Subscriptions — 이 스택을 우회하는 "똑똑한 대안"은 기본 거절. 대체는 ADR 필요.

## 7. 한국어 우선

모든 사용자 대면 텍스트(UI/에러 메시지/이메일)는 **한국어**. 코드 주석·문서·커밋 메시지는 한글/영어 모두 허용. 단 공용 식별자는 영어.

## 8. 고위험 경계

아래 변경은 기본적으로 **사람 승인 필요** (`docs/escalation-policy.md`):

- 인증 경계 (`middleware.ts`, `(auth)/layout.tsx`, `app/layout.tsx`)
- 결제 (PortOne/Stripe webhook, 금액·플랜 매핑, billing key 발급)
- DB 마이그레이션 / RLS 정책
- `SUPABASE_SERVICE_ROLE_KEY` 신규 사용처

## 9. 실패는 과정의 일부, 침묵은 아니다

작업 도중 스스로 넘어졌다면 즉시 `docs/agent-failures.md`에 기록하고 하네스를 강화한 **뒤** 계속한다. 조용히 넘어가면 다음 에이전트가 같은 함정에 빠진다.

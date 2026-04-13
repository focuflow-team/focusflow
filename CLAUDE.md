---
name: FocusFlow root context
description: Root entrypoint — table of contents only. Scoped docs live under docs/ and nested CLAUDE.md files
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# CLAUDE.md — FocusFlow

이 파일은 **목차**입니다. 규칙 본문은 `docs/`에 있고, 도메인 규칙은 해당 디렉터리의 `CLAUDE.md`에 있습니다.
에이전트는 **작업 도메인에 해당하는 파일만** 읽으세요.

## 읽어야 할 순서

1. `AGENTS.md` — Next.js 16은 훈련 데이터와 다릅니다. 코드 전에 먼저 읽으세요.
2. `docs/core-beliefs.md` — 이 레포의 에이전트-우선 운영 원칙 (헌법).
3. `docs/architecture.md` — 도메인·레이어링 지도.
4. `docs/golden-principles.md` — "이건 하지 마세요" 누적 리스트.

## 작업 유형별 진입점

| 작업                  | 먼저 읽을 파일                                                                          |
| --------------------- | --------------------------------------------------------------------------------------- |
| 새 API route 추가     | `src/app/api/CLAUDE.md`, `docs/playbooks/add-api-route.md`                              |
| Supabase 관련 코드    | `src/lib/supabase/CLAUDE.md`, `docs/design-docs/ADR-0001-supabase-client-boundaries.md` |
| 결제 (PortOne/Stripe) | `docs/playbooks/payment-change.md`, `docs/escalation-policy.md`                         |
| 웹훅 수정             | `docs/playbooks/webhook-signature-verification.md`                                      |
| 인증/보호 라우트      | `docs/design-docs/ADR-0002-auth-boundary.md`                                            |
| Next.js 16 API 확인   | `node_modules/next/dist/docs/` 또는 `docs/references/nextjs-16-llms.txt`                |
| DB 스키마 이해        | `docs/generated/db-schema.md` (자동생성)                                                |
| 구현 계획 수립        | `docs/exec-plans/active/` (신규 작업은 여기 파일 1개 생성)                              |

## 에스컬레이션

다음 변경은 반드시 휴먼에게 승인받으세요 — `docs/escalation-policy.md` 참고:

- DB 마이그레이션, RLS 정책 변경
- 결제 금액·플랜 매핑·웹훅 서명 검증
- 인증 경계 (`middleware.ts`, `src/app/app/layout.tsx`)
- `SUPABASE_SERVICE_ROLE_KEY` 사용 범위

## 5-step loop (ADR-0005)

모든 코드 작업은 이 순서:

```bash
bash scripts/start-task.sh <task-id>   # 1. worktree + exec-plan (코드 전에 플랜)
#   구현은 .worktrees/<task-id> 안에서. 테스트 필수.
bash scripts/verify-task.sh            # 4. 모든 체크 → logs/<task-id>/
# Conventional Commits → 머지 →
bash scripts/complete-task.sh <task-id>
```

Hook 강제: master 직접 커밋 차단, `src/` 변경 시 exec-plan 필수, commit-msg Conventional Commits. 세부: `docs/design-docs/ADR-0005-task-lifecycle.md`.

## 명령어

```bash
npm run dev          # 개발 서버
npm run test         # Vitest
npm run lint         # ESLint
npm run depcruise    # 아키텍처 경계
npm run verify-task  # 5-step loop Step 4
```

실패 시 `logs/<task-id>/verify-report-*.txt` 확인 → 근본원인 수정 → 재시도.

## 금지

- 이 파일에 규칙 본문을 추가하지 마세요. 100줄이 넘으면 목차가 아닙니다. 규칙은 `docs/`에 쓰고 여기선 링크만.
- 기존 문서를 직접 덮어쓰기 전에 `verification_status`와 `last_verified` 프런트매터를 확인하세요.

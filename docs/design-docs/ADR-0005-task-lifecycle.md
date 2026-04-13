---
name: ADR-0005 5-step task lifecycle
description: worktree/exec-plan/verify/commit-msg 강제 루프의 근거와 구조
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# ADR-0005 — 5-step Task Lifecycle

- 상태: Accepted
- 날짜: 2026-04-13

## Context

하네스 Axes 1–5는 "에이전트가 알아야 할 것"을 문서화·강제했지만, **실제 작업 흐름 자체**는 강제하지 않았다. 결과: 에이전트가 코드부터 쓰기 시작하고, 테스트를 건너뛰며, 검증 전에 커밋하려는 경향이 남는다. 원 해네스 프롬프트(`docs/meta/harness-prompt.md`)의 5-step loop를 구조적으로 강제한다.

## Decision

**5-step loop**:

1. `scripts/start-task.sh <task-id>` — worktree + feature branch + exec-plan 스켈레톤.
2. worktree 안에서만 구현. master 직접 커밋 금지.
3. 테스트 필수(Vitest + Testing Library). 기능=happy+edge, 버그=재현 테스트, 리팩터=보존 테스트.
4. `scripts/verify-task.sh` — 전체 검증(typecheck/lint/prettier/depcruise/vitest/drift) + `logs/<task-id>/` 기록 + 보고서.
5. Conventional Commits → 머지 → `scripts/complete-task.sh <task-id>` (active→completed 이동, worktree 제거).

**Hook 강제 (Husky)**:

- `.husky/pre-commit`:
  - main/master 커밋 차단
  - `src/` 변경 시 `docs/exec-plans/active|completed/<task-id>.md` 존재 검증 (task-id = 브랜치 `<type>/<rest>`의 `<rest>`)
  - lint-staged(eslint --fix + prettier)
  - `src/` 변경 시 `vitest run --passWithNoTests`
- `.husky/commit-msg`: Conventional Commits 정규식. merge/revert/fixup/squash/WIP 예외.
- `.husky/pre-push`: 결제/인증/Supabase 경계 변경 감지 시 `scripts/self-review.sh`.

**Naming**:

- branch: `<type>/<task-id>` (`type` ∈ feat|fix|refactor|perf|chore|docs|style|build|ci)
- plan: `docs/exec-plans/active/<task-id>.md` (type prefix 없음 — 여러 타입의 후속 작업이 한 ID에 묶일 수 있으므로)
- worktree: `.worktrees/<task-id>`
- logs: `logs/<task-id>/`

## Consequences

- 긍정: Step 스킵이 구조적으로 불가능. exec-plan 누락으로 src 커밋 불가. master 직접 커밋 불가. Non-Conventional 커밋 메시지 거부.
- 부정: 사소한 수정(오타 1건)조차 worktree를 만들어야 함 → 비용. 완화: `docs` 루트 타입 변경은 `docs/exec-plans/active/*` 강제 대상에서 제외 (pre-commit은 `src/` 변경만 본다).
- `.worktrees/`, `logs/`는 gitignore. CI는 logs 없이 별도 실행.

## Enforcement

| 규칙                    | 위치                         | 강제                       |
| ----------------------- | ---------------------------- | -------------------------- |
| master 커밋 금지        | `.husky/pre-commit`          | fail                       |
| exec-plan 필수          | `.husky/pre-commit`          | fail                       |
| 테스트 통과             | `.husky/pre-commit` (vitest) | fail                       |
| Conventional Commits    | `.husky/commit-msg`          | fail                       |
| 결제/인증 경계 pre-push | `.husky/pre-push`            | fail on self-review fail   |
| verify 보고서           | `scripts/verify-task.sh`     | 실패 시 exit 1 + 로그 경로 |

## Escape hatches

- 긴급 시에도 `--no-verify` 사용 금지 (AGENTS 정책). 긴급 핫픽스는 PR 생성 후 머지 승인자가 오버라이드.
- 체크 자체가 잘못됐다고 판단되면 **ADR**로 해당 규칙 수정 → hook 업데이트. 회피 금지.

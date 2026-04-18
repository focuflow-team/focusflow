---
name: harness-task
description: ADR-0005 5-step loop 진입점. 사용자 요청을 분석해 task-id·type을 제안하고 worktree + exec-plan 생성 후 구현을 시작합니다.
argument-hint: '[자연어 작업 설명 또는 task-id] [type]'
---

# Harness Task — 5-Step Loop 진입점

> Source of truth: `docs/meta/harness-prompt.md` (v4 runtime prompt)

## Purpose

ADR-0005의 5-step task lifecycle을 강제합니다.
사용자가 코드 변경을 요청하면 바로 Edit/Write로 수정하지 않고 반드시 이 흐름을 따릅니다:

1. **Task 파라미터 확정** — 사용자 요청에서 task-id·type을 자동 제안하고 승인
2. **Worktree + branch 생성** — `scripts/start-task.sh`
3. **Exec-plan 작성** — 코드보다 먼저. 플랜 없으면 커밋 불가.
4. **Worktree 안에서 구현 + 테스트**
5. **Verify → Commit**
6. **Code Review** — `superpowers:requesting-code-review` 스킬로 AI 리뷰. 지적사항 수정 후 재커밋.
7. **Complete**

---

## When to Use

- 사용자가 `src/` 또는 설정 파일을 변경하는 **모든** 코드 요청
- `/harness-task` 또는 `/harness-task <설명>` 으로 직접 호출 시

**Skip 조건** (이 스킬 없이 진행 가능):

- 사용자가 명시적으로 "하네스 없이", "가볍게", "그냥 고쳐줘" 요청
- `docs/`, `.claude/`, `scripts/` 만 변경하는 문서 전용 작업

---

## Step 1: Task 파라미터 확정 (AI가 자동 제안)

인수 없이 `/harness-task`를 실행하거나 자연어 설명이 오면:

### 1a. task-id 자동 생성

사용자 요청에서 kebab-case task-id를 생성합니다.

| 요청 예시               | 제안 task-id            |
| ----------------------- | ----------------------- |
| "로그인 버그 수정해줘"  | `fix-login-bug`         |
| "다크모드 추가"         | `add-dark-mode`         |
| "결제 웹훅 재시도 로직" | `payment-webhook-retry` |
| "인증 레이어 리팩터링"  | `refactor-auth-layer`   |

**명명 규칙:** 영소문자·숫자·하이픈만, 2~49자, 설명적으로

### 1b. type 선택지 제시

type을 아래 표로 제시하고 선택받습니다:

| 번호 | type       | 사용 시점                     |
| ---- | ---------- | ----------------------------- |
| 1    | `feat`     | 새 기능 추가                  |
| 2    | `fix`      | 버그 수정                     |
| 3    | `refactor` | 동작 변경 없는 코드 구조 개선 |
| 4    | `perf`     | 성능 개선                     |
| 5    | `chore`    | 빌드/설정/의존성 변경         |
| 6    | `docs`     | 문서만 변경                   |
| 7    | `test`     | 테스트 추가/수정              |
| 8    | `style`    | 포매팅 (동작 무변)            |
| 9    | `build`    | 빌드 시스템 변경              |
| 10   | `ci`       | CI/CD 설정 변경               |

### 1c. 확인 메시지 출력

```
## Harness Task 시작

| 항목 | 제안값 |
|------|--------|
| task-id | `fix-login-bug` |
| type | `fix` |
| branch | `fix/fix-login-bug` |
| worktree | `.worktrees/fix-login-bug/` |
| exec-plan | `docs/exec-plans/active/fix-login-bug.md` |

이대로 진행할까요? (task-id나 type을 바꾸려면 알려주세요)
```

승인 후 Step 2로 진행합니다.

---

## Step 2: Worktree + Branch 생성

```bash
bash scripts/start-task.sh <task-id> <type>
```

**예시:**

```bash
bash scripts/start-task.sh fix-login-bug fix
bash scripts/start-task.sh add-dark-mode feat
bash scripts/start-task.sh payment-webhook-retry feat
```

**성공 확인:**

```
✅ Task 준비 완료
  - branch:    fix/fix-login-bug
  - worktree:  .worktrees/fix-login-bug
  - exec-plan: docs/exec-plans/active/fix-login-bug.md
```

---

## Step 3: Exec-Plan 작성 (코드 전에 필수)

`docs/exec-plans/active/<task-id>.md` 파일을 열어 스켈레톤을 채웁니다.

**필수 필드 (v4 표준):**

```markdown
## Goal

한 문장으로 해결하려는 문제.

## Approach

선택한 전략과 **왜**. 거절한 대안과 이유도 여기에.

## Sub-tasks

1. ...
2. ...
3. ...

## Completion Criteria

- [ ] 테스트 가능한 조건 1
- [ ] 테스트 가능한 조건 2
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- src/...
- docs/...

## Open Questions

- 사람에게 묻고 진행할 항목 (없으면 "없음")
```

**에스컬레이션 체크** — 해당하면 Open Questions에 기재 후 사용자 승인 먼저:

- DB 마이그레이션 / RLS 정책 변경
- 결제 금액·플랜 매핑·웹훅 서명 검증 수정
- `middleware.ts`, `src/app/app/layout.tsx` 수정
- `SUPABASE_SERVICE_ROLE_KEY` 사용 범위 확장
- 외부 계약 변경 (API 형태, DB 스키마, 웹훅 페이로드)
- 새 프로덕션 의존성 추가

**★ 플랜을 커밋하기 전까지 `src/` 코드를 작성하지 않습니다.** pre-commit hook이 exec-plan 파일 존재를 검증합니다.

---

## Step 4: 컨텍스트 로드 → 구현 → 테스트

### 컨텍스트 읽기 순서 (구현 전 매번)

1. `CLAUDE.md` (루트 — 목차)
2. `docs/architecture.md` — 레이어 규칙 (위반 금지)
3. 수정할 디렉터리의 scoped `CLAUDE.md`
4. 위에서 링크된 관련 design docs

### 구현 규칙

- 모든 편집은 `.worktrees/<task-id>/` 안에서만
- 레이어 의존성 방향 준수 (`architecture.md`)
- 새 패턴 도입 전 코드베이스 Grep으로 기존 패턴 탐색
- 플랜이 틀렸다면 **플랜 먼저 수정 → 코딩 재개** (조용한 드리프트 금지)

### 테스트 요구사항 (타입별, 생략 불가)

| 작업 유형           | 필수 테스트                                          |
| ------------------- | ---------------------------------------------------- |
| 새 기능 (feat)      | Happy path + edge case 1개 이상 + 입력값 검증        |
| 버그 수정 (fix)     | **master에서 실패하고 수정 후 통과**하는 재현 테스트 |
| 리팩터링 (refactor) | 기존 동작이 보존됨을 확인하는 보존 테스트            |

테스트 없이 `src/` 파일 커밋 시 pre-commit hook이 차단합니다.
테스트가 진짜 필요 없다고 판단되면 exec-plan Open Questions에 이유를 적고 사용자에게 확인받습니다.

---

## Step 5: Verify

구현 + 테스트 완료 후:

```bash
bash scripts/verify-task.sh
```

**6개 검사:**

| 검사               | 실패 시 대응                        |
| ------------------ | ----------------------------------- |
| typecheck          | 타입 오류 수정                      |
| eslint             | lint 오류 수정 (증상 아닌 근본원인) |
| prettier           | `npx prettier --write .` 실행       |
| dependency-cruiser | ADR-0001/0003 레이어 위반 구조 수정 |
| vitest             | 실패 테스트 수정                    |
| drift-detector     | 문서 경로/신선도 문제 수정          |

실패 시: `logs/<task-id>/verify-report-*.txt` → 개별 로그 → 근본원인 수정 → 재실행

**같은 검사가 3번 연속 실패하면 멈추고 사용자에게 에스컬레이션합니다.**

### 커밋

```bash
git add <변경 파일들>
git commit -m "<type>(<scope>): <설명>"
```

Conventional Commits 필수. commit-msg hook이 검증합니다.

---

## Step 6: Code Review (생략 불가)

커밋 완료 후 **반드시** AI 코드 리뷰를 실행합니다:

```
Skill: superpowers:requesting-code-review
```

**리뷰 대상:** 이번 task에서 변경된 모든 `src/` 파일 (git diff로 확인)

**리뷰 후 처리:**

| 지적 유형        | 대응                                                        |
| ---------------- | ----------------------------------------------------------- |
| 버그·보안 취약점 | **반드시 수정** → 재커밋 → Step 5로 돌아가 verify 재실행    |
| 코드 품질·가독성 | 수정 권장. 수정 않으면 exec-plan Open Questions에 이유 기록 |
| 스타일·포매팅    | prettier/eslint가 이미 처리했으므로 무시 가능               |

**건너뛸 수 없습니다.** 코드 리뷰 없이 Step 7로 진행하는 것은 금지입니다.

---

## Step 7: Complete

검증 + 코드 리뷰 완료 후 바로 실행합니다 (GitHub PR 불필요):

```bash
bash scripts/complete-task.sh <task-id>
```

수행 순서:

1. 워크트리 브랜치를 **develop에 로컬 머지** (`--no-ff`)
2. 피처 브랜치 삭제
3. exec-plan `active/` → `completed/` 이동, `last_verified` 업데이트
4. worktree 제거

**⚠️ 이 스크립트를 건너뛰면 `active/`가 stale 상태로 누적됩니다.** 커밋 직후 즉시 실행하세요. 실수로 건너뛰었다면 다음 작업 전에 반드시 실행하세요.

`docs/exec-plans/active/`에 진행 중이 아닌 파일이 남아 있는 것은 하네스 위반입니다.

---

## Recovery Procedures

**"EXEC_PLAN not found"로 커밋 차단:**
브랜치가 `feat/foo`인데 `docs/exec-plans/active/foo.md`가 없습니다.
→ `start-task.sh`를 재실행하거나 플랜 파일을 수동으로 생성하세요.

**"cannot commit to master"로 커밋 차단:**
master 브랜치에 있습니다. `start-task.sh`를 실행하고 worktree로 이동하세요.

**verify-task.sh가 계속 같은 검사에서 실패:**
`logs/<task-id>/` 안의 해당 검사 로그를 `tail -15`로 확인합니다.
아키텍처 위반이면 구조를 수정하세요 (테스트를 silencing하거나 검사를 비활성화 금지).

**플랜이 틀렸음을 구현 중 발견:**
exec-plan의 Approach 섹션을 수정하고 Revisions 섹션에 변경 내용을 기록합니다. 조용히 드리프트하지 않습니다.

**작업이 exec-plan 200줄을 초과할 것 같음:**
멈추고 사용자에게 보고합니다. 복수의 task로 분해합니다.

---

## Meta-rule: agent-failures.md

구현 중 하네스가 잡지 못한 실수를 발견하면 `complete-task.sh` 실행 전에 `docs/agent-failures.md`에 기록합니다:

```markdown
## YYYY-MM-DD — <짧은 증상>

- Task: <task-id>
- 증상: 무슨 일이 일어났는가
- 근본 원인: 하네스가 왜 못 잡았는가
- 강화책: 추가할 규칙/테스트/문서 (ADR 링크 또는 "제안")
```

이것이 하네스가 진화하는 방법입니다. 이 단계를 건너뛰는 것은 하네스의 핵심을 놓치는 것입니다.

---

## What NOT to Do

- `git commit --no-verify`로 hook 우회 금지. 절대.
- worktree 안에서 현재 작업과 무관한 `docs/` 파일 수정 금지. 문서 변경은 별도 task.
- Step 3 이전에 코드 작성 금지. 플랜 먼저.
- verify 보고서 없이 PR 머지 금지.
- **Step 6 (Code Review) 없이 Step 7 (Complete) 실행 금지.** "작은 변경", "명백한 코드" 등의 이유로 건너뛰는 것도 금지.
- **`docs/exec-plans/active/*.md`를 stale 상태로 방치 금지.** 작업이 끝났으면 그 자리에서 `complete-task.sh`를 실행하세요. 나중에 하겠다는 생각은 누적의 시작입니다.
- 기존 나쁜 코드를 발견했을 때 현재 task 범위에서 슬쩍 수정 금지. `docs/agent-failures.md`에 기록하고 별도 task로.

---

## Related Files

| File                                          | Purpose                                            |
| --------------------------------------------- | -------------------------------------------------- |
| `scripts/start-task.sh`                       | worktree + branch + exec-plan 스켈레톤 생성        |
| `scripts/verify-task.sh`                      | 6개 검증 + `logs/<task-id>/` 보고서                |
| `scripts/complete-task.sh`                    | exec-plan 아카이브 + worktree 제거                 |
| `docs/meta/harness-prompt.md`                 | v4 runtime prompt 원본 (이 스킬의 source of truth) |
| `docs/design-docs/ADR-0005-task-lifecycle.md` | 5-step loop 근거                                   |
| `docs/agent-failures.md`                      | 에이전트 실수 로그 (하네스 진화의 연료)            |
| `docs/escalation-policy.md`                   | 사용자 승인이 필요한 변경 목록                     |
| `.claude/hooks/pre-edit-check.sh`             | develop/main 브랜치에서 src/ 직접 편집 차단        |

---

## Exceptions

1. **긴급 핫픽스**: `docs/escalation-policy.md` 확인 후 사용자가 명시적으로 bypass를 승인한 경우. 이때도 `--no-verify` 금지.
2. **문서 전용 변경**: `docs/`, `.claude/`, `scripts/` 파일만 변경할 때는 worktree 불필요.
3. **사용자 명시적 bypass**: "하네스 없이", "가볍게", "그냥 고쳐줘" 요청 시.

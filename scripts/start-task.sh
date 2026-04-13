#!/usr/bin/env bash
# 5-step loop Step 1 — task worktree + feature branch + exec-plan skeleton.
# 사용: bash scripts/start-task.sh <task-id> [type]
#   <task-id>  kebab-case (예: user-auth, payment-webhook-retry)
#   [type]     feat(기본) | fix | refactor | perf | chore | docs | style | build | ci
set -euo pipefail

TASK_ID="${1:-}"
TYPE="${2:-feat}"

if [ -z "$TASK_ID" ]; then
  echo "❌ usage: bash scripts/start-task.sh <task-id> [type]"
  exit 1
fi

if ! [[ "$TASK_ID" =~ ^[a-z0-9][a-z0-9-]{1,48}$ ]]; then
  echo "❌ task-id는 kebab-case, 2-49자여야 합니다: $TASK_ID"
  exit 1
fi

case "$TYPE" in
  feat|fix|refactor|perf|chore|docs|style|build|ci) ;;
  *)
    echo "❌ unknown type: $TYPE (feat|fix|refactor|perf|chore|docs|style|build|ci 중 하나)"
    exit 1
    ;;
esac

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BRANCH="${TYPE}/${TASK_ID}"
WORKTREE=".worktrees/${TASK_ID}"
PLAN="docs/exec-plans/active/${TASK_ID}.md"

if [ -d "$WORKTREE" ]; then
  echo "❌ worktree 이미 존재: $WORKTREE"
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "❌ 브랜치 이미 존재: $BRANCH"
  exit 1
fi

BASE="$(git symbolic-ref --short HEAD 2>/dev/null || echo main)"
if [ "$BASE" != "main" ] && [ "$BASE" != "master" ] && [ "$BASE" != "develop" ]; then
  echo "⚠️  현재 브랜치($BASE)에서 분기합니다. main에서 분기하려면 먼저 git switch main."
fi

mkdir -p .worktrees docs/exec-plans/active

git worktree add -b "$BRANCH" "$WORKTREE" "$BASE" >/dev/null

PLAN_ABS="${WORKTREE}/${PLAN}"
mkdir -p "$(dirname "$PLAN_ABS")"
TODAY="$(date -u +%Y-%m-%d)"
cat > "$PLAN_ABS" <<EOF
---
name: ${TASK_ID}
description: <한 문장 설명>
verification_status: draft
last_verified: ${TODAY}
owner: <your-handle>
branch: ${BRANCH}
---

# Exec Plan — ${TASK_ID}

## Goal
<한 문장으로 해결하려는 문제>

## Approach
<선택한 전략과 **왜**. 거절한 대안과 이유도 여기에.>

## Sub-tasks
1. ...
2. ...
3. ...

## Completion Criteria
- [ ] <테스트 가능한 조건 1>
- [ ] <테스트 가능한 조건 2>
- [ ] \`bash scripts/verify-task.sh\` 녹색

## Affected Files (expected)
- src/...
- docs/...

## Open Questions
- <사람에게 묻고 진행할 항목>

## Revisions
(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log
| 일시 | 단계 | 결과 |
|---|---|---|
| ${TODAY} | start | 플랜 생성 |
EOF

cat <<EOF

✅ Task 준비 완료
  - branch:    $BRANCH
  - worktree:  $WORKTREE
  - exec-plan: $PLAN

다음 단계:
  cd $WORKTREE
  # 1) $PLAN 을 먼저 채우세요 (코드 수정 전에).
  # 2) CLAUDE.md → docs/architecture.md → 관련 scoped CLAUDE.md 순서로 컨텍스트 로드.
  # 3) 구현 후 bash scripts/verify-task.sh
EOF

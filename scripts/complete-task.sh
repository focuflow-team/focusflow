#!/usr/bin/env bash
# 5-step loop Step 5 — develop 로컬 머지, active→completed 이동, worktree 정리.
# 사용: bash scripts/complete-task.sh <task-id>
set -euo pipefail

TASK_ID="${1:-}"
if [ -z "$TASK_ID" ]; then
  echo "❌ usage: bash scripts/complete-task.sh <task-id>"
  exit 1
fi

# git rev-parse --show-toplevel returns the worktree root if run inside a worktree.
# We need the MAIN repo root, which is always the parent of .worktrees/.
# Use --git-common-dir to find the shared git dir, then derive the main root.
COMMON_DIR="$(git rev-parse --git-common-dir)"
# common-dir is <main-repo>/.git — go up one level
REPO_ROOT="$(cd "$COMMON_DIR/.." && pwd)"
cd "$REPO_ROOT"

# ── 1. develop 로컬 머지 ────────────────────────────────────────────────────
WORKTREE_PATH=".worktrees/${TASK_ID}"

if [ -d "$WORKTREE_PATH" ]; then
  TASK_BRANCH=$(git -C "$WORKTREE_PATH" symbolic-ref --short HEAD 2>/dev/null || true)

  if [ -n "$TASK_BRANCH" ] && [ "$TASK_BRANCH" != "develop" ] && [ "$TASK_BRANCH" != "main" ]; then
    # 메인 체크아웃을 develop으로 전환
    CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || true)
    if [ "$CURRENT_BRANCH" != "develop" ]; then
      echo "🔀 develop으로 전환..."
      git checkout develop
    fi

    echo "🔀 develop에 머지: $TASK_BRANCH"
    git merge --no-ff "$TASK_BRANCH" -m "Merge branch '$TASK_BRANCH' into develop"
    git branch -d "$TASK_BRANCH" 2>/dev/null || true
    echo "✅ 머지 완료 및 브랜치 삭제: $TASK_BRANCH"
  fi
fi

ACTIVE="docs/exec-plans/active/${TASK_ID}.md"
COMPLETED="docs/exec-plans/completed/${TASK_ID}.md"

if [ ! -f "$ACTIVE" ]; then
  echo "⚠️  $ACTIVE 없음. 이미 완료됐거나 이름이 다릅니다."
else
  mkdir -p docs/exec-plans/completed
  git mv "$ACTIVE" "$COMPLETED" 2>/dev/null || mv "$ACTIVE" "$COMPLETED"
  # 프런트매터 status를 verified로
  TODAY="$(date -u +%Y-%m-%d)"
  if command -v sed >/dev/null 2>&1; then
    sed -i.bak -E "s/^last_verified:.*/last_verified: ${TODAY}/" "$COMPLETED" || true
    sed -i.bak -E "s/^verification_status:.*/verification_status: verified/" "$COMPLETED" || true
    rm -f "${COMPLETED}.bak"
  fi
  echo "📄 exec-plan 이동: $ACTIVE → $COMPLETED"
fi

if [ -d "$WORKTREE_PATH" ]; then
  if git worktree list --porcelain | grep -q "worktree $(pwd)/$WORKTREE_PATH"; then
    git worktree remove "$WORKTREE_PATH" --force
    echo "🧹 worktree 제거: $WORKTREE_PATH"
  else
    rm -rf "$WORKTREE_PATH"
    echo "🧹 orphan 디렉터리 제거: $WORKTREE_PATH"
  fi
fi

# logs 폴더는 유지 (진단 자료). 불필요하면 수동 삭제.
if [ -d "logs/${TASK_ID}" ]; then
  echo "📦 logs/${TASK_ID}/ 보존됨 (필요 없으면 수동 삭제)"
fi

cat <<EOF

✅ Task 완료: ${TASK_ID}

다음 에이전트를 위해:
  - completed plan:   $COMPLETED
  - quality-score:    docs/quality-score.md 해당 도메인 점수 재평가 고려
  - agent-failures:   이번 작업에서 하네스가 놓친 실수가 있었다면 docs/agent-failures.md에 기록
EOF

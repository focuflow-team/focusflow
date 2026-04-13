#!/usr/bin/env bash
# 5-step loop Step 5 — active→completed 이동, worktree 정리.
# 사용: bash scripts/complete-task.sh <task-id>
# 전제: 브랜치는 이미 main/develop로 머지됨.
set -euo pipefail

TASK_ID="${1:-}"
if [ -z "$TASK_ID" ]; then
  echo "❌ usage: bash scripts/complete-task.sh <task-id>"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

ACTIVE="docs/exec-plans/active/${TASK_ID}.md"
COMPLETED="docs/exec-plans/completed/${TASK_ID}.md"
WORKTREE=".worktrees/${TASK_ID}"

if [ ! -f "$ACTIVE" ]; then
  echo "⚠️  $ACTIVE 없음. 이미 완료됐거나 이름이 다릅니다."
else
  mkdir -p docs/exec-plans/completed
  git mv "$ACTIVE" "$COMPLETED" 2>/dev/null || mv "$ACTIVE" "$COMPLETED"
  # 프런트매터 status를 verified로
  TODAY="$(date -u +%Y-%m-%d)"
  if command -v sed >/dev/null 2>&1; then
    # last_verified 업데이트
    sed -i.bak -E "s/^last_verified:.*/last_verified: ${TODAY}/" "$COMPLETED" || true
    sed -i.bak -E "s/^verification_status:.*/verification_status: verified/" "$COMPLETED" || true
    rm -f "${COMPLETED}.bak"
  fi
  echo "📄 exec-plan 이동: $ACTIVE → $COMPLETED"
fi

if [ -d "$WORKTREE" ]; then
  if git worktree list --porcelain | grep -q "worktree $(pwd)/$WORKTREE"; then
    git worktree remove "$WORKTREE" --force
    echo "🧹 worktree 제거: $WORKTREE"
  else
    rm -rf "$WORKTREE"
    echo "🧹 orphan 디렉터리 제거: $WORKTREE"
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

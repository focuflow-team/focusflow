#!/usr/bin/env bash
# 5-step loop Step 4 — 전체 검증. 결과를 logs/<task-id>/에 저장.
# 사용: bash scripts/verify-task.sh [--with-build]
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ] || [ "$BRANCH" = "develop" ]; then
  echo "⚠️  기본 브랜치($BRANCH)에서 실행 중. task-id 지정 불가 → logs/_adhoc에 저장."
  TASK_ID="_adhoc"
else
  TASK_ID="${BRANCH#*/}"
fi

LOG_DIR="logs/${TASK_ID}"
mkdir -p "$LOG_DIR"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="${LOG_DIR}/verify-report-${TS}.txt"

PASS=()
FAIL=()
SKIP=()

run_check() {
  local name="$1"
  shift
  local log="${LOG_DIR}/${name}.log"
  echo ""
  echo "▶ $name"
  if "$@" >"$log" 2>&1; then
    echo "  ✅ $name"
    PASS+=("$name")
  else
    echo "  ❌ $name  (log: $log)"
    FAIL+=("$name")
  fi
}

skip_check() {
  local name="$1"; local reason="$2"
  echo "⏭  $name — $reason"
  SKIP+=("$name ($reason)")
}

run_check "typecheck"          npm run typecheck
run_check "eslint"             npm run lint
run_check "prettier"           npx prettier --check .
run_check "dependency-cruiser" npm run depcruise
run_check "vitest"             npx vitest run --reporter=default
run_check "drift-detector"     npm run drift

if [ "${1:-}" = "--with-build" ]; then
  run_check "next-build" npm run build
else
  skip_check "next-build" "--with-build 미지정"
fi

{
  echo "Verify report — task=$TASK_ID  branch=$BRANCH  at=$TS"
  echo "============================================================"
  echo ""
  echo "PASS (${#PASS[@]}):"
  [ ${#PASS[@]} -gt 0 ] && printf '  ✅ %s\n' "${PASS[@]}"
  echo ""
  echo "FAIL (${#FAIL[@]}):"
  [ ${#FAIL[@]} -gt 0 ] && printf '  ❌ %s\n' "${FAIL[@]}"
  echo ""
  echo "SKIP (${#SKIP[@]}):"
  [ ${#SKIP[@]} -gt 0 ] && printf '  ⏭  %s\n' "${SKIP[@]}"
  echo ""
  if [ ${#FAIL[@]} -gt 0 ]; then
    echo "----- 실패 상세 (각 로그 마지막 15줄) -----"
    for name in "${FAIL[@]}"; do
      echo ""
      echo "### $name"
      tail -n 15 "${LOG_DIR}/${name}.log" || true
    done
  fi
} | tee "$REPORT"

echo ""
if [ ${#FAIL[@]} -gt 0 ]; then
  echo "❌ verification 실패. 보고서: $REPORT"
  exit 1
fi
echo "✅ verification 통과. 보고서: $REPORT"

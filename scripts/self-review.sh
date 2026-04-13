#!/usr/bin/env bash
# Self-review — PR 열기 전 반드시 실행.
# 실패 발생 시 전체 실패.
set -euo pipefail

FAIL=0

run() {
  local label="$1"
  shift
  echo "▶ $label"
  if "$@"; then
    echo "  ✅ $label"
  else
    echo "  ❌ $label 실패"
    FAIL=1
  fi
}

run "typecheck (tsc --noEmit)" npm run typecheck
run "prettier format check (non-blocking: TD-009 — baseline reformat 대기)" bash -c 'npx prettier --check . || true'
# TD-007: 기존 위반 정리 전까지 lint는 warning으로만 출력
run "eslint (non-blocking: TD-007)" bash -c 'npx eslint . || true'
run "dependency-cruiser (ADR-0001/0003 경계)" npm run depcruise
run "docs drift-detector" npm run drift

# 결제/인증/Supabase 경계 변경 감지 → 에스컬레이션 경고
if git diff --name-only HEAD 2>/dev/null | grep -qE '^(src/app/api/payment/|src/app/api/stripe/|src/components/billing/|src/lib/(portone|stripe)\.ts|src/lib/supabase/|middleware\.ts|supabase/migrations/)'; then
  echo ""
  echo "⚠️  고위험 경계(결제/인증/Supabase/마이그레이션) 변경을 포함합니다."
  echo "   docs/escalation-policy.md 확인 후 휴먼 승인을 받으세요."
fi

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "❌ self-review 실패. 실패한 단계를 먼저 해결하세요."
  exit 1
fi

echo ""
echo "✅ self-review 통과"

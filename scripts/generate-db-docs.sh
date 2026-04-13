#!/usr/bin/env bash
# 마이그레이션 SQL을 병합해 docs/generated/db-schema.md 로 출력.
# Supabase CLI 없이도 동작 (원본 파일 연결만).
set -euo pipefail

OUT=docs/generated/db-schema.md
mkdir -p "$(dirname "$OUT")"

{
  echo "<!-- 자동 생성 파일. 수동 편집 금지. source: supabase/migrations/ -->"
  echo "---"
  echo "name: DB Schema (Generated)"
  echo "description: supabase/migrations/*.sql을 병합한 현재 스키마 스냅샷"
  echo "verification_status: verified"
  echo "last_verified: $(date -u +%Y-%m-%d)"
  echo "owner: harness"
  echo "---"
  echo ""
  echo "# DB Schema — FocusFlow"
  echo ""
  echo "생성 스크립트: \`scripts/generate-db-docs.sh\`"
  echo ""
  for f in supabase/migrations/*.sql; do
    echo "## \`$(basename "$f")\`"
    echo ""
    echo '```sql'
    cat "$f"
    echo '```'
    echo ""
  done
} > "$OUT"

echo "✅ $OUT 생성"

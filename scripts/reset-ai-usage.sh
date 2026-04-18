#!/bin/sh
# reset-ai-usage.sh — 오늘의 AI 코칭 분석 횟수를 초기화합니다.
# DEV_BYPASS_USER_IDS에 등록된 모든 계정의 오늘 ai_insights 행을 삭제합니다.
#
# 사용법:
#   npm run reset-ai-usage
#   bash scripts/reset-ai-usage.sh
#   (Claude Code 터미널에서) ! npm run reset-ai-usage
set -e

# .env.local 로드
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.local 파일을 찾을 수 없습니다: $ENV_FILE"
  exit 1
fi

# 필요한 env var 파싱
SUPABASE_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d ' \r')
SERVICE_KEY=$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d ' \r')
USER_IDS=$(grep -E '^DEV_BYPASS_USER_IDS=' "$ENV_FILE" | cut -d= -f2- | tr -d ' \r')

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다."
  exit 1
fi

if [ -z "$USER_IDS" ]; then
  echo "❌ DEV_BYPASS_USER_IDS가 .env.local에 없습니다."
  exit 1
fi

# 오늘 UTC 자정
TODAY=$(date -u +%Y-%m-%dT00:00:00Z)
echo "🔄 오늘($TODAY UTC) AI 분석 횟수 초기화 중..."

# 쉼표로 구분된 각 user ID 처리
echo "$USER_IDS" | tr ',' '\n' | while IFS= read -r uid; do
  uid=$(echo "$uid" | tr -d ' \r')
  [ -z "$uid" ] && continue

  # Supabase REST API — ai_insights 삭제 (오늘 것만)
  http_code=$(curl -s -o /tmp/reset_ai_result.json -w "%{http_code}" \
    -X DELETE \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Prefer: return=representation" \
    "${SUPABASE_URL}/rest/v1/ai_insights?user_id=eq.${uid}&created_at=gte.${TODAY}")

  if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
    deleted=$(cat /tmp/reset_ai_result.json | grep -o '"id"' | wc -l | tr -d ' ')
    echo "✅ 초기화 완료 — user: $uid / 삭제된 인사이트: ${deleted}개 (0개면 이미 초기화됨)"
  else
    echo "❌ 초기화 실패 — user: $uid (HTTP $http_code)"
    cat /tmp/reset_ai_result.json
    exit 1
  fi
done

echo "✅ 완료. 이제 AI 코칭 분석을 다시 3회 사용할 수 있습니다."

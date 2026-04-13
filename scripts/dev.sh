#!/usr/bin/env bash
# FocusFlow dev server.
# - .env.local 로드 확인
# - 기본 포트 3000
set -euo pipefail

if [ ! -f .env.local ]; then
  echo "⚠️  .env.local 없음. 필요한 환경변수는 README.md 참고."
fi

exec npm run dev -- "$@"

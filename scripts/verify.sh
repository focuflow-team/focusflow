#!/usr/bin/env bash
# 간단 검증 루프 — self-review.sh의 축약판.
set -euo pipefail
npm run typecheck
npm run lint -- --quiet || true   # lint는 TD-007 해결 전까지 non-blocking
npm run depcruise

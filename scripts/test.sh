#!/usr/bin/env bash
# Test runner. 현재 테스트 프레임워크 미설정(TD-002).
# 최소한의 스모크: typecheck + depcruise + drift-detector.
set -euo pipefail

echo "▶ typecheck"
npm run typecheck

echo "▶ dependency-cruiser"
npm run depcruise

echo "▶ drift-detector"
npm run drift

echo "✅ scripts/test.sh 통과 (단, unit/integration 테스트는 미구현 — TD-002)"

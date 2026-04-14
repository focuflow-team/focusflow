#!/usr/bin/env bash
# pre-edit-check.sh
# PreToolUse hook for Edit and Write tools.
# Blocks src/ edits when not on a feature branch (worktree context).
# Fails open: any parsing/git error → allow (exit 0).

set -euo pipefail

# --- 1. Read tool input from stdin ---
input=$(cat 2>/dev/null || true)

# --- 2. Extract file_path from JSON ---
file_path=$(echo "$input" | grep -o '"file_path":"[^"]*"' | head -1 | cut -d'"' -f4 || true)

# If we couldn't parse a file path, allow.
if [[ -z "$file_path" ]]; then
  exit 0
fi

# --- 3. Only care about src/ files (per ADR-0005) ---
if [[ "$file_path" != */src/* && "$file_path" != *"/src" ]]; then
  exit 0
fi

# --- 3b. Allow if the file is inside a worktree (.worktrees/) ---
if [[ "$file_path" == *"/.worktrees/"* ]]; then
  exit 0
fi

# --- 4. Check current branch ---
branch=$(git branch --show-current 2>/dev/null || true)

# If git failed (detached HEAD, not a repo, etc.), allow.
if [[ -z "$branch" ]]; then
  exit 0
fi

# --- 5. Block on protected branches ---
if [[ "$branch" == "main" || "$branch" == "master" || "$branch" == "develop" ]]; then
  echo "❌ HARNESS: src/ 파일은 feature 브랜치 worktree 안에서만 편집할 수 있습니다."
  echo ""
  echo "   현재 브랜치: $branch"
  echo "   편집 시도 파일: $file_path"
  echo ""
  echo "   → 먼저 '/harness-task <task-id> [type]' 스킬을 실행해 worktree를 만드세요."
  echo "   → 예) /harness-task fix-login-bug fix"
  exit 2
fi

exit 0

---
name: fix-ai-tone-naturalness
description: AI 인사이트 말투 자연스러움 개선 — 구조 마커 노출·기계적 어미 반복 제거
verification_status: draft
last_verified: 2026-04-15
owner: vljh246v
branch: refactor/fix-ai-tone-naturalness
---

# Exec Plan — fix-ai-tone-naturalness

## Goal

AI가 프롬프트의 구조 지침을 단어 그대로 출력("반례는")하고 모든 문장을 "~다."로만 끝내는 문제를 해결해, 전문가가 자연스럽게 말하는 것처럼 들리도록 프롬프트를 수정한다.

## Approach

**문제 진단 (실제 출력 기준):**

1. "반례는 04/08 백엔드 API 연동..." — content 구조 지침의 "반례" 키워드가 그대로 출력됨
2. 모든 문장이 "~다." 로 끊김 — "완료다", "끊긴다", "집중된다" 연속 → 기계적으로 들림
3. content 구조를 "첫 문장: ~, 둘째 문장: ~" 식으로 번호 지정 → AI가 템플릿을 따르는 느낌

**수정 방향:**

- "반례" 키워드를 프롬프트에서 제거. 대신 "패턴이 성립하지 않는 날짜나 태스크를 자연스럽게 언급"으로 표현
- content 문장 구조를 번호 목록 → 흐름 설명으로 전환 ("순서대로 나열하지 말고 하나의 관찰로 이어서 써라")
- 어미 규칙을 "~다." 단일 강제 → "~다 / ~된다 / ~한다 / ~있다 / ~없다" 허용, 단 "~네요/~해요" 금지 유지
- 문장 연결을 끊기 대신 흐름으로: 짧은 문장 나열이 아니라 앞 문장이 다음 문장의 맥락이 되도록

**변경 범위:** `src/app/api/ai/insights/route.ts` system prompt만. 로직·스키마 무변.

## Sub-tasks

1. system prompt에서 "반례" 키워드 제거, 자연스러운 예외 언급 방식으로 교체
2. content 구조 지침을 번호 목록 → 흐름 설명으로 교체
3. 어미 규칙 완화 — "~다" 단일 강제 해제, 금지 어미 목록은 유지

## Completion Criteria

- [ ] 프롬프트에 "반례"라는 단어가 없음
- [ ] content 구조가 "첫 문장/둘째 문장" 번호 목록이 아닌 흐름 설명
- [ ] "~다" 외 자연스러운 어미도 허용됨
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- `src/app/api/ai/insights/route.ts`

## Open Questions

- 없음

## Revisions

(없음)

## Progress Log

| 일시       | 단계  | 결과                |
| ---------- | ----- | ------------------- |
| 2026-04-15 | start | 플랜 생성           |
| 2026-04-15 | plan  | exec-plan 작성 완료 |

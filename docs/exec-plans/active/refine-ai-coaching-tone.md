---
name: refine-ai-coaching-tone
description: AI 인사이트 시스템 프롬프트 말투를 '데이터 전문가' 톤으로 개선 — AI가 쓴 듯한 보고서체 탈피
verification_status: draft
last_verified: 2026-04-15
owner: vljh246v
branch: refactor/refine-ai-coaching-tone
---

# Exec Plan — refine-ai-coaching-tone

## Goal

AI 인사이트가 보고서를 읽어주는 것처럼 느껴지는 문제를 해결한다. 데이터를 오래 다뤄온 전문가가 직접 말하듯 — 군더더기 없이, 확신을 갖고, 사람이 쓴 것처럼 들리도록 시스템 프롬프트를 개선한다.

## Approach

**문제 진단:**

현재 프롬프트는 구조(교차 분석, 비자명한 패턴)는 좋으나 말투 가이드가 어미 금지 수준에 그침.
결과물이 "~됨", "~임"으로 끝나는 항목 나열식 보고서처럼 나옴.

**전문가 말투의 특징:**

- 수치를 먼저, 해석은 뒤에 (수치가 근거, 해석이 주장)
- 확신 있는 단정 ("~한 경향이 있다" X → "~다" O)
- 불필요한 연결어 없음 ("따라서", "그러므로", "이를 통해" 금지)
- 한 문장에 한 가지 사실만, 짧게 끊음
- 나열하지 않고 흐름으로 씀

**추가할 프롬프트 지침:**

1. 페르소나: "생산성 데이터를 10년 분석한 전문가. 수치로만 말하고 감상 없음. 짧고 단정적."
2. 좋은 예 / 나쁜 예 문장 패턴 명시
3. 금지 목록에 연결어·추측 어미 추가: "따라서/그러므로/이를 통해/~한 경향이 있다/~것으로 보인다/~것을 알 수 있다"
4. content 첫 문장은 반드시 수치로 시작

**변경 범위:** `src/app/api/ai/insights/route.ts` system prompt 텍스트만 수정. 로직·스키마·응답 형식 변경 없음.

## Sub-tasks

1. `route.ts` system prompt 개선 — 페르소나 강화, 문장 패턴 예시 추가, 금지 표현 확장

## Completion Criteria

- [ ] system prompt에 페르소나 설명이 명확히 있음
- [ ] 좋은 예 / 나쁜 예 문장 패턴이 포함됨
- [ ] 금지 표현 목록에 연결어·추측 어미 추가됨
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

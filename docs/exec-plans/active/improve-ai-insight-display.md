---
name: improve-ai-insight-display
description: AI 인사이트 카드의 긴 단락 텍스트를 구조화된 포맷으로 개선해 가독성을 높인다
verification_status: draft
last_verified: 2026-04-14
owner: vljh246v
branch: feat/improve-ai-insight-display
---

# Exec Plan — improve-ai-insight-display

## Goal

통계 페이지 AI 코칭 카드의 `content`가 250~350자 연속 단락으로 표시되어 읽기 불편한 문제를 해결한다.

## Approach

**채택: 프롬프트 구조 강제 + UI 시각적 렌더링 (C안)**

- 프롬프트에서 `content`를 `\n` 구분 문장 배열로 강제하고, 핵심 발견을 담은 `summary` 한 줄 필드를 추가한다.
- UI는 `summary`를 하이라이트 블록으로, `content`의 각 문장을 bullet list로 렌더링한다.

**거절한 대안:**

- UI에서만 텍스트 파싱 → AI가 매번 같은 형식으로 줄 보장 없음. 프롬프트 변경 없이 파싱은 불안정.
- DB schema 변경(points: string[] 컬럼 추가) → 마이그레이션 필요, 오버엔지니어링. `metadata` JSON에 저장으로 충분.

## Sub-tasks

1. `route.ts` 시스템 프롬프트 수정 — `content` 형식을 "문장마다 `\n`으로 구분" + `summary` 필드(핵심 발견 한 줄) 추가
2. `route.ts` 저장 로직 수정 — `metadata`에 `summary` 포함
3. `AICoachCard.tsx` 렌더링 개선 — `metadata.summary` 하이라이트 블록 추가, `content` → `\n` split bullet list
4. 테스트 작성 — `AICoachCard` 렌더링 단위 테스트 (summary 표시, bullet list 표시)
5. `verify-task.sh` 통과 확인

## Completion Criteria

- [ ] AI 인사이트 카드에 `summary` 한 줄 하이라이트가 표시된다
- [ ] `content` 각 문장이 bullet list로 분리되어 표시된다
- [ ] 기존 content (줄바꿈 없는 plain text) 하위 호환 — `\n` 없으면 기존처럼 단락으로 표시
- [ ] `AICoachCard` 렌더링 테스트 통과
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- `src/app/api/ai/insights/route.ts` — 프롬프트 + metadata 저장
- `src/components/ai/AICoachCard.tsx` — 렌더링 개선
- `src/components/ai/AICoachCard.test.tsx` — 신규 테스트

## Open Questions

- 없음

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과                |
| ---------- | ----- | ------------------- |
| 2026-04-14 | start | 플랜 생성           |
| 2026-04-14 | plan  | exec-plan 작성 완료 |

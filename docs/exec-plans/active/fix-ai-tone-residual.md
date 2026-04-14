---
name: fix-ai-tone-residual
description: AI 인사이트 content에 남은 번역체·어색한 표현 금지 추가 (반대로, ~은 상태다, 앞을 열어줬다 등)
verification_status: draft
last_verified: 2026-04-15
owner: harness
branch: refactor/fix-ai-tone-residual
---

# Exec Plan — fix-ai-tone-residual

## Goal

이전 라운드 수정 후에도 남아 있는 번역체·어색한 표현("반대로", "~은 상태다", "앞을 열어줬다", "연속 완료를 만들고")을 system prompt 금지 목록과 말투 원칙에 추가해 제거한다.

## Approach

`src/app/api/ai/insights/route.ts` system prompt에 세 가지를 추가한다.

1. **연결어 금지 확장**: "반대로", "반면", "한편" 추가 — 대조 마커도 구조적 연결어와 같은 문제
2. **어색한 결말 금지**: "~은 상태다", "앞을 열어줬다" 같은 억지 상태 서술·비유 금지
3. **말투 원칙 나쁜 예 추가**: "오전에 붙고", "연속 완료를 만들고" 실제 출력 기반 예시

## Sub-tasks

1. exec-plan 작성
2. 연결어 금지 목록에 "반대로", "반면", "한편" 추가
3. 어색한 결말/비유 표현 금지 추가
4. 말투 원칙 나쁜 예에 실제 출력 기반 예시 추가
5. verify-task.sh 실행
6. 커밋

## Completion Criteria

- [ ] 절대 쓰지 말 것 섹션에 "반대로", "반면" 포함
- [ ] "~은 상태다" / "앞을 열어줬다" 금지 명시
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- src/app/api/ai/insights/route.ts

## Open Questions

- 없음

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과      |
| ---------- | ----- | --------- |
| 2026-04-15 | start | 플랜 생성 |

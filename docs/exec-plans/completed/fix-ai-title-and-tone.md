---
name: fix-ai-title-and-tone
description: AI 인사이트 title의 한자어 조합 명사 금지 + content 번역체 표현 금지
verification_status: verified
last_verified: 2026-04-14
owner: harness
branch: refactor/fix-ai-title-and-tone
---

# Exec Plan — fix-ai-title-and-tone

## Goal

AI 인사이트의 title이 "오전완주우세" 같은 한자어 조합 명사로 나오고, content가 "연속 완료력이 강하게 작동한다" 같은 번역체로 나오는 문제를 프롬프트 수정으로 해결한다.

## Approach

`src/app/api/ai/insights/route.ts`의 system prompt에서 두 규칙을 교체·추가한다.

1. **title 규칙 교체**: "명사형으로 압축" → "자연스러운 구어 표현, 한자어 조합 명사 금지" + 나쁜 예/좋은 예 명시
2. **번역체 금지 추가**: 절대 쓰지 말 것 섹션에 번역투 복합명사·수동 표현 목록 추가

거절한 대안:

- 모델 교체: 비용·범위 초과
- Few-shot 예시를 user message에 추가: system prompt가 source of truth여야 하므로 system에 통합

## Sub-tasks

1. exec-plan 작성
2. route.ts system prompt — title 규칙 교체 + 좋은 예/나쁜 예 추가
3. route.ts system prompt — 번역체 금지 목록 추가
4. verify-task.sh 실행
5. 커밋

## Completion Criteria

- [ ] title에 "오전완주우세" 같은 한자어 4자 이상 조합 명사가 없음 (코드 리뷰로 확인)
- [ ] 절대 쓰지 말 것 섹션에 번역체 금지 항목 존재
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

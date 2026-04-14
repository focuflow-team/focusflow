---
name: add-dev-bypass-ai-limit
description: DEV_BYPASS_EMAILS 환경변수로 특정 이메일의 AI 분석 횟수 제한 해제
verification_status: draft
last_verified: ~
owner: vljh246v
branch: feat/add-dev-bypass-ai-limit
---

# Exec Plan — add-dev-bypass-ai-limit

## Goal

환경변수 `DEV_BYPASS_EMAILS`에 등록된 이메일 계정은 AI 코칭 분석 하루 3회 제한을 받지 않도록 한다.

## Approach

`src/app/api/ai/insights/route.ts` POST handler의 rate limit 체크 직전에,
현재 로그인 사용자 이메일이 `DEV_BYPASS_EMAILS`에 포함되면 검사를 건너뛴다.

- **환경변수 방식 선택 이유**: DB 스키마 변경 없이 서버 환경변수만으로 제어 가능. 개발자 계정 추가/삭제가 쉬움.
- **거절한 대안**: `profiles.is_dev` 컬럼 추가 — DB 마이그레이션 필요, 과잉 설계.

`DEV_BYPASS_EMAILS`는 쉼표 구분 이메일 목록. 예: `vljh246v@naver.com,dev2@example.com`

## Sub-tasks

1. `src/app/api/ai/insights/route.ts` POST handler에 bypass 체크 로직 추가
2. `.env.local`에 `DEV_BYPASS_EMAILS=vljh246v@naver.com` 추가
3. 테스트: bypass 이메일이면 rate limit 통과, 아니면 차단 동작 확인

## Completion Criteria

- [ ] `DEV_BYPASS_EMAILS` 등록 이메일은 3회 제한 없이 분석 요청 가능
- [ ] 미등록 이메일은 기존과 동일하게 3회 제한 적용
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- `src/app/api/ai/insights/route.ts`
- `.env.local`

## Open Questions

- 없음 (사용자 승인 완료: 환경변수 방식)

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과      |
| ---------- | ----- | --------- |
| 2026-04-15 | start | 플랜 작성 |

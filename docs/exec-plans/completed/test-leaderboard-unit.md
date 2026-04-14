---
name: test-leaderboard-unit
description: LeaderboardClient 컴포넌트의 단위 테스트 작성 — 렌더링, 공개/비공개 토글, 팔로우, 탭 전환, 순위 표시
verification_status: verified
last_verified: 2026-04-14
owner: vljh246v
branch: chore/test-leaderboard-unit
---

# Exec Plan — test-leaderboard-unit

## Goal

`LeaderboardClient.tsx`에 단위 테스트가 없어 기능 회귀를 검출할 수 없으므로, 핵심 렌더링·인터랙션 케이스를 Vitest로 커버한다.

## Approach

**선택: `@testing-library/react` + `vi.fn()` mock으로 순수 컴포넌트 테스트**

- Server Action(`togglePublicAction`, `toggleFollowAction`)은 `vi.mock()`으로 교체 — 실제 Supabase 호출 없이 UI 동작만 검증
- `useTransition`은 React 18 testing-library가 자동 처리 (act 내부에서 동기 flush)
- Supabase client를 직접 mocking하지 않음 — 서버 액션 경계에서 끊는 것이 더 단순

**거절한 대안:**

- E2E(Playwright): 현재 playwright.config 없음, 별도 task
- 서버 컴포넌트(`page.tsx`) 테스트: Next.js 서버 컴포넌트 테스트는 별도 인프라 필요, 이 task 범위 밖

## Sub-tasks

1. `LeaderboardClient.test.tsx` 파일 생성 — `src/app/app/leaderboard/` 아래
2. 픽스처 데이터(`makeEntry`) 헬퍼 정의
3. 테스트 케이스 작성:
   - 전체 순위 탭: 항목 렌더링, 순위 배지(트로피/메달/번호)
   - 내 항목 강조: `(나)` 텍스트 표시
   - 팔로우 버튼: 팔로우 → 언팔로우 토글 및 서버 액션 호출
   - 공개 토글: 비공개→공개 전환 및 서버 액션 호출
   - 팔로잉 탭: 팔로우한 사람만 필터링
   - 빈 상태: 항목 없을 때 메시지 표시
   - 비로그인: 가입 안내 문구 표시
4. `npm run test` 통과 확인
5. `bash scripts/verify-task.sh` 통과 확인

## Completion Criteria

- [ ] `src/app/app/leaderboard/LeaderboardClient.test.tsx` 존재
- [ ] 테스트 7개 이상, 모두 통과
- [ ] 전체 순위 렌더링 (happy path) 커버
- [ ] 팔로우 토글 인터랙션 커버
- [ ] 공개/비공개 토글 인터랙션 커버
- [ ] 팔로잉 탭 필터링 커버
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- `src/app/app/leaderboard/LeaderboardClient.test.tsx` (신규)

## Open Questions

- 없음

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과                |
| ---------- | ----- | ------------------- |
| 2026-04-15 | start | 플랜 생성           |
| 2026-04-15 | plan  | exec-plan 작성 완료 |

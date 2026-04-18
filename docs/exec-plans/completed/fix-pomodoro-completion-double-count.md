---
name: fix-pomodoro-completion-double-count
description: 포모도로 타이머 완료 시 onSessionComplete가 중복 호출되어 완료 횟수가 2개 이상 증가하는 버그 수정
verification_status: verified
last_verified: 2026-04-18
owner: vljh246v
branch: fix/fix-pomodoro-completion-double-count
---

# Exec Plan — fix-pomodoro-completion-double-count

## Goal

`useTimer.ts`의 `tick`이 phase 완료 후에도 RAF를 재등록해 `onSessionComplete`가 매 프레임마다 중복 호출되는 버그를 수정한다.

## Approach

**채택: tick 내 완료 처리를 setState 바깥으로 이동 + RAF 재등록 조건 추가**

근본 원인 두 가지:

1. `tick`: `setState`가 `status: 'stopped'`를 반환해도 그 직후 `requestAnimationFrame(tick)`이 무조건 호출됨. 다음 프레임에서 `startedAtRef.current`가 null이 아니라 완료 분기를 또 타고 `onSessionComplete` 중복 호출.
2. `onSessionComplete` 호출이 `setState` updater 내부(순수 함수)에 있어 React Strict Mode에서 두 번 실행됨.

**수정 전략:**

- setState updater 내부에 `completed` 플래그를 세팅하고, setState 후 그 플래그로 분기
- 완료 시: `startedAtRef.current = null`, `rafRef.current = null`, `onSessionComplete` 1회 호출
- 미완료 시: RAF 재등록

**거절한 대안:**

- `status === 'stopped'` 일 때 tick 시작 시 early return → start/pause 재시작 흐름과 충돌
- `useEffect`로 `state.status` 변경 감지해 호출 → timing 불확실, 중복 방지 어려움

**Secondary 수정:** `visibilitychange` useEffect deps에서 `tick` 제거 (`tickRef` 패턴)

## Sub-tasks

1. `tick`: `completed` + `completedDuration` 로컬 변수로 setState 바깥에서 완료 처리
2. `tick`: RAF 재등록을 `!completed` 조건부로 변경
3. `visibilitychange` useEffect: `tickRef` 패턴으로 `tick` deps 제거
4. 재현 테스트 작성 (`useTimer.test.ts`) — master에서 실패, 수정 후 통과
5. `verify-task.sh` 통과

## Completion Criteria

- [ ] 재현 테스트: 타이머 완료 시 `onSessionComplete`가 정확히 1번 호출됨
- [ ] 재현 테스트: `pomodoroCount`가 정확히 1 증가함
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- `src/hooks/useTimer.ts`
- `src/hooks/useTimer.test.ts` (신규)

## Open Questions

- 없음

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과                |
| ---------- | ----- | ------------------- |
| 2026-04-15 | start | 플랜 생성           |
| 2026-04-15 | plan  | exec-plan 작성 완료 |

---
name: ambient-sound-pro-unlock
description: Pro 사용자인데도 AmbientPlayer가 잠금 상태로 표시되는 버그 수정
verification_status: draft
last_verified: 2026-04-14
owner: jaehyun
branch: fix/ambient-sound-pro-unlock
---

# Exec Plan — ambient-sound-pro-unlock

## Goal

Pro/Team 구독 사용자가 타이머 홈에서 앰비언트 사운드의 Pro-only 사운드를 사용할 수 있도록, `subscription_tier`를 `AmbientPlayer`까지 전달한다.

## Approach

`AmbientPlayer`는 이미 `userTier` prop으로 tier를 받아 `canPlay()`로 분기하는 로직이 정확하다. 버그 원인은 **호출부(`TimerPage.tsx`)에서 prop을 넘기지 않아** default `'free'`로 평가되는 것. 따라서:

- Server Component `src/app/app/page.tsx`에서 `profiles.subscription_tier`를 조회해 `TimerPage`에 prop으로 주입.
- `TimerPage`는 해당 prop을 `AmbientPlayer`로 passthrough.

**대안 고려 & 기각**:

- Client 쪽에서 API로 tier fetch: 불필요한 round-trip + 플래시. 서버 주입이 간단.
- `useAmbientSound` 훅 내부에서 tier 판정: 훅이 결제 경계를 알게 되어 관심사 뒤섞임.

결제 경계(웹훅/서명/금액)는 건드리지 않음. tier 읽기만 수행 — `src/app/app/settings/page.tsx`와 동일한 패턴.

## Sub-tasks

1. `src/app/app/page.tsx`를 async server component로 바꿔 `subscription_tier` 조회 → `TimerPage`로 전달.
2. `src/components/timer/TimerPage.tsx`에 `subscriptionTier` prop 추가 → `AmbientPlayer`로 전달.
3. 재현 테스트: `AmbientPlayer`가 `userTier='pro'`일 때 Pro 사운드가 `disabled=false`이고 잠금 아이콘이 없는지 Vitest + Testing Library로 검증.

## Completion Criteria

- [ ] Pro tier prop 전달 시 Pro 사운드 버튼이 활성화되고 Lock 아이콘이 렌더되지 않는다 (테스트로 증명).
- [ ] Free tier일 때는 기존처럼 잠금 상태 유지 (회귀 방지 테스트).
- [ ] `src/app/app/page.tsx`는 타입 체크 통과.
- [ ] `bash scripts/verify-task.sh` 녹색.

## Affected Files (expected)

- src/app/app/page.tsx
- src/components/timer/TimerPage.tsx
- src/components/ambient/AmbientPlayer.test.tsx (신규)

## Open Questions

- 없음. 기존 `settings/page.tsx`의 tier 조회 패턴을 그대로 따름.

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과                            |
| ---------- | ----- | ------------------------------- |
| 2026-04-14 | start | 플랜 생성                       |
| 2026-04-14 | plan  | 근본 원인 확정 (prop 전달 누락) |

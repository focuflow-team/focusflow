---
name: feat-profile-settings
description: 설정 페이지에 프로필 편집(표시 이름·사용자명) 섹션 추가 — 리더보드 익명 표시 해결
verification_status: draft
last_verified: 2026-04-15
owner: vljh246v
branch: feat/feat-profile-settings
---

# Exec Plan — feat-profile-settings

## Goal

`/app/settings`에 프로필 편집 섹션을 추가해, 사용자가 `display_name`과 `username`을 설정할 수 있게 한다. 현재 가입 직후 두 값이 모두 `null`이라 리더보드에서 "익명"으로 표시되는 문제를 해결한다.

## Approach

**선택: 기존 settings 패턴 확장 (server action + SettingsClient 섹션 추가)**

- 리더보드의 `actions.ts` 패턴과 동일하게 `src/app/app/settings/actions.ts` 신규 생성
- `SettingsPage`(서버 컴포넌트)에서 프로필 fetch → `SettingsClient`에 props로 전달
- `SettingsClient`에 프로필 섹션 UI 추가 (입력 → 저장 → toast 피드백)
- username 중복은 Supabase UNIQUE 제약으로 처리, 에러 핸들링 UI 포함
- DB 마이그레이션 불필요 — `display_name`, `username` 컬럼 이미 존재

**거절한 대안:**

- API route(`/api/profile`): server action으로 충분, 불필요한 복잡도
- 별도 `/app/profile` 페이지: 기존 settings에 통합하는 것이 UX상 자연스러움

## Sub-tasks

1. `src/app/app/settings/actions.ts` 생성 — `updateProfileAction(displayName, username)`
   - display_name, username 업데이트
   - username 중복 시 에러 반환
   - `revalidatePath('/app/settings')`, `revalidatePath('/app/leaderboard')`
2. `src/app/app/settings/page.tsx` 수정 — 프로필(display_name, username) fetch 추가, props 전달
3. `src/components/settings/SettingsClient.tsx` 수정 — 프로필 섹션 UI 추가
   - display_name 입력 (표시 이름)
   - username 입력 (영소문자·숫자·언더스코어, 3~30자)
   - 저장 버튼 + 로딩/에러/성공 toast
4. 테스트 작성 (`src/components/settings/SettingsClient.test.tsx`)
5. `bash scripts/verify-task.sh` 통과

## Completion Criteria

- [ ] `/app/settings`에서 표시 이름 변경 후 저장 → 리더보드에서 새 이름으로 표시
- [ ] username 중복 입력 시 에러 메시지 표시
- [ ] 저장 성공 시 toast 피드백
- [ ] 테스트: 폼 렌더링 + 저장 인터랙션 커버
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- `src/app/app/settings/actions.ts` (신규)
- `src/app/app/settings/page.tsx` (수정)
- `src/components/settings/SettingsClient.tsx` (수정)
- `src/components/settings/SettingsClient.test.tsx` (신규)

## Open Questions

- 없음 (DB 컬럼 기존 존재, 마이그레이션 불필요, RLS 변경 없음)

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과                |
| ---------- | ----- | ------------------- |
| 2026-04-15 | start | 플랜 생성           |
| 2026-04-15 | plan  | exec-plan 작성 완료 |

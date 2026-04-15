---
name: add-timer-nav-link
description: 헤더 네비게이션에 타이머 메뉴 항목 추가 — 로고 클릭 없이 바로 이동 가능하게
verification_status: draft
last_verified: 2026-04-15
owner: vljh246v
branch: feat/add-timer-nav-link
---

# Exec Plan — add-timer-nav-link

## Goal

헤더 네비게이션에 "타이머" 링크를 추가해 로고 클릭 없이도 `/app` 메인 타이머 화면으로 바로 이동할 수 있도록 한다.

## Approach

`src/app/app/layout.tsx`는 Server Component이므로 `usePathname`을 직접 사용할 수 없다.
네비게이션 링크 목록을 `src/components/NavLinks.tsx` (Client Component)로 분리해 active 스타일을 pathname 기반으로 처리한다.

- `<nav>` 첫 항목으로 `href="/app"` "타이머" 추가
- `usePathname()`으로 현재 경로 감지, 정확 매칭(`pathname === href`)시 active 스타일 적용
- 기존 통계/리더보드/설정 항목도 동일 컴포넌트로 이전 (active 스타일 일관성)

**거절한 대안:**

- 로고를 "홈" 텍스트로 교체 → 브랜드 인지에 로고는 유지
- 아이콘 전용 버튼 → 기존 텍스트 레이블 패턴과 불일치

**에스컬레이션 해당 여부:**

- layout.tsx 수정이지만 "서버 사이드 인증 체크 변경"이 아닌 순수 JSX/nav 변경 → 불필요

## Sub-tasks

1. `src/components/NavLinks.tsx` 생성 — Client Component, usePathname 기반 active 스타일
2. `src/app/app/layout.tsx`의 nav 링크들을 `<NavLinks />`로 교체, 타이머 항목 첫 번째로 추가

## Completion Criteria

- [ ] 헤더에 "타이머" 메뉴 항목이 표시됨
- [ ] 타이머 항목 클릭 시 `/app`으로 이동
- [ ] `/app` 경로에서 "타이머" 항목이 active 스타일로 표시됨
- [ ] 다른 페이지 항목도 active 스타일 동일 패턴 적용
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- `src/app/app/layout.tsx`
- `src/components/NavLinks.tsx` (신규)

## Open Questions

- 없음

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과                |
| ---------- | ----- | ------------------- |
| 2026-04-15 | start | 플랜 생성           |
| 2026-04-15 | plan  | exec-plan 작성 완료 |

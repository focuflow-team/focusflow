---
name: fix-supabase-client-build-error
description: 빌드 타임 SSR에서 createClient()가 실행되어 Supabase 에러 발생 — 핸들러 내부로 이동
verification_status: draft
last_verified: 2026-04-18
owner: vljh246v
branch: fix/fix-supabase-client-build-error
---

# Exec Plan — fix-supabase-client-build-error

## Goal

인증 페이지에서 `createClient()`를 컴포넌트 바디 대신 이벤트 핸들러 내부에서만 호출하여 빌드 타임 SSR 에러를 제거한다.

## Approach

`createClient()`를 각 이벤트 핸들러 안으로 이동. 클라이언트는 사용자 인터랙션 시점(브라우저)에만 생성되므로 빌드 타임 SSR에서 실행되지 않는다.

거절한 대안:

- `useMemo`로 lazy 초기화 — 렌더 시점에 여전히 실행되므로 SSR 문제 미해결
- `createClient()` 내부에 env var 가드 추가 — 근본 원인(컴포넌트 바디 호출)을 숨기는 임시방편
- `next/dynamic` + `ssr: false` — 불필요한 코드 분할 도입, 현재 수준의 변경으로 충분

## Sub-tasks

1. `login/page.tsx` — line 18의 `const supabase = createClient()` 제거, `handleEmailLogin`과 `handleOAuth` 내부에 각각 추가
2. `signup/page.tsx` — line 17의 `const supabase = createClient()` 제거, `handleSignup` 내부에 추가
3. Vitest 재현 테스트 작성 — 빌드 타임 환경(env vars 없음)에서 페이지 모듈 import가 throw하지 않음을 확인

## Completion Criteria

- [ ] `login/page.tsx` 컴포넌트 바디에 `createClient()` 호출 없음
- [ ] `signup/page.tsx` 컴포넌트 바디에 `createClient()` 호출 없음
- [ ] 재현 테스트 통과 (env vars 없이 모듈 import 가능)
- [ ] `bash scripts/verify-task.sh` 녹색

## Affected Files (expected)

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/__tests__/auth-pages-ssr.test.tsx` (신규)

## Open Questions

없음

## Revisions

(초기 작성 이후 접근을 바꾸면 여기에 기록)

## Progress Log

| 일시       | 단계  | 결과      |
| ---------- | ----- | --------- |
| 2026-04-18 | start | 플랜 생성 |

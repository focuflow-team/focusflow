---
name: ADR-0002 Auth boundary
description: 보호 라우트의 위치·이중 검증·리다이렉트 규약
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# ADR-0002 — 인증 경계 및 보호 라우트 패턴

- 상태: Accepted
- 날짜: 2026-04-13

## Context

인증 체크가 여러 곳에 흩어지면 "한쪽만 고쳐 구멍이 나는" 상황이 필연이다. 현재 Supabase Auth + Next.js 미들웨어 조합으로 다음을 수행한다:

- `middleware.ts`: `/app/*` 미인증 → `/login`; 인증 + `/login|/signup` → `/app`.
- `src/app/app/layout.tsx`: 서버 사이드에서 한 번 더 `supabase.auth.getUser()`로 확인.

## Decision

1. **보호 라우트는 전부 `/app/**` 하위에 둔다.\*\* 예외는 ADR로 명시.
2. **이중 체크 유지** — 미들웨어(네트워크 경계) + layout(렌더 경계).
3. **인증 페이지(`/login`, `/signup`)는 `force-dynamic`** — 정적 프리렌더 시 Supabase env 미존재로 빌드 실패 재발 방지 (F-2026-04-11-D 참고).
4. **`auth.getUser()`가 정답**, `auth.getSession()`은 변조 가능하므로 인가 판단에 쓰지 말 것.
5. 공개 프로필(`/u/[username]`) 등 공개 라우트는 `is_public = true` RLS로만 노출. middleware는 통과.

## Consequences

- 긍정: 모든 보호 라우트의 위치·패턴이 통일되어 예측 가능.
- 부정: `/app` 밖에서 인증이 필요한 작업(예: 공유 미리보기)은 별도 ADR로 예외 처리 필요.

## Enforcement

- 커스텀 린트: `src/app/**/page.tsx` 파일이 `createClient()`(server)를 사용해 `auth.getUser()`를 호출한다면 경로가 `/app/**` 또는 `/api/**`임을 요구. (초기엔 문서로만, 이후 AST 기반으로 강제)
- 체크리스트: 새 보호 라우트 추가 시 `scripts/self-review.sh`가 경고.

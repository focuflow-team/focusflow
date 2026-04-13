---
name: ADR-0001 Supabase 3-factory boundaries
description: Supabase client/server/service 팩토리의 import 경계와 강제 방법
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# ADR-0001 — Supabase 3-factory 클라이언트 경계

- 상태: Accepted
- 날짜: 2026-04-13

## Context

`src/lib/supabase/`에 3개의 팩토리가 있다:

- `client.ts` (`createClient`) — `@supabase/ssr` 브라우저 클라이언트
- `server.ts` (`createClient`, async) — 쿠키 기반 서버 클라이언트
- `service.ts` (`createServiceClient`) — `SUPABASE_SERVICE_ROLE_KEY` 사용, **RLS 우회**

`service.ts`가 잘못 Client Component에 import되면 `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트 번들에 노출될 뿐 아니라 런타임에도 사용자가 아닌 관리자 권한으로 DB를 조작하게 된다. 즉, **보안·데이터 무결성 모두 동시 붕괴**하는 실수. 텍스트 규약만으로는 재발을 막을 수 없다.

## Decision

1. `@/lib/supabase/client`: `'use client'` 파일에서만 import 허용.
2. `@/lib/supabase/server`: Server Component, Route Handler, Server Action에서만 import.
3. `@/lib/supabase/service`: 다음 경로에서만 import 허용:
   - `src/app/api/**/route.ts`
   - `src/app/api/cron/**`
   - 명시적으로 ADR로 허용된 서버 사이드 스크립트
     단, **어떤 Client Component(`'use client'`)에서도 import 금지**.

## Consequences

- 긍정: 관리자 권한 유출 경로가 구조적으로 차단됨.
- 부정: 공통 헬퍼(예: "현재 사용자의 프로필 가져오기")를 분기 구현해야 함. → 도메인 함수를 서버 전용으로 분리.

## Enforcement

1. `dependency-cruiser` 규칙 (Axis 2):
   - `no-service-from-client`: `**/*.tsx` 중 첫 줄이 `'use client'`인 파일 → `src/lib/supabase/service.ts` import 금지.
   - `no-browser-from-server`: Server Component(`**/app/**/{page,layout,route}.tsx`, `'use client'` 없음) → `src/lib/supabase/client.ts` import 금지.
2. 커스텀 ESLint 메시지 (fix-instruction 포함):
   ```
   ❌ SUPABASE_SERVICE_ROLE_KEY 사용 클라이언트(`service.ts`)를 Client Component에서 import했습니다.
      이유: RLS가 우회되어 관리자 권한으로 DB에 접근하게 됩니다.
      수정: Client Component에서는 `@/lib/supabase/client`만 쓰세요.
            관리자 작업이 필요하면 서버 Route Handler(`src/app/api/**/route.ts`)로 옮기세요.
      예시: src/app/api/sessions/route.ts
      참고: docs/design-docs/ADR-0001-supabase-client-boundaries.md
   ```
3. `src/lib/supabase/CLAUDE.md`에 이 규약을 요약 배치해 작업 시 컨텍스트로 자동 로드되게 한다.

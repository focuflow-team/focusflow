---
name: Supabase factory scope
description: src/lib/supabase 하위 작업 시 읽을 스코프 규약
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Supabase Client Scope

이 디렉터리의 파일을 수정하거나 이 디렉터리에서 export되는 함수를 import하기 전에 반드시 **[ADR-0001](../../../docs/design-docs/ADR-0001-supabase-client-boundaries.md)**을 읽으세요.

## 3-factory 규약 한 줄 요약

| 파일         | 사용 위치                                                  | 권한                  |
| ------------ | ---------------------------------------------------------- | --------------------- |
| `client.ts`  | `'use client'` 파일만                                      | 사용자                |
| `server.ts`  | Server Component / Route Handler / Server Action           | 사용자                |
| `service.ts` | **`src/app/api/**/route.ts`**, **`src/app/api/cron/**`**만 | **관리자 (RLS 우회)** |

## 절대 금지

1. Client Component에서 `@/lib/supabase/service` import.
2. Client Component에서 `process.env.SUPABASE_SERVICE_ROLE_KEY` 참조.
3. Server Component에서 `@/lib/supabase/client` 사용 (의미 없음).
4. `service.ts` 내부 로직 변경으로 `persistSession: true` 활성화.

## 새 헬퍼 추가 시

- 반드시 어느 팩토리에서 쓰이는지 **이름 또는 위치**로 표현. 예: `getUserSessionsServer()`는 server.ts만 의존.
- 같은 로직을 server/client 양쪽에서 쓰는 경우: 순수 함수(테이블 이름·SELECT 셋)와 실행 함수(클라이언트 취득)를 분리.

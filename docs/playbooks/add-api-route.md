---
name: Playbook — Add API Route
description: 새 Route Handler 추가 절차
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# Playbook — 새 API Route 추가

## 1. 위치 결정

- 도메인별 폴더: `src/app/api/<domain>/<action>/route.ts`
- 기존 도메인 재사용 가능하면 새 폴더 만들지 말 것.

## 2. 인증 레이어 결정

| 케이스                                          | 사용할 클라이언트                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| 사용자의 데이터를 그 사용자 권한으로 읽고/쓴다  | `createClient()` (server.ts)                                      |
| 여러 사용자 데이터를 집계/관리 (예: 크론, 웹훅) | `createServiceClient()` (service.ts) + 반드시 사용자 id 경계 체크 |
| 외부 공개 API (인증 불필요)                     | `createClient()` (server.ts), 하지만 RLS에 의존                   |

## 3. 스켈레톤

```ts
// src/app/api/<domain>/<action>/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  let body: {
    /* 필드 타입 */
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  // ... 처리 ...

  return NextResponse.json({ ok: true })
}
```

## 4. 외부 SDK 사용 시

- 직접 `new Stripe(...)` 금지 → `src/lib/stripe.ts`의 getter 경유 (lazy init).
- PortOne 호출은 `src/lib/portone.ts`.
- Google Calendar는 `src/lib/google-calendar.ts`.

## 5. 체크리스트 (PR 전)

- [ ] `bash scripts/self-review.sh` 통과
- [ ] 환경변수 lazy init (모듈 톱레벨 env 접근 금지)
- [ ] 한국어 에러 메시지
- [ ] 응답 스키마 일관성 (`{ error }` / `{ data }` / `{ ok }`)
- [ ] 웹훅이면 서명 검증 → 이벤트 처리 순서
- [ ] 결제 / 인증 / `service.ts` 건드렸다면 `docs/escalation-policy.md` 검토

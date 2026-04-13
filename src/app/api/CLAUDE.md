---
name: API Route scope
description: src/app/api 하위 Route Handler 작성 시 규약
verification_status: verified
last_verified: 2026-04-13
owner: harness
---

# API Route Scope

## 핵심 규약

1. **Route Handler 시그니처**: `export async function GET|POST|PUT|DELETE(request: NextRequest) { ... }`
2. **인증 확인**: 보호 엔드포인트는 `createClient()` (server.ts) → `supabase.auth.getUser()`로 사용자 id 확인. `getSession()` 사용 금지 (변조 가능).
3. **관리자 권한 작업**: `createServiceClient()` (service.ts) 사용. 단, 반드시 사용자 id를 먼저 확인한 뒤 해당 사용자 행만 조작.
4. **웹훅 엔드포인트**는 서명 검증 먼저. 검증 전 `supabase` 인스턴스 생성조차 하지 말 것.
5. **응답**: 성공 `NextResponse.json({ ... })`. 실패는 명확한 상태 코드 + 한국어 메시지. `console.error`로 원인 로깅 (Axis 3에서 structured logger로 교체 예정).
6. **에러 바운더리**: `try/catch`로 덮어 500 빈 응답만 주지 말 것. 사용자 메시지 + 서버 로그 모두 있어야 함.

## 새 API route 체크리스트

- [ ] `src/app/api/<domain>/<endpoint>/route.ts` 경로에 두었는가?
- [ ] 인증이 필요하면 `auth.getUser()`로 먼저 확인했는가?
- [ ] 관리자 권한이 꼭 필요한가? (없어도 되면 `server.ts` 사용)
- [ ] 외부 SDK는 `src/lib/*` 래퍼 경유인가?
- [ ] 환경변수 lazy init 되어 있는가? (모듈 톱레벨에서 `new Stripe()` 금지)
- [ ] 결제·인증 경계를 건드리면 `docs/escalation-policy.md` 확인

## 금지

- Route Handler 안에서 `@/lib/supabase/client` import.
- `NEXT_PUBLIC_*` 이외의 env를 클라이언트 Component에 넘김.
- 웹훅 검증 로직 복붙 (단일 구현: `src/app/api/payment/webhook/route.ts`).

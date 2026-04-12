---
name: verify-auth-pages
description: 인증 페이지의 빌드 에러 방지 규칙을 검증합니다. 'use client' + force-dynamic 필수 선언 여부를 확인합니다. 인증 페이지 수정 또는 새 auth 페이지 추가 후 사용.
---

# 인증 페이지 검증

## Purpose

1. **`'use client'` 선언** — 인증 페이지는 브라우저 API(`location.origin`)를 사용하므로 반드시 Client Component여야 함
2. **`export const dynamic = 'force-dynamic'`** — 정적 프리렌더링 비활성화. 누락 시 빌드 에러 발생 (`location is not defined`)
3. **선언 순서** — `'use client'`는 파일 최상단, `dynamic` export는 바로 아래 위치해야 함
4. **OAuth redirect URL 패턴** — `signInWithOAuth`의 `redirectTo`는 반드시 `/auth/callback`으로 향해야 함

## When to Run

- `src/app/(auth)/login/page.tsx` 수정 후
- `src/app/(auth)/signup/page.tsx` 수정 후
- `src/app/(auth)/` 하위에 새 페이지 추가 후
- 빌드 에러 `location is not defined` 발생 시
- 정적 렌더링 관련 설정 변경 후

## Related Files

| File | Purpose |
|------|---------|
| `src/app/(auth)/login/page.tsx` | 로그인 페이지 — 이메일/소셜 로그인 |
| `src/app/(auth)/signup/page.tsx` | 회원가입 페이지 |
| `src/app/(auth)/layout.tsx` | 인증 영역 레이아웃 |

## Workflow

### Step 1: 모든 인증 페이지 목록 수집

**검사:** `src/app/(auth)/` 하위 `page.tsx` 파일을 모두 찾습니다.

```bash
find src/app/\(auth\) -name "page.tsx" 2>/dev/null
```

목록에서 각 파일에 대해 Step 2~4를 수행합니다.

---

### Step 2: 'use client' 선언 확인

**각 인증 page.tsx 파일에 대해:**

```bash
grep -n "^'use client'" src/app/\(auth\)/login/page.tsx
grep -n "^'use client'" src/app/\(auth\)/signup/page.tsx
```

**PASS 기준:** 파일 첫 번째 줄에 `'use client'` 가 존재

**FAIL:** 선언이 없거나 첫 줄이 아닌 경우 → 파일 최상단 첫 줄에 `'use client'` 추가

---

### Step 3: force-dynamic 선언 확인

**각 인증 page.tsx 파일에 대해:**

```bash
grep -n "force-dynamic" src/app/\(auth\)/login/page.tsx
grep -n "force-dynamic" src/app/\(auth\)/signup/page.tsx
```

**PASS 기준:** `export const dynamic = 'force-dynamic'` 이 존재

**FAIL:** 선언이 없는 경우 → `'use client'` 바로 다음 줄에 추가:
```typescript
'use client'

export const dynamic = 'force-dynamic'
```

**왜 필요한가:** Next.js는 기본적으로 페이지를 정적으로 프리렌더링하려 시도합니다. 인증 페이지는 `location.origin` (브라우저 전용 API)을 OAuth redirect URL에 사용하므로, 빌드 시 Node 환경에서 실행하면 `ReferenceError: location is not defined` 에러가 발생합니다.

---

### Step 4: 선언 순서 확인

**각 인증 page.tsx 파일에 대해:**

```bash
head -5 src/app/\(auth\)/login/page.tsx
head -5 src/app/\(auth\)/signup/page.tsx
```

**PASS 기준:**
- 1번째 줄: `'use client'`
- 2번째 줄: 빈 줄 (선택)
- 3번째 줄: `export const dynamic = 'force-dynamic'`

**FAIL:** `dynamic` export가 `'use client'` 보다 앞에 오거나, imports 사이에 위치하는 경우

---

### Step 5: OAuth redirect URL 패턴 확인

**파일:** `src/app/(auth)/login/page.tsx`

```bash
grep -n "redirectTo\|auth/callback" src/app/\(auth\)/login/page.tsx
```

**PASS 기준:** `redirectTo: \`${location.origin}/auth/callback\`` 패턴 사용

**FAIL:** `/auth/callback`이 아닌 다른 경로나 하드코딩된 URL을 사용하는 경우

## Output Format

```markdown
| 검사 | 파일 | 결과 | 상세 |
|------|------|------|------|
| 'use client' 선언 | `login/page.tsx` | PASS | 1번째 줄 확인 |
| force-dynamic 선언 | `login/page.tsx` | PASS | export 존재 |
| 선언 순서 | `login/page.tsx` | PASS | 올바른 순서 |
| OAuth redirectTo | `login/page.tsx` | PASS | /auth/callback |
| 'use client' 선언 | `signup/page.tsx` | PASS | 1번째 줄 확인 |
| force-dynamic 선언 | `signup/page.tsx` | PASS | export 존재 |
| 선언 순서 | `signup/page.tsx` | PASS | 올바른 순서 |
```

## Exceptions

1. **Server Component 인증 페이지** — `location.origin`을 사용하지 않고 서버 사이드에서만 동작하는 페이지라면 `force-dynamic` + `'use client'` 없이도 됩니다. 단, 현재 코드베이스의 login/signup 페이지는 해당 없음.
2. **`layout.tsx`** — `(auth)/layout.tsx`는 이 규칙의 적용 대상이 아닙니다. 레이아웃 파일은 다른 렌더링 정책을 가질 수 있습니다.
3. **`error.tsx`, `loading.tsx`** — 특수 Next.js 파일은 이 규칙 적용 대상 아님.

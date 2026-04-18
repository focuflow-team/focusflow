---
name: Dev Flow / CI-CD 개선 설계
description: alpha/beta/prod 환경 분리, CI blocking 전환, 환경변수 체계화 설계 문서
verification_status: draft
last_verified: 2026-04-18
owner: harness
---

# Dev Flow / CI-CD 개선 설계

---

## 배경 및 목표

### 현재 문제점

- `main` push 시 Vercel에 단일 환경으로만 배포됨 — alpha/beta/prod 구분 없음
- CI 체크 3개(`Prettier`, `ESLint`, `Drift detector`)가 `continue-on-error: true`로 비차단 상태 — 실패해도 배포 진행
- GitHub 브랜치 보호 규칙 없음 — 로컬 Husky에만 의존
- Vercel 설정 전부 UI에만 존재 — 버전관리 없음, 드리프트 위험
- `.env.local.example` 없음 — 신규 설정 시 참고 불가, 온보딩 불가

### 목표

- alpha(develop) → beta(release/\*) → prod(main) 3단계 환경 분리
- CI 체크를 blocking으로 전환 → 실패 시 배포 차단
- 환경변수 관리 체계화 및 문서화

---

## 환경 매핑

```
feature/*
    ↓ PR → develop
develop ──────────────→ Vercel Preview (alpha) ─→ staging Supabase
    ↓ PR → release/x.y
release/x.y ──────────→ Vercel Preview (beta)  ─→ staging Supabase
    ↓ PR → main
main ─────────────────→ Vercel Production (prod) → prod Supabase
```

**핵심 결정 사항:**

- Vercel **단일 프로젝트** 사용 — 환경변수 2세트(Preview / Production)
- Supabase **2개 프로젝트**: staging(alpha+beta 공유) / prod
  - Supabase 무료 플랜 활성 프로젝트 2개 제한 반영
- PR 오픈 시 Vercel이 브랜치별 Preview URL 자동 생성
  - develop → `focusflow-develop-xxx.vercel.app` (alpha)
  - release/1.2 → `focusflow-release-xxx.vercel.app` (beta)
  - main merge → `focusflow.app` (prod)

---

## 구현 범위

### 코드 변경 파일

#### 1. `.env.local.example` (신규 생성)

`.env.local`의 모든 변수를 템플릿화. 값은 placeholder만 포함 (실제 시크릿 없음).

포함할 변수 목록:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `PORTONE_V2_API_SECRET`
- `PORTONE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_PORTONE_STORE_ID`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY`
- `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `DEV_BYPASS_EMAILS`
- `DEV_BYPASS_USER_IDS`

#### 2. `.github/workflows/ci.yml` (수정)

**변경 1: `continue-on-error` 제거**

| 단계                 | 현재                      | 변경 후         |
| -------------------- | ------------------------- | --------------- |
| `Prettier (check)`   | `continue-on-error: true` | 제거 → blocking |
| `ESLint`             | `continue-on-error: true` | 제거 → blocking |
| `Drift detector`     | `continue-on-error: true` | 제거 → blocking |
| `dependency-cruiser` | 없음 (이미 blocking)      | 유지            |

> 주의: ESLint 단계 이름에 "non-blocking until TD-007 resolved" 주석 있음 → TD-007 기존 린트 오류가 있을 수 있음. 먼저 `npm run lint`로 현황 확인 필요.

**변경 2: Build 단계 env var 7개 추가**

현재 2개만 있음 → 9개로 확장:

```yaml
- name: Build
  run: npm run build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
    NEXT_PUBLIC_PORTONE_STORE_ID: ${{ secrets.NEXT_PUBLIC_PORTONE_STORE_ID }}
    NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD: ${{ secrets.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD }}
    NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY: ${{ secrets.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY }}
    NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY: ${{ secrets.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY }}
    NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY: ${{ secrets.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY }}
    NEXT_PUBLIC_POSTHOG_KEY: ${{ secrets.NEXT_PUBLIC_POSTHOG_KEY }}
```

#### 3. `vercel.json` (수정)

기존 cron 설정 유지 + 프레임워크/빌드 설정 명시 추가.

#### 4. `docs/dev-flow.md` (신규 생성)

브랜치 전략, 환경 매핑, 수동 설정 체크리스트 문서화.

---

## 수동 설정 항목 (1회)

### GitHub → Settings → Secrets and variables → Actions

staging 값으로 7개 추가 (기존 2개: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 는 이미 있음):

```
NEXT_PUBLIC_APP_URL              = https://staging.focusflow.app (또는 Vercel 자동 URL)
NEXT_PUBLIC_PORTONE_STORE_ID     = store-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD     = channel-key-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY = channel-key-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY = channel-key-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY  = channel-key-...
NEXT_PUBLIC_POSTHOG_KEY          = phc_...
```

> `NEXT_PUBLIC_*` 변수는 브라우저에 노출되는 공개 값이므로 GitHub Secrets에 저장해도 보안 문제 없음.

### GitHub → Settings → Branches → main 보호 규칙

```
✅ Require status checks to pass before merging
   → Required check: "verify" (ci.yml의 job 이름)
✅ Restrict who can push to matching branches
   → 직접 push 차단
❌ Require a pull request before merging (리뷰어 필수 — 1인 개발이므로 제외)
```

### Vercel Dashboard → Project → Settings → Environment Variables

**Production 환경** (main 브랜치):

- prod Supabase URL/Key
- 실제 prod PortOne, OpenAI, Stripe 키

**Preview 환경** (develop, release/\* 등 나머지 브랜치):

- staging Supabase URL/Key
- staging/공유 API keys

---

## ESLint 현황 확인 필요

`ci.yml`에 `ESLint (non-blocking until TD-007 resolved)` 주석이 있어, 기존 린트 오류가 존재할 수 있음. `continue-on-error`를 제거하기 전에 `npm run lint`로 현재 상태 확인 후:

- 오류가 없으면 → 즉시 제거
- 오류가 있으면 → 오류 수정 후 제거 (별도 커밋)

---

## 검증 방법

1. `feature/ci-test` 브랜치 생성 → develop에 PR → GitHub Actions 실행 확인
2. 의도적 ESLint 오류 추가 → CI 실패 확인 (이전엔 통과했을 것)
3. `release/0.1` 브랜치 생성 → Vercel beta Preview URL 생성 확인
4. main PR → CI 통과 없이 "Merge" 버튼 비활성화 확인 (GitHub 브랜치 보호 후)
5. main 머지 → Vercel Production 배포 확인

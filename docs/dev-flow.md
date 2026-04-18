---
name: 개발 플로우 가이드
description: 브랜치 전략, 환경 매핑, 신규 개발 시작 절차, 수동 설정 체크리스트
verification_status: verified
last_verified: 2026-04-18
owner: harness
---

# 개발 플로우 가이드

## 환경 매핑

| 브랜치      | Vercel 환경       | Supabase | URL                                |
| ----------- | ----------------- | -------- | ---------------------------------- |
| `develop`   | Preview (alpha)   | staging  | `focusflow-develop-xxx.vercel.app` |
| `release/*` | Preview (beta)    | staging  | `focusflow-release-xxx.vercel.app` |
| `main`      | Production (prod) | prod     | `focusflow.app`                    |

```
    feature/*
        ↓ PR → develop
    develop ──────────────→ Vercel Preview (alpha) ─→ staging Supabase
        ↓ PR → release/x.y
    release/x.y ──────────→ Vercel Preview (beta)  ─→ staging Supabase
        ↓ PR → main
    main ─────────────────→ Vercel Production (prod) → prod Supabase
```

## 신규 기능 개발 절차

```bash
# 1. feature 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. 개발 (5-step loop: CLAUDE.md 참고)
npm run start-task <task-id>

# 3. develop에 PR 오픈 → Vercel이 alpha Preview URL 자동 생성
# 4. CI 통과 확인 (필수: lint, prettier, drift, build)
# 5. develop에 머지

# 6. release 브랜치에 PR → beta Preview URL 생성
# 7. main에 PR → CI 통과 필수 → prod 배포
```

## 릴리즈 절차

```bash
git checkout -b release/x.y develop
# release 브랜치 → main PR 오픈
# CI 통과 확인 → main 머지 → Vercel Production 자동 배포
```

## 로컬 환경 설정

```bash
cp .env.local.example .env.local
# .env.local 각 항목 실제 값으로 채우기
npm run dev
```

## CI 체크 목록

모든 체크 **필수 통과** (blocking):

| 체크       | 명령어                   | 설명              |
| ---------- | ------------------------ | ----------------- |
| TypeScript | `npm run typecheck`      | 타입 오류         |
| Prettier   | `npx prettier --check .` | 코드 포맷         |
| ESLint     | `npm run lint`           | 린트 규칙         |
| DepCruise  | `npm run depcruise`      | 아키텍처 경계     |
| Drift      | `npm run drift`          | ADR 구조 드리프트 |
| Build      | `npm run build`          | Next.js 빌드      |

## 수동 설정 체크리스트 (1회)

### GitHub Secrets (Actions용)

`GitHub → Settings → Secrets and variables → Actions → New repository secret`

9개 모두 추가 필요:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_PORTONE_STORE_ID`
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD`
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY`
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY`
- [ ] `NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`

> `NEXT_PUBLIC_*` 변수는 브라우저에 노출되는 공개 값이므로 GitHub Secrets 저장 보안 문제 없음.

### GitHub 브랜치 보호 (main)

`GitHub → Settings → Branches → Add branch protection rule → main`

- [ ] **Require status checks to pass before merging** 활성화
  - Required status check: `verify`
- [ ] **Restrict who can push to matching branches** 활성화

### Vercel 환경변수 설정

`Vercel Dashboard → Project → Settings → Environment Variables`

**Production 환경** (main 브랜치):

- [ ] prod Supabase URL / ANON_KEY / SERVICE_ROLE_KEY
- [ ] prod OPENAI_API_KEY
- [ ] prod PORTONE_V2_API_SECRET / PORTONE_WEBHOOK_SECRET
- [ ] prod GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI
- [ ] `NEXT_PUBLIC_APP_URL=https://focusflow.app`
- [ ] `CRON_SECRET`

**Preview 환경** (develop, release/\*):

- [ ] staging Supabase URL / ANON_KEY / SERVICE_ROLE_KEY
- [ ] staging OPENAI_API_KEY
- [ ] staging PortOne, Google 키
- [ ] `NEXT_PUBLIC_APP_URL=https://focusflow-develop.vercel.app`
- [ ] `CRON_SECRET`

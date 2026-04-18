---
name: Dev Flow / CI-CD 개선 구현 플랜
description: alpha/beta/prod 환경 분리, CI blocking 전환, 환경변수 관리 체계화 구현 플랜
verification_status: draft
last_verified: 2026-04-18
owner: harness
---

# Dev Flow / CI-CD 개선 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** alpha(develop) → beta(release/\*) → prod(main) 3단계 환경 분리, CI 체크 blocking 전환, 환경변수 관리 체계화.

**Architecture:** Vercel 단일 프로젝트에서 Preview(staging)/Production(prod) 환경변수 2세트로 운영. GitHub Actions CI의 ESLint/Prettier/Drift를 blocking으로 전환하여 실패 시 배포 차단. `.env.local.example`로 환경변수 온보딩 표준화.

**Tech Stack:** GitHub Actions, Vercel (단일 프로젝트), Supabase (staging/prod 2개), Next.js 16

---

## 사전 확인 (구현 전 읽기)

- 모든 현재 체크 통과 상태 확인됨: ESLint 8 warnings / 0 errors, Prettier 통과, Drift 0 errors
- `continue-on-error` 제거 즉시 가능 (기존 lint 오류 없음)
- `.env.local`의 실제 시크릿 값은 절대 `.env.local.example`에 포함하지 않을 것

---

## 파일 맵

| 파일                                                        | 작업                                              |
| ----------------------------------------------------------- | ------------------------------------------------- |
| `docs/superpowers/specs/2026-04-18-dev-flow-cicd-design.md` | MODIFY: 프런트매터 추가                           |
| `.env.local.example`                                        | CREATE: 환경변수 템플릿                           |
| `.github/workflows/ci.yml`                                  | MODIFY: continue-on-error 제거 + env var 7개 추가 |
| `vercel.json`                                               | MODIFY: 설정 명시                                 |
| `docs/dev-flow.md`                                          | CREATE: 개발 플로우 문서                          |

---

## Task 1: 스펙 문서 프런트매터 추가

**Files:**

- Modify: `docs/superpowers/specs/2026-04-18-dev-flow-cicd-design.md` (상단 4줄 교체)

드리프트 감지기가 `docs/` 마크다운에 프런트매터가 없으면 WARN을 발생시킴. Drift를 blocking으로 바꾸기 전에 이 경고를 제거해야 한다.

- [ ] **Step 1: 스펙 파일 상단 4줄을 프런트매터로 교체**

파일 `docs/superpowers/specs/2026-04-18-dev-flow-cicd-design.md`의 **첫 5줄** (현재 헤더 + 메타):

```markdown
# Dev Flow / CI-CD 개선 설계

**날짜**: 2026-04-18  
**상태**: 승인됨  
**작성**: 브레인스토밍 세션
```

위를 아래로 교체:

```markdown
---
name: Dev Flow / CI-CD 개선 설계
description: alpha/beta/prod 환경 분리, CI blocking 전환, 환경변수 체계화 설계 문서
verification_status: draft
last_verified: 2026-04-18
owner: harness
---

# Dev Flow / CI-CD 개선 설계
```

- [ ] **Step 2: Drift 경고 해소 확인**

```bash
npm run drift
```

Expected output:

```
총 0 errors, 1 warnings
```

(나머지 1 warning은 `docs/generated/db-schema.md` 자동생성 파일로 정상)

- [ ] **Step 3: 커밋**

```bash
git add docs/superpowers/specs/2026-04-18-dev-flow-cicd-design.md
git commit -m "docs: dev-flow-cicd 스펙 프런트매터 추가"
```

---

## Task 2: `.env.local.example` 생성

**Files:**

- Create: `.env.local.example`

- [ ] **Step 1: 파일 생성**

프로젝트 루트에 `.env.local.example` 파일을 아래 내용으로 생성:

```bash
# .env.local.example
# 이 파일을 복사해서 .env.local 을 만드세요:
#   cp .env.local.example .env.local
# 각 항목의 실제 값은 팀 내부 문서 또는 각 서비스 대시보드에서 확인하세요.

# ──────────────────────────────────────────
# Supabase (https://supabase.com/dashboard)
# ──────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon public key
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # service_role key (절대 클라이언트에 노출 금지)

# ──────────────────────────────────────────
# OpenAI (https://platform.openai.com/api-keys)
# ──────────────────────────────────────────
OPENAI_API_KEY=sk-proj-...

# ──────────────────────────────────────────
# PortOne V2 (https://admin.portone.io)
# ──────────────────────────────────────────
PORTONE_V2_API_SECRET=your-portone-v2-api-secret
PORTONE_WEBHOOK_SECRET=whsec_...       # 웹훅 서명 시크릿 (G-01: base64 decode 필요)
NEXT_PUBLIC_PORTONE_STORE_ID=store-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD=channel-key-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY=channel-key-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY=channel-key-...
NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY=channel-key-...

# ──────────────────────────────────────────
# Google Calendar OAuth
# (https://console.cloud.google.com/apis/credentials)
# ──────────────────────────────────────────
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/callback

# ──────────────────────────────────────────
# App
# ──────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3001
CRON_SECRET=your-random-cron-secret     # 크론 엔드포인트 Bearer 토큰

# ──────────────────────────────────────────
# PostHog (https://app.posthog.com)
# ──────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_...

# ──────────────────────────────────────────
# 개발 전용 (dev 환경에서만 사용, prod에는 설정 불필요)
# ──────────────────────────────────────────
# AI 코칭 횟수 제한 해제할 이메일 목록 (쉼표 구분)
DEV_BYPASS_EMAILS=
# DEV_BYPASS_EMAILS에 대응하는 Supabase user UUID (순서 동일, 쉼표 구분)
DEV_BYPASS_USER_IDS=
```

- [ ] **Step 2: `.env.local` 변수 누락 여부 확인**

`.env.local`의 모든 키가 `.env.local.example`에 있는지 확인:

```bash
grep -E '^[A-Z]' .env.local | cut -d= -f1 | sort > /tmp/env_local_keys.txt
grep -E '^[A-Z]' .env.local.example | cut -d= -f1 | sort > /tmp/env_example_keys.txt
diff /tmp/env_local_keys.txt /tmp/env_example_keys.txt
```

Expected output: 차이 없음 (빈 줄)

- [ ] **Step 3: 커밋**

```bash
git add .env.local.example
git commit -m "chore: .env.local.example 추가 (온보딩 템플릿)"
```

---

## Task 3: `ci.yml` 수정 — blocking 전환 + env vars 추가

**Files:**

- Modify: `.github/workflows/ci.yml`

현재 상태 (문제):

- `Prettier (check)`: `continue-on-error: true`
- `ESLint`: `continue-on-error: true`
- `Drift detector`: `continue-on-error: true`
- Build: `NEXT_PUBLIC_*` 2개만 설정

- [ ] **Step 1: 로컬에서 통과 여부 사전 확인**

```bash
npm run lint && echo "LINT OK"
npx prettier --check . && echo "PRETTIER OK"
npm run drift && echo "DRIFT OK"
```

Expected output: 세 줄 모두 `OK`

- [ ] **Step 2: `ci.yml` 전체를 아래로 교체**

파일: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, dev, develop]
  pull_request:
    branches: [main, dev, develop]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Prettier (check)
        run: npx prettier --check .

      - name: ESLint
        run: npm run lint

      - name: dependency-cruiser (ADR-0001/0003 경계 강제)
        run: npm run depcruise

      - name: Drift detector
        run: npm run drift

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

  escalation-check:
    # 결제·인증·마이그레이션 경계 변경 시 라벨 권고
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect high-risk paths
        id: detect
        run: |
          BASE="${{ github.event.pull_request.base.sha }}"
          HEAD="${{ github.event.pull_request.head.sha }}"
          CHANGED=$(git diff --name-only "$BASE" "$HEAD")
          echo "$CHANGED"
          if echo "$CHANGED" | grep -qE '^(src/app/api/payment/|src/app/api/stripe/|src/components/billing/|src/lib/(portone|stripe)\.ts|src/lib/supabase/|middleware\.ts|supabase/migrations/)'; then
            echo "high_risk=true" >> "$GITHUB_OUTPUT"
          else
            echo "high_risk=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Warn (high-risk change)
        if: steps.detect.outputs.high_risk == 'true'
        run: |
          echo "::warning::결제/인증/Supabase/마이그레이션 경계를 변경합니다. docs/escalation-policy.md 확인 필요."
```

- [ ] **Step 3: 로컬 전체 검증**

```bash
npm run lint && npm run typecheck && npx prettier --check . && npm run drift && npm run depcruise
```

Expected output: 모두 0 exit code

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: ESLint/Prettier/Drift blocking 전환 + Build env vars 9개로 확장"
```

---

## Task 4: `vercel.json` 보강

**Files:**

- Modify: `vercel.json`

- [ ] **Step 1: `vercel.json` 교체**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "crons": [
    {
      "path": "/api/cron/ai-insights",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- [ ] **Step 2: JSON 유효성 확인**

```bash
node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('JSON valid')"
```

Expected output: `JSON valid`

- [ ] **Step 3: 커밋**

```bash
git add vercel.json
git commit -m "chore: vercel.json 프레임워크/빌드 설정 명시"
```

---

## Task 5: `docs/dev-flow.md` 작성

**Files:**

- Create: `docs/dev-flow.md`

- [ ] **Step 1: 파일 생성**

Write 도구를 사용해 `docs/dev-flow.md`를 아래 내용으로 생성한다 (중첩 코드블록으로 인해 bash heredoc 사용):

```bash
cat > docs/dev-flow.md << 'EOF'
---
name: 개발 플로우 가이드
description: 브랜치 전략, 환경 매핑, 신규 개발 시작 절차, 수동 설정 체크리스트
verification_status: verified
last_verified: 2026-04-18
owner: harness
---

# 개발 플로우 가이드

## 환경 매핑

| 브랜치 | Vercel 환경 | Supabase | URL |
|--------|-------------|----------|-----|
| develop | Preview (alpha) | staging | focusflow-develop-xxx.vercel.app |
| release/* | Preview (beta) | staging | focusflow-release-xxx.vercel.app |
| main | Production (prod) | prod | focusflow.app |

    feature/*
        ↓ PR → develop
    develop ──────────────→ Vercel Preview (alpha) ─→ staging Supabase
        ↓ PR → release/x.y
    release/x.y ──────────→ Vercel Preview (beta)  ─→ staging Supabase
        ↓ PR → main
    main ─────────────────→ Vercel Production (prod) → prod Supabase

## 신규 기능 개발 절차

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

## 릴리즈 절차

    git checkout -b release/x.y develop
    # release 브랜치 → main PR 오픈
    # CI 통과 확인 → main 머지 → Vercel Production 자동 배포

## 로컬 환경 설정

    cp .env.local.example .env.local
    # .env.local 각 항목 실제 값으로 채우기
    npm run dev

## CI 체크 목록

모든 체크 **필수 통과** (blocking):

| 체크 | 명령어 | 설명 |
|------|--------|------|
| TypeScript | npm run typecheck | 타입 오류 |
| Prettier | npx prettier --check . | 코드 포맷 |
| ESLint | npm run lint | 린트 규칙 |
| DepCruise | npm run depcruise | 아키텍처 경계 |
| Drift | npm run drift | ADR 구조 드리프트 |
| Build | npm run build | Next.js 빌드 |

## 수동 설정 체크리스트 (1회)

### GitHub Secrets (Actions용)

GitHub → Settings → Secrets and variables → Actions → New repository secret

7개 추가 필요 (기존 2개 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 는 이미 있음):

- NEXT_PUBLIC_APP_URL (staging: https://focusflow-develop.vercel.app 또는 Vercel Preview URL)
- NEXT_PUBLIC_PORTONE_STORE_ID
- NEXT_PUBLIC_PORTONE_CHANNEL_KEY_CARD
- NEXT_PUBLIC_PORTONE_CHANNEL_KEY_KAKAOPAY
- NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY
- NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY
- NEXT_PUBLIC_POSTHOG_KEY

NEXT_PUBLIC_* 변수는 브라우저에 노출되는 공개 값이므로 GitHub Secrets 저장 보안 문제 없음.

### GitHub 브랜치 보호 (main)

GitHub → Settings → Branches → Add branch protection rule → main

- Require status checks to pass before merging: 활성화
  → Required status check: verify (ci.yml job 이름)
- Restrict who can push to matching branches: 활성화
- Require a pull request before merging: 제외 (1인 개발)

### Vercel 환경변수 설정

Vercel Dashboard → Project → Settings → Environment Variables

Production 환경 (main 브랜치 → focusflow.app):
- prod Supabase URL / ANON_KEY / SERVICE_ROLE_KEY
- prod OPENAI_API_KEY
- prod PORTONE_V2_API_SECRET / PORTONE_WEBHOOK_SECRET
- prod GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI
- NEXT_PUBLIC_APP_URL=https://focusflow.app
- CRON_SECRET

Preview 환경 (develop, release/* → staging):
- staging Supabase URL / ANON_KEY / SERVICE_ROLE_KEY
- staging (또는 공유) OPENAI_API_KEY
- staging PortOne, Google 키
- NEXT_PUBLIC_APP_URL=https://focusflow-develop.vercel.app
- CRON_SECRET
EOF
```

- [ ] **Step 2: Drift 경고 없음 확인**

```bash
npm run drift
```

Expected: `총 0 errors, 1 warnings` (db-schema.md 자동생성 파일 1개만 남음)

- [ ] **Step 3: 커밋**

```bash
git add docs/dev-flow.md
git commit -m "docs: 개발 플로우 가이드 추가 (브랜치 전략, 환경 매핑, 수동 설정 체크리스트)"
```

---

## 검증 (모든 Task 완료 후)

- [ ] `npm run lint && npm run typecheck && npx prettier --check . && npm run drift && npm run depcruise` → 모두 통과
- [ ] `feature/test-ci` 브랜치 생성 → develop PR 오픈 → GitHub Actions CI 실행 확인
- [ ] 의도적 ESLint 오류 추가 (예: `var x = 1`) → CI 실패 확인 → 오류 제거 후 통과 확인
- [ ] GitHub Secrets 7개 추가 완료 → CI Build 단계 통과 확인
- [ ] GitHub main 브랜치 보호 설정 → CI 없이 머지 불가 확인
- [ ] Vercel 환경변수 2세트 설정 → develop push 시 Preview URL 생성, staging DB 연결 확인

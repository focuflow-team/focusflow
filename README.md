# FocusFlow

집중력을 높이고 생산성을 극대화하는 AI 기반 포모도로 & 집중 타이머 앱입니다.

## 주요 기능

- **집중 타이머** - 포모도로 기법 기반의 집중/휴식 세션 관리
- **AI 집중 분석** - OpenAI를 활용한 집중력 패턴 분석 및 인사이트 제공
- **통계 대시보드** - 일별/주별/월별 집중 시간 시각화
- **Google Calendar 연동** - 캘린더 일정과 집중 세션 통합 관리
- **리더보드** - 사용자 간 집중 시간 순위 비교
- **구독 결제** - Stripe 기반 Pro/Team 플랜 운영
- **브라우저 익스텐션** - Chrome 확장 프로그램으로 방해 사이트 차단
- **블로그** - 집중력 향상 관련 콘텐츠 마케팅

## 기술 스택

| 카테고리 | 기술 |
|---|---|
| 프레임워크 | Next.js 16, React 19 |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS v4, shadcn/ui |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Supabase Auth |
| 결제 | Stripe |
| AI | OpenAI API |
| 캘린더 | Google Calendar API |
| 배포 | Vercel |

## 사전 요구사항

- **Node.js** v20 이상
- **npm** v10 이상
- [Supabase](https://supabase.com) 계정
- [Stripe](https://stripe.com) 계정 (결제 기능 사용 시)
- [OpenAI](https://platform.openai.com) API 키 (AI 분석 기능 사용 시)
- [Google Cloud](https://console.cloud.google.com) 프로젝트 (캘린더 연동 사용 시)

## 설치 및 실행 방법

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/focusflow.git
cd focusflow
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local.example` 파일을 복사하여 `.env.local` 파일을 생성합니다:

```bash
cp .env.local.example .env.local
```

각 항목을 아래 [환경 변수 설명](#환경-변수-설명) 섹션을 참고하여 채워주세요.

### 4. Supabase 마이그레이션 실행

Supabase CLI가 설치되어 있어야 합니다:

```bash
npm install -g supabase
```

Supabase 프로젝트에 접속하여 마이그레이션을 실행합니다:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

또는 Supabase 대시보드 > SQL Editor에서 아래 파일들을 순서대로 실행합니다:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_social_features.sql`

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 앱이 실행됩니다.

---

## 환경 변수 설명

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# Google Calendar
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-cron-secret

# PostHog (선택)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

| 변수명 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 (서버 전용, 절대 클라이언트에 노출 금지) |
| `OPENAI_API_KEY` | OpenAI API 키 (AI 집중 분석 기능) |
| `STRIPE_SECRET_KEY` | Stripe 시크릿 키 (서버 전용) |
| `STRIPE_WEBHOOK_SECRET` | Stripe 웹훅 검증 시크릿 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 퍼블리셔블 키 (클라이언트) |
| `STRIPE_PRO_PRICE_ID` | Stripe Pro 플랜 Price ID |
| `STRIPE_TEAM_PRICE_ID` | Stripe Team 플랜 Price ID |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 |
| `GOOGLE_REDIRECT_URI` | Google OAuth 리다이렉트 URI |
| `NEXT_PUBLIC_APP_URL` | 앱의 공개 URL (로컬: `http://localhost:3000`) |
| `CRON_SECRET` | Cron 작업 인증 시크릿 |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog 분석 키 (선택 사항) |

---

## Supabase 프로젝트 생성 및 연결

1. [supabase.com](https://supabase.com)에서 계정을 생성하고 새 프로젝트를 만듭니다.
2. 프로젝트 대시보드 > **Settings > API** 에서 다음 값을 복사합니다:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY`
3. 위 [마이그레이션 실행](#4-supabase-마이그레이션-실행) 단계를 통해 DB 스키마를 초기화합니다.
4. **Authentication > Providers** 에서 이메일/비밀번호 또는 소셜 로그인을 활성화합니다.

---

## Stripe 테스트 모드 설정

1. [stripe.com](https://stripe.com)에서 계정을 생성합니다.
2. **Developers > API keys** 에서 테스트 모드 키를 복사합니다:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
3. **Products** 메뉴에서 두 가지 구독 상품을 만듭니다 (Pro, Team):
   - 각 상품의 Price ID → `STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID`
4. **Developers > Webhooks** 에서 엔드포인트를 추가합니다:
   - URL: `https://your-domain.com/api/stripe/webhook` (로컬 테스트 시 Stripe CLI 사용)
   - 이벤트: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`
   - Webhook Signing Secret → `STRIPE_WEBHOOK_SECRET`
5. 로컬 테스트 시 Stripe CLI로 웹훅을 포워딩합니다:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

---

## Google Calendar API 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 새 프로젝트를 생성합니다.
2. **APIs & Services > Library** 에서 **Google Calendar API** 를 활성화합니다.
3. **APIs & Services > Credentials** 에서 **OAuth 2.0 Client ID** 를 생성합니다:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/calendar/callback`
4. 생성된 **Client ID** → `GOOGLE_CLIENT_ID`, **Client Secret** → `GOOGLE_CLIENT_SECRET`
5. **OAuth consent screen** 을 설정하고 테스트 사용자를 추가합니다.

---

## 배포 방법 (Vercel)

1. [vercel.com](https://vercel.com)에서 계정 생성 후 GitHub 저장소를 연결합니다.
2. **New Project** > 저장소 선택 > **Import**
3. **Environment Variables** 섹션에서 `.env.local`의 모든 항목을 입력합니다.
   - `NEXT_PUBLIC_APP_URL`은 Vercel 배포 URL로 변경합니다.
   - `GOOGLE_REDIRECT_URI`도 배포 URL에 맞게 업데이트합니다.
4. **Deploy** 버튼 클릭
5. 배포 완료 후 Stripe 웹훅 URL을 프로덕션 URL로 업데이트합니다.

---

## 브라우저 익스텐션 설치

`extension/` 디렉터리에 Chrome 확장 프로그램이 포함되어 있습니다.

1. Chrome에서 `chrome://extensions/` 열기
2. **개발자 모드** 활성화 (우측 상단 토글)
3. **압축 해제된 확장 프로그램 로드** 클릭
4. `extension/` 폴더 선택

---

## 프로젝트 구조

```
focusflow/
├── src/
│   ├── app/
│   │   ├── (auth)/          # 로그인, 회원가입 페이지
│   │   ├── (dashboard)/     # 랜딩 페이지 레이아웃
│   │   ├── app/             # 앱 메인 (인증 필요)
│   │   │   ├── page.tsx     # 집중 타이머 메인
│   │   │   ├── stats/       # 통계 페이지
│   │   │   ├── settings/    # 설정 페이지
│   │   │   ├── billing/     # 구독/결제 페이지
│   │   │   ├── pricing/     # 요금제 안내
│   │   │   └── leaderboard/ # 리더보드
│   │   ├── api/             # API 라우트
│   │   │   ├── ai/          # AI 분석 API
│   │   │   ├── calendar/    # Google Calendar API
│   │   │   ├── stripe/      # Stripe 결제 API
│   │   │   ├── sessions/    # 집중 세션 API
│   │   │   └── share/       # 공유 API
│   │   ├── blog/            # 블로그 (MDX)
│   │   ├── focus-test/      # 집중력 테스트
│   │   ├── share/           # 공유 페이지
│   │   └── u/               # 공개 프로필
│   ├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── hooks/               # React 커스텀 훅
│   ├── lib/                 # 유틸리티, 외부 서비스 클라이언트
│   └── types/               # TypeScript 타입 정의
├── supabase/
│   └── migrations/          # DB 마이그레이션 SQL
├── extension/               # Chrome 브라우저 익스텐션
├── content/
│   └── blog/                # 블로그 MDX 콘텐츠
├── public/                  # 정적 파일
└── .env.local.example       # 환경 변수 예시
```

---

## 스크립트

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 실행
```

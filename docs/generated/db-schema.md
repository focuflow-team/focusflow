## <!-- 자동 생성 파일. 수동 편집 금지. source: supabase/migrations/ -->

name: DB Schema (Generated)
description: supabase/migrations/\*.sql을 병합한 현재 스키마 스냅샷
verification_status: verified
last_verified: 2026-04-13
owner: harness

---

# DB Schema — FocusFlow

생성 스크립트: `scripts/generate-db-docs.sh`

## `001_initial_schema.sql`

```sql
-- ============================================================
-- FocusFlow 초기 스키마
-- ============================================================

-- 1. PROFILES 테이블
-- auth.users와 1:1 연동, 구독/설정 정보 보관
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT        NOT NULL,
  display_name            TEXT,
  avatar_url              TEXT,
  subscription_tier       TEXT        NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
  stripe_customer_id      TEXT        UNIQUE,
  stripe_subscription_id  TEXT        UNIQUE,
  timezone                TEXT        NOT NULL DEFAULT 'Asia/Seoul',
  settings                JSONB       NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. FOCUS_SESSIONS 테이블
-- 포모도로 세션 기록
-- ============================================================
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_name               TEXT,
  duration_minutes        INTEGER     NOT NULL DEFAULT 25 CHECK (duration_minutes > 0),
  break_duration_minutes  INTEGER     NOT NULL DEFAULT 5  CHECK (break_duration_minutes >= 0),
  status                  TEXT        NOT NULL DEFAULT 'in_progress' CHECK (status IN ('completed', 'interrupted', 'in_progress')),
  interruptions           INTEGER     NOT NULL DEFAULT 0  CHECK (interruptions >= 0),
  mood_before             SMALLINT    CHECK (mood_before BETWEEN 1 AND 5),
  mood_after              SMALLINT    CHECK (mood_after  BETWEEN 1 AND 5),
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at                TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. AI_INSIGHTS 테이블
-- AI 코칭 인사이트 저장
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type TEXT        NOT NULL CHECK (insight_type IN ('daily_summary', 'pattern_analysis', 'recommendation')),
  content      TEXT        NOT NULL,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id    ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON public.focus_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started
  ON public.focus_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id       ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created_at    ON public.ai_insights(created_at DESC);

-- ============================================================
-- 5. Row Level Security (RLS)
-- 모든 테이블: 자신의 데이터만 읽기/쓰기/수정/삭제 가능
-- ============================================================

-- profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: 본인 조회" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: 본인 수정" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- focus_sessions RLS
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: 본인 조회" ON public.focus_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sessions: 본인 생성" ON public.focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions: 본인 수정" ON public.focus_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions: 본인 삭제" ON public.focus_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ai_insights RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insights: 본인 조회" ON public.ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insights: 본인 생성" ON public.ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insights: 본인 삭제" ON public.ai_insights
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 6. 신규 사용자 프로필 자동 생성 트리거
-- auth.users에 신규 레코드 추가 시 profiles 자동 생성
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. updated_at 자동 갱신 트리거 (profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## `002_social_features.sql`

```sql
-- ============================================================
-- FocusFlow 소셜 기능 마이그레이션
-- ============================================================

-- 1. profiles 테이블 확장 (공개 프로필, 사용자명)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weekly_streak   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_focus_minutes INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON public.profiles(is_public) WHERE is_public = true;

-- 2. USER_FOLLOWS 테이블 (팔로우 시스템)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower   ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following  ON public.user_follows(following_id);

-- 3. RLS for user_follows
-- ============================================================
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows: 팔로우 관계 조회" ON public.user_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "follows: 팔로우 추가" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows: 언팔로우" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 4. 공개 프로필 조회 RLS 추가
-- ============================================================
CREATE POLICY "profiles: 공개 프로필 조회" ON public.profiles
  FOR SELECT USING (is_public = true);

-- 5. 주간 리더보드 뷰 (공개 사용자의 이번 주 집중 시간)
-- ============================================================
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT
  p.id         AS user_id,
  p.display_name,
  p.username,
  p.avatar_url,
  COALESCE(SUM(fs.duration_minutes), 0) AS weekly_minutes,
  COUNT(fs.id) AS weekly_sessions
FROM public.profiles p
LEFT JOIN public.focus_sessions fs
  ON fs.user_id = p.id
  AND fs.status = 'completed'
  AND fs.started_at >= date_trunc('week', now())
  AND fs.started_at < date_trunc('week', now()) + INTERVAL '7 days'
WHERE p.is_public = true
GROUP BY p.id, p.display_name, p.username, p.avatar_url
ORDER BY weekly_minutes DESC
LIMIT 100;
```

## `003_portone.sql`

```sql
-- PortOne 결제 연동을 위한 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS portone_billing_key     TEXT,
  ADD COLUMN IF NOT EXISTS portone_next_billing_at TIMESTAMPTZ;

-- 인덱스: 다음 결제일 기준 조회 (cron 작업용)
CREATE INDEX IF NOT EXISTS idx_profiles_portone_next_billing_at
  ON profiles (portone_next_billing_at)
  WHERE portone_billing_key IS NOT NULL AND subscription_tier != 'free';
```

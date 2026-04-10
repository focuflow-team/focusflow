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

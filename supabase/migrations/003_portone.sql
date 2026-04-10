-- PortOne 결제 연동을 위한 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS portone_billing_key     TEXT,
  ADD COLUMN IF NOT EXISTS portone_next_billing_at TIMESTAMPTZ;

-- 인덱스: 다음 결제일 기준 조회 (cron 작업용)
CREATE INDEX IF NOT EXISTS idx_profiles_portone_next_billing_at
  ON profiles (portone_next_billing_at)
  WHERE portone_billing_key IS NOT NULL AND subscription_tier != 'free';

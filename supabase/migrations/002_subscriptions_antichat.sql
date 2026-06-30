-- ============================================================
-- CV Builder - Migration 002: Subscriptions + Anti-Cheat
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. Add anti-cheat columns to cvs table
-- ============================================================
ALTER TABLE public.cvs
  ADD COLUMN IF NOT EXISTS content_fingerprint TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT DEFAULT '';

-- ============================================================
-- 2. Subscriptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' | 'business'
  status      TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'cancelled'
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 3. CV creation log (tracks ALL CVs ever created, even deleted)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cv_creation_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_id           UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  fingerprint     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. RLS for subscriptions
-- ============================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_creation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Creation log: users can only insert, not delete
DROP POLICY IF EXISTS "Users can insert creation log" ON public.cv_creation_log;
CREATE POLICY "Users can insert creation log"
  ON public.cv_creation_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own creation log" ON public.cv_creation_log;
CREATE POLICY "Users can view own creation log"
  ON public.cv_creation_log FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. Remove DELETE policy from cvs (users can edit, NOT delete)
-- ============================================================
DROP POLICY IF EXISTS "Users can delete own CVs" ON public.cvs;

-- ============================================================
-- 6. Trigger: Auto-create free subscription on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

-- ============================================================
-- 7. Trigger: Auto-update updated_at on subscriptions
-- ============================================================
DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_creation_log_user_id ON public.cv_creation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_flagged ON public.cvs(is_flagged);

-- ============================================================
-- CV Builder — COMPLETE DATABASE SETUP
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- ============================================================

-- Required extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Profiles table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  city         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CVs table (with anti-cheat columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cvs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL DEFAULT 'My CV',
  template_id         TEXT NOT NULL DEFAULT 'modern',
  content             JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_fingerprint TEXT DEFAULT '',
  is_flagged          BOOLEAN DEFAULT FALSE,
  flag_reason         TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CV Analyses table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cv_analyses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id      UUID NOT NULL REFERENCES public.cvs(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL DEFAULT 0,
  analysis   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Subscriptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL DEFAULT 'free',
  status      TEXT NOT NULL DEFAULT 'active',
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 5. CV Creation Log (audit trail — cannot be deleted by users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cv_creation_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_id       UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  fingerprint TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Device Fingerprints table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint   TEXT NOT NULL,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_seen    TIMESTAMPTZ DEFAULT NOW(),
  account_count INTEGER DEFAULT 1
);

-- ============================================================
-- 7. Payment Requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL,
  payment_method  TEXT NOT NULL,
  transaction_ref TEXT NOT NULL,
  payment_date    DATE NOT NULL,
  screenshot_url  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  admin_notes     TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

-- ============================================================
-- 8. Activation Codes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'unused',
  used_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_by  TEXT DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. Functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_activation_code(plan_name TEXT)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INTEGER;
BEGIN
  new_code := '';
  FOR i IN 1..12 LOOP
    new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    IF i = 4 OR i = 8 THEN
      new_code := new_code || '-';
    END IF;
  END LOOP;
  INSERT INTO public.activation_codes (code, plan, status, expires_at)
  VALUES (new_code, plan_name, 'unused', NOW() + INTERVAL '30 days');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. Triggers
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

DROP TRIGGER IF EXISTS cvs_updated_at ON public.cvs;
CREATE TRIGGER cvs_updated_at
  BEFORE UPDATE ON public.cvs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 11. Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_creation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CVs (NO DELETE — users can edit only)
DROP POLICY IF EXISTS "Users can view own CVs" ON public.cvs;
CREATE POLICY "Users can view own CVs" ON public.cvs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own CVs" ON public.cvs;
CREATE POLICY "Users can insert own CVs" ON public.cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own CVs" ON public.cvs;
CREATE POLICY "Users can update own CVs" ON public.cvs FOR UPDATE USING (auth.uid() = user_id);

-- CV Analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON public.cv_analyses;
CREATE POLICY "Users can view own analyses" ON public.cv_analyses FOR SELECT USING (cv_id IN (SELECT id FROM public.cvs WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.cv_analyses;
CREATE POLICY "Users can insert own analyses" ON public.cv_analyses FOR INSERT WITH CHECK (cv_id IN (SELECT id FROM public.cvs WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.cv_analyses;
CREATE POLICY "Users can delete own analyses" ON public.cv_analyses FOR DELETE USING (cv_id IN (SELECT id FROM public.cvs WHERE user_id = auth.uid()));

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CV Creation Log
DROP POLICY IF EXISTS "Users can insert creation log" ON public.cv_creation_log;
CREATE POLICY "Users can insert creation log" ON public.cv_creation_log FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own creation log" ON public.cv_creation_log;
CREATE POLICY "Users can view own creation log" ON public.cv_creation_log FOR SELECT USING (auth.uid() = user_id);

-- Device Fingerprints
DROP POLICY IF EXISTS "Users can insert device fp" ON public.device_fingerprints;
CREATE POLICY "Users can insert device fp" ON public.device_fingerprints FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view own device fp" ON public.device_fingerprints;
CREATE POLICY "Users can view own device fp" ON public.device_fingerprints FOR SELECT USING (user_id = auth.uid());

-- Payment Requests
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_requests;
CREATE POLICY "Users can view own payments" ON public.payment_requests FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert payments" ON public.payment_requests;
CREATE POLICY "Users can insert payments" ON public.payment_requests FOR INSERT WITH CHECK (user_id = auth.uid());

-- Activation Codes
DROP POLICY IF EXISTS "Users can view activation codes" ON public.activation_codes;
CREATE POLICY "Users can view activation codes" ON public.activation_codes FOR SELECT USING (status = 'unused');
DROP POLICY IF EXISTS "Users can update activation codes" ON public.activation_codes;
CREATE POLICY "Users can update activation codes" ON public.activation_codes FOR UPDATE USING (status = 'unused');

-- ============================================================
-- 12. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_cv_id ON public.cv_analyses(cv_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_creation_log_user_id ON public.cv_creation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_flagged ON public.cvs(is_flagged);
CREATE INDEX IF NOT EXISTS idx_device_fp_hash ON public.device_fingerprints(fingerprint);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);

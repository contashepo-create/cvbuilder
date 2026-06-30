-- ============================================================
-- Migration 003: Device Fingerprints + Payment Requests + Activation Codes
-- Run AFTER 001 and 002
-- ============================================================

-- ============================================================
-- 1. Device fingerprints table (anti multi-account abuse)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint   TEXT NOT NULL,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_seen    TIMESTAMPTZ DEFAULT NOW(),
  account_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_device_fp_hash ON public.device_fingerprints(fingerprint);

-- ============================================================
-- 2. Payment requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL, -- 'starter' | 'pro'
  payment_method  TEXT NOT NULL, -- 'orange_cash' | 'bank_transfer' | 'instapay'
  transaction_ref TEXT NOT NULL,
  payment_date    DATE NOT NULL,
  screenshot_url  TEXT, -- Supabase storage URL or empty
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_notes     TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);

-- ============================================================
-- 3. Activation codes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL, -- 'starter' | 'pro'
  status      TEXT NOT NULL DEFAULT 'unused', -- 'unused' | 'used' | 'expired'
  used_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_by  TEXT DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);

-- ============================================================
-- 4. RLS policies
-- ============================================================
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Device fingerprints: users can only insert (system manages rest)
DROP POLICY IF EXISTS "Users can insert device fp" ON public.device_fingerprints;
CREATE POLICY "Users can insert device fp"
  ON public.device_fingerprints FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own device fp" ON public.device_fingerprints;
CREATE POLICY "Users can view own device fp"
  ON public.device_fingerprints FOR SELECT
  USING (user_id = auth.uid());

-- Payment requests: users can view own + insert, no update/delete
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_requests;
CREATE POLICY "Users can view own payments"
  ON public.payment_requests FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert payments" ON public.payment_requests;
CREATE POLICY "Users can insert payments"
  ON public.payment_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Activation codes: users can only SELECT (to verify) and UPDATE (to use)
DROP POLICY IF EXISTS "Users can view activation codes" ON public.activation_codes;
CREATE POLICY "Users can view activation codes"
  ON public.activation_codes FOR SELECT
  USING (status = 'unused');

DROP POLICY IF EXISTS "Users can update activation codes" ON public.activation_codes;
CREATE POLICY "Users can update activation codes"
  ON public.activation_codes FOR UPDATE
  USING (status = 'unused');

-- ============================================================
-- 5. Function: generate activation code
-- ============================================================
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

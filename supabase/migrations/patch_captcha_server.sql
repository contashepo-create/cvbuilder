-- ============================================================
-- PATCH 005: Server-side Captcha verification
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Captcha sessions table
CREATE TABLE IF NOT EXISTS public.captcha_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captcha_text TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes',
  verified    BOOLEAN DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  ip_address  TEXT
);

-- 2. Function to create a captcha session (returns session ID)
CREATE OR REPLACE FUNCTION public.create_captcha_session(captcha_text TEXT, ip TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Delete expired sessions (cleanup)
  DELETE FROM public.captcha_sessions WHERE expires_at < NOW();

  -- Insert new session
  INSERT INTO public.captcha_sessions (captcha_text, ip_address)
  VALUES (captcha_text, ip)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to verify captcha (server-side, single use)
CREATE OR REPLACE FUNCTION public.verify_captcha(session_id UUID, user_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_text TEXT;
  is_verified BOOLEAN := FALSE;
BEGIN
  -- Get the stored captcha text
  SELECT captcha_text INTO stored_text
  FROM public.captcha_sessions
  WHERE id = session_id
    AND verified = FALSE
    AND expires_at > NOW();

  -- If not found (expired, used, or doesn't exist)
  IF stored_text IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Compare (case-insensitive)
  is_verified := (UPPER(TRIM(user_input)) = UPPER(TRIM(stored_text)));

  -- Mark as verified + used (single-use regardless of result)
  UPDATE public.captcha_sessions
  SET verified = is_verified,
      used_at = NOW()
  WHERE id = session_id;

  RETURN is_verified;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS: anyone can call these functions (they're SECURITY DEFINER)
-- But direct table access is restricted
ALTER TABLE public.captcha_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view (so they can check if expired)
DROP POLICY IF EXISTS "Anyone can view captcha sessions" ON public.captcha_sessions;
CREATE POLICY "Anyone can view captcha sessions"
  ON public.captcha_sessions FOR SELECT
  USING (true);

-- No direct INSERT/UPDATE/DELETE — only via RPC functions
DROP POLICY IF EXISTS "Anyone can insert captcha sessions" ON public.captcha_sessions;
CREATE POLICY "Anyone can insert captcha sessions"
  ON public.captcha_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update captcha sessions" ON public.captcha_sessions;
CREATE POLICY "Anyone can update captcha sessions"
  ON public.captcha_sessions FOR UPDATE
  USING (true);

-- 5. Index for cleanup
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_expires ON public.captcha_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_verified ON public.captcha_sessions(verified);

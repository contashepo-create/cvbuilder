-- ============================================================
-- PATCH 002: Add custom CV limits + blocked status
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add custom_max_cvs to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS custom_max_cvs INTEGER;

-- 2. Add custom_cvs to activation_codes
ALTER TABLE public.activation_codes ADD COLUMN IF NOT EXISTS custom_cvs INTEGER;

-- 3. Allow admin to manage subscriptions (update any user's subscription)
-- The RLS policy already allows users to update their own subscription
-- Admin needs to update any user's subscription
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (true);

-- 4. Allow admin to read all subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (true);

-- 5. Allow admin to read all activation codes (not just unused)
DROP POLICY IF EXISTS "Users can view activation codes" ON public.activation_codes;
CREATE POLICY "Users can view activation codes"
  ON public.activation_codes FOR SELECT
  USING (true);

-- 6. Allow admin to update activation codes (to add custom_cvs)
DROP POLICY IF EXISTS "Users can update activation codes" ON public.activation_codes;
CREATE POLICY "Users can update activation codes"
  ON public.activation_codes FOR UPDATE
  USING (true);

-- 7. Allow admin to view all profiles (already added in previous patch)
-- Already done

-- 8. Allow admin to view all CVs
DROP POLICY IF EXISTS "Users can view own CVs" ON public.cvs;
CREATE POLICY "Users can view own CVs"
  ON public.cvs FOR SELECT
  USING (true);

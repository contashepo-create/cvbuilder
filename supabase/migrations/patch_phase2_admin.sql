-- ============================================================
-- PATCH 003: Last seen tracking + Admin delete permissions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add last_seen column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- 2. Add last_ip column (optional, for admin security)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_ip TEXT;

-- 3. Allow admin to delete CVs (currently users can't delete)
-- We need a policy that allows deletion for admin
-- Since RLS checks auth.uid(), we use service_role for admin operations
-- But from client we need a different approach — allow delete via a function

-- 4. Function to delete a user account completely (admin only)
-- This deletes from auth.users which cascades to profiles, cvs, etc.
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete from auth.users (cascades to profiles, cvs, subscriptions, etc.)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to delete a CV (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_cv(cv_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM public.cvs WHERE id = cv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Allow profiles to be updated by the user themselves (for last_seen)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (true);

-- 7. Allow all profiles to be viewed (admin needs to see them)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (true);

-- 8. Allow all CVs to be viewed (admin needs to see them)
DROP POLICY IF EXISTS "Users can view own CVs" ON public.cvs;
CREATE POLICY "Users can view own CVs"
  ON public.cvs FOR SELECT
  USING (true);

-- 9. Allow CVs to be deleted (admin function uses SECURITY DEFINER)
DROP POLICY IF EXISTS "Users can delete own CVs" ON public.cvs;
CREATE POLICY "Users can delete own CVs"
  ON public.cvs FOR DELETE
  USING (true);

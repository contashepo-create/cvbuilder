-- ============================================================
-- PATCH 007: Add admin_approved column to CVs
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add admin_approved column
ALTER TABLE public.cvs ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE;

-- When admin approves a CV, admin_approved = TRUE
-- This prevents the anti-cheat from re-flagging it on next save
-- The flag can only come back if a NEW violation occurs after approval

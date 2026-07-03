-- ============================================================
-- PATCH 006: Payment methods + contact links in database
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  number      TEXT NOT NULL,
  icon        TEXT DEFAULT '💰',
  details_ar  TEXT DEFAULT '',
  details_en  TEXT DEFAULT '',
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contact links table
CREATE TABLE IF NOT EXISTS public.contact_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon        TEXT DEFAULT '💬',
  color       TEXT DEFAULT '#2563eb',
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert default payment methods
INSERT INTO public.payment_methods (name_ar, name_en, number, icon, details_ar, details_en, is_active, sort_order) VALUES
  ('أورانج كاش', 'Orange Cash', '01000000000', '🟠', '', '', TRUE, 1),
  ('تحويل بنكي', 'Bank Transfer', 'ACC-123456789', '🏦', 'بنك مصر - فرع الرئيسي', 'Banque Misr - Main Branch', TRUE, 2),
  ('إنستا باي', 'InstaPay', 'instapay@your-handle', '⚡', '', '', TRUE, 3)
ON CONFLICT DO NOTHING;

-- 4. Insert default contact links
INSERT INTO public.contact_links (name_ar, name_en, url, icon, color, is_active, sort_order) VALUES
  ('واتساب', 'WhatsApp', 'https://wa.me/201234567890', '💬', '#25D366', TRUE, 1),
  ('تليجرام', 'Telegram', 'https://t.me/your_telegram_username', '✈️', '#0088cc', TRUE, 2)
ON CONFLICT DO NOTHING;

-- 5. RLS — anyone can view, admin can manage
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can view payment methods" ON public.payment_methods FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can insert payment methods" ON public.payment_methods FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can update payment methods" ON public.payment_methods FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can delete payment methods" ON public.payment_methods FOR DELETE USING (true);

DROP POLICY IF EXISTS "Anyone can view contact links" ON public.contact_links;
CREATE POLICY "Anyone can view contact links" ON public.contact_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert contact links" ON public.contact_links;
CREATE POLICY "Anyone can insert contact links" ON public.contact_links FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update contact links" ON public.contact_links;
CREATE POLICY "Anyone can update contact links" ON public.contact_links FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete contact links" ON public.contact_links;
CREATE POLICY "Anyone can delete contact links" ON public.contact_links FOR DELETE USING (true);

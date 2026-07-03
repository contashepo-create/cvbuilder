-- ============================================================
-- PATCH 004: Ads + Visitors + Messages + Contact
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Ads table (banners + popups + scrolling text)
CREATE TABLE IF NOT EXISTS public.ads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL DEFAULT 'banner', -- 'banner' | 'popup' | 'scrolling'
  title         TEXT NOT NULL DEFAULT '',
  content       TEXT NOT NULL DEFAULT '',
  link_url      TEXT DEFAULT '',
  link_text     TEXT DEFAULT '',
  bg_color      TEXT DEFAULT '#2563eb',
  text_color    TEXT DEFAULT '#ffffff',
  is_active     BOOLEAN DEFAULT TRUE,
  show_on_pages TEXT DEFAULT 'all', -- 'all' | 'home' | 'dashboard' etc
  views         INTEGER DEFAULT 0,
  dismissals    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

-- 2. Ad views tracking (who saw what)
CREATE TABLE IF NOT EXISTS public.ad_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id      UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ad dismissals (user clicked "don't show again")
CREATE TABLE IF NOT EXISTS public.ad_dismissals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id      UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_id, user_id)
);

-- 4. Visitor tracking
CREATE TABLE IF NOT EXISTS public.visitors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  user_agent TEXT,
  page       TEXT,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User messages to admin
CREATE TABLE IF NOT EXISTS public.user_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name  TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'unread', -- 'unread' | 'read' | 'replied'
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Site settings (visitor count offset, scrolling text, etc)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key               TEXT NOT NULL UNIQUE,
  value             TEXT NOT NULL DEFAULT '',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('visitor_count_offset', '1000'),
  ('scrolling_text_ar', 'مرحباً بكم في CV Builder — أول سي في مجاني'),
  ('scrolling_text_en', 'Welcome to CV Builder — your first CV is free'),
  ('scrolling_enabled', 'true'),
  ('whatsapp_number', ''),
  ('telegram_contact', 'https://t.me/your_telegram_username')
ON CONFLICT (key) DO NOTHING;

-- 7. RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Ads: everyone can view active ads, admin can manage all
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.ads;
CREATE POLICY "Anyone can view active ads" ON public.ads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert ads" ON public.ads;
CREATE POLICY "Anyone can insert ads" ON public.ads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update ads" ON public.ads;
CREATE POLICY "Anyone can update ads" ON public.ads FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete ads" ON public.ads;
CREATE POLICY "Anyone can delete ads" ON public.ads FOR DELETE USING (true);

-- Ad views: anyone can insert
DROP POLICY IF EXISTS "Anyone can insert ad views" ON public.ad_views;
CREATE POLICY "Anyone can insert ad views" ON public.ad_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view ad views" ON public.ad_views;
CREATE POLICY "Anyone can view ad views" ON public.ad_views FOR SELECT USING (true);

-- Ad dismissals
DROP POLICY IF EXISTS "Anyone can insert dismissals" ON public.ad_dismissals;
CREATE POLICY "Anyone can insert dismissals" ON public.ad_dismissals FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view dismissals" ON public.ad_dismissals;
CREATE POLICY "Anyone can view dismissals" ON public.ad_dismissals FOR SELECT USING (true);

-- Visitors: anyone can insert
DROP POLICY IF EXISTS "Anyone can insert visitors" ON public.visitors;
CREATE POLICY "Anyone can insert visitors" ON public.visitors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view visitors" ON public.visitors;
CREATE POLICY "Anyone can view visitors" ON public.visitors FOR SELECT USING (true);

-- Messages: users can insert + view their own, admin can view all
DROP POLICY IF EXISTS "Users can insert messages" ON public.user_messages;
CREATE POLICY "Users can insert messages" ON public.user_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view messages" ON public.user_messages;
CREATE POLICY "Anyone can view messages" ON public.user_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update messages" ON public.user_messages;
CREATE POLICY "Anyone can update messages" ON public.user_messages FOR UPDATE USING (true);

-- Site settings: anyone can view, admin can update
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update settings" ON public.site_settings;
CREATE POLICY "Anyone can update settings" ON public.site_settings FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can insert settings" ON public.site_settings;
CREATE POLICY "Anyone can insert settings" ON public.site_settings FOR INSERT WITH CHECK (true);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_ads_active ON public.ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad ON public.ad_views(ad_id);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON public.visitors(visited_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.user_messages(status);

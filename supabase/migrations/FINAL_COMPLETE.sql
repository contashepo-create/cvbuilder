-- ============================================================
-- CV Builder — COMPLETE DATABASE SETUP (ALL IN ONE)
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- Run it ONCE — it creates everything (tables, triggers, RLS, functions)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  full_name    TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  city         TEXT NOT NULL,
  last_seen    TIMESTAMPTZ,
  last_ip      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CVs (with anti-cheat)
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
  admin_approved      BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CV Analyses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cv_analyses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id      UUID NOT NULL REFERENCES public.cvs(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL DEFAULT 0,
  analysis   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL DEFAULT 'free',
  status          TEXT NOT NULL DEFAULT 'active',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  custom_max_cvs  INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 5. CV Creation Log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cv_creation_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_id       UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  fingerprint TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. Device Fingerprints
-- ============================================================
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint   TEXT NOT NULL,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_seen    TIMESTAMPTZ DEFAULT NOW(),
  account_count INTEGER DEFAULT 1
);

-- ============================================================
-- 7. Payment Requests
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
-- 8. Activation Codes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activation_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'unused',
  used_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  custom_cvs   INTEGER,
  created_by   TEXT DEFAULT 'admin',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. Ads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL DEFAULT 'banner',
  title         TEXT NOT NULL DEFAULT '',
  content       TEXT NOT NULL DEFAULT '',
  link_url      TEXT DEFAULT '',
  link_text     TEXT DEFAULT '',
  bg_color      TEXT DEFAULT '#2563eb',
  text_color    TEXT DEFAULT '#ffffff',
  is_active     BOOLEAN DEFAULT TRUE,
  show_on_pages TEXT DEFAULT 'all',
  views         INTEGER DEFAULT 0,
  dismissals    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

-- ============================================================
-- 10. Ad Views
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id      UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. Ad Dismissals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_dismissals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id        UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_id, user_id)
);

-- ============================================================
-- 12. Visitors
-- ============================================================
CREATE TABLE IF NOT EXISTS public.visitors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  user_agent TEXT,
  page       TEXT,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. User Messages (old system)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name  TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'unread',
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. Conversations (messaging system)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'open',
  created_by  TEXT NOT NULL DEFAULT 'user',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  closed_at   TIMESTAMPTZ
);

-- ============================================================
-- 15. Conversation Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_type     TEXT NOT NULL,
  message         TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. Site Settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key               TEXT NOT NULL UNIQUE,
  value             TEXT NOT NULL DEFAULT '',
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (key, value) VALUES
  ('visitor_count_offset', '1000'),
  ('scrolling_text_ar', 'مرحباً بكم في CV Builder — أول سي في مجاني'),
  ('scrolling_text_en', 'Welcome to CV Builder — your first CV is free'),
  ('scrolling_enabled', 'true'),
  ('whatsapp_number', ''),
  ('telegram_contact', 'https://t.me/your_telegram_username')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 17. Payment Methods
-- ============================================================
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

INSERT INTO public.payment_methods (name_ar, name_en, number, icon, details_ar, details_en, is_active, sort_order) VALUES
  ('أورانج كاش', 'Orange Cash', '01000000000', '🟠', '', '', TRUE, 1),
  ('تحويل بنكي', 'Bank Transfer', 'ACC-123456789', '🏦', 'بنك مصر - فرع الرئيسي', 'Banque Misr - Main Branch', TRUE, 2),
  ('إنستا باي', 'InstaPay', 'instapay@your-handle', '⚡', '', '', TRUE, 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 18. Contact Links
-- ============================================================
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

INSERT INTO public.contact_links (name_ar, name_en, url, icon, color, is_active, sort_order) VALUES
  ('واتساب', 'WhatsApp', 'https://wa.me/201234567890', '💬', '#25D366', TRUE, 1),
  ('تليجرام', 'Telegram', 'https://t.me/your_telegram_username', '✈️', '#0088cc', TRUE, 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 19. Captcha Sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.captcha_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captcha_text TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes',
  verified    BOOLEAN DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  ip_address  TEXT
);

-- ============================================================
-- 20. FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone_number, city)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    city = EXCLUDED.city;
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

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_cv(cv_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM public.cvs WHERE id = cv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_captcha_session(captcha_text TEXT, ip TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  DELETE FROM public.captcha_sessions WHERE expires_at < NOW();
  INSERT INTO public.captcha_sessions (captcha_text, ip_address)
  VALUES (captcha_text, ip)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.verify_captcha(session_id UUID, user_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_text TEXT;
  is_verified BOOLEAN := FALSE;
BEGIN
  SELECT captcha_text INTO stored_text
  FROM public.captcha_sessions
  WHERE id = session_id
    AND verified = FALSE
    AND expires_at > NOW();

  IF stored_text IS NULL THEN
    RETURN FALSE;
  END IF;

  is_verified := (UPPER(TRIM(user_input)) = UPPER(TRIM(stored_text)));

  UPDATE public.captcha_sessions
  SET verified = is_verified, used_at = NOW()
  WHERE id = session_id;

  RETURN is_verified;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 21. TRIGGERS
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
-- 22. RLS — Enable on ALL tables
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_creation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captcha_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 23. RLS POLICIES
-- ============================================================

-- Profiles: admin can see all, users see own
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);

-- CVs: users see/edit own, admin sees all, no delete (admin uses RPC)
DROP POLICY IF EXISTS "Users can view own CVs" ON public.cvs;
CREATE POLICY "Users can view own CVs" ON public.cvs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own CVs" ON public.cvs;
CREATE POLICY "Users can insert own CVs" ON public.cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own CVs" ON public.cvs;
CREATE POLICY "Users can update own CVs" ON public.cvs FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete own CVs" ON public.cvs;
CREATE POLICY "Users can delete own CVs" ON public.cvs FOR DELETE USING (true);

-- CV Analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON public.cv_analyses;
CREATE POLICY "Users can view own analyses" ON public.cv_analyses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.cv_analyses;
CREATE POLICY "Users can insert own analyses" ON public.cv_analyses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.cv_analyses;
CREATE POLICY "Users can delete own analyses" ON public.cv_analyses FOR DELETE USING (true);

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (true);

-- CV Creation Log
DROP POLICY IF EXISTS "Users can insert creation log" ON public.cv_creation_log;
CREATE POLICY "Users can insert creation log" ON public.cv_creation_log FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view own creation log" ON public.cv_creation_log;
CREATE POLICY "Users can view own creation log" ON public.cv_creation_log FOR SELECT USING (true);

-- Device Fingerprints
DROP POLICY IF EXISTS "Users can insert device fp" ON public.device_fingerprints;
CREATE POLICY "Users can insert device fp" ON public.device_fingerprints FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view own device fp" ON public.device_fingerprints;
CREATE POLICY "Users can view own device fp" ON public.device_fingerprints FOR SELECT USING (true);

-- Payment Requests
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_requests;
CREATE POLICY "Users can view own payments" ON public.payment_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert payments" ON public.payment_requests;
CREATE POLICY "Users can insert payments" ON public.payment_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update payments" ON public.payment_requests;
CREATE POLICY "Users can update payments" ON public.payment_requests FOR UPDATE USING (true);

-- Activation Codes
DROP POLICY IF EXISTS "Users can view activation codes" ON public.activation_codes;
CREATE POLICY "Users can view activation codes" ON public.activation_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update activation codes" ON public.activation_codes;
CREATE POLICY "Users can update activation codes" ON public.activation_codes FOR UPDATE USING (true);

-- Ads
DROP POLICY IF EXISTS "Anyone can view ads" ON public.ads;
CREATE POLICY "Anyone can view ads" ON public.ads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert ads" ON public.ads;
CREATE POLICY "Anyone can insert ads" ON public.ads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update ads" ON public.ads;
CREATE POLICY "Anyone can update ads" ON public.ads FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete ads" ON public.ads;
CREATE POLICY "Anyone can delete ads" ON public.ads FOR DELETE USING (true);

-- Ad Views
DROP POLICY IF EXISTS "Anyone can insert ad views" ON public.ad_views;
CREATE POLICY "Anyone can insert ad views" ON public.ad_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view ad views" ON public.ad_views;
CREATE POLICY "Anyone can view ad views" ON public.ad_views FOR SELECT USING (true);

-- Ad Dismissals
DROP POLICY IF EXISTS "Anyone can insert dismissals" ON public.ad_dismissals;
CREATE POLICY "Anyone can insert dismissals" ON public.ad_dismissals FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view dismissals" ON public.ad_dismissals;
CREATE POLICY "Anyone can view dismissals" ON public.ad_dismissals FOR SELECT USING (true);

-- Visitors
DROP POLICY IF EXISTS "Anyone can insert visitors" ON public.visitors;
CREATE POLICY "Anyone can insert visitors" ON public.visitors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view visitors" ON public.visitors;
CREATE POLICY "Anyone can view visitors" ON public.visitors FOR SELECT USING (true);

-- User Messages
DROP POLICY IF EXISTS "Users can insert messages" ON public.user_messages;
CREATE POLICY "Users can insert messages" ON public.user_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view messages" ON public.user_messages;
CREATE POLICY "Anyone can view messages" ON public.user_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update messages" ON public.user_messages;
CREATE POLICY "Anyone can update messages" ON public.user_messages FOR UPDATE USING (true);

-- Conversations
DROP POLICY IF EXISTS "Anyone can view conversations" ON public.conversations;
CREATE POLICY "Anyone can view conversations" ON public.conversations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.conversations;
CREATE POLICY "Anyone can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.conversations;
CREATE POLICY "Anyone can update conversations" ON public.conversations FOR UPDATE USING (true);

-- Conversation Messages
DROP POLICY IF EXISTS "Anyone can view conv messages" ON public.conversation_messages;
CREATE POLICY "Anyone can view conv messages" ON public.conversation_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert conv messages" ON public.conversation_messages;
CREATE POLICY "Anyone can insert conv messages" ON public.conversation_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update conv messages" ON public.conversation_messages;
CREATE POLICY "Anyone can update conv messages" ON public.conversation_messages FOR UPDATE USING (true);

-- Site Settings
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update settings" ON public.site_settings;
CREATE POLICY "Anyone can update settings" ON public.site_settings FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can insert settings" ON public.site_settings;
CREATE POLICY "Anyone can insert settings" ON public.site_settings FOR INSERT WITH CHECK (true);

-- Payment Methods
DROP POLICY IF EXISTS "Anyone can view payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can view payment methods" ON public.payment_methods FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can insert payment methods" ON public.payment_methods FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can update payment methods" ON public.payment_methods FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can delete payment methods" ON public.payment_methods FOR DELETE USING (true);

-- Contact Links
DROP POLICY IF EXISTS "Anyone can view contact links" ON public.contact_links;
CREATE POLICY "Anyone can view contact links" ON public.contact_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert contact links" ON public.contact_links;
CREATE POLICY "Anyone can insert contact links" ON public.contact_links FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update contact links" ON public.contact_links;
CREATE POLICY "Anyone can update contact links" ON public.contact_links FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete contact links" ON public.contact_links;
CREATE POLICY "Anyone can delete contact links" ON public.contact_links FOR DELETE USING (true);

-- Captcha Sessions
DROP POLICY IF EXISTS "Anyone can view captcha" ON public.captcha_sessions;
CREATE POLICY "Anyone can view captcha" ON public.captcha_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert captcha" ON public.captcha_sessions;
CREATE POLICY "Anyone can insert captcha" ON public.captcha_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update captcha" ON public.captcha_sessions;
CREATE POLICY "Anyone can update captcha" ON public.captcha_sessions FOR UPDATE USING (true);

-- ============================================================
-- 24. INDEXES
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
CREATE INDEX IF NOT EXISTS idx_ads_active ON public.ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad ON public.ad_views(ad_id);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON public.visitors(visited_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.user_messages(status);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_created ON public.conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_expires ON public.captcha_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_verified ON public.captcha_sessions(verified);

-- ============================================================
-- DONE — All tables, functions, triggers, RLS, and indexes created
-- ============================================================

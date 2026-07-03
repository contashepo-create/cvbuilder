-- ============================================================
-- PATCH 008: Full messaging system (conversations) — FIXED
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Conversations table
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

-- 2. Messages table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_type     TEXT NOT NULL,
  message         TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
DROP POLICY IF EXISTS "Anyone can view conversations" ON public.conversations;
CREATE POLICY "Anyone can view conversations" ON public.conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.conversations;
CREATE POLICY "Anyone can insert conversations" ON public.conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update conversations" ON public.conversations;
CREATE POLICY "Anyone can update conversations" ON public.conversations FOR UPDATE USING (true);

-- Messages policies
DROP POLICY IF EXISTS "Anyone can view messages" ON public.conversation_messages;
CREATE POLICY "Anyone can view messages" ON public.conversation_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert messages" ON public.conversation_messages;
CREATE POLICY "Anyone can insert messages" ON public.conversation_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update messages" ON public.conversation_messages;
CREATE POLICY "Anyone can update messages" ON public.conversation_messages FOR UPDATE USING (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_created ON public.conversation_messages(created_at);

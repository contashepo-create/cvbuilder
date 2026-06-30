import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Detect demo mode (placeholder or missing credentials)
export const DEMO_MODE = !supabaseUrl || !supabaseAnonKey ||
  supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')

export const supabase = createClient(
  DEMO_MODE ? 'https://placeholder.supabase.co' : supabaseUrl,
  DEMO_MODE ? 'placeholder-anon-key' : supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

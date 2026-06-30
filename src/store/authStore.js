import { create } from 'zustand'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { isAdminEmail } from '../lib/adminAuth'

// ---- Demo mode helpers ----
const DEMO_USER_KEY = 'demo_user'
const DEMO_CVS_KEY = 'demo_cvs'

function getDemoUser() {
  const stored = localStorage.getItem(DEMO_USER_KEY)
  return stored ? JSON.parse(stored) : null
}

function setDemoUser(user) {
  if (user) localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(DEMO_USER_KEY)
}

function getDemoCVs() {
  const stored = localStorage.getItem(DEMO_CVS_KEY)
  return stored ? JSON.parse(stored) : []
}

function setDemoCVs(cvs) {
  localStorage.setItem(DEMO_CVS_KEY, JSON.stringify(cvs))
}

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
  isAdmin: false,

  init: async () => {
    if (DEMO_MODE) {
      const demoUser = getDemoUser()
      if (demoUser) {
        const admin = await isAdminEmail(demoUser.email)
        set({ user: demoUser, profile: demoUser.profile, session: 'demo', isAdmin: admin, loading: false })
      } else {
        set({ user: null, profile: null, session: null, isAdmin: false, loading: false })
      }
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // If profile doesn't exist, create it (trigger fallback)
        let finalProfile = profile
        if (!profile) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: fullName,
              phone_number: user.user_metadata?.phone_number || '',
              city: user.user_metadata?.city || '',
            })
            .select()
            .single()
          finalProfile = newProfile
        }

        let admin = false
        try {
          admin = await isAdminEmail(user.email)
        } catch (e) {
          console.error('Admin check failed:', e)
        }
        set({ user, profile: finalProfile, session, isAdmin: admin, loading: false })
      } else {
        set({ user: null, profile: null, session: null, isAdmin: false, loading: false })
      }
    } catch (error) {
      console.error('Auth init error:', error)
      set({ error: error.message, loading: false })
    }
  },

  signUp: async ({ email, password, fullName, phoneNumber, city }) => {
    if (DEMO_MODE) {
      const user = {
        id: crypto.randomUUID(),
        email,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
      const profile = { id: user.id, full_name: fullName, phone_number: phoneNumber, city }
      const fullUser = { ...user, profile }
      setDemoUser(fullUser)
      set({ user, profile, session: 'demo' })
      return { user }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          city,
        },
      },
    })
    if (error) {
      // Supabase returns "User already registered" for duplicate emails
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        throw new Error('EMAIL_EXISTS')
      }
      throw error
    }

    // Manually create profile if trigger didn't work
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          phone_number: phoneNumber,
          city,
        })
      } catch (e) {
        console.error('Profile creation fallback:', e)
      }
    }

    return data
  },

  signIn: async ({ email, password }) => {
    if (DEMO_MODE) {
      const user = {
        id: crypto.randomUUID(),
        email,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
      const profile = { id: user.id, full_name: 'Demo User', phone_number: '+1234567890', city: 'Demo City' }
      const fullUser = { ...user, profile }
      setDemoUser(fullUser)
      // Check if admin email
      const admin = await isAdminEmail(email)
      set({ user, profile, session: 'demo', isAdmin: admin })
      return { user }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      throw new Error('EMAIL_NOT_VERIFIED')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // If profile doesn't exist, create it (trigger fallback)
    if (!profile) {
      const fullName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          phone_number: data.user.user_metadata?.phone_number || '',
          city: data.user.user_metadata?.city || '',
        })
        .select()
        .single()

      // Check admin EVEN when creating new profile
      let admin = false
      try {
        admin = await isAdminEmail(data.user.email)
      } catch (e) {
        console.error('Admin check failed:', e)
      }
      set({ user: data.user, profile: newProfile, session: data.session, isAdmin: admin })
      return data
    }

    // Check if admin email (hash comparison)
    let admin = false
    try {
      admin = await isAdminEmail(data.user.email)
    } catch (e) {
      console.error('Admin check failed:', e)
    }

    set({ user: data.user, profile, session: data.session, isAdmin: admin })
    return data
  },

  resendVerification: async (email) => {
    if (DEMO_MODE) return
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
  },

  signOut: async () => {
    if (DEMO_MODE) {
      setDemoUser(null)
      set({ user: null, profile: null, session: null, isAdmin: false })
      return
    }
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null, isAdmin: false })
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return
    if (DEMO_MODE) {
      const updated = { ...get().profile, ...updates }
      const fullUser = { ...user, profile: updated }
      setDemoUser(fullUser)
      set({ profile: updated })
      return updated
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    set({ profile: data })
    return data
  },
}))

// Listen to auth state changes (only in real mode)
if (!DEMO_MODE) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, profile: null, session: null, isAdmin: false })
    } else if (event === 'SIGNED_IN' && session) {
      const admin = await isAdminEmail(session.user.email)
      useAuthStore.setState({ isAdmin: admin })
    }
  })
}

export { DEMO_MODE, getDemoCVs, setDemoCVs }

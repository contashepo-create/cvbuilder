import { create } from 'zustand'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { PLANS, FREE_PLAN_MAX_CVS } from '../constants/plans'

const DEMO_SUB_KEY = 'demo_subscription'
const DEMO_CODES_KEY = 'demo_activation_codes'

function getDemoSubscription() {
  const stored = localStorage.getItem(DEMO_SUB_KEY)
  return stored ? JSON.parse(stored) : { plan: 'free', status: 'active' }
}

function setDemoSubscription(sub) {
  localStorage.setItem(DEMO_SUB_KEY, JSON.stringify(sub))
}

function getDemoCodes() {
  const stored = localStorage.getItem(DEMO_CODES_KEY)
  return stored ? JSON.parse(stored) : []
}

function setDemoCodes(codes) {
  localStorage.setItem(DEMO_CODES_KEY, JSON.stringify(codes))
}

export const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  loading: false,
  error: null,
  activationError: null,
  activationSuccess: null,

  fetchSubscription: async (userId) => {
    if (DEMO_MODE) {
      set({ subscription: getDemoSubscription(), loading: false })
      return
    }

    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        const { data: newSub } = await supabase
          .from('subscriptions')
          .insert({ user_id: userId, plan: 'free', status: 'active' })
          .select()
          .single()
        set({ subscription: newSub, loading: false })
      } else {
        set({ subscription: data, loading: false })
      }
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  getPlan: () => {
    const { subscription } = get()
    const planId = subscription?.plan || 'free'
    return PLANS[planId] || PLANS.free
  },

  getMaxCVs: () => {
    const { subscription } = get()
    // Custom limit overrides plan
    if (subscription?.custom_max_cvs) return subscription.custom_max_cvs
    const plan = PLANS[subscription?.plan] || PLANS.free
    return plan.maxCVs
  },

  isBlocked: () => {
    const { subscription } = get()
    return subscription?.status === 'blocked'
  },

  isPaid: () => {
    const { subscription } = get()
    return subscription?.plan !== 'free' && subscription?.status === 'active'
  },

  canCreateCV: (currentCVCount) => {
    const { subscription } = get()
    if (subscription?.status === 'blocked') return false
    return currentCVCount < get().getMaxCVs()
  },

  upgradePlan: async (userId, newPlan) => {
    if (DEMO_MODE) {
      const sub = { plan: newPlan, status: 'active', started_at: new Date().toISOString() }
      setDemoSubscription(sub)
      set({ subscription: sub })
      return sub
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ plan: newPlan, status: 'active', started_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    set({ subscription: data })
    return data
  },

  // Activate plan using activation code
  redeemActivationCode: async (userId, code) => {
    set({ activationError: null, activationSuccess: null })

    if (DEMO_MODE) {
      const codes = getDemoCodes()
      const found = codes.find((c) => c.code === code.toUpperCase().trim() && c.status === 'unused')

      if (!found) {
        set({ activationError: 'كود غير صالح أو مستخدم بالفعل' })
        throw new Error('Invalid or used code')
      }
      if (found.expires_at && new Date(found.expires_at) < new Date()) {
        set({ activationError: 'انتهت صلاحية الكود' })
        throw new Error('Code expired')
      }

      // Mark code as used
      found.status = 'used'
      found.used_by = userId
      found.used_at = new Date().toISOString()
      setDemoCodes(codes)

      // Upgrade subscription (with custom CVs if specified)
      const sub = { plan: found.plan, status: 'active', started_at: new Date().toISOString(), custom_max_cvs: found.custom_cvs || null }
      setDemoSubscription(sub)
      set({ subscription: sub, activationSuccess: `تم تفعيل باقة ${PLANS[found.plan]?.name_ar || found.plan}${found.custom_cvs ? ` (${found.custom_cvs} سي في)` : ''} بنجاح!` })
      return sub
    }

    // Find the code
    const { data: codeData, error: findError } = await supabase
      .from('activation_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('status', 'unused')
      .single()

    if (findError || !codeData) {
      set({ activationError: 'كود غير صالح أو مستخدم بالفعل' })
      throw new Error('Invalid code')
    }

    // Check expiry
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      await supabase
        .from('activation_codes')
        .update({ status: 'expired' })
        .eq('id', codeData.id)
      set({ activationError: 'انتهت صلاحية الكود' })
      throw new Error('Code expired')
    }

    // Mark code as used
    const { error: updateCodeError } = await supabase
      .from('activation_codes')
      .update({ status: 'used', used_by: userId, used_at: new Date().toISOString() })
      .eq('id', codeData.id)
    if (updateCodeError) throw updateCodeError

    // Upgrade subscription (with custom CVs if specified in the code)
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .update({
        plan: codeData.plan,
        status: 'active',
        started_at: new Date().toISOString(),
        custom_max_cvs: codeData.custom_cvs || null,
      })
      .eq('user_id', userId)
      .select()
      .single()
    if (subError) throw subError

    set({ subscription: subData, activationSuccess: `تم تفعيل باقة ${PLANS[codeData.plan]?.name_ar || codeData.plan}${codeData.custom_cvs ? ` (${codeData.custom_cvs} سي في)` : ''} بنجاح!` })
    return subData
  },

  // Admin: generate activation codes
  generateActivationCodes: async (plan, count = 1) => {
    if (DEMO_MODE) {
      const codes = getDemoCodes()
      const newCodes = []
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

      for (let i = 0; i < count; i++) {
        let code = ''
        for (let j = 0; j < 12; j++) {
          code += chars[Math.floor(Math.random() * chars.length)]
          if (j === 3 || j === 7) code += '-'
        }
        const newCode = {
          id: crypto.randomUUID(),
          code,
          plan,
          status: 'unused',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        }
        codes.unshift(newCode)
        newCodes.push(newCode)
      }
      setDemoCodes(codes)
      return newCodes
    }

    const newCodes = []
    for (let i = 0; i < count; i++) {
      const { data, error } = await supabase.rpc('generate_activation_code', { plan_name: plan })
      if (error) throw error
      newCodes.push({ code: data, plan, status: 'unused' })
    }
    return newCodes
  },

  // Admin: fetch all activation codes
  fetchActivationCodes: async () => {
    if (DEMO_MODE) {
      return getDemoCodes()
    }
    const { data, error } = await supabase
      .from('activation_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Admin: directly activate a user's plan (separate from codes)
  adminActivatePlan: async (userId, plan) => {
    if (DEMO_MODE) {
      const sub = { plan, status: 'active', started_at: new Date().toISOString(), user_id: userId }
      setDemoSubscription(sub)
      return sub
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ plan, status: 'active', started_at: new Date().toISOString(), custom_max_cvs: null })
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Admin: block/ban a user
  blockUser: async (userId) => {
    if (DEMO_MODE) {
      return { success: true }
    }
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'blocked' })
      .eq('user_id', userId)
    if (error) throw error
    return { success: true }
  },

  // Admin: unblock a user
  unblockUser: async (userId) => {
    if (DEMO_MODE) {
      return { success: true }
    }
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('user_id', userId)
    if (error) throw error
    return { success: true }
  },

  // Admin: set custom CV limit for a user (overrides plan)
  setCustomCVLimit: async (userId, maxCVs) => {
    if (DEMO_MODE) {
      return { success: true }
    }
    const { error } = await supabase
      .from('subscriptions')
      .update({ custom_max_cvs: maxCVs })
      .eq('user_id', userId)
    if (error) throw error
    return { success: true }
  },

  // Admin: generate activation code with custom CV limit
  generateActivationCodes: async (plan, count = 1, customCVs = null) => {
    if (DEMO_MODE) {
      const codes = getDemoCodes()
      const newCodes = []
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

      for (let i = 0; i < count; i++) {
        let code = ''
        for (let j = 0; j < 12; j++) {
          code += chars[Math.floor(Math.random() * chars.length)]
          if (j === 3 || j === 7) code += '-'
        }
        const newCode = {
          id: crypto.randomUUID(),
          code,
          plan,
          status: 'unused',
          custom_cvs: customCVs,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        }
        codes.unshift(newCode)
        newCodes.push(newCode)
      }
      setDemoCodes(codes)
      return newCodes
    }

    const newCodes = []
    for (let i = 0; i < count; i++) {
      const { data, error } = await supabase.rpc('generate_activation_code', { plan_name: plan })
      if (error) throw error

      // If custom CVs, update the code
      if (customCVs) {
        await supabase
          .from('activation_codes')
          .update({ custom_cvs: customCVs })
          .eq('code', data)
      }

      newCodes.push({ code: data, plan, status: 'unused', custom_cvs: customCVs })
    }
    return newCodes
  },
}))

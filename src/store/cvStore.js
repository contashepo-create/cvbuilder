import { create } from 'zustand'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { createEmptyCVContent } from '../lib/cvDefaults'
import { DEFAULT_TEMPLATE } from '../constants/templates'
import { getDemoCVs, setDemoCVs } from './authStore'
import { generateFingerprint, compareFingerprints } from '../lib/fingerprint'

// Lazy import to avoid circular dependency
let _subscriptionStore = null
const getSubscriptionStore = () => {
  if (!_subscriptionStore) {
    const mod = require('./subscriptionStore')
    _subscriptionStore = mod.useSubscriptionStore
  }
  return _subscriptionStore
}

export const useCVStore = create((set, get) => ({
  cvs: [],
  currentCV: null,
  loading: false,
  error: null,
  saveStatus: 'idle', // idle | saving | saved | error
  cheatWarning: null,  // null | { message, severity }

  fetchCVs: async (userId) => {
    if (DEMO_MODE) {
      const allCVs = getDemoCVs()
      const userCVs = allCVs.filter((cv) => cv.user_id === userId)
      set({ cvs: userCVs, loading: false })
      return
    }

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      if (error) throw error
      set({ cvs: data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createCV: async (userId, title = 'My CV', profile = null) => {
    const content = createEmptyCVContent()
    const fingerprint = generateFingerprint(content)

    const newCV = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      template_id: DEFAULT_TEMPLATE,
      content,
      content_fingerprint: fingerprint,
      is_flagged: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (DEMO_MODE) {
      const allCVs = getDemoCVs()
      allCVs.unshift(newCV)
      setDemoCVs(allCVs)
      set((state) => ({ cvs: [newCV, ...state.cvs] }))
      return newCV
    }

    // Server-side: count existing CVs + creation log
    const { count: existingCVs } = await supabase
      .from('cvs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const { count: totalCreated } = await supabase
      .from('cv_creation_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Check against subscription limit
    const subStore = getSubscriptionStore()
    const maxCVs = subStore ? subStore.getState().getMaxCVs() : 1

    if ((existingCVs || 0) >= maxCVs) {
      throw new Error('LIMIT_REACHED')
    }

    const { data, error } = await supabase
      .from('cvs')
      .insert({
        user_id: userId,
        title,
        template_id: DEFAULT_TEMPLATE,
        content,
        content_fingerprint: fingerprint,
        is_flagged: false,
      })
      .select()
      .single()
    if (error) throw error

    // Log creation in audit table (prevents delete+recreate bypass)
    try {
      await supabase.from('cv_creation_log').insert({
        user_id: userId,
        cv_id: data.id,
        fingerprint,
      })
    } catch (e) {
      console.error('Failed to log CV creation:', e)
    }

    set((state) => ({ cvs: [data, ...state.cvs] }))
    return data
  },

  // DELETE removed — users can edit but NOT delete
  deleteCV: async () => {
    throw new Error('DELETE_DISABLED — Users can edit CVs but not delete them')
  },

  loadCV: async (cvId) => {
    if (DEMO_MODE) {
      const allCVs = getDemoCVs()
      const cv = allCVs.find((c) => c.id === cvId)
      set({ currentCV: cv || null, loading: false })
      return cv
    }

    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('cvs')
        .select('*')
        .eq('id', cvId)
        .single()
      if (error) throw error
      set({ currentCV: data, loading: false })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  updateContent: (content) => {
    set((state) => ({
      currentCV: { ...state.currentCV, content },
      saveStatus: 'saving',
    }))
  },

  updateTemplate: (templateId) => {
    set((state) => ({
      currentCV: { ...state.currentCV, template_id: templateId },
    }))
  },

  saveCV: async (profile = null) => {
    const { currentCV } = get()
    if (!currentCV) return
    set({ saveStatus: 'saving', cheatWarning: null })

    // --- Anti-cheat v2: ONLY detect person swapping ---
    // No more comparing CV with account owner (caused false positives)
    const currentFingerprint = generateFingerprint(currentCV.content)
    const originalFingerprint = currentCV.content_fingerprint || ''
    const comparison = compareFingerprints(originalFingerprint, currentFingerprint)

    // If admin approved, don't re-flag
    const adminApproved = currentCV.admin_approved || false

    // Only flag if: person was swapped (A → B) AND not admin-approved
    let isFlagged = currentCV.is_flagged || false
    let flagReason = currentCV.flag_reason || ''
    let cheatWarning = null

    if (comparison.isDifferent && !adminApproved && comparison.confidence >= 1.0) {
      isFlagged = true
      flagReason = 'CV_PERSON_SWAPPED: Name changed after creation — possible CV swapping'
      cheatWarning = {
        message: 'تم تغيير الاسم بشكل كبير بعد إنشاء السي في',
        severity: 'high',
      }
    } else if (!comparison.isDifferent) {
      // No violation — clear any existing flag (unless admin set it)
      if (isFlagged && flagReason?.includes('CV_PERSON_SWAPPED')) {
        isFlagged = false
        flagReason = ''
      }
    }

    if (DEMO_MODE) {
      const allCVs = getDemoCVs()
      const idx = allCVs.findIndex((c) => c.id === currentCV.id)
      const updated = {
        ...currentCV,
        content_fingerprint: currentFingerprint,
        is_flagged: isFlagged,
        flag_reason: flagReason,
        updated_at: new Date().toISOString(),
      }
      if (idx >= 0) allCVs[idx] = updated
      else allCVs.unshift(updated)
      setDemoCVs(allCVs)
      set({ saveStatus: 'saved', currentCV: updated, cheatWarning })
      setTimeout(() => set({ saveStatus: 'idle' }), 2000)
      return
    }

    try {
      const { error } = await supabase
        .from('cvs')
        .update({
          content: currentCV.content,
          template_id: currentCV.template_id,
          title: currentCV.title,
          content_fingerprint: currentFingerprint,
          is_flagged: isFlagged,
          flag_reason: flagReason,
        })
        .eq('id', currentCV.id)
      if (error) throw error
      set({
        saveStatus: 'saved',
        currentCV: { ...currentCV, content_fingerprint: currentFingerprint, is_flagged: isFlagged, flag_reason: flagReason },
        cheatWarning,
      })
      setTimeout(() => set({ saveStatus: 'idle' }), 2000)
    } catch (error) {
      set({ saveStatus: 'error', error: error.message })
    }
  },

  clearCurrent: () => set({ currentCV: null, cheatWarning: null }),
}))

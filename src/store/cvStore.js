import { create } from 'zustand'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { createEmptyCVContent } from '../lib/cvDefaults'
import { DEFAULT_TEMPLATE } from '../constants/templates'
import { getDemoCVs, setDemoCVs } from './authStore'
import { generateFingerprint, compareFingerprints, isDifferentPerson } from '../lib/fingerprint'

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

    // --- Anti-cheat detection ---
    const currentFingerprint = generateFingerprint(currentCV.content)
    const originalFingerprint = currentCV.content_fingerprint || ''
    const comparison = compareFingerprints(originalFingerprint, currentFingerprint)

    let isFlagged = currentCV.is_flagged || false
    let flagReason = currentCV.flag_reason || ''
    let cheatWarning = null

    if (comparison.isDifferent) {
      isFlagged = true
      flagReason = comparison.confidence >= 1.0
        ? 'CV_PERSON_CHANGED: Personal info significantly different from creation'
        : 'CV_PERSON_CLEARED: Personal info was cleared after creation'
      cheatWarning = {
        message: flagReason.includes('CLEARED')
          ? 'تم مسح المعلومات الشخصية بعد إنشاء السي في'
          : 'تم تغيير المعلومات الشخصية بشكل كبير — قد يتم وضع علامة على هذا السي في',
        severity: 'high',
      }
    }

    // Check against profile owner
    if (profile) {
      const differentPerson = isDifferentPerson(currentCV.content, profile)
      if (differentPerson) {
        isFlagged = true
        flagReason = 'CV_OWNER_MISMATCH: CV appears to belong to a different person than the account owner'
        cheatWarning = {
          message: 'السي في يبدو أنه لشخص مختلف عن صاحب الحساب',
          severity: 'high',
        }
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

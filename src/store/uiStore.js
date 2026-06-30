import { create } from 'zustand'
import i18n from '../i18n/index.js'
import { changeLanguage } from '../i18n/index.js'

export const useUIStore = create((set, get) => ({
  language: 'ar',
  sidebarOpen: false,

  setLanguage: (lang) => {
    changeLanguage(lang)
    set({ language: lang })
  },

  toggleLanguage: () => {
    const current = get().language
    const next = current === 'ar' ? 'en' : 'ar'
    changeLanguage(next)
    set({ language: next })
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}))

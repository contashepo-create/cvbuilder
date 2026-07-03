import { create } from 'zustand'
import { DEFAULT_SECTION_ORDER, SECTION_TYPES } from '../constants/sections'

// Default section labels (can be overridden by user)
export const DEFAULT_LABELS = {
  personalInfo: { ar: 'المعلومات الشخصية', en: 'Personal Information' },
  summary: { ar: 'الملخص المهني', en: 'Professional Summary' },
  experience: { ar: 'الخبرات العملية', en: 'Work Experience' },
  education: { ar: 'التعليم', en: 'Education' },
  skills: { ar: 'المهارات', en: 'Skills' },
  languages: { ar: 'اللغات', en: 'Languages' },
  certifications: { ar: 'الشهادات', en: 'Certifications' },
  projects: { ar: 'المشاريع', en: 'Projects' },
}

// Types of custom sections a user can create
export const CUSTOM_SECTION_TYPES = [
  { id: 'text', label_ar: 'نص حر', label_en: 'Free text', icon: 'FileText' },
  { id: 'list', label_ar: 'قائمة', label_en: 'List', icon: 'List' },
  { id: 'experience', label_ar: 'خبرات', label_en: 'Experience-like', icon: 'Briefcase' },
]

export const useSectionStore = create((set, get) => ({
  // Custom sections stored in CV content.customSections
  // Format: { id, title, type, items: [], visible: true, isCustom: true }

  /**
   * Add a custom section to the CV content
   */
  addCustomSection: (content, title, type = 'text') => {
    const id = 'custom_' + crypto.randomUUID().slice(0, 8)
    const newSection = {
      id,
      title,
      type,
      items: type === 'list' ? [] : type === 'experience' ? [] : '',
      visible: true,
      isCustom: true,
    }

    return {
      ...content,
      customSections: [...(content.customSections || []), newSection],
      sectionOrder: [...(content.sectionOrder || DEFAULT_SECTION_ORDER), id],
    }
  },

  /**
   * Remove a section (built-in or custom) from the CV
   * For built-in sections: marks as hidden (visible: false)
   * For custom sections: deletes completely
   */
  removeSection: (content, sectionId) => {
    // Remove from order
    const newOrder = (content.sectionOrder || []).filter(id => id !== sectionId)

    // For custom sections, delete from customSections
    const newCustom = (content.customSections || []).filter(s => s.id !== sectionId)

    // For built-in sections, mark as hidden
    const hiddenSections = { ...(content.hiddenSections || {}) }
    if (SECTION_TYPES[sectionId] || sectionId.startsWith('custom_')) {
      hiddenSections[sectionId] = true
    }

    return {
      ...content,
      sectionOrder: newOrder,
      customSections: newCustom,
      hiddenSections,
    }
  },

  /**
   * Restore a hidden section
   */
  restoreSection: (content, sectionId) => {
    const hiddenSections = { ...(content.hiddenSections || {}) }
    delete hiddenSections[sectionId]

    // Add back to order if not present
    const order = content.sectionOrder || []
    if (!order.includes(sectionId)) {
      // Insert before sectionOrder step
      order.push(sectionId)
    }

    return {
      ...content,
      sectionOrder: [...order],
      hiddenSections,
    }
  },

  /**
   * Rename a section (built-in or custom)
   * For built-in: stores custom label
   * For custom: updates the title
   */
  renameSection: (content, sectionId, newTitle) => {
    // Custom section — update title directly
    if (sectionId.startsWith('custom_')) {
      return {
        ...content,
        customSections: (content.customSections || []).map(s =>
          s.id === sectionId ? { ...s, title: newTitle } : s
        ),
      }
    }

    // Built-in section — store custom label
    return {
      ...content,
      customLabels: {
        ...(content.customLabels || {}),
        [sectionId]: { ar: newTitle, en: newTitle },
      },
    }
  },

  /**
   * Reorder sections
   */
  reorderSections: (content, newOrder) => {
    return {
      ...content,
      sectionOrder: newOrder,
    }
  },

  /**
   * Get the display label for a section
   */
  getSectionLabel: (sectionId, content, lang = 'ar') => {
    // Custom section
    if (sectionId.startsWith('custom_')) {
      const custom = (content?.customSections || []).find(s => s.id === sectionId)
      return custom?.title || 'Untitled'
    }

    // Built-in with custom label
    if (content?.customLabels?.[sectionId]) {
      return content.customLabels[sectionId][lang] || content.customLabels[sectionId].ar
    }

    // Default label
    return DEFAULT_LABELS[sectionId]?.[lang] || sectionId
  },

  /**
   * Check if a section is visible (not hidden)
   */
  isSectionVisible: (content, sectionId) => {
    return !content?.hiddenSections?.[sectionId]
  },
}))

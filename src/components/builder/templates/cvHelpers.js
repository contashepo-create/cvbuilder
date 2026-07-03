import { useTranslation } from 'react-i18next'
import { sanitizeURL } from '../../../lib/validators'

// Section labels by language (independent of UI language)
const SECTION_LABELS = {
  ar: {
    personal_info: 'المعلومات الشخصية',
    summary: 'الملخص المهني',
    experience: 'الخبرات العملية',
    education: 'التعليم',
    skills: 'المهارات',
    languages: 'اللغات',
    certifications: 'الشهادات',
    projects: 'المشاريع',
    section_order: 'ترتيب الأقسام',
    contact: 'التواصل',
  },
  en: {
    personal_info: 'Personal Information',
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    certifications: 'Certifications',
    projects: 'Projects',
    section_order: 'Section Order',
    contact: 'Contact',
  },
}

export function useCVHelpers(content) {
  const { i18n } = useTranslation()

  // CV language takes priority over UI language
  const cvLang = content?.cvLanguage || (i18n.language === 'ar' ? 'ar' : 'en')
  const isRTL = cvLang === 'ar'

  // Section labels based on CV language, not UI language
  const labels = SECTION_LABELS[cvLang] || SECTION_LABELS.en

  const t = (key) => {
    // Handle builder.sections.X format
    const parts = key.split('.')
    if (parts[0] === 'builder' && parts[1] === 'sections') {
      return labels[parts[2]] || key
    }
    if (parts[0] === 'builder' && parts[1] === 'fields' && parts[2] === 'contact') {
      return labels.contact || 'Contact'
    }
    // Fallback to i18n
    return i18n.t(key)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + '-01')
    return d.toLocaleDateString(cvLang === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'short' })
  }

  const safeURL = (url) => sanitizeURL(url)

  return { t, i18n, isRTL, formatDate, safeURL, cvLang }
}

export function hasContent(sectionId, content) {
  switch (sectionId) {
    case 'personalInfo': return true
    case 'summary': return content.summary?.trim()?.length > 0
    case 'experience': return content.experience?.length > 0
    case 'education': return content.education?.length > 0
    case 'skills': return content.skills?.length > 0
    case 'languages': return content.languages?.length > 0
    case 'certifications': return content.certifications?.length > 0
    case 'projects': return content.projects?.length > 0
    default: return false
  }
}

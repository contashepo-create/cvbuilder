import { useTranslation } from 'react-i18next'
import { sanitizeURL } from '../../../lib/validators'

// All labels by CV language (independent of UI language)
const CV_LABELS = {
  ar: {
    // Sections
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
    // Levels
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم',
    expert: 'خبير',
    fluent: 'بطلاقة',
    native: 'اللغة الأم',
    // Fields
    current: 'الوظيفة الحالية',
    add_item: 'إضافة عنصر',
  },
  en: {
    // Sections
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
    // Levels
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert',
    fluent: 'Fluent',
    native: 'Native',
    // Fields
    current: 'Current Job',
    add_item: 'Add Item',
  },
}

export function useCVHelpers(content) {
  const { i18n } = useTranslation()
  const cvLang = content?.cvLanguage || (i18n.language === 'ar' ? 'ar' : 'en')
  const isRTL = cvLang === 'ar'
  const labels = CV_LABELS[cvLang] || CV_LABELS.en

  const t = (key) => {
    // Handle builder.sections.X
    const parts = key.split('.')
    if (parts[0] === 'builder' && parts[1] === 'sections') {
      return labels[parts[2]] || key
    }
    if (parts[0] === 'builder' && parts[1] === 'fields') {
      return labels[parts[2]] || key
    }
    if (parts[0] === 'builder' && parts[1] === 'levels') {
      return labels[parts[2]] || key
    }
    // Fallback to i18n
    return i18n.t(key)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + '-01')
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString(cvLang === 'ar' ? 'ar' : 'en', { year: 'numeric', month: 'short' })
  }

  const safeURL = (url) => sanitizeURL(url)

  return { t, i18n, isRTL, formatDate, safeURL, cvLang, labels }
}

// Static function for non-component use
export function getCVLabels(lang = 'en') {
  return CV_LABELS[lang] || CV_LABELS.en
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

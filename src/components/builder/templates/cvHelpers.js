import { useTranslation } from 'react-i18next'
import { sanitizeURL } from '../../../lib/validators'

export function useCVHelpers() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + '-01')
    return d.toLocaleDateString(isRTL ? 'ar' : 'en', { year: 'numeric', month: 'short' })
  }

  const safeURL = (url) => sanitizeURL(url)

  return { t, i18n, isRTL, formatDate, safeURL }
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

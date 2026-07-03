import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Lightbulb, Plus, X, Sparkles, Loader2 } from 'lucide-react'
import { matchProfession, getSuggestions } from '../../../constants/summarySuggestions'
import { useAIStore } from '../../../store/aiStore'
import { aiSuggestSummary, aiImproveSummary } from '../../../lib/aiService'

export default function SummaryStep({ data, onChange, personalInfo, cvLanguage = "ar" }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const jobTitle = personalInfo?.jobTitle || ''
  const { isConfigured, features } = useAIStore()

  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [aiError, setAiError] = useState('')

  const profession = useMemo(() => matchProfession(jobTitle), [jobTitle])
  const dbSuggestions = useMemo(() => getSuggestions(jobTitle, lang), [jobTitle, lang])

  const wordCount = data ? data.trim().split(/\s+/).filter(Boolean).length : 0

  const appendSuggestion = (text) => {
    const current = data?.trim() || ''
    const separator = current ? (lang === 'ar' ? ' ' : ' ') : ''
    onChange(current + separator + text)
  }

  const replaceWithSuggestion = (text) => {
    onChange(text)
  }

  const handleAISuggest = async () => {
    setAiError('')
    setAiLoading(true)
    try {
      const suggestions = await aiSuggestSummary(jobTitle || 'professional', lang)
      setAiSuggestions(suggestions)
    } catch (err) {
      setAiError(err.message === 'AI_NOT_CONFIGURED'
        ? (lang === 'ar' ? 'يرجى إعداد الذكاء الاصطناعي أولاً من الإعدادات' : 'Please configure AI first in settings')
        : err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleAIImprove = async () => {
    if (!data?.trim()) return
    setAiError('')
    setAiLoading(true)
    try {
      const improved = await aiImproveSummary(data, jobTitle, lang)
      onChange(improved.trim())
    } catch (err) {
      setAiError(err.message === 'AI_NOT_CONFIGURED'
        ? (lang === 'ar' ? 'يرجى إعداد الذكاء الاصطناعي أولاً' : 'Please configure AI first')
        : err.message)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary textarea */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">{t('builder.sections.summary')}</label>
          {isConfigured() && features.improveContent && data?.trim() && (
            <button
              onClick={handleAIImprove}
              disabled={aiLoading}
              className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {lang === 'ar' ? 'تحسين بالذكاء الاصطناعي' : 'Improve with AI'}
            </button>
          )}
        </div>
        <textarea
          value={data || ''}
          onChange={(e) => onChange(e.target.value)}
          className="input min-h-[140px] resize-y"
          maxLength={1000}
          placeholder={t('builder.fields.summary_placeholder')}
        />
        <div className="flex justify-between mt-1.5 text-xs text-gray-500">
          <span>{wordCount} {lang === 'ar' ? 'كلمة' : 'words'}</span>
          <span>{lang === 'ar' ? '50-200 كلمة مثالي' : '50-200 words ideal'}</span>
        </div>
      </div>

      {/* AI Suggestions */}
      {isConfigured() && features.suggestSummary && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-purple-700 flex items-center gap-1.5">
              <Sparkles size={16} />
              {lang === 'ar' ? 'اقتراحات الذكاء الاصطناعي' : 'AI Suggestions'}
            </h4>
            <button
              onClick={handleAISuggest}
              disabled={aiLoading}
              className="text-xs btn bg-purple-600 text-white hover:bg-purple-700 px-3 py-1"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : t('builder.fields.add_item')}
            </button>
          </div>
          {aiError && <p className="text-xs text-red-500 mb-2">{aiError}</p>}
          {aiSuggestions.length > 0 && (
            <div className="space-y-1.5">
              {aiSuggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-md bg-white border border-purple-100 hover:border-purple-300 cursor-pointer group"
                  onClick={() => appendSuggestion(suggestion.replace(/^\d+\.\s*/, ''))}
                >
                  <Plus size={14} className="text-purple-400 mt-0.5 flex-shrink-0 group-hover:text-purple-600" />
                  <span className="text-xs text-gray-700">{suggestion.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Database Suggestions */}
      {dbSuggestions.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-medium text-amber-700 flex items-center gap-1.5 mb-1">
            <Lightbulb size={16} />
            {lang === 'ar' ? `اقتراحات لمهنة "${jobTitle}"` : `Suggestions for "${jobTitle}"`}
          </h4>
          <p className="text-xs text-amber-600 mb-3">
            {lang === 'ar'
              ? 'انقر على أي اقتراح لإضافته، أو انقر مع الاستمرار للاستبدال'
              : 'Click any suggestion to add, or click to replace'}
          </p>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {dbSuggestions.map((suggestion, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-md bg-white border border-amber-100 hover:border-amber-300 cursor-pointer group"
                onClick={() => appendSuggestion(suggestion)}
                onContextMenu={(e) => { e.preventDefault(); replaceWithSuggestion(suggestion) }}
              >
                <Plus size={14} className="text-amber-400 mt-0.5 flex-shrink-0 group-hover:text-amber-600" />
                <span className="text-xs text-gray-700">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!profession && jobTitle?.trim() && (
        <p className="text-xs text-gray-400 text-center">
          {lang === 'ar'
            ? 'لا توجد اقتراحات محددة لهذه المهنة، جرّب استخدام الذكاء الاصطناعي'
            : 'No specific suggestions for this title, try AI suggestions'}
        </p>
      )}
    </div>
  )
}

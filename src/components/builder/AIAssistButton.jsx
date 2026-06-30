import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Loader2, X, Check, RefreshCw } from 'lucide-react'
import { useAIStore } from '../../store/aiStore'

/**
 * Reusable AI Assist button that shows a dropdown with AI suggestions
 * @param {Function} onGenerate - async function that returns string or string[]
 * @param {Function} onApply - function that receives the selected suggestion
 * @param {string} label - button label
 * @param {boolean} featureEnabled - whether this feature is enabled in AI settings
 */
export default function AIAssistButton({ onGenerate, onApply, label, featureEnabled = true }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const { isConfigured, enabled } = useAIStore()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState('')
  const [selectedText, setSelectedText] = useState('')

  if (!enabled || !isConfigured() || !featureEnabled) return null

  const handleClick = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setError('')
    setSuggestions([])
    setSelectedText('')
    setLoading(true)
    try {
      const result = await onGenerate()
      const arr = Array.isArray(result) ? result : [result]
      setSuggestions(arr)
      if (arr.length > 0) setSelectedText(arr[0])
    } catch (err) {
      setError(err.message === 'AI_NOT_CONFIGURED'
        ? (isAr ? 'يرجى إعداد الذكاء الاصطناعي' : 'Please configure AI')
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (selectedText) {
      onApply(selectedText)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {label || (isAr ? 'مساعدة بالذكاء الاصطناعي' : 'AI Assist')}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1 end-0 w-80 max-w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-purple-50 border-b border-purple-100">
              <span className="text-xs font-medium text-purple-700 flex items-center gap-1">
                <Sparkles size={14} />
                {isAr ? 'اقتراحات الذكاء الاصطناعي' : 'AI Suggestions'}
              </span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-y-auto p-2">
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-purple-500" />
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 p-2">{error}</p>
              )}

              {!loading && !error && suggestions.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  {isAr ? 'لا توجد اقتراحات' : 'No suggestions'}
                </p>
              )}

              {!loading && suggestions.length > 0 && (
                <div className="space-y-1.5">
                  {suggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedText(suggestion)}
                      className={`p-2.5 rounded-md text-xs cursor-pointer border transition-all ${
                        selectedText === suggestion
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {suggestion.replace(/^\d+\.\s*/, '')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && suggestions.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                <button
                  onClick={handleClick}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  {isAr ? 'إعادة' : 'Regenerate'}
                </button>
                <button
                  onClick={handleApply}
                  className="text-xs btn bg-purple-600 text-white hover:bg-purple-700 px-3 py-1"
                >
                  <Check size={12} />
                  {isAr ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

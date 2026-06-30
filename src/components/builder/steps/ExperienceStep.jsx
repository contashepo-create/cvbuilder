import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Briefcase, Sparkles } from 'lucide-react'
import { createEmptyExperience } from '../../../lib/cvDefaults'
import { useAIStore } from '../../../store/aiStore'
import { aiImproveExperienceDescription } from '../../../lib/aiService'
import Spinner from '../../ui/Spinner'

export default function ExperienceStep({ data, onChange }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const { isConfigured, enabled, features } = useAIStore()
  const [aiLoading, setAiLoading] = useState({})

  const addItem = () => {
    onChange([...data, createEmptyExperience()])
  }

  const updateItem = (id, field, value) => {
    onChange(data.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id) => {
    onChange(data.filter((item) => item.id !== id))
  }

  const handleAIImprove = async (item) => {
    if (!item.description?.trim()) return
    setAiLoading((prev) => ({ ...prev, [item.id]: true }))
    try {
      const improved = await aiImproveExperienceDescription(
        item.description, item.position, item.company, i18n.language
      )
      updateItem(item.id, 'description', improved)
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {data.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          {isAr ? 'لا توجد خبرات مضافة بعد.' : 'No experience added yet.'}
        </p>
      )}
      {data.map((item, index) => (
        <div key={item.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Briefcase size={16} />
              {t('builder.sections.experience')} #{index + 1}
            </div>
            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('builder.fields.position')}</label>
              <input type="text" value={item.position}
                onChange={(e) => updateItem(item.id, 'position', e.target.value)} className="input" maxLength={100} />
            </div>
            <div>
              <label className="label">{t('builder.fields.company')}</label>
              <input type="text" value={item.company}
                onChange={(e) => updateItem(item.id, 'company', e.target.value)} className="input" maxLength={100} />
            </div>
            <div>
              <label className="label">{t('builder.fields.start_date')}</label>
              <input type="month" value={item.startDate}
                onChange={(e) => updateItem(item.id, 'startDate', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{t('builder.fields.end_date')}</label>
              <input type="month" value={item.endDate}
                onChange={(e) => updateItem(item.id, 'endDate', e.target.value)} className="input"
                disabled={item.current} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={item.current}
              onChange={(e) => updateItem(item.id, 'current', e.target.checked)} className="rounded" />
            {t('builder.fields.current')}
          </label>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">{t('builder.fields.description')}</label>
              {enabled && isConfigured() && features.suggestExperience && item.description?.trim() && (
                <button
                  onClick={() => handleAIImprove(item)}
                  disabled={aiLoading[item.id]}
                  className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700"
                >
                  {aiLoading[item.id] ? <Spinner size={14} /> : <Sparkles size={14} />}
                  {isAr ? 'تحسين بالذكاء الاصطناعي' : 'Improve with AI'}
                </button>
              )}
            </div>
            <textarea
              value={item.description}
              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              className="input min-h-[80px] resize-y"
              maxLength={1000}
              placeholder="• Achieved X by doing Y..."
            />
          </div>
        </div>
      ))}

      <button onClick={addItem} className="btn-outline w-full">
        <Plus size={18} /> {t('builder.fields.add_item')}
      </button>
    </div>
  )
}

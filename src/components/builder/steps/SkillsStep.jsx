import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react'
import { createEmptySkill } from '../../../lib/cvDefaults'
import { SKILL_LEVELS } from '../../../constants/sections'
import { useAIStore } from '../../../store/aiStore'
import { aiSuggestSkills } from '../../../lib/aiService'
import { getCVLabels } from '../templates/cvHelpers'

export default function SkillsStep({ data, onChange, personalInfo, cvLanguage = 'ar' }) {
  const { t } = useTranslation()
  const labels = getCVLabels(cvLanguage)
  const isAr = cvLanguage === 'ar'
  const jobTitle = personalInfo?.jobTitle || ''
  const { isConfigured, enabled, features } = useAIStore()
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const addItem = (skill) => {
    const newSkill = typeof skill === 'string'
      ? { id: crypto.randomUUID(), name: skill, level: 'intermediate' }
      : createEmptySkill()
    onChange([...data, newSkill])
  }

  const updateItem = (id, field, value) => {
    onChange(data.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id) => onChange(data.filter((item) => item.id !== id))

  const handleAISuggest = async () => {
    setAiError('')
    setAiLoading(true)
    try {
      const skills = await aiSuggestSkills(jobTitle || 'professional', cvLanguage)
      const newSkills = skills.map((s) => ({
        id: crypto.randomUUID(),
        name: s,
        level: 'intermediate',
      }))
      const existingNames = data.map((d) => d.name.toLowerCase())
      const uniqueNew = newSkills.filter((s) => !existingNames.includes(s.name.toLowerCase()))
      onChange([...data, ...uniqueNew])
    } catch (err) {
      setAiError(err.message === 'AI_NOT_CONFIGURED'
        ? (isAr ? 'يرجى إعداد الذكاء الاصطناعي' : 'Please configure AI')
        : err.message)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {enabled && isConfigured() && features.suggestSkills && (
        <button
          onClick={handleAISuggest}
          disabled={aiLoading}
          className="btn w-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-sm"
        >
          {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isAr ? 'اقتراح مهارات بالذكاء الاصطناعي' : 'Suggest Skills with AI'}
        </button>
      )}
      {aiError && <p className="text-xs text-red-500">{aiError}</p>}

      {data.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          {isAr ? 'لا توجد مهارات مضافة بعد.' : 'No skills added yet.'}
        </p>
      )}
      {data.map((item, index) => (
        <div key={item.id} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">
              {isAr ? 'المهارة' : 'Skill'} #{index + 1}
            </label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
              className="input"
              maxLength={50}
            />
          </div>
          <div className="w-40">
            <label className="label">{isAr ? 'المستوى' : 'Level'}</label>
            <select
              value={item.level}
              onChange={(e) => updateItem(item.id, 'level', e.target.value)}
              className="input"
            >
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {labels[level] || level}
                </option>
              ))}
            </select>
          </div>
          <button onClick={() => removeItem(item.id)} className="btn-danger mb-0.5">
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      <button onClick={() => addItem()} className="btn-outline w-full">
        <Plus size={18} /> {labels.add_item}
      </button>
    </div>
  )
}

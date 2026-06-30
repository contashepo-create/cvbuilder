import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { createEmptyLanguage } from '../../../lib/cvDefaults'
import { LANGUAGE_LEVELS } from '../../../constants/sections'

export default function LanguagesStep({ data, onChange }) {
  const { t } = useTranslation()

  const addItem = () => onChange([...data, createEmptyLanguage()])

  const updateItem = (id, field, value) => {
    onChange(data.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id) => onChange(data.filter((item) => item.id !== id))

  return (
    <div className="space-y-3">
      {data.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No languages added yet.</p>
      )}
      {data.map((item, index) => (
        <div key={item.id} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label">
              {t('builder.fields.language_name')} #{index + 1}
            </label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
              className="input"
              maxLength={50}
              placeholder="English, Arabic, ..."
            />
          </div>
          <div className="w-40">
            <label className="label">{t('builder.fields.level')}</label>
            <select
              value={item.level}
              onChange={(e) => updateItem(item.id, 'level', e.target.value)}
              className="input"
            >
              {LANGUAGE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {t(`builder.levels.${level}`)}
                </option>
              ))}
            </select>
          </div>
          <button onClick={() => removeItem(item.id)} className="btn-danger mb-0.5">
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      <button onClick={addItem} className="btn-outline w-full">
        <Plus size={18} /> {t('builder.fields.add_item')}
      </button>
    </div>
  )
}

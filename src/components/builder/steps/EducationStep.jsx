import { useTranslation } from 'react-i18next'
import { Plus, Trash2, GraduationCap } from 'lucide-react'
import { createEmptyEducation } from '../../../lib/cvDefaults'

export default function EducationStep({ data, onChange }) {
  const { t } = useTranslation()

  const addItem = () => onChange([...data, createEmptyEducation()])

  const updateItem = (id, field, value) => {
    onChange(data.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id) => onChange(data.filter((item) => item.id !== id))

  return (
    <div className="space-y-4">
      {data.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No education added yet.</p>
      )}
      {data.map((item, index) => (
        <div key={item.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <GraduationCap size={16} />
              {t('builder.sections.education')} #{index + 1}
            </div>
            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('builder.fields.institution')}</label>
              <input
                type="text"
                value={item.institution}
                onChange={(e) => updateItem(item.id, 'institution', e.target.value)}
                className="input"
                maxLength={150}
              />
            </div>
            <div>
              <label className="label">{t('builder.fields.degree')}</label>
              <input
                type="text"
                value={item.degree}
                onChange={(e) => updateItem(item.id, 'degree', e.target.value)}
                className="input"
                maxLength={100}
              />
            </div>
            <div>
              <label className="label">{t('builder.fields.field')}</label>
              <input
                type="text"
                value={item.field}
                onChange={(e) => updateItem(item.id, 'field', e.target.value)}
                className="input"
                maxLength={100}
              />
            </div>
            <div>
              <label className="label">{t('builder.fields.start_date')}</label>
              <input
                type="month"
                value={item.startDate}
                onChange={(e) => updateItem(item.id, 'startDate', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('builder.fields.end_date')}</label>
              <input
                type="month"
                value={item.endDate}
                onChange={(e) => updateItem(item.id, 'endDate', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">{t('builder.fields.description')}</label>
            <textarea
              value={item.description}
              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              className="input min-h-[60px] resize-y"
              maxLength={500}
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

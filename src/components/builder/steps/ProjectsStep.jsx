import { useTranslation } from 'react-i18next'
import { Plus, Trash2, FolderGit2 } from 'lucide-react'
import { createEmptyProject } from '../../../lib/cvDefaults'

export default function ProjectsStep({ data, onChange }) {
  const { t } = useTranslation()

  const addItem = () => onChange([...data, createEmptyProject()])

  const updateItem = (id, field, value) => {
    onChange(data.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const removeItem = (id) => onChange(data.filter((item) => item.id !== id))

  return (
    <div className="space-y-4">
      {data.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No projects added yet.</p>
      )}
      {data.map((item, index) => (
        <div key={item.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <FolderGit2 size={16} />
              {t('builder.sections.projects')} #{index + 1}
            </div>
            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('builder.fields.project_name')}</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                className="input"
                maxLength={100}
              />
            </div>
            <div>
              <label className="label">{t('builder.fields.project_url')}</label>
              <input
                type="url"
                value={item.url}
                onChange={(e) => updateItem(item.id, 'url', e.target.value)}
                className="input"
                maxLength={200}
                dir="ltr"
                placeholder="github.com/..."
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

          <div>
            <label className="label">{t('builder.fields.technologies')}</label>
            <input
              type="text"
              value={(item.technologies || []).join(', ')}
              onChange={(e) =>
                updateItem(
                  item.id,
                  'technologies',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="input"
              maxLength={300}
              placeholder="React, Node.js, ..."
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

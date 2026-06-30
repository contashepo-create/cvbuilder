import { useTranslation } from 'react-i18next'
import { TEMPLATES } from '../../constants/templates'
import { Check } from 'lucide-react'

export default function TemplatePicker({ selectedId, onSelect }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onSelect(tpl.id)}
          className={`relative p-3 rounded-lg border-2 transition-all text-center ${
            selectedId === tpl.id
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div
            className="w-full h-20 rounded-md mb-2 flex items-center justify-center"
            style={{ backgroundColor: tpl.accentColor + '15' }}
          >
            <div className="w-12 h-16 rounded-sm shadow-sm flex flex-col overflow-hidden" style={{ backgroundColor: '#fff' }}>
              <div className="h-3" style={{ backgroundColor: tpl.accentColor }} />
              <div className="flex-1 p-1 space-y-0.5">
                <div className="h-1 w-full rounded-full bg-gray-200" />
                <div className="h-1 w-3/4 rounded-full bg-gray-200" />
                <div className="h-1 w-full rounded-full bg-gray-100" />
                <div className="h-1 w-2/3 rounded-full bg-gray-100" />
              </div>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-700">{isAr ? tpl.name_ar : tpl.name_en}</p>
          {selectedId === tpl.id && (
            <div className="absolute top-1.5 end-1.5 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

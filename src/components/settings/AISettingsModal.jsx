import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAIStore } from '../../store/aiStore'
import { AI_PROVIDERS } from '../../constants/aiProviders'
import { aiTestConnection } from '../../lib/aiService'
import { X, Check, Loader2, ExternalLink, KeyRound, Zap, Sparkles } from 'lucide-react'

export default function AISettingsModal({ onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const isAr = lang === 'ar'
  const store = useAIStore()
  const { providerId, apiKey, model, baseUrl, customModel, enabled, features } = store

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showKey, setShowKey] = useState(false)

  const provider = AI_PROVIDERS.find((p) => p.id === providerId)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const ok = await aiTestConnection()
      setTestResult(ok ? 'success' : 'fail')
    } catch (err) {
      setTestResult('fail')
    } finally {
      setTesting(false)
    }
  }

  const featureLabels = [
    { key: 'suggestSummary', label: isAr ? 'اقتراح الملخص' : 'Suggest Summary' },
    { key: 'suggestExperience', label: isAr ? 'تحسين الخبرات' : 'Improve Experience' },
    { key: 'suggestSkills', label: isAr ? 'اقتراح المهارات' : 'Suggest Skills' },
    { key: 'improveContent', label: isAr ? 'تحسين المحتوى' : 'Improve Content' },
    { key: 'translateCV', label: isAr ? 'ترجمة السي في' : 'Translate CV' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" />
            {isAr ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div>
              <p className="font-medium text-sm">{isAr ? 'تفعيل الذكاء الاصطناعي' : 'Enable AI'}</p>
              <p className="text-xs text-gray-500">
                {isAr ? 'عند التفعيل، ستظهر أزرار المساعدة بالذكاء الاصطناعي في المحرر' : 'When enabled, AI assist buttons appear in the editor'}
              </p>
            </div>
            <button
              onClick={() => store.setEnabled(!enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="label">{isAr ? 'اختر مزود الذكاء الاصطناعي' : 'Select AI Provider'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => store.setProvider(p.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-sm transition-all ${
                    providerId === p.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="label flex items-center gap-1.5">
              <KeyRound size={14} />
              {isAr ? 'مفتاح API' : 'API Key'}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => store.setApiKey(e.target.value)}
                className="input pe-20"
                placeholder={provider.keyPlaceholder}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showKey ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
              </button>
            </div>
            {provider.docsUrl && (
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:underline mt-1 inline-flex items-center gap-1"
              >
                <ExternalLink size={12} />
                {isAr ? 'كيفية الحصول على المفتاح' : 'How to get API key'}
              </a>
            )}
          </div>

          {/* Base URL (editable for custom) */}
          <div>
            <label className="label">{isAr ? 'رابط API' : 'API Base URL'}</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => store.setBaseUrl(e.target.value)}
              className="input"
              placeholder={provider.defaultBaseUrl}
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="label">{isAr ? 'النموذج' : 'Model'}</label>
            {provider.models.length > 0 ? (
              <select
                value={model}
                onChange={(e) => store.setModel(e.target.value)}
                className="input"
              >
                {provider.models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
                <option value="__custom__">{isAr ? 'مخصص...' : 'Custom...'}</option>
              </select>
            ) : null}
            {(model === '__custom__' || provider.id === 'custom' || !provider.models.includes(model)) && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => store.setCustomModel(e.target.value)}
                className="input mt-2"
                placeholder={isAr ? 'اسم النموذج المخصص' : 'Custom model name'}
              />
            )}
          </div>

          {/* Feature Toggles */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Zap size={14} />
              {isAr ? 'ميزات الذكاء الاصطناعي' : 'AI Features'}
            </label>
            <p className="text-xs text-gray-500 mb-3">
              {isAr ? 'اختر الميزات التي تريد استخدام الذكاء الاصطناعي فيها' : 'Choose which features use AI'}
            </p>
            <div className="space-y-2">
              {featureLabels.map((feature) => (
                <label key={feature.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features[feature.key] ?? true}
                    onChange={() => store.toggleFeature(feature.key)}
                    className="rounded"
                  />
                  <span className="text-sm">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={!apiKey || testing}
              className="btn-outline text-sm"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {isAr ? 'اختبار الاتصال' : 'Test Connection'}
            </button>
            {testResult === 'success' && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <Check size={16} /> {isAr ? 'تم بنجاح!' : 'Success!'}
              </span>
            )}
            {testResult === 'fail' && (
              <span className="text-sm text-red-500">
                {isAr ? 'فشل الاتصال - تحقق من المفتاح والإعدادات' : 'Connection failed - check key and settings'}
              </span>
            )}
          </div>

          {/* Note */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700">
              {isAr
                ? '🔒 يتم تخزين مفتاح API محلياً في متصفحك فقط ولا يتم إرساله لأي خادم. كل طلبات الذكاء الاصطناعي تذهب مباشرة من متصفحك إلى المزود.'
                : '🔒 Your API key is stored locally in your browser only and never sent to any server. All AI requests go directly from your browser to the provider.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="btn-primary text-sm">
            <Check size={16} /> {isAr ? 'حفظ وإغلاق' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

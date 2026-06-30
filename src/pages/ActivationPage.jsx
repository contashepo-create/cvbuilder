import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useSubscriptionStore } from '../store/subscriptionStore'
import { ArrowLeft, Ticket, Check, AlertCircle, Loader2 } from 'lucide-react'
import { PLANS } from '../constants/plans'

export default function ActivationPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { redeemActivationCode, activationError, activationSuccess } = useSubscriptionStore()
  const isAr = i18n.language === 'ar'

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    try {
      await redeemActivationCode(user.id, code)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch {
      // Error is set in store
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <button onClick={() => navigate('/dashboard')} className="btn-outline text-sm mb-6">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <div className="card text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-4">
          <Ticket size={32} />
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {isAr ? 'تفعيل الباقة' : 'Activate Plan'}
        </h1>
        <p className="text-gray-500 mb-6 text-sm">
          {isAr
            ? 'أدخل كود التفعيل الذي استلمته بعد تأكيد الدفع'
            : 'Enter the activation code you received after payment confirmation'}
        </p>

        {activationSuccess && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2 justify-center">
            <Check size={18} /> {activationSuccess}
          </div>
        )}

        {activationError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2 justify-center">
            <AlertCircle size={18} /> {activationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="input text-center text-lg font-mono tracking-wider"
            maxLength={14}
            placeholder="XXXX-XXXX-XXXX"
            dir="ltr"
            disabled={!!activationSuccess}
            required
          />

          <button
            type="submit"
            disabled={loading || !!activationSuccess}
            className="btn-primary w-full"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : isAr ? 'تفعيل' : 'Activate'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            {isAr
              ? 'إذا لم تستلم الكود، تواصل معنا على التليجرام بعد إتمام الدفع'
              : 'If you did not receive a code, contact us on Telegram after completing payment'}
          </p>
        </div>
      </div>
    </div>
  )
}

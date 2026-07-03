import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Mail, AlertCircle, Check, ArrowLeft } from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import { isValidEmail } from '../lib/validators'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { resetPassword } = useAuthStore()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError(t('auth.errors.email_required'))
      return
    }
    if (!isValidEmail(email)) {
      setError(t('auth.errors.email_invalid'))
      return
    }

    setLoading(true)
    try {
      await resetPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <Link to="/login" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-4">
            <ArrowLeft size={16} /> {t('auth.back_to_login')}
          </Link>

          <h1 className="text-2xl font-bold text-center mb-1">
            {t('auth.forgot_title') || 'استعادة كلمة المرور'}
          </h1>
          <p className="text-center text-gray-500 mb-6">
            {t('auth.forgot_subtitle') || 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة'}
          </p>

          {success ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <Check size={32} />
              </div>
              <h3 className="font-bold mb-2">
                {t('auth.forgot_sent_title') || 'تم إرسال الرابط'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t('auth.forgot_sent_desc') || 'تحقق من بريدك الإلكتروني — ستصلك رسالة برابط لاستعادة كلمة المرور.'}
              </p>
              <Link to="/login" className="btn-primary">
                {t('auth.back_to_login')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="label">{t('auth.email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input ps-10"
                    maxLength={100}
                    dir="ltr"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner size={20} /> : (t('auth.send_reset') || 'إرسال رابط الاستعادة')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

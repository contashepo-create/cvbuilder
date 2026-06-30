import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { MailCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export default function EmailVerifyPage() {
  const { t } = useTranslation()
  const { resendVerification } = useAuthStore()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resendVerification(email)
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
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-4">
            <MailCheck size={32} />
          </div>

          <h1 className="text-2xl font-bold mb-2">{t('auth.verify_email_title')}</h1>
          <p className="text-gray-500 mb-6">{t('auth.verify_email_desc')}</p>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2 justify-center">
              <CheckCircle2 size={18} />
              <span>Confirmation link sent!</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2 justify-center">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleResend} className="space-y-4 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder={t('auth.email')}
              required
            />
            <button type="submit" disabled={loading} className="btn-outline w-full">
              {loading ? <Spinner size={20} /> : t('auth.resend_email')}
            </button>
          </form>

          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline">
            <ArrowLeft size={16} />
            {t('auth.back_to_login')}
          </Link>
        </div>
      </div>
    </div>
  )
}

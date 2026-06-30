import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Mail, Lock, AlertCircle, CheckCircle2, FlaskConical } from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import { DEMO_MODE } from '../lib/supabase'
import { isValidEmail } from '../lib/validators'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signIn } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showVerifyMsg, setShowVerifyMsg] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const errors = {}
    if (!email) errors.email = t('auth.errors.email_required')
    else if (!isValidEmail(email)) errors.email = t('auth.errors.email_invalid')
    if (!password) errors.password = t('auth.errors.password_required')
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setShowVerifyMsg(false)
    setLoading(true)
    try {
      await signIn({ email, password })
      navigate('/dashboard')
    } catch (err) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setShowVerifyMsg(true)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold text-center mb-1">{t('auth.login_title')}</h1>
          <p className="text-center text-gray-500 mb-6">{t('auth.login_subtitle')}</p>

          {showVerifyMsg && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{t('auth.email_not_verified')}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="you@example.com"
                  required
                />
              </div>
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input ps-10"
                  maxLength={72}
                  placeholder="••••••••"
                  required
                />
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size={20} /> : t('auth.login_btn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              {t('auth.register_link')}
            </Link>
          </p>

          {showVerifyMsg && (
            <p className="text-center mt-4">
              <Link to="/verify-email" className="text-sm text-primary-600 hover:underline">
                {t('auth.verify_email_title')}
              </Link>
            </p>
          )}

          {DEMO_MODE && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => { signIn({ email: 'demo@cvbuilder.app', password: 'demo' }); navigate('/dashboard') }}
                className="btn w-full bg-amber-500 text-white hover:bg-amber-600"
              >
                <FlaskConical size={18} />
                دخول تجريبي سريع
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                البيانات تُحفظ محلياً في المتصفح فقط
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

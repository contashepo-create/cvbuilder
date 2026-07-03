import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { Lock, AlertCircle, Check, Eye, EyeOff } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { updatePassword } = useAuthStore()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError(t('auth.errors.password_required'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.errors.password_short'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.errors.passwords_dont_match'))
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <Check size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {t('auth.reset_success') || 'تم تغيير كلمة المرور بنجاح'}
          </h3>
          <p className="text-sm text-gray-500">
            {t('auth.redirecting') || 'جاري تحويلك للوحة التحكم...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold text-center mb-1">
            {t('auth.reset_title') || 'كلمة مرور جديدة'}
          </h1>
          <p className="text-center text-gray-500 mb-6">
            {t('auth.reset_subtitle') || 'أدخل كلمة المرور الجديدة'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input ps-10 pe-10"
                  maxLength={72}
                  dir="ltr"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">{t('auth.confirm_password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input ps-10"
                  maxLength={72}
                  dir="ltr"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size={20} /> : (t('auth.reset_btn') || 'تحديث كلمة المرور')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

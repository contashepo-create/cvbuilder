import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Mail, Lock, User, Phone, MapPin, AlertCircle, AlertTriangle } from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import { isValidEmail, isValidPhone } from '../lib/validators'
import { checkDeviceFingerprintLocal, registerDeviceFingerprintLocal } from '../lib/deviceFingerprint'
import { DEMO_MODE } from '../lib/supabase'

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const navigate = useNavigate()
  const { signUp } = useAuthStore()

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    city: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) e.email = t('auth.errors.email_required')
    else if (!isValidEmail(form.email)) e.email = t('auth.errors.email_invalid')
    if (!form.password) e.password = t('auth.errors.password_required')
    else if (form.password.length < 6) e.password = t('auth.errors.password_short')
    if (form.password !== form.confirmPassword) e.confirmPassword = t('auth.errors.passwords_dont_match')
    if (!form.fullName) e.fullName = t('auth.errors.name_required')
    else if (form.fullName.length > 100) e.fullName = t('auth.errors.name_too_long') || 'Name too long'
    if (!form.phoneNumber) e.phoneNumber = t('auth.errors.phone_required')
    else if (!isValidPhone(form.phoneNumber)) e.phoneNumber = t('auth.errors.phone_invalid') || 'Invalid phone number'
    if (!form.city) e.city = t('auth.errors.city_required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    setLoading(true)

    // Device fingerprint check (anti multi-account abuse)
    if (DEMO_MODE) {
      const deviceCheck = checkDeviceFingerprintLocal()
      if (deviceCheck.isDuplicate) {
        setApiError(
          isAr
            ? 'تم اكتشاف أن هذا الجهاز لديه حساب بالفعل. لا يمكن إنشاء أكثر من حساب مجاني من نفس الجهاز.'
            : 'This device already has an account. Cannot create multiple free accounts from the same device.'
        )
        setLoading(false)
        return
      }
    }

    try {
      await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        city: form.city,
      })

      // Register device fingerprint
      if (DEMO_MODE) {
        registerDeviceFingerprintLocal()
      }

      navigate('/verify-email')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold text-center mb-1">{t('auth.register_title')}</h1>
          <p className="text-center text-gray-500 mb-6">{t('auth.register_subtitle')}</p>

          {apiError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.full_name')}</label>
              <div className="relative">
                <User size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="input ps-10"
                  maxLength={100}
                  required
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input ps-10"
                  maxLength={100}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">{t('auth.phone_number')}</label>
              <div className="relative">
                <Phone size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className="input ps-10"
                  maxLength={20}
                  placeholder="+1234567890"
                  required
                />
              </div>
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label className="label">{t('auth.city')}</label>
              <div className="relative">
                <MapPin size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="input ps-10"
                  maxLength={50}
                  required
                />
              </div>
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="input ps-10"
                  maxLength={72}
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label">{t('auth.confirm_password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="input ps-10"
                  maxLength={72}
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size={20} /> : t('auth.register_btn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              {t('auth.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

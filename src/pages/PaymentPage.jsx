import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { usePaymentStore } from '../store/paymentStore'
import { useAdStore } from '../store/adStore'
import { PLANS } from '../constants/plans'
import { ArrowLeft, Upload, Check, ExternalLink, Send, AlertCircle } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export default function PaymentPage() {
  const { planId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { submitPaymentRequest } = usePaymentStore()
  const { paymentMethods, fetchPaymentMethods, contactLinks, fetchContactLinks } = useAdStore()
  const isAr = i18n.language === 'ar'

  useEffect(() => {
    fetchPaymentMethods()
    fetchContactLinks()
  }, [])

  const activePaymentMethods = paymentMethods.filter(m => m.is_active)
  const activeContactLinks = contactLinks.filter(l => l.is_active)
  const telegramLink = activeContactLinks.find(l => l.name_en?.toLowerCase().includes('telegram'))?.url || '#'

  const plan = PLANS[planId]
  const [step, setStep] = useState(1) // 1=info, 2=form, 3=success
  const [form, setForm] = useState({
    paymentMethod: 'orange_cash',
    transactionRef: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    screenshot: null,
    screenshotPreview: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!plan || planId === 'free') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">{isAr ? 'باقة غير صالحة' : 'Invalid plan'}</p>
        <button onClick={() => navigate('/pricing')} className="btn-primary mt-4">
          {isAr ? 'العودة للأسعار' : 'Back to pricing'}
        </button>
      </div>
    )
  }

  const handleScreenshot = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError(isAr ? 'حجم الصورة كبير جداً (حد أقصى 5 ميجا)' : 'Image too large (max 5MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, screenshot: reader.result, screenshotPreview: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.transactionRef.trim()) {
      setError(isAr ? 'رقم العملية مطلوب' : 'Transaction reference is required')
      return
    }

    setLoading(true)
    try {
      await submitPaymentRequest(
        user.id,
        profile?.full_name || user.email,
        user.email,
        {
          plan: planId,
          paymentMethod: form.paymentMethod,
          transactionRef: form.transactionRef,
          paymentDate: form.paymentDate,
          screenshot: form.screenshot,
        }
      )
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate('/pricing')} className="btn-outline text-sm mb-6">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {/* Plan Summary */}
      <div className="card mb-6 bg-primary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {isAr ? plan.name_ar : plan.name_en}
            </h2>
            <p className="text-sm text-gray-600">
              {plan.maxCVs} {isAr ? 'سي فيات' : 'CVs'}
            </p>
          </div>
          <div className="text-2xl font-bold text-primary-600">
            {plan.price} {plan.currency}
          </div>
        </div>
      </div>

      {/* Step 1: Payment Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-4">{isAr ? 'طرق الدفع' : 'Payment Methods'}</h3>
            <div className="space-y-4">
              {activePaymentMethods.map((method) => (
                <div key={method.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-medium">{isAr ? method.name_ar : method.name_en}</p>
                      <p className="text-lg font-bold text-primary-600 font-mono" dir="ltr">{method.number}</p>
                    </div>
                  </div>
                  {method.details_ar && (
                    <p className="text-xs text-gray-500 mt-1">
                      {isAr ? method.details_ar : method.details_en}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {isAr ? 'تعليمات الدفع' : 'Payment Instructions'}
                </p>
                <ol className="text-xs text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>{isAr ? 'حوّل المبلغ عبر إحدى طرق الدفع أعلاه' : 'Transfer the amount via one of the payment methods above'}</li>
                  <li>{isAr ? 'احفظ رقم العملية وتاريخها' : 'Save the transaction reference and date'}</li>
                  <li>{isAr ? 'التقط صورة من إثبات التحويل' : 'Take a screenshot of the transfer proof'}</li>
                  <li>{isAr ? 'اضغط التالي واملأ بيانات التحويل' : 'Click Next and fill in the transfer details'}</li>
                  <li>{isAr ? 'سيتم مراجعة طلبك وتفعيل الباقة خلال 24 ساعة' : 'Your request will be reviewed and plan activated within 24 hours'}</li>
                </ol>
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink size={14} />
                  {isAr ? 'تواصل عبر التليجرام' : 'Contact via Telegram'}
                </a>
              </div>
            </div>
          </div>

          <button onClick={() => setStep(2)} className="btn-primary w-full">
            {isAr ? 'التالي — تعبئة بيانات التحويل' : 'Next — Fill Transfer Details'}
          </button>
        </div>
      )}

      {/* Step 2: Payment Form */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h3 className="font-semibold">{isAr ? 'بيانات التحويل' : 'Transfer Details'}</h3>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="label">{isAr ? 'طريقة الدفع' : 'Payment Method'}</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="input"
            >
              {activePaymentMethods.map((m) => (
                <option key={m.id} value={m.id}>{isAr ? m.name_ar : m.name_en}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{isAr ? 'رقم العملية / المرجع' : 'Transaction Reference'}</label>
            <input
              type="text"
              value={form.transactionRef}
              onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
              className="input"
              maxLength={50}
              dir="ltr"
              placeholder={isAr ? 'أدخل رقم العملية' : 'Enter transaction reference'}
              required
            />
          </div>

          <div>
            <label className="label">{isAr ? 'تاريخ التحويل' : 'Transfer Date'}</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">{isAr ? 'صورة إثبات التحويل' : 'Transfer Proof Screenshot'}</label>
            <div className="flex items-center gap-3">
              <label className="btn-outline cursor-pointer">
                <Upload size={18} />
                {isAr ? 'اختر صورة' : 'Choose image'}
                <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
              </label>
              {form.screenshotPreview && (
                <img
                  src={form.screenshotPreview}
                  alt="preview"
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isAr ? 'اختياري لكن يسرّع التفعيل' : 'Optional but speeds up activation'}
            </p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
              {t('common.back')}
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Spinner size={20} /> : <><Send size={18} /> {isAr ? 'إرسال الطلب' : 'Submit Request'}</>}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="card text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <Check size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {isAr ? 'تم إرسال طلبك بنجاح!' : 'Request Submitted Successfully!'}
          </h3>
          <p className="text-gray-500 mb-4">
            {isAr
              ? 'سيتم مراجعة طلبك خلال 24 ساعة. سيتم تفعيل باقتك بعد تأكيد الدفع.'
              : 'Your request will be reviewed within 24 hours. Your plan will be activated after payment confirmation.'}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
            <p className="font-medium">{isAr ? 'للاستفسار عن طلبك:' : 'To inquire about your request:'}</p>
            <a href={TELEGRAM_CONTACT} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 justify-center mt-1">
              <ExternalLink size={14} /> {isAr ? 'راسلنا على التليجرام' : 'Message us on Telegram'}
            </a>
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              {isAr ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

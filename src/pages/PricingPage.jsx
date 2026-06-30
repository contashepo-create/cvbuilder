import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSubscriptionStore } from '../store/subscriptionStore'
import { PLANS } from '../constants/plans'
import { Check, Crown, ArrowLeft, Zap, Ticket } from 'lucide-react'

const PLAN_ICONS = {
  free: Zap,
  starter: Crown,
  pro: Crown,
}

export default function PricingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { subscription, getPlan } = useSubscriptionStore()
  const isAr = i18n.language === 'ar'
  const currentPlan = subscription?.plan || 'free'

  const handleSelect = (planId) => {
    if (planId === 'free') return
    if (!user) {
      navigate('/register')
      return
    }
    navigate(`/payment/${planId}`)
  }

  const handleActivate = () => {
    if (!user) {
      navigate('/register')
      return
    }
    navigate('/activate')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <button onClick={() => navigate('/dashboard')} className="btn-outline text-sm mb-6">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-bold mb-3">{t('pricing.title')}</h1>
        <p className="text-gray-500 text-base md:text-lg">{t('pricing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {Object.values(PLANS).map((plan) => {
          const Icon = PLAN_ICONS[plan.id] || Zap
          const isCurrent = currentPlan === plan.id
          const isPopular = plan.id === 'starter'
          const features = isAr ? plan.features_ar : plan.features_en

          return (
            <div
              key={plan.id}
              className={`card relative flex flex-col ${
                isPopular ? 'border-primary-400 border-2 shadow-lg' : ''
              } ${isCurrent ? 'ring-2 ring-green-400' : ''}`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge bg-primary-600 text-white px-3 py-1 text-xs">
                  {isAr ? 'الأكثر شيوعاً' : 'Most Popular'}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 end-2 badge bg-green-500 text-white px-2 py-1 text-xs flex items-center gap-1">
                  <Check size={12} /> {isAr ? 'باقتك' : 'Current'}
                </span>
              )}

              <div className="text-center mb-4 md:mb-6">
                <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl mb-3 ${
                  plan.id === 'free' ? 'bg-gray-100 text-gray-600' :
                  plan.id === 'starter' ? 'bg-amber-100 text-amber-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-lg md:text-xl font-bold">{isAr ? plan.name_ar : plan.name_en}</h3>
                <div className="mt-2">
                  <span className="text-3xl md:text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 text-sm"> {plan.currency} </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {plan.maxCVs} {isAr ? 'سي فيات' : 'CVs'}
                </p>
              </div>

              <ul className="space-y-2 mb-4 md:mb-6 flex-1">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={isCurrent}
                className={`btn w-full ${
                  isCurrent ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                  plan.id === 'free' ? 'btn-secondary' :
                  'btn-primary'
                }`}
              >
                {isCurrent
                  ? (isAr ? 'الباقة الحالية' : 'Current Plan')
                  : plan.id === 'free'
                  ? (isAr ? 'مجاني' : 'Free')
                  : (isAr ? 'اشترك الآن' : 'Subscribe Now')}
              </button>
            </div>
          )
        })}
      </div>

      {/* Activation code section */}
      <div className="mt-8 md:mt-12 card text-center bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-3">
          <Ticket size={24} />
        </div>
        <h3 className="text-lg font-bold mb-1">
          {isAr ? 'لديك كود تفعيل؟' : 'Have an activation code?'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {isAr ? 'إذا استلمت كود تفعيل بعد الدفع، أدخله هنا' : 'If you received an activation code after payment, enter it here'}
        </p>
        <button onClick={handleActivate} className="btn-primary">
          <Ticket size={18} /> {isAr ? 'تفعيل الكود' : 'Activate Code'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6 md:mt-8">
        {isAr ? 'الدفع عن طريق أورانج كاش أو تحويل بنكي أو إنستا باي. لا نخزن بيانات الدفع.' : 'Payment via Orange Cash, Bank Transfer, or InstaPay. We do not store payment data.'}
      </p>
    </div>
  )
}

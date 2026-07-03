import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCVStore } from '../store/cvStore'
import { useSubscriptionStore } from '../store/subscriptionStore'
import { PLANS, FREE_PLAN_MAX_CVS } from '../constants/plans'
import { Plus, FileText, Pencil, ScanSearch, Calendar, Lock, Crown, AlertTriangle, CheckCircle2, Shield } from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import { ADMIN_SECRET_PATH } from '../constants/plans'

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const navigate = useNavigate()
  const { user, profile, isAdmin } = useAuthStore()
  const { cvs, loading, fetchCVs, createCV } = useCVStore()
  const { subscription, fetchSubscription, getPlan, canCreateCV, isBlocked } = useSubscriptionStore()
  const [creating, setCreating] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCVs(user.id)
      fetchSubscription(user.id)
    }
  }, [user, fetchCVs, fetchSubscription])

  const handleCreate = async (lang = 'ar') => {
    if (!canCreateCV(cvs.length)) return
    setCreating(true)
    setShowLangPicker(false)
    try {
      const cv = await createCV(user.id, 'My CV', profile, lang)
      navigate(`/builder/${cv.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const plan = getPlan()
  const limitReached = !canCreateCV(cvs.length)
  const isPaid = subscription?.plan !== 'free'
  const hasFlaggedCV = cvs.some((cv) => cv.is_flagged)

  // Don't block on loading if we already have user data
  if (loading && cvs.length === 0 && !subscription) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Spinner size={32} />
        <p className="text-sm text-gray-400">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Blocked user message */}
      {isBlocked() && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-3">
          <Lock size={20} className="flex-shrink-0" />
          <div>
            <p className="font-medium">{isAr ? 'تم حظر حسابك' : 'Your account has been blocked'}</p>
            <p className="text-xs mt-1 text-red-600">{isAr ? 'يرجى التواصل مع الإدارة' : 'Please contact administration'}</p>
          </div>
        </div>
      )}

      {/* Subscription Banner */}
      <div className={`card mb-6 ${isPaid ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' : 'bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isPaid ? (
              <Crown size={24} className="text-amber-600" />
            ) : (
              <FileText size={24} className="text-primary-600" />
            )}
            <div>
              <h3 className="font-semibold">
                {isPaid
                  ? `${plan.name_ar} — ${plan.name_en}`
                  : t('dashboard.free_plan')}
              </h3>
              <p className="text-sm text-gray-600">
                {isPaid
                  ? `${cvs.length} ${t('dashboard.cvs_created')} — ${t('dashboard.unlimited')}`
                  : `${cvs.length} / ${FREE_PLAN_MAX_CVS} ${t('dashboard.cvs_used')}`}
              </p>
            </div>
          </div>
          {!isPaid && (
            <button onClick={() => navigate('/pricing')} className="btn-primary text-sm">
              <Crown size={18} /> {t('dashboard.upgrade')}
            </button>
          )}
          {isPaid && (
            <button onClick={() => navigate('/pricing')} className="btn-outline text-sm">
              <Crown size={18} /> {isAr ? 'عرض الخطط' : 'View Plans'}
            </button>
          )}
        </div>
        {/* Usage progress bar for free plan */}
        {!isPaid && (
          <div className="mt-3">
            <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all"
                style={{ width: `${Math.min((cvs.length / FREE_PLAN_MAX_CVS) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Anti-cheat warning */}
      {hasFlaggedCV && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-3">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{t('dashboard.flagged_title')}</p>
            <p className="text-xs mt-1">{t('dashboard.flagged_desc')}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-gray-500">
            {t('dashboard.welcome')}, {profile?.full_name || user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => navigate(`/${ADMIN_SECRET_PATH}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <Shield size={18} />
              لوحة التحكم
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              disabled={creating || limitReached}
              className="btn-primary"
              title={limitReached ? t('dashboard.limit_reached') : ''}
            >
              {creating ? <Spinner size={20} /> : <><Plus size={20} /> {t('dashboard.create_cv')}</>}
            </button>
            {showLangPicker && (
              <div className="absolute end-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 w-48">
                <button
                  onClick={() => handleCreate('ar')}
                  className="w-full text-start px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-lg">🇸🇦</span> سي في بالعربية
                </button>
                <button
                  onClick={() => handleCreate('en')}
                  className="w-full text-start px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-lg">🇬🇧</span> CV in English
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Limit reached message */}
      {limitReached && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-3">
          <Lock size={20} className="flex-shrink-0" />
          <div className="flex-1">
            <p>{t('dashboard.limit_reached')} ({FREE_PLAN_MAX_CVS})</p>
            <p className="text-xs mt-1 text-amber-700">{t('dashboard.upgrade_hint')}</p>
          </div>
          <button onClick={() => navigate('/pricing')} className="btn-primary text-sm">
            <Crown size={16} /> {t('dashboard.upgrade')}
          </button>
        </div>
      )}

      {/* CVs Grid */}
      {cvs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.no_cvs')}</h3>
          <p className="text-gray-500 mb-6">{t('dashboard.no_cvs_desc')}</p>
          <button onClick={() => setShowLangPicker(true)} disabled={creating || limitReached} className="btn-primary">
            <Plus size={20} /> {t('dashboard.create_cv')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map((cv) => (
            <div key={cv.id} className={`card hover:shadow-md transition-shadow flex flex-col ${cv.is_flagged ? 'border-red-300 bg-red-50/30' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600">
                  <FileText size={20} />
                </div>
                <div className="flex items-center gap-1.5">
                  {cv.is_flagged && (
                    <span className="badge bg-red-100 text-red-700 flex items-center gap-1" title={cv.flag_reason}>
                      <AlertTriangle size={12} /> {t('dashboard.flagged')}
                    </span>
                  )}
                  <span className="badge bg-primary-50 text-primary-700 capitalize">{cv.template_id}</span>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-1">{cv.title || t('dashboard.untitled')}</h3>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
                <Calendar size={14} />
                <span>{t('dashboard.updated')}: {formatDate(cv.updated_at)}</span>
              </div>

              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => navigate(`/builder/${cv.id}`)}
                  className="btn-primary flex-1 text-sm"
                >
                  <Pencil size={16} /> {t('dashboard.edit')}
                </button>
                <button
                  onClick={() => navigate(`/analysis/${cv.id}`)}
                  className="btn-secondary text-sm"
                  title={t('dashboard.analyze')}
                >
                  <ScanSearch size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note about no deletion */}
      <p className="text-xs text-gray-400 text-center mt-8">
        {t('dashboard.no_delete_note')}
      </p>
    </div>
  )
}

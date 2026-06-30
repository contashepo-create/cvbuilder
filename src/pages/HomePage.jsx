import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, CheckCircle2, Layout, ScanSearch, Download, FlaskConical, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { DEMO_MODE } from '../lib/supabase'
import { ADMIN_SECRET_PATH } from '../constants/plans'

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signIn, isAdmin } = useAuthStore()

  const handleDemoLogin = async () => {
    await signIn({ email: 'demo@cvbuilder.app', password: 'demo' })
    navigate('/dashboard')
  }

  const features = [
    { icon: Layout, title: t('home.feature_templates_title'), desc: t('home.feature_templates_desc') },
    { icon: ScanSearch, title: t('home.feature_ats_title'), desc: t('home.feature_ats_desc') },
    { icon: FileText, title: t('home.feature_sections_title'), desc: t('home.feature_sections_desc') },
    { icon: Download, title: t('home.feature_pdf_title'), desc: t('home.feature_pdf_desc') },
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6">
              <CheckCircle2 size={16} />
              {t('home.free_badge')}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('home.hero_title')}
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              {t('home.hero_subtitle')}
            </p>
            <Link to="/register" className="btn bg-white text-primary-700 hover:bg-primary-50 text-lg px-8 py-3">
              {t('home.cta_start')}
            </Link>
            {DEMO_MODE && (
              <button
                onClick={handleDemoLogin}
                className="block mx-auto mt-4 text-sm text-white/80 hover:text-white underline underline-offset-4 flex items-center gap-1.5 justify-center"
              >
                <FlaskConical size={16} />
                أو جرّب الآن بدون تسجيل (دخول تجريبي)
              </button>
            )}

            {/* Admin button — only visible to admin account */}
            {isAdmin && (
              <button
                onClick={() => navigate(`/${ADMIN_SECRET_PATH}`)}
                className="block mx-auto mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm text-sm font-medium text-white border border-white/20 hover:bg-white/20 transition-all"
              >
                <Shield size={18} />
                لوحة الإدارة
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="card text-center hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-50 text-primary-600 mb-4">
                <feature.icon size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

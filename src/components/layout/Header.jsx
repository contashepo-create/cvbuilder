import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { LogOut, Menu, X, Globe, FileText, LayoutDashboard, Shield, Moon, Sun, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { DEMO_MODE } from '../../lib/supabase'
import { ADMIN_SECRET_PATH } from '../../constants/plans'

export default function Header() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const { user, profile, signOut, isAdmin } = useAuthStore()
  const { language, toggleLanguage } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const toggleDark = () => setDark(!dark)

  const userName = profile?.full_name || user?.email?.split('@')[0] || ''

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 transition-colors">
      {DEMO_MODE && (
        <div className="bg-amber-500 text-white text-center text-xs py-1 px-4 flex items-center justify-center gap-1.5">
          <FlaskConical size={14} />
          وضع التجربة — البيانات تُحفظ محلياً في المتصفح فقط
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
            <FileText size={28} />
            <span>CV Builder</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Globe size={18} />
              {language === 'ar' ? 'EN' : 'ع'}
            </button>

            {user ? (
              <>
                {/* Username */}
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium hidden lg:inline">
                  {userName}
                </span>

                {isAdmin && (
                  <Link
                    to={`/${ADMIN_SECRET_PATH}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                  >
                    <Shield size={18} />
                    لوحة التحكم
                  </Link>
                )}
                <Link to="/dashboard" className="btn-outline text-sm">
                  <LayoutDashboard size={18} />
                  {t('nav.dashboard')}
                </Link>
                <Link to="/messages" className="btn-outline text-sm">
                  <MessageCircle size={18} />
                  {isAr ? 'الرسائل' : 'Messages'}
                </Link>
                <button onClick={signOut} className="btn-secondary text-sm">
                  <LogOut size={18} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden flex flex-col gap-2 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDark}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {dark ? <><Sun size={18} /> Light</> : <><Moon size={18} /> Dark</>}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Globe size={18} />
                {language === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>

            {user && (
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium px-3 py-1">
                👤 {userName}
              </div>
            )}

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to={`/${ADMIN_SECRET_PATH}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Shield size={18} />
                    لوحة التحكم
                  </Link>
                )}
                <Link to="/dashboard" className="btn-outline text-sm" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard size={18} />
                  {t('nav.dashboard')}
                </Link>
                <Link to="/messages" className="btn-outline text-sm" onClick={() => setMobileOpen(false)}>
                  <MessageCircle size={18} />
                  {isAr ? 'الرسائل' : 'Messages'}
                </Link>
                <button onClick={() => { signOut(); setMobileOpen(false) }} className="btn-secondary text-sm">
                  <LogOut size={18} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm" onClick={() => setMobileOpen(false)}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

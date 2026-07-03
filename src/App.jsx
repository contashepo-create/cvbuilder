import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useAdStore } from './store/adStore'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import AdSystem from './components/ads/AdSystem'
import ProtectedRoute from './components/layout/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EmailVerifyPage from './pages/EmailVerifyPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import BuilderPage from './pages/BuilderPage'
import AnalysisPage from './pages/AnalysisPage'
import PricingPage from './pages/PricingPage'
import PaymentPage from './pages/PaymentPage'
import ActivationPage from './pages/ActivationPage'
import ContactPage from './pages/ContactPage'
import MessagesPage from './pages/MessagesPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'
import { ADMIN_SECRET_PATH } from './constants/plans'

export default function App() {
  const init = useAuthStore((s) => s.init)
  const { user } = useAuthStore()
  const { trackVisit, fetchVisitorCount } = useAdStore()
  const location = useLocation()

  useEffect(() => {
    init()
  }, [init])

  // Track visit on page change (wrapped in try/catch to prevent white screen)
  useEffect(() => {
    const page = location.pathname
    try {
      trackVisit(page, user?.id, user?.email)
      fetchVisitorCount()
    } catch (e) {
      console.error('Visit tracking failed:', e)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AdSystem />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<EmailVerifyPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/payment/:planId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/activate" element={<ProtectedRoute><ActivationPage /></ProtectedRoute>} />
          <Route path={`/${ADMIN_SECRET_PATH}`} element={<AdminPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/builder/:id" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
          <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

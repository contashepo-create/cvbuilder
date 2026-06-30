import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { useSubscriptionStore } from '../store/subscriptionStore'
import { usePaymentStore } from '../store/paymentStore'
import { useAuthStore } from '../store/authStore'
import { PLANS, PAYMENT_METHODS, ADMIN_SECRET_PATH, ADMIN_SECRET_KEY } from '../constants/plans'
import {
  Users, FileText, CreditCard, Ticket, Flag, Check, X,
  Crown, Copy, LogOut, Search, Shield, Loader2, AlertTriangle,
  KeyRound, MessageCircle, Clock,
} from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import { send2FACode } from '../lib/telegramBot'
import { createAdminSession, verifyAdminSession, destroyAdminSession } from '../lib/adminAuth'

// 2FA state management outside component (persists across renders)
let pending2FA = null // { code, expiresAt }

export default function AdminPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === 'ar'

  const { user, isAdmin } = useAuthStore()
  const { generateActivationCodes, fetchActivationCodes, adminActivatePlan, blockUser, unblockUser, setCustomCVLimit } = useSubscriptionStore()
  const { fetchAllPaymentRequests, updatePaymentStatus, paymentRequests } = usePaymentStore()

  // authStep: 'check-login' → '2fa-pending' → 'key' → 'authed'
  const [authStep, setAuthStep] = useState('check-login')
  const [keyInput, setKeyInput] = useState('')
  const [code2FA, setCode2FA] = useState('')
  const [authError, setAuthError] = useState('')
  const [sending2FA, setSending2FA] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [tab, setTab] = useState('overview')
  const [allUsers, setAllUsers] = useState([])
  const [allCVs, setAllCVs] = useState([])
  const [allCodes, setAllCodes] = useState([])
  const [allSubs, setAllSubs] = useState([])
  const [loading, setLoading] = useState(false)
  const [genPlan, setGenPlan] = useState('starter')
  const [genCount, setGenCount] = useState(1)
  const [genCustomCVs, setGenCustomCVs] = useState('')
  const [genResult, setGenResult] = useState([])
  const [search, setSearch] = useState('')

  const authed = authStep === 'authed'

  // Check existing session + login status on mount
  useEffect(() => {
    const session = verifyAdminSession()
    if (session.valid) {
      setAuthStep('authed')
      return
    }

    // If user is logged in AND is admin → auto-send 2FA
    if (user && isAdmin) {
      send2FA()
    } else if (user && !isAdmin) {
      // Logged in but not admin
      setAuthStep('denied')
    } else {
      // Not logged in
      setAuthStep('login-required')
    }
  }, [user, isAdmin])

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(interval)
    }
  }, [resendTimer])

  // Generate 6-digit code
  const generate2FACode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Get device info for security context
  const getDeviceInfo = () => {
    const nav = navigator
    const browser = nav.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown'
    const os = nav.userAgent.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)/)?.[0] || 'Unknown'
    return `${browser} (${os})`
  }

  // Auto-send 2FA code to Telegram when admin enters
  const send2FA = async () => {
    setSending2FA(true)
    setAuthError('')

    const code = generate2FACode()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
    pending2FA = { code, expiresAt }

    const deviceInfo = getDeviceInfo()
    const sent = await send2FACode(code, deviceInfo)

    if (!sent && !import.meta.env.VITE_TELEGRAM_BOT_TOKEN) {
      console.log(`[2FA] No bot token — Code: ${code}`)
      setAuthError(
        isAr
          ? `وضع التجربة — الرمز: ${code}`
          : `Demo mode — Code: ${code}`
      )
    } else if (!sent) {
      setAuthError(isAr ? 'تعذّر إرسال الرمز. حاول مرة أخرى.' : 'Failed to send code.')
      setSending2FA(false)
      return
    }

    setAuthStep('2fa-pending')
    setResendTimer(60)
    setSending2FA(false)
  }

  // Verify 2FA code → go to key step
  const handle2FAVerify = (e) => {
    e?.preventDefault()
    setAuthError('')

    if (!pending2FA) {
      setAuthError(isAr ? 'انتهت الجلسة. أعد المحاولة.' : 'Session expired.')
      send2FA()
      return
    }

    if (Date.now() > pending2FA.expiresAt) {
      setAuthError(isAr ? 'انتهت صلاحية الرمز.' : 'Code expired.')
      pending2FA = null
      send2FA()
      return
    }

    if (code2FA.trim() === pending2FA.code) {
      pending2FA = null
      setCode2FA('')
      setAuthStep('key')
    } else {
      setAuthError(isAr ? 'رمز خاطئ' : 'Wrong code')
    }
  }

  // Resend 2FA
  const handleResend2FA = async () => {
    if (resendTimer > 0) return
    await send2FA()
  }

  // Verify admin key → grant access
  const handleKeyVerify = (e) => {
    e.preventDefault()
    setAuthError('')

    if (keyInput === ADMIN_SECRET_KEY) {
      createAdminSession()
      setAuthStep('authed')
      setKeyInput('')
    } else {
      setAuthError(isAr ? 'مفتاح خاطئ' : 'Wrong key')
    }
  }

  const handleLogout = () => {
    destroyAdminSession()
    pending2FA = null
    setAuthStep('check-login')
    setKeyInput('')
    setCode2FA('')
    navigate('/')
  }

  // Fetch all data when authed
  useEffect(() => {
    if (!authed) return
    loadAllData()
  }, [authed])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Fetch users
      if (DEMO_MODE) {
        // In demo, we only have current user
        setAllUsers(user ? [{ id: user.id, email: user.email, full_name: 'Demo User' }] : [])
        // Fetch CVs from demo store
        const demoCVs = JSON.parse(localStorage.getItem('demo_cvs') || '[]')
        setAllCVs(demoCVs)
        // Fetch codes
        const codes = await fetchActivationCodes()
        setAllCodes(codes)
        await fetchAllPaymentRequests()
      } else {
        const [usersRes, cvsRes, codesRes, subsRes] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('cvs').select('*, profiles(email, full_name)'),
          supabase.from('activation_codes').select('*').order('created_at', { ascending: false }),
          supabase.from('subscriptions').select('*'),
        ])
        setAllUsers(usersRes.data || [])
        setAllCVs(cvsRes.data || [])
        setAllCodes(codesRes.data || codes)
        setAllSubs(subsRes.data || [])
        await fetchAllPaymentRequests()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCodes = async () => {
    try {
      const customCVs = genCustomCVs ? parseInt(genCustomCVs) : null
      const newCodes = await generateActivationCodes(genPlan, parseInt(genCount), customCVs)
      setGenResult(newCodes)
      const codes = await fetchActivationCodes()
      setAllCodes(codes)
    } catch (err) {
      console.error(err)
    }
  }

  const handleBlockUser = async (userId) => {
    if (!confirm(isAr ? 'حظر هذا المستخدم؟' : 'Block this user?')) return
    try {
      await blockUser(userId)
      alert(isAr ? 'تم حظر المستخدم' : 'User blocked')
      loadAllData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUnblockUser = async (userId) => {
    try {
      await unblockUser(userId)
      alert(isAr ? 'تم إلغاء الحظر' : 'User unblocked')
      loadAllData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSetCustomLimit = async (userId, limit) => {
    if (!limit) return
    try {
      await setCustomCVLimit(userId, parseInt(limit))
      alert(isAr ? `تم تحديد العدد: ${limit} سي في` : `Limit set: ${limit} CVs`)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleActivateUser = async (userId, plan) => {
    if (!confirm(`Activate ${plan} for this user?`)) return
    try {
      await adminActivatePlan(userId, plan)
      alert(isAr ? 'تم التفعيل' : 'Activated successfully')
      loadAllData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleApprovePayment = async (requestId) => {
    try {
      await updatePaymentStatus(requestId, 'approved')
    } catch (err) {
      console.error(err)
    }
  }

  const handleRejectPayment = async (requestId) => {
    if (!confirm(isAr ? 'رفض الطلب؟' : 'Reject request?')) return
    try {
      await updatePaymentStatus(requestId, 'rejected')
    } catch (err) {
      console.error(err)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // Filter helpers
  const flaggedCVs = allCVs.filter((cv) => cv.is_flagged)
  const pendingPayments = paymentRequests.filter((p) => p.status === 'pending')
  const filteredUsers = allUsers.filter((u) =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  // Auth screens
  if (authStep === 'login-required') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-700 mb-4">
            <Shield size={28} className="text-primary-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            {isAr ? 'مطلوب تسجيل الدخول' : 'Login Required'}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {isAr ? 'سجّل الدخول بحساب الأدمن للوصول للوحة التحكم' : 'Sign in with your admin account to access the panel'}
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full mb-2">
            {isAr ? 'تسجيل الدخول' : 'Login'}
          </button>
          <button onClick={() => navigate('/')} className="text-gray-500 text-xs hover:text-gray-300 block mx-auto mt-4">
            ← {isAr ? 'العودة للموقع' : 'Back to site'}
          </button>
        </div>
      </div>
    )
  }

  if (authStep === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-red-900 mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            {isAr ? 'غير مصرّح' : 'Access Denied'}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {isAr ? 'هذا الحساب لا يملك صلاحية الوصول للوحة الإدارة' : 'This account does not have admin access'}
          </p>
          <button onClick={() => navigate('/')} className="btn-secondary w-full">
            ← {isAr ? 'العودة للموقع' : 'Back to site'}
          </button>
        </div>
      </div>
    )
  }

  if (authStep === 'check-login' || authStep === '2fa-pending' || authStep === 'key') {
    const stepNum = authStep === 'check-login' ? 0 : authStep === '2fa-pending' ? 1 : 2
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-700 mb-3">
              {authStep === 'check-login' && <Loader2 size={28} className="text-primary-500 animate-spin" />}
              {authStep === '2fa-pending' && <MessageCircle size={28} className="text-blue-400" />}
              {authStep === 'key' && <KeyRound size={28} className="text-amber-400" />}
            </div>
            <h1 className="text-xl font-bold text-white">
              {authStep === '2fa-pending' && (isAr ? 'تأكيد ثنائي عبر التليجرام' : 'Telegram 2FA Verification')}
              {authStep === 'key' && (isAr ? 'أدخل مفتاح الأمان' : 'Enter Security Key')}
              {authStep === 'check-login' && (isAr ? 'جاري التحقق...' : 'Verifying...')}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {authStep === '2fa-pending' && (isAr ? `تم إرسال رمز 6 أرقام إلى تليجرام (${user?.email})` : `A 6-digit code was sent to your Telegram (${user?.email})`)}
              {authStep === 'key' && (isAr ? 'أدخل مفتاح الأمان لإكمال الدخول' : 'Enter the security key to complete access')}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 ${stepNum >= 1 ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${stepNum >= 1 ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-400'}`}>
                {stepNum >= 1 ? <Check size={14} /> : '1'}
              </div>
              <span className="text-xs hidden sm:inline">{isAr ? 'تليجرام' : 'Telegram'}</span>
            </div>
            <div className={`w-6 h-px ${stepNum >= 2 ? 'bg-amber-500' : 'bg-gray-600'}`} />
            <div className={`flex items-center gap-1.5 ${stepNum === 2 ? 'text-amber-400' : 'text-gray-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${stepNum === 2 ? 'bg-amber-500 text-white' : 'bg-gray-600 text-gray-400'}`}>
                2
              </div>
              <span className="text-xs hidden sm:inline">{isAr ? 'المفتاح' : 'Key'}</span>
            </div>
          </div>

          {/* Step 1: 2FA Code */}
          {authStep === '2fa-pending' && (
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <input
                type="text"
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-center text-2xl font-mono tracking-[0.5em] transition-colors"
                placeholder="••••••"
                dir="ltr"
                autoFocus
                inputMode="numeric"
                required
              />

              {authError && (
                <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                  authError.includes('Demo') || authError.includes('تجربة')
                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <span className="break-all">{authError}</span>
                </div>
              )}

              <button type="submit" className="btn bg-blue-600 text-white hover:bg-blue-700 w-full">
                <Check size={18} /> {isAr ? 'تأكيد' : 'Verify'}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Clock size={12} />
                    {isAr ? `إعادة الإرسال خلال ${resendTimer} ثانية` : `Resend in ${resendTimer}s`}
                  </p>
                ) : (
                  <button type="button" onClick={handleResend2FA} disabled={sending2FA} className="text-xs text-blue-400 hover:text-blue-300">
                    {sending2FA ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إعادة إرسال الرمز' : 'Resend code')}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step 2: Admin Key */}
          {authStep === 'key' && (
            <form onSubmit={handleKeyVerify} className="space-y-4">
              <div className="relative">
                <KeyRound size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-500" />
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full ps-10 pe-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-amber-500 transition-colors text-center text-lg tracking-widest"
                  placeholder="••••••"
                  dir="ltr"
                  autoFocus
                  maxLength={20}
                  required
                />
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  {authError}
                </div>
              )}

              <button type="submit" className="btn bg-amber-600 text-white hover:bg-amber-700 w-full">
                <Shield size={18} /> {isAr ? 'دخول' : 'Enter'}
              </button>

              <button type="button" onClick={() => { setAuthStep('2fa-pending'); setAuthError(''); setKeyInput(''); send2FA() }} className="text-xs text-gray-500 hover:text-gray-300 block mx-auto">
                ← {isAr ? 'العودة' : 'Back'}
              </button>
            </form>
          )}

          <button onClick={() => navigate('/')} className="text-gray-600 text-xs mt-4 hover:text-gray-400 block mx-auto">
            ← {isAr ? 'العودة للموقع' : 'Back to site'}
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: Shield },
    { id: 'users', label: isAr ? 'المستخدمون' : 'Users', icon: Users },
    { id: 'payments', label: isAr ? 'طلبات الدفع' : 'Payments', icon: CreditCard },
    { id: 'codes', label: isAr ? 'أكواد التفعيل' : 'Activation Codes', icon: Ticket },
    { id: 'cvs', label: isAr ? 'السي فيات' : 'CVs', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-primary-400" />
          <span className="font-bold">System Management</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAllData} className="text-xs text-gray-400 hover:text-white">
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
            <LogOut size={14} /> {isAr ? 'خروج' : 'Logout'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === tabItem.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tabItem.icon size={16} />
              {tabItem.label}
              {tabItem.id === 'payments' && pendingPayments.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingPayments.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={32} /></div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label={isAr ? 'المستخدمون' : 'Users'} value={allUsers.length} color="blue" />
                <StatCard icon={FileText} label={isAr ? 'السي فيات' : 'CVs'} value={allCVs.length} color="green" />
                <StatCard icon={CreditCard} label={isAr ? 'طلبات دفع معلقة' : 'Pending Payments'} value={pendingPayments.length} color="amber" />
                <StatCard icon={Flag} label={isAr ? 'سي فيات موسومة' : 'Flagged CVs'} value={flaggedCVs.length} color="red" />
              </div>
            )}

            {/* Users */}
            {tab === 'users' && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Search size={18} className="text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isAr ? 'بحث بالاسم أو الإيميل' : 'Search by name or email'}
                    className="input max-w-xs"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-start">
                        <th className="text-start py-2 px-3">{isAr ? 'الاسم' : 'Name'}</th>
                        <th className="text-start py-2 px-3">{isAr ? 'الإيميل' : 'Email'}</th>
                        <th className="text-start py-2 px-3">{isAr ? 'الهاتف' : 'Phone'}</th>
                        <th className="text-start py-2 px-3">{isAr ? 'الباقة' : 'Plan'}</th>
                        <th className="text-start py-2 px-3">{isAr ? 'الحد' : 'Limit'}</th>
                        <th className="text-start py-2 px-3">{isAr ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const userSub = allSubs.find(s => s.user_id === u.id)
                        const isBlocked = userSub?.status === 'blocked'
                        return (
                        <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isBlocked ? 'bg-red-50' : ''}`}>
                          <td className="py-2 px-3">{u.full_name}</td>
                          <td className="py-2 px-3" dir="ltr">{u.email || '—'}</td>
                          <td className="py-2 px-3" dir="ltr">{u.phone_number || '—'}</td>
                          <td className="py-2 px-3">
                            {isBlocked ? (
                              <span className="badge bg-red-100 text-red-700">{isAr ? 'محظور' : 'Blocked'}</span>
                            ) : (
                              <span className="badge bg-blue-100 text-blue-700">{userSub?.plan || 'free'}</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {userSub?.custom_max_cvs || PLANS[userSub?.plan]?.maxCVs || 1}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {!isBlocked && (
                                <select
                                  onChange={(e) => { if (e.target.value) handleActivateUser(u.id, e.target.value); e.target.value = '' }}
                                  className="text-xs border border-gray-300 rounded px-1.5 py-1"
                                  defaultValue=""
                                >
                                  <option value="" disabled>{isAr ? 'باقة' : 'Plan'}</option>
                                  <option value="free">{isAr ? 'مجاني' : 'Free'}</option>
                                  <option value="starter">Starter</option>
                                  <option value="pro">Pro</option>
                                </select>
                              )}
                              <input
                                type="number"
                                placeholder={isAr ? 'حد مخصص' : 'Custom limit'}
                                className="text-xs border border-gray-300 rounded px-1.5 py-1 w-20"
                                onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value) handleSetCustomLimit(u.id, e.target.value) }}
                              />
                              {isBlocked ? (
                                <button onClick={() => handleUnblockUser(u.id)} className="text-xs text-green-600 hover:text-green-800 px-1.5 py-1 rounded bg-green-50">
                                  {isAr ? 'فك حظر' : 'Unblock'}
                                </button>
                              ) : (
                                <button onClick={() => handleBlockUser(u.id)} className="text-xs text-red-600 hover:text-red-800 px-1.5 py-1 rounded bg-red-50">
                                  {isAr ? 'حظر' : 'Block'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payments */}
            {tab === 'payments' && (
              <div className="space-y-3">
                {paymentRequests.length === 0 && (
                  <p className="text-center text-gray-400 py-8">{isAr ? 'لا توجد طلبات' : 'No requests'}</p>
                )}
                {paymentRequests.map((req) => (
                  <div key={req.id} className={`card ${req.status === 'pending' ? 'border-amber-300' : req.status === 'approved' ? 'border-green-300' : 'border-red-300'}`}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {req.status}
                          </span>
                          <span className="font-medium">{req.plan}</span>
                          <span className="text-gray-500 text-xs">
                            {PAYMENT_METHODS.find((m) => m.id === req.payment_method)?.[isAr ? 'name_ar' : 'name_en'] || req.payment_method}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>{isAr ? 'المرجع:' : 'Ref:'}</strong> <span dir="ltr">{req.transaction_ref}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>{isAr ? 'التاريخ:' : 'Date:'}</strong> {req.payment_date}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {req.profiles?.email || '—'} — {new Date(req.created_at).toLocaleString()}
                        </p>
                        {req.admin_notes && (
                          <p className="text-xs text-gray-500 mt-1">📝 {req.admin_notes}</p>
                        )}
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleApprovePayment(req.id)} className="btn bg-green-600 text-white hover:bg-green-700 text-sm">
                            <Check size={16} /> {isAr ? 'قبول' : 'Approve'}
                          </button>
                          <button onClick={() => handleRejectPayment(req.id)} className="btn bg-red-600 text-white hover:bg-red-700 text-sm">
                            <X size={16} /> {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      )}
                      {req.status === 'approved' && (
                        <button
                          onClick={() => {
                            const code = generateActivationCodes(req.plan, 1).then(codes => {
                              copyToClipboard(codes[0].code)
                              alert(isAr ? `كود التفعيل: ${codes[0].code}\nتم نسخه` : `Code: ${codes[0].code}\nCopied!`)
                            })
                          }}
                          className="btn-secondary text-sm"
                        >
                          <Ticket size={16} /> {isAr ? 'توليد كود' : 'Generate Code'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Activation Codes */}
            {tab === 'codes' && (
              <div>
                <div className="card mb-6">
                  <h3 className="font-semibold mb-3">{isAr ? 'توليد أكواد جديدة' : 'Generate New Codes'}</h3>
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label className="label">{isAr ? 'الباقة' : 'Plan'}</label>
                      <select value={genPlan} onChange={(e) => setGenPlan(e.target.value)} className="input">
                        <option value="free">{isAr ? 'مجاني' : 'Free'}</option>
                        <option value="starter">Starter (3 CVs)</option>
                        <option value="pro">Pro (5 CVs)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">{isAr ? 'العدد' : 'Count'}</label>
                      <input type="number" min="1" max="50" value={genCount} onChange={(e) => setGenCount(e.target.value)} className="input w-20" />
                    </div>
                    <div>
                      <label className="label">{isAr ? 'حد مخصص (اختياري)' : 'Custom limit (optional)'}</label>
                      <input type="number" min="1" placeholder={isAr ? 'مثال: 10' : 'e.g. 10'} value={genCustomCVs} onChange={(e) => setGenCustomCVs(e.target.value)} className="input w-28" />
                    </div>
                    <button onClick={handleGenerateCodes} className="btn-primary">
                      <Ticket size={18} /> {isAr ? 'توليد' : 'Generate'}
                    </button>
                  </div>
                  {genResult.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-2">{isAr ? 'أكواد مولّدة:' : 'Generated codes:'}</p>
                      <div className="space-y-1">
                        {genResult.map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <code className="text-lg font-mono font-bold text-green-800">{c.code}</code>
                            <button onClick={() => copyToClipboard(c.code)} className="text-gray-400 hover:text-gray-600">
                              <Copy size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-start py-2 px-3">{isAr ? 'الكود' : 'Code'}</th>
                        <th className="text-start py-2 px-3">{isAr ? 'الباقة' : 'Plan'}</th>
                        <th className="text-start py-2 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="text-start py-2 px-3">{isAr ? 'الانتهاء' : 'Expires'}</th>
                        <th className="text-start py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCodes.map((c) => (
                        <tr key={c.id} className="border-b border-gray-100">
                          <td className="py-2 px-3 font-mono">{c.code}</td>
                          <td className="py-2 px-3">{c.plan}</td>
                          <td className="py-2 px-3">
                            <span className={`badge ${c.status === 'unused' ? 'bg-green-100 text-green-700' : c.status === 'used' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-500">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                          <td className="py-2 px-3">
                            {c.status === 'unused' && (
                              <button onClick={() => copyToClipboard(c.code)} className="text-gray-400 hover:text-gray-600">
                                <Copy size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CVs */}
            {tab === 'cvs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-start py-2 px-3">{isAr ? 'العنوان' : 'Title'}</th>
                      <th className="text-start py-2 px-3">{isAr ? 'المستخدم' : 'User'}</th>
                      <th className="text-start py-2 px-3">{isAr ? 'القالب' : 'Template'}</th>
                      <th className="text-start py-2 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="text-start py-2 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCVs.map((cv) => (
                      <tr key={cv.id} className={`border-b border-gray-100 ${cv.is_flagged ? 'bg-red-50' : ''}`}>
                        <td className="py-2 px-3">{cv.title || 'Untitled'}</td>
                        <td className="py-2 px-3">{cv.profiles?.email || cv.user_id?.slice(0, 8)}</td>
                        <td className="py-2 px-3">{cv.template_id}</td>
                        <td className="py-2 px-3">
                          {cv.is_flagged ? (
                            <span className="badge bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                              <Flag size={12} /> {isAr ? 'موسوم' : 'Flagged'}
                            </span>
                          ) : (
                            <span className="badge bg-green-100 text-green-700">{isAr ? 'طبيعي' : 'OK'}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-500">{new Date(cv.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="card">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${colors[color]} mb-2`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

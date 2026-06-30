import { create } from 'zustand'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { sendPaymentNotification, sendTelegramPhoto } from '../lib/telegramBot'

const DEMO_PAYMENTS_KEY = 'demo_payment_requests'

function getDemoPayments() {
  const stored = localStorage.getItem(DEMO_PAYMENTS_KEY)
  return stored ? JSON.parse(stored) : []
}

function setDemoPayments(payments) {
  localStorage.setItem(DEMO_PAYMENTS_KEY, JSON.stringify(payments))
}

export const usePaymentStore = create((set, get) => ({
  paymentRequests: [],
  loading: false,
  error: null,
  lastRequest: null,

  fetchPaymentRequests: async (userId) => {
    if (DEMO_MODE) {
      const all = getDemoPayments()
      set({ paymentRequests: all.filter((p) => p.user_id === userId), loading: false })
      return
    }

    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ paymentRequests: data || [], loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  submitPaymentRequest: async (userId, userName, userEmail, data) => {
    const requestId = crypto.randomUUID()

    const request = {
      id: requestId,
      user_id: userId,
      plan: data.plan,
      payment_method: data.paymentMethod,
      transaction_ref: data.transactionRef,
      payment_date: data.paymentDate,
      screenshot_url: data.screenshot || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    if (DEMO_MODE) {
      const all = getDemoPayments()
      all.unshift(request)
      setDemoPayments(all)
      set({ lastRequest: request })
    } else {
      const { error } = await supabase
        .from('payment_requests')
        .insert(request)
      if (error) throw error
      set({ lastRequest: request })
    }

    // Send Telegram notification
    const planName = data.plan === 'starter' ? 'بداية (3 سي فيات - 100 ج.م)' : 'احترافي (5 سي فيات - 200 ج.م)'
    const methodName = {
      orange_cash: 'أورانج كاش',
      bank_transfer: 'تحويل بنكي',
      instapay: 'إنستا باي',
    }[data.paymentMethod] || data.paymentMethod

    await sendPaymentNotification({
      userName,
      userEmail,
      plan: planName,
      paymentMethod: methodName,
      transactionRef: data.transactionRef,
      paymentDate: data.paymentDate,
      requestId,
    })

    // Send screenshot if provided
    if (data.screenshot) {
      await sendTelegramPhoto(
        data.screenshot,
        `📸 إثبات دفع - ${userName} - ${methodName}`
      )
    }

    return request
  },

  // Used by admin to fetch ALL payment requests
  fetchAllPaymentRequests: async () => {
    if (DEMO_MODE) {
      set({ paymentRequests: getDemoPayments(), loading: false })
      return
    }

    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*, profiles(full_name, email, phone_number, city)')
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ paymentRequests: data || [], loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  updatePaymentStatus: async (requestId, status, adminNotes = '') => {
    if (DEMO_MODE) {
      const all = getDemoPayments()
      const idx = all.findIndex((p) => p.id === requestId)
      if (idx >= 0) {
        all[idx].status = status
        all[idx].admin_notes = adminNotes
        all[idx].reviewed_at = new Date().toISOString()
        setDemoPayments(all)
        set({ paymentRequests: all })
      }
      return
    }

    const { error } = await supabase
      .from('payment_requests')
      .update({ status, admin_notes: adminNotes, reviewed_at: new Date().toISOString() })
      .eq('id', requestId)
    if (error) throw error

    // Refresh
    get().fetchAllPaymentRequests()
  },
}))

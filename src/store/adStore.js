import { create } from 'zustand'
import { supabase, DEMO_MODE } from '../lib/supabase'
import { getVisitorIP } from '../lib/telegramBot'

const DEMO_ADS_KEY = 'demo_ads'
const DEMO_SETTINGS_KEY = 'demo_site_settings'
const DEMO_VISITORS_KEY = 'demo_visitors'

function getDemoAds() {
  const stored = localStorage.getItem(DEMO_ADS_KEY)
  return stored ? JSON.parse(stored) : []
}
function setDemoAds(ads) { localStorage.setItem(DEMO_ADS_KEY, JSON.stringify(ads)) }

function getDemoSettings() {
  const stored = localStorage.getItem(DEMO_SETTINGS_KEY)
  return stored ? JSON.parse(stored) : {
    visitor_count_offset: '1000',
    scrolling_text_ar: 'مرحباً بكم في CV Builder — أول سي في مجاني',
    scrolling_text_en: 'Welcome to CV Builder — your first CV is free',
    scrolling_enabled: 'true',
    whatsapp_number: '',
    telegram_contact: 'https://t.me/your_telegram_username',
  }
}
function setDemoSettings(s) { localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(s)) }

function getDemoVisitors() {
  const stored = localStorage.getItem(DEMO_VISITORS_KEY)
  return stored ? parseInt(stored) : 1000
}
function setDemoVisitors(v) { localStorage.setItem(DEMO_VISITORS_KEY, v.toString()) }

export const useAdStore = create((set, get) => ({
  ads: [],
  settings: null,
  visitorCount: 0,
  messages: [],
  loading: false,
  error: null,

  // ---- Public: fetch active ads ----
  fetchActiveAds: async () => {
    try {
      if (DEMO_MODE) {
        set({ ads: getDemoAds().filter(a => a.is_active) })
        return
      }
      const { data } = await supabase.from('ads').select('*').eq('is_active', true).order('created_at', { ascending: false })
      set({ ads: data || [] })
    } catch {}
  },

  // ---- Public: fetch site settings ----
  fetchSettings: async () => {
    if (DEMO_MODE) {
      set({ settings: getDemoSettings() })
      return
    }
    try {
      const { data } = await supabase.from('site_settings').select('*')
      const settings = {}
      data?.forEach(s => { settings[s.key] = s.value })
      set({ settings })
    } catch {}
  },

  // ---- Public: track visit ----
  trackVisit: async (page, userId = null, userEmail = null) => {
    if (DEMO_MODE) {
      setDemoVisitors(getDemoVisitors() + 1)
      set({ visitorCount: getDemoVisitors() })
      return
    }
    try {
      const ip = await getVisitorIP()
      const ua = navigator.userAgent.slice(0, 200)
      await supabase.from('visitors').insert({
        ip_address: ip, user_agent: ua, page, user_id: userId,
      })
    } catch {}
  },

  // ---- Public: get visitor count (with offset) ----
  fetchVisitorCount: async () => {
    if (DEMO_MODE) {
      set({ visitorCount: getDemoVisitors() })
      return
    }
    try {
      // Get count from visitors table + offset from settings
      const { count } = await supabase.from('visitors').select('*', { count: 'exact', head: true })
      const { data: offsetData } = await supabase.from('site_settings').select('value').eq('key', 'visitor_count_offset').single()
      const offset = parseInt(offsetData?.value || '0')
      set({ visitorCount: (count || 0) + offset })
    } catch {
      set({ visitorCount: 0 })
    }
  },

  // ---- Public: track ad view ----
  trackAdView: async (adId, userId = null, userEmail = null) => {
    try {
      if (DEMO_MODE) return
      await supabase.from('ad_views').insert({ ad_id: adId, user_id: userId, user_email: userEmail })
      await supabase.rpc('increment_ad_views', { ad_id: adId }).catch(() => {})
    } catch {}
  },

  // ---- Public: dismiss ad ----
  dismissAd: async (adId, userId) => {
    if (DEMO_MODE) return
    try {
      await supabase.from('ad_dismissals').upsert({ ad_id: adId, user_id: userId })
    } catch {}
  },

  // ---- Public: send message to admin ----
  sendMessage: async (data) => {
    if (DEMO_MODE) {
      const msgs = JSON.parse(localStorage.getItem('demo_messages') || '[]')
      msgs.unshift({ ...data, id: crypto.randomUUID(), status: 'unread', created_at: new Date().toISOString() })
      localStorage.setItem('demo_messages', JSON.stringify(msgs))
      return
    }
    const { error } = await supabase.from('user_messages').insert(data)
    if (error) throw error
  },

  // ---- Messaging system (conversations) ----
  conversations: [],
  currentConversation: null,
  conversationMessages: [],

  // User: fetch their conversations
  fetchUserConversations: async (userId) => {
    if (DEMO_MODE) {
      const stored = JSON.parse(localStorage.getItem('demo_conversations') || '[]')
      set({ conversations: stored.filter(c => c.user_id === userId) })
      return
    }
    const { data } = await supabase
      .from('conversations')
      .select('*, conversation_messages(*)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    set({ conversations: data || [] })
  },

  // User/Admin: fetch messages in a conversation
  fetchConversationMessages: async (conversationId) => {
    if (DEMO_MODE) {
      const convs = JSON.parse(localStorage.getItem('demo_conversations') || '[]')
      const conv = convs.find(c => c.id === conversationId)
      set({ conversationMessages: conv?.conversation_messages || [] })
      return
    }
    const { data } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    set({ conversationMessages: data || [] })
  },

  // Create a new conversation
  createConversation: async (userId, subject, firstMessage, senderType = 'user') => {
    if (DEMO_MODE) {
      const convs = JSON.parse(localStorage.getItem('demo_conversations') || '[]')
      const newConv = {
        id: crypto.randomUUID(),
        user_id: userId,
        subject,
        status: 'open',
        created_by: senderType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversation_messages: [{
          id: crypto.randomUUID(),
          conversation_id: 'temp',
          sender_type: senderType,
          message: firstMessage,
          created_at: new Date().toISOString(),
        }],
      }
      newConv.conversation_messages[0].conversation_id = newConv.id
      convs.unshift(newConv)
      localStorage.setItem('demo_conversations', JSON.stringify(convs))
      set({ conversations: [newConv, ...get().conversations] })
      return newConv
    }

    // Create conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ user_id: userId, subject, status: 'open', created_by: senderType })
      .select()
      .single()
    if (convError) throw convError

    // Add first message
    const { error: msgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conv.id,
        sender_id: senderType === 'user' ? userId : null,
        sender_type: senderType,
        message: firstMessage,
      })
    if (msgError) throw msgError

    // Return conversation with messages
    const { data: fullConv } = await supabase
      .from('conversations')
      .select('*, conversation_messages(*)')
      .eq('id', conv.id)
      .single()
    return fullConv
  },

  // Send a message in an existing conversation
  sendConversationMessage: async (conversationId, message, senderType, senderId = null) => {
    if (DEMO_MODE) {
      const convs = JSON.parse(localStorage.getItem('demo_conversations') || '[]')
      const idx = convs.findIndex(c => c.id === conversationId)
      if (idx >= 0) {
        convs[idx].conversation_messages = convs[idx].conversation_messages || []
        convs[idx].conversation_messages.push({
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          sender_type: senderType,
          message,
          created_at: new Date().toISOString(),
        })
        convs[idx].updated_at = new Date().toISOString()
        localStorage.setItem('demo_conversations', JSON.stringify(convs))
        set({ conversationMessages: convs[idx].conversation_messages })
      }
      return
    }

    const { error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        message,
      })
    if (error) throw error

    // Update conversation updated_at
    await supabase.from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Refresh messages
    await get().fetchConversationMessages(conversationId)
  },

  // Mark messages as read
  markMessagesRead: async (conversationId, senderType) => {
    if (DEMO_MODE) return
    // Mark messages from the OTHER party as read
    const otherType = senderType === 'user' ? 'admin' : 'user'
    await supabase
      .from('conversation_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('sender_type', otherType)
      .is('read_at', null)
  },

  // Admin: close/lock a conversation
  closeConversation: async (conversationId) => {
    if (DEMO_MODE) {
      const convs = JSON.parse(localStorage.getItem('demo_conversations') || '[]')
      const idx = convs.findIndex(c => c.id === conversationId)
      if (idx >= 0) {
        convs[idx].status = 'closed'
        convs[idx].closed_at = new Date().toISOString()
        localStorage.setItem('demo_conversations', JSON.stringify(convs))
      }
      return
    }
    await supabase.from('conversations')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', conversationId)
  },

  // Admin: reopen a conversation
  reopenConversation: async (conversationId) => {
    if (DEMO_MODE) {
      const convs = JSON.parse(localStorage.getItem('demo_conversations') || '[]')
      const idx = convs.findIndex(c => c.id === conversationId)
      if (idx >= 0) {
        convs[idx].status = 'open'
        convs[idx].closed_at = null
        localStorage.setItem('demo_conversations', JSON.stringify(convs))
      }
      return
    }
    await supabase.from('conversations')
      .update({ status: 'open', closed_at: null })
      .eq('id', conversationId)
  },

  // Admin: fetch ALL conversations (for admin panel)
  fetchAllConversations: async () => {
    if (DEMO_MODE) {
      return JSON.parse(localStorage.getItem('demo_conversations') || '[]')
    }
    const { data } = await supabase
      .from('conversations')
      .select('*, conversation_messages(*), profiles(email, full_name)')
      .order('updated_at', { ascending: false })
    return data || []
  },

  // Admin: send message to a specific user (new conversation)
  adminMessageUser: async (userId, subject, message) => {
    return get().createConversation(userId, subject, message, 'admin')
  },

  // ---- Admin: fetch all ads ----
  fetchAllAds: async () => {
    if (DEMO_MODE) { return getDemoAds() }
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false })
    return data || []
  },

  // ---- Admin: create ad ----
  createAd: async (adData) => {
    if (DEMO_MODE) {
      const ads = getDemoAds()
      const newAd = { ...adData, id: crypto.randomUUID(), views: 0, dismissals: 0, created_at: new Date().toISOString() }
      ads.unshift(newAd)
      setDemoAds(ads)
      return newAd
    }
    const { data, error } = await supabase.from('ads').insert(adData).select().single()
    if (error) throw error
    return data
  },

  // ---- Admin: update ad ----
  updateAd: async (adId, updates) => {
    if (DEMO_MODE) {
      const ads = getDemoAds()
      const idx = ads.findIndex(a => a.id === adId)
      if (idx >= 0) { ads[idx] = { ...ads[idx], ...updates }; setDemoAds(ads) }
      return
    }
    await supabase.from('ads').update(updates).eq('id', adId)
  },

  // ---- Admin: delete ad ----
  deleteAd: async (adId) => {
    if (DEMO_MODE) {
      setDemoAds(getDemoAds().filter(a => a.id !== adId))
      return
    }
    await supabase.from('ads').delete().eq('id', adId)
  },

  // ---- Admin: update settings ----
  updateSetting: async (key, value) => {
    if (DEMO_MODE) {
      const s = getDemoSettings()
      s[key] = value
      setDemoSettings(s)
      set({ settings: s })
      return
    }
    await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() })
  },

  // ---- Admin: fetch all messages ----
  fetchMessages: async () => {
    if (DEMO_MODE) {
      return JSON.parse(localStorage.getItem('demo_messages') || '[]')
    }
    const { data } = await supabase.from('user_messages').select('*').order('created_at', { ascending: false })
    return data || []
  },

  // ---- Admin: reply to message ----
  replyMessage: async (messageId, reply) => {
    if (DEMO_MODE) {
      const msgs = JSON.parse(localStorage.getItem('demo_messages') || '[]')
      const idx = msgs.findIndex(m => m.id === messageId)
      if (idx >= 0) { msgs[idx].admin_reply = reply; msgs[idx].status = 'replied'; msgs[idx].replied_at = new Date().toISOString() }
      localStorage.setItem('demo_messages', JSON.stringify(msgs))
      return
    }
    await supabase.from('user_messages').update({ admin_reply: reply, status: 'replied', replied_at: new Date().toISOString() }).eq('id', messageId)
  },

  // ---- Admin: fetch ad statistics ----
  fetchAdStats: async (adId) => {
    if (DEMO_MODE) return { views: 0, uniqueViewers: [] }
    const { data } = await supabase.from('ad_views').select('user_email').eq('ad_id', adId)
    return {
      views: data?.length || 0,
      uniqueViewers: data?.filter((v, i, a) => v.user_email && a.findIndex(x => x.user_email === v.user_email) === i) || [],
    }
  },

  // ---- Admin: fetch visitor stats ----
  fetchVisitorStats: async () => {
    if (DEMO_MODE) {
      return { total: getDemoVisitors(), today: 0, uniqueIPs: 0 }
    }
    const { count: total } = await supabase.from('visitors').select('*', { count: 'exact', head: true })
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { count: todayCount } = await supabase.from('visitors').select('*', { count: 'exact', head: true }).gte('visited_at', today.toISOString())
    const { data: ipData } = await supabase.from('visitors').select('ip_address')
    const uniqueIPs = new Set(ipData?.map(v => v.ip_address).filter(Boolean)).size
    return { total: total || 0, today: todayCount || 0, uniqueIPs }
  },

  // ---- Payment methods ----
  paymentMethods: [],
  fetchPaymentMethods: async () => {
    if (DEMO_MODE) {
      set({ paymentMethods: [
        { id: '1', name_ar: 'أورانج كاش', name_en: 'Orange Cash', number: '01000000000', icon: '🟠', details_ar: '', details_en: '', is_active: true, sort_order: 1 },
        { id: '2', name_ar: 'تحويل بنكي', name_en: 'Bank Transfer', number: 'ACC-123456789', icon: '🏦', details_ar: 'بنك مصر', details_en: 'Banque Misr', is_active: true, sort_order: 2 },
        { id: '3', name_ar: 'إنستا باي', name_en: 'InstaPay', number: 'instapay@handle', icon: '⚡', details_ar: '', details_en: '', is_active: true, sort_order: 3 },
      ]})
      return
    }
    const { data } = await supabase.from('payment_methods').select('*').order('sort_order', { ascending: true })
    set({ paymentMethods: data || [] })
  },
  createPaymentMethod: async (method) => {
    if (DEMO_MODE) return
    const { error } = await supabase.from('payment_methods').insert(method)
    if (error) throw error
    await get().fetchPaymentMethods()
  },
  updatePaymentMethod: async (id, updates) => {
    if (DEMO_MODE) return
    await supabase.from('payment_methods').update(updates).eq('id', id)
    await get().fetchPaymentMethods()
  },
  deletePaymentMethod: async (id) => {
    if (DEMO_MODE) return
    await supabase.from('payment_methods').delete().eq('id', id)
    await get().fetchPaymentMethods()
  },

  // ---- Contact links ----
  contactLinks: [],
  fetchContactLinks: async () => {
    if (DEMO_MODE) {
      set({ contactLinks: [
        { id: '1', name_ar: 'واتساب', name_en: 'WhatsApp', url: 'https://wa.me/201234567890', icon: '💬', color: '#25D366', is_active: true, sort_order: 1 },
        { id: '2', name_ar: 'تليجرام', name_en: 'Telegram', url: 'https://t.me/your_username', icon: '✈️', color: '#0088cc', is_active: true, sort_order: 2 },
      ]})
      return
    }
    const { data } = await supabase.from('contact_links').select('*').order('sort_order', { ascending: true })
    set({ contactLinks: data || [] })
  },
  createContactLink: async (link) => {
    if (DEMO_MODE) return
    const { error } = await supabase.from('contact_links').insert(link)
    if (error) throw error
    await get().fetchContactLinks()
  },
  updateContactLink: async (id, updates) => {
    if (DEMO_MODE) return
    await supabase.from('contact_links').update(updates).eq('id', id)
    await get().fetchContactLinks()
  },
  deleteContactLink: async (id) => {
    if (DEMO_MODE) return
    await supabase.from('contact_links').delete().eq('id', id)
    await get().fetchContactLinks()
  },
}))

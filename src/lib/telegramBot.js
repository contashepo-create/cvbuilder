/**
 * Telegram Bot integration for sending payment notifications to admin
 * Uses Telegram Bot API
 */

// These should be set in .env
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
const ADMIN_CHAT_ID = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID || ''

/**
 * Escape HTML entities to prevent injection in Telegram messages
 */
function esc(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Send a message to admin's Telegram
 * @param {string} message - Text message to send
 * @returns {Promise<boolean>}
 */
export async function sendTelegramMessage(message) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    // In demo mode, just log
    console.log('[Telegram] Message would be sent:', message)
    return false
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )
    return res.ok
  } catch (err) {
    console.error('Telegram send error:', err)
    return false
  }
}

/**
 * Send payment request notification to admin
 * @param {Object} data - Payment request data
 * @param {string} data.userName - User's name
 * @param {string} data.userEmail - User's email
 * @param {string} data.plan - Plan name
 * @param {string} data.paymentMethod - Payment method
 * @param {string} data.transactionRef - Transaction reference
 * @param {string} data.paymentDate - Payment date
 * @param {string} data.requestId - Request ID for admin reference
 */
export async function sendPaymentNotification(data) {
  const message = `
🔔 <b>طلب اشتراك جديد</b>

👤 <b>الاسم:</b> ${esc(data.userName)}
📧 <b>الإيميل:</b> ${esc(data.userEmail)}
📦 <b>الباقة:</b> ${esc(data.plan)}
💰 <b>طريقة الدفع:</b> ${esc(data.paymentMethod)}
🔢 <b>رقم العملية:</b> ${esc(data.transactionRef)}
📅 <b>تاريخ الدفع:</b> ${esc(data.paymentDate)}
🆔 <b>رقم الطلب:</b> <code>${esc(data.requestId)}</code>

✅ راجع الطلب في لوحة التحكم
  `.trim()

  return sendTelegramMessage(message)
}

/**
 * Send 2FA code to admin's Telegram
 * @param {string} code - 6-digit code
 * @param {string} deviceInfo - Browser/device info for security context
 * @returns {Promise<boolean>}
 */
export async function send2FACode(code, deviceInfo = '') {
  const message = `
🔐 <b>رمز تأكيد الدخول — لوحة الإدارة</b>

🔑 الرمز: <code>${code}</code>

⏱️ ينتهي خلال 5 دقائق
📱 ${deviceInfo ? `من: ${deviceInfo}` : ''}
🔒 إذا لم تكن أنت، تجاهل هذه الرسالة
  `.trim()

  return sendTelegramMessage(message)
}

/**
 * Send a photo to admin's Telegram
 * @param {string} base64Photo - Base64 encoded photo
 * @param {string} caption - Photo caption
 * @returns {Promise<boolean>}
 */
export async function sendTelegramPhoto(base64Photo, caption) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.log('[Telegram] Photo would be sent with caption:', caption)
    return false
  }

  try {
    // Convert base64 to blob
    const res = await fetch(base64Photo)
    const blob = await res.blob()

    const formData = new FormData()
    formData.append('chat_id', ADMIN_CHAT_ID)
    formData.append('photo', blob, 'payment_proof.jpg')
    formData.append('caption', caption)

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      { method: 'POST', body: formData }
    )
    return response.ok
  } catch (err) {
    console.error('Telegram photo send error:', err)
    return false
  }
}

/**
 * Send security alert to admin's Telegram
 * @param {Object} data - Security alert data
 * @param {string} data.type - Alert type: 'failed_login' | 'multiple_attempts' | 'suspicious_activity' | 'blocked_access'
 * @param {string} data.email - Email used (if any)
 * @param {string} data.ip - IP address (if available)
 * @param {string} data.userAgent - Browser/device info
 * @param {string} data.details - Additional details
 * @param {number} data.attempts - Number of attempts (if applicable)
 */
export async function sendSecurityAlert(data) {
  const alertEmojis = {
    failed_login: '🚫',
    multiple_attempts: '⚠️',
    suspicious_activity: '🔍',
    blocked_access: '🔒',
    admin_2fa: '🔐',
  }

  const emoji = alertEmojis[data.type] || '⚠️'
  const typeLabels = {
    failed_login: 'محاولة دخول فاشلة',
    multiple_attempts: 'محاولات متعددة',
    suspicious_activity: 'نشاط مشبوه',
    blocked_access: 'محاولة وصول محظورة',
    admin_2fa: 'رمز تأكيد الدخول — لوحة الإدارة',
  }

  const message = `
${emoji} <b>تنبيه أمني</b>

📋 <b>النوع:</b> ${esc(typeLabels[data.type] || data.type)}
${data.email ? `📧 <b>الإيميل:</b> ${esc(data.email)}` : ''}
${data.ip ? `🌐 <b>IP:</b> <code>${esc(data.ip)}</code>` : ''}
📱 <b>الجهاز:</b> ${esc(data.userAgent || 'Unknown')}
${data.attempts ? `🔢 <b>المحاولات:</b> ${esc(String(data.attempts))}` : ''}
${data.details ? `📝 <b>التفاصيل:</b> ${esc(data.details)}` : ''}
🕐 <b>الوقت:</b> ${new Date().toLocaleString('ar')}
  `.trim()

  return sendTelegramMessage(message)
}

/**
 * Get visitor's IP address (using a free service)
 * @returns {Promise<string>}
 */
export async function getVisitorIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    return data.ip || 'Unknown'
  } catch {
    return 'Unknown'
  }
}

/**
 * Get device/browser info
 * @returns {string}
 */
export function getDeviceInfo() {
  const nav = navigator
  const browser = nav.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown'
  const os = nav.userAgent.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)/)?.[0] || 'Unknown'
  const lang = nav.language || 'Unknown'
  return `${browser} (${os}) — ${lang}`
}

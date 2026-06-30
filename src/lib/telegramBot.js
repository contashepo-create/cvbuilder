/**
 * Telegram Bot integration for sending payment notifications to admin
 * Uses Telegram Bot API
 */

// These should be set in .env
const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
const ADMIN_CHAT_ID = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID || ''

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

👤 <b>الاسم:</b> ${data.userName}
📧 <b>الإيميل:</b> ${data.userEmail}
📦 <b>الباقة:</b> ${data.plan}
💰 <b>طريقة الدفع:</b> ${data.paymentMethod}
🔢 <b>رقم العملية:</b> ${data.transactionRef}
📅 <b>تاريخ الدفع:</b> ${data.paymentDate}
🆔 <b>رقم الطلب:</b> <code>${data.requestId}</code>

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

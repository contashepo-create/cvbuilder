/**
 * Sanitize and normalize URLs to prevent XSS (javascript: scheme, etc.)
 * @param {string} url - Raw URL from user input
 * @returns {string|null} Safe URL or null if invalid/dangerous
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // Reject dangerous schemes
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null
  }

  // If no protocol, prepend https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'https://' + trimmed
  }

  return trimmed
}

/**
 * Escape HTML entities to prevent XSS in string interpolation
 * @param {string} str - Raw string
 * @returns {string} Escaped string
 */
export function escapeHTML(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Validate email format (English/Latin only, must have @ and .)
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  // Reject non-Latin characters (Arabic, etc.)
  if (!/^[a-zA-Z0-9@.+-_@\s]+$/.test(email)) return false
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())
}

/**
 * Validate phone number (digits, +, -, spaces, parentheses only)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false
  return /^[+]?[0-9\s\-()]{7,20}$/.test(phone.trim())
}

/**
 * Truncate text to max length safely
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(text, maxLen = 500) {
  if (!text || typeof text !== 'string') return ''
  return text.length > maxLen ? text.slice(0, maxLen) : text
}

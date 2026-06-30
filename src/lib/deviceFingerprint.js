/**
 * Device fingerprinting to detect multi-account abuse
 * Generates a unique hash from browser/device characteristics
 */

function hashString(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (hash >>> 0).toString(36)
}

/**
 * Generate a canvas fingerprint (browser-unique rendering)
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = "14px 'Arial'"
    ctx.fillStyle = '#f60'
    ctx.fillRect(0, 0, 100, 24)
    ctx.fillStyle = '#069'
    ctx.fillText('CVBuilder fingerprint test', 2, 2)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('CVBuilder fingerprint test', 4, 4)
    return canvas.toDataURL()
  } catch {
    return 'no-canvas'
  }
}

/**
 * Collect device characteristics
 */
function collectDeviceData() {
  const nav = navigator
  const screen = window.screen

  return [
    nav.userAgent || '',
    nav.language || '',
    nav.languages?.join(',') || '',
    nav.platform || '',
    nav.hardwareConcurrency?.toString() || '',
    (nav.maxTouchPoints || 0).toString(),
    screen.width + 'x' + screen.height,
    screen.colorDepth?.toString() || '',
    new Date().getTimezoneOffset().toString(),
    getCanvasFingerprint().slice(0, 100),
  ].join('|')
}

/**
 * Generate a stable device fingerprint
 */
export function getDeviceFingerprint() {
  const data = collectDeviceData()
  return hashString(data)
}

/**
 * Check if this device already has registered accounts
 * Returns { count, firstUserId, isDuplicate }
 */
export async function checkDeviceFingerprint(supabase) {
  const fingerprint = getDeviceFingerprint()

  try {
    const { data } = await supabase
      .from('device_fingerprints')
      .select('user_id, account_count')
      .eq('fingerprint', fingerprint)

    if (data && data.length > 0) {
      return {
        fingerprint,
        isDuplicate: true,
        count: data[0].account_count,
        existingUserId: data[0].user_id,
      }
    }
  } catch {
    // In demo mode or if table doesn't exist, skip
  }

  return { fingerprint, isDuplicate: false, count: 0 }
}

/**
 * Register a device fingerprint for a user
 */
export async function registerDeviceFingerprint(supabase, userId) {
  const fingerprint = getDeviceFingerprint()

  try {
    // Check if fingerprint exists
    const { data } = await supabase
      .from('device_fingerprints')
      .select('id, account_count')
      .eq('fingerprint', fingerprint)

    if (data && data.length > 0) {
      // Update account count (but DON'T link to new user)
      const newCount = (data[0].account_count || 1) + 1
      await supabase
        .from('device_fingerprints')
        .update({ account_count: newCount })
        .eq('fingerprint', fingerprint)

      return { fingerprint, isDuplicate: true, count: newCount }
    } else {
      // Insert new fingerprint
      await supabase
        .from('device_fingerprints')
        .insert({ fingerprint, user_id: userId, account_count: 1 })

      return { fingerprint, isDuplicate: false, count: 1 }
    }
  } catch {
    return { fingerprint, isDuplicate: false, count: 0 }
  }
}

/**
 * Demo mode: check localStorage for device fingerprint
 */
export function checkDeviceFingerprintLocal() {
  const fingerprint = getDeviceFingerprint()
  const key = 'device_fp_accounts'
  const stored = localStorage.getItem(key)

  try {
    const accounts = stored ? JSON.parse(stored) : []
    return {
      fingerprint,
      isDuplicate: accounts.length > 0,
      count: accounts.length,
    }
  } catch {
    return { fingerprint, isDuplicate: false, count: 0 }
  }
}

/**
 * Demo mode: register device fingerprint locally
 */
export function registerDeviceFingerprintLocal() {
  const fingerprint = getDeviceFingerprint()
  const key = 'device_fp_accounts'
  const stored = localStorage.getItem(key)

  try {
    const accounts = stored ? JSON.parse(stored) : []
    if (!accounts.includes(fingerprint)) {
      accounts.push(fingerprint)
      localStorage.setItem(key, JSON.stringify(accounts))
    }
    return { fingerprint, isDuplicate: accounts.length > 1, count: accounts.length }
  } catch {
    return { fingerprint, isDuplicate: false, count: 1 }
  }
}

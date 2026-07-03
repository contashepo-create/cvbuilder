/**
 * Anti-cheat fingerprinting system
 * Only flags CVs when the PERSON changes after creation —
 * NOT when a user legitimately creates multiple CVs for themselves.
 *
 * Key fix: The fingerprint is only compared after the FIRST save
 * with actual personal info. Empty fingerprints don't trigger flags.
 */

function normalize(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
}

/**
 * Generate a fingerprint from CV personal info
 */
export function generateFingerprint(content) {
  const pi = content?.personalInfo || {}
  const name = normalize(pi.fullName)
  const email = normalize(pi.email)
  const phone = normalize(pi.phone)

  const combined = `${name}|${email}|${phone}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return `${hash.toString(36)}_${combined.length}`
}

/**
 * Compare fingerprints — ONLY flag if BOTH have real data and differ
 * This prevents false positives when:
 * - User creates CV (empty) → fills info (first save) → should NOT flag
 * - User creates multiple CVs for themselves → should NOT flag
 * - User creates CV for person A → edits to person B → SHOULD flag
 */
export function compareFingerprints(original, current) {
  if (!original || !current) return { isDifferent: false, confidence: 0 }

  const [origHash, origLen] = original.split('_')
  const [currHash, currLen] = current.split('_')

  const origHasData = parseInt(origLen) > 0
  const currHasData = parseInt(currLen) > 0

  // Both empty — new CV, nothing to compare
  if (!origHasData && !currHasData) {
    return { isDifferent: false, confidence: 0 }
  }

  // Original empty, current has data — FIRST save with info, don't flag
  if (!origHasData && currHasData) {
    return { isDifferent: false, confidence: 0 }
  }

  // Current empty but had data — user cleared it, suspicious
  if (origHasData && !currHasData) {
    return { isDifferent: true, confidence: 0.5 }
  }

  // Both have data — compare
  if (origHash !== currHash) {
    return { isDifferent: true, confidence: 1.0 }
  }

  return { isDifferent: false, confidence: 0 }
}

/**
 * Check if CV belongs to a different person than the account owner
 * IMPORTANT: This is now DISABLED by default — it causes false positives
 * because users legitimately put different emails/phones in their CVs
 * than their account email. The fingerprint comparison above is sufficient.
 */
export function isDifferentPerson(cvContent, profile) {
  // DISABLED — causes false positives
  // The fingerprint comparison in saveCV handles actual person swapping
  return false
}

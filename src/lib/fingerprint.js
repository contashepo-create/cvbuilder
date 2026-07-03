/**
 * ANTI-CHEAT SYSTEM v2 — Practical approach
 *
 * Old problem: Comparing CV personal info with account owner info caused
 * false positives because users legitimately put different emails/phones.
 *
 * New approach:
 * 1. Server-side CV count enforcement (primary defense)
 * 2. Fingerprint only detects CV SWAPPING (person A → person B)
 * 3. No more "different person than account owner" check
 * 4. cv_creation_log tracks ALL CVs ever created (even deleted)
 */

function normalize(text) {
  if (!text || typeof text !== 'string') return ''
  return text.toLowerCase().trim().replace(/\s+/g, '').replace(/[\u064B-\u065F\u0670]/g, '')
}

/**
 * Generate a fingerprint from CV personal info
 * Only used to detect if a CV was SWAPPED to a different person
 */
export function generateFingerprint(content) {
  const pi = content?.personalInfo || {}
  const name = normalize(pi.fullName)
  // Only use name for fingerprint — email/phone legitimately vary
  const combined = name
  if (!combined) return ''

  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i)
    hash |= 0
  }
  return `${hash.toString(36)}_${combined.length}`
}

/**
 * Compare fingerprints — ONLY flags actual person swapping
 * Key rule: Empty → filled = OK (first save)
 *           Filled A → Filled B (different) = FLAG
 *           Filled A → Filled A (same) = OK
 */
export function compareFingerprints(original, current) {
  if (!original || !current) return { isDifferent: false, confidence: 0 }

  const [origHash, origLen] = original.split('_')
  const [currHash, currLen] = current.split('_')

  const origHasData = parseInt(origLen) > 0
  const currHasData = parseInt(currLen) > 0

  // Both empty — nothing to compare
  if (!origHasData && !currHasData) return { isDifferent: false, confidence: 0 }

  // Original empty, current has data — FIRST save with name, OK
  if (!origHasData && currHasData) return { isDifferent: false, confidence: 0 }

  // Current empty but had data — user cleared name, minor warning
  if (origHasData && !currHasData) return { isDifferent: true, confidence: 0.3 }

  // Both have data — compare name hash
  if (origHash !== currHash) {
    return { isDifferent: true, confidence: 1.0 }
  }

  return { isDifferent: false, confidence: 0 }
}

/**
 * DISABLED — causes false positives
 * Users legitimately create CVs with different emails/phones than their account
 */
export function isDifferentPerson(cvContent, profile) {
  return false
}

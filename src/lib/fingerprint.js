/**
 * Anti-cheat fingerprinting system
 * Generates a fingerprint from CV personal info to detect
 * when a user creates a CV for person A then edits it to person B
 * to bypass the 2-CV limit.
 */

/**
 * Normalize text for comparison: lowercase, trim, remove spaces/diacritics
 */
function normalize(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics
}

/**
 * Generate a fingerprint from CV personal info
 * Uses name + email + phone to identify the "person" the CV is for
 * @param {Object} content - CV content
 * @returns {string} fingerprint hash
 */
export function generateFingerprint(content) {
  const pi = content?.personalInfo || {}
  const name = normalize(pi.fullName)
  const email = normalize(pi.email)
  const phone = normalize(pi.phone)

  // Simple hash function (not crypto-secure, but sufficient for comparison)
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
 * Compare two fingerprints and determine if the CV has been
 * swapped to a different person
 * @param {string} original - fingerprint at creation time
 * @param {string} current - fingerprint at save time
 * @returns {{ isDifferent: boolean, confidence: number }}
 */
export function compareFingerprints(original, current) {
  if (!original || !current) return { isDifferent: false, confidence: 0 }

  // Parse fingerprints: "hash_length"
  const [origHash, origLen] = original.split('_')
  const [currHash, currLen] = current.split('_')

  // If both are essentially empty (new CV, not yet filled), don't flag
  if (parseInt(origLen) === 0 && parseInt(currLen) === 0) {
    return { isDifferent: false, confidence: 0 }
  }

  // If original was empty but now has data — could be first edit, don't flag
  if (parseInt(origLen) === 0) {
    return { isDifferent: false, confidence: 0 }
  }

  // If current is empty but had data — user cleared it, suspicious but not definitive
  if (parseInt(currLen) === 0) {
    return { isDifferent: true, confidence: 0.5 }
  }

  // Different hash = different person
  if (origHash !== currHash) {
    return { isDifferent: true, confidence: 1.0 }
  }

  return { isDifferent: false, confidence: 0 }
}

/**
 * Check if CV content represents a different person than the profile owner
 * @param {Object} cvContent - The CV content
 * @param {Object} profile - The user's profile
 * @returns {boolean} true if CV appears to be for a different person
 */
export function isDifferentPerson(cvContent, profile) {
  if (!cvContent?.personalInfo || !profile) return false

  const cvName = normalize(cvContent.personalInfo.fullName)
  const profileName = normalize(profile.full_name || profile.fullName)

  // If CV name is empty, can't determine
  if (!cvName) return false

  // If names are completely different (not just a substring)
  if (profileName && !cvName.includes(profileName) && !profileName.includes(cvName)) {
    // Check email match as secondary indicator
    const cvEmail = normalize(cvContent.personalInfo.email)
    const profileEmail = normalize(profile.email)

    // If email also differs, high confidence it's a different person
    if (cvEmail && profileEmail && cvEmail !== profileEmail) {
      return true
    }
  }

  return false
}

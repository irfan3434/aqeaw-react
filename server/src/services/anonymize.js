import crypto from 'node:crypto'

/**
 * Helpers that hide candidate identity from judges.
 *
 * - encryptRef / decryptRef: the application's type + id are AES-GCM encrypted
 *   into an opaque reference, so judges never see real database ids.
 * - candidateCode: a short stable code (e.g. "AQ-7F3A9C") judges use to refer
 *   to a candidate. Admins see the same code, so they can match them up.
 * - maskText: removes the candidate's name, email and phone from free text.
 */

function key(purpose) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET not set')
  return crypto.createHash('sha256').update(`${secret}:${purpose}`).digest()
}

export function encryptRef(type, id) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key('ref'), iv)
  const data = Buffer.concat([cipher.update(`${type === 'personal' ? 'p' : 'o'}:${id}`, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url')
}

export function decryptRef(ref) {
  try {
    const buf = Buffer.from(String(ref), 'base64url')
    if (buf.length < 29) return null
    const decipher = crypto.createDecipheriv('aes-256-gcm', key('ref'), buf.subarray(0, 12))
    decipher.setAuthTag(buf.subarray(12, 28))
    const plain = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8')
    // One-letter type keeps every ref the same length, so it can't hint at the category.
    const [raw, id] = plain.split(':')
    const type = { p: 'personal', o: 'organization' }[raw] || raw
    if ((type !== 'personal' && type !== 'organization') || !/^[a-f0-9]{24}$/.test(id)) return null
    return { type, id }
  } catch {
    return null
  }
}

export function candidateCode(id) {
  const h = crypto.createHmac('sha256', key('code')).update(String(id)).digest('hex')
  return `AQ-${h.slice(0, 6).toUpperCase()}`
}

// Name parts too common to mask on their own.
const SKIP_WORDS = new Set(['بن', 'ابن', 'بنت', 'عبد', 'آل', 'ال', 'ابو', 'أبو', 'bin', 'ibn', 'al', 'abu', 'abd', 'el'])

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Collect identifying strings from an application document. */
export function identityTerms(doc) {
  const whole = [
    doc.fullName, doc.email, doc.phone,
    doc.referrer?.fullName, doc.referrer?.email, doc.referrer?.phone,
    doc.organizationName, doc.ownerName, doc.organizationEmail, doc.organizationNumber,
  ].filter((s) => typeof s === 'string' && s.trim().length >= 3).map((s) => s.trim())

  // Individual parts of personal names (e.g. first name, family name).
  const words = [doc.fullName, doc.referrer?.fullName]
    .filter(Boolean)
    .flatMap((n) => String(n).split(/\s+/))
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !SKIP_WORDS.has(w.toLowerCase()))

  // Longest first so full names are replaced before their parts.
  return [...new Set([...whole, ...words])].sort((a, b) => b.length - a.length)
}

export function maskText(text, terms) {
  if (!text) return text
  let out = String(text)
  for (const term of terms) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(term)}(?![\\p{L}\\p{N}])`, 'giu')
    out = out.replace(re, '■■■')
  }
  return out
}

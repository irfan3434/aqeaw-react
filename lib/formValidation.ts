/**
 * Field rules for the application form.
 *
 * The form used to check only that a required field was non-empty, so "asdf"
 * passed as an email address and "abcdef" passed as a phone number — and the
 * server accepted both, because it had no format rules of its own. An
 * applicant who mistypes their email is then unreachable, which for this award
 * is the same as not having applied.
 *
 * server/src/config/validation.js mirrors these rules. A browser check is a
 * courtesy; the server's is the one that decides. Keep the two in step.
 */

/**
 * Deliberately not the full RFC 5322 grammar — that accepts addresses no mail
 * provider would route, and rejecting a real address is far worse than letting
 * an exotic one through. This asks for the shape every real address has:
 * something, @, a domain, a dot, a top-level domain of at least two letters.
 */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

/** Characters a phone number may contain. Anything else is stripped as typed. */
const PHONE_ALLOWED_RE = /[^\d+\s()\-]/g

export const MIN_AGE = 1
export const MAX_AGE = 120
export const MIN_PHONE_DIGITS = 9
export const MAX_PHONE_DIGITS = 15

export function isValidEmail(value: string): boolean {
  const v = value.trim()
  // A single address, so no commas or spaces, and nothing absurdly long.
  if (!v || v.length > 254 || /\s/.test(v)) return false
  return EMAIL_RE.test(v)
}

/**
 * What a phone field keeps as the applicant types: digits, and the separators
 * people habitually use. Letters are removed rather than flagged, so the field
 * simply cannot hold them.
 */
export function sanitizePhoneInput(value: string): string {
  return value.replace(PHONE_ALLOWED_RE, '')
}

export const phoneDigitCount = (value: string): number => (value.match(/\d/g) || []).length

export function isValidPhone(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  // A leading + is allowed for an international number, nowhere else.
  if (/\+/.test(v.slice(1))) return false
  if (PHONE_ALLOWED_RE.test(v)) return false
  const digits = phoneDigitCount(v)
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS
}

/**
 * `<input type="number">` accepts "e", "E", "+" and "-" as part of its
 * scientific-notation support, so "1e5" sits in the box looking plausible and
 * reaches the server as a number nobody intended. Only plain digits pass here.
 */
export function isValidAge(value: string): boolean {
  const v = value.trim()
  if (!/^\d{1,3}$/.test(v)) return false
  const n = Number(v)
  return n >= MIN_AGE && n <= MAX_AGE
}

/** A name needs letters; digits in one almost always mean a mistyped field. */
export function isValidName(value: string): boolean {
  const v = value.trim()
  return v.length >= 3 && !/\d/.test(v)
}

export const isFilled = (value: string): boolean => value.trim().length > 0

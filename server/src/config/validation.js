/**
 * Field rules for an incoming application.
 *
 * The browser checks these too, but a browser check is only a courtesy: the
 * form posts multipart over plain HTTP and anything can send it. Until now the
 * only rules here were Mongoose's `required`, so "asdf" was stored as an email
 * address and "abcdef" as a phone number, and the submission came back 201.
 *
 * Mirrors lib/formValidation.ts on the frontend, which deploys separately.
 * Keep the two in step.
 */
import { isValidAffiliation } from './affiliations.js'

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/
const PHONE_ALLOWED_RE = /[^\d+\s()\-]/

export const MIN_AGE = 1
export const MAX_AGE = 120
export const MIN_PHONE_DIGITS = 9
export const MAX_PHONE_DIGITS = 15

/** Multipart text fields arrive as strings, or as arrays if a name repeats. */
export const asText = (v) => (typeof v === 'string' ? v.trim() : '')

export function isValidEmail(value) {
  const v = asText(value)
  if (!v || v.length > 254 || /\s/.test(v)) return false
  return EMAIL_RE.test(v)
}

export function isValidPhone(value) {
  const v = asText(value)
  if (!v) return false
  if (/\+/.test(v.slice(1))) return false
  if (PHONE_ALLOWED_RE.test(v)) return false
  const digits = (v.match(/\d/g) || []).length
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS
}

export function isValidAge(value) {
  const v = asText(value)
  if (!/^\d{1,3}$/.test(v)) return false
  const n = Number(v)
  return n >= MIN_AGE && n <= MAX_AGE
}

export function isValidName(value) {
  const v = asText(value)
  return v.length >= 3 && !/\d/.test(v)
}

export const isFilled = (value) => asText(value).length > 0

/**
 * Check one application's fields and return the names of the bad ones.
 * The names match the posted field names, so the client can point at them.
 */
export function validateApplication(body, formType) {
  const bad = []
  const add = (field, ok) => {
    if (!ok) bad.push(field)
  }

  if (formType === 'personal') {
    add('fullName', isValidName(body.fullName))
    add('applicantAge', isValidAge(body.applicantAge))
    add('applicantGender', ['male', 'female'].includes(asText(body.applicantGender)))
    add('email', isValidEmail(body.email))
    add('phone', isValidPhone(body.phone))
    // Every individual applicant belongs to one of the two, and the award is
    // judged per affiliation, so an application without one cannot be placed.
    // It used to be gated behind a checkbox nobody ticked and was never
    // checked here at all, so most applications arrived without it.
    add('specificAffiliation', isValidAffiliation(body.specificAffiliation))

    if (asText(body.userType) === 'referral') {
      add('referrerFullName', isValidName(body.referrerFullName))
      add('referrerAge', isValidAge(body.referrerAge))
      add('referrerEmail', isValidEmail(body.referrerEmail))
      add('referrerPhone', isValidPhone(body.referrerPhone))
      add('nominationReason', isFilled(body.nominationReason))
    }
  } else {
    add('organizationName', isFilled(body.organizationName))
    add('ownerName', isFilled(body.ownerName))
    add('organizationEmail', isValidEmail(body.organizationEmail))
    add('organizationNumber', isValidPhone(body.organizationNumber))
  }

  return bad
}

/**
 * Achievements must each have a title and a description, and there is a hard
 * ceiling on how many. The form allows four; without a limit here a crafted
 * request could post thousands and have every one of them stored.
 */
export const MAX_ACHIEVEMENTS = 4

export function validateAchievements(titles, descs) {
  if (!titles.length) return 'At least one achievement is required.'
  if (titles.length > MAX_ACHIEVEMENTS) {
    return `A maximum of ${MAX_ACHIEVEMENTS} achievements is allowed.`
  }
  for (let i = 0; i < titles.length; i++) {
    if (!isFilled(titles[i])) return `Achievement ${i + 1} is missing a title.`
    if (!isFilled(descs[i])) return `Achievement ${i + 1} is missing a description.`
  }
  return null
}

'use client'

/**
 * /app/how-to-apply/page.tsx
 *
 * Next.js App Router conversion of the Shopify page_howtoapply.liquid.
 * Bilingual EN/AR via the same `content: Record<'en' | 'ar', {...}>` pattern
 * used in FAQs.tsx. All translation keys from your locales JSON are mapped to
 * fields on a typed `Content` object so usage stays type-safe (e.g. `t.heading_0`).
 *
 * Single large client component, CSS Modules, FormData POST to Heroku endpoint.
 */

import React, {
  useEffect,
  useMemo,
  useRef,
  useId,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './HowToApply.module.css'
// apiBase() strips a trailing slash and, when the configured URL is
// localhost but the page was opened from another host, retargets it there.
import { apiBase } from '../../lib/apiBase'
import {
  isValidEmail,
  isValidPhone,
  isValidAge,
  isValidName,
  isFilled,
  sanitizePhoneInput,
} from '../../lib/formValidation'
import { isValidAffiliation } from '../../lib/affiliations'

// ---------- Constants ----------
const MAX_WORDS = 400
const MAX_NOMINATION_WORDS = 100
const MAX_FILE_SIZE_MB = 4
const MAX_ACHIEVEMENTS = 4

// Message colours for the navy form background, matching the field borders.
// The previous red (#cb4028) was dark enough on #1a3f6b to read as black.
const MSG_INVALID = '#ffb3a7'
const MSG_VALID = '#8fe3ae'

// ---------- Types ----------
type FormType = 'personal' | 'organization'
type UserType = 'self' | 'referral'

interface Achievement {
  id: number          // monotonically increasing, deterministic
  title: string
  description: string
  file: File | null
  fileMessage: string
  fileMessageColor: string
}

// Module-scoped counter so IDs are stable across renders without crypto.
let achievementSeq = 0
const newAchievement = (): Achievement => ({
  id: ++achievementSeq,
  title: '',
  description: '',
  file: null,
  fileMessage: '',
  fileMessageColor: MSG_INVALID,
})





interface Content {
  heading_0: string
  heading_1: string
  heading_2: string

  org1: string
  org2: string
  org3: string

  referral_toggle_heading: string
  self_option: string
  referral_option: string

  referrer_heading: string
  referrer_name: string
  referrer_age: string
  referrer_gender: string
  referrer_email: string
  referrer_phone: string
  referrer_nomination_reason: string
  gender_male: string
  gender_female: string

  paragraph1: string
  applicant_age: string
  applicant_gender: string
  applicant_gender_male: string
  applicant_gender_female: string
  paragraph2: string
  paragraph3: string
  paragraph4: string
  paragraph5: string
  paragraph6: string
  paragraph15: string

  paragraph70: string
  paragraph71: string
  paragraph72: string
  paragraph73: string
  paragraph74: string
  paragraph8: string
  paragraph9: string
  paragraph12: string
  paragraph121: string
  paragraph122: string
  paragraph13: string
  paragraph17: string
  paragraph171: string
  paragraph18: string
  paragraph16: string // Remove

  paragraph130: string
  paragraph14: string
  nda1: string
  nda2: string

  org31: string
  org4: string
  org5: string
  org6: string
  org7: string
  org8: string
  org9: string
  org10: string
  org101: string
  org11: string
  org12: string

  // Local extras (not in your JSON but needed by the UI)
  required_field_suffix: string
  submitting: string
  err_required: string
  err_email: string
  err_phone: string
  err_age: string
  err_name: string
  err_affiliation: string
  optional_suffix: string
  nda_hint: string
  blocked_words: string
  blocked_file: string
  fix_errors: string
  alert_required: string
  alert_success: string
  alert_failure: string
}

const content: Record<'en' | 'ar', Content> = {
  en: {
    heading_0: 'Application form for the Dr. Ayed Alqarni Excellence Award',
    heading_1: 'Please fill out the form below to submit your application.',
    heading_2: 'Applicant Details',

    org1: 'Choose Form Type:',
    org2: 'Individuals',
    org3: 'Organization',

    referral_toggle_heading: 'Are you nominating yourself or are you nominating someone else?',
    self_option: 'Nominating yourself?',
    referral_option: "You're nominating someone else?",

    referrer_heading: 'Referrer Details',
    referrer_name: 'Referrer Name',
    referrer_age: 'Age (Years):',
    referrer_gender: 'Gender',
    referrer_email: 'Referrer Email',
    referrer_phone: 'Referrer Phone',
    referrer_nomination_reason: 'Reasons for nomination (100 words):',
    gender_male: 'Male',
    gender_female: 'Female',

    paragraph1: 'Full Name:',
    applicant_age: 'Age (Years)',
    applicant_gender: 'Gender:',
    applicant_gender_male: 'Male',
    applicant_gender_female: 'Female',
    paragraph2: 'Email Address:',
    paragraph3: 'Phone Number:',
    paragraph4: 'Select Affiliation:',
    paragraph5: 'Al-Saraa',
    paragraph6: 'Tahamah',
    paragraph15: 'Select Specific Affiliation:',

    paragraph70: 'Necessary Guidelines:',
    paragraph71: 'To apply, present your most notable works. A maximum of 4 works.',
    paragraph72: 'Submit each work and its attachments separately.',
    paragraph73: 'The size of the attachments for each work should not exceed 4MB.',
    paragraph74: 'The description of each work should not exceed 400 words. It should be in PDF format.',
    paragraph8: 'Title of Achievement:',
    paragraph9: 'Description of Achievement:',
    paragraph12: 'Upload Supporting Documents:',
    paragraph121: 'File size exceeded! Must be less than 4MB',
    paragraph122: 'File size:',
    paragraph13: 'Add More Achievement(s)',
    paragraph17: 'You have exceeded the limit of 400 words!',
    paragraph171: 'You have exceeded the limit of 100 words!',
    paragraph18: 'words used',
    paragraph16: 'Remove',

    paragraph130: 'I have read the Non-Disclosure Agreement (NDA)',
    paragraph14: 'Submit Application',
    nda1: 'Non-Disclosure Agreement',
    nda2: 'Close',

    org31: 'Organization Information',
    org4: 'Name of Organization',
    org5: 'Owner Name',
    org6: 'Organization Email',
    org7: 'Official Organization Number',
    org8: 'Achievements',
    org9: "Describe the organization's major achievements.",
    org10: 'Achievement Title',
    org101: 'Achievement Description (400 Words)',
    org11: 'Upload Supporting Document',
    org12: 'Add Another Achievement',

    required_field_suffix: ' (This field is required)',
    submitting: 'Submitting…',
    err_required: 'This field is required.',
    err_email: 'Enter a valid email address, for example name@example.com',
    err_phone: 'Enter a valid phone number — digits only, 9 to 15 of them. For example 0501234567',
    err_age: 'Enter an age between 1 and 120.',
    err_name: 'Enter the full name using letters only.',
    err_affiliation: 'Choose an affiliation — Al-Saraa or Tahamah.',
    optional_suffix: ' (optional)',
    nda_hint:
      'Tick this box to enable the Submit Application button. You cannot submit until you confirm you have read the agreement.',
    blocked_words: 'One of your achievement descriptions is over the word limit.',
    blocked_file: 'One of your attachments is over the size limit.',
    fix_errors: 'Please correct the highlighted fields above.',
    alert_required: 'Please fill out all required fields.',
    alert_success: 'Application submitted successfully.',
    alert_failure: 'Submission failed. Please try again.',
  },
  ar: {
    heading_0: 'نموذج التقديم على جائزة الدكتور عائض القرني للتميز',
    heading_1: 'الرجاء تعبئة النموذج أدناه لتقديم طلبك.',
    heading_2: 'بيانات المُرشَح',

    org1: 'اختر نوع التقديم',
    org2: 'أفراد',
    org3: 'كيانات (قطاعات/مؤسسات/شركات/مجموعات)',

    referral_toggle_heading: 'هل ترشح نفسك أو أنت ترشح شخص آخر؟',
    self_option: 'انت ترشح نفسك؟',
    referral_option: 'انت ترشح شخص آخر؟',

    referrer_heading: 'بيانات من قام بترشيح شخص آخر',
    referrer_name: 'اسمك الرباعي كامل',
    referrer_age: 'العمر (السنوات): ',
    referrer_gender: 'الجنس',
    referrer_email: 'البريد الإلكتروني',
    referrer_phone: 'رقم الجوال',
    referrer_nomination_reason: 'مسوغات الترشيح (100 كلمة):',
    gender_male: 'ذكر',
    gender_female: 'أنثى',

    paragraph1: 'الاسم الرباعي كامل',
    applicant_age: 'العمر (السنوات)',
    applicant_gender: 'الجنس:',
    applicant_gender_male: 'ذكر',
    applicant_gender_female: 'أنثى',
    paragraph2: 'البريد الإلكتروني',
    paragraph3: 'رقم الجوال',
    paragraph4: ':اختر الانتماء',
    paragraph5: 'السرة',
    paragraph6: 'تهامة',
    paragraph15: 'بلقرن و محافظة بلقرن',

    paragraph70: 'المبادئ التوجيهية اللازمة:',
    paragraph71: 'يحق للمترشح أن يقدم أهم أعماله المميزة، وبحد أقصى 4 أعمال فقط.',
    paragraph72: 'يتم تقديم كل عمل ومرفقاته بشكل مستقل.',
    paragraph73: 'يقدم المرشح وصف ملخص لعمله في خانة وصف الانجاز أدناه بما لا يزيد عن 400 كلمة فقط',
    paragraph74: 'المرفقات يجب أن تكون بصيغة PDF وأن لا يزيد حجم كل مرفق لكل عمل عن 4 ميجابايت',
    paragraph8: 'عنوان الإنجاز:',
    paragraph9: 'وصف الإنجاز ( 400 كلمة)',
    paragraph12: 'ارفاق المستندات',
    paragraph121: 'تم تجاوز حجم الملف! يجب أن يكون أقل من 4 ميغابايت',
    paragraph122: 'حجم الملف:',
    paragraph13: 'إضافة إنجاز(ات) أخرى',
    paragraph17: 'لقد تجاوزت الحد المسموح به وهو 400 كلمة!',
    paragraph171: 'لقد تجاوزت الحد المسموح به وهو 100 كلمة!',
    paragraph18: 'مستخدمة كلمة',
    paragraph16: 'يزيل',

    paragraph130: 'لقد قرأتُ اتفاقية عدم الإفصاح (NDA)',
    paragraph14: 'تقديم الطلب',
    nda1: 'اتفاقية عدم الإفصاح',
    nda2: 'إغلاق',

    org31: 'معلومات عن المؤسسة',
    org4: 'اسم الكيان',
    org5: 'نوع الكيان وملكيته',
    org6: 'البريد الالكتروني للكيان',
    org7: 'رقم جوال التواصل',
    org8: 'الإنجازات',
    org9: 'وصف الانجازات الرئيسية للكيان',
    org10: 'عنوان الإنجاز',
    org101: 'وصف الإنجاز ( 400 كلمة)',
    org11: 'تحميل مستند داعم',
    org12: 'إضافة إنجاز آخر',

    required_field_suffix: ' (هذا الحقل مطلوب)',
    submitting: '... جاري الإرسال',
    err_required: 'هذا الحقل مطلوب.',
    err_email: 'أدخل بريدًا إلكترونيًا صحيحًا.',
    err_phone: 'أدخل رقم جوال صحيحًا — أرقام فقط، من 9 إلى 15 رقمًا.',
    err_age: 'أدخل عمرًا بين 1 و 120.',
    err_name: 'أدخل الاسم كاملًا بالحروف فقط.',
    err_affiliation: 'اختر الانتماء — السرة أو تهامة.',
    optional_suffix: ' (اختياري)',
    nda_hint:
      'فعّل هذا المربع ليصبح زر «تقديم الطلب» متاحًا. لا يمكن إرسال الطلب قبل تأكيد قراءة الاتفاقية.',
    blocked_words: 'أحد أوصاف الإنجازات تجاوز الحد المسموح من الكلمات.',
    blocked_file: 'أحد المرفقات تجاوز الحجم المسموح.',
    fix_errors: 'الرجاء تصحيح الحقول المظللة أعلاه.',
    alert_required: 'الرجاء تعبئة جميع الحقول المطلوبة.',
    alert_success: 'تم إرسال الطلب بنجاح.',
    alert_failure: 'فشل الإرسال. حاول مرة أخرى.',
  },
}

// ---------- Helpers ----------
const countWords = (text: string) =>
  text.trim().split(/\s+/).filter((w) => w.length > 0).length

const truncateWords = (text: string, n: number) =>
  text.trim().split(/\s+/).filter((w) => w.length > 0).slice(0, n).join(' ')



export default function HowToApplyPage() {
  const { lang } = useLanguage()
  const t = content[lang]

  // ---------- State ----------
  const [formType, setFormType] = useState<FormType>('personal')
  const [userType, setUserType] = useState<UserType>('self')

  // Personal applicant
  const [fullName, setFullName] = useState('')
  const [applicantAge, setApplicantAge] = useState('')
  const [applicantGender, setApplicantGender] = useState('male')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specificAffiliation, setSpecificAffiliation] = useState('')

  // One message per field, keyed by the name it is posted under so a 400 from
  // the server can be mapped straight back onto the field that caused it.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  // Which fields the applicant has already left once. Nothing is marked wrong
  // before that, so messages never appear mid-word on a first attempt.
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  // Bumped whenever a submit is rejected, to move focus to the first bad field.
  const [errorSeq, setErrorSeq] = useState(0)

  // Referrer
  const [referrerFullName, setReferrerFullName] = useState('')
  const [referrerAge, setReferrerAge] = useState('')
  const [referrerGender, setReferrerGender] = useState('male')
  const [referrerEmail, setReferrerEmail] = useState('')
  const [referrerPhone, setReferrerPhone] = useState('')
  const [nominationReason, setNominationReason] = useState('')
  const [nominationMessage, setNominationMessage] = useState({ text: '', color: '#f7f7f7' })

  // Achievements
const [achievements, setAchievements] = useState<Achievement[]>(() => [newAchievement()])
const [orgAchievements, setOrgAchievements] = useState<Achievement[]>(() => [newAchievement()])

  // Organization
  const [organizationName, setOrganizationName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [organizationEmail, setOrganizationEmail] = useState('')
  const [organizationNumber, setOrganizationNumber] = useState('')

  // NDA + submit
  const [ndaChecked, setNdaChecked] = useState(false)
  const [ndaModalOpen, setNdaModalOpen] = useState(false)

  // ---------- Refs ----------
  const formRef = useRef<HTMLFormElement | null>(null)

  // ---------- submit ----------

  const [submitSuccess, setSubmitSuccess] = useState(false)
  // Uploading four attachments over a phone connection takes long enough that
  // an impatient applicant clicks again — and every click used to create a
  // whole application and email every judge. The ref is the guard that
  // actually holds: `disabled` depends on a re-render that a second click can
  // beat, a ref is set before this handler yields.
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)

  // ---------- Submit-button enable logic ----------
  // Only the form actually being filled in. Checking both lists meant an
  // over-long description typed into the Individuals form kept the button
  // disabled after switching to Organization — with the offending field no
  // longer on screen, and nothing saying why.
  const activeAchievements = formType === 'personal' ? achievements : orgAchievements

  const isWordCountValid = useMemo(
    () => activeAchievements.every((a) => countWords(a.description) <= MAX_WORDS),
    [activeAchievements]
  )

  const isFileSizeValid = useMemo(
    () => activeAchievements.every((a) => !a.file || a.file.size <= MAX_FILE_SIZE_MB * 1024 * 1024),
    [activeAchievements]
  )

  const isSubmitEnabled =
    ndaChecked && isWordCountValid && isFileSizeValid && !isSubmitting && !submitSuccess

  /**
   * Why the button is greyed out, in the applicant's words.
   *
   * Without this, someone who filled in the whole form and never noticed the
   * NDA tickbox sees a dead button and concludes the site is broken.
   */
  const blockedReason = !ndaChecked
    ? t.nda_hint
    : !isWordCountValid
      ? t.blocked_words
      : !isFileSizeValid
        ? t.blocked_file
        : ''

  // ---------- Per-field validation ----------
  const clearError = (name: string) =>
    setFieldErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })

  /** Store a message, or drop the entry entirely when the field is fine. */
  const setFieldError = (key: string, message: string) =>
    setFieldErrors((prev) => {
      if (!message) {
        if (!prev[key]) return prev
        const next = { ...prev }
        delete next[key]
        return next
      }
      if (prev[key] === message) return prev
      return { ...prev, [key]: message }
    })

  /**
   * One field's verdict: '' when it is fine, otherwise the message to show.
   * Every path — typing, leaving the field, submitting — asks this same
   * function, so the three can never disagree about what counts as valid.
   */
  const validateField = (key: string, value: string): string => {
    // Ahead of the generic required check: "This field is required" is poor
    // guidance for a pair of radio buttons, where naming the two choices is
    // what actually tells the applicant what to do.
    if (key === 'specificAffiliation') {
      return isValidAffiliation(value) ? '' : t.err_affiliation
    }
    if (!isFilled(value)) return t.err_required
    if (key === 'fullName' || key === 'referrerFullName') {
      return isValidName(value) ? '' : t.err_name
    }
    if (key === 'applicantAge' || key === 'referrerAge') {
      return isValidAge(value) ? '' : t.err_age
    }
    if (key === 'email' || key === 'referrerEmail' || key === 'organizationEmail') {
      return isValidEmail(value) ? '' : t.err_email
    }
    if (key === 'phone' || key === 'referrerPhone' || key === 'organizationNumber') {
      return isValidPhone(value) ? '' : t.err_phone
    }
    return ''
  }

  /**
   * Keep a field's message in step as it is typed in — but only once the
   * applicant has left it, or tried to submit. Marking an email wrong while
   * someone is still on the third character is just nagging; correcting it
   * the moment they fix it is the useful half.
   */
  const liveUpdate = (key: string, value: string) => {
    if (touched[key]) setFieldError(key, validateField(key, value))
    else clearError(key)
  }

  const markTouched = (key: string, value: string) => () => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
    setFieldError(key, validateField(key, value))
  }

  /** Visited, filled in, and passing — the state the green border means. */
  const isFieldValid = (key: string, value: string) =>
    Boolean(touched[key]) && isFilled(value) && !validateField(key, value)

  /** Which fields this form actually submits, with their current values. */
  const activeFields = (): Array<[string, string]> => {
    const out: Array<[string, string]> = []
    if (formType === 'personal') {
      if (userType === 'referral') {
        out.push(
          ['referrerFullName', referrerFullName],
          ['referrerAge', referrerAge],
          ['referrerEmail', referrerEmail],
          ['referrerPhone', referrerPhone],
          ['nominationReason', nominationReason]
        )
      }
      out.push(
        ['fullName', fullName],
        ['applicantAge', applicantAge],
        ['email', email],
        ['phone', phone]
      )
      // Always required. The award is judged per affiliation, so an
      // application without one cannot be placed in a category.
      out.push(['specificAffiliation', specificAffiliation])
    } else {
      out.push(
        ['organizationName', organizationName],
        ['ownerName', ownerName],
        ['organizationEmail', organizationEmail],
        ['organizationNumber', organizationNumber]
      )
    }
    const listKey = formType === 'personal' ? 'personal' : 'org'
    activeAchievements.forEach((a, i) => {
      out.push([`${listKey}Title${i}`, a.title], [`${listKey}Desc${i}`, a.description])
    })
    return out
  }

  const validateForm = (): Record<string, string> => {
    const e: Record<string, string> = {}
    for (const [key, value] of activeFields()) {
      const message = validateField(key, value)
      if (message) e[key] = message
    }
    return e
  }

  // ---------- Reset transient UI state on language flip ----------
  // React's documented "adjust state when a prop changes" pattern: compare
  // against the previous value during render rather than resetting in an
  // effect, which would paint the stale message once before clearing it.
  const [prevLang, setPrevLang] = useState(lang)
  if (prevLang !== lang) {
    setPrevLang(lang)
    setNominationMessage({ text: '', color: '#f7f7f7' })
    // Messages are held in the previous language; clear rather than translate.
    setFieldErrors({})
    setTouched({})
  }

  // ---------- Fade-in fieldsets via IntersectionObserver ----------
  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = formRef.current
    if (!root) return
    const fieldsets = root.querySelectorAll('fieldset')
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    fieldsets.forEach((fs) => observer.observe(fs))
    return () => observer.disconnect()
  }, [achievements.length, orgAchievements.length, formType, userType])

  // ---------- Move to the first field that needs attention ----------
  // Runs after the render that paints the messages, so the element exists.
  useEffect(() => {
    if (!errorSeq) return
    const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  }, [errorSeq])

  // ---------- Esc closes NDA modal ----------
  useEffect(() => {
    if (!ndaModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNdaModalOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ndaModalOpen])

  // ---------- Handlers ----------
  const handleNominationChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    liveUpdate('nominationReason', value)
    const wordCount = countWords(value)
    if (wordCount <= MAX_NOMINATION_WORDS) {
      setNominationReason(value)
      setNominationMessage({
        text: `${wordCount}/${MAX_NOMINATION_WORDS} ${t.paragraph18}`,
        color: MSG_VALID,
      })
    } else {
      setNominationReason(truncateWords(value, MAX_NOMINATION_WORDS))
      setNominationMessage({ text: t.paragraph171, color: MSG_INVALID })
    }
  }

const updateAchievement = (
  list: 'personal' | 'org',
  id: number,                      // was: string
  patch: Partial<Achievement>
) => {
  const setter = list === 'personal' ? setAchievements : setOrgAchievements
  setter((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
}

const removeAchievement = (list: 'personal' | 'org', id: number) => {  // was: string
  const setter = list === 'personal' ? setAchievements : setOrgAchievements
  setter((prev) => prev.filter((a) => a.id !== id))
}

  const handleDescriptionChange =
    (list: 'personal' | 'org', id: number) =>
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      const wordCount = countWords(value)
      if (wordCount <= MAX_WORDS) {
        updateAchievement(list, id, { description: value })
      } else {
        updateAchievement(list, id, { description: truncateWords(value, MAX_WORDS) })
      }
    }

  const handleFileChange =
    (list: 'personal' | 'org', id: number) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      if (!file) {
        updateAchievement(list, id, {
          file: null,
          fileMessage: '',
          fileMessageColor: MSG_INVALID,
        })
        return
      }
      const sizeMB = file.size / (1024 * 1024)
      const valid = sizeMB <= MAX_FILE_SIZE_MB
      updateAchievement(list, id, {
        file,
        // Math.round reported every file under half a megabyte as "0MB".
        fileMessage: valid
          ? `${t.paragraph122} ${
              sizeMB >= 1 ? `${sizeMB.toFixed(1)}MB` : `${Math.max(1, Math.round(file.size / 1024))}KB`
            }`
          : t.paragraph121,
        fileMessageColor: valid ? MSG_VALID : MSG_INVALID,
      })
    }

  /**
   * Phone fields keep digits and the separators people type; everything else
   * is dropped as it is typed. `type="tel"` does not restrict input at all, so
   * without this a phone number could be — and was — pure letters.
   */
  const handlePhoneChange =
    (set: (v: string) => void, key: string) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = sanitizePhoneInput(e.target.value)
      set(value)
      liveUpdate(key, value)
    }

  /**
   * `type="number"` also accepts "e", "E", "+" and "-" for scientific
   * notation, so "1e5" can sit in an age box looking like a number.
   */
  const handleAgeChange =
    (set: (v: string) => void, key: string) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 3)
      set(value)
      liveUpdate(key, value)
    }

  const handleTextChange =
    (set: (v: string) => void, key: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      set(e.target.value)
      liveUpdate(key, e.target.value)
    }

  const addAchievement = (list: 'personal' | 'org') => {
    const setter = list === 'personal' ? setAchievements : setOrgAchievements
    const current = list === 'personal' ? achievements : orgAchievements
    if (current.length >= MAX_ACHIEVEMENTS) return
    setter([...current, newAchievement()])
  }




  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = formRef.current
    if (!form) return

    // Every rule in one place, each with a message shown beside the field it
    // belongs to. What this replaces only asked whether a required box was
    // non-empty — so "asdf" passed as an email address — and then raised a
    // single alert that named no field at all.
    const errors = validateForm()
    setFieldErrors(errors)
    // From here on every field tracks itself as it is edited, so a message
    // clears the moment its field is put right rather than on the next click.
    setTouched(Object.fromEntries(activeFields().map(([key]) => [key, true])))
    if (Object.keys(errors).length) {
      setErrorSeq((n) => n + 1)
      return
    }

    // Build FormData — preserves backend contract.
    // Gender values are posted as canonical English ('male'/'female') so
    // the backend receives consistent values regardless of UI language.
    const fd = new FormData()
    fd.append('formType', formType)

    if (formType === 'personal') {
      fd.append('userType', userType)

      if (userType === 'referral') {
        fd.append('referrerFullName', referrerFullName)
        fd.append('referrerAge', referrerAge)
        fd.append('referrerGender', referrerGender)
        fd.append('referrerEmail', referrerEmail)
        fd.append('referrerPhone', referrerPhone)
        fd.append('nominationReason', nominationReason)
      }

      fd.append('fullName', fullName)
      fd.append('applicantAge', applicantAge)
      fd.append('applicantGender', applicantGender)
      fd.append('email', email)
      fd.append('phone', phone)
      // tribeCheckbox is vestigial — the checkbox was removed when choosing an
      // affiliation became compulsory. Still posted as 'on' so that a server
      // build older than this one keeps filling its "Tribe Checked" column
      // correctly; newer builds derive it from the affiliation instead.
      fd.append('tribeCheckbox', 'on')
      fd.append('specificAffiliation', specificAffiliation)

      // uploadIndex[] names the achievement each file belongs to. Without it
      // the server can only pair them by position, and since a file is sent
      // only for the achievements that have one, attaching a document to the
      // second achievement stored it against the first.
      achievements.forEach((a, i) => {
        fd.append('achievementTitle[]', a.title)
        fd.append('description[]', a.description)
        if (a.file) {
          fd.append('upload[]', a.file)
          fd.append('uploadIndex[]', String(i))
        }
      })
    } else {
      fd.append('organizationName', organizationName)
      fd.append('ownerName', ownerName)
      fd.append('organizationEmail', organizationEmail)
      fd.append('organizationNumber', organizationNumber)

      orgAchievements.forEach((a, i) => {
        fd.append('achievementTitleOrg[]', a.title)
        fd.append('descriptionOrg[]', a.description)
        if (a.file) {
          fd.append('uploadOrg[]', a.file)
          fd.append('uploadIndexOrg[]', String(i))
        }
      })
    }

    // A second click while the first upload is still in flight used to create
    // a second application and a second round of judge emails.
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)

    try {
      const res = await fetch(`${apiBase()}/submit-application`, { method: 'POST', body: fd })
      if (res.ok) {
        setSubmitSuccess(true)
        return
      }
      // The API says what's actually wrong — a file over the size limit, an
      // unsupported type, a missing field. Showing that beats a generic
      // "try again", which an applicant can only act on by guessing.
      let reason = ''
      let badFields: string[] = []
      try {
        const data = (await res.json()) as { error?: unknown; fields?: unknown }
        if (typeof data.error === 'string') reason = data.error
        if (Array.isArray(data.fields)) {
          badFields = data.fields.filter((f): f is string => typeof f === 'string')
        }
      } catch {
        /* not JSON (a proxy or gateway error) — fall back to the generic text */
      }
      console.error('Submit failed:', res.status, reason)

      // A 400 from the API names the fields it rejected. Mark those instead of
      // showing a sentence the applicant has no way to act on.
      if (badFields.length) {
        const msgFor = (f: string) => {
          if (['email', 'referrerEmail', 'organizationEmail'].includes(f)) return t.err_email
          if (['phone', 'referrerPhone', 'organizationNumber'].includes(f)) return t.err_phone
          if (['applicantAge', 'referrerAge'].includes(f)) return t.err_age
          if (['fullName', 'referrerFullName'].includes(f)) return t.err_name
          return t.err_required
        }
        setFieldErrors(Object.fromEntries(badFields.map((f) => [f, msgFor(f)])))
        setErrorSeq((n) => n + 1)
        return
      }
      alert(reason || `${t.alert_failure} (${res.status})`)
    } catch (err) {
      // Network failure, CORS, offline — nothing specific worth showing.
      console.error(err)
      alert(t.alert_failure)
    } finally {
      // Always released, so a failed attempt can be retried. On success the
      // button stays disabled anyway, via submitSuccess.
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  // ---------- Field error rendering ----------
  /**
   * Validation state for one field: the blur handler that starts live
   * checking, plus the red or green border. The border follows our own rule,
   * not the browser's — `type="email"` considers "a@b" perfectly valid, so
   * native styling would show green for an address we go on to reject.
   */
  const fieldProps = (key: string, value: string) => {
    const message = fieldErrors[key]
    return {
      onBlur: markTouched(key, value),
      ...(message
        ? {
            'aria-invalid': true as const,
            'aria-describedby': `${key}-error`,
            className: styles.inputError,
          }
        : isFieldValid(key, value)
          ? { className: styles.inputValid }
          : {}),
    }
  }

  const errorText = (key: string) =>
    fieldErrors[key] ? (
      <p className={styles.fieldError} id={`${key}-error`} role="alert">
        {fieldErrors[key]}
      </p>
    ) : null

  const reactId = useId();
  // ---------- Achievements block (shared between personal & org) ----------
  const renderAchievementsBlock = (
    list: 'personal' | 'org',
    items: Achievement[],
    cfg: {
      heading: string
      bullets: string[]
      titleLabel: string
      descLabel: string
      uploadLabel: string
      addBtn: string
    }
  ) => {
    const atMax = items.length >= MAX_ACHIEVEMENTS
    return (
      <>
        {items.map((a, idx) => {
          const fieldId = `${reactId}-${list}-${idx}`  
          const wc = countWords(a.description)
          const wcOver = wc > MAX_WORDS
          return (
            <fieldset key={a.id} className={styles.achievementFieldset}>
              <h2 className={styles.guidelineHeading}>{cfg.heading}</h2>
              <ul className={styles.guidelinesList}>
                {cfg.bullets.map((b, i) => (
                  <li key={i} className={styles.guidelineText}>{b}</li>
                ))}
              </ul>

              <label htmlFor={`title-${fieldId}`}>{cfg.titleLabel}</label>
              <input
                type="text"
                id={`title-${fieldId}`}
                name={list === 'personal' ? 'achievementTitle[]' : 'achievementTitleOrg[]'}
                value={a.title}
                onChange={(e) => {
                  updateAchievement(list, a.id, { title: e.target.value })
                  liveUpdate(`${list}Title${idx}`, e.target.value)
                }}
                required
                {...fieldProps(`${list}Title${idx}`, a.title)}
              />
              {errorText(`${list}Title${idx}`)}

              <label htmlFor={`desc-${fieldId}`}>{cfg.descLabel}</label>
              <textarea
                id={`desc-${fieldId}`}
                name={list === 'personal' ? 'description[]' : 'descriptionOrg[]'}
                rows={5}
                value={a.description}
                onChange={(e) => {
                  handleDescriptionChange(list, a.id)(e)
                  liveUpdate(`${list}Desc${idx}`, e.target.value)
                }}
                required
                {...fieldProps(`${list}Desc${idx}`, a.description)}
              />
              {errorText(`${list}Desc${idx}`)}
              <p
                className={styles.wordCountMessage}
                style={{ color: wcOver ? MSG_INVALID : MSG_VALID }}
              >
                {wcOver ? t.paragraph17 : `${wc}/${MAX_WORDS} ${t.paragraph18}`}
              </p>

              <label htmlFor={`upload-${fieldId}`}>
                {cfg.uploadLabel}
                <span className={styles.optionalTag}>{t.optional_suffix}</span>
              </label>
              <div className={styles.fileSizeMessage} style={{ color: a.fileMessageColor }}>
                {a.fileMessage}
              </div>
              <input
                type="file"
                id={`upload-${fieldId}`}
                name={list === 'personal' ? 'upload[]' : 'uploadOrg[]'}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange(list, a.id)}
                /* The attachment is optional, so there is no "required" state
                   to show — only whether the chosen file is within the limit. */
                className={
                  a.file
                    ? a.file.size <= MAX_FILE_SIZE_MB * 1024 * 1024
                      ? styles.inputValid
                      : styles.inputError
                    : undefined
                }
                aria-invalid={a.file ? a.file.size > MAX_FILE_SIZE_MB * 1024 * 1024 : undefined}
              />

              {idx > 0 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeAchievement(list, a.id)}
                >
                  {t.paragraph16}
                </button>
              )}
            </fieldset>
          )
        })}

        <button
          type="button"
          id={list === 'personal' ? 'addAchievementButton' : 'addAchievementButtonOrg'}
          className={`${styles.addAchievementButton} ${atMax ? styles.addBtnDisabled : ''}`}
          disabled={atMax}
          onClick={() => addAchievement(list)}
        >
          {cfg.addBtn}
        </button>
      </>
    )
  }

  // ---------- Render ----------
  return (
    <>
      {/* NDA Modal */}
      {ndaModalOpen && (
        <div
          className={styles.ndaModal}
          style={{ display: 'block' }}
          aria-hidden={!ndaModalOpen}
          role="dialog"
        >
          <div className={styles.ndaModalContent}>
            <h2>{t.nda1}</h2>
            <div className={styles.ndaContent}>
              <iframe
                src="/images/NDA.pdf"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="NDA Document"
              />
            </div>
            <button
              type="button"
              className={styles.ndaCloseBtn}
              onClick={() => setNdaModalOpen(false)}
            >
              {t.nda2}
            </button>
          </div>
        </div>
      )}

      <div className={styles.applyForm}>
        <h1>{t.heading_0}</h1>
        <p>{t.heading_1}</p>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          noValidate
        >
          {/* Form Type Selection */}
          <div className={styles.formSelection}>
            <label htmlFor="formType">{t.org1}</label>
            <select
              id="formType"
              name="formType"
              className={styles.formTypeSelect}
              value={formType}
              onChange={(e) => setFormType(e.target.value as FormType)}
            >
              <option value="personal">{t.org2}</option>
              <option value="organization">{t.org3}</option>
            </select>
          </div>

          {/* ===== Personal Form Section ===== */}
          {formType === 'personal' && (
            <div id="personalForm" className="form-section">
              {/* Self vs Referral */}
              <fieldset>
                <legend>{t.referral_toggle_heading}</legend>

                <div className={styles.checkSection}>
                  <input
                    className={styles.checkSectionRadio}
                    type="radio"
                    name="userType"
                    value="self"
                    checked={userType === 'self'}
                    onChange={() => setUserType('self')}
                  />
                  <p className={styles.checkSectionParagraph}>{t.self_option}</p>
                </div>

                <div className={styles.checkSection}>
                  <input
                    className={styles.checkSectionRadio}
                    type="radio"
                    name="userType"
                    value="referral"
                    checked={userType === 'referral'}
                    onChange={() => setUserType('referral')}
                  />
                  <p className={styles.checkSectionParagraph}>{t.referral_option}</p>
                </div>
              </fieldset>

              {/* Referrer Information */}
              <fieldset
                className={`${styles.referrerInfo} ${userType === 'referral' ? 'visible' : ''}`}
                style={{ display: userType === 'referral' ? 'block' : 'none' }}
              >
                <legend>{t.referrer_heading}</legend>

                <label htmlFor="referrerFullName">{t.referrer_name}</label>
                <input
                  type="text"
                  id="referrerFullName"
                  name="referrerFullName"
                  autoComplete="name"
                  value={referrerFullName}
                  onChange={handleTextChange(setReferrerFullName, 'referrerFullName')}
                  required={userType === 'referral'}
                  {...fieldProps('referrerFullName', referrerFullName)}
                />
                {errorText('referrerFullName')}

                <label htmlFor="referrerAge">{t.referrer_age}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  id="referrerAge"
                  name="referrerAge"
                  value={referrerAge}
                  onChange={handleAgeChange(setReferrerAge, 'referrerAge')}
                  required={userType === 'referral'}
                  {...fieldProps('referrerAge', referrerAge)}
                />
                {errorText('referrerAge')}

                <label htmlFor="referrerGender">{t.referrer_gender}</label>
                <select
                  id="referrerGender"
                  name="referrerGender"
                  value={referrerGender}
                  onChange={(e) => setReferrerGender(e.target.value)}
                >
                  <option value="male">{t.gender_male}</option>
                  <option value="female">{t.gender_female}</option>
                </select>

                <label htmlFor="referrerEmail">{t.referrer_email}</label>
                <input
                  type="email"
                  inputMode="email"
                  id="referrerEmail"
                  name="referrerEmail"
                  value={referrerEmail}
                  onChange={handleTextChange(setReferrerEmail, 'referrerEmail')}
                  required={userType === 'referral'}
                  {...fieldProps('referrerEmail', referrerEmail)}
                />
                {errorText('referrerEmail')}

                <label htmlFor="referrerPhone">{t.referrer_phone}</label>
                <input
                  type="tel"
                  inputMode="tel"
                  id="referrerPhone"
                  name="referrerPhone"
                  value={referrerPhone}
                  onChange={handlePhoneChange(setReferrerPhone, 'referrerPhone')}
                  required={userType === 'referral'}
                  {...fieldProps('referrerPhone', referrerPhone)}
                />
                {errorText('referrerPhone')}

                <label htmlFor="nominationreason">{t.referrer_nomination_reason}</label>
                <textarea
                  id="nominationreason"
                  name="nominationReason"
                  value={nominationReason}
                  onChange={handleNominationChange}
                  required={userType === 'referral'}
                  {...fieldProps('nominationReason', nominationReason)}
                />
                {errorText('nominationReason')}
                <p
                  className={styles.wordCountMessage}
                  style={{ color: nominationMessage.color }}
                >
                  {nominationMessage.text || `0/${MAX_NOMINATION_WORDS} ${t.paragraph18}`}
                </p>
              </fieldset>

              {/* Personal Information */}
              <fieldset>
                <legend>{t.heading_2}</legend>

                <label htmlFor="fullName">{t.paragraph1}</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={handleTextChange(setFullName, 'fullName')}
                  required
                  {...fieldProps('fullName', fullName)}
                />
                {errorText('fullName')}

                <label htmlFor="applicantAge">{t.applicant_age}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  id="applicantAge"
                  name="applicantAge"
                  value={applicantAge}
                  onChange={handleAgeChange(setApplicantAge, 'applicantAge')}
                  required
                  {...fieldProps('applicantAge', applicantAge)}
                />
                {errorText('applicantAge')}

                <label htmlFor="applicantGender">{t.applicant_gender}</label>
                <select
                  id="applicantGender"
                  name="applicantGender"
                  value={applicantGender}
                  onChange={(e) => setApplicantGender(e.target.value)}
                >
                  <option value="male">{t.applicant_gender_male}</option>
                  <option value="female">{t.applicant_gender_female}</option>
                </select>

                <label htmlFor="email">{t.paragraph2}</label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleTextChange(setEmail, 'email')}
                  required
                  {...fieldProps('email', email)}
                />
                {errorText('email')}

                <label htmlFor="phone">{t.paragraph3}</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={handlePhoneChange(setPhone, 'phone')}
                  required
                  {...fieldProps('phone', phone)}
                />
                {errorText('phone')}

                {/*
                  These two used to sit behind a checkbox labelled "Select
                  Affiliation:". Applicants read that as the label of the thing
                  itself rather than a control to act on, left it untouched, and
                  the options never appeared — so most applications arrived with
                  no affiliation at all and were accepted anyway. The checkbox
                  is gone; the choice is now always on screen and required.
                */}
                {/*
                  A div with role="radiogroup" rather than a nested fieldset:
                  .applyForm fieldset starts at opacity 0 and is only revealed
                  when an IntersectionObserver adds .visible, and a field that
                  must be filled in should not depend on that to be seen.
                */}
                <div
                  className={styles.affiliationGroup}
                  role="radiogroup"
                  aria-labelledby="affiliation-label"
                  aria-describedby={
                    fieldErrors.specificAffiliation ? 'specificAffiliation-error' : undefined
                  }
                >
                  {/* The label only changes colour; the message itself is
                      rendered once, below the options, as every other field
                      in this form does it. */}
                  <p
                    id="affiliation-label"
                    className={`${styles.affiliationLabel} ${
                      fieldErrors.specificAffiliation ? styles.affiliationLabelInvalid : ''
                    }`}
                  >
                    {t.paragraph4}
                  </p>

                  <div className={styles.radioOptions}>
                    {/*
                      The value posted is the stable code, not the label being
                      read. Posting the label stored 'Al-Saraa' for an English
                      visitor and 'محافظة بلقرن والسراة' for an Arabic one — the
                      same affiliation under two names. It also meant switching
                      language silently cleared the applicant's choice, because
                      the checked test compared against the new translation.
                    */}
                    <label htmlFor="alSraa">
                      <input
                        type="radio"
                        id="alSraa"
                        name="specificAffiliation"
                        value="alsaraa"
                        checked={specificAffiliation === 'alsaraa'}
                        onChange={(e) => {
                          setSpecificAffiliation(e.target.value)
                          liveUpdate('specificAffiliation', e.target.value)
                        }}
                        required
                      />
                      {t.paragraph5}
                    </label>
                    <label htmlFor="tahamah">
                      <input
                        type="radio"
                        id="tahamah"
                        name="specificAffiliation"
                        value="tahamah"
                        checked={specificAffiliation === 'tahamah'}
                        onChange={(e) => {
                          setSpecificAffiliation(e.target.value)
                          liveUpdate('specificAffiliation', e.target.value)
                        }}
                        required
                      />
                      {t.paragraph6}
                    </label>
                  </div>

                  {errorText('specificAffiliation')}
                </div>
              </fieldset>

              {/* Achievements */}
              <div id="achievements-container">
                {renderAchievementsBlock('personal', achievements, {
                  heading: t.paragraph70,
                  bullets: [t.paragraph71, t.paragraph72, t.paragraph73, t.paragraph74],
                  titleLabel: t.paragraph8,
                  descLabel: t.paragraph9,
                  uploadLabel: t.paragraph12,
                  addBtn: t.paragraph13,
                })}
              </div>
            </div>
          )}

          {/* ===== Organization Form Section ===== */}
          {formType === 'organization' && (
            <div id="organizationForm" className="form-section">
              <fieldset>
                <legend>{t.org31}</legend>

                <label htmlFor="organizationName">{t.org4}</label>
                <input
                  type="text"
                  id="organizationName"
                  name="organizationName"
                  value={organizationName}
                  onChange={handleTextChange(setOrganizationName, 'organizationName')}
                  required
                  {...fieldProps('organizationName', organizationName)}
                />
                {errorText('organizationName')}

                <label htmlFor="ownerName">{t.org5}</label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={ownerName}
                  onChange={handleTextChange(setOwnerName, 'ownerName')}
                  required
                  {...fieldProps('ownerName', ownerName)}
                />
                {errorText('ownerName')}

                <label htmlFor="organizationEmail">{t.org6}</label>
                <input
                  type="email"
                  inputMode="email"
                  id="organizationEmail"
                  name="organizationEmail"
                  value={organizationEmail}
                  onChange={handleTextChange(setOrganizationEmail, 'organizationEmail')}
                  required
                  {...fieldProps('organizationEmail', organizationEmail)}
                />
                {errorText('organizationEmail')}

                <label htmlFor="organizationNumber">{t.org7}</label>
                <input
                  type="tel"
                  inputMode="tel"
                  id="organizationNumber"
                  name="organizationNumber"
                  value={organizationNumber}
                  onChange={handlePhoneChange(setOrganizationNumber, 'organizationNumber')}
                  required
                  {...fieldProps('organizationNumber', organizationNumber)}
                />
                {errorText('organizationNumber')}
              </fieldset>

              <div id="organization-achievements-container">
                {renderAchievementsBlock('org', orgAchievements, {
                  heading: t.org8,
                  bullets: [t.org9],
                  titleLabel: t.org10,
                  descLabel: t.org101,
                  uploadLabel: t.org11,
                  addBtn: t.org12,
                })}
              </div>
            </div>
          )}

          {/* NDA Section */}
          <div className={styles.ndaSection}>
            <input
              type="checkbox"
              id="nda-checkbox"
              className={styles.ndaCheckbox}
              checked={ndaChecked}
              onChange={(e) => setNdaChecked(e.target.checked)}
            />
            <a
              href="#"
              id="nda-link"
              className={styles.ndaLink}
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault()
                setNdaModalOpen(true)
              }}
            >
              {t.paragraph130}
            </a>
          </div>

          {/*
            Why the button is greyed out, said plainly and next to it.
            An applicant who filled in the whole form and never noticed the
            tickbox above had nothing to go on but a dead button, and
            reasonably concluded the site was broken.
          */}
          {blockedReason && !submitSuccess && (
            <p className={styles.submitHint} id="submit-hint" role="status">
              {blockedReason}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="submit-btn"
            className={styles.submitBtn}
            disabled={!isSubmitEnabled}
            aria-busy={isSubmitting}
            aria-describedby={blockedReason ? 'submit-hint' : undefined}
            style={{
              backgroundColor: isSubmitEnabled ? '#28a745' : '#ccc',
              cursor: isSubmitEnabled ? 'pointer' : 'not-allowed',
            }}
          >
            {isSubmitting ? t.submitting : t.paragraph14}
          </button>

          {Object.keys(fieldErrors).length > 0 && (
            <p className={styles.submitHint} role="status">
              {t.fix_errors}
            </p>
          )}
        </form>
      </div>
      {submitSuccess && (
         <div className={styles.successOverlay} role="dialog" aria-modal="true">
         <div className={styles.successModal}>
         <div className={styles.successIcon} aria-hidden="true">
        <svg viewBox="0 0 52 52" width="64" height="64">
          <circle cx="26" cy="26" r="25" fill="none" stroke="#c4a21e" strokeWidth="2" />
          <path
            fill="none"
            stroke="#c4a21e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27l7 7 17-17"
          />
        </svg>
      </div>
      <h2 className={styles.successTitle}>
        {lang === 'ar' ? 'تم إرسال الطلب بنجاح!' : 'Application Submitted Successfully!'}
      </h2>
      <p className={styles.successMessage}>
        {lang === 'ar'
          ? 'تم استلام طلبك. سيتم إعادة تحميل الصفحة.'
          : 'Your application has been received. The page will reload.'}
      </p>
      <button
        type="button"
        className={styles.successOkBtn}
        onClick={() => window.location.reload()}
        autoFocus
      >
        {lang === 'ar' ? 'موافق' : 'OK'}
      </button>
    </div>

    
  </div>
)}
    </>
  )
}
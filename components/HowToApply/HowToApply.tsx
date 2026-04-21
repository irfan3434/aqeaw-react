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

// ---------- Constants ----------
const MAX_WORDS = 400
const MAX_NOMINATION_WORDS = 100
const MAX_FILE_SIZE_MB = 4
const MAX_ACHIEVEMENTS = 4
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const SUBMIT_URL = `${API_BASE}/submit-application`

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
  fileMessageColor: '#cb4028',
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
    paragraph5: 'محافظة بلقرن والسراة',
    paragraph6: 'تهامة',
    paragraph15: '',

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
  const [tribeChecked, setTribeChecked] = useState(false)
  const [specificAffiliation, setSpecificAffiliation] = useState('')
  const [affiliationError, setAffiliationError] = useState(false)

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

  // ---------- Submit-button enable logic ----------
  const isWordCountValid = useMemo(() => {
    const all = [...achievements, ...orgAchievements]
    return all.every((a) => countWords(a.description) <= MAX_WORDS)
  }, [achievements, orgAchievements])

  const isFileSizeValid = useMemo(() => {
    const all = [...achievements, ...orgAchievements]
    return all.every((a) => !a.file || a.file.size <= MAX_FILE_SIZE_MB * 1024 * 1024)
  }, [achievements, orgAchievements])

  const isSubmitEnabled = ndaChecked && isWordCountValid && isFileSizeValid

  // ---------- Reset transient UI state on language flip ----------
  useEffect(() => {
    setNominationMessage({ text: '', color: '#f7f7f7' })
    setAffiliationError(false)
  }, [lang])

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
    const wordCount = countWords(value)
    if (wordCount <= MAX_NOMINATION_WORDS) {
      setNominationReason(value)
      setNominationMessage({
        text: `${wordCount}/${MAX_NOMINATION_WORDS} ${t.paragraph18}`,
        color: '#25ad25',
      })
    } else {
      setNominationReason(truncateWords(value, MAX_NOMINATION_WORDS))
      setNominationMessage({ text: t.paragraph171, color: '#cb4028' })
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
          fileMessageColor: '#cb4028',
        })
        return
      }
      const sizeMB = file.size / (1024 * 1024)
      const valid = sizeMB <= MAX_FILE_SIZE_MB
      updateAchievement(list, id, {
        file,
        fileMessage: valid ? `${t.paragraph122} ${Math.round(sizeMB)}MB` : t.paragraph121,
        fileMessageColor: valid ? '#25ad25' : '#cb4028',
      })
    }

  const addAchievement = (list: 'personal' | 'org') => {
    const setter = list === 'personal' ? setAchievements : setOrgAchievements
    const current = list === 'personal' ? achievements : orgAchievements
    if (current.length >= MAX_ACHIEVEMENTS) return
    setter([...current, newAchievement()])
  }



  const handleTribeToggle = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setTribeChecked(checked)
    if (!checked) {
      setSpecificAffiliation('')
      setAffiliationError(false)
    }
  }

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (formType === 'personal' && tribeChecked && !specificAffiliation) {
      setAffiliationError(true)
      return
    }

    const form = formRef.current
    if (!form) return
    const requiredFields = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        '[required]'
      )
    )
    let firstInvalid: HTMLElement | null = null
    let allValid = true
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = 'red'
        allValid = false
        if (!firstInvalid) firstInvalid = field
      } else {
        field.style.borderColor = '#ddd'
      }
    })
    if (!allValid) {
      ;(firstInvalid as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      alert(t.alert_required)
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
      fd.append('tribeCheckbox', tribeChecked ? 'on' : '')
      if (tribeChecked && specificAffiliation) {
        fd.append('specificAffiliation', specificAffiliation)
      }

      achievements.forEach((a) => {
        fd.append('achievementTitle[]', a.title)
        fd.append('description[]', a.description)
        if (a.file) fd.append('upload[]', a.file)
      })
    } else {
      fd.append('organizationName', organizationName)
      fd.append('ownerName', ownerName)
      fd.append('organizationEmail', organizationEmail)
      fd.append('organizationNumber', organizationNumber)

      orgAchievements.forEach((a) => {
        fd.append('achievementTitleOrg[]', a.title)
        fd.append('descriptionOrg[]', a.description)
        if (a.file) fd.append('uploadOrg[]', a.file)
      })
    }

    try {
          const res = await fetch(SUBMIT_URL, { method: 'POST', body: fd })
          if (!res.ok) throw new Error(`Submit failed: ${res.status}`)
          setSubmitSuccess(true)
        } catch (err) {
               console.error(err)
               alert(t.alert_failure)
        }
  }

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
                onChange={(e) => updateAchievement(list, a.id, { title: e.target.value })}
                required
              />

              <label htmlFor={`desc-${fieldId}`}>{cfg.descLabel}</label>
              <textarea
                id={`desc-${fieldId}`}
                name={list === 'personal' ? 'description[]' : 'descriptionOrg[]'}
                rows={5}
                value={a.description}
                onChange={handleDescriptionChange(list, a.id)}
                required
              />
              <p
                className={styles.wordCountMessage}
                style={{ color: wcOver ? '#cb4028' : '#25ad25' }}
              >
                {wcOver ? t.paragraph17 : `${wc}/${MAX_WORDS} ${t.paragraph18}`}
              </p>

              <label htmlFor={`upload-${fieldId}`}>{cfg.uploadLabel}</label>
              <div className={styles.fileSizeMessage} style={{ color: a.fileMessageColor }}>
                {a.fileMessage}
              </div>
              <input
                type="file"
                id={`upload-${fieldId}`}
                name={list === 'personal' ? 'upload[]' : 'uploadOrg[]'}
                accept=".pdf,.doc,.jpg,.png"
                onChange={handleFileChange(list, a.id)}
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
                  value={referrerFullName}
                  onChange={(e) => setReferrerFullName(e.target.value)}
                  required={userType === 'referral'}
                />

                <label htmlFor="referrerAge">{t.referrer_age}</label>
                <input
                  type="number"
                  id="referrerAge"
                  name="referrerAge"
                  min={0}
                  max={120}
                  value={referrerAge}
                  onChange={(e) => setReferrerAge(e.target.value)}
                  required={userType === 'referral'}
                />

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
                  id="referrerEmail"
                  name="referrerEmail"
                  value={referrerEmail}
                  onChange={(e) => setReferrerEmail(e.target.value)}
                  required={userType === 'referral'}
                />

                <label htmlFor="referrerPhone">{t.referrer_phone}</label>
                <input
                  type="tel"
                  id="referrerPhone"
                  name="referrerPhone"
                  value={referrerPhone}
                  onChange={(e) => setReferrerPhone(e.target.value)}
                  required={userType === 'referral'}
                />

                <label htmlFor="nominationreason">{t.referrer_nomination_reason}</label>
                <textarea
                  id="nominationreason"
                  name="nominationReason"
                  value={nominationReason}
                  onChange={handleNominationChange}
                  required={userType === 'referral'}
                />
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <label htmlFor="applicantAge">{t.applicant_age}</label>
                <input
                  type="number"
                  id="applicantAge"
                  name="applicantAge"
                  min={0}
                  max={120}
                  value={applicantAge}
                  onChange={(e) => setApplicantAge(e.target.value)}
                  required
                />

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
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label htmlFor="phone">{t.paragraph3}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                <div className={styles.tribalSection}>
                  <label htmlFor="tribeCheckbox" className={styles.tribeCheckboxLabel}>
                    {t.paragraph4}
                  </label>
                  <input
                    type="checkbox"
                    id="tribeCheckbox"
                    name="tribeCheckbox"
                    className={styles.tribeCheckbox}
                    checked={tribeChecked}
                    onChange={handleTribeToggle}
                  />
                </div>

                {tribeChecked && (
                  <div
                    className={styles.radioOptions}
                    style={{ marginTop: 10, marginLeft: 20 }}
                  >
                    <p style={{ color: affiliationError ? '#cb4028' : undefined }}>
                      {t.paragraph15}
                      {affiliationError && t.required_field_suffix}
                    </p>
                    <label htmlFor="alSraa">
                      <input
                        type="radio"
                        id="alSraa"
                        name="specificAffiliation"
                        value={t.paragraph5}
                        checked={specificAffiliation === t.paragraph5}
                        onChange={(e) => {
                          setSpecificAffiliation(e.target.value)
                          setAffiliationError(false)
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
                        value={t.paragraph6}
                        checked={specificAffiliation === t.paragraph6}
                        onChange={(e) => {
                          setSpecificAffiliation(e.target.value)
                          setAffiliationError(false)
                        }}
                        required
                      />
                      {t.paragraph6}
                    </label>
                  </div>
                )}
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
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />

                <label htmlFor="ownerName">{t.org5}</label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />

                <label htmlFor="organizationEmail">{t.org6}</label>
                <input
                  type="email"
                  id="organizationEmail"
                  name="organizationEmail"
                  value={organizationEmail}
                  onChange={(e) => setOrganizationEmail(e.target.value)}
                  required
                />

                <label htmlFor="organizationNumber">{t.org7}</label>
                <input
                  type="tel"
                  id="organizationNumber"
                  name="organizationNumber"
                  value={organizationNumber}
                  onChange={(e) => setOrganizationNumber(e.target.value)}
                  required
                />
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

          {/* Submit */}
          <button
            type="submit"
            id="submit-btn"
            className={styles.submitBtn}
            disabled={!isSubmitEnabled}
            style={{
              backgroundColor: isSubmitEnabled ? '#28a745' : '#ccc',
              cursor: isSubmitEnabled ? 'pointer' : 'not-allowed',
            }}
          >
            {t.paragraph14}
          </button>
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
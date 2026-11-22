'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './ContactUs.module.css'
import { apiBase } from '../../lib/apiBase'
import { isValidEmail, isValidName, isFilled } from '../../lib/formValidation'

const MIN_MESSAGE = 10

const content = {
  en: {
    heading1: 'Contact Us',
    paragraph1: 'For all inquiries, nominations, and updates related to the Dr. Ayed Alqarni Prize for Excellence, please use the contact details below.',
    heading2: 'Email',
    paragraph2: 'info@aqeaw.com',
    heading3: 'Phone',
    paragraph3: '0553181715',
    heading4: 'Award Leadership',
    paragraph4: 'Dr. Ayed Alqarni – Award Patron and General Supervisor',
    paragraph5: 'Mr. Ayed bin Saeed – Secretary-General',
    heading5: 'Stay Connected',
    paragraph6: 'Reach out to us anytime for support, guidance, or general questions about the award. Whether you\'re an applicant, nominee, or partner, we are here to assist you.',
    paragraph7: 'Your Name',
    paragraph8: 'Your Email',
    paragraph9: 'Your Message',
    paragraph10: 'Send Message',
    placeholder1: 'Enter your name',
    placeholder2: 'Enter your email',
    placeholder3: 'Write your message',
    successMsg: (name: string) => `Thank you, ${name}. Your message has been sent successfully!`,
    errorMsg: 'Please correct the highlighted fields before submitting.',
    err_required: 'This field is required.',
    err_name: 'Enter your name using letters only.',
    err_email: 'Enter a valid email address, for example name@example.com',
    err_message: `Please write a little more — at least ${MIN_MESSAGE} characters.`,
    sending: 'Sending…',
    sendFailed: 'Your message could not be sent. Please try again, or email us at info@aqeaw.com',
  },
  ar: {
    heading1: 'اتصل بنا',
    paragraph1: 'لجميع الاستفسارات والترشيحات والتحديثات المتعلقة بجائزة الدكتور عائض القرني للتميز، يرجى استخدام تفاصيل الاتصال أدناه',
    heading2: 'بريد إلكتروني',
    paragraph2: 'info@aqeaw.com',
    heading3: 'رقم الجوال',
    paragraph3: '٠٥٥٣١٨١٧١٥',
    heading4: 'قيادة الجائزة',
    paragraph4: 'الدكتور عائض القرني – راعي الجائزة والمشرف العام',
    paragraph5: 'الأستاذ عائض بن سعيد – الأمين العام',
    heading5: 'ابقَ على تواصل',
    paragraph6: 'تواصل معنا في أي وقت للحصول على الدعم أو الإرشاد أو الاستفسارات العامة حول الجائزة. سواء كنت متقدمًا، مرشحًا، أو شريكًا، نحن هنا لمساعدتك',
    paragraph7: 'اسمك',
    paragraph8: 'بريدك الإلكتروني',
    paragraph9: 'رسالتك',
    paragraph10: 'إرسال الرسالة',
    placeholder1: 'أدخل اسمك',
    placeholder2: 'أدخل بريدك الإلكتروني',
    placeholder3: 'اكتب رسالتك',
    successMsg: (name: string) => `شكراً لك، ${name}. تم إرسال رسالتك بنجاح!`,
    errorMsg: 'يرجى تصحيح الحقول المظللة قبل الإرسال.',
    err_required: 'هذا الحقل مطلوب.',
    err_name: 'أدخل اسمك بالحروف فقط.',
    err_email: 'أدخل بريدًا إلكترونيًا صحيحًا.',
    err_message: `اكتب رسالة أطول قليلًا — ${MIN_MESSAGE} أحرف على الأقل.`,
    sending: '... جارٍ الإرسال',
    sendFailed: 'تعذّر إرسال رسالتك. حاول مرة أخرى، أو راسلنا على البريد الموضّح أعلاه.',
  },
}

export default function ContactUs() {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'
  const t = content[isAr ? 'ar' : 'en']

  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [focused, setFocused] = useState<string | null>(null)

  // The name is cleared on success, so the thank-you line has to keep its own
  // copy — otherwise it renders "Thank you, —".
  const [sentTo, setSentTo] = useState('')
  const [sendError, setSendError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const sendingRef = useRef(false)

  const values: Record<string, string> = { name, email, message }

  /** One field's verdict: '' when it is fine, otherwise the message to show. */
  const validateField = (key: string, value: string): string => {
    if (!isFilled(value)) return t.err_required
    if (key === 'name') return isValidName(value) ? '' : t.err_name
    if (key === 'email') return isValidEmail(value) ? '' : t.err_email
    if (key === 'message') return value.trim().length >= MIN_MESSAGE ? '' : t.err_message
    return ''
  }

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

  /** Live once the field has been left, so a message clears as it is fixed. */
  const change =
    (set: (v: string) => void, key: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      set(value)
      if (touched[key]) setFieldError(key, validateField(key, value))
      else setFieldError(key, '')
    }

  const leave = (key: string) => () => {
    setFocused(null)
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
    setFieldError(key, validateField(key, values[key]))
  }

  const fieldState = (key: string) => ({
    onFocus: () => setFocused(key),
    onBlur: leave(key),
    'aria-invalid': fieldErrors[key] ? true : undefined,
    'aria-describedby': fieldErrors[key] ? `ct-${key}-error` : undefined,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sendingRef.current) return

    const errors: Record<string, string> = {}
    for (const key of ['name', 'email', 'message']) {
      const message = validateField(key, values[key])
      if (message) errors[key] = message
    }
    setFieldErrors(errors)
    setTouched({ name: true, email: true, message: true })
    if (Object.keys(errors).length) {
      setSendError('')
      setStatus('error')
      return
    }

    sendingRef.current = true
    setStatus('sending')
    setSendError('')
    try {
      const res = await fetch(`${apiBase()}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })
      if (res.ok) {
        setSentTo(name)
        setStatus('success')
        setName(''); setEmail(''); setMessage('')
        setTouched({})
        setFieldErrors({})
        return
      }
      // The API names the fields it rejected, and says why when it is not a
      // field problem at all (rate limited, mail server down).
      let reason = ''
      let bad: string[] = []
      try {
        const data = (await res.json()) as { error?: unknown; fields?: unknown }
        if (typeof data.error === 'string') reason = data.error
        if (Array.isArray(data.fields)) {
          bad = data.fields.filter((x): x is string => typeof x === 'string')
        }
      } catch {
        /* not JSON — a proxy or gateway error */
      }
      if (bad.length) {
        setFieldErrors(Object.fromEntries(bad.map((k) => [k, validateField(k, values[k]) || t.err_required])))
        setSendError('')
      } else {
        setSendError(reason || t.sendFailed)
      }
      setStatus('error')
    } catch (err) {
      // Offline, DNS, CORS — nothing the visitor can act on beyond retrying.
      console.error('[contact]', err)
      setSendError(t.sendFailed)
      setStatus('error')
    } finally {
      sendingRef.current = false
    }
  }

  const fieldError = (key: string) =>
    fieldErrors[key] ? (
      <p className={styles.ctFieldError} id={`ct-${key}-error`} role="alert">
        {fieldErrors[key]}
      </p>
    ) : null

  const infoCards = [
    {
      key: 'email',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="3"/>
          <polyline points="2,4 12,13 22,4"/>
        </svg>
      ),
      label: t.heading2,
      lines: [t.paragraph2],
      href: `mailto:${t.paragraph2}`,
    },
    {
      key: 'phone',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6.29 6.29l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      label: t.heading3,
      lines: [t.paragraph3],
      href: `tel:${t.paragraph3}`,
    },
    {
      key: 'leadership',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      label: t.heading4,
      lines: [t.paragraph4, t.paragraph5],
      href: null,
    },
  ]

  return (
    <div className={styles.ctWrapper}>

      {/* ── Hero ── */}
      <div className={styles.ctHero}>
        <div className={styles.ctHeroBg} aria-hidden="true" />
        <div className={styles.ctHeroOrb1} aria-hidden="true" />
        <div className={styles.ctHeroOrb2} aria-hidden="true" />
        <div className={styles.ctHeroContent}>
          <div className={styles.ctHeroBadge} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6.29 6.29l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {isAr ? 'تواصل معنا' : 'Get in Touch'}
          </div>
          <h1 className={styles.ctHeroTitle}>{t.heading1}</h1>
          <p className={styles.ctHeroSub}>{t.paragraph1}</p>
          <div className={styles.ctHeroDivider} aria-hidden="true" />
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className={styles.ctInfoRow}>
        {infoCards.map((card, i) => (
          <div
            key={card.key}
            className={styles.ctInfoCard}
            style={{ animationDelay: `${i * 120}ms` }}>
            <div className={styles.ctInfoIconRing} aria-hidden="true">
              <div className={styles.ctInfoIcon}>{card.icon}</div>
            </div>
            <h3 className={styles.ctInfoLabel}>{card.label}</h3>
            {card.lines.map((line, j) =>
              card.href && j === 0 ? (
                <a key={j} href={card.href} className={styles.ctInfoLine} dir="ltr">
                  {line}
                </a>
              ) : (
                <p key={j} className={styles.ctInfoLine}>{line}</p>
              )
            )}
            <div className={styles.ctInfoCardGlow} aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* ── Form ── */}
      <div className={styles.ctFormSection}>
        <div className={styles.ctFormCard}>

          {/* Left panel */}
          <div className={styles.ctFormLeft}>
            <div className={styles.ctFormLeftOrb} aria-hidden="true" />
            <h2 className={styles.ctFormLeftTitle}>{t.heading5}</h2>
            <p className={styles.ctFormLeftSub}>{t.paragraph6}</p>
            <div className={styles.ctFormLeftDivider} aria-hidden="true" />
            <div className={styles.ctFormLeftLinks}>
              <a href={`mailto:${content.en.paragraph2}`} className={styles.ctFormLeftLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="3"/>
                  <polyline points="2,4 12,13 22,4"/>
                </svg>
                {content[isAr ? 'ar' : 'en'].paragraph2}
              </a>
              <a href={`tel:${content.en.paragraph3}`} className={styles.ctFormLeftLink} dir="ltr">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6.29 6.29l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {content[isAr ? 'ar' : 'en'].paragraph3}
              </a>
            </div>
          </div>

          {/* Right panel — form */}
          <div className={styles.ctFormRight}>
            <form onSubmit={handleSubmit} noValidate>

              <div className={`${styles.ctField} ${focused === 'name' ? styles.ctFieldFocused : ''}`}>
                <label htmlFor="ct-name" className={styles.ctLabel}>{t.paragraph7}</label>
                <div className={styles.ctInputWrap}>
                  <svg className={styles.ctInputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    id="ct-name"
                    type="text"
                    className={styles.ctInput}
                    placeholder={t.placeholder1}
                    value={name}
                    onChange={change(setName, 'name')}
                    required
                    {...fieldState('name')}
                  />
                </div>
                {fieldError('name')}
              </div>

              <div className={`${styles.ctField} ${focused === 'email' ? styles.ctFieldFocused : ''}`}>
                <label htmlFor="ct-email" className={styles.ctLabel}>{t.paragraph8}</label>
                <div className={styles.ctInputWrap}>
                  <svg className={styles.ctInputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="3"/>
                    <polyline points="2,4 12,13 22,4"/>
                  </svg>
                  <input
                    id="ct-email"
                    type="email"
                    className={styles.ctInput}
                    placeholder={t.placeholder2}
                    value={email}
                    onChange={change(setEmail, 'email')}
                    required
                    dir="ltr"
                    inputMode="email"
                    autoComplete="email"
                    {...fieldState('email')}
                  />
                </div>
                {fieldError('email')}
              </div>

              <div className={`${styles.ctField} ${focused === 'message' ? styles.ctFieldFocused : ''}`}>
                <label htmlFor="ct-message" className={styles.ctLabel}>{t.paragraph9}</label>
                <div className={styles.ctInputWrap}>
                  <svg className={styles.ctTextareaIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <textarea
                    id="ct-message"
                    className={styles.ctTextarea}
                    placeholder={t.placeholder3}
                    rows={5}
                    value={message}
                    onChange={change(setMessage, 'message')}
                    required
                    maxLength={5000}
                    {...fieldState('message')}
                  />
                </div>
                {fieldError('message')}
              </div>

              {/* Status messages */}
              {status === 'success' && (
                <div className={styles.ctSuccess}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {t.successMsg(sentTo || '—')}
                </div>
              )}
              {status === 'error' && (
                <div className={styles.ctError}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {sendError || t.errorMsg}
                </div>
              )}

              <button
                type="submit"
                className={styles.ctSubmit}
                disabled={status === 'sending'}
                aria-busy={status === 'sending'}
              >
                <span>{status === 'sending' ? t.sending : t.paragraph10}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>

            </form>
          </div>

        </div>
      </div>

    </div>
  )
}
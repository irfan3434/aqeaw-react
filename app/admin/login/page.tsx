'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/LanguageContext'
import { adminApi, AuthError, getSessionUser, getToken, homeFor, setSession, type SessionUser } from '../../../lib/adminApi'
import styles from '../../../components/admin/Admin.module.css'

const RESEND_SECONDS = 30

const content = {
  en: {
    title: 'Dashboard Sign in',
    subtitle: 'For administrators and judges. Enter your username and password.',
    username: 'Username',
    placeholder: 'Password',
    button: 'Sign in',
    loading: 'Signing in…',
    invalidCredentials: 'Incorrect username or password',
    tooMany: 'Too many attempts. Try again in 15 minutes.',
    loginFailed: 'Login failed',
    sendFailed: 'Could not send the verification code. Contact the administrator.',
    codeTitle: 'Verification code',
    codeSent: 'We sent a 6-digit code to',
    enterBelow: 'Enter it below.',
    codeValid: 'The code is valid for 10 minutes. The email can take up to a minute — also check your Spam folder.',
    verify: 'Verify and sign in',
    verifying: 'Checking…',
    wrongCode: (n: number) => `Wrong code. ${n} attempt(s) left.`,
    expired: 'The code has expired. Request a new one.',
    locked: 'Too many wrong codes. Request a new one.',
    resend: 'Resend code',
    resendIn: (s: number) => `Resend code in ${s}s`,
    resent: 'A new code was sent.',
    back: 'Back',
  },
  ar: {
    title: 'تسجيل الدخول للوحة',
    subtitle: 'للمسؤولين والمحكّمين. أدخل اسم المستخدم وكلمة المرور.',
    username: 'اسم المستخدم',
    placeholder: 'كلمة المرور',
    button: 'تسجيل الدخول',
    loading: 'جارٍ تسجيل الدخول…',
    invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    tooMany: 'محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة.',
    loginFailed: 'فشل تسجيل الدخول',
    sendFailed: 'تعذّر إرسال رمز التحقق. تواصل مع المسؤول.',
    codeTitle: 'رمز التحقق',
    codeSent: 'أرسلنا رمزاً من 6 أرقام إلى',
    enterBelow: 'أدخله بالأسفل.',
    codeValid: 'الرمز صالح لمدة 10 دقائق. قد يتأخر وصول الرسالة حتى دقيقة، وتأكد من مجلد الرسائل غير المرغوب فيها (Spam).',
    verify: 'تحقق وادخل',
    verifying: 'جارٍ التحقق…',
    wrongCode: (n: number) => `الرمز غير صحيح. تبقّى ${n} محاولات.`,
    expired: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.',
    locked: 'أخطأت عدة مرات. اطلب رمزاً جديداً.',
    resend: 'إعادة إرسال الرمز',
    resendIn: (s: number) => `إعادة الإرسال بعد ${s} ثانية`,
    resent: 'تم إرسال رمز جديد.',
    back: 'رجوع',
  },
}

export default function AdminLoginPage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 2 state
  const [challenge, setChallenge] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Already signed in → go straight to the right page.
  useEffect(() => {
    const user = getSessionUser()
    if (getToken() && user) router.replace(homeFor(user.role))
  }, [router])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const finish = (token: string, user: SessionUser) => {
    setSession(token, user)
    router.push(homeFor(user.role))
  }

  const messageFor = (err: unknown) => {
    if (!(err instanceof AuthError)) return t.loginFailed
    if (err.status === 429) return t.tooMany
    if (err.status === 502) return t.sendFailed
    if (err.data.reason === 'wrong') return t.wrongCode(err.data.attemptsLeft ?? 0)
    if (err.data.reason === 'expired') return t.expired
    if (err.data.reason === 'locked') return t.locked
    if (err.status === 401) return t.invalidCredentials
    return err.message || t.loginFailed
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminApi.login(username.trim(), password.trim())
      if ('challenge' in res) {
        setChallenge(res.challenge)
        setMaskedEmail(res.email)
        setCode('')
        setInfo('')
        setCooldown(RESEND_SECONDS)
      } else {
        finish(res.token, res.user)
      }
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { token, user } = await adminApi.verifyCode(challenge, code)
      finish(token, user)
    } catch (err) {
      setError(messageFor(err))
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    setError('')
    setInfo('')
    try {
      await adminApi.resendCode(challenge)
      setInfo(t.resent)
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      if (err instanceof AuthError && err.data.retryAfter) setCooldown(err.data.retryAfter)
      else setError(messageFor(err))
    }
  }

  const backToPassword = () => {
    setChallenge('')
    setCode('')
    setError('')
    setInfo('')
  }

  if (challenge) {
    return (
      <div className={styles.adminLoginPage}>
        <div className={styles.adminLoginCard}>
          <h1>🔐 {t.codeTitle}</h1>
          <p>
            {t.codeSent} <bdi dir="ltr">{maskedEmail}</bdi>
            <br />
            {t.enterBelow}
            <br />
            <small>{t.codeValid}</small>
          </p>
          <form className={styles.adminLoginForm} onSubmit={onVerify}>
            <input
              className={styles.adminCodeInput}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              dir="ltr"
              autoFocus
              required
            />
            <button type="submit" disabled={loading || code.length !== 6}>
              {loading ? t.verifying : t.verify}
            </button>
            {error && <div className={styles.adminErrorMsg}>{error}</div>}
            {info && <div className={styles.adminSuccessMsg}>{info}</div>}
            <div className={styles.adminCodeActions}>
              <button type="button" className={styles.adminLinkBtn} onClick={onResend} disabled={cooldown > 0}>
                {cooldown > 0 ? t.resendIn(cooldown) : t.resend}
              </button>
              <button type="button" className={styles.adminLinkBtn} onClick={backToPassword}>
                {t.back}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.adminLoginPage}>
      <div className={styles.adminLoginCard}>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <form className={styles.adminLoginForm} onSubmit={onSubmit}>
          <input
            type="text"
            placeholder={t.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            dir="ltr"
            autoFocus
            required
          />
          <input
            type="password"
            placeholder={t.placeholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            dir="ltr"
            required
          />
          <button type="submit" disabled={loading || !password || !username}>
            {loading ? t.loading : t.button}
          </button>
          {error && <div className={styles.adminErrorMsg}>{error}</div>}
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/LanguageContext'
import {
  adminApi,
  setToken,
  setUser,
  isCodeRequired,
  ApiError,
  type LoginSession,
} from '../../../lib/adminApi'
import styles from '../../../components/admin/Admin.module.css'

/** Matches RESEND_WAIT_MS in the server's routes/auth.js */
const RESEND_WAIT = 30

const content = {
  en: {
    title: 'Admin Dashboard',
    subtitle: 'Sign in with your dashboard account to continue.',
    username: 'Username',
    password: 'Password',
    button: 'Sign in',
    loading: 'Signing in…',

    codeTitle: 'Check your email',
    codeSubtitle: (email: string) => `We sent a 6-digit code to ${email}. It expires in 10 minutes.`,
    code: '6-digit code',
    verify: 'Verify',
    verifying: 'Verifying…',
    resend: 'Send a new code',
    resendIn: (s: number) => `Send a new code in ${s}s`,
    resent: 'A new code is on its way.',
    codeSent: 'Code sent.',
    back: 'Use a different account',

    invalidCredentials: 'Wrong username or password',
    tooManyAttempts: 'Too many attempts. Please try again later.',
    waitSeconds: (s: number) => `Please wait ${s}s before asking for another code.`,
    codeSendFailed: 'We could not send the code. Please try again.',
    codeExpired: 'That code expired. Please sign in again.',
    codeLocked: 'Too many wrong codes. Please sign in again.',
    codeWrong: (left: number) =>
      left > 0 ? `Wrong code — ${left} attempt${left === 1 ? '' : 's'} left` : 'Wrong code',
    notAdmin: 'This account does not have admin access.',
    loginFailed: 'Login failed',
  },
  ar: {
    title: 'لوحة الإدارة',
    subtitle: 'سجّل الدخول بحساب لوحة التحكم للمتابعة.',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    button: 'تسجيل الدخول',
    loading: 'جارٍ تسجيل الدخول…',

    codeTitle: 'تحقق من بريدك الإلكتروني',
    codeSubtitle: (email: string) => `أرسلنا رمزًا من 6 أرقام إلى ${email}. ينتهي خلال 10 دقائق.`,
    code: 'الرمز المكوّن من 6 أرقام',
    verify: 'تحقق',
    verifying: 'جارٍ التحقق…',
    resend: 'إرسال رمز جديد',
    resendIn: (s: number) => `إرسال رمز جديد بعد ${s} ثانية`,
    resent: 'تم إرسال رمز جديد.',
    codeSent: 'تم إرسال الرمز.',
    back: 'استخدام حساب آخر',

    invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    tooManyAttempts: 'عدد محاولات كبير. يُرجى المحاولة لاحقًا.',
    waitSeconds: (s: number) => `يُرجى الانتظار ${s} ثانية قبل طلب رمز جديد.`,
    codeSendFailed: 'لم نتمكّن من إرسال الرمز. يُرجى المحاولة مرة أخرى.',
    codeExpired: 'انتهت صلاحية الرمز. يُرجى تسجيل الدخول من جديد.',
    codeLocked: 'عدد محاولات خاطئة كبير. يُرجى تسجيل الدخول من جديد.',
    codeWrong: (left: number) => (left > 0 ? `رمز غير صحيح — بقي ${left} محاولة` : 'رمز غير صحيح'),
    notAdmin: 'هذا الحساب لا يملك صلاحية الإدارة.',
    loginFailed: 'فشل تسجيل الدخول',
  },
}

export default function AdminLoginPage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()

  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Counts the resend cooldown down to zero, one second at a time.
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  /** Turns an API failure into a message the user can act on. */
  const describe = (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 429) {
        return err.retryAfter ? t.waitSeconds(err.retryAfter) : t.tooManyAttempts
      }
      if (err.status === 502) return t.codeSendFailed
      if (err.status === 401) {
        if (err.reason === 'expired') return t.codeExpired
        if (err.reason === 'locked') return t.codeLocked
        if (err.reason === 'wrong') return t.codeWrong(err.attemptsLeft ?? 0)
        return t.invalidCredentials
      }
      return err.message || t.loginFailed
    }
    return err instanceof Error ? err.message : t.loginFailed
  }

  const restart = (message: string) => {
    setStep('credentials')
    setCode('')
    setChallenge('')
    setPassword('')
    setCooldown(0)
    setNotice('')
    setError(message)
  }

  /**
   * Judges authenticate fine but have no dashboard — every /admin call would
   * 403. Admins and superadmins both belong here; superadmins just see more.
   */
  const finish = (session: LoginSession) => {
    if (session.user.role === 'judge') {
      setError(t.notAdmin)
      return
    }
    setToken(session.token)
    setUser(session.user)
    router.push('/admin')
  }

  const onCredentials = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      const res = await adminApi.login(username.trim(), password)
      if (isCodeRequired(res)) {
        setChallenge(res.challenge)
        setMaskedEmail(res.email)
        setStep('code')
        setCooldown(RESEND_WAIT)
        setNotice(t.codeSent)
      } else {
        finish(res)
      }
    } catch (err) {
      setError(describe(err))
    } finally {
      setLoading(false)
    }
  }

  const onVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      finish(await adminApi.verifyLoginCode(challenge, code))
    } catch (err) {
      const message = describe(err)
      // An expired or locked attempt can't be retried — go back to step 1.
      if (err instanceof ApiError && (err.reason === 'expired' || err.reason === 'locked')) {
        restart(message)
      } else {
        setError(message)
        setCode('')
      }
    } finally {
      setLoading(false)
    }
  }

  const onResend = async () => {
    setError('')
    setNotice('')
    setLoading(true)
    try {
      await adminApi.resendLoginCode(challenge)
      setCooldown(RESEND_WAIT)
      setNotice(t.resent)
    } catch (err) {
      setError(describe(err))
      if (err instanceof ApiError) {
        if (err.retryAfter) setCooldown(err.retryAfter)
        if (err.reason === 'expired') restart(t.codeExpired)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.adminLoginPage}>
      <div className={styles.adminLoginCard}>
        <h1>{t.title}</h1>
        <p>{step === 'credentials' ? t.subtitle : t.codeSubtitle(maskedEmail)}</p>

        {step === 'credentials' ? (
          <form className={styles.adminLoginForm} onSubmit={onCredentials}>
            <input
              type="text"
              placeholder={t.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
            />
            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button type="submit" disabled={loading || !username.trim() || !password}>
              {loading ? t.loading : t.button}
            </button>
            {error && <div className={styles.adminErrorMsg}>{error}</div>}
          </form>
        ) : (
          <form className={styles.adminLoginForm} onSubmit={onVerify}>
            <input
              className={styles.adminCodeInput}
              type="text"
              dir="ltr"
              placeholder={t.code}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              required
            />
            <button type="submit" disabled={loading || code.length !== 6}>
              {loading ? t.verifying : t.verify}
            </button>

            {error && <div className={styles.adminErrorMsg}>{error}</div>}
            {!error && notice && <div className={styles.adminNoticeMsg}>{notice}</div>}

            <div className={styles.adminLoginAlt}>
              <button type="button" onClick={onResend} disabled={loading || cooldown > 0}>
                {cooldown > 0 ? t.resendIn(cooldown) : t.resend}
              </button>
              <button type="button" onClick={() => restart('')} disabled={loading}>
                {t.back}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

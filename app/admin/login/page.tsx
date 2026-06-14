'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/LanguageContext'
import { adminApi, setToken } from '../../../lib/adminApi'
import styles from '../../../components/admin/Admin.module.css'

const content = {
  en: {
    title: 'Admin Dashboard',
    subtitle: 'Enter the shared admin password to continue.',
    placeholder: 'Password',
    button: 'Sign in',
    loading: 'Signing in…',
    invalidPassword: 'Invalid password',
    loginFailed: 'Login failed',
  },
  ar: {
    title: 'لوحة الإدارة',
    subtitle: 'أدخل كلمة مرور المسؤول المشتركة للمتابعة.',
    placeholder: 'كلمة المرور',
    button: 'تسجيل الدخول',
    loading: 'جارٍ تسجيل الدخول…',
    invalidPassword: 'كلمة المرور غير صحيحة',
    loginFailed: 'فشل تسجيل الدخول',
  },
}

export default function AdminLoginPage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await adminApi.login(password)
      setToken(token)
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error
        ? (err.message === 'Invalid password' ? t.invalidPassword : err.message)
        : t.loginFailed
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.adminLoginPage}>
      <div className={styles.adminLoginCard}>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <form className={styles.adminLoginForm} onSubmit={onSubmit}>
          <input
            type="password"
            placeholder={t.placeholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          <button type="submit" disabled={loading || !password}>
            {loading ? t.loading : t.button}
          </button>
          {error && <div className={styles.adminErrorMsg}>{error}</div>}
        </form>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/LanguageContext'
import {
  adminApi,
  clearToken,
  guardRole,
  type ManagedUser,
  type Role,
} from '../../../lib/adminApi'
import styles from '../../../components/admin/Admin.module.css'

const ROLES: Role[] = ['superadmin', 'admin', 'judge']
const MIN_PASSWORD = 8

const content = {
  en: {
    title: 'Accounts',
    back: '← Dashboard',
    signOut: 'Sign out',
    loading: 'Loading…',
    forbidden: 'Only a superadmin can manage accounts.',

    addTitle: 'Add account',
    addOpen: '+ Add account',
    addClose: 'Cancel',
    username: 'Username',
    usernameHint: '3–32 characters: letters, numbers, . _ -',
    fullName: 'Full name',
    role: 'Role',
    password: 'Password',
    passwordHint: `At least ${MIN_PASSWORD} characters`,
    email: 'Email (optional)',
    emailHint: 'If set, signing in also needs a 6-digit code sent here',
    create: 'Create account',
    creating: 'Creating…',

    colUser: 'Account',
    colRole: 'Role',
    colTwoStep: 'Two-step',
    colStatus: 'Status',
    colLastLogin: 'Last login',
    colEvaluations: 'Scores',
    colActions: '',

    roleSuperadmin: 'Superadmin',
    roleAdmin: 'Admin',
    roleJudge: 'Judge',
    on: 'On',
    off: 'Off',
    active: 'Active',
    disabled: 'Disabled',
    never: 'Never',
    you: 'you',

    resetPassword: 'Reset password',
    disable: 'Disable',
    enable: 'Enable',
    remove: 'Delete',
    saving: 'Saving…',

    cantDeleteSelf: 'You cannot delete your own account',
    cantTouchLastSuper: 'This is the last superadmin',

    promptPassword: (u: string) => `New password for "${u}" (min ${MIN_PASSWORD} characters):`,
    confirmDelete: (u: string) =>
      `Delete the account "${u}"?\n\nThis cannot be undone. Any scores they submitted are kept.`,
    confirmDisable: (u: string) => `Disable "${u}"? They will be signed out immediately.`,
    passwordTooShort: `Password must be at least ${MIN_PASSWORD} characters`,
    empty: 'No accounts yet.',
  },
  ar: {
    title: 'الحسابات',
    back: '← لوحة التحكم',
    signOut: 'تسجيل الخروج',
    loading: 'جارٍ التحميل…',
    forbidden: 'إدارة الحسابات متاحة للمشرف العام فقط.',

    addTitle: 'إضافة حساب',
    addOpen: '+ إضافة حساب',
    addClose: 'إلغاء',
    username: 'اسم المستخدم',
    usernameHint: '٣–٣٢ خانة: حروف إنجليزية وأرقام و . _ -',
    fullName: 'الاسم الكامل',
    role: 'الصلاحية',
    password: 'كلمة المرور',
    passwordHint: `${MIN_PASSWORD} خانات على الأقل`,
    email: 'البريد الإلكتروني (اختياري)',
    emailHint: 'عند تعيينه، يتطلب تسجيل الدخول رمزًا من 6 أرقام يُرسل إليه',
    create: 'إنشاء الحساب',
    creating: 'جارٍ الإنشاء…',

    colUser: 'الحساب',
    colRole: 'الصلاحية',
    colTwoStep: 'خطوتان',
    colStatus: 'الحالة',
    colLastLogin: 'آخر دخول',
    colEvaluations: 'التقييمات',
    colActions: '',

    roleSuperadmin: 'مشرف عام',
    roleAdmin: 'مشرف',
    roleJudge: 'محكّم',
    on: 'مفعّل',
    off: 'غير مفعّل',
    active: 'نشط',
    disabled: 'معطّل',
    never: 'لا يوجد',
    you: 'أنت',

    resetPassword: 'تغيير كلمة المرور',
    disable: 'تعطيل',
    enable: 'تفعيل',
    remove: 'حذف',
    saving: 'جارٍ الحفظ…',

    cantDeleteSelf: 'لا يمكنك حذف حسابك',
    cantTouchLastSuper: 'هذا آخر مشرف عام',

    promptPassword: (u: string) => `كلمة مرور جديدة لـ "${u}" (${MIN_PASSWORD} خانات على الأقل):`,
    confirmDelete: (u: string) =>
      `حذف الحساب "${u}"؟\n\nلا يمكن التراجع عن هذا. التقييمات التي قدّمها تبقى محفوظة.`,
    confirmDisable: (u: string) => `تعطيل "${u}"؟ سيتم تسجيل خروجه فورًا.`,
    passwordTooShort: `كلمة المرور يجب أن تكون ${MIN_PASSWORD} خانات على الأقل`,
    empty: 'لا توجد حسابات بعد.',
  },
}

const BLANK = { username: '', name: '', role: 'judge' as Role, password: '', email: '' }

export default function AdminUsersPage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [me, setMe] = useState<ManagedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  /** id of the row currently being changed, so only its buttons disable */
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState(BLANK)
  const [creating, setCreating] = useState(false)

  const roleLabel = (r: Role) =>
    r === 'superadmin' ? t.roleSuperadmin : r === 'admin' ? t.roleAdmin : t.roleJudge

  const load = useCallback(async () => {
    try {
      const [{ user }, { users: list }] = await Promise.all([adminApi.me(), adminApi.users()])
      setMe(user)
      setUsers(list)
    } catch (err) {
      // request() already redirects on 401 and 403, so anything reaching here
      // is a genuine failure rather than a permissions problem.
      const msg = err instanceof Error ? err.message : String(err)
      if (msg !== 'Unauthorized' && msg !== 'Forbidden') setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Accounts are superadmin-only; anyone else is sent to their own home page.
    if (!guardRole('superadmin', router.replace)) return
    load()
  }, [router, load])

  const activeSuperadmins = users.filter((u) => u.role === 'superadmin' && u.active).length
  const isLastSuperadmin = (u: ManagedUser) =>
    u.role === 'superadmin' && u.active && activeSuperadmins <= 1

  /** Runs one change against a row and refreshes, surfacing the API's message. */
  const run = async (id: string, action: () => Promise<unknown>) => {
    setError('')
    setBusyId(id)
    try {
      await action()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (draft.password.length < MIN_PASSWORD) {
      setError(t.passwordTooShort)
      return
    }
    setCreating(true)
    try {
      await adminApi.createUser({
        username: draft.username.trim().toLowerCase(),
        name: draft.name.trim(),
        role: draft.role,
        password: draft.password,
        email: draft.email.trim() || undefined,
      })
      setDraft(BLANK)
      setShowAdd(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  const onResetPassword = (u: ManagedUser) => {
    const next = window.prompt(t.promptPassword(u.username))
    if (next === null) return
    if (next.length < MIN_PASSWORD) {
      setError(t.passwordTooShort)
      return
    }
    run(u._id, () => adminApi.updateUser(u._id, { password: next }))
  }

  const onToggleActive = (u: ManagedUser) => {
    if (u.active && !window.confirm(t.confirmDisable(u.username))) return
    run(u._id, () => adminApi.updateUser(u._id, { active: !u.active }))
  }

  const onChangeRole = (u: ManagedUser, role: Role) => {
    if (role === u.role) return
    run(u._id, () => adminApi.updateUser(u._id, { role }))
  }

  const onDelete = (u: ManagedUser) => {
    if (!window.confirm(t.confirmDelete(u.username))) return
    run(u._id, () => adminApi.deleteUser(u._id))
  }

  const handleLogout = () => {
    clearToken()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className={styles.adminPage}>
        <div className={styles.adminContainer}>
          <div className={styles.adminLoading}>{t.loading}</div>
        </div>
      </div>
    )
  }


  return (
    <div className={styles.adminPage}>
      <div className={styles.adminContainer}>
        <div className={styles.adminHeader}>
          <h1>{t.title}</h1>
          <div className={styles.adminHeaderActions}>
            <button className={styles.adminLogoutBtn} onClick={() => router.push('/admin')}>
              {t.back}
            </button>
            <button className={styles.adminLogoutBtn} onClick={handleLogout}>
              {t.signOut}
            </button>
          </div>
        </div>

        {error && <div className={styles.adminErrorMsg}>{error}</div>}

        <div className={styles.adminAddBar}>
          <button className={styles.adminExportBtn} onClick={() => setShowAdd((s) => !s)}>
            {showAdd ? t.addClose : t.addOpen}
          </button>
        </div>

        {showAdd && (
          <form className={styles.adminUserForm} onSubmit={onCreate}>
            <h2>{t.addTitle}</h2>
            <div className={styles.adminUserFormGrid}>
              <label>
                <span>{t.username}</span>
                <input
                  value={draft.username}
                  onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
                <small>{t.usernameHint}</small>
              </label>
              <label>
                <span>{t.fullName}</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>{t.role}</span>
                <select
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t.password}</span>
                <input
                  type="password"
                  value={draft.password}
                  onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  autoComplete="new-password"
                  required
                />
                <small>{t.passwordHint}</small>
              </label>
              <label className={styles.adminUserFormWide}>
                <span>{t.email}</span>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <small>{t.emailHint}</small>
              </label>
            </div>
            <button type="submit" disabled={creating}>
              {creating ? t.creating : t.create}
            </button>
          </form>
        )}

        <div className={styles.adminTableWrap}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>{t.colUser}</th>
                <th>{t.colRole}</th>
                <th>{t.colTwoStep}</th>
                <th>{t.colStatus}</th>
                <th>{t.colLastLogin}</th>
                <th>{t.colEvaluations}</th>
                <th>{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.adminEmpty}>
                    {t.empty}
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const isMe = me?._id === u._id
                const lastSuper = isLastSuperadmin(u)
                const busy = busyId === u._id
                return (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.username}</strong>
                      {isMe && <span className={styles.adminYouTag}>{t.you}</span>}
                      <div className={styles.adminSubtle}>{u.name}</div>
                      {u.email && <div className={styles.adminSubtle}>{u.email}</div>}
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={busy || lastSuper}
                        title={lastSuper ? t.cantTouchLastSuper : undefined}
                        onChange={(e) => onChangeRole(u, e.target.value as Role)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{u.email ? t.on : t.off}</td>
                    <td>
                      <span className={u.active ? styles.adminTypePersonal : styles.adminTypeOrg}>
                        {u.active ? t.active : t.disabled}
                      </span>
                    </td>
                    <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : t.never}</td>
                    <td>{u.evaluations || '—'}</td>
                    <td>
                      <div className={styles.adminRowActions}>
                        <button disabled={busy} onClick={() => onResetPassword(u)}>
                          {busy ? t.saving : t.resetPassword}
                        </button>
                        <button
                          disabled={busy || lastSuper}
                          title={lastSuper ? t.cantTouchLastSuper : undefined}
                          onClick={() => onToggleActive(u)}
                        >
                          {u.active ? t.disable : t.enable}
                        </button>
                        <button
                          className={styles.adminDangerBtn}
                          disabled={busy || isMe || lastSuper}
                          title={
                            isMe ? t.cantDeleteSelf : lastSuper ? t.cantTouchLastSuper : undefined
                          }
                          onClick={() => onDelete(u)}
                        >
                          {t.remove}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

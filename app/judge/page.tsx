'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../lib/LanguageContext'
import { clearToken, getSessionUser, guardRole, judgeApi, type JudgeListResponse } from '../../lib/adminApi'
import styles from '../../components/admin/Admin.module.css'

const content = {
  en: {
    title: 'Judging',
    hello: (n: string) => `Welcome, ${n}`,
    intro: 'Candidate identities and categories are hidden. Each candidate has a code — open it, review the achievements, and submit your score.',
    signOut: 'Sign out',
    progress: 'Your progress',
    of: 'of',
    filterAll: 'All',
    filterPending: 'Not scored yet',
    filterDone: 'Scored',
    colNum: '#',
    colCode: 'Candidate code',
    colSubmitted: 'Submitted',
    colAchievements: 'Achievements',
    colScore: 'Your score',
    colMyScore: 'Status',
    scored: '✓ Scored',
    colAction: '',
    pending: 'Not scored',
    evaluate: 'Evaluate',
    edit: 'View',
    loading: 'Loading…',
    empty: 'No candidates to show.',
  },
  ar: {
    title: 'صفحة التحكيم',
    hello: (n: string) => `مرحباً، ${n}`,
    intro: 'بيانات المرشحين وفئاتهم مخفية. لكل مرشح رمز خاص — افتحه، اطّلع على الإنجازات، ثم ارفع تقييمك.',
    signOut: 'تسجيل الخروج',
    progress: 'تقدّمك',
    of: 'من',
    filterAll: 'الكل',
    filterPending: 'لم أقيّمه بعد',
    filterDone: 'تم تقييمه',
    colNum: '#',
    colCode: 'رمز المرشح',
    colSubmitted: 'تاريخ التقديم',
    colAchievements: 'الإنجازات',
    colScore: 'درجتك',
    colMyScore: 'الحالة',
    scored: '✓ تم التقييم',
    colAction: '',
    pending: 'لم يُقيَّم',
    evaluate: 'تقييم',
    edit: 'عرض',
    loading: 'جارٍ التحميل…',
    empty: 'لا يوجد مرشحون للعرض.',
  },
}

type Filter = 'all' | 'pending' | 'done'

export default function JudgeHomePage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()

  const [data, setData] = useState<JudgeListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Judges open this to score, so start on what they still have to do.
  const [filter, setFilter] = useState<Filter>('pending')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!guardRole('judge', router.replace)) return
    judgeApi
      .list()
      .then((r) => {
        setData(r)
        setName(getSessionUser()?.name || '')
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [router])

  const items = useMemo(() => {
    const all = data?.items ?? []
    if (filter === 'pending') return all.filter((i) => !i.myEvaluation)
    if (filter === 'done') return all.filter((i) => i.myEvaluation)
    return all
  }, [data, filter])

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—'

  const progress = data?.progress
  const pct = progress && progress.total ? Math.round((progress.evaluated / progress.total) * 100) : 0

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminContainer}>
        <div className={styles.adminHeader}>
          <div>
            <h1>{t.title}</h1>
            {name && <div className={styles.adminPanelHint} style={{ margin: '8px 0 0' }}>{t.hello(name)}</div>}
          </div>
          <button
            className={styles.adminLogoutBtn}
            onClick={() => {
              clearToken()
              router.replace('/admin/login')
            }}
          >
            {t.signOut}
          </button>
        </div>

        <div className={styles.adminPanel}>
          <p className={styles.adminPanelHint} style={{ marginTop: 0 }}>🔒 {t.intro}</p>
          {progress && (
            <div>
              <div className={styles.adminProgressLabel}>
                {t.progress}: <strong>{progress.evaluated}</strong> {t.of} {progress.total}
              </div>
              <div className={styles.adminProgressBar}>
                <div style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          <div className={styles.adminTabs}>
            {(['all', 'pending', 'done'] as Filter[]).map((f) => (
              <button
                key={f}
                className={`${styles.adminTab} ${filter === f ? styles.adminTabActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? t.filterAll : f === 'pending' ? t.filterPending : t.filterDone}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.adminTableWrap}>
          {loading ? (
            <div className={styles.adminLoading}>{t.loading}</div>
          ) : error ? (
            <div className={styles.adminErrorMsg}>{error}</div>
          ) : items.length === 0 ? (
            <div className={styles.adminEmpty}>{t.empty}</div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>{t.colNum}</th>
                  <th>{t.colCode}</th>
                  <th>{t.colSubmitted}</th>
                  <th>{t.colAchievements}</th>
                  <th>{t.colScore}</th>
                  <th>{t.colMyScore}</th>
                  <th>{t.colAction}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.code} onClick={() => router.push(`/judge/${item.ref}`)}>
                    <td data-label={t.colNum}>
                      <span className={styles.adminSeq}>{item.seq}</span>
                    </td>
                    <td data-label={t.colCode}>
                      <span className={styles.adminCode}>{item.code}</span>
                    </td>
                    <td data-label={t.colSubmitted}>{fmtDate(item.submittedOn)}</td>
                    <td data-label={t.colAchievements}>{item.achievementsCount}</td>
                    <td data-label={t.colScore}>
                      {item.myEvaluation && Number.isFinite(item.myEvaluation.total) ? (
                        <span className={styles.adminScoreValue}>
                          {item.myEvaluation.total}{' '}
                          <small>/ {item.myEvaluation.maxTotal ?? 100}</small>
                        </span>
                      ) : (
                        <span className={styles.adminScoreNone}>—</span>
                      )}
                    </td>
                    <td data-label={t.colMyScore}>
                      {item.myEvaluation ? (
                        <span className={styles.adminStatusOn}>{t.scored}</span>
                      ) : (
                        <span className={styles.adminScoreNone}>{t.pending}</span>
                      )}
                    </td>
                    <td data-label={t.colAction}>
                      <span className={styles.adminSmallBtn}>
                        {item.myEvaluation ? t.edit : t.evaluate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../lib/LanguageContext'
import {
  adminApi,
  clearToken,
  canUseAdmin,
  getSessionUser,
  guardRole,
  type ApplicationListItem,
  type StatsResponse,
  type ListFilters,
  type Role,
  type Result,
  type JudgingSettings,
} from '../../lib/adminApi'
import styles from '../../components/admin/Admin.module.css'

const content = {
  en: {
    title: 'Admin Dashboard',
    signOut: 'Sign out',
    statTotal: 'Total',
    statThisWeek: 'This Week',
    statPersonal: 'Personal',
    statOrganization: 'Organization',
    filterSearch: 'Search',
    filterSearchPlaceholder: 'Name, email, phone…',
    filterType: 'Type',
    filterTypeAll: 'All',
    filterTypePersonal: 'Personal',
    filterTypeOrg: 'Organization',
    filterAffiliation: 'Affiliation',
    filterAffAny: 'Any',
    filterFrom: 'From',
    filterTo: 'To',
    exportBtn: '📊 Export Excel',
    exporting: 'Exporting…',
    colDate: 'Date',
    colType: 'Type',
    colName: 'Name',
    colEmail: 'Email',
    colPhone: 'Phone',
    colAffiliation: 'Affiliation',
    loading: 'Loading…',
    empty: 'No submissions match these filters.',
    exportFailed: 'Export failed',
    personal: 'personal',
    organization: 'organization',
    referral: '(ref)',
    colScore: 'Judges’ score',
    notScored: 'Not scored',
    average: 'Average',
    finalAvg: 'Final average',
    winner: '🏆 Winner',
    notWinner: '✗ Lost',
    pending: 'Still being judged',
    pendingOf: (n: number, m: number) => `${n} of ${m} judges`,
    resultsTitle: 'Results',
    passScore: 'Winning score (out of',
    minJudges: 'Min. judges per candidate',
    saveSettings: 'Save',
    saving: 'Saving…',
    settingsSaved: 'Saved. Results updated.',
    rulesHint: (p: number, m: number) =>
      `A candidate wins if their final average is above ${p}; ${p} or below loses. A result shows after at least ${m} judge${m === 1 ? '' : 's'} have scored them.`,
    filterResult: 'Result',
    filterResultAll: 'All',
    sortBy: 'Sort by',
    sortDate: 'Newest',
    sortScore: 'Highest score',
    manageUsers: '👥 Admins & judges',
    manageCards: '🪪 Profile cards',
  },
  ar: {
    title: 'لوحة الإدارة',
    signOut: 'تسجيل الخروج',
    statTotal: 'الإجمالي',
    statThisWeek: 'هذا الأسبوع',
    statPersonal: 'أفراد',
    statOrganization: 'كيانات',
    filterSearch: 'بحث',
    filterSearchPlaceholder: 'الاسم، البريد، رقم الجوال…',
    filterType: 'النوع',
    filterTypeAll: 'الكل',
    filterTypePersonal: 'أفراد',
    filterTypeOrg: 'كيانات',
    filterAffiliation: 'الانتماء',
    filterAffAny: 'الكل',
    filterFrom: 'من',
    filterTo: 'إلى',
    exportBtn: '📊 تصدير إلى Excel',
    exporting: 'جارٍ التصدير…',
    colDate: 'التاريخ',
    colType: 'النوع',
    colName: 'الاسم',
    colEmail: 'البريد الإلكتروني',
    colPhone: 'رقم الجوال',
    colAffiliation: 'الانتماء',
    loading: 'جارٍ التحميل…',
    empty: 'لا توجد طلبات مطابقة لهذه الفلاتر.',
    exportFailed: 'فشل التصدير',
    personal: 'أفراد',
    organization: 'كيانات',
    referral: '(ترشيح)',
    colScore: 'تقييم المحكّمين',
    notScored: 'لم يُقيَّم',
    average: 'المتوسط',
    finalAvg: 'المعدل النهائي',
    winner: '🏆 فائز',
    notWinner: '✗ خسران',
    pending: 'قيد التحكيم',
    pendingOf: (n: number, m: number) => `${n} من ${m} محكّمين`,
    resultsTitle: 'النتائج',
    passScore: 'درجة الفوز (من',
    minJudges: 'أقل عدد محكّمين للمرشح',
    saveSettings: 'حفظ',
    saving: 'جارٍ الحفظ…',
    settingsSaved: 'تم الحفظ وتحديث النتائج.',
    rulesHint: (p: number, m: number) =>
      `يكون المرشح فائزاً إذا كان معدله النهائي أعلى من ${p}، وخسراناً إذا كان ${p} أو أقل. تظهر النتيجة بعد أن يقيّمه ${m === 1 ? 'محكّم واحد' : `${m} محكّمين`} على الأقل.`,
    filterResult: 'النتيجة',
    filterResultAll: 'الكل',
    sortBy: 'الترتيب',
    sortDate: 'الأحدث',
    sortScore: 'الأعلى درجة',
    manageUsers: '👥 المسؤولون والمحكّمون',
    manageCards: '🪪 بطاقات التعريف',
  },
}

export default function AdminDashboardPage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()

  const [userName, setUserName] = useState('')
  useEffect(() => {
    if (guardRole('admin', router.replace)) setUserName(getSessionUser()?.name || '')
  }, [router])

  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [items, setItems] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const [exporting, setExporting] = useState(false)

  const [type, setType] = useState<ListFilters['type']>('all')
  const [search, setSearch] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [result, setResult] = useState<'' | Result>('')
  const [sort, setSort] = useState<'date' | 'score'>('date')

  const [resultCounts, setResultCounts] = useState<Record<Result, number> | null>(null)
  const [settings, setSettings] = useState<JudgingSettings | null>(null)
  const [passScore, setPassScore] = useState('')
  const [minJudges, setMinJudges] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    // Superadmins use this dashboard too; a bare !== 'admin' left them
    // stuck on "Loading..." because it returned before setLoading(false).
    if (!canUseAdmin(getSessionUser()?.role)) return
    setLoading(true)
    try {
      const [s, list] = await Promise.all([
        adminApi.stats(),
        adminApi.list({ type, search, affiliation, from, to, result, sort, limit: 200 }),
      ])
      setStats(s)
      setItems(list.items)
      setResultCounts(list.resultCounts)
      setSettings(list.settings)
      setPassScore((v) => (v === '' ? String(list.settings.passScore) : v))
      setMinJudges((v) => (v === '' ? String(list.settings.minJudges) : v))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [type, search, affiliation, from, to, result, sort])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setSettingsMsg(null)
    try {
      const r = await adminApi.saveSettings({ passScore: Number(passScore), minJudges: Number(minJudges) })
      setSettings(r.settings)
      setSettingsMsg({ ok: true, text: t.settingsSaved })
      await load()
    } catch (err) {
      setSettingsMsg({ ok: false, text: err instanceof Error ? err.message : String(err) })
    } finally {
      setSavingSettings(false)
    }
  }

  const resultLabel = (r: Result) =>
    r === 'winner' ? t.winner : r === 'notWinner' ? t.notWinner : t.pending

  // This debounced effect also runs on mount, so there is no separate mount
  // fetch — having both made every dashboard visit load stats and the list twice.
  useEffect(() => {
    const id = setTimeout(() => load(), 250)
    return () => clearTimeout(id)
  }, [load])

  // The Accounts link is superadmin-only. The page itself re-checks server-side.
  useEffect(() => {
    adminApi
      .me()
      .then(({ user }) => setRole(user.role))
      .catch(() => {
        /* a failure here just means no link; every other call reports errors */
      })
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      await adminApi.downloadExport({
        type: type === 'all' ? undefined : type,
        from,
        to,
      })
    } catch (err) {
      alert(`${t.exportFailed}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = () => {
    clearToken()
    router.replace('/admin/login')
  }

  const openDetail = (item: ApplicationListItem) => {
    router.push(`/admin/${item.type}/${item._id}`)
  }

  const getBadgeLabel = (item: ApplicationListItem) => {
    const typeLabel = item.type === 'personal' ? t.personal : t.organization
    const suffix = item.subtype === 'referral' ? ` ${t.referral}` : ''
    return `${typeLabel}${suffix}`
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminContainer}>
        <div className={styles.adminHeader}>
          <h1>{t.title}</h1>
          <div className={styles.adminHeaderActions}>
            {userName && <span className={styles.adminUserName}>{userName}</span>}
            {/* Account management is superadmin-only; /admin/users 403s for admins. */}
            {role === 'superadmin' && (
              <button className={styles.adminLogoutBtn} onClick={() => router.push('/admin/users')}>
                {t.manageUsers}
              </button>
            )}
            <button className={styles.adminLogoutBtn} onClick={() => router.push('/admin/profile-cards')}>
              {t.manageCards}
            </button>
            <button className={styles.adminLogoutBtn} onClick={handleLogout}>
              {t.signOut}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.adminStats}>
          <div className={styles.adminStatCard}>
            <div className={styles.adminStatLabel}>{t.statTotal}</div>
            <div className={styles.adminStatValue}>{stats?.total ?? '—'}</div>
          </div>
          <div className={styles.adminStatCard}>
            <div className={styles.adminStatLabel}>{t.statThisWeek}</div>
            <div className={`${styles.adminStatValue} ${styles.adminStatValueAccent}`}>
              {stats?.thisWeek ?? '—'}
            </div>
          </div>
          <div className={styles.adminStatCard}>
            <div className={styles.adminStatLabel}>{t.statPersonal}</div>
            <div className={styles.adminStatValue}>{stats?.personal ?? '—'}</div>
          </div>
          <div className={styles.adminStatCard}>
            <div className={styles.adminStatLabel}>{t.statOrganization}</div>
            <div className={styles.adminStatValue}>{stats?.organization ?? '—'}</div>
          </div>
        </div>

        {/* Results: winning rules + counts */}
        <div className={styles.adminPanel}>
          <div className={styles.adminResultsHead}>
            <h3 className={styles.adminPanelTitle}>{t.resultsTitle}</h3>
            {resultCounts && (
              <div className={styles.adminResultChips}>
                {(['winner', 'notWinner', 'pending'] as Result[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`${styles.adminResultBadge} ${styles[`adminResult_${r}`]} ${
                      result === r ? styles.adminResultChipActive : ''
                    }`}
                    onClick={() => setResult(result === r ? '' : r)}
                  >
                    {resultLabel(r)}: <strong>{resultCounts[r]}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
          {settings && (
            <p className={styles.adminPanelHint}>{t.rulesHint(settings.passScore, settings.minJudges)}</p>
          )}
          <div className={styles.adminSettingsRow}>
            <div className={styles.adminFilterGroup}>
              <label htmlFor="passScore">
                {t.passScore} {settings?.maxTotal ?? 100})
              </label>
              <input
                id="passScore"
                type="number"
                min={0}
                max={settings?.maxTotal ?? 100}
                step={0.5}
                value={passScore}
                onChange={(e) => setPassScore(e.target.value)}
              />
            </div>
            <div className={styles.adminFilterGroup}>
              <label htmlFor="minJudges">{t.minJudges}</label>
              <input
                id="minJudges"
                type="number"
                min={1}
                max={50}
                step={1}
                value={minJudges}
                onChange={(e) => setMinJudges(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={styles.adminExportBtn}
              onClick={handleSaveSettings}
              disabled={savingSettings || passScore === '' || minJudges === ''}
            >
              {savingSettings ? t.saving : t.saveSettings}
            </button>
            <div className={styles.adminFilterGroup}>
              <label htmlFor="adminResult">{t.filterResult}</label>
              <select id="adminResult" value={result} onChange={(e) => setResult(e.target.value as '' | Result)}>
                <option value="">{t.filterResultAll}</option>
                <option value="winner">{t.winner}</option>
                <option value="notWinner">{t.notWinner}</option>
                <option value="pending">{t.pending}</option>
              </select>
            </div>
            <div className={styles.adminFilterGroup}>
              <label htmlFor="adminSort">{t.sortBy}</label>
              <select id="adminSort" value={sort} onChange={(e) => setSort(e.target.value as 'date' | 'score')}>
                <option value="date">{t.sortDate}</option>
                <option value="score">{t.sortScore}</option>
              </select>
            </div>
          </div>
          {settingsMsg && (
            <div className={settingsMsg.ok ? styles.adminSuccessMsg : styles.adminErrorMsg}>{settingsMsg.text}</div>
          )}
        </div>

        {/* Filters */}
        <div className={styles.adminFilters}>
          <div className={styles.adminFilterGroup}>
            <label htmlFor="adminSearch">{t.filterSearch}</label>
            <input
              id="adminSearch"
              type="text"
              placeholder={t.filterSearchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.adminFilterGroup}>
            <label htmlFor="adminType">{t.filterType}</label>
            <select
              id="adminType"
              value={type}
              onChange={(e) => setType(e.target.value as ListFilters['type'])}
            >
              <option value="all">{t.filterTypeAll}</option>
              <option value="personal">{t.filterTypePersonal}</option>
              <option value="organization">{t.filterTypeOrg}</option>
            </select>
          </div>
          <div className={styles.adminFilterGroup}>
            <label htmlFor="adminAffiliation">{t.filterAffiliation}</label>
            <select
              id="adminAffiliation"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
            >
              <option value="">{t.filterAffAny}</option>
              <option value="Al-Saraa">Al-Saraa</option>
              <option value="Tahamah">Tahamah</option>
              <option value="السراة">السراة</option>
              <option value="تهامة">تهامة</option>
            </select>
          </div>
          <div className={styles.adminFilterGroup}>
            <label htmlFor="adminFrom">{t.filterFrom}</label>
            <input
              id="adminFrom"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className={styles.adminFilterGroup}>
            <label htmlFor="adminTo">{t.filterTo}</label>
            <input
              id="adminTo"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button
            className={styles.adminExportBtn}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? t.exporting : t.exportBtn}
          </button>
        </div>

        {/* Table */}
        <div className={styles.adminTableWrap}>
          {loading ? (
            <div className={styles.adminLoading}>{t.loading}</div>
          ) : items.length === 0 ? (
            <div className={styles.adminEmpty}>{t.empty}</div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>{t.colDate}</th>
                  <th>{t.colType}</th>
                  <th>{t.colName}</th>
                  <th>{t.colEmail}</th>
                  <th>{t.colPhone}</th>
                  <th>{t.colAffiliation}</th>
                  <th>{t.colScore}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} onClick={() => openDetail(item)}>
                    <td data-label={t.colDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td data-label={t.colType}>
                      <span
                        className={`${styles.adminTypeBadge} ${
                          item.type === 'personal' ? styles.adminTypePersonal : styles.adminTypeOrg
                        }`}
                      >
                        {getBadgeLabel(item)}
                      </span>
                    </td>
                    <td data-label={t.colName}>{item.name}</td>
                    <td data-label={t.colEmail}>{item.email}</td>
                    <td data-label={t.colPhone}>{item.phone}</td>
                    <td data-label={t.colAffiliation}>{item.affiliation || '—'}</td>
                    <td data-label={t.colScore}>
                      {item.evaluation ? (
                        <span className={styles.adminScoreCell}>
                          <ul className={styles.adminJudgeScores}>
                            {item.evaluation.judges.map((j, i) => (
                              <li key={i}>
                                <span>{j.name}</span>
                                <strong>{j.total}</strong>
                              </li>
                            ))}
                          </ul>
                          <span className={styles.adminScoreBadge}>
                            {t.finalAvg}: {item.evaluation.avg}
                            <small> / {item.evaluation.maxTotal}</small>
                          </span>
                          <span className={`${styles.adminResultBadge} ${styles[`adminResult_${item.result}`]}`}>
                            {resultLabel(item.result)}
                            {item.result === 'pending' && settings && (
                              <small> ({t.pendingOf(item.evaluation.count, settings.minJudges)})</small>
                            )}
                          </span>
                        </span>
                      ) : (
                        <span className={styles.adminScoreNone}>{t.notScored}</span>
                      )}
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
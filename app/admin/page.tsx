'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../lib/LanguageContext'
import {
  adminApi,
  clearToken,
  getToken,
  type ApplicationListItem,
  type StatsResponse,
  type ListFilters,
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
  },
}

export default function AdminDashboardPage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()

  useEffect(() => {
    if (!getToken()) router.replace('/admin/login')
  }, [router])

  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [items, setItems] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [type, setType] = useState<ListFilters['type']>('all')
  const [search, setSearch] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, list] = await Promise.all([
        adminApi.stats(),
        adminApi.list({ type, search, affiliation, from, to }),
      ])
      setStats(s)
      setItems(list.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [type, search, affiliation, from, to])

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setTimeout(() => load(), 250)
    return () => clearTimeout(id)
  }, [load])

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
          <button className={styles.adminLogoutBtn} onClick={handleLogout}>
            {t.signOut}
          </button>
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
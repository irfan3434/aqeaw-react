'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLanguage } from '../../../../lib/LanguageContext'
import { adminApi, getToken } from '../../../../lib/adminApi'
import styles from '../../../../components/admin/Admin.module.css'

const content = {
  en: {
    back: '← Back to dashboard',
    backShort: '← Back',
    personalApp: 'Personal Application',
    orgApp: 'Organization Application',
    submitted: 'Submitted',
    id: 'ID',
    notFound: 'Not found',
    invalidType: 'Invalid application type',
    loading: 'Loading…',
    downloadFailed: 'Download failed',
    applicant: 'Applicant',
    fullName: 'Full Name',
    age: 'Age',
    gender: 'Gender',
    email: 'Email',
    phone: 'Phone',
    userType: 'User Type',
    tribeChecked: 'Tribe Checked',
    affiliation: 'Affiliation',
    yes: 'Yes',
    no: 'No',
    referrer: 'Referrer',
    referrerName: 'Full Name',
    referrerAge: 'Age',
    referrerGender: 'Gender',
    referrerEmail: 'Email',
    referrerPhone: 'Phone',
    nominationReason: 'Nomination Reason',
    organization: 'Organization',
    orgName: 'Organization Name',
    owner: 'Owner',
    orgEmail: 'Email',
    orgPhone: 'Phone',
    achievements: 'Achievements',
    noTitle: '(no title)',
    noDescription: '(no description)',
    download: 'Download',
    noFile: 'No file attached',
  },
  ar: {
    back: '→ العودة إلى لوحة الإدارة',
    backShort: '→ رجوع',
    personalApp: 'طلب فردي',
    orgApp: 'طلب كيان / مؤسسة',
    submitted: 'تاريخ التقديم',
    id: 'المعرّف',
    notFound: 'غير موجود',
    invalidType: 'نوع الطلب غير صالح',
    loading: 'جارٍ التحميل…',
    downloadFailed: 'فشل التحميل',
    applicant: 'بيانات المرشح',
    fullName: 'الاسم الكامل',
    age: 'العمر',
    gender: 'الجنس',
    email: 'البريد الإلكتروني',
    phone: 'رقم الجوال',
    userType: 'نوع المستخدم',
    tribeChecked: 'الانتماء القبلي',
    affiliation: 'الانتماء المحدد',
    yes: 'نعم',
    no: 'لا',
    referrer: 'بيانات المُرشِّح',
    referrerName: 'الاسم الكامل',
    referrerAge: 'العمر',
    referrerGender: 'الجنس',
    referrerEmail: 'البريد الإلكتروني',
    referrerPhone: 'رقم الجوال',
    nominationReason: 'مسوغات الترشيح',
    organization: 'معلومات المؤسسة',
    orgName: 'اسم الكيان',
    owner: 'المالك / نوع الكيان',
    orgEmail: 'البريد الإلكتروني',
    orgPhone: 'رقم جوال التواصل',
    achievements: 'الإنجازات',
    noTitle: '(بدون عنوان)',
    noDescription: '(بدون وصف)',
    download: 'تحميل',
    noFile: 'لا يوجد ملف مرفق',
  },
}

interface Achievement {
  title?: string
  description?: string
  file?: {
    filename?: string
    originalName?: string
    mimeType?: string
    size?: number
  }
}

interface Referrer {
  fullName?: string
  age?: number
  gender?: string
  email?: string
  phone?: string
  nominationReason?: string
}

interface ApplicationDoc {
  _id: string
  createdAt?: string
  userType?: string
  fullName?: string
  age?: number
  gender?: string
  email?: string
  phone?: string
  tribeChecked?: boolean
  specificAffiliation?: string
  referrer?: Referrer
  organizationName?: string
  ownerName?: string
  organizationEmail?: string
  organizationNumber?: string
  achievements?: Achievement[]
}

export default function ApplicationDetailPage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()
  const params = useParams<{ type: string; id: string }>()
  const [doc, setDoc] = useState<ApplicationDoc | null>(null)
  const [docType, setDocType] = useState<'personal' | 'organization' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin/login')
      return
    }
    const tp = params.type as 'personal' | 'organization'
    if (tp !== 'personal' && tp !== 'organization') {
      setError(t.invalidType)
      setLoading(false)
      return
    }
    adminApi
      .detail(tp, params.id)
      .then((r) => {
        setDoc(r.doc as unknown as ApplicationDoc)
        setDocType(r.type)
      })
      .catch((e) => setError(e instanceof Error ? e.message : t.notFound))
      .finally(() => setLoading(false))
  }, [params.id, params.type, router, t.invalidType, t.notFound])

  const handleDownload = async (filename: string) => {
    try {
      await adminApi.downloadFile(filename)
    } catch (e) {
      alert(`${t.downloadFailed}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (loading) {
    return (
      <div className={styles.adminDetailPage}>
        <div className={styles.adminDetailCard}>{t.loading}</div>
      </div>
    )
  }

  if (error || !doc || !docType) {
    return (
      <div className={styles.adminDetailPage}>
        <div className={styles.adminDetailCard}>
          <button className={styles.adminDetailBack} onClick={() => router.back()}>
            {t.backShort}
          </button>
          <div className={styles.adminErrorMsg}>{error || t.notFound}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.adminDetailPage}>
      <button className={styles.adminDetailBack} onClick={() => router.push('/admin')}>
        {t.back}
      </button>

      <div className={styles.adminDetailCard}>
        <h2>
          {docType === 'personal' ? doc.fullName : doc.organizationName}
        </h2>
        <div className={styles.adminDetailMeta}>
          {docType === 'personal' ? t.personalApp : t.orgApp}
          {' · '}
          {t.submitted} {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—'}
          {' · '}
          {t.id}: {doc._id}
        </div>

        {docType === 'personal' && (
          <>
            <div className={styles.adminDetailSection}>
              <h3>{t.applicant}</h3>
              <dl className={styles.adminDetailGrid}>
                <dt>{t.fullName}</dt><dd>{doc.fullName || '—'}</dd>
                <dt>{t.age}</dt><dd>{doc.age ?? '—'}</dd>
                <dt>{t.gender}</dt><dd>{doc.gender || '—'}</dd>
                <dt>{t.email}</dt><dd>{doc.email || '—'}</dd>
                <dt>{t.phone}</dt><dd>{doc.phone || '—'}</dd>
                <dt>{t.userType}</dt><dd>{doc.userType || '—'}</dd>
                <dt>{t.tribeChecked}</dt><dd>{doc.tribeChecked ? t.yes : t.no}</dd>
                <dt>{t.affiliation}</dt><dd>{doc.specificAffiliation || '—'}</dd>
              </dl>
            </div>

            {doc.userType === 'referral' && doc.referrer && (
              <div className={styles.adminDetailSection}>
                <h3>{t.referrer}</h3>
                <dl className={styles.adminDetailGrid}>
                  <dt>{t.referrerName}</dt><dd>{doc.referrer.fullName || '—'}</dd>
                  <dt>{t.referrerAge}</dt><dd>{doc.referrer.age ?? '—'}</dd>
                  <dt>{t.referrerGender}</dt><dd>{doc.referrer.gender || '—'}</dd>
                  <dt>{t.referrerEmail}</dt><dd>{doc.referrer.email || '—'}</dd>
                  <dt>{t.referrerPhone}</dt><dd>{doc.referrer.phone || '—'}</dd>
                  <dt>{t.nominationReason}</dt>
                  <dd style={{ whiteSpace: 'pre-wrap' }}>
                    {doc.referrer.nominationReason || '—'}
                  </dd>
                </dl>
              </div>
            )}
          </>
        )}

        {docType === 'organization' && (
          <div className={styles.adminDetailSection}>
            <h3>{t.organization}</h3>
            <dl className={styles.adminDetailGrid}>
              <dt>{t.orgName}</dt><dd>{doc.organizationName || '—'}</dd>
              <dt>{t.owner}</dt><dd>{doc.ownerName || '—'}</dd>
              <dt>{t.orgEmail}</dt><dd>{doc.organizationEmail || '—'}</dd>
              <dt>{t.orgPhone}</dt><dd>{doc.organizationNumber || '—'}</dd>
            </dl>
          </div>
        )}

        <div className={styles.adminDetailSection}>
          <h3>{t.achievements} ({doc.achievements?.length ?? 0})</h3>
          {(doc.achievements ?? []).map((a, i) => (
            <div key={i} className={styles.adminAchievement}>
              <h4>{i + 1}. {a.title || t.noTitle}</h4>
              <p>{a.description || t.noDescription}</p>
              {a.file?.filename ? (
                <button
                  className={styles.adminFileBtn}
                  onClick={() => handleDownload(a.file!.filename!)}
                >
                  📎 {t.download} {a.file.originalName || a.file.filename}
                  {a.file.size ? ` (${Math.round(a.file.size / 1024)} KB)` : ''}
                </button>
              ) : (
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{t.noFile}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
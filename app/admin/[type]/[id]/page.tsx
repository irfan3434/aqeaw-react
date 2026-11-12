'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLanguage } from '../../../../lib/LanguageContext'
import { adminApi, guardRole, weightedScore, type AdminEvaluation, type Criterion, type Result } from '../../../../lib/adminApi'
import styles from '../../../../components/admin/Admin.module.css'
import { affiliationLabel } from '../../../../lib/affiliations'

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
    code: 'Judging code',
    evaluations: 'Judges’ evaluations',
    average: 'Final average',
    results: { winner: '🏆 Winner', notWinner: '✗ Lost', pending: 'Still being judged' },
    noEvaluations: 'No judge has scored this application yet.',
    judge: 'Judge',
    total: 'Total',
    comment: 'Comment',
    deleteEval: 'Delete',
    deleteAll: 'Delete all evaluations',
    confirmDelete: (n: string) => `Delete ${n}'s evaluation? It will also be removed from the judge's page, and they can score this candidate again.`,
    confirmDeleteAll: (n: number) => `Delete all ${n} evaluations of this candidate? They will also be removed from the judges' pages.`,
    deleted: 'Evaluation deleted.',
    deletedAll: 'All evaluations deleted.',
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
    code: 'رمز التحكيم',
    evaluations: 'تقييمات المحكّمين',
    average: 'المعدل النهائي',
    results: { winner: '🏆 فائز', notWinner: '✗ خسران', pending: 'قيد التحكيم' },
    noEvaluations: 'لم يقيّم أي محكّم هذا الطلب بعد.',
    judge: 'المحكّم',
    total: 'المجموع',
    comment: 'ملاحظات',
    deleteEval: 'حذف',
    deleteAll: 'حذف كل التقييمات',
    confirmDelete: (n: string) => `حذف تقييم ${n}؟ سيُحذف أيضاً من صفحة المحكّم، ويستطيع تقييم هذا المرشح من جديد.`,
    confirmDeleteAll: (n: number) => `حذف جميع تقييمات هذا المرشح (${n})؟ ستُحذف أيضاً من صفحات المحكّمين.`,
    deleted: 'تم حذف التقييم.',
    deletedAll: 'تم حذف جميع التقييمات.',
  },
}

interface Achievement {
  title?: string
  description?: string
  file?: {
    fileId?: string
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
  const [code, setCode] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [maxTotal, setMaxTotal] = useState(100)
  const [evaluations, setEvaluations] = useState<AdminEvaluation[]>([])
  const [result, setResult] = useState<Result>('pending')
  const [evalMsg, setEvalMsg] = useState('')
  const [evalErr, setEvalErr] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Delete, then reload the evaluations and result from the server.
  const runDelete = async (fn: () => Promise<unknown>, success: string) => {
    if (!docType) return
    setEvalMsg('')
    setEvalErr('')
    setDeleting(true)
    try {
      await fn()
      const r = await adminApi.detail(docType, params.id)
      setEvaluations(r.evaluations)
      setResult(r.result)
      setEvalMsg(success)
    } catch (e) {
      setEvalErr(e instanceof Error ? e.message : String(e))
    } finally {
      setDeleting(false)
    }
  }

  const onDeleteEval = (e: AdminEvaluation) => {
    if (window.confirm(t.confirmDelete(e.judgeName))) runDelete(() => adminApi.deleteEvaluation(e._id), t.deleted)
  }

  const onDeleteAll = () => {
    if (docType && window.confirm(t.confirmDeleteAll(evaluations.length))) {
      runDelete(() => adminApi.deleteAllEvaluations(docType, params.id), t.deletedAll)
    }
  }

  useEffect(() => {
    if (!guardRole('admin', router.replace)) return
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
        setCode(r.code)
        setCriteria(r.criteria)
        setMaxTotal(r.maxTotal)
        setEvaluations(r.evaluations)
        setResult(r.result)
      })
      .catch((e) => setError(e instanceof Error ? e.message : t.notFound))
      .finally(() => setLoading(false))
  }, [params.id, params.type, router, t.invalidType, t.notFound])

  const handleDownload = async (fileId: string, originalName?: string) => {
    try {
      await adminApi.downloadFile(fileId, originalName)
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
        <h2>{docType === 'personal' ? doc.fullName : doc.organizationName}</h2>
        <div className={styles.adminDetailMeta}>
          {docType === 'personal' ? t.personalApp : t.orgApp}
          {' · '}
          {t.submitted} {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—'}
          {' · '}
          {t.id}: {doc._id}
          {code && <>{' · '}{t.code}: <strong>{code}</strong></>}
        </div>

        <div className={styles.adminDetailSection}>
          <h3>
            {t.evaluations}
            {evaluations.length > 0 && (
              <span className={styles.adminScoreBadge} style={{ marginInlineStart: 10 }}>
                {t.average}:{' '}
                {Math.round((evaluations.reduce((s, e) => s + e.total, 0) / evaluations.length) * 10) / 10}
                <small> / {maxTotal}</small>
              </span>
            )}
            <span
              className={`${styles.adminResultBadge} ${styles[`adminResult_${result}`]}`}
              style={{ marginInlineStart: 8 }}
            >
              {t.results[result]}
            </span>
          </h3>
          {evaluations.length > 1 && (
            <button
              type="button"
              className={`${styles.adminSmallBtn} ${styles.adminDangerBtn}`}
              onClick={onDeleteAll}
              disabled={deleting}
              style={{ marginBottom: 10 }}
            >
              🗑 {t.deleteAll}
            </button>
          )}
          {evalMsg && <div className={styles.adminSuccessMsg}>✓ {evalMsg}</div>}
          {evalErr && <div className={styles.adminErrorMsg}>{evalErr}</div>}
          {evaluations.length === 0 ? (
            <div className={styles.adminScoreNone}>{t.noEvaluations}</div>
          ) : (
            <div className={styles.adminEvalTableWrap}>
              <table className={styles.adminEvalTable}>
                <thead>
                  <tr>
                    <th>{t.judge}</th>
                    {criteria.map((c) => (
                      <th key={c.key} title={c[lang].hint}>
                        {c[lang].label}
                        <small> /{c.max}</small>
                      </th>
                    ))}
                    <th>{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((e) => (
                    <tr key={e._id}>
                      <td>
                        <strong>{e.judgeName}</strong>
                        <div className={styles.adminScoreCount}>
                          {new Date(e.updatedAt).toLocaleDateString()}
                        </div>
                        {e.comment && (
                          <div className={styles.adminEvalComment}>
                            {t.comment}: {e.comment}
                          </div>
                        )}
                        <button
                          type="button"
                          className={`${styles.adminSmallBtn} ${styles.adminDangerBtn}`}
                          onClick={() => onDeleteEval(e)}
                          disabled={deleting}
                          style={{ marginTop: 6 }}
                        >
                          🗑 {t.deleteEval}
                        </button>
                      </td>
                      {criteria.map((c) => (
                        <td key={c.key}>
                          {e.scores[c.key] != null ? (
                            <>
                              <strong>{weightedScore(c, e.scores[c.key])}</strong>
                              <div className={styles.adminScoreCount} dir="ltr">
                                ({e.scores[c.key]} / {c.scale || 5})
                              </div>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                      ))}
                      <td>
                        <span className={styles.adminScoreBadge}>
                          {e.total}
                          <small> / {e.maxTotal}</small>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                <dt>{t.affiliation}</dt>
                <dd>{affiliationLabel(doc.specificAffiliation, lang) || '—'}</dd>
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
                  <dd style={{ whiteSpace: 'pre-wrap' }}>{doc.referrer.nominationReason || '—'}</dd>
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
              {a.file?.fileId ? (
  <button
    className={styles.adminFileBtn}
    onClick={() => handleDownload(a.file!.fileId!, a.file!.originalName)}
  >
    📎 {t.download} {a.file.originalName || a.file.filename || 'file'}
    {a.file.size ? ` (${Math.round(a.file.size / 1024)} KB)` : ''}
  </button>
) : a.file?.filename ? (
  <span style={{ color: '#92400e', fontSize: '0.85rem' }}>
    ⚠️ {a.file.originalName || a.file.filename}
    {' — '}
    {lang === 'ar'
      ? 'تم تقديم الملف لكنه غير متاح للتحميل (طلب قديم)'
      : 'File was submitted but is no longer downloadable (legacy submission)'}
  </span>
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
'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/LanguageContext'
import { guardRole, judgeApi, type JudgeDetailResponse } from '../../../lib/adminApi'
import styles from '../../../components/admin/Admin.module.css'

const content = {
  en: {
    back: '← Back to candidates',
    candidate: 'Candidate',
    privacy: 'Identity and category are hidden. Names found in the text are replaced with ■■■.',
    reason: 'Additional statement',
    achievements: 'Achievements',
    noTitle: '(no title)',
    noDescription: '(no description)',
    download: 'Download attachment',
    noFile: 'No attachment',
    legacyFile: 'Attachment not available (older submission)',
    scoring: 'Your evaluation',
    rateHint: 'Drag the slider, type a number from 1 to 5, or pick the rating name — then submit your evaluation. You can submit only once.',
    ratingNames: ['Weak', 'Fair', 'Good', 'Very good', 'Excellent'],
    choose: 'Choose…',
    comment: 'Comments (optional)',
    commentPlaceholder: 'Reasons for your scores, strengths, notes…',
    submit: 'Submit evaluation',
    saving: 'Saving…',
    saved: 'Your evaluation was saved and sent to the administration.',
    confirm: 'Submit this evaluation? You will not be able to change it afterwards.',
    locked: 'You have already evaluated this candidate. The evaluation cannot be changed.',
    lastSaved: 'Submitted on',
    incomplete: 'Please score every criterion.',
    loading: 'Loading…',
    notFound: 'Candidate not found',
    downloadFailed: 'Download failed',
  },
  ar: {
    back: '→ العودة إلى قائمة المرشحين',
    candidate: 'المرشح',
    privacy: 'بيانات الهوية والفئة مخفية، والأسماء الموجودة داخل النص تُستبدل بـ ■■■.',
    reason: 'نبذة إضافية',
    achievements: 'الإنجازات',
    noTitle: '(بدون عنوان)',
    noDescription: '(بدون وصف)',
    download: 'تحميل المرفق',
    noFile: 'لا يوجد مرفق',
    legacyFile: 'المرفق غير متاح (طلب قديم)',
    scoring: 'تقييمك',
    rateHint: 'اسحب الخط، أو اكتب رقماً من 1 إلى 5، أو اختر اسم التقدير، ثم ارفع التقييم. يمكنك رفع التقييم مرة واحدة فقط.',
    ratingNames: ['ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'],
    choose: 'اختر…',
    comment: 'ملاحظات (اختياري)',
    commentPlaceholder: 'أسباب التقييم، نقاط القوة، ملاحظات…',
    submit: 'رفع التقييم',
    saving: 'جارٍ الحفظ…',
    saved: 'تم حفظ تقييمك وإرساله إلى الإدارة.',
    confirm: 'هل تريد رفع هذا التقييم؟ لن تتمكن من تعديله بعد ذلك.',
    locked: 'لقد قيّمت هذا المرشح مسبقاً، ولا يمكن تعديل التقييم.',
    lastSaved: 'تاريخ الرفع',
    incomplete: 'يرجى تقييم جميع المعايير.',
    loading: 'جارٍ التحميل…',
    notFound: 'المرشح غير موجود',
    downloadFailed: 'فشل التحميل',
  },
}

export default function JudgeEvaluatePage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()
  const params = useParams<{ ref: string }>()

  const [data, setData] = useState<JudgeDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scores, setScores] = useState<Record<string, string>>({})
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!guardRole('judge', router.replace)) return
    judgeApi
      .detail(params.ref)
      .then((r) => {
        setData(r)
        if (r.myEvaluation) {
          setScores(Object.fromEntries(Object.entries(r.myEvaluation.scores).map(([k, v]) => [k, String(v)])))
          setComment(r.myEvaluation.comment)
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : t.notFound))
      .finally(() => setLoading(false))
  }, [params.ref, router, t.notFound])

  const complete = data?.criteria.every((c) => /^[1-9]$/.test(scores[c.key] ?? '') && Number(scores[c.key]) <= (c.scale || 5)) ?? false

  // Keep only whole numbers 1–5 (or empty while typing).
  const setRating = (key: string, raw: string) => {
    const max = data?.criteria.find((c) => c.key === key)?.scale || 5
    const digits = raw.replace(/\D/g, '').slice(-1)
    const value = digits === '' ? '' : String(Math.min(Math.max(Number(digits), 1), max))
    setScores((s) => ({ ...s, [key]: value }))
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!data || data.myEvaluation) return
    setFormError('')
    setSaved('')
    if (!complete) {
      setFormError(t.incomplete)
      return
    }
    if (!window.confirm(t.confirm)) return
    setSaving(true)
    try {
      const r = await judgeApi.submit(data.ref, {
        scores: Object.fromEntries(data.criteria.map((c) => [c.key, Number(scores[c.key])])),
        comment,
      })
      setData({ ...data, myEvaluation: r.evaluation })
      setSaved(t.saved)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.adminDetailPage}>
        <div className={styles.adminDetailCard}>{t.loading}</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.adminDetailPage}>
        <div className={styles.adminDetailCard}>
          <button className={styles.adminDetailBack} onClick={() => router.push('/judge')}>
            {t.back}
          </button>
          <div className={styles.adminErrorMsg}>{error || t.notFound}</div>
        </div>
      </div>
    )
  }

  const locked = Boolean(data.myEvaluation)

  return (
    <div className={styles.adminDetailPage}>
      <button className={styles.adminDetailBack} onClick={() => router.push('/judge')}>
        {t.back}
      </button>

      <div className={styles.adminDetailCard}>
        <h2>
          {t.candidate} <span className={styles.adminCode}>{data.code}</span>
        </h2>
        <div className={styles.adminDetailMeta}>
          <div className={styles.adminPrivacyNote}>🔒 {t.privacy}</div>
        </div>

        {data.nominationReason && (
          <div className={styles.adminDetailSection}>
            <h3>{t.reason}</h3>
            <div className={styles.adminAchievement}>
              <p>{data.nominationReason}</p>
            </div>
          </div>
        )}

        <div className={styles.adminDetailSection}>
          <h3>{t.achievements} ({data.achievements.length})</h3>
          {data.achievements.map((a) => (
            <div key={a.index} className={styles.adminAchievement}>
              <h4>{a.index + 1}. {a.title || t.noTitle}</h4>
              <p>{a.description || t.noDescription}</p>
              {a.file?.available ? (
                <button
                  className={styles.adminFileBtn}
                  onClick={() =>
                    judgeApi.downloadFile(data.ref, a.index).catch((e) =>
                      alert(`${t.downloadFailed}: ${e instanceof Error ? e.message : String(e)}`)
                    )
                  }
                >
                  📎 {t.download} {a.file.ext ? `(${a.file.ext.replace('.', '').toUpperCase()})` : ''}
                  {a.file.size ? ` · ${Math.round(a.file.size / 1024)} KB` : ''}
                </button>
              ) : (
                <span className={styles.adminScoreNone}>{a.file ? t.legacyFile : t.noFile}</span>
              )}
            </div>
          ))}
        </div>

        <form className={styles.adminDetailSection} onSubmit={onSubmit}>
          <h3>{t.scoring}</h3>
          {locked ? (
            <div className={styles.adminPrivacyNote}>🔒 {t.locked}</div>
          ) : (
            <p className={styles.adminPanelHint}>{t.rateHint}</p>
          )}
          {/* After submitting, every field is read-only */}
          <fieldset disabled={locked} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          <div className={styles.adminCriteria}>
            {data.criteria.map((c) => (
              <div key={c.key} className={styles.adminCriterion}>
                <div className={styles.adminCriterionText}>
                  <label id={`c-${c.key}`}>{c[lang].label}</label>
                  <small>{c[lang].hint}</small>
                </div>
                <div className={styles.adminCriterionInput}>
                  {/* Slider */}
                  <input
                    type="range"
                    min={1}
                    max={c.scale || 5}
                    step={1}
                    value={scores[c.key] || Math.ceil((c.scale || 5) / 2)}
                    className={scores[c.key] ? '' : styles.adminRangeUnset}
                    onChange={(e) => setRating(c.key, e.target.value)}
                    aria-labelledby={`c-${c.key}`}
                  />
                  {/* Type the number */}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={c.scale || 5}
                    step={1}
                    value={scores[c.key] ?? ''}
                    placeholder="—"
                    onChange={(e) => setRating(c.key, e.target.value)}
                    aria-labelledby={`c-${c.key}`}
                  />
                  {/* Or choose by name */}
                  <select
                    className={styles.adminRatingSelect}
                    value={scores[c.key] ?? ''}
                    onChange={(e) => setRating(c.key, e.target.value)}
                    aria-labelledby={`c-${c.key}`}
                  >
                    <option value="" disabled>
                      {t.choose}
                    </option>
                    {t.ratingNames.slice(0, c.scale || 5).map((name, i) => (
                      <option key={name} value={String(i + 1)}>
                        {i + 1} — {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.adminFilterGroup} style={{ marginTop: 16 }}>
            <label htmlFor="evalComment">{t.comment}</label>
            <textarea
              id="evalComment"
              className={styles.adminTextarea}
              rows={4}
              maxLength={3000}
              value={comment}
              placeholder={t.commentPlaceholder}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          </fieldset>

          <div className={styles.adminSubmitRow}>
            {!locked && (
              <button type="submit" className={styles.adminExportBtn} disabled={saving}>
                {saving ? t.saving : t.submit}
              </button>
            )}
            {data.myEvaluation && (
              <span className={styles.adminScoreCount}>
                {t.lastSaved}: {new Date(data.myEvaluation.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
          {saved && <div className={styles.adminSuccessMsg}>✓ {saved}</div>}
          {formError && <div className={styles.adminErrorMsg}>{formError}</div>}
        </form>
      </div>
    </div>
  )
}

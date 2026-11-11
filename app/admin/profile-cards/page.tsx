'use client'

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../../../lib/LanguageContext'
import {
  adminApi,
  guardRole,
  profileCardPhotoSrc,
  type ProfileCardBody,
  type ProfileCardFields,
  type ProfileCardItem,
} from '../../../lib/adminApi'
import ProfileCard, { PROFILE_CARD_DEFAULTS } from '../../../components/ProfileCard/ProfileCard'
import styles from '../../../components/admin/Admin.module.css'
import pc from '../../../components/admin/ProfileCardsAdmin.module.css'

const content = {
  en: {
    title: 'Profile cards',
    back: '← Back to dashboard',
    hint: 'Published cards appear on the homepage in the Award Winners section, in the order shown here. Drafts are only visible to admins.',
    add: '+ Add card',
    loading: 'Loading…',
    empty: 'No cards yet. Click "Add card" to create the first one.',
    published: 'Published',
    draft: 'Draft',
    edit: 'Edit',
    publish: 'Publish',
    unpublish: 'Unpublish',
    remove: 'Delete',
    up: '↑',
    down: '↓',
    confirmDelete: (n: string) => `Delete the card "${n}"? This cannot be undone.`,
    newTitle: 'New card',
    editTitle: 'Edit card',
    photo: 'Photo',
    choosePhoto: 'Choose photo',
    removePhoto: 'Remove photo',
    cutout: 'No background',
    circle: 'In a circle',
    photoHint: 'A transparent PNG (person without background) gives the original look. Any normal photo works with "In a circle".',
    tag: 'Word in the blue corner',
    rank: 'Rank or title (above the name in the gold ribbon)',
    rname: 'Name in the gold ribbon',
    h1: 'Main headline (first line)',
    h2: 'Gold line',
    p1: 'First paragraph',
    p2: 'Second paragraph',
    richHint: 'Put words between **two stars** to make them bold.',
    foot: 'Name in the bottom bar',
    navy: 'Blue colour',
    gold: 'Gold colour',
    footc: 'Bottom bar colour',
    publishNow: 'Show in the Award Winners section',
    save: 'Save card',
    saving: 'Saving…',
    cancel: 'Cancel',
    saved: 'Card saved.',
    deleted: 'Card deleted.',
    photoError: 'Could not read this image. Try a PNG or JPEG file.',
  },
  ar: {
    title: 'بطاقات التعريف',
    back: '→ العودة إلى لوحة الإدارة',
    hint: 'البطاقات المنشورة تظهر في الصفحة الرئيسية ضمن قسم «الفائزون بجائزة عايض القرني» بنفس الترتيب هنا. المسودات يراها المسؤولون فقط.',
    add: '+ إضافة بطاقة',
    loading: 'جارٍ التحميل…',
    empty: 'لا توجد بطاقات بعد. اضغط «إضافة بطاقة» لإنشاء أول بطاقة.',
    published: 'منشورة',
    draft: 'مسودة',
    edit: 'تعديل',
    publish: 'نشر',
    unpublish: 'إلغاء النشر',
    remove: 'حذف',
    up: '↑',
    down: '↓',
    confirmDelete: (n: string) => `حذف بطاقة "${n}"؟ لا يمكن التراجع عن ذلك.`,
    newTitle: 'بطاقة جديدة',
    editTitle: 'تعديل البطاقة',
    photo: 'الصورة',
    choosePhoto: 'اختيار صورة',
    removePhoto: 'إزالة الصورة',
    cutout: 'بدون خلفية',
    circle: 'داخل دائرة',
    photoHint: 'صورة PNG شفافة (الشخص بدون خلفية) تعطي نفس شكل التصميم. أي صورة عادية تعمل بخيار «داخل دائرة».',
    tag: 'الكلمة في الجزء الأزرق',
    rank: 'الرتبة أو المسمى (فوق الاسم في الشريط الذهبي)',
    rname: 'الاسم في الشريط الذهبي',
    h1: 'العنوان الرئيسي (السطر الأول)',
    h2: 'السطر الذهبي',
    p1: 'الفقرة الأولى',
    p2: 'الفقرة الثانية',
    richHint: 'ضع الكلمات بين **نجمتين** لتظهر بخط عريض.',
    foot: 'الاسم في الشريط الأسفل',
    navy: 'اللون الأزرق',
    gold: 'اللون الذهبي',
    footc: 'لون الشريط الأسفل',
    publishNow: 'إظهارها في قسم الفائزين',
    save: 'حفظ البطاقة',
    saving: 'جارٍ الحفظ…',
    cancel: 'إلغاء',
    saved: 'تم حفظ البطاقة.',
    deleted: 'تم حذف البطاقة.',
    photoError: 'تعذرت قراءة الصورة. جرّب ملف PNG أو JPEG.',
  },
}

type Draft = ProfileCardFields & { photoSrc: string }

/** Draft being edited. id = null means a new card. photo: undefined = unchanged. */
interface Editing {
  id: string | null
  draft: Draft
  photo?: string
}

const TEXT_FIELDS = ['tag', 'rank', 'rname', 'h1', 'h2'] as const

/**
 * Stop the browser and keyboard from suggesting or swapping words,
 * so the field keeps exactly what the admin typed.
 * A unique, meaningless name stops browsers from reusing values typed in other forms.
 */
function noSuggest(key: string) {
  return {
    name: `pc-field-${key}-nofill`,
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'off',
    spellCheck: false,
    'data-lpignore': 'true',
    'data-form-type': 'other',
  } as const
}

function newDraft(order: number): Draft {
  return { ...PROFILE_CARD_DEFAULTS, published: false, order, photoSrc: '' }
}

function fromItem(c: ProfileCardItem): Draft {
  const { tag, rank, rname, h1, h2, p1, p2, foot, mode, variant, navy, gold, footc, published, order } = c
  return { tag, rank, rname, h1, h2, p1, p2, foot, mode, variant, navy, gold, footc, published, order, photoSrc: profileCardPhotoSrc(c.photoUrl) }
}

/** Shrink the picked image to max 900px; keep transparency for PNG/WebP. */
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('bad image'))
      img.onload = () => {
        const k = Math.min(1, 900 / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * k)
        canvas.height = Math.round(img.height * k)
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const keepAlpha = file.type === 'image/png' || file.type === 'image/webp'
        resolve(keepAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.88))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function ProfileCardsAdminPage() {
  const { lang } = useLanguage()
  const t = content[lang]
  const router = useRouter()

  const [cards, setCards] = useState<ProfileCardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<Editing | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await adminApi.profileCards()
      setCards(r.cards)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!guardRole('admin', router.replace)) return
    load()
  }, [router, load])

  const run = async (fn: () => Promise<unknown>, success = '') => {
    setError('')
    setNotice('')
    try {
      await fn()
      if (success) setNotice(success)
      await load()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setEditing((ed) => (ed ? { ...ed, draft: { ...ed.draft, [key]: value } } : ed))

  const onPickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await readPhoto(file)
      setEditing((ed) => (ed ? { ...ed, photo: dataUrl, draft: { ...ed.draft, photoSrc: dataUrl } } : ed))
    } catch {
      setError(t.photoError)
    }
  }

  const onRemovePhoto = () =>
    setEditing((ed) => (ed ? { ...ed, photo: '', draft: { ...ed.draft, photoSrc: '' } } : ed))

  const onSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    const { photoSrc: _ignored, ...fields } = editing.draft
    void _ignored
    const body: ProfileCardBody = { ...fields }
    if (editing.photo !== undefined) body.photo = editing.photo
    const ok = await run(
      () => (editing.id ? adminApi.updateProfileCard(editing.id, body) : adminApi.createProfileCard(body)),
      t.saved
    )
    setSaving(false)
    if (ok) {
      setEditing(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  /** Swap order with the neighbour. Orders are renumbered 0..n so they stay unique. */
  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= cards.length) return
    const next = [...cards]
    ;[next[index], next[j]] = [next[j], next[index]]
    run(() =>
      Promise.all(
        next.map((c, i) => (c.order === i ? null : adminApi.updateProfileCard(c._id, { order: i }))).filter(Boolean)
      )
    )
  }

  const startNew = () => {
    setNotice('')
    setEditing({ id: null, draft: newDraft(cards.length) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startEdit = (c: ProfileCardItem) => {
    setNotice('')
    setEditing({ id: c._id, draft: fromItem(c) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const d = editing?.draft

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminContainer}>
        <button className={styles.adminDetailBack} onClick={() => router.push('/admin')}>
          {t.back}
        </button>
        <div className={styles.adminHeader}>
          <h1>{t.title}</h1>
        </div>

        {notice && <div className={styles.adminSuccessMsg}>{notice}</div>}
        {error && <div className={styles.adminErrorMsg}>{error}</div>}

        {editing && d && (
          <div className={styles.adminPanel}>
            <h3 className={styles.adminPanelTitle}>{editing.id ? t.editTitle : t.newTitle}</h3>
            <div className={pc.editor}>
              <div className={pc.preview}>
                <ProfileCard card={d} photoSrc={d.photoSrc} />
              </div>

              <form className={pc.form} onSubmit={onSave}>
                <div className={styles.adminFilterGroup}>
                  <label>{t.photo}</label>
                  <div className={pc.photoRow}>
                    <label className={`${styles.adminExportBtn} ${pc.fileBtn}`}>
                      {t.choosePhoto}
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickPhoto} />
                    </label>
                    {d.photoSrc && (
                      <button type="button" className={styles.adminSmallBtn} onClick={onRemovePhoto}>
                        {t.removePhoto}
                      </button>
                    )}
                    <div className={pc.seg} role="radiogroup" aria-label={t.photo}>
                      {(['cutout', 'circle'] as const).map((m) => (
                        <label key={m}>
                          <input type="radio" name="mode" checked={d.mode === m} onChange={() => set('mode', m)} />
                          {t[m]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className={pc.hint}>{t.photoHint}</p>
                </div>

                {TEXT_FIELDS.map((k) => (
                  <div key={k} className={styles.adminFilterGroup}>
                    <label htmlFor={`pc-${k}`}>{t[k]}</label>
                    <input id={`pc-${k}`} dir="rtl" value={d[k]} onChange={(e) => set(k, e.target.value)} {...noSuggest(k)} />
                  </div>
                ))}

                {(['p1', 'p2'] as const).map((k) => (
                  <div key={k} className={styles.adminFilterGroup}>
                    <label htmlFor={`pc-${k}`}>{t[k]}</label>
                    <textarea id={`pc-${k}`} dir="rtl" value={d[k]} onChange={(e) => set(k, e.target.value)} {...noSuggest(k)} />
                  </div>
                ))}
                <p className={pc.hint}>{t.richHint}</p>

                <div className={pc.row}>
                  {(['navy', 'gold'] as const).map((k) => (
                    <div key={k} className={styles.adminFilterGroup}>
                      <label htmlFor={`pc-${k}`}>{t[k]}</label>
                      <input id={`pc-${k}`} type="color" value={d[k]} onChange={(e) => set(k, e.target.value)} />
                    </div>
                  ))}
                </div>

                <label className={pc.check}>
                  <input type="checkbox" checked={d.published} onChange={(e) => set('published', e.target.checked)} />
                  {t.publishNow}
                </label>

                <div className={pc.formActions}>
                  <button type="submit" className={styles.adminExportBtn} disabled={saving}>
                    {saving ? t.saving : t.save}
                  </button>
                  <button type="button" className={styles.adminSmallBtn} onClick={() => setEditing(null)} disabled={saving}>
                    {t.cancel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={styles.adminPanel}>
          <div className={pc.toolbar}>
            <p className={styles.adminPanelHint}>{t.hint}</p>
            {!editing && (
              <button className={styles.adminExportBtn} onClick={startNew}>
                {t.add}
              </button>
            )}
          </div>

          {loading ? (
            <div className={styles.adminLoading}>{t.loading}</div>
          ) : cards.length === 0 ? (
            <div className={pc.empty}>{t.empty}</div>
          ) : (
            <div className={pc.grid}>
              {cards.map((c, i) => (
                <div key={c._id} className={pc.item}>
                  <ProfileCard card={c} photoSrc={profileCardPhotoSrc(c.photoUrl)} />
                  <div className={pc.itemMeta}>
                    <span className={c.published ? styles.adminStatusOn : styles.adminStatusOff}>
                      {c.published ? t.published : t.draft}
                    </span>
                    <span>#{i + 1}</span>
                  </div>
                  <div className={pc.itemActions}>
                    <button className={styles.adminSmallBtn} onClick={() => startEdit(c)}>
                      {t.edit}
                    </button>
                    <button
                      className={styles.adminSmallBtn}
                      onClick={() => run(() => adminApi.updateProfileCard(c._id, { published: !c.published }))}
                    >
                      {c.published ? t.unpublish : t.publish}
                    </button>
                    <button className={styles.adminSmallBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                      {t.up}
                    </button>
                    <button
                      className={styles.adminSmallBtn}
                      onClick={() => move(i, 1)}
                      disabled={i === cards.length - 1}
                      aria-label="Move down"
                    >
                      {t.down}
                    </button>
                    <button
                      className={`${styles.adminSmallBtn} ${styles.adminDangerBtn}`}
                      onClick={() => {
                        if (window.confirm(t.confirmDelete(c.rname || c.foot || '—'))) {
                          if (editing?.id === c._id) setEditing(null)
                          run(() => adminApi.deleteProfileCard(c._id), t.deleted)
                        }
                      }}
                    >
                      {t.remove}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

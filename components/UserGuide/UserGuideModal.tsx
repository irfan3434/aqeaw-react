'use client'

import { useCallback, useEffect, useRef } from 'react'

import { useLanguage } from '../../lib/LanguageContext'
import { streamIframeSrc } from '../../lib/userGuide'
import styles from './UserGuideModal.module.css'

const text = {
  en: { title: 'User Guide', close: 'Close' },
  ar: { title: 'دليل المستخدم', close: 'إغلاق' },
}

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * The guide video, played in place rather than in a new tab so the visitor
 * stays on the award's site.
 *
 * The iframe is mounted only while the modal is open, so a visitor who never
 * opens it pays nothing: no player script, no poster image, no manifest
 * request.
 */
export default function UserGuideModal({ open, onClose }: Props) {
  const { lang } = useLanguage()
  const t = text[lang]

  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const focusable = useCallback((): HTMLElement[] => {
    const root = dialogRef.current
    if (!root) return []
    return Array.from(
      root.querySelectorAll<HTMLElement>('button, iframe, a[href], [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute('disabled'))
  }, [])

  useEffect(() => {
    if (!open) return

    // Whatever the visitor was on before — the footer link — gets focus back
    // when the modal closes, instead of dumping them at the top of the page.
    const opener = document.activeElement as HTMLElement | null
    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    closeRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Keep Tab inside the dialog. Note this stops working once focus is
      // inside the player itself, because key events there never reach this
      // document — the close button stays reachable with Shift+Tab.
      const nodes = focusable()
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [open, onClose, focusable])

  if (!open) return null

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        // mousedown, not click: a drag that starts on the player and ends on
        // the backdrop would otherwise close the modal mid-scrub.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-guide-title"
      >
        <div className={styles.header}>
          <h2 id="user-guide-title" className={styles.title}>
            {t.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t.close}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.playerFrame}>
          <iframe
            src={streamIframeSrc()}
            className={styles.player}
            title={t.title}
            loading="lazy"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

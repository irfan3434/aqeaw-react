'use client'

import { useEffect, useState, useRef } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './NewsEvents.module.css'

const newsData = {
  en: {
    title: 'Schedule of the events of the previous edition of the award in 2025',
    events: [
      { id: 'n-1', heading: 'Award and the platform inaugurated',           date: '01/09/2025' },
      { id: 'n-2', heading: 'Announced the start of accepting nominations',  date: '12/04/2026' },
      { id: 'n-3', heading: 'Applications closed',                           date: 'Stay tuned for the date!' },
      { id: 'n-4', heading: 'Evaluation and arbitration completed',          date: 'Stay tuned for the date!' },
      { id: 'n-5', heading: 'Winners Announced',                             date: 'Stay tuned for the date!' },
      { id: 'n-6', heading: 'Ceremony Concluded',                            date: 'Stay tuned for the date!' },
    ],
  },
  ar: {
    title:   'جدول زمني لأحداث الدورة السابقة للجائزة عام 2025م',
    events: [
      { id: 'n-1', heading: 'تدشين الجائزة والمنصة',           date: '2025/01/09' },
      { id: 'n-2', heading: 'أعلن عن بدء قبول الترشيحات',      date: '12/04/2026' },
      { id: 'n-3', heading: 'تم إغلاق باب التقدم للطلبات',     date: 'ترقبوا التاريخ' },
      { id: 'n-4', heading: 'اكتمل التقييم والتحكيم',          date: 'ترقبوا التاريخ' },
      { id: 'n-5', heading: 'الإعلان عن الفائزين',             date: 'ترقبوا التاريخ' },
      { id: 'n-6', heading: 'اختتام الحفل',                    date: 'ترقبوا التاريخ' },
    ],
  },
}

type CardState = 'active' | 'prev' | 'next' | 'hidden'

export default function NewsEvents() {
  const { lang } = useLanguage()

  // ── FIX: reset index during render, not inside an effect ──────────────
  // Track the previous language with a ref. If it differs from the current
  // lang at render time, we know a language switch just happened.
  // Reset activeIndex to 0 right here during the render pass — this is the
  // React-recommended pattern for "derived state from props/context changes"
  // and avoids the cascading-render warning caused by setState-in-effect.
  const prevLangRef = useRef(lang)
  const [activeIndex, setActiveIndex] = useState(0)

  if (prevLangRef.current !== lang) {
    prevLangRef.current = lang
    // Mutate state synchronously during render (React flushes this in the
    // same render pass — no extra re-render cycle, no cascade warning)
    setActiveIndex(0)
  }
  // ──────────────────────────────────────────────────────────────────────

  const data    = newsData[lang]
  const total   = data.events.length
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getCardState = (index: number): CardState => {
    if (index === activeIndex) return 'active'
    if (index === (activeIndex - 1 + total) % total) return 'prev'
    if (index === (activeIndex + 1) % total) return 'next'
    return 'hidden'
  }

  const advance = () => setActiveIndex(prev => (prev + 1) % total)
  const goTo    = (index: number) => setActiveIndex(index)

  // Auto-advance
  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(advance, 5000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [paused, total])

  return (
    <section
      id="news-events"
      className={styles.newsSection}
      aria-label="Events Timeline">

      {/* Title */}
      <h2 className={styles.newsSectionTitle}>{data.title}</h2>

      {/* Card Carousel */}
      <div
        className={styles.newsCardContainer}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>

        {data.events.map((event, index) => {
          const state = getCardState(index)
          return (
            <div
              key={event.id}
              className={`
                ${styles.newsEventCard}
                ${state === 'active' ? styles.newsEventCardActive : ''}
                ${state === 'prev'   ? styles.newsEventCardPrev   : ''}
                ${state === 'next'   ? styles.newsEventCardNext   : ''}
                ${state === 'hidden' ? styles.newsEventCardHidden : ''}
              `}
              aria-hidden={state !== 'active'}>

              {/* Step badge */}
              <span className={styles.newsEventBadge}>
                {String(index + 1).padStart(2, '0')}
              </span>

              <h3 className={styles.newsEventTitle}>{event.heading}</h3>

              <div className={styles.newsEventDivider} aria-hidden="true" />

              <p className={styles.newsEventDate}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                {event.date}
              </p>

            </div>
          )
        })}
      </div>

      {/* Dot indicators */}
      <div className={styles.newsDots} role="tablist" aria-label="Select event">
        {data.events.map((event, index) => (
          <button
            key={event.id}
            className={`${styles.newsDot} ${index === activeIndex ? styles.newsDotActive : ''}`}
            onClick={() => goTo(index)}
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Go to event ${index + 1}: ${event.heading}`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <div className={styles.newsArrows}>
        <button
          className={styles.newsArrowBtn}
          onClick={() => goTo((activeIndex - 1 + total) % total)}
          aria-label="Previous event">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button
          className={styles.newsArrowBtn}
          onClick={() => advance()}
          aria-label="Next event">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

    </section>
  )
}
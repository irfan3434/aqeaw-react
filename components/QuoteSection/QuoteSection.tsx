'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './QuoteSection.module.css'

const quoteData = {
  en: {
    quote: 'Be content with what God has given you, and you will be among the richest of people.',
    author: 'Dr. Ayed Alqarni',
  },
  ar: {
    quote: 'ارضَ بما أعطاك الله تكن أغنى الناس.',
    author: 'الدكتور عائض القرني',
  },
}

export default function QuoteSection() {
  const { lang } = useLanguage()
  const data = quoteData[lang]
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Intersection Observer — animate in when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className={styles.quoteSectionWrapper}
      aria-label="Inspirational Quote">

      {/* Sun rays background */}
      <div className={styles.quoteSunRays} aria-hidden="true" />

      {/* Decorative top/bottom gold lines */}
      <div className={styles.quoteTopLine} aria-hidden="true" />
      <div className={styles.quoteBottomLine} aria-hidden="true" />

      {/* Content */}
      <div className={`${styles.quoteContent} ${visible ? styles.quoteContentVisible : ''}`}>

        {/* Large decorative opening quote mark */}
        <span className={styles.quoteMarkOpen} aria-hidden="true">&ldquo;</span>

        <h3 className={styles.quoteText}>{data.quote}</h3>

        {/* Divider */}
        <div className={styles.quoteDivider} aria-hidden="true">
          <span className={styles.quoteDividerDot} />
          <span className={styles.quoteDividerLine} />
          <span className={styles.quoteDividerDot} />
        </div>

        {/* Author */}
        <p className={styles.quoteAuthor}>
          <span className={styles.quoteAuthorDash}>— </span>
          {data.author}
        </p>

        {/* Large decorative closing quote mark */}
        <span className={styles.quoteMarkClose} aria-hidden="true">&rdquo;</span>

      </div>
    </section>
  )
}
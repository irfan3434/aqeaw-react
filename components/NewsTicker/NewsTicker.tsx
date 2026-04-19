'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './NewsTicker.module.css'

const tickerContent = {
  en: [
     "The nomination process for the second cycle of the Dr. Ayed Al-Qarni Award for Excellence began on 19-04-2026 AD, corresponding to 02-11-1447 AH.",
     "Nominations will continue to be accepted until Sunday, February 7, 2027 (corresponding to August 30, 1448 AH).",
     "The award has expanded to include all the people of Balqrin Governorate.",
     "The award also includes the sons and daughters of Balqarn in Tihama and Al-Sarra.",
     "Follow the website for updates.",
  ],

  ar: [

    "بدأ استقبال المرشحين لجائزة الدكتور عائض القرني للتميز في دورتها الثانية من تاريخ 19-04-2026م الموافق 02-11-1447هـ",
    "يستمر قبول الترشيحات إلى يوم الاحد 07-02-2027م الموافق 30-08-1448هـ",
    "توسعت الجائزة لتشمل جميع أبناء محافظة بلقرن",
    "الجائزة تشمل أيضاً أبناء وبنات بلقرن في تهامة والسراة",
    "تابعوا الموقع للمستجدات",
  ]
}

const labelText = { en: 'Latest News', ar: 'آخر الأخبار' }

export default function NewsTicker() {
  const { lang } = useLanguage()
  const contentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const isPausedByHover = useRef(false)
  const isRTL = lang === 'ar'

  const startAnimation = () => {
    const el = contentRef.current
    if (!el) return

    if (animationRef.current) animationRef.current.cancel()

    // Wait one frame so offsetWidth is accurate
    requestAnimationFrame(() => {
      const totalWidth = el.scrollWidth / 3
      const pixelsPerSecond = 60
      const duration = (totalWidth / pixelsPerSecond) * 1000

      const keyframes = isRTL
        ? [{ transform: 'translateX(0)' }, { transform: `translateX(${totalWidth}px)` }]
        : [{ transform: 'translateX(0)' }, { transform: `translateX(-${totalWidth}px)` }]

      animationRef.current = el.animate(keyframes, {
        duration,
        iterations: Infinity,
        easing: 'linear',
      })

      if (!isPlaying) animationRef.current.pause()
    })
  }

  // Restart animation when language or items change
  useEffect(() => {
    startAnimation()
    return () => animationRef.current?.cancel()
  }, [lang])

  // Handle resize
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(startAnimation, 250)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [lang, isPlaying])

  const pause = () => {
    animationRef.current?.pause()
    setIsPlaying(false)
  }

  const play = () => {
    animationRef.current?.play()
    setIsPlaying(true)
  }

  const items = tickerContent[lang]
  // Triple items for seamless loop
  const allItems = [...items, ...items, ...items]

  return (
    <div className={styles.tickerContainer} aria-label="Latest headlines">

      <div className={styles.tickerLabel}>
        <span className={styles.tickerIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10,8 16,12 10,16 10,8"/>
          </svg>
        </span>
        <span className={styles.tickerLabelText}>{labelText[lang]}</span>
      </div>

      <div
        className={styles.tickerWrapper}
        onMouseEnter={() => {
          if (isPlaying) { animationRef.current?.pause(); isPausedByHover.current = true }
        }}
        onMouseLeave={() => {
          if (isPlaying && isPausedByHover.current) { animationRef.current?.play(); isPausedByHover.current = false }
        }}>
        <div className={styles.tickerTrack}>
          <div className={styles.tickerContent} ref={contentRef}>
            {allItems.map((item, i) => (
              <span key={i}>
                <span className={styles.tickerItem}>{item}</span>
                <span className={styles.tickerSeparator}>•</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.tickerControls}>
        {isPlaying ? (
          <button className={styles.tickerControlBtn} onClick={pause} aria-label="Pause ticker">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          </button>
        ) : (
          <button className={styles.tickerControlBtn} onClick={play} aria-label="Play ticker">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5,3 19,12 5,21 5,3"/>
            </svg>
          </button>
        )}
      </div>

    </div>
  )
}

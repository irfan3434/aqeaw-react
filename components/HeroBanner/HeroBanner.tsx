'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './HeroBanner.module.css'

// Import Swiper core and required modules
import { Swiper as SwiperClass } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules'

// Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

const bannerImages = [
  { src: '/images/hero-banner-1.webp', alt: 'Hero Banner 1' },
  { src: '/images/hero-banner-2.webp', alt: 'Hero Banner 2' },
  { src: '/images/hero-banner-3.webp', alt: 'Hero Banner 3' },
  { src: '/images/hero-banner-4.webp', alt: 'Hero Banner 4' },
  { src: '/images/hero-banner-5.webp', alt: 'Hero Banner 5' },
]

const winnersBtnText = {
  en: 'View Winners',
  ar: 'عرض الفائزين',
}

export default function HeroBanner() {
  const { lang } = useLanguage()
  const swiperRef = useRef<SwiperClass | null>(null)
  const [btnVisible, setBtnVisible] = useState(false)
  const isRTL = lang === 'ar'

  // Entrance animation for winners button
  useEffect(() => {
    const timer = setTimeout(() => setBtnVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Ripple effect on winners button click
  const handleRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.className = styles.heroBannerRipple
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }

  // Pause/resume swiper on window blur/focus
  useEffect(() => {
    const onBlur  = () => swiperRef.current?.autoplay?.stop()
    const onFocus = () => swiperRef.current?.autoplay?.start()
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  swiperRef.current?.slidePrev()
      if (e.key === 'ArrowRight') swiperRef.current?.slideNext()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={styles.heroBannerContainer}>

      {/* Hero Section */}
      <div className={styles.heroBannerSection}>

        {/* Floating Winners Button */}
        <div className={`${styles.heroBannerFloatingBtn} ${btnVisible ? styles.heroBannerFloatingBtnVisible : ''}`}>
          <a
            href="#winners"
            className={styles.heroBannerWinnersBtn}
            aria-label={winnersBtnText[lang]}
            onClick={handleRipple}>
            <span className={styles.heroBannerWinnersBtnIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </span>
            <span className={styles.heroBannerWinnersBtnText}>
              {winnersBtnText[lang]}
            </span>
            <span className={styles.heroBannerWinnersBtnGlow} />
          </a>
        </div>

        {/* Swiper Slider */}
        <Swiper
          modules={[Autoplay, Navigation, Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={true}
          speed={1200}
          grabCursor={true}
          autoplay={{ delay: 1000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          navigation={true}
          pagination={{ clickable: true, dynamicBullets: true, dynamicMainBullets: 3 }}
          breakpoints={{
            320:  { speed: 1000, autoplay: { delay: 5000, disableOnInteraction: false } },
            768:  { speed: 1200, autoplay: { delay: 6000, disableOnInteraction: false } },
            1024: { speed: 1400, autoplay: { delay: 6000, disableOnInteraction: false } },
          }}
          onSwiper={(swiper) => { swiperRef.current = swiper }}
          className={styles.heroBannerSwiper}
          dir={isRTL ? 'rtl' : 'ltr'}
          key={lang}>
          {bannerImages.map((image, index) => (
            <SwiperSlide key={index} className={styles.heroBannerSlide}>
              <div className={styles.heroBannerImageContainer}>
                <img
                  src={image.src}
                  alt={image.alt}
                  className={styles.heroBannerSlideImage}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
              <div className={styles.heroBannerSlideOverlay} />
            </SwiperSlide>
          ))}
        </Swiper>

      </div>
    </div>
  )
}
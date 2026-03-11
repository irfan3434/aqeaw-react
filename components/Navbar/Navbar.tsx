'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './NavBar.module.css'

const navItems = {
  en: [
    { label: 'Main Page',            href: '/' },
    { label: 'About Award',          href: '/AboutAward' },
    { label: 'Eligibility Criteria', href: '/Eligibility-Criteria' },
    { label: 'FAQs',                 href: '/FAQs' },
    { label: 'Contact Us',           href: '/Contact-Us' },
  ],
  ar: [
    { label: 'الصفحة الرئيسية',     href: '/' },
    { label: 'نبذة عن الجائزة',     href: '/AboutAward' },
    { label: 'معايير التأهيل',       href: '/Eligibility-Criteria' },
    { label: 'الأسئلة الشائعة',     href: '/FAQs' },
    { label: 'اتصل بنا',            href: '/Contact-Us' },
  ],
}

const ceremonyItem = {
  en: { label: 'Events & Articles',    href: '/Events-Articles' },
  ar: { label: 'الفعاليات والمقالات', href: '/Events-Articles' },
}

export default function Navbar() {
  const { lang, mounted } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  // Track whether we should suppress the slide transition.
  // True whenever the menu is closed — so language-direction changes
  // happen instantly off-screen without a visible sweep.
  const [suppressTransition, setSuppressTransition] = useState(true)

  // Keep a ref to the previous lang so we can detect a language switch
  const prevLangRef = useRef(lang)

  // When language changes while menu is CLOSED → snap instantly, no transition
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang
      if (!isMenuOpen) {
        // Briefly disable transition so the direction-reset is invisible
        setSuppressTransition(true)
      }
    }
  }, [lang, isMenuOpen])

  // When menu opens: re-enable transition first so it slides in smoothly
  // When menu closes: keep transition on during the closing animation,
  //   then suppress it once the animation finishes (~300 ms)
  useEffect(() => {
    if (isMenuOpen) {
      setSuppressTransition(false)
    } else {
      // Wait for the closing slide animation to finish before suppressing
      const timer = setTimeout(() => setSuppressTransition(true), 350)
      return () => clearTimeout(timer)
    }
  }, [isMenuOpen])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.pageYOffset > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen])

  const items    = mounted ? navItems[lang]    : navItems['en']
  const ceremony = mounted ? ceremonyItem[lang] : ceremonyItem['en']

  // Build the mobile nav class string
  const mobileNavClass = [
    styles.navMobile,
    isMenuOpen          ? styles.active          : '',
    suppressTransition  ? styles.noTransition    : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <a href="#main-content" className={styles.skipToContent}>
        Skip to main content
      </a>

      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerWrapper}>
          <div className={styles.headerContent}>

            <div className={styles.headerLogo}>
              <Link href="/" aria-label="Home">
                <NextImage src="/images/AQ-Logo.png" alt="Logo" width={100} height={100} priority />
              </Link>
            </div>

            <nav className={styles.navDesktop} aria-label="Main navigation">
              {items.map((item) => (
                <Link key={item.href} href={item.href}>{item.label}</Link>
              ))}
              <Link href={ceremony.href} className={styles.ceremonyBtn}>
                {ceremony.label}
              </Link>
            </nav>

            <button
              className={`${styles.mobileMenuToggle} ${isMenuOpen ? styles.active : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}>
              <div className={styles.hamburger}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>

          </div>
        </div>
      </header>

      <nav
        className={mobileNavClass}
        aria-label="Mobile navigation">
        <div className={styles.navMobileContent}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link
            href={ceremony.href}
            className={styles.ceremonyBtn}
            onClick={() => setIsMenuOpen(false)}>
            {ceremony.label}
          </Link>
        </div>
      </nav>

      {isMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  )
}
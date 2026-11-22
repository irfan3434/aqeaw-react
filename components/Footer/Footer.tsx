'use client'

import { useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import UserGuideModal from '../UserGuide/UserGuideModal'
import { GUIDE_PDF_PATH, hasGuideDocument, hasGuideVideo } from '../../lib/userGuide'
import styles from './Footer.module.css'

const footerData = {
  en: {
    col1: {
      heading: 'About Award',
      paragraph: 'The Dr. Ayed Alqarni Prize for Excellence celebrates outstanding achievements by individuals, teams, and organizations from the sons and daughters of Bilqrin Governorate, as well as the sons and daughters of Bilqrin in Tihama and Al-Sarra. Aligned with Saudi Vision 2030, the prize fosters creativity, innovation, and leadership, recognizing transformative contributions that inspire growth and development.',
    },
    col2: {
      heading: 'Quick Links',
      links: [
        { label: 'Main Page',        href: '/' },
        { label: 'About the Award',  href: '/AboutAward' },
        { label: 'FAQ',              href: '/FAQs' },
        { label: 'How to Apply',     href: '/Eligibility-Criteria' },
      ],
      guide: {
        label: 'User Guide',
        doc:   'Guide Book (PDF)',
        video: 'Guide Video',
      },
    },
    col3: {
      heading: 'Contact Us',
      email:   'Email: info@aqeaw.com',
      phone:   'Phone Number: 0553181715',
    },
    bottom: {
      developer: 'Developed by FCEC',
      copyright: '© 2024 Dr. Ayed Alqarni. All rights reserved.',
    },
  },
  ar: {
    col1: {
      heading: 'عن الجائزة',
      paragraph: 'تحتفي جائزة التميز للدكتور عائض القرني بالإنجازات البارزة للأفراد والفرق والمنظمات من أبناء وبنات محافظة بلقرن وكذلك أبناء وبنات بلقرن في تهامة والسراة. تماشياً مع رؤية السعودية 2030، تعزز الجائزة الإبداع والابتكار والقيادة، وتكرّم المساهمات التحويلية التي تلهم النمو والتطور.',
    },
    col2: {
      heading: 'روابط سريعة',
      links: [
        { label: 'الصفحة الرئيسية', href: '/' },
        { label: 'عن الجائزة',       href: '/AboutAward' },
        { label: 'الأسئلة الشائعة',  href: '/FAQs' },
        { label: 'التقديم',    href: '/HowToApply' },
      ],
      guide: {
        label: 'دليل المستخدم',
        doc:   'كتاب دليل المستخدم',
        video: 'فيديو دليل المستخدم',
      },
    },
    col3: {
      heading: 'اتصل بنا',
      email:   'بريد إلكتروني: info@aqeaw.com',
      phone:   'رقم الجوال: ٠٥٥٣١٨١٧١٥',
    },
    bottom: {
      developer: 'تم تطويره بواسطة FCEC',
      copyright: '© 2024 الدكتور عائض القرني. جميع الحقوق محفوظة.',
    },
  },
}

export default function Footer() {
  const { lang } = useLanguage()
  const data = footerData[lang]

  const [guideOpen, setGuideOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)

  // Neither half configured yet means no entry at all, rather than a link
  // that goes nowhere. See lib/userGuide.ts.
  const showGuide = hasGuideDocument || hasGuideVideo

  return (
    <footer className={styles.footerWrapper}>

      {/* Top gold accent line */}
      <div className={styles.footerTopLine} aria-hidden="true" />

      {/* Main columns */}
      <div className={styles.footerContainer}>

        {/* Column 1 — About */}
        <div className={styles.footerColumn}>
          <h3 className={styles.footerColHeading}>{data.col1.heading}</h3>
          <p className={styles.footerColParagraph}>{data.col1.paragraph}</p>
        </div>

        {/* Column 2 — Quick Links */}
        <div className={styles.footerColumn}>
          <h3 className={styles.footerColHeading}>{data.col2.heading}</h3>
          <ul className={styles.footerLinksList}>
            {data.col2.links.map((link) => (
              <li key={link.href} className={styles.footerLinksItem}>
                <Link href={link.href} className={styles.footerLink}>
                  <span className={styles.footerLinkArrow} aria-hidden="true">›</span>
                  {link.label}
                </Link>
              </li>
            ))}

            {/* User Guide — expands in place into the book and the video */}
            {showGuide && (
              <li className={styles.footerLinksItem}>
                <button
                  type="button"
                  className={`${styles.footerLink} ${styles.footerGuideToggle} ${guideOpen ? styles.footerGuideToggleOpen : ''}`}
                  aria-expanded={guideOpen}
                  aria-controls="footer-user-guide"
                  onClick={() => setGuideOpen((open) => !open)}
                >
                  <span className={styles.footerLinkArrow} aria-hidden="true">›</span>
                  {data.col2.guide.label}
                </button>

                <div className={`${styles.footerGuideWrap} ${guideOpen ? styles.footerGuideWrapOpen : ''}`}>
                  <div className={styles.footerGuideInner} inert={!guideOpen}>
                    <ul id="footer-user-guide" className={styles.footerGuideList}>

                      {hasGuideDocument && (
                        <li className={styles.footerGuideItem}>
                          <a
                            href={GUIDE_PDF_PATH}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.footerGuideLink}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="8" y1="13" x2="16" y2="13" />
                              <line x1="8" y1="17" x2="13" y2="17" />
                            </svg>
                            {data.col2.guide.doc}
                          </a>
                        </li>
                      )}

                      {hasGuideVideo && (
                        <li className={styles.footerGuideItem}>
                          <button
                            type="button"
                            className={styles.footerGuideLink}
                            onClick={() => setVideoOpen(true)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                            </svg>
                            {data.col2.guide.video}
                          </button>
                        </li>
                      )}

                    </ul>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* Column 3 — Contact */}
        <div className={styles.footerColumn}>
          <h3 className={styles.footerColHeading}>
            <Link href="/Contact-Us" className={styles.footerContactHeadingLink}>
              {data.col3.heading}
            </Link>
          </h3>
          <div className={styles.footerContactInfo}>
            <a href="mailto:info@aqeaw.com" className={styles.footerContactEmail}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {data.col3.email}
            </a>
            <p className={styles.footerContactPhone}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {data.col3.phone}
            </p>
          </div>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className={styles.footerBottom}>
        <div className={styles.footerBottomInner}>
          <div className={styles.footerBottomWrapper}>

            {/* Logo */}
            <div className={styles.footerLogoWrapper}>
              <NextImage
                src="/images/Logo.png"
                alt="Logo"
                width={80}
                height={80}
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Text */}
            <div className={styles.footerBottomText}>
              <h3 className={styles.footerBottomHeading}>{data.bottom.developer}</h3>
              <p className={styles.footerBottomCopyright}>{data.bottom.copyright}</p>
            </div>

          </div>
        </div>
      </div>

      {hasGuideVideo && (
        <UserGuideModal open={videoOpen} onClose={() => setVideoOpen(false)} />
      )}

    </footer>
  )
}
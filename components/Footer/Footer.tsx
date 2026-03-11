'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './Footer.module.css'

const footerData = {
  en: {
    col1: {
      heading: 'About Award',
      paragraph: 'The Dr. Ayed Alqarni Prize for Excellence celebrates outstanding achievements by individuals, teams, and organizations from the Balqarn tribes. Aligned with Saudi Vision 2030, the prize fosters creativity, innovation, and leadership, recognizing transformative contributions that inspire growth and development.',
    },
    col2: {
      heading: 'Quick Links',
      links: [
        { label: 'Main Page',        href: '/' },
        { label: 'About the Award',  href: '/About-Awad' },
        { label: 'FAQ',              href: '/FAQs' },
        { label: 'How to Apply',     href: '/Eligibility-Criteria' },
      ],
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
      paragraph: 'تحتفي جائزة التميز للدكتور عائض القرني بالإنجازات البارزة للأفراد والفرق والمنظمات من قبائل بلقرن. تماشياً مع رؤية السعودية 2030، تعزز الجائزة الإبداع والابتكار والقيادة، وتكرّم المساهمات التحويلية التي تلهم النمو والتطور.',
    },
    col2: {
      heading: 'روابط سريعة',
      links: [
        { label: 'الصفحة الرئيسية', href: '/' },
        { label: 'عن الجائزة',       href: '/About-Awad' },
        { label: 'الأسئلة الشائعة',  href: '/FAQs' },
        { label: 'كيفية التقديم',    href: '/Eligibility-Criteria' },
      ],
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
                src="/images/Fcec-Logo.png"
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

    </footer>
  )
}
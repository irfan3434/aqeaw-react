'use client'

import React from 'react'

import { useEffect, useRef } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './AboutAward.module.css'

const content = {
  en: {
    title: 'About the Award',
    sections: [
      {
        id: 'aa-name',
        heading: 'Name of the Award',
        type: 'paragraph' as const,
        items: ['Dr. Ayed Alqarni Award for Excellence'],
      },
      {
        id: 'aa-funding',
        heading: 'Funding',
        type: 'paragraph' as const,
        items: [
          'Dr. Ayed bin Abdullah Alqarni',
          'General Supervisor and Award Patron',
        ],
      },
      {
        id: 'aa-management',
        heading: 'Award Management',
        type: 'list' as const,
        items: [
          'The Prize Council, chaired by the Prize Holder',
          'Executive Scientific Committees',
        ],
      },
      {
        id: 'aa-objectives',
        heading: 'Objectives',
        type: 'list' as const,
        items: [
          'Highlighting inspiring and impactful achievements and contributions in various fields, and honoring their owners, whether individuals or institutions.',
          'Promoting a culture of excellence and creativity, and encouraging new ideas that contribute to positive change in society and align with the Kingdom\'s Vision.',
          'Enhancing positive practices and behaviors in society.',
        ],
      },
      {
        id: 'aa-audience',
        heading: 'The Intended Audience',
        type: 'list' as const,
        subheading: 'The award targets outstanding individuals from the sons and daughters of Balqarn and includes:',
        items: [
          'Individuals of both genders, across all age groups, within different fields.',
          'Teams and Organizations from various sectors contributing to societal development.',
        ],
      },
      {
        id: 'aa-dates',
        heading: 'Dates of the Award in the First Cycle',
        type: 'list' as const,
        items: [
          'Acceptance of nominations for the second round begins on  12-04-2026 AD corresponding to 24-10-1447 AH Stay tuned for other dates details',
        ],
      },
    ],
  },
  ar: {
    title: 'نبذة عن الجائزة',
    sections: [
      {
        id: 'aa-name',
        heading: 'اﺳﻢ اﻟﺠﺎﺋـــــﺰة',
        type: 'paragraph' as const,
        items: ['ﺟﺎﺋﺰة د. ﻋﺎﺋﺾ اﻟﻘﺮﻧﻲ ﻟﻠﺘﻤﻴﺰ'],
      },
      {
        id: 'aa-funding',
        heading: 'التمويل',
        type: 'paragraph' as const,
        items: [
          'الدكتور عائض بن عبدلله القرني',
          'المشرف العام و صاحب الجائزة',
        ],
      },
      {
        id: 'aa-management',
        heading: 'إدارة الجائزة',
        type: 'list' as const,
        items: [
          'مجلس الجائزة برئاسة صاحب الجائزة',
          'اللجان العلمية التنفيذية',
        ],
      },
      {
        id: 'aa-objectives',
        heading: 'الأهداف',
        type: 'list' as const,
        items: [
          'إﺑﺮاز اﻹﻧﺠﺎزات واﻹﺳﻬﺎﻣــﺎت اﻟﻤﻠﻬﻤـــﺔ واﻟﻔﻌﺎﻟﺔ ﻓﻲ ﻣﺨﺘﻠﻒ اﻟﻤﺠﺎﻻت وﺗﻜﺮﻳﻢ أﺻﺤﺎﺑﻬﺎ أﻓﺮاداً أو ﻣﺆﺳﺴﺎت.',
          'ﻧﺸﺮ ﺛﻘﺎﻓﺔ اﻟﺘﻤﻴﺰ واﻻﺑﺪاع وﺗﺤﻔﻴﺰ الابتكارواﻷﻓﻜﺎر اﻟﺠﺪﻳﺪة اﻟﺘﻲ ﺗﺴﻬــﻢ ﻓﻲ اﻟﺘﻐﻴﻴﺮ اﻹﻳﺠﺎﺑﻲ ﻓﻲ اﻟﻤﺠﺘﻤﻊ وﺗﺘﻔﻖ ﻣﻊ رؤﻳﺔ اﻟﻤﻤﻠﻜﺔ.',
          'ﺗﻌﺰﻳﺰ اﻟﻤﻤﺎرﺳﺎت واﻟﺴﻠﻮﻛﻴﺎت اﻹﻳﺠﺎﺑﻴــﺔ ﻓﻲ اﻟﻤﺠﺘﻤﻊ.',
        ],
      },
      {
        id: 'aa-audience',
        heading: 'اﻟﻤﺴﺘﻬـﺪﻓـــﻮن',
        type: 'list' as const,
        subheading: 'ﺗﺴﺘﻬﺪف اﻟﺠﺎﺋﺰة اﻟﻤﺘﻤﻴﺰﻳﻦ ﻣﻦ أﺑﻨﺎء وﺑﻨﺎت ﺑﻠﻘﺮن وﺗﺸﻤﻞ:',
        items: [
          'اﻷﻓــــﺮاد ﻣـــﻦ اﻟﺠﻨﺴﻴـﻦ ﻓﻲ اﻟﻔﺌـــﺎت اﻟﻌﻤـﺮﻳـــــﺔ اﻟﻤﺨﺘﻠﻔﺔ وﻓﻲ ﻣﺨﺘﻠﻒ اﻟﻤﺠﺎﻻت.',
          'اﻟﺠﻤﺎﻋﺎت واﻟﻤﺆﺳﺴﺎت واﻟﺸﺮﻛﺎت واﻟﻘﻄﺎﻋﺎت ذات اﻹﺳﻬﺎﻣﺎت اﻟﻤﺠﺘﻤﻌﻴﺔ اﻟﻤﺘﻤﻴﺰة.',
        ],
      },
      {
        id: 'aa-dates',
        heading: 'مواعيد الجائزة في الدورة الأولى',
        type: 'list' as const,
        items: [
          'يبدأ قبول الترشيحات للدورة الثانية بتاريخ 12-04-2026 م الموافق 24—10- 1447هـ وترقبوا تفاصيل المواعيد الأخرى.'
        ],
      },
    ],
  },
}

// Section icons map
const sectionIcons: Record<string, React.ReactElement> = {
  'aa-name': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  'aa-funding': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  'aa-management': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'aa-objectives': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  'aa-audience': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'aa-dates': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
}

export default function AboutAward() {
  const { lang } = useLanguage()
  const data = content[lang]
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  // Staggered scroll-triggered animation
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    sectionRefs.current.forEach((el, index) => {
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.classList.add(styles.aboutSectionVisible)
            }, index * 120)
            observer.unobserve(el)
          }
        },
        { threshold: 0.15 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [lang])

  return (
    <div className={styles.aboutWrapper}>

      {/* Page hero banner */}
      <div className={styles.aboutHeroBanner}>
        <div className={styles.aboutHeroOverlay} aria-hidden="true" />
        <div className={styles.aboutHeroContent}>
          <h1 className={styles.aboutHeroTitle}>{data.title}</h1>
          <div className={styles.aboutHeroDivider} aria-hidden="true" />
        </div>
      </div>

      {/* Sections grid */}
      <div className={styles.aboutContainer}>
        {data.sections.map((section, index) => (
          <section
            key={section.id}
            ref={el => { sectionRefs.current[index] = el }}
            className={styles.aboutSection}>

            {/* Decorative bg blob */}
            <div className={styles.aboutSectionBg} aria-hidden="true" />

            {/* Section header */}
            <div className={styles.aboutSectionHeader}>
              <div className={styles.aboutSectionIcon}>
                {sectionIcons[section.id]}
              </div>
              <h2 className={styles.aboutSectionHeading}>{section.heading}</h2>
            </div>

            {/* Optional subheading */}
            {'subheading' in section && section.subheading && (
              <h3 className={styles.aboutSectionSubheading}>
                {section.subheading}
              </h3>
            )}

            {/* Content */}
            {section.type === 'paragraph' ? (
              <div className={styles.aboutSectionBody}>
                {section.items.map((item, i) => (
                  <p key={i} className={styles.aboutParagraph}>{item}</p>
                ))}
              </div>
            ) : (
              <ul className={styles.aboutList}>
                {section.items.map((item, i) => (
                  <li key={i} className={styles.aboutListItem}>
                    <span className={styles.aboutListBullet} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

          </section>
        ))}
      </div>

    </div>
  )
}
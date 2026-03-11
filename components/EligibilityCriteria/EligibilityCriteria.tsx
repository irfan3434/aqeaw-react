'use client'

import React from 'react'

import { useEffect, useRef } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './EligibilityCriteria.module.css'

const content = {
  en: {
    title: 'Eligibility Criteria',
    sections: [
      {
        id: 'ec-requirements',
        heading: 'Eligibility Requirements for the Award',
        subheading: null,
        items: [
          'The applicant or nominee must be among the targeted individuals for the award.',
          'The nominated or submitted work for the award must demonstrate remarkable excellence that stands out from common works.',
          'The subject of excellence must align with religious, national, and social values.',
          'The applicant or nominee must not have received the award in the past three cycles.',
        ],
      },
      {
        id: 'ec-judging',
        heading: 'Judging Criteria',
        subheading: 'The award patron, in consultation with the council, forms a judging panel to evaluate the submitted or nominated works according to the following criteria:',
        items: [
          'Achievements Accomplished.',
          'Impact of contributions.',
          'Commitment to quality standards.',
          'Commitment to ethical and professional standards.',
          'Creativity and innovation.',
          'Social and economic impact.',
          'Sustainability.',
          'Efficiency and effectiveness.',
        ],
      },
      {
        id: 'ec-selection',
        heading: 'Final Procedures for Selecting the Winners',
        subheading: null,
        items: [
          'Preliminary and final evaluations by the jury.',
          'Submitting the shortlist to the Award Committee.',
          'Verify the fulfillment of the prerequisites.',
          'Confirmation of compliance with at least 80% of the main evaluation criteria.',
          'Submit the final recommendations of the award committee for the finalists to the award holder for a decision.',
          'Announcing the winners.',
        ],
      },
      {
        id: 'ec-prizes',
        heading: 'Prizes',
        subheading: null,
        items: [
          'The prize owner consults with the council to determine the awards and the method of honoring the winners.',
        ],
      },
      {
        id: 'ec-ceremony',
        heading: 'Award Ceremony',
        subheading: null,
        items: [
          'A ceremony to honor the winners of the award is held every two years in the city of Sabt Al-Alaya - the headquarters of Balqarn Governorate.',
          'The address and location of the ceremony will be announced on time.',
          'The program includes inviting prominent personalities and sponsors, distributing awards and certificates, and celebrating the achievements of the winners.',
        ],
      },
      {
        id: 'ec-improvement',
        heading: 'Continuous Improvement',
        subheading: null,
        items: [
          'Evaluating the strengths and weaknesses of the current cycle.',
          'Addressing the weaknesses in the next cycle.',
        ],
      },
    ],
  },
  ar: {
    title: 'معايير التأهيل',
    sections: [
      {
        id: 'ec-requirements',
        heading: 'ﺷﺮوط اﻟﺘﻘﺪم ﻟﻠﺠﺎﺋﺰة',
        subheading: null,
        items: [
          'أن ﻳﻜـــﻮن اﻟﻤﺘﻘـــﺪم أو اﻟﻤﺮﺷـــــﺢ ﻣـــﻦ ﺿـــﻤـــﻦ اﻟﻤﺴﺘﻬﺪﻓﻴﻦ ﻣﻦ اﻟﺠﺎﺋﺰة.',
          'أن ﻳﻤﺜﻞ اﻟﻌﻤﻞ اﻟﻤﺮﺷﺢ أو اﻟــــﺬي ﻳﺘـــﻢ ﺗﻘﺪﻳﻤﻪ ﻟﻠﺠﺎﺋﺰة ﺗﻤﻴﺰا ﻻﻓﺘﺎ ﻳﺨﺘﻠﻒ ﻋﻦ اﻟﺸﺎﺋﻊ ﻣﻦ اﻷﻋﻤﺎل.',
          'أن ﻳﺘـﻮاﻓــﻖ ﻣﻮﺿــﻮع اﻟﺘﻤﻴﺰ ﻣـــﻊ اﻟﻘﻴـــﻢ اﻟﺪﻳﻨﻴﺔ واﻟﻮﻃﻨﻴﺔ واﻻﺟﺘﻤﺎﻋﻴﺔ.',
          'أﻻ ﻳﻜـﻮن اﻟﻤﺘﻘـــﺪم ﻟﻠﺠﺎﺋــﺰة أو اﻟﻤﺮﺷـــﺢ ﻟﻬﺎ ﻗﺪ ﺣﺼﻞ ﻋﻠﻴﻬﺎ ﻓﻲ اﻟﺪورات اﻟﺜﻼث اﻟﺴﺎﺑﻘﺔ.',
        ],
      },
      {
        id: 'ec-judging',
        heading: 'ﻣﻌﺎﻳﻴﺮ اﻟﺘﺤﻜﻴﻢ',
        subheading: 'ﻳﻘﻮم ﺻﺎﺣﺐ اﻟﺠﺎﺋﺰة ﺑﺎﻟﺘﺸﺎور ﻣﻊ اﻟﻤﺠﻠﺲ ﺑﺘﺸﻜﻴﻞ ﻓﺮﻳﻖ ﻋﻤﻞ ﻟﺘﺤﻜﻴﻢ اﻷﻋﻤﺎل اﻟﻤﻘﺪﻣﺔ ﻟﻠﺠﺎﺋﺰة أو اﻟﻤﺮﺷﺤﺔ ﻟﻬﺎ وﻓﻖ اﻟﻤﻌﺎﻳﻴﺮ اﻵﺗﻴﺔ:',
        items: [
          'اﻻﻧﺠــﺎزات اﻟﺘــــﻲ ﺗﺤﻘـــﻘــﺖ.',
          'ﺗﺄﺛﻴــــﺮ اﻹﺳـــﻬـــﺎﻣــﺎت.',
          'اﻻﻟﺘــــﺰام ﺑﻤﻌـــﺎﻳﻴــﺮ اﻟﺠـــﻮدة.',
          'اﻻﻟﺘﺰام ﺑﺎﻟﻤﻌﺎﻳﻴﺮ اﻷﺧﻼﻗﻴّﺔ واﻟﻤﻬﻨﻴـﺔ.',
          'اﻻﺑـــﺪاع واﻻﺑـﺘـــﻜــــﺎر.',
          'اﻷﺛﺮ اﻻﺟﺘـﻤﺎﻋـــﻲ واﻻﻗﺘﺼــﺎدي.',
          'اﻻﺳﺘـــﺪاﻣــﺔ.',
          'اﻟﻜﻔـــﺎءة واﻟﻔﺎﻋﻠــﻴــﺔ.',
        ],
      },
      {
        id: 'ec-selection',
        heading: 'الاجراءات النهائية لاختيار الفائزين',
        subheading: null,
        items: [
          'إجراء التقييمات الأولية والنهائية من قبل لجنة التحكيم.',
          'رفع القائمة المختصرة المجتازة إلى لجنة الجائزة.',
          'التحقق من استيفاء الشروط الأساسية.',
          'تأكيد الامتثال لما لا يقل عن 80% من معايير التقييم الرئيسية.',
          'رفع التوصيات النهائية من لجنة الجائزة للمرشحين النهائيين إلى صاحب الجائزة لإصدار القرار.',
          'الإعلان عن الفائزين.',
        ],
      },
      {
        id: 'ec-prizes',
        heading: 'الجوائز',
        subheading: null,
        items: [
          'ﻳﻘﻮم ﺻﺎﺣﺐ اﻟﺠﺎﺋﺰة ﺑﺎﻟﺘﺸﺎور ﻣﻊ اﻟﻤﺠﻠﺲ ﻟﺘﺤﺪﻳﺪ اﻟﺠﻮاﺋﺰ وأﺳﻠﻮب ﺗﻜﺮﻳﻢ اﻟﻔﺎﺋﺰﻳﻦ.',
        ],
      },
      {
        id: 'ec-ceremony',
        heading: 'حفل توزيع الجوائز',
        subheading: null,
        items: [
          'يقام حفل لتكريم الفائزين بالجائزة كل عامين في مدينة سبت العلاية – مقر محافظة بلقرن.',
          'يعلن عنوان مقر الحفل وموقعه في حينه.',
          'يتضمن البرنامج دعوة الشخصيات البارزة والرعاة وتوزيع الجوائز والشهادات والاحتفاء بإنجازات الفائزين.',
        ],
      },
      {
        id: 'ec-improvement',
        heading: 'التحسين المستمر',
        subheading: null,
        items: [
          'تقييم إيجابيات وسلبيات الدورة الحالية.',
          'تلافي السلبيات في الدورة اللاحقة.',
        ],
      },
    ],
  },
}

// Icon per section
const sectionIcons: Record<string, React.ReactElement> = {
  'ec-requirements': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  'ec-judging': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  'ec-selection': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  'ec-prizes': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  'ec-ceremony': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'ec-improvement': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
}

export default function EligibilityCriteria() {
  const { lang } = useLanguage()
  const data = content[lang]
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    sectionRefs.current.forEach((el, index) => {
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.classList.add(styles.ecSectionVisible)
            }, index * 130)
            observer.unobserve(el)
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [lang])

  return (
    <div className={styles.ecWrapper}>

      {/* Hero Banner */}
      <div className={styles.ecHeroBanner}>
        <div className={styles.ecHeroPattern} aria-hidden="true" />
        <div className={styles.ecHeroContent}>
          <h1 className={styles.ecHeroTitle}>{data.title}</h1>
          <div className={styles.ecHeroDivider} aria-hidden="true" />
        </div>
      </div>

      {/* Sections Grid */}
      <div className={styles.ecContainer}>
        {data.sections.map((section, index) => (
          <section
            key={section.id}
            ref={el => { sectionRefs.current[index] = el }}
            className={styles.ecSection}>

            {/* Decorative corner accent */}
            <div className={styles.ecSectionCorner} aria-hidden="true" />

            {/* Header row */}
            <div className={styles.ecSectionHeader}>
              <div className={styles.ecSectionIcon}>
                {sectionIcons[section.id]}
              </div>
              <h2 className={styles.ecSectionHeading}>{section.heading}</h2>
            </div>

            {/* Optional subheading */}
            {section.subheading && (
              <p className={styles.ecSectionSubheading}>{section.subheading}</p>
            )}

            {/* Items */}
            <ul className={styles.ecList}>
              {section.items.map((item, i) => (
                <li key={i} className={styles.ecListItem}>
                  <span className={styles.ecListCheck} aria-hidden="true">✔</span>
                  <span className={styles.ecListText}>{item}</span>
                </li>
              ))}
            </ul>

          </section>
        ))}
      </div>

    </div>
  )
}
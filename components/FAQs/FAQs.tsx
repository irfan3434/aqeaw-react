'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './FAQs.module.css'

type AnswerType = 'paragraph' | 'list' | 'lines'

interface FAQ {
  id: string
  question: string
  answerType: AnswerType
  items: string[]
}

const content: Record<'en' | 'ar', { title: string; faqs: FAQ[] }> = {
  en: {
    title: 'Frequently Asked Questions',
    faqs: [
      {
        id: 'faq-1',
        question: 'What is the Dr. Ayed Alqarni Award?',
        answerType: 'paragraph',
        items: [
          'The Dr. Ayed Al-Qarni Award is an award that honors outstanding individuals, teams or sectors. It aims to celebrate innovation, stimulate inspiration and positive change in society, and promote cultural and professional excellence.',
        ],
      },
      {
        id: 'faq-2',
        question: 'Who is eligible to apply for the Award?',
        answerType: 'paragraph',
        items: [
          'The award is limited to all the sons and daughters of Balqrin Governorate, in addition to all the Bilqrin in Tihama and Al-Sarra. The applicant must not have received the award in the last three cycles, and his/her achievements must comply with the terms of the award and with ethical, cultural and legal standards.',
        ],
      },
      {
        id: 'faq-3',
        question: 'What are the primary objectives of the Award?',
        answerType: 'list',
        items: [
          'Honor exceptional achievements.',
          'Inspire innovation and societal impact.',
          'Foster a culture of creativity and excellence.',
        ],
      },
      {
        id: 'faq-4',
        question: 'How can I apply for the Dr. Ayed Alqarni Award?',
        answerType: 'list',
        items: [
          'This platform is the official platform of the award and all interactions, communication and submissions are done through it.',
          'You can apply through this platform by clicking on "How to Apply" and filling out the required forms.',
          'There are two types of forms, one for individuals and one for organizations or sectors.',
          'Individuals fill out the individual form and organizations fill out the organization form.',
        ],
      },
      {
        id: 'faq-5',
        question: 'What documents and details are required for submission?',
        answerType: 'list',
        items: [
          'Agree to the award terms and confidentiality of information.',
          'Personal and contact information.',
          'A brief summary of each work of no more than 400 words and no more than 4 works.',
          'Fill out the nomination form via the platform.',
          'Upload the document of each work in PDF format and the file size should not exceed 4 MB.',
        ],
      },
      {
        id: 'faq-6',
        question: 'When does the application process open?',
        answerType: 'paragraph',
        items: [
          'The schedule and deadlines are announced in advance via this platform and across the various platforms. You have to follow up always.',
        ],
      },
      {
        id: 'faq-7',
        question: 'What are the key deadlines for the current cycle?',
        answerType: 'lines',
        items: [
          'Acceptance of nominations for the second round begins on 19-04-2026 AD corresponding to 02-11-1447 AH Stay tuned for other dates details',
        ],
      },
    ],
  },
  ar: {
    title: 'الأسئلة الشائعة',
    faqs: [
      {
        id: 'faq-1',
        question: 'ما هي جائزة الدكتور عائض القرني؟',
        answerType: 'paragraph',
        items: [
          'جائزة الدكتور عائض القرني هي جائزة تُكرّم المتميزين والمساهمات البارزة للأفراد أو الفرق أو القطاعات. وتهدف إلى الاحتفاء بالابتكار، وتحفيز الإلهام و التغيير الإيجابي في المجتمع، وتعزيز التميز الثقافي والمهني.',
        ],
      },
      {
        id: 'faq-2',
        question: 'من المؤهل للتقديم على الجائزة؟',
        answerType: 'paragraph',
        items: [
         'تقتصر الجائزة على كل أبناء وبنات محافظة بلقرن إضافة لكل بلقرن في تهامة والسراة. يجب ألا يكون المتقدم قد حصل على الجائزة في الدورات الثلاث الماضية، وأن تتوافق إنجازاته مع شروط الجائزة ومع المعايير الأخلاقية والثقافية والقانونية.',
        ],
      },
      {
        id: 'faq-3',
        question: 'ما هي الأهداف الرئيسية للجائزة؟',
        answerType: 'list',
        items: [
          'تكريم الإنجازات الاستثنائية.',
          'إلهام الابتكار والتأثير المجتمعي.',
          'تعزيز ثقافة الإبداع والتميز.',
        ],
      },
      {
        id: 'faq-4',
        question: 'كيف يمكنني التقديم لجائزة الدكتور عائض القرني؟',
        answerType: 'list',
        items: [
          'هذه المنصة هي المنصة الرسمية للجائزة وكل التفاعلات والتواصل والتقديمات تتم من خلالها.',
          "يمكن التقديم عبر هذه المنصة بالدخول على 'كيفية التقديم' وتعبئة النماذج المطلوبة.",
          'هناك نوعين من النماذج وهما نموذج يخص الأفراد ونموذج آخر يخص المنشاءات أو القطاعات.',
          'الافراد يقومون بتعبئة نموذج الأفراد والمنشاءات تقوم بتعبئة نموذج المنشاءات.',
        ],
      },
      {
        id: 'faq-5',
        question: 'ما هي الوثائق والتفاصيل المطلوبة للتقديم؟',
        answerType: 'list',
        items: [
          'الموافقة على شروط الجائزة وسرية المعلومات.',
          'المعلومات الشخصية ومعلومات التواصل.',
          'ملخص مختصر لكل عمل لا يزيد الملخص عن 400 كلمة ولا تزيد الأعمال المقدمة عن 4 أعمال.',
          'تعبئه واستيفاء النموذج المخصص للترشيح عبر المنصة.',
          'رفع وثيقة كل عمل بصيغة PDF ويجب ان لا يزيد حجم الملف عن 4 ميجا بايت.',
        ],
      },
      {
        id: 'faq-6',
        question: 'متى يبدأ التقديم للجائزة؟',
        answerType: 'paragraph',
        items: [
          'يتم مع إعلان الجدول الزمني والمواعيد النهائية مسبقاً عبر هذه المنصة وعبر المنصات المختلفة. عليكم بالمتابعة الدائمة.',
        ],
      },
      {
        id: 'faq-7',
        question: 'ما هي المواعيد النهائية للدورة الحالية؟',
        answerType: 'lines',
        items: [
          'يبدأ قبول الترشيحات للدورة الثانية بتاريخ 19-04-2026 م الموافق 02—11-1447هـ وترقبوا تفاصيل المواعيد الأخرى',
        ],
      },
    ],
  },
}

export default function FAQs() {
  const { lang } = useLanguage()
  const data = content[lang]
  const [openId, setOpenId] = useState<string | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const answerRefs = useRef<(HTMLDivElement | null)[]>([])

  // Reset open item when language changes
  useEffect(() => { setOpenId(null) }, [lang])

  // Scroll-triggered entrance animation
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    itemRefs.current.forEach((el, i) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => el.classList.add(styles.faqItemVisible), i * 80)
            obs.unobserve(el)
          }
        },
        { threshold: 0.1 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [lang])

  const toggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <div className={styles.faqsWrapper}>

      {/* Hero Banner */}
      <div className={styles.faqsHero}>
        <div className={styles.faqsHeroPattern} aria-hidden="true" />
        <div className={styles.faqsHeroContent}>
          <h1 className={styles.faqsHeroTitle}>{data.title}</h1>
          <div className={styles.faqsHeroDivider} aria-hidden="true" />
        </div>
      </div>

      {/* FAQ List */}
      <div className={styles.faqsContainer}>
        {data.faqs.map((faq, index) => {
          const isOpen = openId === faq.id
          return (
            <div
              key={faq.id}
              ref={el => { itemRefs.current[index] = el }}
              className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>

              {/* Question button */}
              <button
                className={styles.faqQuestion}
                onClick={() => toggle(faq.id)}
                aria-expanded={isOpen}
                aria-controls={`answer-${faq.id}`}>

                {/* Number badge */}
                <span className={styles.faqBadge} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className={styles.faqQuestionText}>{faq.question}</span>

                {/* Chevron */}
                <span
                  className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                  aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>

              </button>

              {/* Answer panel */}
              <div
                id={`answer-${faq.id}`}
                ref={el => { answerRefs.current[index] = el }}
                className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ''}`}
                role="region">

                <div className={styles.faqAnswerInner}>

                  {faq.answerType === 'paragraph' && (
                    faq.items.map((item, i) => (
                      <p key={i} className={styles.faqAnswerParagraph}>{item}</p>
                    ))
                  )}

                  {faq.answerType === 'list' && (
                    <ul className={styles.faqAnswerList}>
                      {faq.items.map((item, i) => (
                        <li key={i} className={styles.faqAnswerListItem}>
                          <span className={styles.faqAnswerBullet} aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {faq.answerType === 'lines' && (
                    <ul className={styles.faqAnswerLines}>
                      {faq.items.map((item, i) => (
                        <li key={i} className={styles.faqAnswerLineItem}>
                          <span className={styles.faqAnswerLineIcon} aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                </div>
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}
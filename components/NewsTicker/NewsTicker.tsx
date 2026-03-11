'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './NewsTicker.module.css'

const tickerContent = {
  en: [
    "Under the patronage of His Royal Highness the Prince of Asir Region, the first ceremony of the Dr. Ayed Al-Qarni Award for Excellence was held on Wednesday, 12-2-1447 AH, corresponding to 6-8-2025 AD.",
    "The ceremony was honored by His Excellency the Governor of Balqarn Province, Mr. Mohammed bin Saeed bin Amer, on behalf of His Highness the Emir of the region.",
    "The Dr. Ayed Al-Qarni Award for Excellence ceremony was held in Sabt Al-Alaia at the Technical College for Girls in Balqarn.",
    "The ceremony began at 9 p.m. and was attended by a large number of high-ranking dignitaries, including Their Excellencies, Their Eminences, Their Honors, and prominent figures of Saudi society.",
    "The ceremony was hosted by media personality Dr. Ali bin Mohammed Al Hafiz and media personality Mohammed bin Saleh Abu Yazan.",
    "The ceremony included the following segments:",
    "Verses from the Wise Remembrance recited by Sheikh Abdul Rahman bin Muhammad bin Shibli.",
    "Speech by Dr. Ayed Al-Qarni, award winner and general supervisor.",
    "A documentary film about the award.",
    "Speech by His Excellency Dr. Ali bin Abdulkhaliq Al-Tahsi on the award regulations.",
    "A speech by Prof. Abdullah bin Mohammed Al-Damais on the award's technologies and platform.",
    "A poem by the poet Saeed bin Nasser.",
    "A speech by Dr. Munir Al-Qarni on the impact of the award.",
    "A poem by the poet Saad bin Shabrin.",
    "Speech by Dr. Saeed bin Mohammed Al-Kaity.",
    "The award secretary announces the winners and honors them with the award owner and the governor of Balqarn Province.",
    "Dahim bin Muhammad al-Huwais, Ali bin Muhammad al-Dawari, Badr bin Muhammad al-Ra'is, Bara'a bint Abdul Karim al-Qarni, and Arij bin Abdullah al-Qarni.",
    "A special section to thank and honor the initiators, led by Sheikh Othman Al-Shahri, the Technical College for Girls, Al-Burhan Law Firm, and Al-Awadh Real Estate Company.",
    "The ceremony concluded with an operetta written by poet Nasser bin Hassan and performed by singer Fahad Al-Qarni, accompanied by the Balqarn band.",
    "Announcement of a donation by businessman Sheikh Musfir bin Awadah to the award in its upcoming edition in the amount of 300,000 riyals.",
  ],
  ar: [
    "تحت رعاية صاحب السمو الملكي أمير منطقة عسير اقيم حفل الدورة الاولى لجائزة الدكتور عائض القرني للتميز يوم الأربعاء 12-2-1447هـ الموافق 6-8-2025م",
    "شرّف الحفل نيابة عن سمو أمير المنطقة سعادة محافظ محافظة بلقرن الأستاذ/محمد بن سعيد بن عامر.",
    "أقيم حفل جائزة الدكتور عائض القرني للتميز في سبت العلاية بمقر قاعة الكلية التقنية للبنات ببلقرن",
    "بدأ الحفل في تمام الساعة التاسعة مساءً وسط حضور كثيف رفيع المستوى من اصحاب المعالي والفضيلة والسعادة ووجهاء المجتمع السعودي.",
    "تناوب على تقديم الحفل كلٌ من الدكتور الاعلامي علي بن محمد آل حافظ والاعلامي محمد بن صالح ابو يزن.",
    "شملت فقرات الحفل:",
    "آيات من الذكر الحكيم تلاها الشيخ عبد الرحمن بن محمد بن شبيلي.",
    "كلمة الدكتور عائض القرني صاحب الجائزة والمشرف العام.",
    "فلم وثائقي عن الجائزة.",
    "كلمة معالي الدكتور علي بن عبدالخالق الطاحسي عن لوائح الجائزة.",
    "كلمة أ.د/ عبدالله بن محمد آل دميس عن تقنيات ومنصة الجائزة.",
    "قصيدة للشاعر سعيد بن ناصر.",
    "كلمة الدكتور منير القرني للتحدث عن أثر الجائزة.",
    "قصيدة الشاعر سعد بن شبرين.",
    "كلمة الدكتور سعيد بن محمد الكعيتي.",
    "إعلان أمين الجائزة للفائزين وتكريمهم بيد صاحب الجائزة ومحافظ محافظة بلقرن.",
    "دحيم بن محمد ال حويس، و علي بن محمد ال دواري، و بدر بن محمد آل رئيسه، و براء بنت عبد الكريم القرني، وأريج بن عبدالله القرني.",
    "فقرة خاصة لشكر وتكريم أصحاب المبادرات يتقدمهم الشيخ عثمان الشهري، وكلية التقنية للبنات، وشركة البرهان للمحاماة، وشركة الاوضح العقارية.",
    "اختتم الحفل بالاوبريت من كلمات الشاعر ناصر بن حسن وادائه مع المنشد فهد القرني وبحضور فرقة بلقرن.",
    "إعلان تبرع رجل الاعمال الشيخ مسفر بن عوضة للجائزة في دورتها القادمة بمبلغ 300 الف ريال.",
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

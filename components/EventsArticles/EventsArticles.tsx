'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import { photosData, articlesData, videosData, pdfsData } from './eventsData'
import styles from './EventsArticles.module.css'

type Section = 'photos' | 'articles' | 'videos' | 'pdfs'

const PHOTOS_PER_PAGE   = 12
const ARTICLES_PER_PAGE = 6
const VIDEOS_PER_PAGE   = 4
const PDFS_PER_PAGE     = 6

export default function EventsArticles() {
  const { lang } = useLanguage()
  const isAr = lang === 'ar'

  const [activeSection, setActiveSection] = useState<Section>('photos')
  const [photosVisible,   setPhotosVisible]   = useState(PHOTOS_PER_PAGE)
  const [articlesVisible, setArticlesVisible] = useState(ARTICLES_PER_PAGE)
  const [videosVisible,   setVideosVisible]   = useState(VIDEOS_PER_PAGE)
  const [pdfsVisible,     setPdfsVisible]     = useState(PDFS_PER_PAGE)
  const [lightboxIndex,   setLightboxIndex]   = useState<number | null>(null)
  const [videoUrl,        setVideoUrl]        = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)
 
  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === 'Escape')      setLightboxIndex(null)
        if (e.key === 'ArrowRight')  setLightboxIndex(i => i !== null ? (i + 1) % photosVisible : 0)
        if (e.key === 'ArrowLeft')   setLightboxIndex(i => i !== null ? (i - 1 + photosVisible) % photosVisible : 0)
      }
      if (videoUrl && e.key === 'Escape') setVideoUrl(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxIndex, videoUrl, photosVisible])

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = (lightboxIndex !== null || videoUrl) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex, videoUrl])

  const nav = [
    { id: 'photos'   as Section, labelEn: 'Photos',                   labelAr: 'جميع الصور',              icon: '📷' },
    { id: 'articles' as Section, labelEn: 'Articles',                 labelAr: 'مقالات',           icon: '📰' },
    { id: 'videos'   as Section, labelEn: 'Videos',                   labelAr: 'مقاطع فيديو',         icon: '🎬' },
    { id: 'pdfs'     as Section, labelEn: 'Decisions & Developments', labelAr: 'قرارات ومستجدات', icon: '📄' },
  ]

  const visiblePhotos   = photosData.slice(0, photosVisible)
  const visibleArticles = articlesData.slice(0, articlesVisible)
  const visibleVideos   = videosData.slice(0, videosVisible)
  const visiblePdfs     = pdfsData.slice(0, pdfsVisible)

  return (
    <div className={styles.evWrapper}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className={styles.evHero}>
        <div className={styles.evHeroPattern} aria-hidden="true" />
        <div className={styles.evHeroGrain}   aria-hidden="true" />
        <div className={styles.evHeroContent}>
          <h1 className={styles.evHeroTitle}>
            {isAr ? 'جائزة الدكتور عائض القرني للتميز - مناسبات والمقالات' : 'Dr Ayed Alqarni Excellency Award Events & Articles'}
          </h1>
          <p className={styles.evHeroSubtitle}>
            {isAr
              ?  'استكشف مجموعتنا من اللحظات التي لا تُنسى والمقالات الثاقبة ومقاطع الفيديو الملهمة من الحفل'
              : 'Explore our collection of memorable moments, insightful articles, and inspiring videos from the ceremony'}
          </p>
          <div className={styles.evHeroDivider} aria-hidden="true" />
        </div>
      </div>

      {/* ── Ceremony Summary ─────────────────────────────── */}
      <div className={styles.evSummary}>
        <div className={styles.evSummaryInner}>
          <h2 className={styles.evSummaryTitle}>
            {isAr
              ? 'ملخص حفل وأحداث ومعلومات الدورة الأولى لجائزة الدكتورعايض القرني للتميز'
              : 'Summary of the Ceremony, Events, and Information for the First Edition of the Dr. Ayed Al-Qarni Award for Excellence'}
          </h2>
          <div className={styles.evSummaryDivider} aria-hidden="true" />
          <ul className={styles.evSummaryList}>
            {(isAr ? [
              'تحت رعاية صاحب السمو الملكي أمير منطقة عسير اقيم حفل الدورة الاولى لجائزة الدكتور عائض القرني للتميز يوم الأربعاء 12-2-1447هـ الموافق 6-8-2025م',
              'شرّف الحفل نيابة عن سمو أمير المنطقة سعادة محافظ محافظة بلقرن الأستاذ/محمد بن سعيد بن عامر.',
              'أقيم حفل جائزة الدكتور عائض القرني للتميز في سبت العلاية بمقر قاعة الكلية التقنية للبنات ببلقرن',
              'بدأ الحفل في تمام الساعة التاسعة مساءً وسط حضور كثيف رفيع المستوى من اصحاب المعالي والفضيلة والسعادة ووجهاء المجتمع السعودي.',
              'تناوب على تقديم الحفل كلٌ من الدكتور الاعلامي علي بن محمد آل حافظ والاعلامي محمد بن صالح ابو يزن.',
              'شملت فقرات الحفل:',
              'آيات من الذكر الحكيم تلاها الشيخ عبد الرحمن بن محمد بن شبيلي.',
              'كلمة الدكتور عائض القرني صاحب الجائزة والمشرف العام.',
              'فلم وثائقي عن الجائزة.',
              'كلمة معالي الدكتور علي بن عبدالخالق الطاحسي عن لوائح الجائزة.',
              'كلمة أ.د/ عبدالله بن محمد آل دميس عن تقنيات ومنصة الجائزة.',
              'قصيدة للشاعر سعيد بن ناصر.',
              'كلمة الدكتور منير القرني للتحدث عن أثر الجائزة.',
              'قصيدة الشاعر سعد بن شبرين.',
              'كلمة الدكتور سعيد بن محمد الكعيتي.',
              'إعلان أمين الجائزة للفائزين وتكريمهم بيد صاحب الجائزة ومحافظ محافظة بلقرن.',
              'دحيم بن محمد ال حويس، و علي بن محمد ال دواري، و بدر بن محمد آل رئيسه، و براء بنت عبد الكريم القرني، وأريج بن عبدالله القرني.',
              'فقرة خاصة لشكر وتكريم أصحاب المبادرات يتقدمهم الشيخ عثمان الشهري، وكلية التقنية للبنات، وشركة البرهان للمحاماة، وشركة الاوضح العقارية.',
              'اختتم الحفل بالاوبريت من كلمات الشاعر ناصر بن حسن وادائه مع المنشد فهد القرني وبحضور فرقة بلقرن.',
              'إعلان تبرع رجل الاعمال الشيخ مسفر بن عوضة للجائزة في دورتها القادمة بمبلغ 300 الف ريال.',
            ] : [
              'Under the patronage of His Royal Highness the Prince of Asir Region, the first ceremony of the Dr. Ayed Al-Qarni Award for Excellence was held on Wednesday, 12-2-1447 AH, corresponding to 6-8-2025 AD.',
              'The ceremony was honored by His Excellency the Governor of Balqarn Province, Mr. Mohammed bin Saeed bin Amer, on behalf of His Highness the Emir of the region.',
              'The Dr. Ayed Al-Qarni Award for Excellence ceremony was held in Sabt Al-Alaia at the Technical College for Girls in Balqarn.',
              'The ceremony began at 9 p.m. and was attended by a large number of high-ranking dignitaries, including Their Excellencies, Their Eminences, Their Honors, and prominent figures of Saudi society.',
              'The ceremony was hosted by media personality Dr. Ali bin Mohammed Al Hafiz and media personality Mohammed bin Saleh Abu Yazan.',
              'The ceremony included the following segments:',
              'Verses from the Wise Remembrance recited by Sheikh Abdul Rahman bin Muhammad bin Shibli.',
              'Speech by Dr. Ayed Al-Qarni, award winner and general supervisor.',
              'A documentary film about the award.',
              'Speech by His Excellency Dr. Ali bin Abdulkhaliq Al-Tahsi on the award regulations.',
              'A speech by Prof. Abdullah bin Mohammed Al-Damais on the award\'s technologies and platform.',
              'A poem by the poet Saeed bin Nasser.',
              'A speech by Dr. Munir Al-Qarni on the impact of the award.',
              'A poem by the poet Saad bin Shabrin.',
              'Speech by Dr. Saeed bin Mohammed Al-Kaity.',
              'The award secretary announces the winners and honors them with the award owner and the governor of Balqarn Province.',
              'Dahim bin Muhammad al-Huwais, Ali bin Muhammad al-Dawari, Badr bin Muhammad al-Ra\'is, Bara\'a bint Abdul Karim al-Qarni, and Arij bin Abdullah al-Qarni.',
              'A special section to thank and honor the initiators, led by Sheikh Othman Al-Shahri, the Technical College for Girls, Al-Burhan Law Firm, and Al-Awadh Real Estate Company.',
              'The ceremony concluded with an operetta written by poet Nasser bin Hassan and performed by singer Fahad Al-Qarni, accompanied by the Balqarn band.',
              'Announcement of a donation by businessman Sheikh Musfir bin Awadah to the award in its upcoming edition in the amount of 300,000 riyals.',
            ]).map((item, i) => (
              <li key={i} className={styles.evSummaryItem}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Navigation tabs ──────────────────────────────── */}
      <nav className={styles.evNav} aria-label="Content sections">
        {nav.map(item => (
          <button
            key={item.id}
            className={`${styles.evNavBtn} ${activeSection === item.id ? styles.evNavBtnActive : ''}`}
            onClick={() => setActiveSection(item.id)}
            aria-current={activeSection === item.id ? 'true' : undefined}>
            <span className={styles.evNavIcon} aria-hidden="true">{item.icon}</span>
            <span>{isAr ? item.labelAr : item.labelEn}</span>
          </button>
        ))}
      </nav>

      {/* ── Content ──────────────────────────────────────── */}
      <div className={styles.evContent}>

        {/* ── PHOTOS ── */}
        {activeSection === 'photos' && (
          <div className={styles.evSection}>
            <div className={styles.evPhotoGrid} ref={gridRef}>
              {visiblePhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  className={styles.evPhotoItem}
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`View photo ${index + 1}`}>
                  {/* ─ Plain <img> — no IntersectionObserver dependency ─ */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className={styles.evPhotoImg}
                    loading={index < 8 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  <div className={styles.evPhotoOverlay} aria-hidden="true">
                    <div className={styles.evPhotoZoomIcon}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                        <line x1="11" y1="8" x2="11" y2="14"/>
                        <line x1="8"  y1="11" x2="14" y2="11"/>
                      </svg>
                    </div>
                    <span className={styles.evPhotoLabel}>
                      {isAr ? 'عرض بحجم كامل' : 'View Full Size'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {photosVisible < photosData.length && (
              <button className={styles.evLoadMore} onClick={() => setPhotosVisible(v => v + PHOTOS_PER_PAGE)}>
                {isAr ? 'تحميل المزيد' : 'Load More'}
              </button>
            )}
          </div>
        )}

        {/* ── ARTICLES ── */}
        {activeSection === 'articles' && (
          <div className={styles.evSection}>
            <div className={styles.evArticleGrid}>
              {visibleArticles.map((article, index) => (
                <article
                  key={article.id}
                  className={styles.evArticleCard}
                  style={{ animationDelay: `${index * 80}ms` }}>
                  <div className={styles.evArticleImage}>
                    {/* plain img — same fix applied for consistency */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.image}
                      alt={isAr ? article.titleAr : article.titleEn}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className={styles.evArticleBadge}>{isAr ? 'مقالة' : 'Article'}</div>
                  </div>
                  <div className={styles.evArticleBody}>
                    <h3 className={styles.evArticleTitle}>
                      {isAr ? article.titleAr : article.titleEn}
                    </h3>
                    <p className={styles.evArticleExcerpt}>
                      {isAr ? article.excerptAr : article.excerptEn}
                    </p>
                    <div className={styles.evArticleFooter}>
                      <span className={styles.evArticleDate}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8"  y1="2" x2="8"  y2="6"/>
                          <line x1="3"  y1="10" x2="21" y2="10"/>
                        </svg>
                        {isAr ? article.dateAr : article.dateEn}
                      </span>
                      <a href={article.url} className={styles.evArticleBtn} target="_blank" rel="noopener noreferrer">
                        {isAr ? 'اقرأ المزيد ←' : 'Read More →'}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {articlesVisible < articlesData.length && (
              <button className={styles.evLoadMore} onClick={() => setArticlesVisible(v => v + ARTICLES_PER_PAGE)}>
                {isAr ? 'تحميل المزيد' : 'Load More'}
              </button>
            )}
          </div>
        )}

        {/* ── VIDEOS ── */}
        {activeSection === 'videos' && (
          <div className={styles.evSection}>
            <div className={styles.evVideoGrid}>
              {visibleVideos.map((video, index) => (
                <div
                  key={video.id}
                  className={styles.evVideoCard}
                  onClick={() => setVideoUrl(video.videoUrl)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Play: ${isAr ? video.titleAr : video.titleEn}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setVideoUrl(video.videoUrl)
                    }
                  }}
                  style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={styles.evVideoThumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail}
                      alt={isAr ? video.titleAr : video.titleEn}
                      loading="eager"
                      decoding="async"
                    />
                    <div className={styles.evVideoPlayBtn} aria-hidden="true" />
                    <div className={styles.evVideoDuration}>{video.duration}</div>
                    <div className={styles.evVideoOverlay} aria-hidden="true" />
                  </div>
                  <div className={styles.evVideoBody}>
                    <h3 className={styles.evVideoTitle}>{isAr ? video.titleAr : video.titleEn}</h3>
                  </div>
                </div>
              ))}
            </div>
            {videosVisible < videosData.length && (
              <button className={styles.evLoadMore} onClick={() => setVideosVisible(v => v + VIDEOS_PER_PAGE)}>
                {isAr ? 'تحميل المزيد' : 'Load More'}
              </button>
            )}
          </div>
        )}

        {/* ── PDFs ── */}
        {activeSection === 'pdfs' && (
          <div className={styles.evSection}>
            <div className={styles.evPdfGrid}>
              {visiblePdfs.map((pdf, index) => (
                <div
                  key={pdf.id}
                  className={styles.evPdfCard}
                  style={{ animationDelay: `${index * 80}ms` }}>
                  <div className={styles.evPdfIconArea}>
                    <div className={styles.evPdfPulse} aria-hidden="true" />
                    <div className={styles.evPdfIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="52" height="52">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L12,15H9V10H15V15L13,19H10Z"/>
                      </svg>
                    </div>
                    <span className={styles.evPdfBadge}>PDF</span>
                  </div>
                  <div className={styles.evPdfBody}>
                    <h3 className={styles.evPdfTitle}>{isAr ? pdf.titleAr : pdf.titleEn}</h3>
                    <p className={styles.evPdfDesc}>{isAr ? pdf.descriptionAr : pdf.descriptionEn}</p>
                    <div className={styles.evPdfFooter}>
                      <span className={styles.evPdfSize}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                          <polyline points="13 2 13 9 20 9"/>
                        </svg>
                        {pdf.fileSize}
                      </span>
                      <a href={pdf.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.evPdfBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        {isAr ? 'تحميل' : 'Download'}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pdfsVisible < pdfsData.length && (
              <button className={styles.evLoadMore} onClick={() => setPdfsVisible(v => v + PDFS_PER_PAGE)}>
                {isAr ? 'تحميل المزيد' : 'Load More'}
              </button>
            )}
          </div>
        )}

      </div>

      {/* ── Photo Lightbox ───────────────────────────────── */}
      {lightboxIndex !== null && (
        <div
          className={styles.evLightbox}
          onClick={e => { if (e.target === e.currentTarget) setLightboxIndex(null) }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer">
          <div className={styles.evLightboxContent}>
            <button className={styles.evLightboxClose} onClick={() => setLightboxIndex(null)} aria-label="Close">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6"  y2="18"/>
                <line x1="6"  y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <button
              className={`${styles.evLightboxNav} ${styles.evLightboxPrev}`}
              onClick={() => setLightboxIndex(i => i !== null ? (i - 1 + visiblePhotos.length) % visiblePhotos.length : 0)}
              aria-label="Previous photo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={visiblePhotos[lightboxIndex].src}
              alt={visiblePhotos[lightboxIndex].alt}
              className={styles.evLightboxImg}
            />
            <button
              className={`${styles.evLightboxNav} ${styles.evLightboxNext}`}
              onClick={() => setLightboxIndex(i => i !== null ? (i + 1) % visiblePhotos.length : 0)}
              aria-label="Next photo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <div className={styles.evLightboxCounter}>
              {lightboxIndex + 1} / {visiblePhotos.length}
            </div>
          </div>
        </div>
      )}

      {/* ── Video Modal ───────────────────────────────────── */}
      {videoUrl && (
        <div
          className={styles.evVideoModal}
          onClick={e => { if (e.target === e.currentTarget) setVideoUrl(null) }}
          role="dialog"
          aria-modal="true"
          aria-label="Video player">
          <div className={styles.evVideoModalContent}>
            <button className={styles.evVideoModalClose} onClick={() => setVideoUrl(null)} aria-label="Close video">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6"  y2="18"/>
                <line x1="6"  y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <iframe
              className={styles.evVideoIframe}
              src={`${videoUrl}?autoplay=1&mute=1`}
              allowFullScreen
              allow="autoplay; fullscreen"
              title="Video player"
            />
          </div>
        </div>
      )}

    </div>
  )
}
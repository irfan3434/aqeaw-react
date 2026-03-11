'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './SpotlightShowcase.module.css'

const spotlightData = {
  en: [
    {
      id: 'spotlight-1',
      src: '/images/spotlight-2.png',
      alt: 'Gallery Image 1',
      heading: 'Bound by tradition, thriving together!',
      paragraph: 'A moment of togetherness, echoing the spirit of our ancestors.',
    },
    {
      id: 'spotlight-2',
      src: '/images/spotlight-1.jpg',
      alt: 'Gallery Image 2',
      heading: 'Proud to stand as One!',
      paragraph: 'Preserving our cultural heritage with strength and solidarity',
    },
  ],
  ar: [ 
    {
      id: 'spotlight-1',
      src: '/images/spotlight-2.png',
      alt: 'صورة المعرض 1',
      heading: 'متحدون و مزدهرون معًا!',
      paragraph: 'لحظة من الوحدة، تجسد روح أسلافنا.',
    },
    {
      id: 'spotlight-2',
      src: '/images/spotlight-1.jpg',
      alt: 'صورة المعرض 2',
      heading: 'فخورون بالوقوف صفاً واحداً!',
      paragraph: 'نحافظ على إرثنا الثقافي بالقوة والتضامن.',
    },
  ],
}

export default function SpotlightShowcase() {
  const { lang } = useLanguage()
  const items = spotlightData[lang]
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxAlt, setLightboxAlt] = useState<string>('')

  const openLightbox = (src: string, alt: string) => {
    setLightboxSrc(src)
    setLightboxAlt(alt)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxSrc(null)
    setLightboxAlt('')
    document.body.style.overflow = ''
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox()
  }

  return (
    <>
      <div className={styles.spotlightGallery}>
        {items.map((item) => (
          <div
            key={item.id}
            className={styles.spotlightGalleryItem}
            onClick={() => openLightbox(item.src, item.alt)}
            role="button"
            tabIndex={0}
            aria-label={`View full image: ${item.heading}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openLightbox(item.src, item.alt)
              }
            }}>

            {/* Image */}
            <div className={styles.spotlightImageWrapper}>
              <NextImage
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
                loading="lazy"
              />
            </div>

            {/* Caption */}
            <div className={styles.spotlightCaption}>
              <h2 className={styles.spotlightCaptionHeading}>{item.heading}</h2>
              <p className={styles.spotlightCaptionParagraph}>{item.paragraph}</p>
            </div>

          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className={styles.spotlightLightbox}
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          tabIndex={-1}>
          <div className={styles.spotlightLightboxImageWrapper}>
            <NextImage
              src={lightboxSrc}
              alt={lightboxAlt}
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <button
            className={styles.spotlightLightboxClose}
            onClick={closeLightbox}
            aria-label="Close lightbox">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './Winners.module.css'

const winnersData = {
  en: {
    heading: 'Ayed Alqarni Award Winners (Batch of 2025)',
    paragraph: 'Honoring outstanding individuals for their exceptional achievements.',
    winners: [
      { id: 'w-001', name: 'Dahim bin Mohammed Al-Huwais',      image: '/images/winner-1.webp' },
      { id: 'w-002', name: 'Ali bin Mohammed Al-Dawari',         image: '/images/winner-2.webp' },
      { id: 'w-003', name: "Bara'a bint Abdul Karim Al-Qarni",   image: '/images/winner-4.webp' },
      { id: 'w-004', name: 'Badr bin Mohammed Al Raisa',         image: '/images/winner-3.webp' },
      { id: 'w-005', name: 'Areej bint Abdullah Al-Qarni',       image: '/images/winner-5.webp' },
    ],
  },
  ar: {
    heading: 'الفائزون بجائزة عايض القرني (دفعة 2025)',
    paragraph: 'تكريم الأفراد المتميزين لإنجازاتهم الاستثنائية.',
    winners: [
      { id: 'w-001', name: 'دحيم بن محمد ال حويس',       image: '/images/winner-1.webp' },
      { id: 'w-002', name: 'علي بن محمد ال دواري',        image: '/images/winner-2.webp' },
      { id: 'w-003', name: 'براء بنت عبدالكريم القرني',   image: '/images/winner-4.webp' },
      { id: 'w-004', name: 'بدر بن محمد آل رئيسه',        image: '/images/winner-3.webp' }
      { id: 'w-005', name: 'أريج بن عبدالله القرني',      image: '/images/winner-5.webp' },
    ],
  },
}

interface Winner {
  id: string
  name: string
  image: string
}

export default function Winners() {
  const { lang } = useLanguage()
  const data = winnersData[lang]
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null)
  const [modalClosing, setModalClosing] = useState(false)

  const openModal = (winner: Winner) => {
    setSelectedWinner(winner)
    setModalClosing(false)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setModalClosing(true)
    setTimeout(() => {
      setSelectedWinner(null)
      setModalClosing(false)
      document.body.style.overflow = ''
    }, 250)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal()
  }

  const handleKeyDown = (e: React.KeyboardEvent, winner: Winner) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openModal(winner)
    }
  }

  return (
    <>
      <section
        id="winners"
        className={styles.winnersSection}
        aria-labelledby="winners-heading">

        <div className={styles.winnersContainer}>

          {/* Intro */}
          <div className={styles.winnersIntro}>
            <h2 id="winners-heading" className={styles.winnersIntroHeading}>
              {data.heading}
            </h2>
            <p className={styles.winnersIntroParagraph}>
              {data.paragraph}
            </p>
          </div>

          {/* Grid */}
          <div className={styles.winnersGrid}>
            {data.winners.map((winner) => (
              <article
                key={winner.id}
                className={styles.winnersCard}
                onClick={() => openModal(winner)}
                onKeyDown={(e) => handleKeyDown(e, winner)}
                tabIndex={0}
                role="button"
                aria-label={`View full image of ${winner.name}`}>

                <div className={styles.winnersCardImage}>
                  <NextImage
                    src={winner.image}
                    alt={winner.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />
                  {/* Expand icon on hover */}
                  <div className={styles.winnersCardExpandIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 3 21 3 21 9"/>
                      <polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/>
                      <line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                  </div>
                </div>

                <div className={styles.winnersCardContent}>
                  <h3 className={styles.winnersCardName}>{winner.name}</h3>
                </div>

              </article>
            ))}
          </div>

        </div>
      </section>

      {/* Modal */}
      {selectedWinner && (
        <div
          className={`${styles.winnersModalBackdrop} ${modalClosing ? styles.winnersModalBackdropClosing : ''}`}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-winner-name">

          <div className={`${styles.winnersModal} ${modalClosing ? styles.winnersModalClosing : ''}`}>

            {/* Close Button */}
            <button
              className={styles.winnersModalCloseBtn}
              onClick={closeModal}
              aria-label="Close modal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Modal Content */}
            <div className={styles.winnersModalContent}>

              {/* Image */}
              <div className={styles.winnersModalImageWrapper}>
                <NextImage
                  src={selectedWinner.image}
                  alt={selectedWinner.name}
                  fill
                  sizes="(max-width: 768px) 95vw, 50vw"
                  style={{ objectFit: 'cover' }}
                  priority
                />
                {/* Name overlay on image */}
                <div className={styles.winnersModalImageOverlay}>
                  <h3 id="modal-winner-name" className={styles.winnersModalTitle}>
                    {selectedWinner.name}
                  </h3>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import { fetchPublishedProfileCards, profileCardPhotoSrc, type ProfileCardItem } from '../../lib/adminApi'
import ProfileCard from '../ProfileCard/ProfileCard'
import styles from './Winners.module.css'

const winnersData = {
  en: {
    heading: 'Ayed Alqarni Award Winners (Batch of 2025)',
    paragraph: 'Honoring outstanding individuals for their exceptional achievements.',
    winners: [
      { id: 'w-001', name: 'Dahim bin Mohammed Al-Huwais',      image: '/images/winner-1.webp' },
      { id: 'w-002', name: 'Ali bin Mohammed Al-Dawari',         image: '/images/winner-2.webp' },
      { id: 'w-003', name: "Bara'a bint Abdul Karim Al-Qarni",   image: '/images/winner-3.webp' },
      { id: 'w-004', name: 'Badr bin Mohammed Al Raisa',         image: '/images/winner-4.webp' },
      { id: 'w-005', name: 'Areej bint Abdullah Al-Qarni',       image: '/images/winner-5.webp' },
    ],
  },
  ar: {
    heading: 'الفائزون بجائزة عايض القرني (دفعة 2025)',
    paragraph: 'تكريم الأفراد المتميزين لإنجازاتهم الاستثنائية.',
    winners: [
      { id: 'w-001', name: 'دحيم بن محمد ال حويس',       image: '/images/winner-1.webp' },
      { id: 'w-002', name: 'علي بن محمد ال دواري',        image: '/images/winner-2.webp' },
      { id: 'w-003', name: 'براء بنت عبدالكريم القرني',   image: '/images/winner-3.webp' },
      { id: 'w-004', name: 'بدر بن محمد آل رئيسه',        image: '/images/winner-4.webp' },
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
  // Profile cards published from the admin dashboard (/admin/profile-cards)
  const [profileCards, setProfileCards] = useState<ProfileCardItem[]>([])
  const [selectedCard, setSelectedCard] = useState<ProfileCardItem | null>(null)

  useEffect(() => {
    let alive = true
    fetchPublishedProfileCards()
      .then((cards) => alive && setProfileCards(cards))
      .catch(() => {
        /* API unreachable: show only the static winners */
      })
    return () => {
      alive = false
    }
  }, [])

  // Lock page scrolling while a modal is open
  const modalOpen = Boolean(selectedWinner || selectedCard)
  useEffect(() => {
    if (!modalOpen) return
    const body = document.body
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = ''
    }
  }, [modalOpen])

  const openModal = (winner: Winner) => {
    setSelectedWinner(winner)
    setModalClosing(false)
  }

  const openCard = (card: ProfileCardItem) => {
    setSelectedCard(card)
    setModalClosing(false)
  }

  const closeModal = () => {
    setModalClosing(true)
    setTimeout(() => {
      setSelectedWinner(null)
      setSelectedCard(null)
      setModalClosing(false)
    }, 250)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal()
  }

  const handleKeyDown = (e: React.KeyboardEvent, open: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  const expandIcon = (
    <div className={styles.winnersCardExpandIcon} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 3 21 3 21 9"/>
        <polyline points="9 21 3 21 3 15"/>
        <line x1="21" y1="3" x2="14" y2="10"/>
        <line x1="3" y1="21" x2="10" y2="14"/>
      </svg>
    </div>
  )

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
                onKeyDown={(e) => handleKeyDown(e, () => openModal(winner))}
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
                  {expandIcon}
                </div>

                <div className={styles.winnersCardContent}>
                  <h3 className={styles.winnersCardName}>{winner.name}</h3>
                </div>

              </article>
            ))}

            {/* Profile cards added by admins, styled like the winner images */}
            {profileCards.map((card) => {
              const name = card.rname || card.foot
              return (
                <article
                  key={card._id}
                  className={styles.winnersCard}
                  onClick={() => openCard(card)}
                  onKeyDown={(e) => handleKeyDown(e, () => openCard(card))}
                  tabIndex={0}
                  role="button"
                  aria-label={`View full card of ${name}`}>

                  <div className={styles.winnersCardImage}>
                    <div className={styles.winnersCardProfile}>
                      <ProfileCard card={card} photoSrc={profileCardPhotoSrc(card.photoUrl)} />
                    </div>
                    {expandIcon}
                  </div>

                  <div className={styles.winnersCardContent}>
                    <h3 className={styles.winnersCardName}>{name}</h3>
                  </div>

                </article>
              )
            })}
          </div>

        </div>
      </section>

      {/* Modal: full profile card */}
      {selectedCard && (
        <div
          className={`${styles.winnersModalBackdrop} ${modalClosing ? styles.winnersModalBackdropClosing : ''}`}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label={selectedCard.rname || selectedCard.foot}>

          <div className={`${styles.winnersModal} ${styles.winnersModalCard} ${modalClosing ? styles.winnersModalClosing : ''}`}>
            <button
              className={styles.winnersModalCloseBtn}
              onClick={closeModal}
              aria-label="Close modal">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <ProfileCard card={selectedCard} photoSrc={profileCardPhotoSrc(selectedCard.photoUrl)} />
          </div>
        </div>
      )}

      {/* Modal: winner image */}
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
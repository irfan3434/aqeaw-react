import type { CSSProperties, ReactNode } from 'react'
import styles from './ProfileCard.module.css'
import { GOLD_SEAM_PATH, NAVY_CORNER_PATH } from './paths'

export interface ProfileCardData {
  tag: string
  rank: string
  rname: string
  h1: string
  h2: string
  p1: string
  p2: string
  foot: string
  mode: 'cutout' | 'circle'
  /** Old cards may still store '1' or '3'; every card now uses one design */
  variant: '1' | '2' | '3'
  navy: string
  gold: string
  footc: string
}

export const PROFILE_CARD_DEFAULTS: ProfileCardData = {
  tag: 'الفــائــز',
  rank: 'الرتبة أو المسمى',
  rname: 'الاسم الكامل للشخص',
  h1: 'عنوان رئيسي يلخص الإنجاز في سطر واحد',
  h2: 'المسمى واسم الشخص الكامل',
  p1: 'اكتب هنا النبذة الأولى عن الشخص: إنجازاته وخبراته ومسيرته المهنية والعلمية. اذكر **أبرز المحطات** في مسيرته، والمناصب التي شغلها، والمؤهلات العلمية التي حصل عليها.',
  p2: 'يمكن أن تتناول الفقرة الثانية المشاركات والأنشطة الأخرى، أو أي معلومات إضافية تريد إبرازها في نهاية البطاقة.',
  foot: 'الاسم الكامل',
  mode: 'cutout',
  variant: '2',
  navy: '#203859',
  gold: '#9C7B4A',
  footc: '#1A2332',
}

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@300;400&family=Cairo:wght@300;400;500;700;800&display=swap'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 200"><ellipse cx="70" cy="46" rx="31" ry="38" fill="#E9E1D0"/><path d="M4 200L8 142C12 114 40 100 70 98C100 100 128 114 132 142L136 200Z" fill="#E9E1D0"/></svg>'
  )

/** Text with **bold** parts. */
function rich(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))
}

export default function ProfileCard({ card, photoSrc }: { card: ProfileCardData; photoSrc?: string }) {
  const style = { '--navy': card.navy, '--gold': card.gold, '--foot': card.footc } as CSSProperties

  return (
    <article className={styles.card} style={style} dir="rtl" lang="ar">
      {/* React hoists this to <head> and loads it once */}
      <link rel="stylesheet" href={FONTS_URL} precedence="default" />
      <div className={styles.inside}>
        <div className={`${styles.top} ${card.mode === 'circle' ? styles.circle : styles.cutout}`}>
          <svg className={styles.layer} viewBox="0 0 360 270" preserveAspectRatio="none" aria-hidden="true">
            <path d={NAVY_CORNER_PATH} style={{ fill: 'var(--navy)' }} />
            <circle cx="162.5" cy="125.5" r="83.5" style={{ fill: 'var(--gold)' }} />
            <image href="/images/profile-card/calligraphy.png" x="0" y="0" width="360" height="270" preserveAspectRatio="none" />
          </svg>

          <div className={styles.photobox}>
            {/* eslint-disable-next-line @next/next/no-img-element -- photo comes from the API or a local data URL */}
            <img src={photoSrc || PLACEHOLDER} alt={card.rname || 'صورة الشخص'} />
          </div>

          <svg className={`${styles.layer} ${styles.over}`} viewBox="0 0 360 270" preserveAspectRatio="none" aria-hidden="true">
            <path d={GOLD_SEAM_PATH} fill="none" strokeWidth="1" style={{ stroke: 'var(--gold)' }} />
          </svg>

          {/* Word in the blue corner, with the diamond centred under it */}
          <div className={styles.tag}>
            <span>{card.tag}</span>
            <span className={styles.diamond} />
          </div>

          <div className={`${styles.ribbon} ${card.rank.trim() ? '' : styles.ribbonNoRank}`}>
            {card.rank.trim() && <span className={styles.rank}>{card.rank}</span>}
            <span className={styles.rname}>{card.rname}</span>
          </div>
        </div>

        <div className={styles.content}>
          <h3 className={styles.h1}>{card.h1}</h3>
          <h4 className={styles.h2}>{card.h2}</h4>
          <div className={styles.decor} aria-hidden="true">
            <svg viewBox="0 0 360 22" preserveAspectRatio="none">
              {/* Flat under the text, then curves up in the empty margin on the right (like the winner photos) */}
              <path d="M6 16 H 296 C 326 16 348 10 360 2" fill="none" strokeWidth="0.9" style={{ stroke: 'var(--gold)' }} />
              <rect x="0" y="13" width="6" height="6" style={{ fill: 'var(--gold)' }} />
            </svg>
          </div>
          {card.p1 && <p className={styles.p}>{rich(card.p1)}</p>}
          {card.p2 && <p className={styles.p}>{rich(card.p2)}</p>}
        </div>

      </div>
    </article>
  )
}

'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faXTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './TopBar.module.css'

export default function TopBar() {
  const { lang, mounted, toggleLanguage } = useLanguage()

  return (
    <div className={styles.topBar}>
      <div className={styles.topBarContainer}>

        <div className={styles.socialIcons}>
          <a href="https://facebook.com" className={styles.socialIcon} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FontAwesomeIcon icon={faFacebookF} />
          </a>
          <a href="https://twitter.com" className={styles.socialIcon} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <FontAwesomeIcon icon={faXTwitter} />
          </a>
          <a href="https://instagram.com" className={styles.socialIcon} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
        </div>

        {/* Only render language buttons after client has mounted */}
        {mounted && (
          <div className={styles.languageSwitcher}>
            <button
              className={`${styles.languageBtn} ${lang === 'en' ? styles.active : ''}`}
              onClick={() => toggleLanguage('en')}>
              EN
            </button>
            <button
              className={`${styles.languageBtn} ${lang === 'ar' ? styles.active : ''}`}
              onClick={() => toggleLanguage('ar')}>
              AR
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
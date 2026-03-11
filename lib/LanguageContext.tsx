'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'ar'

interface LanguageContextType {
  lang: Language
  mounted: boolean
  toggleLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  mounted: false,
  toggleLanguage: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language | null
    const initial = saved === 'ar' ? 'ar' : 'en'
    setLang(initial)
    document.documentElement.setAttribute('lang', initial)
    document.documentElement.setAttribute('dir', initial === 'ar' ? 'rtl' : 'ltr')
    setMounted(true)
  }, [])

  const toggleLanguage = (selected: Language) => {
    setLang(selected)
    document.documentElement.setAttribute('lang', selected)
    document.documentElement.setAttribute('dir', selected === 'ar' ? 'rtl' : 'ltr')
    localStorage.setItem('lang', selected)
  }

  return (
    <LanguageContext.Provider value={{ lang, mounted, toggleLanguage }}>
      {/* Hide children until language is confirmed to prevent flash */}
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
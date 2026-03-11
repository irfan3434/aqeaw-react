import type { Metadata } from 'next'
import { LanguageProvider } from '../lib/LanguageContext'
import TopBar from '../components/Navbar/TopBar'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'AQEAW',
  description: 'AQEAW Official Website',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* This script runs BEFORE React hydrates — eliminates the flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var lang = localStorage.getItem('lang');
              if (lang === 'ar') {
                document.documentElement.setAttribute('lang', 'ar');
                document.documentElement.setAttribute('dir', 'rtl');
              } else {
                document.documentElement.setAttribute('lang', 'en');
                document.documentElement.setAttribute('dir', 'ltr');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <LanguageProvider>
          <TopBar />
          <Navbar />
          <main id="main-content">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
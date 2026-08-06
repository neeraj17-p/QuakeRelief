'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { messages, type Locale } from './index'
import { LocaleContext } from './locale-context'

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem('qr-locale') as Locale | null
  if (saved && ['en', 'mr', 'hi'].includes(saved)) {
    return saved
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  // Sync <html lang> with current locale and other tabs
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // Sync with other tabs via storage events
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'qr-locale' && e.newValue) {
        const val = e.newValue as Locale
        if (['en', 'mr', 'hi'].includes(val)) {
          setLocaleState(val)
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('qr-locale', newLocale)
    document.documentElement.lang = newLocale
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Asia/Kolkata">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}

export type { Locale }

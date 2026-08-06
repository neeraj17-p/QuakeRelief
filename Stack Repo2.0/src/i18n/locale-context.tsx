'use client'

import { createContext, useContext } from 'react'
import type { Locale } from './index'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
})

export const useLocaleContext = () => useContext(LocaleContext)

import en from './en.json'
import mr from './mr.json'
import hi from './hi.json'

export const locales = ['en', 'mr', 'hi'] as const
export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  mr: 'मराठी',
  hi: 'हिन्दी',
}

export const messages: Record<Locale, Record<string, any>> = { en, mr, hi }

export const defaultLocale: Locale = 'en'

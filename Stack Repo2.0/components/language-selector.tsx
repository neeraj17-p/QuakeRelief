'use client'

import { Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleContext } from '@/i18n/locale-context'
import { locales, localeNames, type Locale } from '@/i18n/index'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSelector() {
  const t = useTranslations('language')
  const { locale, setLocale } = useLocaleContext()

  const localeLabels: Record<Locale, string> = {
    en: 'EN',
    mr: 'मरा',
    hi: 'हिं',
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">{localeLabels[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-slate-900 border-white/15 min-w-[160px]"
      >
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={`text-sm cursor-pointer focus:bg-white/10 ${
              locale === loc
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300'
            }`}
          >
            <Globe className="h-3.5 w-3.5 mr-2 shrink-0 opacity-60" />
            <span className="flex-1">{localeNames[loc]}</span>
            {locale === loc && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

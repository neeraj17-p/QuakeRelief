'use client'

import { useTranslations } from 'next-intl'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, Heart, Building2 } from 'lucide-react'

// ─── Props ───────────────────────────────────────────────────────────────────

interface QuickActionsProps {
  showSafeForm: boolean
  showHelpForm: boolean
  showInfraForm: boolean
  onToggleSafe: () => void
  onToggleHelp: () => void
  onToggleInfra: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function QuickActions({
  showSafeForm,
  showHelpForm,
  showInfraForm,
  onToggleSafe,
  onToggleHelp,
  onToggleInfra,
}: QuickActionsProps) {
  const t = useTranslations('citizen')

  return (
    <section aria-label="Quick Actions">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* I'm Safe button */}
        <div className="space-y-2">
          <button
            onClick={onToggleSafe}
            className="relative w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:from-emerald-800 active:to-emerald-900 text-white font-semibold text-lg h-12 px-6 transition-all duration-150 shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            <span className="absolute left-5 size-10 rounded-full bg-white/10 flex items-center justify-center">
              <ShieldCheck className="size-7" />
            </span>
            {t('imSafe')}
          </button>
          <p className="text-xs text-center text-muted-foreground">{t('markSafe')}</p>
        </div>

        {/* Need Help button — opens Emergency Numbers Dialog */}
        <div className="space-y-2">
          <button
            onClick={onToggleHelp}
            className="relative w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white font-semibold text-lg h-12 px-6 transition-all duration-150 shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            <span className="absolute left-5 size-10 rounded-full bg-white/10 flex items-center justify-center">
              <Heart className="size-7" />
            </span>
            {t('needHelp')}
          </button>
          <p className="text-xs text-center text-muted-foreground">{t('emergencyContacts')}</p>
        </div>

        {/* Report Infrastructure button */}
        <div className="space-y-2">
          <button
            onClick={onToggleInfra}
            className="relative w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:from-amber-800 active:to-amber-900 text-white font-semibold text-lg h-12 px-6 transition-all duration-150 shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          >
            <span className="absolute left-5 size-10 rounded-full bg-white/10 flex items-center justify-center">
              <Building2 className="size-7" />
            </span>
            {t('reportInfra')}
          </button>
          <p className="text-xs text-center text-muted-foreground">{t('reportInfraDesc')}</p>
        </div>
      </div>

      {/* Progress-like line with message */}
      <div className="mt-3 flex items-center gap-3">
        <Separator className="flex-1" />
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {t('safetyMatters')}
        </p>
        <Separator className="flex-1" />
      </div>
    </section>
  )
}
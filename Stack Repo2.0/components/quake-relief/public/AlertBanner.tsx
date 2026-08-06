'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Radio } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useVoiceAlertListener } from '@/hooks/use-voice-alert-listener'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Alert {
  id: string
  title: string
  message: string
  severity: string
  targetRole: string
  isActive: boolean
  createdAt: string
}

// ─── Severity config ────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  EVACUATION: 'bg-orange-500 text-white',
  WARNING: 'bg-amber-500 text-white',
  INFO: 'bg-blue-500 text-white',
}

const SEVERITY_ICONS: Record<string, string> = {
  CRITICAL: '\u{1F534}',
  EVACUATION: '\u{1F7E0}',
  WARNING: '\u{1F7E1}',
  INFO: '\u{1F535}',
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AlertBannerProps {
  alerts: Alert[]
  dismissedAlerts: Set<string>
  onDismiss: (id: string) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AlertBanner({ alerts, dismissedAlerts, onDismiss }: AlertBannerProps) {
  const t = useTranslations('citizen')

  // Listen for cross-portal voice broadcasts from SEOC
  useVoiceAlertListener()

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id))

  return (
    <>
      {/* ═══════════════ 0. EARTHQUAKE EVENT HERO BANNER ═══════════════ */}
      <div className="relative border-l-4 border-red-500 bg-gradient-to-br from-red-50/80 via-red-50/40 to-transparent dark:from-red-950/40 dark:via-red-950/20 dark:to-transparent seismic-pattern overflow-hidden">
        <div className="relative inset-0 bg-gradient-to-r from-transparent via-transparent to-background/30 pointer-events-none" />
        {/* Seismic wave animation rings */}
        <div className="relative left-[39px] top-1/2 -translate-y-1/2 -translate-x-1/2 z-0">
          <div className="seismic-wave-ring size-8" style={{ animationDelay: '0s' }} />
          <div className="seismic-wave-ring size-8" style={{ animationDelay: '0.75s' }} />
          <div className="seismic-wave-ring size-8" style={{ animationDelay: '1.5s' }} />
          <div className="seismic-wave-ring size-8" style={{ animationDelay: '2.25s' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-4 sm:py-5 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left side: Earthquake details */}
            <div className="flex items-start gap-3">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <span className="absolute size-4 rounded-full bg-red-500 animate-ping opacity-75" />
                <span className="relative size-3 rounded-full bg-red-600" />
              </div>
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-red-700 tracking-tight">
                    M6.2
                  </span>
                  <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    {t('earthquakeBadge')}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-foreground font-semibold mt-0.5">
                  {t('laturSeocHub')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('depthValue')} &middot; 2 hours ago
                </p>
              </div>
            </div>

            {/* Right side: Source info */}
            <div className="sm:text-right text-xs text-muted-foreground space-y-1 sm:pl-6">
              <div className="flex items-center gap-1.5 sm:justify-end">
                <Radio className="size-3.5" />
                <span>{t('nationalCenterSeismology')}</span>
              </div>
              <p>{t('eventIdLabel')} EQ-UT-2025-001</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ 1. ALERT BANNER ═══════════════ */}
      {visibleAlerts.length > 0 && (
        <div className="w-full bg-gradient-to-r from-red-50/40 via-amber-50/30 to-transparent">
          <div className="flex flex-wrap gap-3 p-3.5">
            {visibleAlerts.map((alert) => {
              const severityBorder = alert.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500' : alert.severity === 'WARNING' ? 'border-l-4 border-l-amber-500' : alert.severity === 'INFO' ? 'border-l-4 border-l-blue-500' : alert.severity === 'EVACUATION' ? 'border-l-4 border-l-orange-700' : ''
              const severityBg = alert.severity === 'CRITICAL' ? 'bg-gradient-to-r from-red-50/60 to-card dark:from-red-950/30 dark:to-card' : alert.severity === 'WARNING' ? 'bg-gradient-to-r from-amber-50/60 to-card dark:from-amber-950/30 dark:to-card' : alert.severity === 'INFO' ? 'bg-gradient-to-r from-blue-50/40 to-card dark:from-blue-950/20 dark:to-card' : alert.severity === 'EVACUATION' ? 'bg-gradient-to-r from-orange-50/60 to-card dark:from-orange-950/30 dark:to-card' : ''
              return (
              <div
                key={alert.id}
                className={`alert-slide-down flex items-center gap-2.5 px-5 py-3 rounded-lg shadow-sm min-w-0 flex-1 max-w-full border ${severityBorder} ${severityBg} ${SEVERITY_STYLES[alert.severity] || 'bg-gray-500 text-white'}`}
              >
                <span className="text-base shrink-0" role="img" aria-label={alert.severity}>
                  {SEVERITY_ICONS[alert.severity] || '\u26A0\uFE0F'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-tight">{alert.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label={t('dismissAlert')}
                >
                  <X className="size-3.5" />
                </button>
              </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

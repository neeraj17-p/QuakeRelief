'use client'

import { Fragment } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, MapPin, Navigation, Route } from 'lucide-react'
import type { SquadStatus } from '@/store/app-store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActiveIncident {
  id: string
  type: string
  description: string | null
  priority: string
  verificationTier: string
  clusterCount: number
  reporterName: string | null
  reportedBy: string
}

interface ActiveTaskPanelProps {
  isOccupied: boolean
  isDispatched: boolean
  isEnRoute: boolean
  isOnSite: boolean
  activeIncident: ActiveIncident | null
  currentStageIndex: number
  onArriveOnSite: () => void
  onCompleteResolve: () => void
  onBeginTransit: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MILESTONE_STAGES: SquadStatus[] = ['DISPATCHED', 'EN_ROUTE', 'ON_SITE', 'RESOLVED']
const MILESTONE_LABELS = ['Dispatched', 'En Route', 'On Site', 'Resolved']

const INCIDENT_TYPE_CONFIG: Record<
  string,
  { color: string; fillColor: string; badge: string; badgeClass: string }
> = {
  COLLAPSE: {
    color: '#dc2626',
    fillColor: '#dc2626',
    badge: 'COLLAPSE',
    badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  MEDICAL: {
    color: '#ec4899',
    fillColor: '#ec4899',
    badge: 'MEDICAL',
    badgeClass: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
  },
  LANDSLIDE: {
    color: '#f97316',
    fillColor: '#f97316',
    badge: 'LANDSLIDE',
    badgeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  },
  ROAD_BLOCK: {
    color: '#eab308',
    fillColor: '#eab308',
    badge: 'ROAD BLOCK',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  },
  FIRE: {
    color: '#ef4444',
    fillColor: '#f97316',
    badge: 'FIRE',
    badgeClass: 'bg-red-600/20 text-red-300 border border-red-600/30',
  },
  FLOOD: {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    badge: 'FLOOD',
    badgeClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
}

const DEFAULT_TYPE_CONFIG = {
  color: '#64748b',
  fillColor: '#64748b',
  badge: 'OTHER',
  badgeClass: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: 'CRITICAL', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  HIGH: { label: 'HIGH', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  MEDIUM: { label: 'MEDIUM', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  LOW: { label: 'LOW', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ActiveTaskPanel({
  isOccupied,
  isDispatched,
  isEnRoute,
  isOnSite,
  activeIncident,
  currentStageIndex,
  onArriveOnSite,
  onCompleteResolve,
  onBeginTransit,
}: ActiveTaskPanelProps) {
  return (
    <>
      {/* ── Active Task Panel (only when occupied: EN_ROUTE or ON_SITE) ── */}
      {isOccupied && activeIncident && (
        <section className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 space-y-4">
          {/* ── Milestone Stage Meter ── */}
          <div>
            <h3 className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Mission Progress
            </h3>
            <div className="flex items-center w-full">
              {MILESTONE_LABELS.map((label, i) => {
                const isCompleted = i < currentStageIndex
                const isCurrent = i === currentStageIndex
                const isFuture = i > currentStageIndex
                const isLast = i === MILESTONE_LABELS.length - 1
                const isConnectorActive = i < currentStageIndex

                return (
                  <Fragment key={label}>
                    {/* Stage circle + label */}
                    <div className="flex flex-col items-center gap-1.5 relative z-10 shrink-0">
                      <div className="relative">
                        <div
                          className={`h-9 w-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                            isCompleted
                              ? 'bg-gradient-to-br from-blue-500 to-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                              : isCurrent
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-400 border-blue-400 text-white shadow-lg shadow-blue-500/40'
                                : 'bg-slate-800 border-slate-600 text-slate-500'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span>{i + 1}</span>
                          )}
                        </div>
                        {isCurrent && (
                          <div className="absolute inset-[-4px] rounded-full border-2 border-blue-400/60 animate-ping" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-semibold tracking-wide text-center ${
                          isFuture ? 'text-slate-500' : isCurrent ? 'text-blue-400' : 'text-emerald-400'
                        }`}
                      >
                        {label}
                      </span>
                    </div>

                    {/* Connector line between stages */}
                    {!isLast && (
                      <div
                        className={`flex-1 h-3 relative mx-1 sm:mx-2 ${
                          isConnectorActive
                            ? 'milestone-connector milestone-connector-active'
                            : 'milestone-connector'
                        }`}
                      />
                    )}
                  </Fragment>
                )
              })}
            </div>
          </div>

          <div className="h-px bg-slate-700/50" />

          {/* ── Active Incident Summary ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={
                    INCIDENT_TYPE_CONFIG[activeIncident.type]?.badgeClass ||
                    DEFAULT_TYPE_CONFIG.badgeClass
                  }
                >
                  {INCIDENT_TYPE_CONFIG[activeIncident.type]?.badge || activeIncident.type}
                </Badge>
                <Badge className={PRIORITY_BADGE[activeIncident.priority]?.className || ''}>
                  {PRIORITY_BADGE[activeIncident.priority]?.label || activeIncident.priority}
                </Badge>
                {activeIncident.clusterCount > 1 && (
                  <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Cluster &times;{activeIncident.clusterCount}
                  </Badge>
                )}
              </div>
              <p className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm text-slate-200 leading-relaxed">
                {activeIncident.description || 'No description available'}
              </p>
              <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                <span className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                  Reporter: {activeIncident.reporterName || activeIncident.reportedBy}
                </span>
                <span>Ver: {activeIncident.verificationTier}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isEnRoute && (
                <Button
                  onClick={onArriveOnSite}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shrink-0"
                >
                  <Navigation className="h-4 w-4 mr-1.5" />
                  📍 Arrive On Site
                </Button>
              )}
              <Button
                onClick={onCompleteResolve}
                disabled={isEnRoute}
                className={`font-semibold shrink-0 ${
                  isEnRoute
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Complete &amp; Resolve
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── Dispatched Banner (not occupied, but has assignment) ── */}
      {isDispatched && activeIncident && (
        <section className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-blue-300 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                Dispatched to Incident {activeIncident.id}
              </span>
            </div>
            <p className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm text-slate-300 pl-6">
              {activeIncident.description || 'Awaiting details'}
            </p>
          </div>
          <Button
            onClick={onBeginTransit}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shrink-0"
          >
            <Route className="h-4 w-4 mr-1.5" />
            Begin Transit
          </Button>
        </section>
      )}
    </>
  )
}
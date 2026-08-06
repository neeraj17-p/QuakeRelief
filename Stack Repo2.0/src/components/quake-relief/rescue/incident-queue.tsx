'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ListOrdered, MapPin } from 'lucide-react'

interface Incident {
  id: string
  type: string
  description: string | null
  latitude: number
  longitude: number
  reportedBy: string
  reporterName: string | null
  status: string
  priority: string
  verificationTier: string
  clusterId: string | null
  clusterCount: number
  immediateNeeds: string | null
  assignedTo: string | null
  fieldUpdates: {
    id: string
    status: string
    note: string | null
    updatedBy: string | null
    createdAt: string
  }[]
}

interface IncidentQueueProps {
  sortedIncidents: Incident[]
  loading: boolean
  squadLat: number | null
  squadLng: number | null
  squadAssignedIncidentId: string | null
  isOccupied: boolean
  isDispatched: boolean
  isEnRoute: boolean
  isOnSite: boolean
  onPanToIncident: (inc: Incident) => void
  onAcceptDispatch: (incidentId: string) => void
  onCompleteResolve: () => void
  onArriveOnSite: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────
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

// ─── Haversine Distance ──────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function IncidentQueue({
  sortedIncidents,
  loading,
  squadLat,
  squadLng,
  squadAssignedIncidentId,
  isOccupied,
  isDispatched,
  isEnRoute,
  isOnSite,
  onPanToIncident,
  onAcceptDispatch,
  onCompleteResolve,
  onArriveOnSite,
}: IncidentQueueProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm font-bold uppercase tracking-wider text-slate-400">
          <ListOrdered className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          Incident Queue
        </h3>
        <span className="text-xs text-slate-500 shrink-0 ml-2">
          {sortedIncidents.length} incidents
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 space-y-2.5"
            >
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 bg-slate-700 rounded" />
                <Skeleton className="h-5 w-16 bg-slate-700 rounded" />
              </div>
              <Skeleton className="h-4 w-full bg-slate-700 rounded" />
              <Skeleton className="h-4 w-3/4 bg-slate-700 rounded" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-8 w-20 bg-slate-700 rounded" />
                <Skeleton className="h-8 w-32 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedIncidents.length === 0 ? (
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-400">No incidents in queue.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
          {sortedIncidents.map((inc, idx) => {
            const isAssigned = inc.id === squadAssignedIncidentId
            const typeCfg = INCIDENT_TYPE_CONFIG[inc.type] || DEFAULT_TYPE_CONFIG
            const prioCfg =
              PRIORITY_BADGE[inc.priority] || { label: inc.priority, className: '' }
            const distance =
              squadLat != null && squadLng != null
                ? haversineKm(squadLat, squadLng, inc.latitude, inc.longitude)
                : null

            // Button states
            const canRoute = isOccupied && isAssigned
            const isAcceptDisabled =
              isOccupied || isDispatched || !!inc.assignedTo

            return (
              <div
                key={inc.id}
                className={`bg-slate-800/80 border rounded-xl p-4 transition-colors card-stagger ${
                  isAssigned && isOccupied
                    ? 'border-blue-500/40 bg-blue-950/20'
                    : isAssigned
                      ? 'border-blue-500/30 bg-blue-950/10'
                      : 'border-slate-700/50'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex flex-col gap-2.5">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={typeCfg.badgeClass}>{typeCfg.badge}</Badge>
                    <Badge className={prioCfg.className}>{prioCfg.label}</Badge>
                    {inc.clusterCount > 1 && (
                      <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Cluster &times;{inc.clusterCount}
                      </Badge>
                    )}
                    {isAssigned && (
                      <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        &larr; YOUR ASSIGNMENT
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm text-slate-200 leading-relaxed">
                    {inc.description || 'No description available'}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                    {distance != null && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {distance.toFixed(1)} km
                      </span>
                    )}
                    <span className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                      Reporter: {inc.reporterName || inc.reportedBy}
                    </span>
                    <span>Tier: {inc.verificationTier}</span>
                    {inc.assignedTo && !isAssigned && (
                      <span className="text-amber-400/70">
                        Assigned: {inc.assignedTo}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {/* Route button */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canRoute}
                      onClick={() => onPanToIncident(inc)}
                      className={`text-xs border-slate-600 text-slate-300 hover:bg-slate-700 ${
                        !canRoute ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''
                      }`}
                    >
                      📍 Route
                    </Button>

                    {/* Accept & Dispatch button (visible always, disabled when occupied/dispatched/already-assigned) */}
                    <Button
                      size="sm"
                      disabled={isAcceptDisabled}
                      onClick={() => onAcceptDispatch(inc.id)}
                      className={`text-xs ${
                        isAcceptDisabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400 hover:bg-slate-700'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      🚨 Accept &amp; Dispatch
                    </Button>

                    {/* Complete & Resolve (only for assigned incident when ON_SITE) */}
                    {isOnSite && isAssigned && (
                      <Button
                        size="sm"
                        onClick={onCompleteResolve}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        ✔️ Complete &amp; Resolve
                      </Button>
                    )}
                    {/* Arrive On Site (only for assigned incident when EN_ROUTE) */}
                    {isEnRoute && isAssigned && (
                      <Button
                        size="sm"
                        onClick={onArriveOnSite}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                      >
                        📍 Arrive On Site
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
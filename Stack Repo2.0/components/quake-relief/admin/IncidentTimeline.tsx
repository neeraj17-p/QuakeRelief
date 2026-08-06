'use client'

import { Badge } from '@/components/ui/badge'
import { MapPinned, Crosshair, Activity, TriangleAlert, Zap, MapPin } from 'lucide-react'

// ─── Data Types ────────────────────────────────────────────────────────────────

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
  assignedTo: string | null
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const INCIDENT_TIMES = ['14:33', '14:34', '14:35', '14:36', '14:37', '14:38', '14:39', '14:40', '14:41', '14:42']

const phaseBadge: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: '🔴 CRITICAL', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  HIGH: { label: '🟡 EN ROUTE', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  MEDIUM: { label: '🟢 RESOLVED', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  LOW: { label: '🟢 RESOLVED', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
}

const PRIORITY_HAZARD_RING: Record<string, { color: string; radius: number }> = {
  CRITICAL: { color: '#ef4444', radius: 250 },
  HIGH: { color: '#f97316', radius: 150 },
  MEDIUM: { color: '#f59e0b', radius: 75 },
  LOW: { color: '#f59e0b', radius: 75 },
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface IncidentTimelineProps {
  incidents: Incident[]
}

export default function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  return (
    <div className="relative w-full block h-auto clear-both mb-8">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
        Incident Timeline
      </h2>
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 max-h-96 overflow-y-auto custom-scrollbar">
        {incidents.length === 0 ? (
          <p className="text-sm text-slate-500 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">No incidents loaded.</p>
        ) : (
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-slate-700" />
            {incidents.map((inc, idx) => {
              const priorityCfg: Record<string, { color: string; bg: string; glow: string }> = {
                CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/20', glow: 'shadow-red-500/30' },
                HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20', glow: 'shadow-orange-500/30' },
                MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/20', glow: 'shadow-amber-500/30' },
                LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', glow: 'shadow-emerald-500/30' },
              }
              const pCfg = priorityCfg[inc.priority] || priorityCfg.MEDIUM
              const phase = phaseBadge[inc.priority] || phaseBadge.MEDIUM
              const typeIcons: Record<string, React.ReactNode> = {
                COLLAPSE: <MapPinned className="h-3.5 w-3.5" />,
                LANDSLIDE: <Crosshair className="h-3.5 w-3.5" />,
                MEDICAL: <Activity className="h-3.5 w-3.5" />,
                ROAD_BLOCK: <TriangleAlert className="h-3.5 w-3.5" />,
                FIRE: <Zap className="h-3.5 w-3.5" />,
                FLOOD: <Activity className="h-3.5 w-3.5" />,
              }
              return (
                <div key={inc.id} className="relative mb-4 last:mb-0 group">
                  {/* Dot on timeline */}
                  <div className={`absolute -left-3.5 top-1 w-3 h-3 rounded-full border-2 border-slate-800 shadow-sm ${pCfg.bg} ${pCfg.glow} shadow-md`} />
                  {/* Row: [time] [dot] [type icon + type name + description] [phase badge] */}
                  <div className="flex items-center gap-2">
                    {/* Time */}
                    <span className="text-[11px] font-mono text-slate-500 shrink-0 w-12 text-right">{INCIDENT_TIMES[idx] || '14:4X'}</span>
                    {/* Content area */}
                    <div className="flex-1 min-w-0 bg-slate-900/60 border border-slate-700/40 rounded-lg p-3.5 group-hover:border-slate-600/60 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${pCfg.color} shrink-0`}>{typeIcons[inc.type] || <MapPin className="h-3.5 w-3.5" />}</span>
                        <span className="text-xs font-semibold text-slate-200 truncate break-words whitespace-normal normal-case block max-w-full overflow-hidden">{inc.type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-1 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                        {inc.description}
                      </p>
                    </div>
                    {/* Phase badge */}
                    <Badge variant="outline" className={`text-[10px] border ${phase.bg} ${phase.color} shrink-0`}>{phase.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
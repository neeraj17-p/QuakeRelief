'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'

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

interface RescueTeam {
  id: string
  name: string
  unitType: string
  status: string
  latitude: number
  longitude: number
  assignedIncidentId: string | null
  contact: string
  members: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TEAM_ICON_MAP: Record<string, { symbol: string; color: string }> = {
  NDRF: { symbol: '🛡️', color: '#f97316' },
  SDRF: { symbol: '⛰️', color: '#f59e0b' },
  MEDICAL: { symbol: '🩺', color: '#ec4899' },
  FIRE: { symbol: '🔥', color: '#ef4444' },
  POLICE: { symbol: '👮', color: '#64748b' },
  ARMY: { symbol: '🏗️', color: '#22c55e' },
}

const STANDBY_STATUSES = ['STANDBY', 'AVAILABLE']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const teamStatusColor = (status: string) => {
  switch (status) {
    case 'EN_ROUTE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'ON_SITE': case 'DEPLOYED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'STANDBY': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'AVAILABLE': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

const priorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'LOW': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface FleetSidebarProps {
  teamData: RescueTeam[]
  incidents: Incident[]
  unassignedIncidents: Incident[]
  dispatchDropdownTeamId: string | null
  onTeamClick: (team: Pick<RescueTeam, 'id' | 'name' | 'latitude' | 'longitude' | 'assignedIncidentId'>) => void
  onDispatchDropdown: (teamId: string | null) => void
  onDispatch: (team: RescueTeam, incident: Incident) => void
}

export default function FleetSidebar({
  teamData,
  incidents,
  unassignedIncidents,
  dispatchDropdownTeamId,
  onTeamClick,
  onDispatchDropdown,
  onDispatch,
}: FleetSidebarProps) {
  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 z-10 overflow-y-auto">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          Active Fleet
        </h3>
        <button
          onClick={() => { onDispatchDropdown(null) }}
          className="text-slate-400 hover:text-white transition-colors shrink-0 p-1"
          aria-label="Close fleet panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="h-[calc(100%-52px)]">
        <div className="p-3 flex flex-col gap-2">
          {teamData.map(team => {
            const config = TEAM_ICON_MAP[team.unitType] || { symbol: '📋', color: '#64748b' }
            const assignedInc = incidents.find(i => i.id === team.assignedIncidentId)
            const isStandby = STANDBY_STATUSES.includes(team.status)
            const isDropdownOpen = dispatchDropdownTeamId === team.id

            return (
              <div key={team.id} className="relative">
                <button
                  onClick={() => onTeamClick(team)}
                  className="w-full text-left bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/50 rounded-lg p-3 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg shrink-0">{config.symbol}</span>
                    <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors truncate break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                      {team.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] border ${teamStatusColor(team.status)}`}>
                      {team.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400 break-words whitespace-normal normal-case block max-w-full overflow-hidden">
                      {team.unitType} · {team.members} members
                    </span>
                  </div>
                  {assignedInc && (
                    <p className="text-[10px] text-slate-500 mt-1.5 truncate break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                      → {assignedInc.type} @ {assignedInc.priority}
                    </p>
                  )}
                </button>

                {/* Dispatch Unit Button for STANDBY/AVAILABLE teams */}
                {isStandby && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDispatchDropdown(isDropdownOpen ? null : team.id)
                    }}
                    className="mt-1.5 w-full px-3 py-1.5 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-400 text-[10px] font-semibold hover:bg-blue-600/30 transition-colors"
                  >
                    🚀 Dispatch Unit
                  </button>
                )}

                {/* Dispatch Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {unassignedIncidents.length === 0 ? (
                      <p className="text-xs text-slate-500 p-3 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                        No unassigned incidents
                      </p>
                    ) : (
                      unassignedIncidents.map(inc => {
                        const typeEmoji: Record<string, string> = {
                          COLLAPSE: '🏠', LANDSLIDE: '⛰️', MEDICAL: '🏥', ROAD_BLOCK: '🚧', FIRE: '🔥', FLOOD: '🌊',
                        }
                        const emoji = typeEmoji[inc.type] || '📍'
                        return (
                          <button
                            key={inc.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              onDispatch(team, inc)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700/60 transition-colors border-b border-slate-700/30 last:border-0 flex items-center gap-2"
                          >
                            <span className="text-sm shrink-0">{emoji}</span>
                            <span className="text-xs text-slate-300 flex-1 min-w-0 truncate break-words whitespace-normal normal-case block max-w-full overflow-hidden">
                              {inc.description || inc.type}
                            </span>
                            <Badge variant="outline" className={`text-[9px] border ${priorityColor(inc.priority)} shrink-0`}>
                              {inc.priority}
                            </Badge>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
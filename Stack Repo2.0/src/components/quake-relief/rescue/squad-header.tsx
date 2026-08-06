'use client'

import { Badge } from '@/components/ui/badge'
import { Shield, Radio, MapPin } from 'lucide-react'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  STANDBY: { label: 'STANDBY', className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
  DISPATCHED: { label: 'DISPATCHED', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  EN_ROUTE: { label: 'EN ROUTE', className: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
  ON_SITE: { label: 'ON SITE', className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  RESOLVED: { label: 'RESOLVED', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  AVAILABLE: { label: 'AVAILABLE', className: 'bg-teal-500/20 text-teal-400 border border-teal-500/30' },
}

interface SquadHeaderProps {
  squadId: string
  squadName: string
  squadStatus: string
  isOccupied: boolean
  isDispatched: boolean
}

export default function SquadHeader({
  squadId,
  squadName,
  squadStatus,
  isOccupied,
  isDispatched,
}: SquadHeaderProps) {
  return (
    <header className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-lg font-bold text-white leading-tight">
              {squadName}
            </h1>
            <p className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-xs text-slate-400 mt-0.5">
              Rescue Squad Portal &bull; ID: {squadId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={STATUS_BADGE[squadStatus]?.className || ''}>
            {STATUS_BADGE[squadStatus]?.label || squadStatus}
          </Badge>
          {isOccupied && (
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 badge-pulse">
              <Radio className="h-3 w-3 mr-1" />
              OCCUPIED
            </Badge>
          )}
          {isDispatched && (
            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <MapPin className="h-3 w-3 mr-1" />
              PENDING TRANSIT
            </Badge>
          )}
        </div>
      </div>
    </header>
  )
}
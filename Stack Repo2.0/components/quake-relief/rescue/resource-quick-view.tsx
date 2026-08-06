'use client'

import { BoxIcon, Building2, Users, Droplets } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Resource {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  address: string | null
  capacity: number
  currentLoad: number
  status: string
  contact: string | null
}

interface ResourceQuickViewProps {
  resources: Resource[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResourceQuickView({ resources }: ResourceQuickViewProps) {
  return (
    <section>
      <h3 className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
        <BoxIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
        Nearby Resources
      </h3>
      <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
        {resources.slice(0, 8).map((res) => {
          const loadPct =
            res.capacity > 0 ? Math.round((res.currentLoad / res.capacity) * 100) : 0
          const isOverloaded = res.status === 'OVERLOADED'
          const resIcon =
            res.type === 'HOSPITAL' || res.type === 'MEDICAL_CAMP' ? (
              <Building2 className="h-3.5 w-3.5" />
            ) : res.type === 'RELIEF_CAMP' || res.type === 'SHELTER' ? (
              <Users className="h-3.5 w-3.5" />
            ) : res.type === 'WATER_POINT' ? (
              <Droplets className="h-3.5 w-3.5" />
            ) : res.type === 'WAREHOUSE' ? (
              <BoxIcon className="h-3.5 w-3.5" />
            ) : (
              <Building2 className="h-3.5 w-3.5" />
            )
          const resIconBg =
            res.type === 'HOSPITAL' || res.type === 'MEDICAL_CAMP'
              ? 'bg-pink-500/20 text-pink-400'
              : res.type === 'RELIEF_CAMP' || res.type === 'SHELTER'
                ? 'bg-emerald-500/20 text-emerald-400'
                : res.type === 'WATER_POINT'
                  ? 'bg-blue-500/20 text-blue-400'
                  : res.type === 'WAREHOUSE'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-slate-500/20 text-slate-400'

          return (
            <div
              key={res.id}
              className={`shrink-0 w-52 sm:w-56 bg-slate-800/80 border rounded-xl p-3 space-y-2 transition-colors ${
                isOverloaded ? 'border-red-500/30' : 'border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${resIconBg}`}
                >
                  {resIcon}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs font-semibold block break-words whitespace-normal normal-case w-full max-w-full overflow-hidden ${
                      isOverloaded ? 'text-red-400' : 'text-slate-200'
                    }`}
                  >
                    {res.name.length > 28 ? res.name.slice(0, 28) + '...' : res.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {res.type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Load</span>
                  <span>
                    {res.currentLoad}/{res.capacity} ({loadPct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      loadPct > 90
                        ? 'bg-red-500'
                        : loadPct > 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(loadPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
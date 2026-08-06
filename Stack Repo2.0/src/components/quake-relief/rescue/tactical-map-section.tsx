'use client'

import { Crosshair, MapPin } from 'lucide-react'
import MapWrapper from '@/components/quake-relief/shared/map-wrapper'
import { MAP_CENTER, MAP_ZOOM } from '@/lib/mock-data'

interface TacticalMapSectionProps {
  markers: Array<{ position: [number, number]; icon: any; popup: string }>
  routingQueries: Array<{
    id: string
    from: [number, number]
    to: [number, number]
    color: string
    weight: number
  }>
  panTo: [number, number] | null
  arrivalFlash: boolean
  onMapReady: (map: any) => void
  onRouteCalculated: (id: string, path: [number, number][]) => void
  onRecenter: () => void
}

export default function TacticalMapSection({
  markers,
  routingQueries,
  panTo,
  arrivalFlash,
  onMapReady,
  onRouteCalculated,
  onRecenter,
}: TacticalMapSectionProps) {
  return (
    <section>
      <h3 className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
        Tactical Map
      </h3>
      <div
        className="relative h-[500px] rounded-xl overflow-hidden border-2 border-slate-700/50"
      >
        <MapWrapper
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          className="w-full h-full"
          markers={markers}
          routingQueries={routingQueries}
          onMapReady={onMapReady}
          onRouteCalculated={onRouteCalculated}
          panTo={panTo}
        />

        {/* Arrival Flash Notification (overlays the map) */}
        {arrivalFlash && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] px-5 py-3 rounded-xl bg-emerald-600/90 backdrop-blur-sm border border-emerald-400/50 shadow-lg shadow-emerald-500/30 animate-bounce">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <MapPin className="h-4 w-4" />
              Unit Arrived at Destination. Switching Map to Tactical Incident Mode.
            </div>
          </div>
        )}

        {/* Re-center button (above zoom controls, bottom-right) */}
        <button
          onClick={onRecenter}
          className="absolute bottom-14 right-3 z-[1000] h-9 w-9 rounded-lg bg-slate-800/90 border border-slate-600/50 text-white flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg cursor-pointer"
          title="Re-center on your position"
          aria-label="Re-center map on squad position"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>
      {/* Map legend */}
      <div className="flex items-center gap-4 mt-2 flex-wrap px-1">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block shrink-0" />
          You
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block shrink-0" />
          Epicenter
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/40 inline-block shrink-0 border border-red-400/60" />
          Collapse
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-pink-400/40 inline-block shrink-0 border border-pink-400/60" />
          Medical
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400/40 inline-block shrink-0 border border-orange-400/60" />
          Landslide
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="h-3 w-3 rounded-sm bg-amber-500/60 inline-block shrink-0" />
          Other Teams
        </span>
      </div>
    </section>
  )
}
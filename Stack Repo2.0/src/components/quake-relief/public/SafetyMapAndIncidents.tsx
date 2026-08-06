'use client'

import MapWrapper from '@/components/quake-relief/shared/map-wrapper'
import { createIcon, createPulsingIcon } from '@/components/quake-relief/shared/icon-factories'
import { EPICENTRE, MAP_CENTER, MAP_ZOOM } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { MapPin, ChevronRight, Radio, Activity } from 'lucide-react'
import type { IncidentDetail } from '@/components/quake-relief/shared/incident-detail-sheet'

// ─── Resource Config ─────────────────────────────────────────────────────────

const RESOURCE_TYPE_CONFIG: Record<
  string,
  { color: string; emoji: string; label: string }
> = {
  SHELTER: { color: '#16a34a', emoji: '\uD83C\uDFE0', label: 'Shelter' },
  HOSPITAL: { color: '#2563eb', emoji: '\uD83C\uDFE5', label: 'Hospital' },
  WATER_POINT: { color: '#0891b2', emoji: '\uD83D\uDCA7', label: 'Water Point' },
  MEDICAL_CAMP: { color: '#db2777', emoji: '\u2695\uFE0F', label: 'Medical Camp' },
  RELIEF_CAMP: { color: '#ea580c', emoji: '\u26FA', label: 'Relief Camp' },
}

const PUBLIC_RESOURCE_TYPES = new Set([
  'SHELTER',
  'HOSPITAL',
  'WATER_POINT',
  'MEDICAL_CAMP',
  'RELIEF_CAMP',
])

// ─── Type config for recent incidents ──────────────────────────────────────

const TYPE_EMOJI: Record<string, string> = {
  COLLAPSE: '🏢', FIRE: '🔥', MEDICAL: '🩺', LANDSLIDE: '⛰️', ROAD_BLOCK: '🚧', FLOOD: '🌊',
}

const PRIORITY_BADGE_PUBLIC: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  LOW: 'bg-green-500 text-white',
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Resource {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  address: string
  capacity: number
  currentLoad: number
  status: string
  contact: string
}

// ─── Haversine helper ────────────────────────────────────────────────────────

function haversineKmPublic(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface SafetyMapAndIncidentsProps {
  loading: boolean
  leafletReady: boolean
  resources: Resource[]
  recentIncidents: IncidentDetail[]
  onSelectIncident: (inc: IncidentDetail) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SafetyMapAndIncidents({
  loading,
  leafletReady,
  resources,
  recentIncidents,
  onSelectIncident,
}: SafetyMapAndIncidentsProps) {
  // ── Build map markers ──
  const mapMarkers = leafletReady ? (() => {
    const markers: Array<{
      position: [number, number]
      icon?: any
      popup?: string
    }> = []

    // Epicentre pulsing marker
    markers.push({
      position: [EPICENTRE.lat, EPICENTRE.lng],
      icon: createPulsingIcon('#dc2626', 16),
      popup: '<strong>Earthquake Epicentre</strong><br/>Magnitude 6.2<br/>Latur District (Killari Zone)',
    })

    // Public-relevant resources
    const filtered = resources.filter((r) => PUBLIC_RESOURCE_TYPES.has(r.type))
    for (const r of filtered) {
      const config = RESOURCE_TYPE_CONFIG[r.type]
      if (!config) continue
      const loadPercent = r.capacity > 0 ? Math.round((r.currentLoad / r.capacity) * 100) : 0
      const statusBadge =
        r.status === 'OVERLOADED'
          ? `<span style="color:#dc2626;font-weight:600;">OVERLOADED</span>`
          : `<span style="color:#16a34a;">${r.status}</span>`

      markers.push({
        position: [r.latitude, r.longitude],
        icon: createIcon(config.color, config.emoji, 28),
        popup: `<strong>${r.name}</strong><br/>Type: ${config.label}<br/>Status: ${statusBadge}<br/>Capacity: ${r.currentLoad}/${r.capacity} (${loadPercent}%)${r.contact ? `<br/>Contact: ${r.contact}` : ''}`,
      })
    }

    return markers
  })() : []

  const publicResourceCount = resources.filter((r) => PUBLIC_RESOURCE_TYPES.has(r.type)).length

  return (
    <>
      {/* ═══════════════ 5. PUBLIC SAFETY MAP ═══════════════ */}
      <section aria-label="Public Safety Map">
        <Card className="overflow-hidden">
          {/* Map header bar */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-foreground" />
              <span className="font-semibold text-sm">Nearby Resources &amp; Safety Map</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-600 status-pulse" />
                    <span className="font-medium text-red-700">Epicentre</span>
                    <span className="text-muted-foreground">&middot; 0 km</span>
                  </span>
                  <Separator orientation="vertical" className="h-3" />
                  <span>Showing <strong className="text-foreground">{publicResourceCount}</strong> nearby resources</span>
                </>
              )}
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-3">
            {/* Map legend */}
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(RESOURCE_TYPE_CONFIG).map(([type, cfg]) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs py-1 px-2.5"
                >
                  <span className="size-3 rounded-full" style={{ background: cfg.color }} />
                  {cfg.label}
                </Badge>
              ))}
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs py-1 px-2.5">
                <span className="size-3 rounded-full bg-red-600 status-pulse" />
                Epicentre
              </Badge>
            </div>

            {/* Map or skeleton */}
            {loading ? (
              <Skeleton className="w-full h-[400px] md:h-[500px] rounded-lg" />
            ) : (
              <div className="rounded-lg overflow-hidden border-2 border-slate-200/80 shadow-inner h-[400px] md:h-[500px]">
                <MapWrapper
                  center={MAP_CENTER}
                  zoom={MAP_ZOOM}
                  markers={mapMarkers}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Divider: Live Incidents ── */}
      <div className="flex items-center gap-3 py-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
          <Radio className="h-3 w-3" /> LIVE INCIDENTS
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ═══════════════ 5.5 RECENT VERIFIED INCIDENTS ═══════════════ */}
      {!loading && recentIncidents.length > 0 && (
        <section aria-label="Recent Verified Incidents">
          <Card className="card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4 text-red-500" />
                Recent Verified Incidents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-1.5">
                {recentIncidents.map((inc) => {
                  const dist = haversineKmPublic(EPICENTRE.lat, EPICENTRE.lng, inc.latitude, inc.longitude)
                  return (
                    <button
                      key={inc.id}
                      onClick={() => onSelectIncident(inc)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-colors text-left group"
                    >
                      <span className="text-lg shrink-0" role="img" aria-label={inc.type}>
                        {TYPE_EMOJI[inc.type] || '📍'}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 shrink-0 font-semibold ${PRIORITY_BADGE_PUBLIC[inc.priority] || 'bg-slate-500 text-white'}`}>
                        {inc.priority}
                      </Badge>
                      <p className="flex-1 text-sm text-foreground/80 line-clamp-1 group-hover:text-foreground transition-colors">
                        {inc.description || 'No description'}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <MapPin className="size-3" />
                        {dist.toFixed(1)} km
                      </span>
                      <ChevronRight className="size-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </>
  )
}
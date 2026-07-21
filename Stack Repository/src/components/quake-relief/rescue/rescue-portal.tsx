'use client'

import { Fragment, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useAppStore, type SquadStatus } from '@/store/app-store'
import { preloadLeaflet } from '@/components/quake-relief/shared/icon-factories'
import MapWrapper from '@/components/quake-relief/shared/map-wrapper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Crosshair,
  MapPin,
  Shield,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  Droplets,
  Route,
  ListOrdered,
  BoxIcon,
  Navigation,
} from 'lucide-react'
import { EPICENTRE, MAP_CENTER, MAP_ZOOM } from '@/lib/mock-data'
import { useSharedState } from '@/hooks/use-shared-state'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

// Team unit-type icon mapping (shared with admin portal)
const TEAM_ICON_MAP: Record<string, { symbol: string; color: string }> = {
  NDRF: { symbol: '🛡️', color: '#f97316' },
  SDRF: { symbol: '⛰️', color: '#f59e0b' },
  MEDICAL: { symbol: '🩺', color: '#ec4899' },
  FIRE: { symbol: '🔥', color: '#ef4444' },
  POLICE: { symbol: '👮', color: '#64748b' },
  ARMY: { symbol: '🏗️', color: '#22c55e' },
}

// Priority-driven dynamic radar circle radius (meters)
const PRIORITY_RADIUS: Record<string, number> = {
  CRITICAL: 250,
  HIGH: 150,
  MEDIUM: 75,
  LOW: 75,
}

// High-visibility incident type symbols rendered at circle centers
const INCIDENT_TYPE_SYMBOL: Record<string, string> = {
  COLLAPSE: '🏢',
  MEDICAL: '🩺',
  LANDSLIDE: '🪨',
  ROAD_BLOCK: '🚧',
  FIRE: '🔥',
  FLOOD: '🌊',
}

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

const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const PRIORITY_BADGE: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: 'CRITICAL', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  HIGH: { label: 'HIGH', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  MEDIUM: { label: 'MEDIUM', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  LOW: { label: 'LOW', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  STANDBY: { label: 'STANDBY', className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
  DISPATCHED: { label: 'DISPATCHED', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  EN_ROUTE: { label: 'EN ROUTE', className: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
  ON_SITE: { label: 'ON SITE', className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  RESOLVED: { label: 'RESOLVED', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  AVAILABLE: { label: 'AVAILABLE', className: 'bg-teal-500/20 text-teal-400 border border-teal-500/30' },
}

const MILESTONE_STAGES: SquadStatus[] = ['DISPATCHED', 'EN_ROUTE', 'ON_SITE', 'RESOLVED']
const MILESTONE_LABELS = ['Dispatched', 'En Route', 'On Site', 'Resolved']

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

export default function RescuePortal() {
  // ── Store ──
  const {
    squadId,
    squadName,
    squadStatus,
    squadLat,
    squadLng,
    squadAssignedIncidentId,
    setSquadStatus,
    setSquadAssignedIncident,
    setSquadPosition,
  } = useAppStore()

  // ── Shared state (cross-portal real-time sync) ──
  const {
    teams: sharedTeams,
    broadcasts: sharedBroadcasts,
    updateTeam,
    dispatchTeam,
  } = useSharedState()

  // ── State ──
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [leafletReady, setLeafletReady] = useState(false)
  const [panToCoord, setPanToCoord] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [arrivalFlash, setArrivalFlash] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [iconFns, setIconFns] = useState<{
    createIcon: (color: string, icon: string, size?: number) => any
    createPulsingIcon: (color: string, size?: number) => any
    createCircleMarker: (
      lat: number,
      lng: number,
      radius: number,
      color: string,
      fillColor: string,
      fillOpacity?: number,
      strokeOpacity?: number
    ) => any
  } | null>(null)

  // ── Auto-dismiss arrival flash after 4 seconds ──
  useEffect(() => {
    if (!arrivalFlash) return
    const timer = setTimeout(() => setArrivalFlash(false), 4000)
    return () => clearTimeout(timer)
  }, [arrivalFlash])

  // ── Refs ──
  const mapInstanceRef = useRef<any>(null)
  const circleRefs = useRef<any[]>([])

  // ── Computed ──
  const isOccupied = squadStatus === 'EN_ROUTE' || squadStatus === 'ON_SITE'
  const isDispatched = squadStatus === 'DISPATCHED'
  const isEnRoute = squadStatus === 'EN_ROUTE'
  const isOnSite = squadStatus === 'ON_SITE'

  // Derive other teams from shared state (filter out current squad)
  const otherTeams = useMemo(() => {
    return sharedTeams
      .filter(t => t.id !== squadId)
      .map(t => {
        // STANDBY/AVAILABLE/EN_ROUTE: show at base coords
        // ON_SITE/RESOLVED: show at current lat/lng (snapped to incident)
        const showAtBase = ['STANDBY', 'AVAILABLE', 'EN_ROUTE'].includes(t.status)
        const lat = showAtBase ? t.baseLatitude : t.latitude
        const lng = showAtBase ? t.baseLongitude : t.longitude
        const config = TEAM_ICON_MAP[t.unitType] || { symbol: '📋', color: '#64748b' }
        return {
          id: t.id,
          name: t.name,
          lat,
          lng,
          status: t.status,
          symbol: config.symbol,
          color: config.color,
        }
      })
  }, [sharedTeams, squadId])

  // Self position (simplified — synced to correct coords by the useEffect below)
  const selfPosition: [number, number] | null = useMemo(() => {
    if (squadLat == null || squadLng == null) return null
    return [squadLat, squadLng]
  }, [squadLat, squadLng])

  const activeIncident = useMemo(
    () => incidents.find((i) => i.id === squadAssignedIncidentId) ?? null,
    [incidents, squadAssignedIncidentId]
  )

  const sortedIncidents = useMemo(
    () =>
      [...incidents].sort(
        (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
      ),
    [incidents]
  )

  const currentStageIndex = MILESTONE_STAGES.indexOf(squadStatus)

  // ── Preload leaflet + icon factories ──
  useEffect(() => {
    let cancelled = false
    preloadLeaflet().then(() => {
      if (cancelled) return
      import('@/components/quake-relief/shared/map-inner').then((mod) => {
        if (cancelled) return
        setIconFns({
          createIcon: mod.createIcon,
          createPulsingIcon: mod.createPulsingIcon,
          createCircleMarker: mod.createCircleMarker,
        })
        setLeafletReady(true)
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  // ── Fetch data ──
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/api/incidents?eventId=eq-maharashtra-2025-001').then((r) => r.json()),
      fetch('/api/resources').then((r) => r.json()),
    ])
      .then(([incData, resData]) => {
        if (cancelled) return
        setIncidents(incData || [])
        setResources(resData || [])
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ── Sync Zustand squad state from shared state (cross-portal real-time sync) ──
  useEffect(() => {
    if (!squadId) return
    const serverTeam = sharedTeams.find(t => t.id === squadId)
    if (!serverTeam) return

    // Only update Zustand if server state differs
    if (serverTeam.status !== squadStatus) {
      setSquadStatus(serverTeam.status as SquadStatus)
    }
    if (serverTeam.assignedIncidentId !== squadAssignedIncidentId) {
      setSquadAssignedIncident(serverTeam.assignedIncidentId)
    }
    // For position: EN_ROUTE shows at base, ON_SITE shows at incident
    if (serverTeam.status === 'ON_SITE') {
      if (serverTeam.latitude !== squadLat || serverTeam.longitude !== squadLng) {
        setSquadPosition(serverTeam.latitude, serverTeam.longitude)
      }
    } else if (['STANDBY', 'AVAILABLE', 'DISPATCHED'].includes(serverTeam.status)) {
      // Return to base coords
      if (serverTeam.baseLatitude !== squadLat || serverTeam.baseLongitude !== squadLng) {
        setSquadPosition(serverTeam.baseLatitude, serverTeam.baseLongitude)
      }
    } else if (serverTeam.status === 'EN_ROUTE') {
      // Stay at base coords while en route
      if (serverTeam.baseLatitude !== squadLat || serverTeam.baseLongitude !== squadLng) {
        setSquadPosition(serverTeam.baseLatitude, serverTeam.baseLongitude)
      }
    }
  }, [sharedTeams, squadId, squadStatus, squadAssignedIncidentId, squadLat, squadLng, setSquadStatus, setSquadAssignedIncident, setSquadPosition])

  // ── Add incident circles to map once map + leaflet + incidents are ready ──
  // mapReady ensures circles draw AFTER the Leaflet map instance is available (fixes timing race)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!leafletReady || !mapReady || !map || !incidents.length || !iconFns) return

    // Clear previous circles
    circleRefs.current.forEach((c) => {
      try {
        map.removeLayer(c)
      } catch {
        /* already removed */
      }
    })
    circleRefs.current = []

    incidents.forEach((inc) => {
      const cfg = INCIDENT_TYPE_CONFIG[inc.type] || DEFAULT_TYPE_CONFIG
      // Priority-driven dynamic radius (CRITICAL=250m, HIGH=150m, MEDIUM/LOW=75m)
      const dynamicRadius = PRIORITY_RADIUS[inc.priority] || 75
      const circle = iconFns.createCircleMarker(
        inc.latitude,
        inc.longitude,
        dynamicRadius,
        cfg.color,
        cfg.fillColor,
        0.15,
        0.8
      )
      if (circle) {
        circle.bindPopup(
          `<div style="font-family:system-ui;font-size:12px;line-height:1.4;"><b>${cfg.badge}</b><br/>${inc.description || 'No description'}<br/><span style="color:#94a3b8;">Priority: ${inc.priority} · Radius: ${dynamicRadius}m</span></div>`,
          { maxWidth: 260 }
        )
        circle.addTo(map)
        circleRefs.current.push(circle)
      }
    })

    return () => {
      circleRefs.current.forEach((c) => {
        try {
          map.removeLayer(c)
        } catch {
          /* noop */
        }
      })
      circleRefs.current = []
    }
  }, [leafletReady, mapReady, incidents, iconFns])

  // ── Build markers for MapWrapper ──
  const markers = useMemo(() => {
    if (!leafletReady || !iconFns) return []
    const m: Array<{ position: [number, number]; icon: any; popup: string }> = []

    // Other teams (clean pin markers, no radar circles) — from shared state
    otherTeams.forEach((t) => {
      m.push({
        position: [t.lat, t.lng],
        icon: iconFns.createIcon(t.color, t.symbol, 28),
        popup: `<div style="font-family:system-ui;font-size:12px;line-height:1.4;"><b>${t.name}</b><br/>Status: ${t.status}</div>`,
      })
    })

    // Own team (pulsing blue marker)
    if (selfPosition) {
      // SOLID BLUE DOT: only during EN_ROUTE — tracking anchor at center of pulsing radar
      if (isEnRoute) {
        m.push({
          position: selfPosition,
          icon: iconFns.createIcon('#2563eb', '', 12),
          popup: `<div style="font-family:system-ui;font-size:12px;line-height:1.4;"><b>🔵 ${squadName || 'Your Squad'}</b><br/>EN_ROUTE — Vehicle Tracking Active</div>`,
        })
      }

      // Pulsing blue radar marker (always shows for own team)
      m.push({
        position: selfPosition,
        icon: iconFns.createPulsingIcon('#3b82f6', 16),
        popup: `<div style="font-family:system-ui;font-size:12px;line-height:1.4;"><b>${squadName || 'Your Squad'} (You)</b><br/>Status: ${squadStatus}</div>`,
      })
    }

    // Incident type icon markers at circle centers
    incidents.forEach((inc) => {
      const symbol = INCIDENT_TYPE_SYMBOL[inc.type]
      if (symbol) {
        m.push({
          position: [inc.latitude, inc.longitude],
          icon: iconFns.createIcon('rgba(0,0,0,0)', symbol, 30),
          popup: `<div style="font-family:system-ui;font-size:12px;line-height:1.4;"><b>${symbol} ${inc.type}</b><br/>${inc.description || ''}<br/><span style="color:#94a3b8;">Priority: ${inc.priority}</span></div>`,
        })
      }
    })

    // Epicenter (pulsing red)
    m.push({
      position: [EPICENTRE.lat, EPICENTRE.lng],
      icon: iconFns.createPulsingIcon('#ef4444', 18),
      popup: `<div style="font-family:system-ui;font-size:12px;line-height:1.4;"><b>🌍 Epicenter</b><br/>M6.2 Latur Earthquake<br/>Depth: 12.5 km</div>`,
    })

    return m
  }, [leafletReady, iconFns, selfPosition, squadName, squadStatus, incidents, otherTeams])

  // ── Dynamic routing query (only when EN_ROUTE — route clears on arrival) ──
  const routingQueries = useMemo(() => {
    if (!isEnRoute || !activeIncident || !selfPosition) return []
    return [
      {
        id: 'my-route',
        from: selfPosition,
        to: [activeIncident.latitude, activeIncident.longitude] as [number, number],
        color: '#3b82f6',
        weight: 5,
      },
    ]
  }, [isEnRoute, selfPosition, activeIncident])

  // ── Handlers ──
  const handleMapReady = useCallback((map: any) => {
    mapInstanceRef.current = map
    setMapReady(true)
  }, [])

  const handleRouteCalculated = useCallback((_id: string, _path: [number, number][]) => {
    // Route path is now displayed on map by MapWrapper
  }, [])

  // Accept Task: STANDBY → EN_ROUTE via dispatchTeam API (direct, no DISPATCHED intermediate)
  const handleAcceptDispatch = useCallback(
    async (incidentId: string) => {
      if (!squadId) return
      try {
        await dispatchTeam(squadId, incidentId)
        // The shared state polling will update Zustand via the useEffect below
        toast.success('Task accepted. Unit dispatched — EN_ROUTE status active. Route now visible on all maps.')
      } catch (err: any) {
        toast.error(err?.message || 'Failed to accept task')
      }
    },
    [dispatchTeam, squadId]
  )

  // Legacy Begin Transit flow (DISPATCHED → EN_ROUTE, secondary option)
  const handleBeginTransit = useCallback(() => {
    setSquadStatus('EN_ROUTE')
    toast.info('Transit initiated. Route is now active on tactical map.')
    updateTeam(squadId!, { status: 'EN_ROUTE' }).catch(() => {})
  }, [setSquadStatus, updateTeam, squadId])

  const handleArriveOnSite = useCallback(() => {
    if (!activeIncident) return
    setSquadStatus('ON_SITE')
    setSquadPosition(activeIncident.latitude, activeIncident.longitude)
    setArrivalFlash(true)
    setPanToCoord([activeIncident.latitude, activeIncident.longitude])
    toast.success('📍 Unit Arrived at Destination. Switching Map to Tactical Incident Mode.')
    updateTeam(squadId!, { status: 'ON_SITE', latitude: activeIncident.latitude, longitude: activeIncident.longitude }).catch(() => {})
  }, [activeIncident, setSquadStatus, setSquadPosition, updateTeam, squadId])

  const handleCompleteResolve = useCallback(() => {
    setSquadStatus('AVAILABLE')
    setSquadAssignedIncident(null)
    toast.success('Incident marked as resolved. Squad is now available for new assignments.')
    updateTeam(squadId!, { status: 'AVAILABLE', assignedIncidentId: null }).catch(() => {})
  }, [setSquadStatus, setSquadAssignedIncident, updateTeam, squadId])

  const handlePanToIncident = useCallback((inc: Incident) => {
    setPanToCoord([inc.latitude, inc.longitude])
  }, [])

  const handleRecenter = useCallback(() => {
    if (squadLat != null && squadLng != null) {
      setPanToCoord([squadLat, squadLng])
    }
  }, [squadLat, squadLng])

  // Clear panTo after MapWrapper consumes it
  useEffect(() => {
    if (panToCoord) {
      const timer = setTimeout(() => setPanToCoord(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [panToCoord])

  // ── Guard: no squad assigned ──
  if (!squadId || !squadName) {
    return (
      <div className="relative block w-full min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6 flex items-center justify-center">
        <p className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm text-slate-400">
          No squad assigned. Please authenticate through the rescue portal login.
        </p>
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="relative block w-full min-h-screen h-auto flex flex-col bg-slate-950 text-white overflow-y-auto px-4 sm:px-6 py-6 gap-y-8 pb-24 portal-enter">
      {/* ══════════════════════════════════════════════════════════════════════
          1. SQUAD HEADER BAR
         ══════════════════════════════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════════════════════════════
          2. ACTIVE TASK PANEL (only when occupied: EN_ROUTE or ON_SITE)
         ══════════════════════════════════════════════════════════════════════ */}
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
                  onClick={handleArriveOnSite}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shrink-0"
                >
                  <Navigation className="h-4 w-4 mr-1.5" />
                  📍 Arrive On Site
                </Button>
              )}
              <Button
                onClick={handleCompleteResolve}
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

      {/* ── 3b. DISPATCHED BANNER (not occupied, but has assignment) ── */}
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
            onClick={handleBeginTransit}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shrink-0"
          >
            <Route className="h-4 w-4 mr-1.5" />
            Begin Transit
          </Button>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4. TACTICAL MAP
         ══════════════════════════════════════════════════════════════════════ */}
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
            onMapReady={handleMapReady}
            onRouteCalculated={handleRouteCalculated}
            panTo={panToCoord}
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
            onClick={handleRecenter}
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

      {/* ══════════════════════════════════════════════════════════════════════
          5. INCIDENT QUEUE
         ══════════════════════════════════════════════════════════════════════ */}
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
            <p className="break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden text-sm text-slate-400">
              No incidents in queue.
            </p>
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
                        onClick={() => handlePanToIncident(inc)}
                        className={`text-xs border-slate-600 text-slate-300 hover:bg-slate-700 ${
                          !canRoute ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''
                        }`}
                      >
                        📍 Route
                      </Button>

                      {/* Accept Task button (visible when STANDBY/AVAILABLE, disabled when occupied/dispatched/already-assigned) */}
                      <Button
                        size="sm"
                        disabled={isAcceptDisabled}
                        onClick={() => handleAcceptDispatch(inc.id)}
                        className={`text-xs ${
                          isAcceptDisabled
                            ? 'opacity-40 cursor-not-allowed bg-slate-700 text-slate-400 hover:bg-slate-700'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        🚨 Accept Task
                      </Button>

                      {/* Complete & Resolve (only for assigned incident when ON_SITE) */}
                      {isOnSite && isAssigned && (
                        <Button
                          size="sm"
                          onClick={handleCompleteResolve}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          ✔️ Complete &amp; Resolve
                        </Button>
                      )}
                      {/* Arrive On Site (only for assigned incident when EN_ROUTE) */}
                      {isEnRoute && isAssigned && (
                        <Button
                          size="sm"
                          onClick={handleArriveOnSite}
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

      {/* ══════════════════════════════════════════════════════════════════════
          6. TACTICAL FIELD COMMAND FEED
         ══════════════════════════════════════════════════════════════════════ */}
      {sharedBroadcasts.filter(b => b.channel === 'tactical').length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
            <Radio className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
            Field Command Feed
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {sharedBroadcasts.filter(b => b.channel === 'tactical').slice(0, 5).map(b => {
              const isEvacuate = b.severity === 'evacuate'
              const isAlert = b.severity === 'alert'
              return (
                <div key={b.id} className={`rounded-xl p-3 border ${
                  isEvacuate ? 'bg-red-950/40 border-red-500/40' : isAlert ? 'bg-amber-950/40 border-amber-500/40' : 'bg-blue-950/40 border-blue-500/40'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{b.header}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isEvacuate ? 'bg-red-600 text-white' : isAlert ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                    }`}>{b.severity.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-slate-300">{b.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">{b.sentBy} · {new Date(b.createdAt).toLocaleTimeString()}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          7. RESOURCE QUICK VIEW
         ══════════════════════════════════════════════════════════════════════ */}
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
    </div>
  )
}
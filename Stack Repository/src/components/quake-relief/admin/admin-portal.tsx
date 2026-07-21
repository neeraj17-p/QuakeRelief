'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import MapWrapper from '@/components/quake-relief/shared/map-wrapper'
import { preloadLeaflet } from '@/components/quake-relief/shared/icon-factories'
import { EPICENTRE, MAP_CENTER, MAP_ZOOM } from '@/lib/mock-data'
import { useSharedState, type TeamState } from '@/hooks/use-shared-state'
import AnalyticsCharts from '@/components/quake-relief/shared/analytics-charts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  AlertTriangle, CheckCircle, Clock, Users, Radio, Send,
  Brain, Eye, Shield, X, MapPin, Loader2,
  Zap, Activity, Volume2, TriangleAlert, MessageSquare, UserCheck, MapPinned, Crosshair,
  ChevronDown, ChevronUp, Navigation,
} from 'lucide-react'

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

interface Resource {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  capacity: number
  currentLoad: number
  status: string
}

interface VerificationEntry {
  id: string
  sourceTier: string
  sourceType: string
  rawContent: string
  status: string
  confidence: number
}

interface AgentOutput {
  id: string
  agentType: string
  output: string
  reasoningTrace: string | null
}

interface Alert {
  id: string
  title: string
  message: string
  severity: string
  isActive: boolean
}

interface RoutingQuery {
  id: string
  from: [number, number]
  to: [number, number]
  color: string
  weight: number
}

// ─── Team Icon Config ──────────────────────────────────────────────────────────

const TEAM_ICON_MAP: Record<string, { symbol: string; color: string }> = {
  NDRF: { symbol: '🛡️', color: '#f97316' },
  SDRF: { symbol: '⛰️', color: '#f59e0b' },
  MEDICAL: { symbol: '🩺', color: '#ec4899' },
  FIRE: { symbol: '🔥', color: '#ef4444' },
  POLICE: { symbol: '👮', color: '#64748b' },
  ARMY: { symbol: '🏗️', color: '#22c55e' },
}

// ─── Incident Hazard Zone Config ───────────────────────────────────────────────

const PRIORITY_HAZARD: Record<string, { color: string; radius: number; opacity: number }> = {
  CRITICAL: { color: '#ef4444', radius: 400, opacity: 0.15 },
  HIGH: { color: '#f97316', radius: 300, opacity: 0.15 },
  MEDIUM: { color: '#f59e0b', radius: 200, opacity: 0.15 },
  LOW: { color: '#22c55e', radius: 150, opacity: 0.15 },
}

const ACTIVE_STATUSES = ['EN_ROUTE', 'ON_SITE', 'DEPLOYED']
const STANDBY_STATUSES = ['STANDBY', 'AVAILABLE']

// Priority-driven radar circle radius (meters) — matches Rescue Portal exactly
const PRIORITY_RADIUS_ADMIN: Record<string, number> = {
  CRITICAL: 250,
  HIGH: 150,
  MEDIUM: 75,
  LOW: 75,
}

// High-visibility incident type symbols
const INCIDENT_TYPE_SYMBOL: Record<string, string> = {
  COLLAPSE: '\u{1F3E2}',
  MEDICAL: '\u{1FA7A}',
  LANDSLIDE: '\u{1FAA8}',
  ROAD_BLOCK: '\u{1F6A7}',
  FIRE: '\u{1F525}',
  FLOOD: '\u{1F30A}',
}

// Incident type color config (for radar circles and markers)
const INCIDENT_TYPE_COLOR: Record<string, string> = {
  COLLAPSE: '#dc2626',
  MEDICAL: '#ec4899',
  LANDSLIDE: '#f97316',
  ROAD_BLOCK: '#eab308',
  FIRE: '#ef4444',
  FLOOD: '#3b82f6',
}

// ─── Constants for Timeline & Broadcast ────────────────────────────────────────

const INCIDENT_TIMES = ['14:33', '14:34', '14:35', '14:36', '14:37', '14:38', '14:39', '14:40', '14:41', '14:42']

const phaseBadge: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: '🔴 CRITICAL', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  HIGH: { label: '🟡 EN ROUTE', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  MEDIUM: { label: '🟢 RESOLVED', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  LOW: { label: '🟢 RESOLVED', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
}

const CHANNEL_DESC: Record<string, string> = {
  public: 'Pushes warnings straight to the Citizen Portal Public Alerts Banner.',
  tactical: 'Pushes secure orders straight to Field Unit Command logs.',
  interagency: 'Pushes status files upward to National NDMA networks.',
}

const BROADCAST_TEMPLATES = [
  { label: '🚨 Trigger Aftershock Warning', text: 'AFTERSHOCK WARNING: Seismologists predict M4-5 aftershocks in next 12 hours. All teams maintain alert. Public: stay in open areas.' },
  { label: '🚧 Evacuate Route NH361', text: 'EVACUATION ORDER: NH361 Latur-Ausa highway closed due to landslide. All civilian traffic divert via Renapur bypass immediately.' },
  { label: '🏥 Hospital Capacity Alert', text: 'MEDICAL ALERT: Yashwantrao Chavan Rural Hospital at 96% capacity. All non-critical cases divert to Vilasrao Deshmukh Medical College.' },
  { label: '⚡ Grid Failure Zone', text: 'INFRASTRUCTURE: Power grid failure in Killari zone. Emergency generators deployed. Restoration ETA: 2 hours.' },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminPortal() {
  // ── Data state ──
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [verifications, setVerifications] = useState<VerificationEntry[]>([])
  const [agents, setAgents] = useState<AgentOutput[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  // ── Map state ──
  const [mapMarkers, setMapMarkers] = useState<Array<{ position: [number, number]; icon?: any; popup?: string }>>([])
  const [routingQueries, setRoutingQueries] = useState<RoutingQuery[]>([])
  const [panTo, setPanTo] = useState<[number, number] | null>(null)
  const [showFleetSidebar, setShowFleetSidebar] = useState(false)
  const [highlightedTeam, setHighlightedTeam] = useState<string | null>(null)

  // ── Dispatch dropdown state ──
  const [dispatchDropdownTeam, setDispatchDropdownTeam] = useState<string | null>(null)

  // ── Map instance + radar circle refs ──
  const mapInstanceRef = useRef<any>(null)
  const adminCircleRefs = useRef<any[]>([])

  // ── Broadcast form state ──
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastHeader, setBroadcastHeader] = useState('')
  const [broadcastSeverity, setBroadcastSeverity] = useState<'advisory' | 'alert' | 'evacuate'>('advisory')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastChannel, setBroadcastChannel] = useState<'public' | 'tactical' | 'interagency'>('public')

  // ── Map filter state ──
  const [mapFilter, setMapFilter] = useState<'all' | 'incidents' | 'teams' | 'resources'>('all')
  const mapFilterRef = useRef(mapFilter)
  useEffect(() => { mapFilterRef.current = mapFilter }, [mapFilter])

  // ── Leaflet ref ──
  const leafletReady = useRef(false)

  // ── Map ready callback (receives Leaflet map instance) ──
  const handleMapReady = useCallback((map: any) => {
    mapInstanceRef.current = map
  }, [])

  // ── Shared state for cross-portal team and broadcast sync ──
  const {
    teams: sharedTeams,
    broadcasts: sharedBroadcasts,
    dispatchTeam,
    sendBroadcast,
  } = useSharedState()

  // ── Fetch all data (broadcasts come from shared state, not DB) ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const fetchAll = async () => {
      try {
        const [incRes, resRes, verRes, altRes, agentRes] = await Promise.all([
          fetch('/api/incidents?eventId=eq-maharashtra-2025-001').then(r => r.json()).catch(() => []),
          fetch('/api/resources').then(r => r.json()).catch(() => []),
          fetch('/api/verification?eventId=eq-maharashtra-2025-001').then(r => r.json()).catch(() => []),
          fetch('/api/alerts?targetRole=ALL').then(r => r.json()).catch(() => []),
          fetch('/api/agents?eventId=eq-maharashtra-2025-001').then(r => r.json()).catch(() => []),
        ])

        if (cancelled) return
        setIncidents(Array.isArray(incRes) ? incRes : [])
        setResources(Array.isArray(resRes) ? resRes : [])
        setVerifications(Array.isArray(verRes) ? verRes : [])
        setAlerts(Array.isArray(altRes) ? altRes : [])
        setAgents(Array.isArray(agentRes) ? agentRes : [])
      } catch {
        // Silent fail - data stays empty
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  // ── Preload leaflet and build markers ──
  useEffect(() => {
    if (leafletReady.current) return

    let cancelled = false
    const buildMarkers = async () => {
      await preloadLeaflet()
      if (cancelled) return

      const L = (await import('leaflet')).default
      if (!L) return

      leafletReady.current = true

      // Force a re-render to rebuild markers with L available
      rebuildMarkers(L)
    }

    buildMarkers()
    return () => { cancelled = true }
  }, [])

  // ── Rebuild markers when data changes or highlightedTeam changes ──
  const rebuildMarkers = useCallback((L: any) => {
    const markers: Array<{ position: [number, number]; icon?: any; popup?: string }> = []

    // ── Epicenter: pulsing red marker (always shows) ──
    markers.push({
      position: [EPICENTRE.lat, EPICENTRE.lng],
      icon: L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:60px;height:60px;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:18px;height:18px;background:#ef4444;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);z-index:2;"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;background:#ef4444;border-radius:50%;opacity:0.3;animation:pulse-ring 2s ease-out infinite;z-index:1;"></div>
          </div>`,
        iconSize: [60, 60],
        iconAnchor: [30, 30],
        popupAnchor: [0, -30],
      }),
      popup: `<div style="font-family:system-ui;font-size:12px;"><strong>📍 Epicenter</strong><br/>M6.2 Earthquake<br/>${EPICENTRE.lat}°N, ${EPICENTRE.lng}°E</div>`,
    })

    // ── Incident type symbol markers (overlay layer — radar circles are drawn via useEffect on map) ──
    if (mapFilterRef.current === 'all' || mapFilterRef.current === 'incidents') {
      incidents.forEach(inc => {
        const typeSymbol = INCIDENT_TYPE_SYMBOL[inc.type] || '📍'
        const typeColor = INCIDENT_TYPE_COLOR[inc.type] || '#64748b'
        markers.push({
          position: [inc.latitude, inc.longitude],
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:30px;height:30px;background:transparent;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${typeSymbol}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
          }),
          popup: `<div style="font-family:system-ui;font-size:12px;"><strong>${typeSymbol} ${inc.type}</strong> [${inc.priority}]<br/>${inc.description || 'No description'}<br/>Status: ${inc.status}<br/><span style="color:#94a3b8;">Radar: ${PRIORITY_RADIUS_ADMIN[inc.priority] || 75}m</span></div>`,
        })
      })
    }

    // ── Team markers (use shared state as single source of truth) ──
    if (mapFilterRef.current === 'all' || mapFilterRef.current === 'teams') {
      sharedTeams.forEach(team => {
        const config = TEAM_ICON_MAP[team.unitType] || { symbol: '📋', color: '#64748b' }
        const isActive = ACTIVE_STATUSES.includes(team.status)
        const isHighlighted = highlightedTeam === team.id
        const showLabel = isActive || isHighlighted

        // Position based on team status
        const lat = (team.status === 'ON_SITE' || team.status === 'RESOLVED')
          ? team.latitude
          : team.baseLatitude
        const lng = (team.status === 'ON_SITE' || team.status === 'RESOLVED')
          ? team.longitude
          : team.baseLongitude

        const iconHtml = showLabel
          ? `<div style="position:relative;width:36px;height:52px;">
              <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);white-space:nowrap;background:${config.color};color:white;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px 3px 0 0;box-shadow:0 1px 4px rgba(0,0,0,0.3);font-family:system-ui,sans-serif;z-index:3;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${team.name}</div>
              <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:36px;height:36px;background:${config.color};border:3px solid white;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;z-index:2;">${config.symbol}</div>
            </div>`
          : `<div style="width:36px;height:36px;background:${config.color};border:3px solid white;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:18px;">${config.symbol}</div>`

        markers.push({
          position: [lat, lng],
          icon: L.divIcon({
            className: '',
            html: iconHtml,
            iconSize: showLabel ? [36, 52] : [36, 36],
            iconAnchor: showLabel ? [18, 36] : [18, 18],
            popupAnchor: [0, -40],
          }),
          popup: `<div style="font-family:system-ui;font-size:12px;"><strong>${team.name}</strong><br/>Type: ${team.unitType} | Status: ${team.status}<br/>Members: ${team.members}<br/>${team.assignedIncidentId ? `Assigned: ${team.assignedIncidentId}` : 'Unassigned'}</div>`,
        })

        // SOLID BLUE DOT for EN_ROUTE teams — tracking anchor node at center of pulsing area
        if (team.status === 'EN_ROUTE') {
          markers.push({
            position: [lat, lng],
            icon: L.divIcon({
              className: '',
              html: `<div style="position:relative;width:60px;height:60px;">
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;background:#2563eb;border-radius:50%;border:2px solid white;box-shadow:0 0 12px rgba(37,99,235,0.8),0 0 24px rgba(37,99,235,0.4);z-index:4;"></div>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;background:#2563eb;border-radius:50%;opacity:0.25;animation:pulse-ring 2s ease-out infinite;z-index:1;"></div>
              </div>`,
              iconSize: [60, 60],
              iconAnchor: [30, 30],
              popupAnchor: [0, -30],
            }),
            popup: `<div style="font-family:system-ui;font-size:12px;"><strong>🔵 ${team.name}</strong><br/>Status: EN_ROUTE — Vehicle Tracking<br/>Moving to: ${team.assignedIncidentId || 'Unknown'}</div>`,
          })
        }
      })
    }

    // ── Resource markers (hospitals / medical camps) ──
    if (mapFilterRef.current === 'all' || mapFilterRef.current === 'resources') {
      resources.forEach(res => {
        if (res.type === 'HOSPITAL' || res.type === 'MEDICAL_CAMP') {
          markers.push({
            position: [res.latitude, res.longitude],
            icon: L.divIcon({
              className: '',
              html: `<div style="width:28px;height:28px;background:#ec4899;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;">🏥</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              popupAnchor: [0, -14],
            }),
            popup: `<div style="font-family:system-ui;font-size:12px;"><strong>🏥 ${res.name}</strong><br/>Type: ${res.type}<br/>Load: ${res.currentLoad}/${res.capacity}<br/>Status: ${res.status}</div>`,
          })
        }
      })
    }

    setMapMarkers(markers)
  }, [incidents, highlightedTeam, resources, mapFilter, sharedTeams])

  // Rebuild markers when incidents or highlightedTeam change (only if leaflet is ready)
  useEffect(() => {
    if (!leafletReady.current) return
    const doRebuild = async () => {
      const L = (await import('leaflet')).default
      if (L) rebuildMarkers(L)
    }
    doRebuild()
  }, [incidents, highlightedTeam, resources, mapFilter, rebuildMarkers])

  // ── Draw priority-driven radar circles on the map (baseline GIS layer, never overwritten by team markers) ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!leafletReady.current || !map || !incidents.length) return

    let cancelled = false

    const drawCircles = async () => {
      const L = (await import('leaflet')).default
      if (!L || cancelled) return

      // Clear previous circles
      adminCircleRefs.current.forEach((c) => {
        try { map.removeLayer(c) } catch { /* already removed */ }
      })
      adminCircleRefs.current = []

      incidents.forEach((inc) => {
        if (cancelled) return
        const typeColor = INCIDENT_TYPE_COLOR[inc.type] || '#64748b'
        const dynamicRadius = PRIORITY_RADIUS_ADMIN[inc.priority] || 75

        const circle = L.circle([inc.latitude, inc.longitude], {
          radius: dynamicRadius,
          color: typeColor,
          fillColor: typeColor,
          fillOpacity: 0.18,
          weight: 2.5,
          opacity: 0.85,
        })
        circle.bindPopup(
          `<div style="font-family:system-ui;font-size:12px;line-height:1.4;"><b>${inc.type}</b><br/>${inc.description || 'No description'}<br/><span style="color:#94a3b8;">Priority: ${inc.priority} · Radius: ${dynamicRadius}m</span></div>`,
          { maxWidth: 260 }
        )
        circle.addTo(map)
        adminCircleRefs.current.push(circle)
      })
    }

    drawCircles()

    return () => {
      cancelled = true
      const m = mapInstanceRef.current
      if (m) {
        adminCircleRefs.current.forEach((c) => {
          try { m.removeLayer(c) } catch { /* noop */ }
        })
      }
      adminCircleRefs.current = []
    }
  }, [leafletReady, incidents, mapFilter])

  // ── Auto-route: create routing queries for ALL EN_ROUTE teams ──
  useEffect(() => {
    const queries: RoutingQuery[] = []

    sharedTeams.forEach(team => {
      if (team.status !== 'EN_ROUTE' || !team.assignedIncidentId) return
      const incident = incidents.find(i => i.id === team.assignedIncidentId)
      if (!incident) return

      queries.push({
        id: `route-${team.id}`,
        from: [team.baseLatitude, team.baseLongitude] as [number, number],
        to: [incident.latitude, incident.longitude] as [number, number],
        color: '#2563eb',
        weight: 5,
      })
    })

    setRoutingQueries(queries)
  }, [incidents, sharedTeams])

  // ── Handle team click in fleet sidebar ──
  const handleTeamClick = useCallback((team: TeamState) => {
    const lat = (team.status === 'ON_SITE' || team.status === 'RESOLVED')
      ? team.latitude
      : team.baseLatitude
    const lng = (team.status === 'ON_SITE' || team.status === 'RESOLVED')
      ? team.longitude
      : team.baseLongitude

    setPanTo([lat, lng])
    setHighlightedTeam(team.id)
    setShowFleetSidebar(true)

    if (team.assignedIncidentId) {
      const incident = incidents.find(i => i.id === team.assignedIncidentId)
      if (incident) {
        setRoutingQueries(prev => [
          ...prev.filter(q => q.id !== `route-${team.id}`),
          {
            id: `route-${team.id}`,
            from: [team.baseLatitude, team.baseLongitude] as [number, number],
            to: [incident.latitude, incident.longitude] as [number, number],
            color: '#2563eb',
            weight: 5,
          },
        ])
      }
    }

    // Clear highlight after 5 seconds
    setTimeout(() => setHighlightedTeam(null), 5000)
  }, [incidents])

  // ── Send broadcast via shared state API ──
  const handleSendBroadcast = useCallback(async () => {
    if (!broadcastHeader.trim() || !broadcastMsg.trim()) return
    setSendingBroadcast(true)
    try {
      await sendBroadcast({
        header: broadcastHeader,
        message: broadcastMsg,
        severity: broadcastSeverity,
        channel: broadcastChannel,
      })
      setBroadcastMsg('')
      setBroadcastHeader('')
      toast.success(`Broadcast dispatched to ${broadcastChannel} channel`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send broadcast')
    } finally {
      setSendingBroadcast(false)
    }
  }, [broadcastHeader, broadcastMsg, broadcastSeverity, broadcastChannel, sendBroadcast])

  // ── Dispatch team to a specific incident (dropdown-selected) ──
  const handleDispatchToIncident = useCallback(async (teamId: string, incidentId: string) => {
    const target = incidents.find(i => i.id === incidentId)
    if (!target) {
      toast.error('Incident not found')
      return
    }

    try {
      await dispatchTeam(teamId, incidentId)
      setDispatchDropdownTeam(null)
      toast.success(`${teamId} dispatched to ${target.type} [${target.priority}] — Status: EN_ROUTE. Route now active on all maps.`)
    } catch (err: any) {
      toast.error(err?.message || 'Dispatch failed')
    }
  }, [incidents, dispatchTeam])

  // ── Unassigned incidents for dispatch dropdown ──
  const unassignedIncidents = useMemo(() => {
    return incidents
      .filter(i => !i.assignedTo && i.status !== 'RESOLVED')
      .sort((a, b) => {
        const prioOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return (prioOrder[a.priority] ?? 9) - (prioOrder[b.priority] ?? 9)
      })
  }, [incidents])

  // ── Helper: refetch incidents from DB to recompute metric cards ──
  const refetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents?eventId=eq-maharashtra-2025-001')
      const data = await res.json()
      if (Array.isArray(data)) setIncidents(data)
    } catch { /* silent */ }
  }, [])

  // ── Verify / Reject handlers (persist via API, then refresh metric cards) ──
  const handleVerify = useCallback(async (id: string) => {
    try {
      await fetch('/api/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'VERIFIED', reviewedBy: 'SEOC-Admin' }),
      })
    } catch { /* API call best-effort */ }
    // Optimistic local update
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: 'VERIFIED' } : v))
    toast.success('Entry verified and pushed to GIS map')
    // Refresh incidents so the Verified metric card updates dynamically
    refetchIncidents()
  }, [refetchIncidents])

  const handleReject = useCallback(async (id: string) => {
    try {
      await fetch('/api/verification', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'FALSE', reviewedBy: 'SEOC-Admin' }),
      })
    } catch { /* API call best-effort */ }
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: 'FALSE' } : v))
    toast.info('Entry dismissed from active tracking')
    refetchIncidents()
  }, [refetchIncidents])

  // ── Computed metrics ──
  const verifiedCount = incidents.filter(i => i.status === 'VERIFIED').length
  const activeAlertsCount = alerts.filter(a => a.isActive).length
  const deployedTeamsCount = sharedTeams.filter(t => ACTIVE_STATUSES.includes(t.status)).length
  const pendingCount = verifications.filter(v => v.status !== 'VERIFIED' && v.status !== 'FALSE').length

  // ── Status badge color helper ──
  const statusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'HIGHLY_PROBABLE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'FALSE': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'UNVERIFIED': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const teamStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ROUTE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'ON_SITE': case 'DEPLOYED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'STANDBY': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'AVAILABLE': return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="relative block w-full min-h-screen bg-slate-900 text-white overflow-y-auto px-4 sm:px-6 py-8 flex flex-col gap-y-10 pb-24">

      {/* ═══ 1. MACRO METRICS TICKER ═══ */}
      <section aria-label="Key Metrics">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          Operational Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Incidents', value: incidents.length, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Verified', value: verifiedCount, icon: CheckCircle, color: 'text-emerald-400' },
            { label: 'Active Alerts', value: activeAlertsCount, icon: Radio, color: 'text-amber-400' },
            { label: 'Deployed Teams', value: deployedTeamsCount, icon: Users, color: 'text-blue-400' },
          ].map(card => (
            <div key={card.label} className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
              <div className={`${card.color} shrink-0`}>
                <card.icon className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-white break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                  {loading ? <Skeleton className="h-7 w-12 inline-block" /> : card.value}
                </div>
                <p className="text-xs text-slate-400 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 2. DATA VERIFICATION PIPELINE ═══ */}
      <section aria-label="Data Verification Pipeline">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
            Data Verification Pipeline
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-400 animate-pulse">
            {pendingCount} Pending
          </span>
        </div>
        <div className="w-full max-h-[350px] overflow-y-auto flex flex-col gap-y-3 relative block bg-slate-800/80 border border-slate-700/50 rounded-xl p-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-16 shrink-0" />
                <Skeleton className="h-5 w-12 shrink-0" />
                <Skeleton className="h-2 flex-1 max-w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-7 w-16 shrink-0" />
                <Skeleton className="h-7 w-16 shrink-0" />
              </div>
            ))
          ) : verifications.length === 0 ? (
            <div className="text-sm text-slate-500 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
              No verification entries loaded.
            </div>
          ) : (
            verifications.map(v => {
              const isActionable = v.status !== 'VERIFIED' && v.status !== 'FALSE'
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 w-full"
                >
                  {/* Left: Status badge + Source tier badge + confidence bar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] border ${statusColor(v.status)}`}>
                      {v.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-300 border-slate-600/50">
                      {v.sourceTier}
                    </Badge>
                    <div className="flex items-center gap-1.5 min-w-[60px]">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(v.confidence * 100)}%`,
                            background: v.confidence > 0.8 ? '#22c55e' : v.confidence > 0.5 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{Math.round(v.confidence * 100)}%</span>
                    </div>
                  </div>

                  {/* Center: Raw content text (div, not p, to avoid hydration errors with block-level children) */}
                  <div className="text-xs text-slate-300 line-clamp-1 flex-1 min-w-0 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                    {v.rawContent}
                  </div>

                  {/* Right: Action buttons */}
                  {isActionable && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleVerify(v.id)}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-600/30 transition-colors"
                      >
                        ✔️ Verify
                      </button>
                      <button
                        onClick={() => handleReject(v.id)}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-semibold hover:bg-red-600/30 transition-colors"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* ═══ 3. GIS COMMAND MAP ═══ */}
      <section aria-label="GIS Command Map">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          GIS Command Map
        </h2>
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {([
            { key: 'all' as const, label: 'All Elements', emoji: '' },
            { key: 'incidents' as const, label: 'Active Incidents', emoji: '🚨' },
            { key: 'teams' as const, label: 'Rescue Teams', emoji: '🚒' },
            { key: 'resources' as const, label: 'Critical Resources', emoji: '🏥' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setMapFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mapFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
        <div className="relative rounded-xl overflow-hidden border-2 border-slate-700/50">
          {/* Fleet Sidebar Toggle - top right */}
          <div className="absolute top-3 right-3 z-20">
            <Button
              size="sm"
              variant={showFleetSidebar ? 'default' : 'outline'}
              className={showFleetSidebar
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 text-xs gap-1.5'
                : 'bg-slate-800/90 text-slate-300 border-slate-600 hover:bg-slate-700 text-xs gap-1.5 backdrop-blur-sm'
              }
              onClick={() => setShowFleetSidebar(prev => !prev)}
            >
              📋 Active Fleet
            </Button>
          </div>

          {/* Fleet Sidebar Panel */}
          {showFleetSidebar && (
            <div className="absolute top-0 right-0 h-full w-80 bg-slate-800/95 backdrop-blur-sm border-l border-slate-700/50 z-10 overflow-y-auto">
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                  Active Fleet
                </h3>
                <button
                  onClick={() => setShowFleetSidebar(false)}
                  className="text-slate-400 hover:text-white transition-colors shrink-0 p-1"
                  aria-label="Close fleet panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ScrollArea className="h-[calc(100%-52px)]">
                <div className="p-3 flex flex-col gap-2">
                  {sharedTeams.map(team => {
                    const config = TEAM_ICON_MAP[team.unitType] || { symbol: '📋', color: '#64748b' }
                    const assignedInc = incidents.find(i => i.id === team.assignedIncidentId)
                    const isDispatchable = team.status === 'STANDBY' || team.status === 'AVAILABLE'
                    return (
                      <div
                        key={team.id}
                        className="w-full bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/50 rounded-lg p-3 transition-colors group"
                      >
                        <button
                          onClick={() => handleTeamClick(team)}
                          className="w-full text-left"
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
                            <div className="text-[10px] text-slate-500 mt-1.5 truncate break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                              → {assignedInc.type} @ {assignedInc.priority}
                            </div>
                          )}
                        </button>
                        {isDispatchable && (
                          <div className="mt-2 relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDispatchDropdownTeam(dispatchDropdownTeam === team.id ? null : team.id)
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-[10px] font-semibold hover:bg-blue-600/30 transition-colors flex items-center justify-between gap-1"
                            >
                              <span>🚀 Dispatch Unit</span>
                              {dispatchDropdownTeam === team.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            {dispatchDropdownTeam === team.id && (
                              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900/95 backdrop-blur-sm border border-slate-600/60 rounded-lg shadow-2xl shadow-black/40 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                                {unassignedIncidents.length === 0 ? (
                                  <div className="px-3 py-2.5 text-[11px] text-slate-500 text-center">No unassigned incidents</div>
                                ) : (
                                  unassignedIncidents.map(inc => {
                                    const prioColor = inc.priority === 'CRITICAL' ? 'text-red-400' : inc.priority === 'HIGH' ? 'text-orange-400' : 'text-amber-400'
                                    const typeSymbol = INCIDENT_TYPE_SYMBOL[inc.type] || '📍'
                                    return (
                                      <button
                                        key={inc.id}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDispatchToIncident(team.id, inc.id)
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-800/80 border-b border-slate-700/30 last:border-0 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm shrink-0">{typeSymbol}</span>
                                          <div className="min-w-0 flex-1">
                                            <div className="text-[11px] font-semibold text-slate-200 truncate">{inc.type}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{inc.description || 'No description'}</div>
                                          </div>
                                          <span className={`text-[10px] font-bold ${prioColor} shrink-0`}>{inc.priority}</span>
                                        </div>
                                      </button>
                                    )
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Map */}
          <MapWrapper
            center={MAP_CENTER}
            zoom={MAP_ZOOM}
            className="h-[600px] min-h-[550px] w-full rounded-xl overflow-hidden relative block mb-6"
            markers={mapMarkers}
            routingQueries={routingQueries}
            onMapReady={handleMapReady}
            panTo={panTo}
          />
        </div>
      </section>

      {/* ═══ 5. INCIDENT TIMELINE ═══ */}
      <div className="relative w-full block h-auto clear-both mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          Incident Timeline
        </h2>
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 max-h-96 overflow-y-auto custom-scrollbar">
          {incidents.length === 0 ? (
            <div className="text-sm text-slate-500 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">No incidents loaded.</div>
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
                        <div className="text-xs text-slate-300 leading-relaxed line-clamp-1 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                          {inc.description}
                        </div>
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

      {/* ═══ 6. ACTIVITY TIMELINE ═══ */}
      <div className="relative w-full block h-auto clear-both mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          Activity Timeline
        </h2>
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 max-h-96 overflow-y-auto custom-scrollbar">
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-gradient-to-b from-cyan-500/50 via-emerald-500/50 to-slate-700" />
            {[
              { time: '14:32', icon: <Zap className="h-3.5 w-3.5" />, color: 'text-red-400', bg: 'bg-red-500/20', title: 'Earthquake Detected', desc: 'M6.2 seismic event registered at 18.07°N, 76.62°E (Killari). Depth: 12.5km. NCS alert triggered.' },
              { time: '14:33', icon: <Radio className="h-3.5 w-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/20', title: 'SEOC Activated', desc: 'State Emergency Operations Centre activated. All rescue teams placed on standby. Event ID: eq-maharashtra-2025-001.' },
              { time: '14:35', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/20', title: 'Citizen Reports Flooding', desc: '5 clustered civilian reports received for building collapse near Ganj Golai market. Auto-verified via spatiotemporal clustering.' },
              { time: '14:37', icon: <Shield className="h-3.5 w-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20', title: 'NDRF Team Alpha Deployed', desc: 'NDRF Team Alpha (12 members) dispatched to Priority 1 collapse zone. Status: EN ROUTE. ETA: 8 minutes.' },
              { time: '14:38', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20', title: 'Landslide Verified', desc: 'Ausa Road highway landslide confirmed via 4 civilian reports + aerial imagery. SDRF Battalion 3 deployed.' },
              { time: '14:40', icon: <Eye className="h-3.5 w-3.5" />, color: 'text-violet-400', bg: 'bg-violet-500/20', title: 'AI Situation Report Generated', desc: 'Multi-agent AI system produced comprehensive situation summary. 2 confirmed collapses, 1 active landslide, 1 gas fire identified.' },
              { time: '14:41', icon: <Brain className="h-3.5 w-3.5" />, color: 'text-violet-400', bg: 'bg-violet-500/20', title: 'Priority Ranking Computed', desc: 'AI Priority Agent ranked 5 incident zones. Ganj Golai collapse scored 95/100 (CRITICAL). Renapur school unassigned.' },
              { time: '14:42', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'text-blue-400', bg: 'bg-blue-500/20', title: 'Medical Alert Broadcast', desc: 'Hospital overload warning issued. Yashwantrao Chavan Rural Hospital at 96% capacity. Medical evacuation corridor recommended.' },
              { time: '14:43', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/20', title: 'False Report Dismissed', desc: 'Social media claim of Nilanga bridge collapse marked FALSE. Contradicted by PWD Tier 1 ground inspection.' },
              { time: '14:45', icon: <Users className="h-3.5 w-3.5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20', title: 'Medical Team On-Site', desc: 'Medical Response Team 1 arrived at Shivaji Nagar market casualty zone. Treating multiple injuries.' },
              { time: '14:47', icon: <Radio className="h-3.5 w-3.5" />, color: 'text-amber-400', bg: 'bg-amber-500/20', title: 'Aftershock Warning Issued', desc: 'Seismologists predict M4-5 aftershocks in next 12 hours. All teams maintain alert. Public advised to stay in open areas.' },
              { time: '14:50', icon: <Send className="h-3.5 w-3.5" />, color: 'text-blue-400', bg: 'bg-blue-500/20', title: 'SEOC Command Broadcast', desc: 'Dispatch order issued: Fire Station Latur to Renapur school collapse. Army Engineering Corps on standby for heavy equipment.' },
            ].map((entry, idx) => (
              <div key={idx} className="relative mb-3.5 last:mb-0 group">
                <div className={`absolute -left-3.5 top-1 w-3 h-3 rounded-full border-2 border-slate-800 ${entry.bg} shadow-sm`} />
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`${entry.color} shrink-0`}>{entry.icon}</span>
                      <span className="text-xs font-semibold text-slate-200 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">{entry.title}</span>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-auto font-mono">{entry.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                      {entry.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 7. COMMAND BROADCAST MODULE ═══ */}
      <section aria-label="Command Broadcast">
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
            Command Broadcast
          </h2>

          {/* Channel tabs */}
          <Tabs value={broadcastChannel} onValueChange={(v) => setBroadcastChannel(v as any)}>
            <TabsList className="bg-slate-900/60 border border-slate-700/50">
              <TabsTrigger value="public" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">📢 Public Safety</TabsTrigger>
              <TabsTrigger value="tactical" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">🛡️ Tactical Order</TabsTrigger>
              <TabsTrigger value="interagency" className="text-xs data-[state=active]:bg-violet-600 data-[state=active]:text-white">🏛️ Inter-Agency</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-[11px] text-slate-500 mt-2 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
            {CHANNEL_DESC[broadcastChannel]}
          </div>

          {/* Alert Title / Header input */}
          <div className="mt-3">
            <Input
              value={broadcastHeader}
              onChange={e => setBroadcastHeader(e.target.value.slice(0, 80))}
              placeholder="Alert Title / Header (e.g. EVACUATION ORDER)"
              className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 text-sm font-semibold"
              maxLength={80}
            />
          </div>

          {/* Severity Toggle Grid */}
          <div className="mt-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Select Alert Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'advisory' as const, emoji: '⚠️', label: 'Advisory', activeClass: 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20', inactiveClass: 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:border-blue-500/40' },
                { value: 'alert' as const, emoji: '🚨', label: 'Alert', activeClass: 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-500/20', inactiveClass: 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:border-amber-500/40' },
                { value: 'evacuate' as const, emoji: '🛑', label: 'Evacuate', activeClass: 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-500/30 animate-pulse', inactiveClass: 'bg-slate-900/60 border-slate-700/50 text-slate-400 hover:border-red-500/40' },
              ].map(sev => (
                <button
                  key={sev.value}
                  onClick={() => setBroadcastSeverity(sev.value)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${broadcastSeverity === sev.value ? sev.activeClass : sev.inactiveClass}`}
                >
                  <span className="block text-base mb-0.5">{sev.emoji}</span>
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message textarea with 250 char counter */}
          <div className="relative mt-3">
            <Textarea
              value={broadcastMsg}
              onChange={e => { if (e.target.value.length <= 250) setBroadcastMsg(e.target.value) }}
              placeholder={`Type ${broadcastChannel === 'public' ? 'public safety' : broadcastChannel === 'tactical' ? 'tactical operational' : 'inter-agency situation'} message...`}
              className="flex-1 min-h-[60px] max-h-28 resize-none bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 text-sm"
              rows={2}
            />
            <div className="flex justify-end mt-1.5">
              <span className={`text-[10px] font-mono ${broadcastMsg.length > 250 ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                {broadcastMsg.length} / 250
              </span>
            </div>
          </div>

          {/* Template shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {BROADCAST_TEMPLATES.map(tpl => (
              <button key={tpl.label} onClick={() => setBroadcastMsg(tpl.text)} className="text-left px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 hover:border-slate-600/60 text-[11px] text-slate-300 hover:text-white transition-colors truncate" title={tpl.text}>
                {tpl.label}
              </button>
            ))}
          </div>

          {/* Send button */}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSendBroadcast} disabled={!broadcastHeader.trim() || !broadcastMsg.trim() || sendingBroadcast} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white gap-2 h-auto px-5">
              {sendingBroadcast ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Send</span>
            </Button>
          </div>

          {/* Recent Broadcasts from shared state */}
          <div className="border-t border-slate-700/50 pt-4 mt-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-3">Recent Broadcasts</h3>
            {sharedBroadcasts.length === 0 ? (
              <div className="text-sm text-slate-500">No broadcasts yet.</div>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                {sharedBroadcasts.slice(0, 10).map(b => {
                  const sevStyle = b.severity === 'evacuate' ? 'border-red-500/40 bg-red-950/20' : b.severity === 'alert' ? 'border-amber-500/40 bg-amber-950/20' : 'border-blue-500/40 bg-blue-950/20'
                  const chLabel = b.channel === 'public' ? '📢 Public' : b.channel === 'tactical' ? '🛡️ Tactical' : '🏛️ Inter-Agency'
                  const sevLabel = b.severity === 'evacuate' ? '🛑' : b.severity === 'alert' ? '🚨' : '⚠️'
                  return (
                    <div key={b.id} className={`bg-slate-900/50 rounded-lg p-3 border ${sevStyle}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-400 truncate">{b.header}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">{chLabel} {sevLabel}</span>
                      </div>
                      <div className="text-xs text-slate-300 line-clamp-2">{b.message}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{b.sentBy} · {new Date(b.createdAt).toLocaleTimeString()}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ 8. AI INTELLIGENCE SUMMARY ═══ */}
      <section aria-label="AI Intelligence Summary">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          AI Intelligence Summary
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))
          ) : agents.length === 0 ? (
            <div className="text-sm text-slate-500 col-span-full break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
              No AI intelligence outputs available.
            </div>
          ) : (
            agents.map(agent => (
              <div
                key={agent.id}
                className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    agent.agentType === 'SITUATION' ? 'bg-cyan-500/20 text-cyan-400' :
                    agent.agentType === 'PRIORITY' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {agent.agentType === 'SITUATION' ? <Eye className="h-4 w-4" /> :
                     agent.agentType === 'PRIORITY' ? <Shield className="h-4 w-4" /> :
                     <Brain className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                      {agent.agentType === 'SITUATION' ? 'Situation Report' :
                       agent.agentType === 'PRIORITY' ? 'Priority Ranking' :
                       'Action Recommendations'}
                    </h3>
                    <div className="text-[10px] text-slate-500 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                      Agent: {agent.agentType}
                    </div>
                  </div>
                </div>
                <ScrollArea className="max-h-72">
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line break-words normal-case block w-full max-w-full overflow-hidden">
                    {agent.output}
                  </div>
                </ScrollArea>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ═══ 9. ANALYTICS DASHBOARD ═══ */}
      <section aria-label="Analytics Dashboard">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
          Analytics Dashboard
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-slate-800/80 rounded-xl p-5 min-h-[380px] border border-slate-700/50">
                <Skeleton className="h-5 w-28 mb-4" />
                <Skeleton className="h-64 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <AnalyticsCharts
            incidents={incidents}
            verifications={verifications}
            resources={resources}
            chartMode="compact"
          />
        )}
      </section>
    </div>
  )
}
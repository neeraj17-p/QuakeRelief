'use client'

import { useState, useEffect, useCallback } from 'react'
import MapWrapper from '@/components/quake-relief/shared/map-wrapper'
import { createIcon, createPulsingIcon, preloadLeaflet } from '@/components/quake-relief/shared/icon-factories'
import { EPICENTRE, MAP_CENTER, MAP_ZOOM } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import IncidentDetailSheet from '@/components/quake-relief/shared/incident-detail-sheet'
import { useAnimatedCounter } from '@/hooks/use-animated-counter'
import type { IncidentDetail } from '@/components/quake-relief/shared/incident-detail-sheet'
import { useAppStore } from '@/store/app-store'
import { useSharedState } from '@/hooks/use-shared-state'
import {
  ShieldCheck, AlertTriangle, MapPin, Heart, Users, Bell, CheckCircle, Send, X,
  ChevronRight, Radio, Clock, TrendingUp, ArrowUpRight, Info, Waves, Cross, Home, Tent, Activity,
  XCircle, Cloud, Sun, BarChart3, Search, Phone, Building2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Alert {
  id: string
  title: string
  message: string
  severity: string
  targetRole: string
  isActive: boolean
  createdAt: string
}

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

// ─── Severity config ────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  EVACUATION: 'bg-orange-500 text-white',
  WARNING: 'bg-amber-500 text-white',
  INFO: 'bg-blue-500 text-white',
}

const SEVERITY_ICONS: Record<string, string> = {
  CRITICAL: '\u{1F534}',
  EVACUATION: '\u{1F7E0}',
  WARNING: '\u{1F7E1}',
  INFO: '\u{1F535}',
}

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

// ─── Emergency Contacts ────────────────────────────────────────────────────

const EMERGENCY_CONTACTS = [
  { label: 'State EOC Helpline', phone: '1077', icon: Phone, desc: '24/7 Emergency Operations' },
  { label: 'NDRF Control Room', phone: '+91-11-2610-7866', icon: ShieldCheck, desc: 'National Disaster Response' },
  { label: 'District Control Latur', phone: '+91-2382-221010', icon: MapPin, desc: 'Latur District Control' },
  { label: 'Fire Emergency', phone: '101', icon: AlertTriangle, desc: 'Fire & Rescue Services' },
  { label: 'Ambulance / Medical', phone: '108', icon: Heart, desc: 'Emergency Medical Services' },
  { label: 'Police Control Room', phone: '100', icon: Users, desc: 'Law & Order Emergency' },
] as const

// ─── Infrastructure Damage Types ───────────────────────────────────────────

const DAMAGE_TYPE_OPTIONS = [
  'Road Blockage',
  'Water Pipeline Burst',
  'Power Line Down',
  'Bridge Damage',
  'Building Crack',
  'Other',
] as const

const DAMAGE_TYPE_MAP: Record<string, string> = {
  'Road Blockage': 'ROAD_BLOCK',
  'Water Pipeline Burst': 'ROAD_BLOCK',
  'Power Line Down': 'ROAD_BLOCK',
  'Bridge Damage': 'ROAD_BLOCK',
  'Building Crack': 'COLLAPSE',
  'Other': 'ROAD_BLOCK',
}

function haversineKmPublic(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PublicPortal() {
  // ── Zustand store ──
  const { userName, userPhone } = useAppStore()

  // ── Shared state (real-time broadcasts) ──
  const { broadcasts: sharedBroadcasts } = useSharedState()

  // ── State ──
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [leafletReady, setLeafletReady] = useState(false)
  const [recentIncidents, setRecentIncidents] = useState<IncidentDetail[]>([])
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Quick actions
  const [showSafeForm, setShowSafeForm] = useState(false)
  const [showHelpForm, setShowHelpForm] = useState(false)
  const [showInfraForm, setShowInfraForm] = useState(false)

  // Safety check-in form
  const [safeName, setSafeName] = useState('')
  const [safePhone, setSafePhone] = useState('')
  const [safeNote, setSafeNote] = useState('')
  const [safeSubmitting, setSafeSubmitting] = useState(false)
  const [safeSuccess, setSafeSuccess] = useState(false)

  // Infrastructure report form
  const [infraDamageType, setInfraDamageType] = useState('')
  const [infraLocation, setInfraLocation] = useState('')
  const [infraDescription, setInfraDescription] = useState('')
  const [infraName, setInfraName] = useState('')
  const [infraPhone, setInfraPhone] = useState('')
  const [infraSubmitting, setInfraSubmitting] = useState(false)
  const [infraLat, setInfraLat] = useState<string>('')
  const [infraLng, setInfraLng] = useState<string>('')

  // SOS panic button
  const [sosOpen, setSosOpen] = useState(false)
  const [sosSending, setSosSending] = useState(false)
  const [sosProgress, setSosProgress] = useState(0)
  const [sosSent, setSosSent] = useState(false)
  const [sosCoords, setSosCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [sosGpsNote, setSosGpsNote] = useState('')

  // People Finder
  const [safetyCheckIns, setSafetyCheckIns] = useState<Array<{
    id: string
    personName: string
    phone: string | null
    status: string
    createdAt: string
    note: string | null
  }>>([])
  const [peopleSearch, setPeopleSearch] = useState('')

  // Stats
  const [stats, setStats] = useState({
    safeCheckins: 0,
    helpRequests: 0,
    activeAlerts: 0,
  })

  // Animated counters
  const animatedSafe = useAnimatedCounter(stats.safeCheckins)
  const animatedHelp = useAnimatedCounter(stats.helpRequests)
  const animatedAlerts = useAnimatedCounter(stats.activeAlerts)

  // ── Auto-fill from store on mount ──
  useEffect(() => {
    if (userName) setSafeName(userName)
    if (userPhone) setSafePhone(userPhone)
    if (userName) setInfraName(userName)
    if (userPhone) setInfraPhone(userPhone)
  }, [userName, userPhone])

  // ── Fetch data on mount & preload Leaflet ──
  useEffect(() => {
    preloadLeaflet().then(() => setLeafletReady(true))
    Promise.all([fetchAlerts(), fetchResources(), fetchStats(), fetchRecentIncidents(), fetchSafetyCheckIns()]).finally(() => {
      setLoading(false)
    })
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?targetRole=PUBLIC')
      if (res.ok) {
        const data: Alert[] = await res.json()
        setAlerts(data)
      }
    } catch {
      // Silently fail – alerts are non-critical for page render
    }
  }, [])

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch('/api/resources')
      if (res.ok) {
        const data: Resource[] = await res.json()
        setResources(data)
      }
    } catch {
      // Silent fail
    }
  }, [])

  const fetchRecentIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents?eventId=eq-maharashtra-2025-001')
      if (res.ok) {
        const data: IncidentDetail[] = await res.json()
        setRecentIncidents(
          data
            .filter((i) => i.status === 'VERIFIED' || i.status === 'HIGHLY_PROBABLE')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        )
      }
    } catch {
      // Silent fail
    }
  }, [])

  const fetchSafetyCheckIns = useCallback(async () => {
    try {
      const res = await fetch('/api/safety-check')
      if (res.ok) {
        const data = await res.json()
        setSafetyCheckIns(data)
      }
    } catch {
      // Silent fail
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const [safetyRes, incidentsRes, alertsRes] = await Promise.all([
        fetch('/api/safety-check'),
        fetch('/api/incidents?eventId=eq-maharashtra-2025-001'),
        fetch('/api/alerts?targetRole=PUBLIC'),
      ])

      const safeCount = safetyRes.ok
        ? ((await safetyRes.json()) as Array<{ status: string }>).filter(
            (s) => s.status === 'SAFE',
          ).length
        : 0

      const helpCount = incidentsRes.ok
        ? ((await incidentsRes.json()) as unknown[]).length
        : 0

      const alertCount = alertsRes.ok
        ? ((await alertsRes.json()) as Alert[]).length
        : 0

      setStats({ safeCheckins: safeCount, helpRequests: helpCount, activeAlerts: alertCount })
    } catch {
      // Silent fail
    }
  }, [])

  // ── Dismiss alert ──
  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id))
  }

  // ── Safety check-in submit ──
  const handleSafeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!safeName.trim()) {
      toast.error('Please enter your name.')
      return
    }
    setSafeSubmitting(true)
    try {
      const res = await fetch('/api/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'eq-maharashtra-2025-001',
          personName: safeName.trim(),
          phone: safePhone.trim() || null,
          status: 'SAFE',
          note: safeNote.trim() || null,
        }),
      })
      if (res.ok) {
        setSafeSuccess(true)
        toast.success('Your safety check-in has been recorded. Stay safe!')
        fetchStats()
        // Reset after a moment
        setTimeout(() => {
          setSafeSuccess(false)
          setShowSafeForm(false)
          setSafeName('')
          setSafePhone('')
          setSafeNote('')
        }, 4000)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to submit. Please try again.')
      }
    } catch {
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setSafeSubmitting(false)
    }
  }

  // ── Infrastructure report submit ──
  const handleInfraSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!infraDamageType) {
      toast.error('Please select a damage type.')
      return
    }
    if (!infraLocation.trim()) {
      toast.error('Please describe the location.')
      return
    }
    if (!infraDescription.trim()) {
      toast.error('Please provide a brief description.')
      return
    }
    setInfraSubmitting(true)
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'eq-maharashtra-2025-001',
          type: DAMAGE_TYPE_MAP[infraDamageType] || 'ROAD_BLOCK',
          description: `[Infrastructure] ${infraDamageType}: ${infraDescription.trim()}${infraLat && infraLng ? ` — Coordinates: ${infraLat}, ${infraLng}` : ''} — Location: ${infraLocation.trim()}`,
          latitude: infraLat ? parseFloat(infraLat) : 18.4080,
          longitude: infraLng ? parseFloat(infraLng) : 76.5768,
          reporterName: infraName.trim() || null,
          reporterPhone: infraPhone.trim() || null,
          reportedBy: 'CITIZEN',
        }),
      })
      if (res.ok) {
        toast.success('Infrastructure damage report submitted successfully!')
        setShowInfraForm(false)
        setInfraDamageType('')
        setInfraLocation('')
        setInfraDescription('')
        setInfraLat('')
        setInfraLng('')
        fetchStats()
        fetchRecentIncidents()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to submit report. Please try again.')
      }
    } catch {
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setInfraSubmitting(false)
    }
  }

  // ── SOS Panic Button Handler ──
  const handleSOS = useCallback(() => {
    setSosOpen(true)
    setSosSending(true)
    setSosSent(false)
    setSosProgress(0)
    setSosGpsNote('')

    const FALLBACK_LAT = 18.4100
    const FALLBACK_LNG = 76.5850

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        setSosCoords(coords)
        runSOSTelemetry(coords)
      },
      () => {
        // GPS denied/unavailable — use fallback
        const coords = { lat: FALLBACK_LAT, lng: FALLBACK_LNG }
        setSosCoords(coords)
        setSosGpsNote('Using approximate location (GPS unavailable)')
        runSOSTelemetry(coords)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    )
  }, [])

  const runSOSTelemetry = (coords: { lat: number; lng: number }) => {
    // Progress bar animation over 3 seconds
    const startTime = Date.now()
    const duration = 3000
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(100, Math.round((elapsed / duration) * 100))
      setSosProgress(pct)
      if (pct >= 100) {
        clearInterval(progressInterval)
        setSosSending(false)
        setSosSent(true)
      }
    }, 50)

    // POST to /api/incidents after 3 seconds
    setTimeout(async () => {
      try {
        await fetch('/api/incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: 'eq-maharashtra-2025-001',
            type: 'SOS',
            description: 'SOS PANIC BUTTON — Immediate rescue required',
            latitude: coords.lat,
            longitude: coords.lng,
            priority: 'CRITICAL',
            reporterName: null,
            reporterPhone: null,
            immediateNeeds: ['rescue'],
            reportedBy: 'CITIZEN',
          }),
        })
        toast.success('SOS signal sent! Help is on the way.')
      } catch {
        toast.error('Failed to send SOS. Please call emergency services directly.')
      }
    }, 3000)
  }

  // ── Build map markers (public-safe only) ──
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

  // ── Visible alerts ──
  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id))

  // ── Public resource count ──
  const publicResourceCount = resources.filter((r) => PUBLIC_RESOURCE_TYPES.has(r.type)).length

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background portal-enter pt-2">
      {/* ═══ REAL-TIME PUBLIC ALERT BANNER ═══ */}
      {sharedBroadcasts.filter(b => b.channel === 'public').length > 0 && (
        <section className="space-y-2" aria-label="Live Alerts">
          {sharedBroadcasts.filter(b => b.channel === 'public').slice(0, 3).map(b => {
            const isEvacuate = b.severity === 'evacuate'
            const isAlert = b.severity === 'alert'
            const borderClass = isEvacuate 
              ? 'border-red-500/60 bg-red-950/50' 
              : isAlert 
                ? 'border-amber-500/60 bg-amber-950/40' 
                : 'border-blue-500/60 bg-blue-950/30'
            const iconEmoji = isEvacuate ? '🛑' : isAlert ? '🚨' : '⚠️'
            const titleColor = isEvacuate ? 'text-red-400' : isAlert ? 'text-amber-400' : 'text-blue-400'
            
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-4 ${borderClass} ${isEvacuate ? 'animate-pulse' : ''}`}
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{iconEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm font-bold ${titleColor} mb-1 break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden`}>
                      {b.header}
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">
                      {b.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      {b.sentBy} · {new Date(b.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* ═══════════════ 0. EARTHQUAKE EVENT HERO BANNER ═══════════════ */}
      <div className="relative border-l-4 border-red-500 bg-gradient-to-br from-red-50/80 via-red-50/40 to-transparent dark:from-red-950/40 dark:via-red-950/20 dark:to-transparent seismic-pattern overflow-hidden">
        <div className="relative inset-0 bg-gradient-to-r from-transparent via-transparent to-background/30 pointer-events-none" />
        {/* Seismic wave animation rings */}
        <div className="relative left-[39px] top-1/2 -translate-y-1/2 -translate-x-1/2 z-0">
          <div className="seismic-wave-ring size-8" style={{ animationDelay: '0s' }} />
          <div className="seismic-wave-ring size-8" style={{ animationDelay: '0.75s' }} />
          <div className="seismic-wave-ring size-8" style={{ animationDelay: '1.5s' }} />
          <div className="seismic-wave-ring size-8" style={{ animationDelay: '2.25s' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-4 sm:py-5 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left side: Earthquake details */}
            <div className="flex items-start gap-3">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <span className="absolute size-4 rounded-full bg-red-500 animate-ping opacity-75" />
                <span className="relative size-3 rounded-full bg-red-600" />
              </div>
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-red-700 tracking-tight">
                    M6.2
                  </span>
                  <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    EARTHQUAKE
                  </span>
                </div>
                <p className="text-sm sm:text-base text-foreground font-semibold mt-0.5">
                  Latur, Maharashtra (SEOC Control Hub)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Depth: 12.5km &middot; 2 hours ago
                </p>
              </div>
            </div>

            {/* Right side: Source info */}
            <div className="sm:text-right text-xs text-muted-foreground space-y-1 sm:pl-6">
              <div className="flex items-center gap-1.5 sm:justify-end">
                <Radio className="size-3.5" />
                <span>National Center for Seismology</span>
              </div>
              <p>Event ID: EQ-UT-2025-001</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ 1. ALERT BANNER ═══════════════ */}
      {visibleAlerts.length > 0 && (
        <div className="w-full bg-gradient-to-r from-red-50/40 via-amber-50/30 to-transparent">
          <div className="flex flex-wrap gap-3 p-3.5">
            {visibleAlerts.map((alert) => {
              const severityBorder = alert.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500' : alert.severity === 'WARNING' ? 'border-l-4 border-l-amber-500' : alert.severity === 'INFO' ? 'border-l-4 border-l-blue-500' : alert.severity === 'EVACUATION' ? 'border-l-4 border-l-orange-700' : ''
              const severityBg = alert.severity === 'CRITICAL' ? 'bg-gradient-to-r from-red-50/60 to-card dark:from-red-950/30 dark:to-card' : alert.severity === 'WARNING' ? 'bg-gradient-to-r from-amber-50/60 to-card dark:from-amber-950/30 dark:to-card' : alert.severity === 'INFO' ? 'bg-gradient-to-r from-blue-50/40 to-card dark:from-blue-950/20 dark:to-card' : alert.severity === 'EVACUATION' ? 'bg-gradient-to-r from-orange-50/60 to-card dark:from-orange-950/30 dark:to-card' : ''
              return (
              <div
                key={alert.id}
                className={`alert-slide-down flex items-center gap-2.5 px-5 py-3 rounded-lg shadow-sm min-w-0 flex-1 max-w-full border ${severityBorder} ${severityBg} ${SEVERITY_STYLES[alert.severity] || 'bg-gray-500 text-white'}`}
              >
                <span className="text-base shrink-0" role="img" aria-label={alert.severity}>
                  {SEVERITY_ICONS[alert.severity] || '\u26A0\uFE0F'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-tight">{alert.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* ── Page header ── */}
        <header className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            QuakeRelief
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Disaster Intelligence &mdash; Public Safety Portal
          </p>
        </header>

        {/* ═══════════════ 2. QUICK ACTIONS ═══════════════ */}
        <section aria-label="Quick Actions">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* I'm Safe button */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowSafeForm((v) => !v)
                  if (showHelpForm) setShowHelpForm(false)
                  if (showInfraForm) { setShowInfraForm(false); setInfraLat(''); setInfraLng('') }
                }}
                className="relative w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:from-emerald-800 active:to-emerald-900 text-white font-semibold text-lg h-12 px-6 transition-all duration-150 shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                <span className="absolute left-5 size-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="size-7" />
                </span>
                I&apos;m Safe
              </button>
              <p className="text-xs text-center text-muted-foreground">Mark yourself as safe</p>
            </div>

            {/* Need Help button — opens Emergency Numbers Dialog */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowHelpForm((v) => !v)
                  if (showSafeForm) setShowSafeForm(false)
                  if (showInfraForm) { setShowInfraForm(false); setInfraLat(''); setInfraLng('') }
                }}
                className="relative w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white font-semibold text-lg h-12 px-6 transition-all duration-150 shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
              >
                <span className="absolute left-5 size-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Heart className="size-7" />
                </span>
                Need Help
              </button>
              <p className="text-xs text-center text-muted-foreground">Emergency contacts &amp; numbers</p>
            </div>

            {/* Report Infrastructure button */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowInfraForm((v) => !v)
                  if (showSafeForm) setShowSafeForm(false)
                  if (showHelpForm) setShowHelpForm(false)
                }}
                className="relative w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:from-amber-800 active:to-amber-900 text-white font-semibold text-lg h-12 px-6 transition-all duration-150 shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              >
                <span className="absolute left-5 size-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Building2 className="size-7" />
                </span>
                Report Infrastructure
              </button>
              <p className="text-xs text-center text-muted-foreground">Report infrastructure damage</p>
            </div>
          </div>

          {/* Progress-like line with message */}
          <div className="mt-3 flex items-center gap-3">
            <Separator className="flex-1" />
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Your safety matters. Every report helps save lives.
            </p>
            <Separator className="flex-1" />
          </div>
        </section>

        {/* ═══════════════ 3. SAFETY CHECK-IN FORM ═══════════════ */}
        {showSafeForm && (
          <Card className="border-l-4 border-l-emerald-500 border border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/80 to-card dark:from-emerald-950/20 dark:to-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-800">
                <ShieldCheck className="size-5" />
                Safety Check-In
              </CardTitle>
              <p className="text-xs text-emerald-600 mt-1">
                We&apos;ll share your status with emergency coordinators
              </p>
            </CardHeader>
            <CardContent>
              {safeSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-emerald-700">
                  <CheckCircle className="size-12 text-emerald-500" />
                  <p className="font-semibold text-lg">You&apos;re marked as safe!</p>
                  <p className="text-sm text-muted-foreground">
                    Your check-in has been recorded.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSafeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="safe-name">Your Name *</Label>
                    <Input
                      id="safe-name"
                      placeholder="Enter your full name"
                      value={safeName}
                      onChange={(e) => setSafeName(e.target.value)}
                      required
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="safe-phone">Phone Number (optional)</Label>
                    <Input
                      id="safe-phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={safePhone}
                      onChange={(e) => setSafePhone(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="safe-note">Short Note (optional)</Label>
                    <Textarea
                      id="safe-note"
                      placeholder="e.g. I am at the relief camp, safe with my family."
                      value={safeNote}
                      onChange={(e) => setSafeNote(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={safeSubmitting}
                    className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                  >
                    {safeSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="size-4" />
                        Submit Check-In
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══════════════ 3b. PEOPLE FINDER ═══════════════ */}
        <section aria-label="People Finder">
          <Card className="glass-card card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-base">👥</span>
                People Finder
              </CardTitle>
              <p className="text-xs text-muted-foreground">Search for registered safe check-ins</p>
            </CardHeader>
            <CardContent>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  className="pl-10 h-10 text-sm"
                />
              </div>
              {!peopleSearch.trim() ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Search by name to find registered check-ins...
                </p>
              ) : (() => {
                const query = peopleSearch.trim().toLowerCase()
                const results = safetyCheckIns.filter(c =>
                  c.personName.toLowerCase().includes(query)
                )
                const shown = results.slice(0, 5)
                const remaining = results.length - 5
                if (results.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No results found
                    </p>
                  )
                }
                return (
                  <div className="space-y-2">
                    {shown.map((checkIn) => {
                      const statusBadge = checkIn.status === 'SAFE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : checkIn.status === 'UNABLE'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      const statusLabel = checkIn.status === 'SAFE' ? 'Safe' : checkIn.status === 'UNABLE' ? 'Unable' : 'Injured'
                      return (
                        <div key={checkIn.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex items-center justify-center size-8 rounded-full bg-muted shrink-0 text-sm font-bold text-foreground/70">
                              {checkIn.personName.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{checkIn.personName}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {checkIn.phone && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Phone className="size-2.5" />
                                    {checkIn.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge}`}>
                              {statusLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(checkIn.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {remaining > 0 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        and {remaining} more...
                      </p>
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════ 4. INFRASTRUCTURE REPORT FORM ═══════════════ */}
        {showInfraForm && (
          <Card className="border-l-4 border-l-amber-500 border border-amber-200 dark:border-amber-800/50 bg-gradient-to-r from-amber-50/80 to-card dark:from-amber-950/20 dark:to-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
                <Building2 className="size-5" />
                Report Infrastructure Damage
              </CardTitle>
              <p className="text-xs text-amber-600 mt-1">
                Help us map damaged infrastructure for faster repair response
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInfraSubmit} className="space-y-4">
                {/* Damage type */}
                <div className="space-y-2">
                  <Label htmlFor="infra-damage-type">Damage Type *</Label>
                  <Select
                    value={infraDamageType}
                    onValueChange={(v) => setInfraDamageType(v)}
                  >
                    <SelectTrigger id="infra-damage-type" className="h-12 text-base">
                      <SelectValue placeholder="Select damage type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAMAGE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location description */}
                <div className="space-y-2">
                  <Label htmlFor="infra-location">Location Description *</Label>
                  <Input
                    id="infra-location"
                    placeholder="e.g., Near Ganj Golai circle"
                    value={infraLocation}
                    onChange={(e) => setInfraLocation(e.target.value)}
                    required
                    className="h-12 text-base"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="infra-desc">Brief Description *</Label>
                  <Textarea
                    id="infra-desc"
                    placeholder="Describe the damage briefly..."
                    value={infraDescription}
                    onChange={(e) => setInfraDescription(e.target.value)}
                    rows={2}
                    required
                  />
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="infra-name">Your Name</Label>
                    <Input
                      id="infra-name"
                      placeholder="Full name"
                      value={infraName}
                      onChange={(e) => setInfraName(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="infra-phone">Phone Number</Label>
                    <Input
                      id="infra-phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={infraPhone}
                      onChange={(e) => setInfraPhone(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                {/* Coordinate Picker Map */}
                <div className="space-y-1.5">
                  <Label className="text-xs break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">📍 Click on the map to pin the exact distress location</Label>
                  <div className="relative block w-full h-[250px] rounded-lg overflow-hidden border border-slate-700/50">
                    <MapWrapper
                      center={[18.4080, 76.5768]}
                      zoom={13}
                      onMapClick={(lat, lng) => {
                        setInfraLat(lat.toFixed(4))
                        setInfraLng(lng.toFixed(4))
                      }}
                    />
                  </div>
                </div>

                {/* Coordinates display */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Latitude</Label>
                    <Input
                      value={infraLat}
                      onChange={(e) => setInfraLat(e.target.value)}
                      placeholder="18.xxxx"
                      readOnly
                      className="h-9 text-sm bg-muted"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs break-words whitespace-normal normal-case block w-full max-w-full overflow-hidden">Longitude</Label>
                    <Input
                      value={infraLng}
                      onChange={(e) => setInfraLng(e.target.value)}
                      placeholder="76.xxxx"
                      readOnly
                      className="h-9 text-sm bg-muted"
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={infraSubmitting}
                  className="w-full h-12 text-base bg-amber-600 hover:bg-amber-700"
                >
                  {infraSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting Report...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="size-4" />
                      Submit Infrastructure Report
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

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
                        onClick={() => { setSelectedIncident(inc); setDetailOpen(true) }}
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

        {/* ═══════════════ 5b. SEISMIC & WEATHER STATUS ═══════════════ */}
        <section aria-label="Seismic & Weather Status">
          <Card className="glass-card card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cloud className="size-5 text-sky-500" />
                Seismic &amp; Weather Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Magnitude</p>
                  <p className="text-sm font-bold text-red-600">M6.2</p>
                  <p className="text-xs text-muted-foreground">Main Shock</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Depth</p>
                  <p className="text-sm font-bold">12.5 km</p>
                  <p className="text-xs text-muted-foreground">Focal Depth</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sun className="size-3 text-amber-500" /> Weather
                  </p>
                  <p className="text-sm font-bold">Clear Skies</p>
                  <p className="text-xs text-muted-foreground">No rainfall 48h</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="size-3 text-orange-500" /> Aftershocks
                  </p>
                  <p className="text-sm font-bold">3 detected</p>
                  <p className="text-xs text-muted-foreground">M2.1 – M3.1 range</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════ 6. EVACUATION GUIDANCE ═══════════════ */}
        <section aria-label="Evacuation Guidance">
          <Card className="border-amber-200 bg-amber-50/40 card-glow border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
                <AlertTriangle className="size-5" />
                Evacuation Guidance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500 text-white text-xs font-bold shrink-0 mt-0.5 badge-pulse">1</span>
                  <span>Move to open areas away from buildings</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/70 text-white text-xs font-bold shrink-0 mt-0.5">2</span>
                  <span>Follow designated evacuation routes marked on the map</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/70 text-white text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span>Do not re-enter damaged structures</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/70 text-white text-xs font-bold shrink-0 mt-0.5">4</span>
                  <span>Keep phone lines free for emergencies</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground/90">
                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-500/70 text-white text-xs font-bold shrink-0 mt-0.5">5</span>
                  <span>Listen for official alerts on this portal</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* ── Divider: Safety Overview ── */}
        <div className="flex items-center gap-3 py-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" /> SAFETY OVERVIEW
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ═══════════════ 7. SAFETY STATS ═══════════════ */}
        <section aria-label="Safety Statistics">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Safe Check-Ins */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 glass-card card-glow card-stagger" style={{ animationDelay: '0ms' }}>
                <ShieldCheck className="absolute -right-3 -bottom-3 size-24 text-emerald-500 opacity-10" />
                <CardContent className="relative p-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-emerald-700">{animatedSafe}</p>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                      <ArrowUpRight className="size-3" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Safe Check-Ins</p>
                </CardContent>
              </Card>

              {/* Help Requests */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white border-red-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 glass-card card-glow card-stagger" style={{ animationDelay: '100ms' }}>
                <AlertTriangle className="absolute -right-3 -bottom-3 size-24 text-red-500 opacity-10" />
                <CardContent className="relative p-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-red-700">{animatedHelp}</p>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                      <TrendingUp className="size-3" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Help Requests</p>
                </CardContent>
              </Card>

              {/* Active Alerts */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 glass-card card-glow card-stagger" style={{ animationDelay: '200ms' }}>
                <Bell className="absolute -right-3 -bottom-3 size-24 text-amber-500 opacity-10" />
                <CardContent className="relative p-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-amber-700">{animatedAlerts}</p>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      <Radio className="size-3" />
                      Live
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white border-slate-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 glass-card card-glow card-stagger" style={{ animationDelay: '300ms' }}>
                <Clock className="absolute -right-3 -bottom-3 size-24 text-slate-400 opacity-10" />
                <CardContent className="relative p-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-slate-700">12 min</p>
                    <span className="flex items-center gap-0.5 text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Avg
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* ═══════════════ 8. DOS & DON'TS (moved to bottom) ═══════════════ */}
        <section aria-label="Post-Earthquake Safety Guide">
          <Card className="glass-card card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="size-5 text-emerald-600" />
                Post-Earthquake Safety Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="dos" className="border-emerald-200">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                      <CheckCircle className="size-4 text-emerald-600" />
                      Do&apos;s After an Earthquake
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2.5 pt-1">
                      {[
                        { title: 'Drop, Cover, and Hold On', desc: 'Drop to hands and knees, cover head/neck under sturdy furniture, hold on until shaking stops' },
                        { title: 'Evacuate to Open Ground', desc: 'Move away from buildings, trees, power lines to open areas after shaking stops' },
                        { title: 'Check for Injuries', desc: 'Provide first aid to those around you. Do not move seriously injured unless in danger' },
                        { title: 'Use Stairs, Not Elevators', desc: 'After earthquake, always use stairs. Elevators may be damaged or lose power' },
                        { title: 'Listen to Official Alerts', desc: 'Follow IMD, NDRF, and District Administration instructions via radio/official channels' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="donts" className="border-red-200">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                      <XCircle className="size-4 text-red-600" />
                      Don&apos;ts After an Earthquake
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2.5 pt-1">
                      {[
                        { title: 'Do Not Run Outside During Shaking', desc: 'Falling debris is the primary cause of earthquake injuries' },
                        { title: 'Do Not Use Matches or Lighters', desc: 'Gas leaks may be present. Use flashlights only' },
                        { title: 'Do Not Stand Near Windows/Glass', desc: 'Glass shattering causes severe injuries in earthquakes' },
                        { title: 'Do Not Enter Damaged Buildings', desc: 'Aftershocks can cause further collapse. Wait for structural assessment' },
                        { title: 'Do Not Spread Unverified Rumors', desc: 'Share only official information. False reports can cause panic and misdirect rescue efforts' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="flex items-center justify-center size-6 rounded-full bg-red-100 text-red-700 text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>
      </main>
      {/* Footer removed — main page.tsx already has a global footer */}

      {/* ══════ Floating SOS Panic Button ══════ */}
      <button
        onClick={handleSOS}
        className="fixed bottom-20 right-4 z-50 group"
        aria-label="Emergency SOS - Send distress signal"
      >
        {/* Triple pulsing rings */}
        <span className="absolute inset-[-8px] rounded-full bg-red-500/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0s' }} />
        <span className="absolute inset-[-16px] rounded-full bg-red-500/25 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
        <span className="absolute inset-[-24px] rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.8s' }} />
        <span className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-2xl shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all duration-200 group-hover:scale-105 active:scale-95">
          SOS
        </span>
      </button>

      {/* ══════ SOS Emergency Modal ══════ */}
      <Dialog open={sosOpen} onOpenChange={(open) => { if (!open) { setSosOpen(false); setSosSending(false); setSosProgress(0); setSosSent(false); setSosCoords(null); setSosGpsNote('') } }}>
        <DialogContent className="sm:max-w-md border-red-500/50" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <div className="relative overflow-hidden rounded-lg">
            {/* Red pulsing background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-red-800/5 animate-pulse pointer-events-none" />
            <DialogHeader className="relative">
              <DialogTitle className="text-center text-xl font-bold text-red-600">
                🚨 EMERGENCY SOS ACTIVATED 🚨
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                {sosSent ? 'Your location has been shared with rescue teams.' : 'Sending your location to SEOC...'}
              </DialogDescription>
            </DialogHeader>

            <div className="relative mt-4 space-y-4">
              {!sosSent ? (
                <>
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Transmitting distress signal...</span>
                      <span>{sosProgress}%</span>
                    </div>
                    <Progress value={sosProgress} className="h-2" />
                  </div>

                  {/* Coordinates display */}
                  <div className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">GPS Coordinates</p>
                    <p className="text-sm font-mono font-semibold">
                      {sosCoords ? `${sosCoords.lat.toFixed(4)}°N, ${sosCoords.lng.toFixed(4)}°E` : 'Acquiring...'}
                    </p>
                  </div>

                  {sosGpsNote && (
                    <p className="text-xs text-amber-600 text-center">⚠️ {sosGpsNote}</p>
                  )}
                </>
              ) : (
                <>
                  {/* Success state */}
                  <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 p-4 text-center space-y-2">
                    <p className="text-2xl">✅</p>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">Location sent to SEOC Command Centre</p>
                  </div>

                  <div className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Your coordinates:</span>
                      <span className="font-mono font-semibold">{sosCoords?.lat.toFixed(4)}°N, {sosCoords?.lng.toFixed(4)}°E</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">ETA for rescue team:</span>
                      <span className="font-semibold text-emerald-600">~12 minutes</span>
                    </div>
                  </div>

                  {sosGpsNote && (
                    <p className="text-xs text-amber-600 text-center">⚠️ {sosGpsNote}</p>
                  )}
                </>
              )}

              {/* Close button */}
              <Button
                className="w-full"
                variant={sosSent ? 'default' : 'outline'}
                disabled={sosSending}
                onClick={() => { setSosOpen(false); setSosSending(false); setSosProgress(0); setSosSent(false); setSosCoords(null); setSosGpsNote('') }}
              >
                {sosSent ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ Emergency Numbers Dialog ══════ */}
      <Dialog open={showHelpForm} onOpenChange={(open) => setShowHelpForm(open)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Phone className="size-5 text-red-500" />
              Emergency Contacts
            </DialogTitle>
            <DialogDescription>
              Use these numbers to contact emergency services in Latur district. Available 24/7.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {EMERGENCY_CONTACTS.map((contact) => {
              const IconComp = contact.icon
              return (
                <a
                  key={contact.label}
                  href={`tel:${contact.phone}`}
                  className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center hover:bg-accent/50 transition-colors group"
                >
                  <span className="flex items-center justify-center size-10 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors">
                    <IconComp className="size-5" />
                  </span>
                  <p className="text-xs font-semibold leading-tight">{contact.label}</p>
                  <p className="text-base font-mono font-bold text-foreground tracking-tight">{contact.phone}</p>
                  <p className="text-[10px] text-muted-foreground">{contact.desc}</p>
                </a>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => {
                setShowHelpForm(false)
                handleSOS()
              }}
              className="w-full h-12 text-base bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white/50 animate-ping" />
                  <span className="relative inline-flex rounded-full size-3 bg-white" />
                </span>
                🔴 INSTANT SOS — Send Distress Signal
              </span>
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-1.5">
              This will share your GPS location with SEOC rescue teams immediately
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ Incident Detail Sheet (public, read-only) ══════ */}
      <IncidentDetailSheet
        incident={selectedIncident}
        open={detailOpen}
        onOpenChange={(open) => { if (!open) setSelectedIncident(null) }}
        mode="public"
      />
    </div>
  )
}
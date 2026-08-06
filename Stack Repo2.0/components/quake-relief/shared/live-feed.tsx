'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuakeWS, type QuakeEvent } from '@/hooks/use-quake-ws'
import { AlertTriangle, MapPin, CheckCircle, TrendingUp, Radio, Activity, X } from 'lucide-react'

const EVENT_CONFIG: Record<QuakeEvent['type'], { icon: typeof AlertTriangle; colorClass: string; borderClass: string; label: string }> = {
  ALERT: { icon: AlertTriangle, colorClass: 'text-red-500', borderClass: 'border-l-red-500', label: 'Alert' },
  INCIDENT_UPDATE: { icon: MapPin, colorClass: 'text-blue-500', borderClass: 'border-l-blue-500', label: 'Incident' },
  VERIFICATION_UPDATE: { icon: CheckCircle, colorClass: 'text-green-500', borderClass: 'border-l-green-500', label: 'Verified' },
  RESOURCE_UPDATE: { icon: TrendingUp, colorClass: 'text-amber-500', borderClass: 'border-l-amber-500', label: 'Resource' },
  FIELD_UPDATE: { icon: Radio, colorClass: 'text-sky-500', borderClass: 'border-l-sky-500', label: 'Field' },
  HEARTBEAT: { icon: Activity, colorClass: 'text-slate-400', borderClass: 'border-l-slate-400', label: 'System' },
}

// Simulated events for when WebSocket isn't connected (demo mode)
const SIMULATED_EVENTS: Array<Omit<QuakeEvent, 'timestamp'>> = [
  { type: 'FIELD_UPDATE', data: { message: 'NDRF Team Alpha: 2 survivors extracted from collapse zone near Ganj Golai market, Latur', source: 'NDRF', category: 'rescue' } },
  { type: 'VERIFICATION_UPDATE', data: { message: 'Social media report near Ausa road confirmed by SDRF ground team', source: 'SDRF', category: 'verification' } },
  { type: 'RESOURCE_UPDATE', data: { message: 'Vilasrao Deshmukh Government Medical College capacity updated: 145/200 beds occupied', source: 'Hospital', category: 'resource' } },
  { type: 'INCIDENT_UPDATE', data: { message: 'New landslide reported on Ausa road highway near Wadwal Nagnath, traffic blocked', source: 'ITBP', category: 'incident' } },
  { type: 'FIELD_UPDATE', data: { message: 'Medical Team 1 requesting additional stretchers and first aid supplies', source: 'Medical Team 1', category: 'field' } },
  { type: 'VERIFICATION_UPDATE', data: { message: 'Fire at Old City Latur residential colony now contained, no casualties reported', source: 'Fire Station', category: 'verification' } },
  { type: 'RESOURCE_UPDATE', data: { message: 'Relief camp at Latur Sports Ground: 320/500 capacity, food supplies sufficient for 48h', source: 'Municipality', category: 'resource' } },
  { type: 'ALERT', data: { message: 'Aftershock M3.1 detected near Killari zone south of Latur, no tsunami threat', source: 'IMD', category: 'seismic' } },
  { type: 'INCIDENT_UPDATE', data: { message: 'Road structural crack widening near Ganj Golai market area, heavy vehicles diverted', source: 'District Police', category: 'incident' } },
  { type: 'FIELD_UPDATE', data: { message: 'Army Corps engineering team assessing bridge structural integrity on Latur-Ausa highway', source: 'Army Corps', category: 'field' } },
  { type: 'VERIFICATION_UPDATE', data: { message: 'Temple collapse victim count revised: 3 rescued, search continues for 2 more', source: 'NDRF', category: 'verification' } },
  { type: 'RESOURCE_UPDATE', data: { message: 'Water distribution point at Ganj Golai operational: 200L/hour capacity', source: 'PHED', category: 'resource' } },
  { type: 'INCIDENT_UPDATE', data: { message: 'Pipeline burst at Main Market Latur: water supply restored to 70% of affected area', source: 'Latur Municipal Corp', category: 'incident' } },
  { type: 'FIELD_UPDATE', data: { message: 'SDRF Battalion 3 clearing debris on pedestrian path near Ausa road', source: 'SDRF', category: 'field' } },
  { type: 'ALERT', data: { message: 'IMD issues fresh rainfall warning for Latur district, landslide risk elevated', source: 'IMD', category: 'weather' } },
  { type: 'VERIFICATION_UPDATE', data: { message: 'Elderly patient at Killari successfully evacuated to Yashwantrao Chavan Rural Hospital', source: 'Medical Team 1', category: 'verification' } },
  { type: 'RESOURCE_UPDATE', data: { message: 'IAF helicopter sortie delivering relief supplies to Killari zone, ETA 15 min', source: 'IAF', category: 'resource' } },
  { type: 'FIELD_UPDATE', data: { message: 'NDRF Team Alpha moving to second collapse site at Renapur village', source: 'NDRF', category: 'field' } },
]

const MAX_EVENTS = 50

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  if (diffMs < 0) return 'now'
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 5) return 'now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr}h ago`
}

export default function LiveFeed() {
  const { events: wsEvents, isConnected } = useQuakeWS()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [clearBefore, setClearBefore] = useState<string | null>(null)
  const prevFeedLenRef = useRef(0)
  const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const simIndexRef = useRef(0)
  const [simulatedEvents, setSimulatedEvents] = useState<QuakeEvent[]>([])

  // Client-side simulation when WebSocket is disconnected (demo/fallback mode)
  useEffect(() => {
    if (isConnected) return // Don't simulate if WS is connected

    const addSimEvent = () => {
      const evt = SIMULATED_EVENTS[simIndexRef.current % SIMULATED_EVENTS.length]
      simIndexRef.current += 1
      const quakeEvent: QuakeEvent = {
        ...evt,
        timestamp: new Date().toISOString(),
      }
      setSimulatedEvents(prev => [...prev.slice(-MAX_EVENTS + 1), quakeEvent])
    }

    // Add first event after 3 seconds, then every 8-12 seconds
    const initialTimer = setTimeout(() => {
      addSimEvent()
      const interval = setInterval(() => {
        addSimEvent()
      }, 8000 + Math.random() * 4000)
      return () => clearInterval(interval)
    }, 3000)

    return () => {
      clearTimeout(initialTimer)
    }
  }, [isConnected])

  // Merge WS events and simulated events
  const allEvents = useMemo(() => {
    if (isConnected) return wsEvents
    return [...wsEvents, ...simulatedEvents]
  }, [wsEvents, simulatedEvents, isConnected])

  // Derive feed events
  const feedEvents = useMemo(() => {
    const filtered = allEvents
      .filter(e => e.type !== 'HEARTBEAT')
      .slice(-MAX_EVENTS)

    if (clearBefore) {
      const clearTime = new Date(clearBefore).getTime()
      return filtered.filter(e => new Date(e.timestamp).getTime() > clearTime)
    }
    return filtered
  }, [allEvents, clearBefore])

  // Track unread count when panel is closed
  useEffect(() => {
    if (!isOpen) {
      const newCount = feedEvents.length - prevFeedLenRef.current
      if (newCount > 0) {
        setUnreadCount(prev => prev + newCount)
      }
    }
    prevFeedLenRef.current = feedEvents.length
  }, [feedEvents.length, isOpen])

  // Auto-collapse after 30 seconds of no new events
  useEffect(() => {
    if (isOpen && feedEvents.length > 0) {
      if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current)
      autoCollapseTimerRef.current = setTimeout(() => {
        setIsOpen(false)
      }, 30000)
    }
    return () => {
      if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current)
    }
  }, [isOpen, feedEvents.length])

  // Mark as read when opening
  const handleToggle = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        setUnreadCount(0)
      }
      return !prev
    })
  }, [])

  const handleClear = useCallback(() => {
    setClearBefore(new Date().toISOString())
    setUnreadCount(0)
    prevFeedLenRef.current = 0
  }, [])

  // Scroll to top when new events arrive
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [feedEvents.length, isOpen])

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded panel */}
      {isOpen && (
        <div className="w-80 max-h-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col feed-panel-enter">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-semibold text-foreground">Live Activity Feed</span>
              {!isConnected && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  DEMO
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {feedEvents.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleToggle}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                aria-label="Close feed"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Event list */}
          <div ref={listRef} className="flex-1 overflow-y-auto max-h-64 custom-scrollbar">
            {feedEvents.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                Waiting for events...
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {[...feedEvents].reverse().map((event, idx) => {
                  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.FIELD_UPDATE
                  const Icon = config.icon
                  const isNewest = idx === 0
                  return (
                    <div
                      key={`${event.type}-${event.timestamp}-${idx}`}
                      className={`border-l-2 ${config.borderClass} px-3 py-2.5 hover:bg-muted/40 transition-colors ${isNewest ? 'feed-item-enter' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${config.colorClass}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                            {event.data?.message || 'Event received'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-medium ${config.colorClass}`}>
                              {config.label}
                            </span>
                            {event.data?.source && (
                              <span className="text-[10px] text-muted-foreground">
                                {event.data.source}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {formatRelativeTime(event.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={`feed-pulse flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${isOpen ? 'ring-2 ring-primary/30' : ''}`}
        aria-label={isOpen ? 'Close live feed' : 'Open live feed'}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-[10px] font-bold tracking-wider text-foreground">LIVE</span>
        {unreadCount > 0 && !isOpen && (
          <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
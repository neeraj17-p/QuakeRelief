'use client'

import React, { useEffect, useRef, lazy, Suspense } from 'react'
import { useAppStore } from '@/store/app-store'
import { useQuakeWS } from '@/hooks/use-quake-ws'
import LockedNavbar from '@/components/quake-relief/shared/locked-navbar'
import AuthGate from '@/components/quake-relief/shared/auth-gate'
import DisasterFooter from '@/components/quake-relief/shared/footer'
import LiveFeed from '@/components/quake-relief/shared/live-feed'

// ── Lazy-loaded portals (same chunk, no separate file, no ChunkLoadError) ──
// React.lazy() defers module evaluation until render, avoiding SSR issues
// with Leaflet-heavy components without creating separate chunk files that
// cause ChunkLoadError when the server restarts.
const PublicPortal = lazy(() => import('@/components/quake-relief/public/public-portal'))
const RescuePortal = lazy(() => import('@/components/quake-relief/rescue/rescue-portal'))
const AdminPortal = lazy(() => import('@/components/quake-relief/admin/admin-portal'))

function PortalSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-3">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse mx-auto" />
        <div className="h-4 w-32 bg-muted rounded-lg animate-pulse mx-auto" />
        <p className="text-sm text-muted-foreground">Loading portal...</p>
      </div>
    </div>
  )
}

export default function Home() {
  const {
    currentRole,
    isAuthenticated,
    setActiveEventId,
    setRealtimeConnected,
    addLiveAlert,
  } = useAppStore()

  // Only connect WebSocket AFTER authentication
  const { events: quakeEvents, isConnected } = useQuakeWS(isAuthenticated)
  const processedEventsRef = useRef<Set<string>>(new Set())

  // Sync WebSocket connection status to store
  useEffect(() => {
    setRealtimeConnected(isConnected)
  }, [isConnected, setRealtimeConnected])

  // Initialize event on mount
  useEffect(() => {
    setActiveEventId('eq-maharashtra-2025-001')

    // Initial alerts fetch (works for unauthenticated too — public alerts)
    fetch('/api/alerts?targetRole=ALL')
      .then((r) => r.json())
      .then((alerts: any[]) => {
        const store = useAppStore.getState()
        alerts.forEach((a: any) => store.addLiveAlert(a))
      })
      .catch(() => { /* degraded mode */ })
  }, [setActiveEventId])

  // Process WebSocket events (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated || !quakeEvents.length) return

    for (const event of quakeEvents) {
      const key = `${event.type}-${event.timestamp}`
      if (processedEventsRef.current.has(key)) continue
      processedEventsRef.current.add(key)

      switch (event.type) {
        case 'ALERT':
          addLiveAlert(event.data)
          break
        case 'INCIDENT_UPDATE':
        case 'VERIFICATION_UPDATE':
        case 'RESOURCE_UPDATE':
        case 'FIELD_UPDATE':
          break
      }
    }
  }, [quakeEvents, addLiveAlert, isAuthenticated])

  // Fetch alerts for current role periodically
  const fetchedAlertIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated) return

    const roleMap: Record<string, string> = {
      public: 'PUBLIC',
      rescue: 'RESCUE',
      admin: 'ADMIN',
    }
    const targetRole = roleMap[currentRole] || 'ALL'

    const fetchAlerts = () => {
      fetch(`/api/alerts?targetRole=${targetRole}`)
        .then((r) => r.json())
        .then((alerts: any[]) => {
          const store = useAppStore.getState()
          const existingIds = new Set(store.liveAlerts.map((a) => a.id))
          alerts.forEach((a: any) => {
            if (!existingIds.has(a.id)) {
              store.addLiveAlert(a)
              fetchedAlertIdsRef.current.add(a.id)
            }
          })
        })
        .catch(() => { /* degraded mode */ })
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [currentRole, isAuthenticated])

  // Not authenticated — show auth gate
  if (!isAuthenticated) {
    return <AuthGate />
  }

  // Authenticated — show portal with locked navbar
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LockedNavbar />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<PortalSkeleton />}>
          {currentRole === 'public' && <PublicPortal />}
          {currentRole === 'rescue' && <RescuePortal />}
          {currentRole === 'admin' && <AdminPortal />}
        </Suspense>
      </main>
      <LiveFeed />
      <DisasterFooter />
    </div>
  )
}

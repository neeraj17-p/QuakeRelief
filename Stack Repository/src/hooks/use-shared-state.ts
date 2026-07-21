'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types (mirror the server-side types, without importing from next/server) ──

export interface TeamState {
  id: string
  name: string
  unitType: string
  status: string
  latitude: number
  longitude: number
  baseLatitude: number
  baseLongitude: number
  members: number
  assignedIncidentId: string | null
  updatedAt: number
}

export interface ObstacleRecord {
  id: string
  type: string
  latitude: number
  longitude: number
  placedBy: string
  createdAt: number
  geojson: { type: 'Point'; coordinates: [number, number] }
}

export interface BroadcastRecord {
  id: string
  header: string
  message: string
  severity: 'advisory' | 'alert' | 'evacuate'
  channel: 'public' | 'tactical' | 'interagency'
  sentBy: string
  createdAt: number
}

export interface SharedState {
  teams: TeamState[]
  obstacles: ObstacleRecord[]
  broadcasts: BroadcastRecord[]
  lastUpdated: number
}

// ── Hook return type ─────────────────────────────────────────────────────────

interface UseSharedStateReturn {
  teams: TeamState[]
  obstacles: ObstacleRecord[]
  broadcasts: BroadcastRecord[]
  lastUpdated: number
  isLoading: boolean
  error: string | null
  updateTeam: (teamId: string, updates: Partial<TeamState>) => Promise<void>
  addObstacle: (lat: number, lng: number, type: string, placedBy: string) => Promise<void>
  clearObstacles: () => Promise<void>
  dispatchTeam: (teamId: string, incidentId: string) => Promise<{ success: boolean; team?: TeamState; incident?: any }>
  sendBroadcast: (params: {
    header: string
    message: string
    severity: 'advisory' | 'alert' | 'evacuate'
    channel: 'public' | 'tactical' | 'interagency'
    sentBy?: string
  }) => Promise<void>
  refetch: () => Promise<void>
}

// ── Hook ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 800 // Fast polling for near-real-time cross-portal sync

export function useSharedState(): UseSharedStateReturn {
  const [state, setState] = useState<SharedState>({
    teams: [],
    obstacles: [],
    broadcasts: [],
    lastUpdated: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch shared state ───────────────────────────────────────────────

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data: SharedState = await res.json()
      setState(data)
      setError(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch shared state'
      // Only set error on first load failure (don't spam during polling)
      if (isLoading) setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  // ── Polling lifecycle ────────────────────────────────────────────────

  useEffect(() => {
    fetchState()
    intervalRef.current = setInterval(fetchState, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [fetchState])

  // ── Helper: POST to state API ────────────────────────────────────────

  const postAction = useCallback(async (actionBody: Record<string, unknown>) => {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionBody),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as any).error ?? `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  // ── updateTeam ───────────────────────────────────────────────────────

  const updateTeam = useCallback(
    async (teamId: string, updates: Partial<TeamState>) => {
      try {
        await postAction({
          action: 'updateTeam',
          payload: { id: teamId, ...updates },
        })
        await fetchState()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update team'
        setError(msg)
        throw err
      }
    },
    [postAction, fetchState],
  )

  // ── addObstacle ──────────────────────────────────────────────────────

  const addObstacle = useCallback(
    async (lat: number, lng: number, type: string, placedBy: string) => {
      try {
        await postAction({
          action: 'addObstacle',
          payload: { latitude: lat, longitude: lng, type, placedBy },
        })
        await fetchState()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add obstacle'
        setError(msg)
        throw err
      }
    },
    [postAction, fetchState],
  )

  // ── clearObstacles ───────────────────────────────────────────────────

  const clearObstacles = useCallback(async () => {
    try {
      await postAction({ action: 'clearObstacles' })
      await fetchState()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear obstacles'
      setError(msg)
      throw err
    }
  }, [postAction, fetchState])

  // ── dispatchTeam: STANDBY → EN_ROUTE ────────────────────────────────

  const dispatchTeam = useCallback(
    async (teamId: string, incidentId: string) => {
      try {
        const result = await postAction({
          action: 'dispatchTeam',
          payload: { teamId, incidentId },
        })
        await fetchState()
        return result
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to dispatch team'
        setError(msg)
        throw err
      }
    },
    [postAction, fetchState],
  )

  // ── sendBroadcast: multi-channel dispatch ────────────────────────────

  const sendBroadcast = useCallback(
    async (params: {
      header: string
      message: string
      severity: 'advisory' | 'alert' | 'evacuate'
      channel: 'public' | 'tactical' | 'interagency'
      sentBy?: string
    }) => {
      try {
        await postAction({
          action: 'sendBroadcast',
          payload: {
            header: params.header,
            message: params.message,
            severity: params.severity,
            channel: params.channel,
            sentBy: params.sentBy || 'SEOC-Admin',
          },
        })
        await fetchState()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send broadcast'
        setError(msg)
        throw err
      }
    },
    [postAction, fetchState],
  )

  return {
    teams: state.teams,
    obstacles: state.obstacles,
    broadcasts: state.broadcasts,
    lastUpdated: state.lastUpdated,
    isLoading,
    error,
    updateTeam,
    addObstacle,
    clearObstacles,
    dispatchTeam,
    sendBroadcast,
    refetch: fetchState,
  }
}
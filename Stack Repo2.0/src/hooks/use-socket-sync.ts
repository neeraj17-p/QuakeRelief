'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

/**
 * Supported real-time sync event types for the Quake Relief portal.
 */
export type SyncEventType =
  | 'dispatch:update'
  | 'squad:location'
  | 'verification:update'
  | 'incident:new'
  | 'state:sync'

/**
 * A received sync event with injected server timestamp.
 */
export interface SyncEvent<T = Record<string, unknown>> {
  _serverTimestamp: string
  [key: string]: unknown
  /** Convenience typed accessor — use via generic param: SyncEvent<DispatchPayload> */
  data: T
}

// ─── Payload types per channel ────────────────────────────────────────────

export interface DispatchPayload {
  teamId: string
  incidentId: string
  status: string
  lat: number
  lng: number
}

export interface SquadLocationPayload {
  teamId: string
  lat: number
  lng: number
  heading: number
  speed: number
}

export interface VerificationPayload {
  incidentId: string
  status: string
  reviewedBy: string
}

export interface IncidentPayload {
  id?: string
  type?: string
  description?: string
  lat?: number
  lng?: number
  priority?: string
  [key: string]: unknown
}

// ─── Hook return type ──────────────────────────────────────────────────────

export interface UseSocketSyncReturn {
  /** Whether the socket is currently connected */
  isConnected: boolean
  /** The most recent event received (any channel) */
  lastEvent: Record<string, unknown> | null
  /** Buffer of the most recent events (capped at 200) */
  events: Record<string, unknown>[]
  /** Manually emit an event to the server */
  emit: (event: SyncEventType, payload: Record<string, unknown>) => void
  /** Request a full state sync from peers in the room */
  requestStateSync: () => void
  /** Subscribe to a specific event type with a callback; returns unsubscribe fn */
  on: (event: SyncEventType | string, callback: (payload: Record<string, unknown>) => void) => () => void
  /** The socket instance (for advanced usage) */
  socket: Socket | null
}

/**
 * useSocketSync — React hook for real-time portal sync via Socket.IO.
 *
 * @param eventId  The event room to join (e.g., "eq-maharashtra-2025-001").
 *                 Pass `undefined` to connect without joining a room.
 *
 * @example
 * ```tsx
 * const { isConnected, lastEvent, events, emit } = useSocketSync('eq-maharashtra-2025-001')
 *
 * // React to dispatch updates
 * on('dispatch:update', (payload) => {
 *   console.log('Team dispatched:', payload.teamId)
 * })
 * ```
 */
export function useSocketSync(eventId?: string): UseSocketSyncReturn {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<Record<string, unknown> | null>(null)
  const [events, setEvents] = useState<Record<string, unknown>[]>([])
  const subscribersRef = useRef<Map<string, Set<(payload: Record<string, unknown>) => void>>>(new Map())

  // ─── Connect to Socket.IO ──────────────────────────────────────────────
  useEffect(() => {
    const socket: Socket = io('/?XTransformPort=3005', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })

    socketRef.current = socket

    // ── Connection lifecycle ──────────────────────────────────────────────
    socket.on('connect', () => {
      setIsConnected(true)

      // Auto-join the event room
      if (eventId) {
        socket.emit('join:event', eventId)
      }
    })

    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log(`[useSocketSync] Disconnected: ${reason}`)
    })

    socket.on('connect_error', (error) => {
      console.error('[useSocketSync] Connection error:', error.message)
    })

    socket.on('sync:connected', (data: Record<string, unknown>) => {
      console.log('[useSocketSync] Server welcome:', data)
    })

    socket.on('join:confirmed', (data: { eventId: string; members: number }) => {
      console.log(`[useSocketSync] Joined room: ${data.eventId} (${data.members} members)`)
    })

    // ── Generic event handler for all sync channels ──────────────────────
    const syncChannels: SyncEventType[] = [
      'dispatch:update',
      'squad:location',
      'verification:update',
      'incident:new',
      'state:sync',
    ]

    for (const channel of syncChannels) {
      socket.on(channel, (payload: Record<string, unknown>) => {
        setLastEvent(payload)
        setEvents((prev) => {
          const next = [...prev, payload]
          // Cap buffer at 200 events to avoid memory leaks
          return next.length > 200 ? next.slice(-200) : next
        })

        // Notify per-channel subscribers
        const subs = subscribersRef.current.get(channel)
        if (subs) {
          subs.forEach((cb) => cb(payload))
        }
      })
    }

    // ── State sync response handler ──────────────────────────────────────
    socket.on('state:sync:request', (payload: Record<string, unknown>) => {
      const subs = subscribersRef.current.get('state:sync:request')
      if (subs) {
        subs.forEach((cb) => cb(payload))
      }
    })

    socket.on('state:sync:response', (payload: Record<string, unknown>) => {
      const subs = subscribersRef.current.get('state:sync:response')
      if (subs) {
        subs.forEach((cb) => cb(payload))
      }
    })

    socket.on('state:sync:ack', (payload: Record<string, unknown>) => {
      const subs = subscribersRef.current.get('state:sync:ack')
      if (subs) {
        subs.forEach((cb) => cb(payload))
      }
    })

    socket.on('room:update', (payload: Record<string, unknown>) => {
      const subs = subscribersRef.current.get('room:update')
      if (subs) {
        subs.forEach((cb) => cb(payload))
      }
    })

    // ── Rejoin room on reconnect ─────────────────────────────────────────
    socket.io.on('reconnect', () => {
      setIsConnected(true)
      if (eventId) {
        socket.emit('join:event', eventId)
      }
    })

    return () => {
      // Leave room on cleanup
      if (eventId) {
        socket.emit('leave:event', eventId)
      }
      socket.disconnect()
      socketRef.current = null
      subscribersRef.current.clear()
    }
  }, [eventId])

  // ─── Emit helper ──────────────────────────────────────────────────────
  const emit = useCallback(
    (event: SyncEventType, payload: Record<string, unknown>) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit(event, { ...payload, eventId })
      }
    },
    [isConnected, eventId]
  )

  // ─── State sync request ───────────────────────────────────────────────
  const requestStateSync = useCallback(() => {
    if (socketRef.current && isConnected && eventId) {
      socketRef.current.emit('state:sync', {
        eventId,
        requesterId: socketRef.current.id,
      })
    }
  }, [isConnected, eventId])

  // ─── Subscribe helper ──────────────────────────────────────────────────
  const on = useCallback(
    (event: string, callback: (payload: Record<string, unknown>) => void) => {
      if (!subscribersRef.current.has(event)) {
        subscribersRef.current.set(event, new Set())
      }
      subscribersRef.current.get(event)!.add(callback)

      // Return unsubscribe function
      return () => {
        const subs = subscribersRef.current.get(event)
        if (subs) {
          subs.delete(callback)
          if (subs.size === 0) {
            subscribersRef.current.delete(event)
          }
        }
      }
    },
    []
  )

  return {
    isConnected,
    lastEvent,
    events,
    emit,
    requestStateSync,
    on,
    get socket() {
      return socketRef.current
    },
  } satisfies UseSocketSyncReturn
}

export default useSocketSync

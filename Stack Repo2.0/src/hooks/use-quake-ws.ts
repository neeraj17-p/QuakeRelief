'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export type QuakeEvent = {
  type: 'ALERT' | 'INCIDENT_UPDATE' | 'VERIFICATION_UPDATE' | 'RESOURCE_UPDATE' | 'FIELD_UPDATE' | 'HEARTBEAT'
  data: any
  timestamp: string
}

type EventCallback = (event: QuakeEvent) => void

export function useQuakeWS(enabled: boolean = true) {
  const socketRef = useRef<Socket | null>(null)
  const [events, setEvents] = useState<QuakeEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<QuakeEvent | null>(null)
  const subscribersRef = useRef<Map<string, Set<EventCallback>>>(new Map())
  const mountedRef = useRef(true)

  // Subscribe function for filtering by event type
  const subscribe = useCallback((eventType: QuakeEvent['type'], callback?: EventCallback) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set())
    }
    if (callback) {
      subscribersRef.current.get(eventType)!.add(callback)
    }

    // Return an unsubscribe function
    return () => {
      if (callback && subscribersRef.current.has(eventType)) {
        subscribersRef.current.get(eventType)!.delete(callback)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    if (!enabled) {
      // Clean up existing socket if disabled
      try {
        if (socketRef.current) {
          socketRef.current.removeAllListeners()
          socketRef.current.disconnect()
          socketRef.current = null
        }
      } catch {
        // Ignore cleanup errors
      }
      // isConnected is already false from initial state or previous cleanup
      return
    }

    let socket: Socket | null = null

    try {
      socket = io('/?XTransformPort=3004', {
        transports: ['websocket', 'polling'],
        // Conservative reconnect: only 2 attempts with delay, then stay disconnected
        // This prevents aggressive reconnect noise in sandbox/preview environments
        reconnection: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 3000,
        timeout: 5000,
      })

      socketRef.current = socket

      socket.on('connect', () => {
        if (mountedRef.current) setIsConnected(true)
      })

      socket.on('disconnect', (reason) => {
        if (mountedRef.current) setIsConnected(false)
        // Only log on unexpected disconnects (not 'io server disconnect' which is intentional)
        if (reason !== 'io server disconnect') {
          // Silently degrade — no console.error, just warn at debug level
        }
      })

      socket.on('connect_error', () => {
        // Completely silent — no console output at all
        // Socket.io will retry per reconnection config, then stop
        if (mountedRef.current) setIsConnected(false)
      })

      socket.on('quake-event', (event: QuakeEvent) => {
        if (!mountedRef.current) return
        setEvents((prev) => [...prev, event])
        setLastEvent(event)

        // Notify subscribers
        try {
          const subs = subscribersRef.current.get(event.type)
          if (subs) {
            subs.forEach((cb) => {
              try { cb(event) } catch { /* subscriber error — don't crash the hook */ }
            })
          }
        } catch {
          // Subscriber notification error — non-fatal
        }
      })
    } catch (err) {
      // Socket.io constructor or binding failed — degrade silently
      // isConnected stays false from initial state; no setState needed here
    }

    return () => {
      mountedRef.current = false
      try {
        if (socket) {
          socket.removeAllListeners()
          socket.disconnect()
        }
      } catch {
        // Ignore cleanup errors
      }
      if (socketRef.current === socket) {
        socketRef.current = null
      }
      setIsConnected(false)
    }
  }, [enabled])

  return { events, isConnected, lastEvent, subscribe }
}

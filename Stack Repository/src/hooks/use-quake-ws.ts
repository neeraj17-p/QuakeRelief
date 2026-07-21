'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export type QuakeEvent = {
  type: 'ALERT' | 'INCIDENT_UPDATE' | 'VERIFICATION_UPDATE' | 'RESOURCE_UPDATE' | 'FIELD_UPDATE' | 'HEARTBEAT'
  data: any
  timestamp: string
}

type EventCallback = (event: QuakeEvent) => void

export function useQuakeWS() {
  const socketRef = useRef<Socket | null>(null)
  const [events, setEvents] = useState<QuakeEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<QuakeEvent | null>(null)
  const subscribersRef = useRef<Map<string, Set<EventCallback>>>(new Map())

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
    const socket: Socket = io('/?XTransformPort=3004', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('quake-event', (event: QuakeEvent) => {
      setEvents((prev) => [...prev, event])
      setLastEvent(event)

      // Notify subscribers
      const subs = subscribersRef.current.get(event.type)
      if (subs) {
        subs.forEach((cb) => cb(event))
      }
    })

    // Auto-reconnect is handled by socket.io-client natively via reconnection options

    return () => {
      socket.disconnect()
      setIsConnected(false)
      subscribersRef.current.clear()
    }
  }, [])

  return { events, isConnected, lastEvent, subscribe }
}
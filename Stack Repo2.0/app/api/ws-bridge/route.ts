import { NextRequest, NextResponse } from 'next/server'

/**
 * REST Bridge to Socket.IO Sync Service
 *
 * Accepts POST with { event, payload } (and optional { room }) and forwards
 * the event to the Socket.IO ws-sync-service via server-to-server HTTP.
 *
 * If the sync service is not running, returns a graceful "degraded" response
 * instead of a 500/502 error, so the rest of the app continues to work.
 */

const SYNC_SERVICE_URL = 'http://localhost:3005/emit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { event, payload, room } = body as {
      event?: string
      payload?: Record<string, unknown>
      room?: string
    }

    // Validate required fields
    if (!event || typeof event !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid "event" field' },
        { status: 400 }
      )
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid "payload" field' },
        { status: 400 }
      )
    }

    // Try to forward to sync service — gracefully degrade if offline
    const bridgeBody: Record<string, unknown> = { event, payload }
    if (room) {
      bridgeBody.room = room
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(SYNC_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bridgeBody),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return NextResponse.json(
          { ok: false, degraded: true, error: `Sync service error: ${(errorData as Record<string, unknown>).error}` },
          { status: response.status }
        )
      }

      const result = (await response.json()) as { ok: boolean; event: string; room: string; clients: number }
      return NextResponse.json(result)
    } catch {
      // Sync service is offline — return degraded but not an error
      return NextResponse.json({
        ok: true,
        degraded: true,
        event,
        clients: 0,
        note: 'WebSocket sync service is offline; real-time updates unavailable',
      })
    }
  } catch (error) {
    console.error('[WS Bridge] Error processing request:', error)
    return NextResponse.json(
      { ok: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}

export async function GET() {
  // Quick health check — pings the sync service
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const response = await fetch('http://localhost:3005/health', {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const data = (await response.json()) as Record<string, unknown>
    return NextResponse.json({ ok: true, syncService: data })
  } catch {
    return NextResponse.json({
      ok: true,
      degraded: true,
      syncService: { status: 'offline' },
    })
  }
}

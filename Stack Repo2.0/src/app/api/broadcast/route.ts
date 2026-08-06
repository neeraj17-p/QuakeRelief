import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/broadcast
 * Creates a new alert/broadcast.
 * Falls back to returning a synthetic record if database is unavailable.
 */
export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const body = await req.json()
    const { eventId, title, message, severity, targetRole } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Missing title or message' }, { status: 400 })
    }

    const alert = await db.alert.create({
      data: {
        eventId: eventId || 'eq-maharashtra-2025-001',
        title,
        message,
        severity: severity || 'INFO',
        targetRole: targetRole || 'ALL',
      },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch {
    const body = await req.json().catch(() => ({}))
    const { title, message, severity, targetRole } = body
    if (!title || !message) {
      return NextResponse.json({ error: 'Missing title or message' }, { status: 400 })
    }
    return NextResponse.json({
      id: `syn-bcast-${Date.now()}`,
      eventId: body.eventId || 'eq-maharashtra-2025-001',
      title,
      message,
      severity: severity || 'INFO',
      targetRole: targetRole || 'ALL',
      isActive: true,
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  }
}

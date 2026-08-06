import { NextRequest, NextResponse } from 'next/server'
import { MOCK_SAFETY_CHECKINS } from '@/lib/mock-data'

/**
 * POST /api/safety-check
 * Creates a safety check-in.
 * Falls back to synthetic response if database unavailable.
 */
export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const body = await req.json()
    const { eventId, personName, phone, status, latitude, longitude, note } = body

    if (!personName || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const checkIn = await db.safetyCheckIn.create({
      data: {
        eventId: eventId || 'eq-maharashtra-2025-001',
        personName,
        phone: phone || null,
        status,
        latitude: latitude || null,
        longitude: longitude || null,
        note: note || null,
      },
    })

    return NextResponse.json(checkIn, { status: 201 })
  } catch {
    const body = await req.json().catch(() => ({}))
    if (!body.personName || !body.status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    return NextResponse.json({
      id: `syn-sc-${Date.now()}`,
      eventId: body.eventId || 'eq-maharashtra-2025-001',
      personName: body.personName,
      phone: body.phone || null,
      status: body.status,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      note: body.note || null,
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  }
}

/**
 * GET /api/safety-check
 * Returns recent safety check-ins.
 * Falls back to mock data if database unavailable.
 */
export async function GET() {
  try {
    const { db } = await import('@/lib/db')
    const checkIns = await db.safetyCheckIn.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(checkIns)
  } catch {
    return NextResponse.json(MOCK_SAFETY_CHECKINS)
  }
}

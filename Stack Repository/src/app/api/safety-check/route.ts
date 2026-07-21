import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
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
      }
    })

    return NextResponse.json(checkIn, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const checkIns = await db.safetyCheckIn.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return NextResponse.json(checkIns)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
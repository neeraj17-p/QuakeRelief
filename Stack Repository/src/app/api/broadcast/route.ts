import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
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
      }
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
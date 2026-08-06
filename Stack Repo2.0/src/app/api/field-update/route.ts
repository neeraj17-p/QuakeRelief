import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/field-update
 * Creates a field update and updates incident status.
 * Falls back to synthetic response if database unavailable.
 */
export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const body = await req.json()
    const { incidentId, status, note, updatedBy } = body

    if (!incidentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const fieldUpdate = await db.fieldUpdate.create({
      data: {
        incidentId,
        status,
        note: note || null,
        updatedBy: updatedBy || 'FIELD_TEAM',
      },
    })

    await db.incident.update({
      where: { id: incidentId },
      data: { status },
    })

    return NextResponse.json(fieldUpdate, { status: 201 })
  } catch {
    const body = await req.json().catch(() => ({}))
    if (!body.incidentId || !body.status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    return NextResponse.json({
      id: `syn-fu-${Date.now()}`,
      incidentId: body.incidentId,
      status: body.status,
      note: body.note || null,
      updatedBy: body.updatedBy || 'FIELD_TEAM',
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { incidentId, status, note, updatedBy } = body

    if (!incidentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create field update record
    const fieldUpdate = await db.fieldUpdate.create({
      data: {
        incidentId,
        status,
        note: note || null,
        updatedBy: updatedBy || 'FIELD_TEAM',
      }
    })

    // Update incident status
    await db.incident.update({
      where: { id: incidentId },
      data: { status }
    })

    return NextResponse.json(fieldUpdate, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get('eventId')
    const status = req.nextUrl.searchParams.get('status')
    const sourceTier = req.nextUrl.searchParams.get('sourceTier')

    const where: any = {}
    if (eventId) where.eventId = eventId
    if (status) where.status = status
    if (sourceTier) where.sourceTier = sourceTier

    const entries = await db.verificationEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(entries)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, adminNote, reviewedBy } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const entry = await db.verificationEntry.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || undefined,
        reviewedBy: reviewedBy || 'ADMIN',
        reviewedAt: new Date(),
      }
    })

    // If confirmed/verified and linked to incident, update incident too
    if (entry.incidentId && (status === 'VERIFIED' || status === 'FALSE' || status === 'DISMISSED')) {
      await db.incident.update({
        where: { id: entry.incidentId },
        data: {
          status: status === 'VERIFIED' ? 'VERIFIED' : status === 'FALSE' ? 'FALSE' : 'PENDING',
        }
      })
    }

    return NextResponse.json(entry)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
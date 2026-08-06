import { NextRequest, NextResponse } from 'next/server'
import { MOCK_VERIFICATIONS } from '@/lib/mock-data'

/**
 * GET /api/verification?eventId=...&status=...&sourceTier=...
 * Falls back to mock data if database unavailable.
 */
export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const eventId = req.nextUrl.searchParams.get('eventId')
    const status = req.nextUrl.searchParams.get('status')
    const sourceTier = req.nextUrl.searchParams.get('sourceTier')

    const where: any = {}
    if (eventId) where.eventId = eventId
    if (status) where.status = status
    if (sourceTier) where.sourceTier = sourceTier

    const entries = await db.verificationEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(entries)
  } catch {
    const eventId = req.nextUrl.searchParams.get('eventId')
    const status = req.nextUrl.searchParams.get('status')
    const sourceTier = req.nextUrl.searchParams.get('sourceTier')

    let filtered = [...MOCK_VERIFICATIONS]
    if (eventId) filtered = filtered.filter((v) => v.eventId === eventId)
    if (status) filtered = filtered.filter((v) => v.status === status)
    if (sourceTier) filtered = filtered.filter((v) => v.sourceTier === sourceTier)

    return NextResponse.json(filtered)
  }
}

/**
 * PATCH /api/verification
 * Updates a verification entry status.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
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
      },
    })

    if (entry.incidentId && (status === 'VERIFIED' || status === 'FALSE' || status === 'DISMISSED')) {
      await db.incident.update({
        where: { id: entry.incidentId },
        data: { status: status === 'VERIFIED' ? 'VERIFIED' : status === 'FALSE' ? 'FALSE' : 'PENDING' },
      })
    }

    return NextResponse.json(entry)
  } catch {
    const body = await req.json().catch(() => ({}))
    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }
    return NextResponse.json({
      id: body.id,
      status: body.status,
      adminNote: body.adminNote || null,
      reviewedBy: body.reviewedBy || 'ADMIN',
      reviewedAt: new Date().toISOString(),
    })
  }
}
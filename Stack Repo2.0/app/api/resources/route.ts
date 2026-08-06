import { NextRequest, NextResponse } from 'next/server'
import { MOCK_RESOURCES } from '@/lib/mock-data'

/**
 * GET /api/resources
 * Returns all resource locations.
 * Falls back to mock data if database unavailable.
 */
export async function GET() {
  try {
    const { db } = await import('@/lib/db')
    const resources = await db.resource.findMany({
      orderBy: { type: 'asc' },
    })
    return NextResponse.json(resources)
  } catch {
    return NextResponse.json(MOCK_RESOURCES)
  }
}

/**
 * PATCH /api/resources
 * Updates resource status/load.
 * Falls back to synthetic response if database unavailable.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const body = await req.json()
    const { id, currentLoad, status } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const resource = await db.resource.update({
      where: { id },
      data: {
        ...(currentLoad !== undefined ? { currentLoad } : {}),
        ...(status ? { status } : {}),
      },
    })
    return NextResponse.json(resource)
  } catch {
    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    return NextResponse.json({ id: body.id, updated: true })
  }
}
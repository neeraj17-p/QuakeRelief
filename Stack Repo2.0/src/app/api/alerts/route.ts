import { NextRequest, NextResponse } from 'next/server'
import { MOCK_ALERTS } from '@/lib/mock-data'

/**
 * GET /api/alerts?targetRole=ALL|PUBLIC|RESCUE|ADMIN
 * Returns active alerts filtered by target role.
 * Falls back to mock data if the database is unavailable.
 */
export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const targetRole = req.nextUrl.searchParams.get('targetRole')
    const where: any = { isActive: true }
    if (targetRole && targetRole !== 'ALL') {
      where.targetRole = { in: [targetRole, 'ALL'] }
    }
    const alerts = await db.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(alerts)
  } catch {
    // Database unavailable — return mock data
    const targetRole = req.nextUrl.searchParams.get('targetRole')
    let filtered = MOCK_ALERTS.filter((a) => a.isActive)
    if (targetRole && targetRole !== 'ALL') {
      filtered = filtered.filter(
        (a) => a.targetRole === targetRole || a.targetRole === 'ALL',
      )
    }
    return NextResponse.json(filtered)
  }
}

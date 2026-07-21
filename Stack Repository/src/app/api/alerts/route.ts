import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const targetRole = req.nextUrl.searchParams.get('targetRole')
    const where: any = { isActive: true }
    if (targetRole && targetRole !== 'ALL') {
      where.targetRole = { in: [targetRole, 'ALL'] }
    }
    const alerts = await db.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(alerts)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const eventId = 'eq-maharashtra-2025-001'
    const outputs = await db.agentOutput.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(outputs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
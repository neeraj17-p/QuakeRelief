import { NextResponse } from 'next/server'
import { MOCK_AGENT_OUTPUTS } from '@/lib/mock-data'

/**
 * GET /api/agents
 * Returns AI agent outputs for the current event.
 * Falls back to mock data if database unavailable.
 */
export async function GET() {
  try {
    const { db } = await import('@/lib/db')
    const eventId = 'eq-maharashtra-2025-001'
    const outputs = await db.agentOutput.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(outputs)
  } catch {
    return NextResponse.json(MOCK_AGENT_OUTPUTS)
  }
}

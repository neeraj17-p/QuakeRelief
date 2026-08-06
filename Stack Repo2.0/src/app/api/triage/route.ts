import { NextRequest, NextResponse } from 'next/server'
import { triageReport } from '@/lib/ai-triage'

/**
 * /api/triage — LLM-Powered AI Report Triage Engine
 *
 * Dual-mode: LLM first with 800ms timeout, automatic heuristic fallback.
 * 100% offline-capable for live demos.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { report, timestamp, latitude, longitude, reporterId } = body

    const result = await triageReport({
      report,
      timestamp,
      latitude,
      longitude,
      reporterId,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    const msg = error?.message || 'Unknown error'
    const isClientError = msg.includes('report') || msg.includes('invalid') || msg.includes('too long')
    return NextResponse.json(
      { success: false, error: msg },
      { status: isClientError ? 400 : 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'QuakeRelief AI Triage Engine',
    version: '2.0.0',
    status: 'operational',
    mode: 'dual (llm + heuristic fallback)',
    engine: 'llm-priority with 800ms timeout, automatic offline heuristic fallback',
    endpoint: 'POST /api/triage',
    input_schema: {
      report: { type: 'string', required: true, max_length: 5000 },
      timestamp: { type: 'string', required: false },
      latitude: { type: 'number', required: false },
      longitude: { type: 'number', required: false },
      reporterId: { type: 'string', required: false },
    },
    output_schema: {
      summary: '1-sentence operational summary',
      hazard_category: 'STRUCTURAL_COLLAPSE | MEDICAL_EMERGENCY | FIRE | ROAD_BLOCK | LANDSLIDE | FLOOD | SPAM_OTHER',
      severity_tier: 'P1_CRITICAL | P2_HIGH | P3_MEDIUM | P4_LOW',
      casualty_estimate: 'integer (0+)',
      trapped_victims: 'boolean',
      confidence_score: 'float 0.0-1.0',
      is_spam: 'boolean',
      suggested_action: 'operational recommendation string',
      triage_timestamp: 'ISO 8601',
      processing_time_ms: 'integer',
      engine: '"llm" | "heuristic"',
    },
  })
}

import ZAI from 'z-ai-web-dev-sdk'

// ─── Exported Types ──────────────────────────────────────────────────────────

export type HazardCategory =
  | 'STRUCTURAL_COLLAPSE'
  | 'MEDICAL_EMERGENCY'
  | 'FIRE'
  | 'ROAD_BLOCK'
  | 'LANDSLIDE'
  | 'FLOOD'
  | 'SPAM_OTHER'

export type SeverityTier = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW'

export interface TriageResult {
  summary: string
  hazard_category: HazardCategory
  severity_tier: SeverityTier
  casualty_estimate: number
  trapped_victims: boolean
  confidence_score: number
  is_spam: boolean
  suggested_action: string
  triage_timestamp: string
  processing_time_ms: number
  engine: 'llm' | 'heuristic'
}

// ─── Keyword Maps for Heuristic Engine ────────────────────────────────────────

interface KeywordEntry {
  keyword: string
  weight: number
}

/** Spam indicators — high weight so even a single hit flags spam */
const SPAM_KEYWORDS: KeywordEntry[] = [
  { keyword: 'asdfgh', weight: 1.0 },
  { keyword: 'test123', weight: 0.9 },
  { keyword: 'lol', weight: 0.8 },
  { keyword: 'haha', weight: 0.8 },
  { keyword: 'fake', weight: 0.85 },
  { keyword: 'prank', weight: 0.9 },
  { keyword: 'nothing happened', weight: 0.85 },
  { keyword: 'just testing', weight: 0.85 },
]

/** Structural collapse indicators */
const STRUCTURAL_KEYWORDS: KeywordEntry[] = [
  { keyword: 'collapse', weight: 1.0 },
  { keyword: 'collapsed', weight: 1.0 },
  { keyword: 'building fell', weight: 1.0 },
  { keyword: 'roof cave', weight: 1.0 },
  { keyword: 'rubble', weight: 0.9 },
  { keyword: 'debris', weight: 0.8 },
  { keyword: 'structural', weight: 0.9 },
  { keyword: 'cracked wall', weight: 0.8 },
]

/** Medical emergency indicators */
const MEDICAL_KEYWORDS: KeywordEntry[] = [
  { keyword: 'bleeding', weight: 1.0 },
  { keyword: 'injury', weight: 1.0 },
  { keyword: 'injured', weight: 1.0 },
  { keyword: 'hospital', weight: 0.9 },
  { keyword: 'ambulance', weight: 0.9 },
  { keyword: 'medical', weight: 0.9 },
  { keyword: 'wound', weight: 0.9 },
  { keyword: 'casualt', weight: 0.95 },
]

/** Fire / explosion indicators */
const FIRE_KEYWORDS: KeywordEntry[] = [
  { keyword: 'fire', weight: 1.0 },
  { keyword: 'burning', weight: 1.0 },
  { keyword: 'flames', weight: 0.9 },
  { keyword: 'explosion', weight: 1.0 },
  { keyword: 'gas leak', weight: 0.95 },
  { keyword: 'smoke', weight: 0.8 },
]

/** Road blockage indicators (medium weight) */
const ROAD_BLOCK_KEYWORDS: KeywordEntry[] = [
  { keyword: 'road blocked', weight: 0.7 },
  { keyword: 'highway blocked', weight: 0.7 },
  { keyword: 'bridge collapsed', weight: 0.7 },
  { keyword: 'traffic jam', weight: 0.6 },
  { keyword: 'road closed', weight: 0.7 },
]

/** Landslide indicators (medium weight) */
const LANDSLIDE_KEYWORDS: KeywordEntry[] = [
  { keyword: 'landslide', weight: 0.7 },
  { keyword: 'hillside', weight: 0.6 },
  { keyword: 'rockfall', weight: 0.7 },
  { keyword: 'mudslide', weight: 0.7 },
  { keyword: 'soil', weight: 0.5 },
]

/** Flood indicators (medium weight) */
const FLOOD_KEYWORDS: KeywordEntry[] = [
  { keyword: 'flood', weight: 0.7 },
  { keyword: 'water logging', weight: 0.7 },
  { keyword: 'inundation', weight: 0.7 },
  { keyword: 'submerged', weight: 0.7 },
  { keyword: 'drainage', weight: 0.6 },
]

/** Trapped victim indicators */
const TRAPPED_KEYWORDS = ['trapped', 'buried', 'stuck', 'under', 'inside']

/** Casualty extraction patterns — match "X dead/killed" */
const CASUALTY_PATTERNS = [/\b(\d+)\s*dead\b/i, /\b(\d+)\s*killed\b/i, /\b(\d+)\s*died\b/i, /\bbodies\b/i, /\bdead\b/i, /\bdied\b/i, /\bkilled\b/i]

// ─── Category → keyword map ──────────────────────────────────────────────────

type CategoryKey = Exclude<HazardCategory, 'SPAM_OTHER'>

const CATEGORY_KEYWORDS: Record<CategoryKey, KeywordEntry[]> = {
  STRUCTURAL_COLLAPSE: STRUCTURAL_KEYWORDS,
  MEDICAL_EMERGENCY: MEDICAL_KEYWORDS,
  FIRE: FIRE_KEYWORDS,
  ROAD_BLOCK: ROAD_BLOCK_KEYWORDS,
  LANDSLIDE: LANDSLIDE_KEYWORDS,
  FLOOD: FLOOD_KEYWORDS,
}

// ─── Suggested actions per category ───────────────────────────────────────────

const SUGGESTED_ACTIONS: Record<HazardCategory, string> = {
  STRUCTURAL_COLLAPSE:
    'Deploy NDRF/SDRF heavy rescue team with urban search-and-rescue (USAR) equipment. Establish perimeter and activate structural engineers for safety assessment.',
  MEDICAL_EMERGENCY:
    'Dispatch Medical Team with ambulance to location. Activate casualty collection point. Request additional medical supplies and blood units if casualties exceed 5.',
  FIRE:
    'Deploy Fire Station unit immediately. Establish evacuation perimeter (200m). Request gas utility shutdown if gas leak suspected. Alert nearby medical teams.',
  ROAD_BLOCK:
    'Dispatch SDRF team for debris clearance. Activate alternate evacuation routes. Request heavy equipment (JCB/excavator) if bridge or large obstruction.',
  LANDSLIDE:
    'Deploy geological survey team. Establish exclusion zone around hillside. Monitor for secondary slides. Route evacuees via alternate paths.',
  FLOOD:
    'Deploy boat rescue teams. Activate drainage pumps. Establish elevated relief camps. Monitor dam levels and issue downstream warnings.',
  SPAM_OTHER:
    'Flag as non-actionable. Remove from active incident queue. Do not deploy resources.',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Count weighted keyword hits for a list of keyword entries against text */
function scoreKeywords(text: string, keywords: KeywordEntry[]): number {
  const lower = text.toLowerCase()
  let score = 0
  for (const { keyword, weight } of keywords) {
    if (lower.includes(keyword.toLowerCase())) {
      score += weight
    }
  }
  return score
}

/** Check if any trapped-indicator words are present */
function detectTrapped(text: string): boolean {
  const lower = text.toLowerCase()
  return TRAPPED_KEYWORDS.some((kw) => lower.includes(kw))
}

/** Extract casualty estimate from text */
function extractCasualties(text: string): number {
  // Try numeric patterns first (e.g. "5 dead", "10 killed")
  for (const pattern of CASUALTY_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      if (match[1]) {
        const n = parseInt(match[1], 10)
        if (!isNaN(n) && n > 0) return n
      }
      // Generic "dead/killed/bodies" without a number — estimate 1
      return 1
    }
  }
  return 0
}

/** Generate a basic summary from the top matching keywords and category */
function generateHeuristicSummary(
  text: string,
  category: HazardCategory,
  isTrapped: boolean,
  casualties: number,
): string {
  const parts: string[] = []

  const categoryLabel: Record<HazardCategory, string> = {
    STRUCTURAL_COLLAPSE: 'Structural collapse',
    MEDICAL_EMERGENCY: 'Medical emergency',
    FIRE: 'Fire incident',
    ROAD_BLOCK: 'Road blockage',
    LANDSLIDE: 'Landslide',
    FLOOD: 'Flooding',
    SPAM_OTHER: 'Non-actionable report',
  }

  parts.push(categoryLabel[category])

  if (category !== 'SPAM_OTHER') {
    if (isTrapped) parts.push('with potential trapped victims')
    if (casualties > 0) parts.push(`with an estimated ${casualties} ${casualties === 1 ? 'casualty' : 'casualties'}`)
    parts.push('reported by citizen')
  } else {
    parts.push('flagged as spam or irrelevant')
  }

  return parts.join(' ') + '.'
}

// ─── Heuristic Triage Engine ──────────────────────────────────────────────────

export function heuristicTriage(report: string): TriageResult {
  const startTime = Date.now()
  const text = report.trim()
  const textLower = text.toLowerCase()

  // 1. Spam check — score spam keywords
  const spamScore = scoreKeywords(text, SPAM_KEYWORDS)

  if (spamScore > 0.6) {
    return {
      summary: generateHeuristicSummary(text, 'SPAM_OTHER', false, 0),
      hazard_category: 'SPAM_OTHER',
      severity_tier: 'P4_LOW',
      casualty_estimate: 0,
      trapped_victims: false,
      confidence_score: Math.min(0.92, 0.5 + spamScore * 0.1),
      is_spam: true,
      suggested_action: SUGGESTED_ACTIONS.SPAM_OTHER,
      triage_timestamp: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
      engine: 'heuristic',
    }
  }

  // 2. Score each hazard category
  const categoryScores: { category: CategoryKey; score: number }[] = []

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = scoreKeywords(text, keywords as KeywordEntry[])
    categoryScores.push({ category: category as CategoryKey, score })
  }

  // Sort descending by score
  categoryScores.sort((a, b) => b.score - a.score)

  // 3. Pick highest scoring category
  const topScore = categoryScores[0].score
  let selectedCategory: HazardCategory

  if (topScore === 0) {
    // No keywords matched — vague/low info
    selectedCategory = 'SPAM_OTHER'
  } else {
    selectedCategory = categoryScores[0].category
  }

  // 4. Detect trapped victims and casualties
  const isTrapped = detectTrapped(text)
  const casualties = extractCasualties(text)

  // 5. Determine severity tier
  let severity: SeverityTier

  if (selectedCategory === 'SPAM_OTHER') {
    severity = 'P4_LOW'
  } else if (
    isTrapped &&
    (selectedCategory === 'STRUCTURAL_COLLAPSE' || selectedCategory === 'MEDICAL_EMERGENCY')
  ) {
    severity = 'P1_CRITICAL'
  } else if (
    (selectedCategory === 'STRUCTURAL_COLLAPSE' ||
      selectedCategory === 'MEDICAL_EMERGENCY' ||
      selectedCategory === 'FIRE') &&
    (casualties > 0 || topScore >= 1.5)
  ) {
    severity = 'P2_HIGH'
  } else if (topScore >= 0.7) {
    severity = 'P3_MEDIUM'
  } else {
    severity = 'P4_LOW'
  }

  // 6. Confidence: based on keyword matches and text length (cap at 0.92 for heuristic)
  const totalHits = categoryScores.reduce((sum, c) => sum + c.score, 0)
  const lengthFactor = Math.min(text.length / 100, 1) // Normalize by 100 chars
  const rawConfidence = 0.3 + (totalHits / 5) * 0.4 + lengthFactor * 0.3
  const confidence = Math.min(0.92, Math.max(0.25, rawConfidence))

  // 7. Generate summary and suggested action
  const summary = generateHeuristicSummary(text, selectedCategory, isTrapped, casualties)
  const suggestedAction = SUGGESTED_ACTIONS[selectedCategory]

  return {
    summary,
    hazard_category: selectedCategory,
    severity_tier: severity,
    casualty_estimate: casualties,
    trapped_victims: isTrapped,
    confidence_score: Math.round(confidence * 100) / 100,
    is_spam: selectedCategory === 'SPAM_OTHER' && topScore === 0,
    suggested_action: suggestedAction,
    triage_timestamp: new Date().toISOString(),
    processing_time_ms: Date.now() - startTime,
    engine: 'heuristic',
  }
}

// ─── LLM Triage (with timeout) ───────────────────────────────────────────────

const TRIAGE_SYSTEM_PROMPT = `You are an expert disaster management AI triage analyst for the QuakeRelief platform operating in Maharashtra, India. Your role is to analyze raw citizen emergency reports and extract structured operational intelligence.

GEOGRAPHIC CONTEXT:
- Operating area: Latur district, Maharashtra, India (epicenter: 18.07°N, 76.62°E)
- Known active incident zones: Ganj Golai market, Renapur Road, Ausa highway, Shivaji Nagar
- Active deployed teams: NDRF Team Alpha, SDRF Battalion 3, Medical Team 1, Fire Station Latur

CLASSIFICATION RULES:
1. STRUCTURAL_COLLAPSE: Building collapse, roof cave-in, wall failure, structural damage reports
2. MEDICAL_EMERGENCY: Injuries, casualties, medical help needed, hospital overload, trapped persons needing medical aid
3. FIRE: Active fire, gas leak with ignition risk, explosion reports
4. ROAD_BLOCK: Highway blocked, landslide on road, bridge damage preventing traffic
5. LANDSLIDE: Hillside collapse, soil movement, debris flow, rockfall
6. FLOOD: Water inundation, dam overflow, drainage failure
7. SPAM_OTHER: Prank reports, irrelevant content, duplicate reports, non-emergency queries

SEVERITY TIER RULES:
- P1_CRITICAL: Confirmed structural collapse with trapped victims, mass casualties, active fire in populated area
- P2_HIGH: Likely collapse, multiple injuries, road blocking critical evacuation route, confirmed fire
- P3_MEDIUM: Possible structural damage, minor injuries, road partially blocked, landslide reported
- P4_LOW: Minor damage, single minor injury, information queries, unverified single-source reports

RESPOND WITH VALID JSON ONLY. No markdown, no code fences, no explanation outside the JSON object.`

const TRIAGE_USER_PROMPT_TEMPLATE = `Analyze the following citizen emergency report and return a JSON object with EXACTLY these fields:

{
  "summary": "1-sentence concise operational summary of the incident",
  "hazard_category": "STRUCTURAL_COLLAPSE" | "MEDICAL_EMERGENCY" | "FIRE" | "ROAD_BLOCK" | "LANDSLIDE" | "FLOOD" | "SPAM_OTHER",
  "severity_tier": "P1_CRITICAL" | "P2_HIGH" | "P3_MEDIUM" | "P4_LOW",
  "casualty_estimate": <integer number, 0 if unknown or no casualties mentioned>,
  "trapped_victims": <true if text mentions trapped/s buried/stuck people, false otherwise>,
  "confidence_score": <float 0.0-1.0 indicating your confidence in this analysis>,
  "is_spam": <true if this appears to be a prank, irrelevant, or duplicate report>,
  "suggested_action": "Specific operational recommendation for SEOC command"
}

--- CITIZEN REPORT ---
Report Text: "{report}"
Timestamp: {timestamp}{coordinates_context}{reporter_context}

Return ONLY the JSON object. No markdown fences, no explanation.`

const VALID_HAZARD_CATEGORIES: HazardCategory[] = [
  'STRUCTURAL_COLLAPSE',
  'MEDICAL_EMERGENCY',
  'FIRE',
  'ROAD_BLOCK',
  'LANDSLIDE',
  'FLOOD',
  'SPAM_OTHER',
]

const VALID_SEVERITY_TIERS: SeverityTier[] = [
  'P1_CRITICAL',
  'P2_HIGH',
  'P3_MEDIUM',
  'P4_LOW',
]

/** Lazy singleton for ZAI SDK */
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

/** Strip markdown fences and extract JSON from LLM response */
function parseLLMResponse(raw: string): Partial<TriageResult> | null {
  let text = raw.trim()

  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  }

  try {
    return JSON.parse(text) as Partial<TriageResult>
  } catch {
    // Try to find a JSON object anywhere in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as Partial<TriageResult>
      } catch {
        return null
      }
    }
    return null
  }
}

/** Sanitize LLM output into a valid TriageResult */
function sanitizeLLMResult(raw: Partial<TriageResult>, processingMs: number): TriageResult {
  return {
    summary:
      typeof raw.summary === 'string' && raw.summary.length > 0
        ? raw.summary.slice(0, 300)
        : 'Unable to generate summary from report content.',
    hazard_category: VALID_HAZARD_CATEGORIES.includes(raw.hazard_category as HazardCategory)
      ? (raw.hazard_category as HazardCategory)
      : 'SPAM_OTHER',
    severity_tier: VALID_SEVERITY_TIERS.includes(raw.severity_tier as SeverityTier)
      ? (raw.severity_tier as SeverityTier)
      : 'P3_MEDIUM',
    casualty_estimate:
      typeof raw.casualty_estimate === 'number' && raw.casualty_estimate >= 0
        ? Math.round(raw.casualty_estimate)
        : 0,
    trapped_victims: typeof raw.trapped_victims === 'boolean' ? raw.trapped_victims : false,
    confidence_score:
      typeof raw.confidence_score === 'number' && raw.confidence_score >= 0 && raw.confidence_score <= 1
        ? Math.round(raw.confidence_score * 100) / 100
        : 0.5,
    is_spam: typeof raw.is_spam === 'boolean' ? raw.is_spam : false,
    suggested_action:
      typeof raw.suggested_action === 'string' && raw.suggested_action.length > 0
        ? raw.suggested_action.slice(0, 500)
        : 'Review report manually and assign verification tier.',
    triage_timestamp: new Date().toISOString(),
    processing_time_ms: processingMs,
    engine: 'llm',
  }
}

/**
 * Attempt LLM triage with an 800ms timeout.
 * Returns null on timeout/error so the caller can fall back to heuristic.
 */
async function llmTriage(
  report: string,
  timestamp: string,
  coordinatesContext: string,
  reporterContext: string,
): Promise<TriageResult | null> {
  const startTime = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 800)

  try {
    const zai = await getZAI()

    const userPrompt = TRIAGE_USER_PROMPT_TEMPLATE
      .replace(/{report}/g, report.slice(0, 5000))
      .replace(/{timestamp}/g, timestamp)
      .replace(/{coordinates_context}/g, coordinatesContext)
      .replace(/{reporter_context}/g, reporterContext)

    const completion = await zai.chat.completions.create(
      {
        messages: [
          { role: 'assistant', content: TRIAGE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
        signal: controller.signal as AbortSignal,
      },
    )

    clearTimeout(timeoutId)

    const rawResponse = completion.choices[0]?.message?.content
    if (!rawResponse || rawResponse.trim().length === 0) {
      return null
    }

    const parsed = parseLLMResponse(rawResponse)
    if (!parsed) {
      return null
    }

    return sanitizeLLMResult(parsed, Date.now() - startTime)
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

// ─── Main Export: Dual-Mode Triage ────────────────────────────────────────────

/**
 * Analyze a citizen report using LLM-first with automatic heuristic fallback.
 *
 * @throws Error if the report is empty, whitespace-only, or missing.
 */
export async function triageReport(input: {
  report: string
  timestamp?: string
  latitude?: number
  longitude?: number
  reporterId?: string
}): Promise<TriageResult> {
  const { report, timestamp, latitude, longitude, reporterId } = input

  // ── Input validation ──
  if (!report || typeof report !== 'string' || report.trim().length === 0) {
    throw new Error("Missing or invalid 'report' field. Provide a non-empty string.")
  }

  if (report.length > 5000) {
    throw new Error('Report text too long. Maximum 5000 characters.')
  }

  const ts = timestamp || new Date().toISOString()
  const coordinatesContext =
    latitude != null && longitude != null
      ? `\nCoordinates: ${latitude}°N, ${longitude}°E`
      : ''
  const reporterContext = reporterId ? `\nReporter ID: ${reporterId}` : ''

  // ── Try LLM first with 800ms timeout ──
  const llmResult = await llmTriage(report.trim(), ts, coordinatesContext, reporterContext)

  if (llmResult) {
    return llmResult
  }

  // ── Fall back to heuristic ──
  return heuristicTriage(report)
}

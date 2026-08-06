/**
 * Automated Verification Script for AI Triage Engine
 * 
 * Tests 3 sample inputs through the heuristic engine (offline-guaranteed)
 * and validates all structured assertions pass.
 * 
 * Run: bun run src/lib/__tests__/verify-triage.ts
 */

import { heuristicTriage, triageReport, type TriageResult } from '../ai-triage'

// ─── Test Helpers ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`)
    passed++
  } else {
    console.log(`  ❌ FAIL: ${message}`)
    failed++
  }
}

// ─── Test 1: P1 Critical — Structural collapse with trapped victims ───────

console.log('\n=== TEST 1: P1 Critical — Structural Collapse with Trapped ===')

const result1 = heuristicTriage(
  'Building collapsed near railway station, 3 people trapped under debris!'
)

assert(
  result1.hazard_category === 'STRUCTURAL_COLLAPSE',
  `Expected STRUCTURAL_COLLAPSE, got ${result1.hazard_category}`
)
assert(
  result1.severity_tier === 'P1_CRITICAL',
  `Expected P1_CRITICAL, got ${result1.severity_tier}`
)
assert(
  result1.trapped_victims === true,
  `Expected trapped_victims=true, got ${result1.trapped_victims}`
)
assert(
  result1.is_spam === false,
  `Expected is_spam=false, got ${result1.is_spam}`
)
assert(
  result1.confidence_score > 0,
  `Expected confidence > 0, got ${result1.confidence_score}`
)
assert(
  typeof result1.summary === 'string' && result1.summary.length > 5,
  'Summary should be non-empty string'
)
assert(
  typeof result1.suggested_action === 'string' && result1.suggested_action.length > 10,
  'Suggested action should be non-empty string'
)
assert(
  result1.engine === 'heuristic',
  `Expected engine=heuristic, got ${result1.engine}`
)
assert(
  result1.processing_time_ms >= 0,
  `Processing time should be >= 0, got ${result1.processing_time_ms}`
)
assert(
  result1.casualty_estimate >= 0,
  `Casualty estimate should be >= 0, got ${result1.casualty_estimate}`
)

// ─── Test 2: P3 Medium — Water logging on road ──────────────────────────

console.log('\n=== TEST 2: P3 Medium — Water Logging on Road ===')

const result2 = heuristicTriage(
  'Water logging on main road near market.'
)

assert(
  result2.hazard_category === 'FLOOD',
  `Expected FLOOD, got ${result2.hazard_category}`
)
assert(
  result2.severity_tier === 'P3_MEDIUM',
  `Expected P3_MEDIUM, got ${result2.severity_tier}`
)
assert(
  result2.is_spam === false,
  `Expected is_spam=false, got ${result2.is_spam}`
)
assert(
  result2.trapped_victims === false,
  `Expected trapped_victims=false, got ${result2.trapped_victims}`
)
assert(
  result2.engine === 'heuristic',
  `Expected engine=heuristic, got ${result2.engine}`
)

// ─── Test 3: Spam Detection ─────────────────────────────────────────────

console.log('\n=== TEST 3: Spam Detection ===')

const result3 = heuristicTriage(
  'asdfgh123 test message'
)

assert(
  result3.is_spam === true,
  `Expected is_spam=true, got ${result3.is_spam}`
)
assert(
  result3.hazard_category === 'SPAM_OTHER',
  `Expected SPAM_OTHER, got ${result3.hazard_category}`
)
assert(
  result3.severity_tier === 'P4_LOW',
  `Expected P4_LOW, got ${result3.severity_tier}`
)
assert(
  result3.engine === 'heuristic',
  `Expected engine=heuristic, got ${result3.engine}`
)

// ─── Test 4: Medical Emergency ──────────────────────────────────────────

console.log('\n=== TEST 4: Medical Emergency ===')

const result4 = heuristicTriage(
  'My wife is bleeding heavily from a head wound. Need ambulance urgently!'
)

assert(
  result4.hazard_category === 'MEDICAL_EMERGENCY',
  `Expected MEDICAL_EMERGENCY, got ${result4.hazard_category}`
)
assert(
  result4.severity_tier === 'P2_HIGH' || result4.severity_tier === 'P3_MEDIUM',
  `Expected P2 or P3, got ${result4.severity_tier}`
)
assert(
  result4.is_spam === false,
  `Expected is_spam=false, got ${result4.is_spam}`
)

// ─── Test 5: Fire Incident ──────────────────────────────────────────────

console.log('\n=== TEST 5: Fire Incident ===')

const result5 = heuristicTriage(
  'Gas cylinder has exploded and there is a massive fire spreading through the market area.'
)

assert(
  result5.hazard_category === 'FIRE',
  `Expected FIRE, got ${result5.hazard_category}`
)
assert(
  result5.is_spam === false,
  `Expected is_spam=false, got ${result5.is_spam}`
)

// ─── Test 6: Input Validation ────────────────────────────────────────────

console.log('\n=== TEST 6: Input Validation ===')

try {
  heuristicTriage('')
  // If we get here, the function didn't throw for empty input
  // (heuristicTriage doesn't throw — only triageReport does)
  console.log('  ⚠️  SKIP: heuristicTriage does not throw on empty input (by design)')
} catch (e: any) {
  assert(true, 'Empty input throws error')
}

try {
  await triageReport({ report: '' })
  assert(false, 'Should have thrown for empty report')
} catch (e: any) {
  assert(
    e.message.includes('report') || e.message.includes('invalid'),
    `Error message should mention 'report', got: ${e.message}`
  )
}

// ─── Test 7: Schema completeness ────────────────────────────────────────

console.log('\n=== TEST 7: Schema Completeness ===')

const REQUIRED_KEYS: (keyof TriageResult)[] = [
  'summary', 'hazard_category', 'severity_tier', 'casualty_estimate',
  'trapped_victims', 'confidence_score', 'is_spam', 'suggested_action',
  'triage_timestamp', 'processing_time_ms', 'engine',
]

const sample = heuristicTriage('Test report about a fire near the market area')
for (const key of REQUIRED_KEYS) {
  assert(
    key in sample,
    `Missing required key: ${key}`
  )
}

// ─── Summary ─────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`)
console.log(`${'═'.repeat(50)}`)

if (failed > 0) {
  console.error('\n❌ VERIFICATION FAILED — some assertions did not pass')
  process.exit(1)
} else {
  console.log('\n✅ ALL ASSERTIONS PASSED — AI Triage Engine verified')
  process.exit(0)
}

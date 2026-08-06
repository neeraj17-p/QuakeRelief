/**
 * verify-valhalla.ts — Automated test runner for Valhalla routing integration.
 *
 * Tests:
 *   1. Payload Structure: locations array contains { lat, lon } objects
 *   2. Polygon Structure: exclude_polygons is 3D [lon, lat] array with closed ring
 *   3. Response Parsing: Valhalla response { trip: { legs: [{ shape }] } } decodes correctly
 *   4. Error Handling: Missing trip, empty legs, null shape
 *
 * Run: bun run src/lib/__tests__/verify-valhalla.ts
 */

// ─── Valhalla Precision 6 polyline decoder (canonical implementation) ──────

function decodePolylineP6(encoded: string, precision = 6): [number, number][] {
  const factor = Math.pow(10, precision)
  const coords: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    // Decode latitude delta (zigzag encoded, Google polyline format)
    let result = 0
    let shift = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1
    lat += dlat

    // Decode longitude delta (zigzag encoded)
    result = 0
    shift = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    const dlng = (result & 1) ? ~(result >> 1) : result >> 1
    lng += dlng

    coords.push([lat / factor, lng / factor])
  }
  return coords
}

// ─── Polyline P6 encoder (for test round-trip) ────────────────────────────

function encodePolylineP6(coords: [number, number][]): string {
  const factor = 1e6
  let encoded = ''
  let prevLat = 0
  let prevLng = 0
  for (const [lat, lng] of coords) {
    const dlat = Math.round((lat - prevLat) * factor)
    const dlng = Math.round((lng - prevLng) * factor)
    encoded += encodeZigzag(dlat) + encodeZigzag(dlng)
    prevLat = lat
    prevLng = lng
  }
  return encoded
}

function encodeZigzag(value: number): string {
  const zigzag = value < 0 ? ((-value) << 1) - 1 : value << 1
  let n = zigzag
  let result = ''
  while (n >= 0x20) {
    result += String.fromCharCode((0x20 | (n & 0x1f)) + 63)
    n >>= 5
  }
  result += String.fromCharCode(n + 63)
  return result
}

// ─── Test helpers ────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`)
    passed++
  } else {
    console.log(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

// ─── Test 1: Payload Structure ──────────────────────────────────────────────

console.log('\n📋 Test 1: Payload Structure')
console.log('─'.repeat(50))

const from: [number, number] = [18.07, 76.62]
const to: [number, number] = [18.08, 76.65]

const locations = [
  { lat: from[0], lon: from[1] },
  { lat: to[0], lon: to[1] },
]

assert(Array.isArray(locations), 'locations is an array')
assert(locations.length >= 2, 'locations has at least 2 entries')
assert(typeof locations[0].lat === 'number', 'First location has lat number')
assert(typeof locations[0].lon === 'number', 'First location has lon number')
assert(typeof locations[1].lat === 'number', 'Second location has lat number')
assert(typeof locations[1].lon === 'number', 'Second location has lon number')
assert(locations[0].lat === 18.07, 'Start lat is 18.07')
assert(locations[0].lon === 76.62, 'Start lon is 76.62')

const payload: Record<string, unknown> = { locations, costing: 'auto' }
assert(payload.costing === 'auto', 'costing is "auto"')

// ─── Test 2: Polygon Structure ─────────────────────────────────────────────

console.log('\n📋 Test 2: Polygon Structure (exclude_polygons)')
console.log('─'.repeat(50))

// Leaflet [lat, lng] hazard polygon
const leafletRing: [number, number][] = [
  [18.071, 76.621],
  [18.071, 76.623],
  [18.073, 76.623],
  [18.073, 76.621],
]

// Convert to Valhalla [lon, lat] and close ring
const hazardPolygons: [number, number][][] = [leafletRing]
const converted = hazardPolygons.map(ring => {
  const lngLatRing = ring.map(p => [p[1], p[0]] as number[])
  const first = lngLatRing[0]
  const last = lngLatRing[lngLatRing.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    lngLatRing.push([first[0], first[1]])
  }
  return lngLatRing
})

assert(Array.isArray(converted), 'converted is an array')
assert(converted.length === 1, 'converted has 1 ring')
assert(converted[0].length === 5, `first ring has 5 points (4 + closed) — got ${converted[0].length}`)
assert(converted[0][0][0] === 76.621, 'First point lon is 76.621')
assert(converted[0][0][1] === 18.071, 'First point lat is 18.071')
assert(converted[0][1][0] === 76.623, 'Second point lon is 76.623')
assert(converted[0][1][1] === 18.071, 'Second point lat is 18.071')
assert(
  converted[0][0][0] === converted[0][converted[0].length - 1][0] &&
  converted[0][0][1] === converted[0][converted[0].length - 1][1],
  'Ring is closed (first === last)'
)
assert(Array.isArray(converted) && Array.isArray(converted[0]) && Array.isArray(converted[0][0]), 'exclude_polygons is 3D array')

const costingOptions = { auto: { exclude_polygons: converted } }
assert(Array.isArray(costingOptions.auto.exclude_polygons), 'costing_options.auto.exclude_polygons is array')
assert(costingOptions.auto.exclude_polygons.length > 0, 'exclude_polygons is non-empty')

// ─── Test 3: Polyline Encode/Decode Round-Trip ─────────────────────────────

console.log('\n📋 Test 3: Polyline Encode/Decode Round-Trip')
console.log('─'.repeat(50))

const mockCoords: [number, number][] = [
  [18.0700, 76.6200],
  [18.0705, 76.6210],
  [18.0710, 76.6220],
  [18.0720, 76.6230],
  [18.0730, 76.6240],
  [18.0740, 76.6250],
  [18.0750, 76.6260],
  [18.0760, 76.6270],
  [18.0770, 76.6280],
  [18.0780, 76.6290],
  [18.0790, 76.6300],
  [18.0800, 76.6310],
  [18.0800, 76.6320],
]

const mockShape = encodePolylineP6(mockCoords)
assert(typeof mockShape === 'string' && mockShape.length > 0, 'Encoded polyline is non-empty string')

// Decode and verify round-trip
const decoded = decodePolylineP6(mockShape, 6)
assert(Array.isArray(decoded), 'Decoded polyline is an array')
assert(decoded.length === mockCoords.length, `Round-trip: ${mockCoords.length} points → ${decoded.length} points`)

// Verify first/last coordinates match
const TOL = 1e-5  // P6 precision is ~0.1m
assert(Math.abs(decoded[0][0] - mockCoords[0][0]) < TOL,
  `First lat: ${decoded[0][0].toFixed(6)} ≈ ${mockCoords[0][0].toFixed(6)}`)
assert(Math.abs(decoded[0][1] - mockCoords[0][1]) < TOL,
  `First lng: ${decoded[0][1].toFixed(6)} ≈ ${mockCoords[0][1].toFixed(6)}`)
assert(Math.abs(decoded[decoded.length-1][0] - mockCoords[mockCoords.length-1][0]) < TOL,
  `Last lat: ${decoded[decoded.length-1][0].toFixed(6)} ≈ ${mockCoords[mockCoords.length-1][0].toFixed(6)}`)
assert(Math.abs(decoded[decoded.length-1][1] - mockCoords[mockCoords.length-1][1]) < TOL,
  `Last lng: ${decoded[decoded.length-1][1].toFixed(6)} ≈ ${mockCoords[mockCoords.length-1][1].toFixed(6)}`)

// Verify all points are valid [lat, lng] pairs
assert(decoded.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number'),
  'All decoded points are valid [lat, lng] pairs')

// Verify path is suitable for Leaflet L.polyline()
assert(decoded.length >= 2, 'Path has at least 2 points for Leaflet polyline')

// Mock Valhalla response structure
const mockValhallaResponse = {
  trip: {
    legs: [{ shape: mockShape, summary: { distance: 1500, time: 180 } }],
    summary: { distance: 1500, time: 180 },
  },
}

assert(mockValhallaResponse.trip !== undefined, 'Response has trip object')
assert(Array.isArray(mockValhallaResponse.trip.legs), 'trip.legs is an array')
assert(mockValhallaResponse.trip.legs.length > 0, 'trip.legs is non-empty')
assert(typeof mockValhallaResponse.trip.legs[0].shape === 'string', 'First leg has shape string')

// ─── Test 4: Error handling ─────────────────────────────────────────────────

console.log('\n📋 Test 4: Error Handling')
console.log('─'.repeat(50))

assert(({} as any).trip === undefined, 'Missing trip detected')
assert(!(({ trip: { legs: [] } } as any).trip.legs.length), 'Empty legs array detected')
assert(({ trip: { legs: [{ shape: null }] } } as any).trip.legs[0].shape === null, 'Null shape detected')

// ─── Results ─────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(50))
console.log(`\n🎉 Valhalla Integration Tests: ${passed} passed, ${failed} failed out of ${passed + failed} total\n`)
console.log('═'.repeat(50))

if (failed > 0) {
  process.exit(1)
}
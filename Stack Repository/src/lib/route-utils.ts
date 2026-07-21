// ─── Route Generation & Distance Utilities ─────────────────────────────────────
// Shared helpers for rescue auto-routing and admin landslide/blockage simulation.

/**
 * Generate a realistic-looking route between two geographic points,
 * with optional obstacle avoidance detours.
 *
 * @param from   Start [lat, lng]
 * @param to     End [lat, lng]
 * @param obstacles Array of obstacle [lat, lng] to detour around
 * @param numWaypoints  Number of intermediate waypoints (8-12 recommended)
 */
export function generateRoute(
  from: [number, number],
  to: [number, number],
  obstacles: [number, number][] = [],
  numWaypoints = 10,
): [number, number][] {
  const points: [number, number][] = [from]

  for (let i = 1; i < numWaypoints; i++) {
    const t = i / numWaypoints
    let lat = from[0] + (to[0] - from[0]) * t
    let lng = from[1] + (to[1] - from[1]) * t

    // Add slight curve to make it look like a real road
    const curveFactor = Math.sin(t * Math.PI) * 0.003
    const perpLat = -(to[1] - from[1])
    const perpLng = to[0] - from[0]
    const perpLen = Math.sqrt(perpLat * perpLat + perpLng * perpLng) || 1
    lat += (perpLat / perpLen) * curveFactor
    lng += (perpLng / perpLen) * curveFactor

    // Check for nearby obstacles and detour
    for (const obs of obstacles) {
      const dist = Math.sqrt((lat - obs[0]) ** 2 + (lng - obs[1]) ** 2)
      if (dist < 0.005) {
        // Detour perpendicular to the obstacle
        const detourAngle = Math.atan2(obs[0] - lat, obs[1] - lng)
        lat += Math.cos(detourAngle) * 0.008
        lng += Math.sin(detourAngle) * 0.008
      }
    }

    points.push([lat, lng])
  }

  points.push(to)
  return points
}

/**
 * Haversine formula — great-circle distance between two lat/lng points in km.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
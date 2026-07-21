import { NextRequest, NextResponse } from "next/server";

/**
 * /api/route — Proxies OSRM routing requests for street-snapped polylines.
 *
 * STREET-GRID ENFORCEMENT POLICY:
 *   This API will NEVER return a fallback/straight-line path. If OSRM fails
 *   after all retries, it returns { success: false } so the client can retry
 *   later rather than rendering misleading geometry.
 *
 * Query params:
 *   from      — "lat,lng" of origin
 *   to        — "lat,lng" of destination
 *   obstacles — optional "|" separated list of "lat,lng" obstacle positions
 *
 * Returns:
 *   { success: true, path: [[lat,lng],...], distance: meters, duration: seconds }
 *   or { success: false, error: string } on failure
 */

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

// Exponential backoff delays: 1s → 2s → 4s → 6s
const RETRY_DELAYS_MS = [1000, 2000, 4000, 6000];
const REQUEST_TIMEOUT_MS = 12000;

function parseCoord(param: string | null): [number, number] | null {
  if (!param) return null;
  const parts = param.split(",").map(Number);
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return [parts[0], parts[1]];
}

function buildOSRMUrl(
  from: [number, number],
  to: [number, number],
  obstacles: [number, number][]
): string {
  // OSRM uses lng,lat order
  const waypoints: string[] = [`${from[1]},${from[0]}`];

  for (const [lat, lng] of obstacles) {
    // Offset obstacle position slightly perpendicular to route around it
    waypoints.push(`${lng + 0.0005},${lat + 0.0005}`);
  }

  waypoints.push(`${to[1]},${to[0]}`);
  return `${OSRM_BASE}/${waypoints.join(";")}?overview=full&geometries=geojson`;
}

async function attemptOSRMFetch(
  osrmUrl: string
): Promise<{ success: true; path: [number, number][]; distance: number; duration: number } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "QuakeRelief/1.0" },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const coordinates = route.geometry?.coordinates;

    if (!coordinates || coordinates.length < 2) {
      return null;
    }

    // Convert from GeoJSON [lng, lat] to [lat, lng]
    const path: [number, number][] = coordinates.map(
      (coord: number[]) => [coord[1], coord[0]] as [number, number]
    );

    return {
      success: true,
      path,
      distance: route.distance,
      duration: route.duration,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const from = parseCoord(searchParams.get("from"));
  const to = parseCoord(searchParams.get("to"));

  if (!from || !to) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid 'from' or 'to' parameters. Use lat,lng format." },
      { status: 400 }
    );
  }

  // Parse obstacles
  const obstacles: [number, number][] = [];
  const obstaclesParam = searchParams.get("obstacles");
  if (obstaclesParam) {
    for (const obs of obstaclesParam.split("|")) {
      const coord = parseCoord(obs);
      if (coord) obstacles.push(coord);
    }
  }

  const osrmUrl = buildOSRMUrl(from, to, obstacles);

  // Exponential backoff retry loop — NEVER fall back to straight lines
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    const result = await attemptOSRMFetch(osrmUrl);
    if (result) {
      return NextResponse.json(result);
    }

    // Wait before next retry (skip wait after last attempt)
    if (attempt < RETRY_DELAYS_MS.length - 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }

  // All retries exhausted — return failure (client must handle gracefully)
  return NextResponse.json({
    success: false,
    error: `OSRM routing failed after ${RETRY_DELAYS_MS.length} attempts. The street-grid engine could not compute a valid route.`,
  });
}
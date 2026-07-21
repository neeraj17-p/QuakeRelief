'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Types ───────────────────────────────────────────────────────────────────

interface RouteDef {
  id: string
  path: [number, number][]
  color: string
  weight?: number
  dashArray?: string
  opacity?: number
}

interface AnimatedMarkerDef {
  id: string
  routeId: string
  speed?: number
  icon?: L.DivIcon
  label?: string
}

export interface RoutingQuery {
  id: string
  from: [number, number]
  to: [number, number]
  color?: string
  weight?: number
}

interface MapInnerProps {
  center: [number, number]
  zoom?: number
  className?: string
  /** Custom tile layer URL (e.g. CartoDB DarkMatter). Falls back to OSM. */
  tileUrl?: string
  onMapReady?: (map: L.Map) => void
  onMapClick?: (lat: number, lng: number) => void
  markers?: Array<{
    position: [number, number]
    icon?: L.DivIcon
    popup?: string
  }>
  routes?: RouteDef[]
  animatedMarkers?: AnimatedMarkerDef[]
  /** Dynamic API-based street routing queries */
  routingQueries?: RoutingQuery[]
  /** Called when a route is calculated with the real path coordinates */
  onRouteCalculated?: (id: string, path: [number, number][]) => void
  /** Programmatically pan the map to a specific coordinate */
  panTo?: [number, number] | null
  /** Programmatically set zoom level */
  setZoom?: number | null
}

// ─── Stored route rendering data ─────────────────────────────────────────────

interface StoredRoute {
  glow: L.Polyline
  main: L.Polyline
  path: [number, number][]
  color: string
  weight: number
  isFallback: boolean
  dashTimer?: ReturnType<typeof setTimeout>
  flashTimer?: ReturnType<typeof setTimeout>
  drawTimer?: ReturnType<typeof setInterval>
}

// ─── Default tile URLs ───────────────────────────────────────────────────────

const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_TILE_ATTRIBUTION = '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'

const TILE_PRESETS: Record<string, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  osm: {
    url: DEFAULT_TILE_URL,
    attribution: DEFAULT_TILE_ATTRIBUTION,
  },
}

// ─── Helper: fetch route from API with retry logic ───────────────────────────

async function fetchRoute(
  from: [number, number],
  to: [number, number],
): Promise<{ success: boolean; path?: [number, number][]; distance?: number; duration?: number }> {
  const params = new URLSearchParams()
  params.set('from', `${from[0]},${from[1]}`)
  params.set('to', `${to[0]},${to[1]}`)

  // Aggressive retry with exponential backoff (1s, 2s, 4s)
  const retryDelays = [1000, 2000, 4000]

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      const res = await fetch(`/api/route?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success && data.path && data.path.length >= 2) {
        return data
      }
      throw new Error('Invalid route data')
    } catch {
      if (attempt < retryDelays.length) {
        await new Promise((r) => setTimeout(r, retryDelays[attempt]))
      }
    }
  }

  // NEVER return a fallback straight/Bezier line — street-grid enforcement
  return { success: false }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MapInner({
  center,
  zoom = 12,
  className = '',
  tileUrl,
  onMapReady,
  onMapClick,
  markers = [],
  routes = [],
  animatedMarkers = [],
  routingQueries = [],
  onRouteCalculated,
  panTo = null,
  setZoom: setZoomProp = null,
}: MapInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const clickMarkerRef = useRef<L.Marker | null>(null)
  const routesLayerRef = useRef<L.LayerGroup | null>(null)
  const routingLayerRef = useRef<L.LayerGroup | null>(null)
  const animMarkerInstancesRef = useRef<Map<string, L.Marker>>(new Map())
  const animMarkerIndexRef = useRef<Map<string, number>>(new Map())
  const animIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  // Route polyline storage: keyed by query.id
  const storedRoutesRef = useRef<Map<string, StoredRoute>>(new Map())
  // Cached paths for route tracking
  const cachedPathsRef = useRef<Map<string, [number, number][]>>(new Map())
  // Track if a query has been fetched before (for animation purposes)
  const firstRouteFetchedRef = useRef<boolean>(false)
  const drawAnimationIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  // ── Resolve tile URL ──
  const resolvedTile = useMemo(() => {
    if (!tileUrl) return TILE_PRESETS.osm
    // Check if it's a preset key
    if (TILE_PRESETS[tileUrl]) return TILE_PRESETS[tileUrl]
    // Otherwise treat as a direct URL
    return { url: tileUrl, attribution: DEFAULT_TILE_ATTRIBUTION }
  }, [tileUrl])

  // ── Helper: remove stored route from map ──
  const removeStoredRoute = useCallback((id: string) => {
    const stored = storedRoutesRef.current.get(id)
    if (!stored) return

    // Clear timers
    if (stored.dashTimer) clearTimeout(stored.dashTimer)
    if (stored.flashTimer) clearTimeout(stored.flashTimer)
    if (stored.drawTimer) clearInterval(stored.drawTimer)

    // Clear draw animation interval
    const drawInterval = drawAnimationIntervalsRef.current.get(id)
    if (drawInterval) {
      clearInterval(drawInterval)
      drawAnimationIntervalsRef.current.delete(id)
    }

    // Remove layers (no waypoint markers — only polylines)
    stored.glow.remove()
    stored.main.remove()

    storedRoutesRef.current.delete(id)
  }, [])

  // ── Helper: draw a route path on the map (no waypoint dots) ──
  const drawRoutePath = useCallback((
    id: string,
    path: [number, number][],
    color: string,
    weight: number,
    isReroute: boolean,
    isFallback: boolean,
    animate: boolean,
  ) => {
    const layer = routingLayerRef.current
    if (!layer) return

    // Remove any existing route for this id
    removeStoredRoute(id)

    if (path.length < 2) return

    // Glow layer (wide, translucent background line)
    const glow = L.polyline([], {
      color,
      weight: 12,
      opacity: 0.15,
      lineJoin: 'round',
      lineCap: 'round',
      smoothFactor: 1,
    }).addTo(layer)

    // Main route line
    const main = L.polyline([], {
      color: isReroute ? '#f59e0b' : color,
      weight,
      opacity: isFallback ? 0.5 : 0.9,
      lineJoin: 'round',
      lineCap: 'round',
      smoothFactor: 1,
      dashArray: isFallback ? '8 6' : '12 8',
    }).addTo(layer)

    // No start/end circle markers — only custom pulsing pins and hazard symbols remain visible

    const stored: StoredRoute = {
      glow,
      main,
      path,
      color,
      weight,
      isFallback,
    }

    if (animate && path.length > 2) {
      // Drawing animation: progressively add coordinates over 2 seconds
      const totalDuration = 2000
      const tickInterval = 20
      const totalTicks = Math.ceil(totalDuration / tickInterval)
      let currentTick = 0

      const drawInterval = setInterval(() => {
        currentTick++
        const progress = Math.min(currentTick / totalTicks, 1)
        const pointCount = Math.max(2, Math.ceil(progress * path.length))

        const visiblePath = path.slice(0, pointCount)
        glow.setLatLngs(visiblePath)
        main.setLatLngs(visiblePath)

        if (currentTick >= totalTicks) {
          clearInterval(drawInterval)
          drawAnimationIntervalsRef.current.delete(id)
          // Ensure full path is drawn
          glow.setLatLngs(path)
          main.setLatLngs(path)
        }
      }, tickInterval)

      drawAnimationIntervalsRef.current.set(id, drawInterval)
      stored.drawTimer = drawInterval
    } else {
      // Draw immediately
      glow.setLatLngs(path)
      main.setLatLngs(path)
    }

    // Dash animation: switch from dashed to solid after 3 seconds
    if (!isFallback) {
      const dashTimer = setTimeout(() => {
        const s = storedRoutesRef.current.get(id)
        if (s && s.main) {
          s.main.setStyle({ dashArray: undefined })
        }
      }, 3000)
      stored.dashTimer = dashTimer
    }

    storedRoutesRef.current.set(id, stored)
  }, [removeStoredRoute])

  // ── Helper: process a single routing query ──
  const processRoutingQuery = useCallback(async (
    query: RoutingQuery,
    isFirstQuery: boolean,
  ) => {
    const color = query.color ?? '#2563eb'
    const weight = query.weight ?? 5

    // Fetch from API — street-grid enforced, NO geometric fallback
    const result = await fetchRoute(query.from, query.to)

    if (!result.success || !result.path) {
      // OSRM failed after all retries — do NOT draw any line
      return
    }

    const path = result.path

    // Cache the path
    cachedPathsRef.current.set(query.id, path)

    // Notify parent
    if (onRouteCalculated) {
      onRouteCalculated(query.id, path)
    }

    // Draw the route (never fallback)
    drawRoutePath(query.id, path, color, weight, false, false, isFirstQuery)
  }, [onRouteCalculated, drawRoutePath])

  // ── Initialize map (runs once) ──
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer(resolvedTile.url, {
      attribution: resolvedTile.attribution,
      maxZoom: 18,
    }).addTo(map)

    markersLayerRef.current = L.layerGroup().addTo(map)
    routesLayerRef.current = L.layerGroup().addTo(map)
    routingLayerRef.current = L.layerGroup().addTo(map)

    mapInstanceRef.current = map

    if (onMapReady) onMapReady(map)

    return () => {
      // Clean up stored route polylines
      storedRoutesRef.current.forEach((_, id) => removeStoredRoute(id))
      storedRoutesRef.current.clear()
      cachedPathsRef.current.clear()

      // Clean up draw animation intervals
      drawAnimationIntervalsRef.current.forEach((interval) => clearInterval(interval))
      drawAnimationIntervalsRef.current.clear()

      // Clean up animated marker intervals
      animIntervalsRef.current.forEach((interval) => clearInterval(interval))
      animIntervalsRef.current.clear()
      animMarkerInstancesRef.current.forEach((m) => m.remove())
      animMarkerInstancesRef.current.clear()
      animMarkerIndexRef.current.clear()

      map.remove()
      mapInstanceRef.current = null
      markersLayerRef.current = null
      routesLayerRef.current = null
      routingLayerRef.current = null
      clickMarkerRef.current = null
    }
  }, [])

  // ── Pan to coordinate ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !panTo) return
    map.flyTo(panTo, map.getZoom(), { duration: 1.2 })
  }, [panTo])

  // ── Set zoom ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || setZoomProp === null) return
    map.setZoom(setZoomProp)
  }, [setZoomProp])

  // ── Map click handler (clean — no obstacle mode) ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const handler = (e: L.LeafletMouseEvent) => {
      try {
        const { lat, lng } = e.latlng

        if (!onMapClick) return

        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove()
        }

        const clickIcon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:24px;height:24px;">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;background:#3b82f6;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:2;"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:28px;height:28px;background:#3b82f6;border-radius:50%;opacity:0.2;z-index:1;"></div>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const marker = L.marker([lat, lng], { icon: clickIcon })
        marker.bindPopup(`<div style="font-family:system-ui;font-size:12px;"><strong>📍 Selected Location</strong><br/>${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>`)
        marker.addTo(map)
        clickMarkerRef.current = marker

        onMapClick(lat, lng)
      } catch (err) {
        // Canvas/rendering thread protection — prevent JS exceptions from crashing the map
        console.error('[MapInner] Click handler error (canvas-safe):', err)
      }
    }

    map.on('click', handler)
    return () => { map.off('click', handler) }
  }, [onMapClick])

  // ── Static markers ──
  useEffect(() => {
    if (!markersLayerRef.current) return
    markersLayerRef.current.clearLayers()

    markers.forEach((m) => {
      const marker = L.marker(m.position, { icon: m.icon })
      if (m.popup) marker.bindPopup(m.popup, { maxWidth: 300 })
      marker.addTo(markersLayerRef.current!)
    })
  }, [markers])

  // ── Static route polylines ──
  useEffect(() => {
    const layer = routesLayerRef.current
    if (!layer) return
    layer.clearLayers()

    routes.forEach((route) => {
      if (route.path.length < 2) return
      L.polyline(route.path, {
        color: route.color,
        weight: route.weight ?? 4,
        dashArray: route.dashArray,
        opacity: route.opacity ?? 0.8,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(layer)
    })
  }, [routes])

  // ── Dynamic API-based Routing ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clean up stale routes (ones that are no longer in routingQueries)
    const activeIds = new Set(routingQueries.map(q => q.id))
    storedRoutesRef.current.forEach((_, id) => {
      if (!activeIds.has(id)) {
        removeStoredRoute(id)
      }
    })

    // Process each routing query
    const isFirstQuery = !firstRouteFetchedRef.current

    routingQueries.forEach(query => {
      processRoutingQuery(query, isFirstQuery && query === routingQueries[0])
    })

    if (routingQueries.length > 0) {
      firstRouteFetchedRef.current = true
    }
  }, [routingQueries, processRoutingQuery, removeStoredRoute])

  // ── Animated markers along routes ──
  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = markersLayerRef.current
    if (!map || !layer) return

    // Build route path lookup from both static routes and cached routing paths
    const routeMap = new Map<string, [number, number][]>()
    routes.forEach((r) => routeMap.set(r.id, r.path))
    cachedPathsRef.current.forEach((path, id) => {
      if (!routeMap.has(id)) routeMap.set(id, path)
    })

    // Clean up previous animated markers
    animIntervalsRef.current.forEach((interval) => clearInterval(interval))
    animIntervalsRef.current.clear()
    animMarkerInstancesRef.current.forEach((m) => m.remove())
    animMarkerInstancesRef.current.clear()
    animMarkerIndexRef.current.clear()

    animatedMarkers.forEach((am) => {
      const routePath = routeMap.get(am.routeId)
      if (!routePath || routePath.length < 2) return

      const speed = am.speed ?? 2000
      const startIdx = 0

      const icon = am.icon ?? L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#f59e0b;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(245,158,11,0.6);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      const marker = L.marker(routePath[startIdx], { icon, zIndexOffset: 1000 })
      if (am.label) marker.bindTooltip(am.label, { permanent: true, direction: 'top', offset: [0, -10] })
      marker.addTo(map)
      animMarkerInstancesRef.current.set(am.id, marker)
      animMarkerIndexRef.current.set(am.id, startIdx)

      const interval = setInterval(() => {
        const currentIdx = animMarkerIndexRef.current.get(am.id) ?? 0
        const nextIdx = (currentIdx + 1) % routePath.length
        animMarkerIndexRef.current.set(am.id, nextIdx)
        marker.setLatLng(routePath[nextIdx])
      }, speed)

      animIntervalsRef.current.set(am.id, interval)
    })

    return () => {
      animIntervalsRef.current.forEach((interval) => clearInterval(interval))
      animIntervalsRef.current.clear()
      animMarkerInstancesRef.current.forEach((m) => m.remove())
      animMarkerInstancesRef.current.clear()
      animMarkerIndexRef.current.clear()
    }
  }, [routes, animatedMarkers, routingQueries])

  return <div ref={mapRef} className={`w-full h-full min-h-[300px] ${className}`} />
}

// ─── Synchronous Icon Factories (safe: only called client-side) ────────────────

export function createIcon(color: string, icon: string, size = 32) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.5}px;color:white;font-weight:bold;
    ">${icon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

export function createPulsingIcon(color: string, size = 20) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size * 3}px;height:${size * 3}px;">
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:${size}px;height:${size}px;
          background:${color};border-radius:50%;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          z-index:2;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:${size * 3}px;height:${size * 3}px;
          background:${color};border-radius:50%;opacity:0.3;
          animation:pulse-ring 2s ease-out infinite;
          z-index:1;
        "></div>
      </div>
    `,
    iconSize: [size * 3, size * 3],
    iconAnchor: [size * 1.5, size * 1.5],
    popupAnchor: [0, -size * 1.5],
  })
}

export function createCircleMarker(lat: number, lng: number, radius: number, color: string, fillColor: string, fillOpacity = 0.2, strokeOpacity = 1) {
  return L.circle([lat, lng], {
    radius,
    color,
    fillColor,
    fillOpacity,
    weight: 2,
    opacity: strokeOpacity,
  })
}

/** Create a tactical vector-style marker with a symbol and hovering label */
export function createTacticalMarker(symbol: string, color: string, label: string, size = 36) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${size}px;height:${size + 20}px;">
        <div style="
          position:absolute;bottom:0;left:50%;transform:translateX(-50%);
          width:${size}px;height:${size}px;
          background:${color};
          border:3px solid white;
          border-radius:4px;
          box-shadow:0 2px 10px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:${size * 0.45}px;
          z-index:2;
        ">${symbol}</div>
        <div style="
          position:absolute;top:0;left:50%;transform:translateX(-50%);
          white-space:nowrap;
          background:${color};
          color:white;
          font-size:10px;
          font-weight:700;
          padding:2px 6px;
          border-radius:4px 4px 0 0;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
          font-family:system-ui,sans-serif;
          z-index:3;
        ">${label}</div>
      </div>
    `,
    iconSize: [size, size + 20],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size - 20],
  })
}
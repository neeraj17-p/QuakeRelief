'use client'

/**
 * Icon factory functions for Leaflet maps.
 * Uses lazy import of leaflet to avoid SSR issues.
 * All functions cache the L module after first call.
 */

let _L: any = null
let _loading = false
let _pendingResolvers: Array<(L: any) => void> = []

async function getL(): Promise<any> {
  if (_L) return _L
  if (_loading) {
    return new Promise(resolve => _pendingResolvers.push(resolve))
  }
  _loading = true
  try {
    const mod = await import('leaflet')
    _L = mod.default
    _pendingResolvers.forEach(r => r(_L))
    _pendingResolvers = []
    return _L
  } finally {
    _loading = false
  }
}

// Synchronous getter — L must already be loaded (safe after first await getL())
function getLSync(): any {
  return _L
}

export function createIcon(color: string, icon: string, size = 32): any {
  const L = getLSync()
  if (!L) return undefined
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

export function createPulsingIcon(color: string, size = 20): any {
  const L = getLSync()
  if (!L) return undefined
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

export function createCircleMarker(lat: number, lng: number, radius: number, color: string, fillColor: string, fillOpacity = 0.2): any {
  const L = getLSync()
  if (!L) return undefined
  return L.circle([lat, lng], {
    radius,
    color,
    fillColor,
    fillOpacity,
    weight: 2,
  })
}

/**
 * Pre-loads the leaflet module. Call this early in client-side code
 * to ensure icon factories work synchronously afterward.
 */
export async function preloadLeaflet(): Promise<void> {
  await getL()
}
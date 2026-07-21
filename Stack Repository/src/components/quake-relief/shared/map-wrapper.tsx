'use client'

import dynamic from 'next/dynamic'

// Dynamically import the actual map component to avoid SSR issues with Leaflet (needs `window`)
const MapInner = dynamic(
  () => import('./map-inner'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 mx-auto rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
          <p className="text-xs text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
)

export interface MapWrapperProps {
  center: [number, number]
  zoom?: number
  className?: string
  /** Custom tile layer URL or preset key ('dark' for CartoDB DarkMatter). Falls back to OSM. */
  tileUrl?: string
  onMapReady?: (map: any) => void
  onMapClick?: (lat: number, lng: number) => void
  markers?: Array<{
    position: [number, number]
    icon?: any
    popup?: string
  }>
  /** Polylines rendered on the map */
  routes?: Array<{
    id: string
    path: [number, number][]
    color: string
    weight?: number
    dashArray?: string
    opacity?: number
  }>
  /** Markers that animate along a route */
  animatedMarkers?: Array<{
    id: string
    routeId: string
    speed?: number
    icon?: any
    label?: string
  }>
  /** Dynamic OSRM street routing queries */
  routingQueries?: Array<{
    id: string
    from: [number, number]
    to: [number, number]
    color?: string
    weight?: number
  }>
  /** Called when a route is calculated with real path coordinates */
  onRouteCalculated?: (id: string, path: [number, number][]) => void
  /** Programmatically pan the map to a specific coordinate */
  panTo?: [number, number] | null
  /** Programmatically set zoom level */
  setZoom?: number | null
}

export default function MapWrapper(props: MapWrapperProps) {
  return <MapInner {...props} />
}

export type { MapWrapperProps }
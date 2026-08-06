import { NextRequest, NextResponse } from 'next/server'

// ── Types ────────────────────────────────────────────────────────────────────

export interface TeamState {
  id: string
  name: string
  unitType: string
  status: string // STANDBY | DISPATCHED | EN_ROUTE | ON_SITE | RESOLVED | AVAILABLE
  latitude: number
  longitude: number
  baseLatitude: number  // Home / base coordinates
  baseLongitude: number
  members: number
  assignedIncidentId: string | null
  updatedAt: number
}

export interface ObstacleRecord {
  id: string
  type: string // 'LANDSLIDE' | 'ROAD_BLOCK' | 'DEBRIS'
  latitude: number
  longitude: number
  placedBy: string
  createdAt: number
  geojson: { type: 'Point'; coordinates: [number, number] }
}

export interface BroadcastRecord {
  id: string
  header: string
  message: string
  severity: 'advisory' | 'alert' | 'evacuate'
  channel: 'public' | 'tactical' | 'interagency'
  sentBy: string
  createdAt: number
}

export interface SharedState {
  teams: TeamState[]
  obstacles: ObstacleRecord[]
  broadcasts: BroadcastRecord[]
  lastUpdated: number
}

// ── Geofence bounds ──────────────────────────────────────────────────────────

const GEOFENCE = {
  latMin: 18.35,
  latMax: 18.45,
  lngMin: 76.5,
  lngMax: 76.65,
} as const

function isWithinGeofence(lat: number, lng: number): boolean {
  return (
    lat >= GEOFENCE.latMin &&
    lat <= GEOFENCE.latMax &&
    lng >= GEOFENCE.lngMin &&
    lng <= GEOFENCE.lngMax
  )
}

// ── Incident lookup (in-memory mirror for dispatch routing) ─────────────────

interface MiniIncident {
  id: string
  latitude: number
  longitude: number
  priority: string
  type: string
  description: string | null
  status: string
  assignedTo: string | null
}

const SEED_INCIDENTS: MiniIncident[] = [
  { id: 'inc-001', latitude: 18.4050, longitude: 76.5740, priority: 'CRITICAL', type: 'COLLAPSE', description: 'Multi-story residential building collapsed near Ganj Golai market area, Latur', status: 'VERIFIED', assignedTo: 'NDRF-Team-Alpha' },
  { id: 'inc-002', latitude: 18.3500, longitude: 76.5000, priority: 'HIGH', type: 'LANDSLIDE', description: 'Major landslide blocking Ausa road highway route near Wadwal Nagnath', status: 'VERIFIED', assignedTo: 'SDRF-Battalion-3' },
  { id: 'inc-003', latitude: 18.4120, longitude: 76.5800, priority: 'CRITICAL', type: 'MEDICAL', description: 'Multiple casualties reported at Shivaji Nagar market area, Latur', status: 'IN_PROGRESS', assignedTo: 'MEDICAL-Team-1' },
  { id: 'inc-004', latitude: 18.3800, longitude: 76.5550, priority: 'HIGH', type: 'ROAD_BLOCK', description: 'Road structural crack near Ganj Golai market area, Latur-Ausa highway', status: 'VERIFIED', assignedTo: null },
  { id: 'inc-005', latitude: 18.4350, longitude: 76.6200, priority: 'HIGH', type: 'COLLAPSE', description: 'School building partially collapsed in Renapur village', status: 'PENDING', assignedTo: null },
  { id: 'inc-006', latitude: 18.3980, longitude: 76.5700, priority: 'HIGH', type: 'FIRE', description: 'Gas cylinder explosion causing fire in residential colony, Old City Latur', status: 'HIGHLY_PROBABLE', assignedTo: null },
  { id: 'inc-007', latitude: 18.0750, longitude: 76.6250, priority: 'MEDIUM', type: 'MEDICAL', description: 'Elderly patient trapped under debris in Killari village', status: 'PENDING', assignedTo: null },
  { id: 'inc-008', latitude: 18.4030, longitude: 76.5780, priority: 'CRITICAL', type: 'COLLAPSE', description: 'Temple structure damaged near Latur city, devotees reported trapped', status: 'VERIFIED', assignedTo: 'NDRF-Team-Alpha' },
]

let incidents = [...SEED_INCIDENTS]

// ── Initial seed data ────────────────────────────────────────────────────────

const SEED_TEAMS: TeamState[] = [
  {
    id: 'NDRF-Team-Alpha',
    name: 'NDRF Team Alpha',
    unitType: 'NDRF',
    status: 'EN_ROUTE',
    latitude: 18.4120,
    longitude: 76.5650,
    baseLatitude: 18.4120,
    baseLongitude: 76.5650,
    members: 12,
    assignedIncidentId: 'inc-001',
    updatedAt: Date.now(),
  },
  {
    id: 'SDRF-Battalion-3',
    name: 'SDRF Battalion 3',
    unitType: 'SDRF',
    status: 'ON_SITE',
    latitude: 18.3500,
    longitude: 76.5000,
    baseLatitude: 18.3600,
    baseLongitude: 76.5100,
    members: 8,
    assignedIncidentId: 'inc-002',
    updatedAt: Date.now(),
  },
  {
    id: 'MEDICAL-Team-1',
    name: 'Medical Team 1',
    unitType: 'MEDICAL',
    status: 'ON_SITE',
    latitude: 18.4120,
    longitude: 76.5800,
    baseLatitude: 18.4180,
    baseLongitude: 76.5900,
    members: 6,
    assignedIncidentId: 'inc-003',
    updatedAt: Date.now(),
  },
  {
    id: 'FIRE-Station-Latur',
    name: 'Fire Station Latur',
    unitType: 'FIRE',
    status: 'STANDBY',
    latitude: 18.4060,
    longitude: 76.5760,
    baseLatitude: 18.4060,
    baseLongitude: 76.5760,
    members: 10,
    assignedIncidentId: null,
    updatedAt: Date.now(),
  },
  {
    id: 'DISTRICT-POLICE-QR',
    name: 'District Police Quick Response',
    unitType: 'POLICE',
    status: 'STANDBY',
    latitude: 18.4100,
    longitude: 76.5800,
    baseLatitude: 18.4100,
    baseLongitude: 76.5800,
    members: 15,
    assignedIncidentId: null,
    updatedAt: Date.now(),
  },
  {
    id: 'ARMY-Engineering-Corps',
    name: 'Army Engineering Corps',
    unitType: 'ARMY',
    status: 'STANDBY',
    latitude: 18.4250,
    longitude: 76.5950,
    baseLatitude: 18.4250,
    baseLongitude: 76.5950,
    members: 20,
    assignedIncidentId: null,
    updatedAt: Date.now(),
  },
]

// ── Seed broadcasts ─────────────────────────────────────────────────────────

const SEED_BROADCASTS: BroadcastRecord[] = [
  {
    id: 'bcast-seed-001',
    header: 'Earthquake Alert',
    message: 'A 6.2 magnitude earthquake has struck Latur district. Stay calm and move to open areas.',
    severity: 'evacuate',
    channel: 'public',
    sentBy: 'SYSTEM',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'bcast-seed-002',
    header: 'Hospital Overload Warning',
    message: 'Yashwantrao Chavan Rural Hospital at 96% capacity. All non-critical cases divert to Vilasrao Deshmukh Medical College.',
    severity: 'alert',
    channel: 'tactical',
    sentBy: 'SEOC-Admin',
    createdAt: Date.now() - 2700000,
  },
  {
    id: 'bcast-seed-003',
    header: 'Aftershock Warning',
    message: 'Seismologists predict M4-5 aftershocks in next 12 hours. All teams maintain alert.',
    severity: 'advisory',
    channel: 'interagency',
    sentBy: 'SEOC-Admin',
    createdAt: Date.now() - 1800000,
  },
]

// ── In-memory state (module-scoped, persists across requests in dev) ─────────

let sharedState: SharedState = {
  teams: [...SEED_TEAMS],
  obstacles: [],
  broadcasts: [...SEED_BROADCASTS],
  lastUpdated: Date.now(),
}

// ── GET: Return full shared state ────────────────────────────────────────────

export async function GET() {
  return NextResponse.json(sharedState)
}

// ── POST: Mutate shared state via action-based dispatch ──────────────────────

type StateAction =
  | { action: 'updateTeam'; payload: Partial<TeamState> & { id?: string; name?: string } }
  | {
      action: 'addObstacle'
      payload: { latitude: number; longitude: number; type: string; placedBy: string }
    }
  | { action: 'clearObstacles' }
  | {
      action: 'dispatchTeam'
      payload: { teamId: string; incidentId: string }
    }
  | {
      action: 'sendBroadcast'
      payload: {
        header: string
        message: string
        severity: 'advisory' | 'alert' | 'evacuate'
        channel: 'public' | 'tactical' | 'interagency'
        sentBy: string
      }
    }
  | {
      action: 'updateIncident'
      payload: { id: string; status?: string; assignedTo?: string | null }
    }

export async function POST(req: NextRequest) {
  try {
    const body: StateAction = await req.json()
    const { action } = body

    switch (action) {
      // ── updateTeam ───────────────────────────────────────────────────
      case 'updateTeam': {
        const { id, name, ...updates } = body.payload
        if (!id && !name) {
          return NextResponse.json(
            { error: 'Either team id or name is required' },
            { status: 400 },
          )
        }

        const teamIndex = sharedState.teams.findIndex(
          (t) => t.id === id || t.name === name,
        )
        if (teamIndex === -1) {
          return NextResponse.json(
            { error: `Team not found (id=${id ?? 'n/a'}, name=${name ?? 'n/a'})` },
            { status: 404 },
          )
        }

        const existing = sharedState.teams[teamIndex]
        sharedState.teams[teamIndex] = {
          ...existing,
          ...updates,
          id: existing.id,
          name: existing.name,
          baseLatitude: existing.baseLatitude,
          baseLongitude: existing.baseLongitude,
          updatedAt: Date.now(),
        }
        sharedState.lastUpdated = Date.now()

        return NextResponse.json({
          success: true,
          team: sharedState.teams[teamIndex],
        })
      }

      // ── addObstacle ──────────────────────────────────────────────────
      case 'addObstacle': {
        const { latitude, longitude, type, placedBy } = body.payload

        if (latitude === undefined || longitude === undefined || !type || !placedBy) {
          return NextResponse.json(
            { error: 'latitude, longitude, type, and placedBy are required' },
            { status: 400 },
          )
        }

        const validTypes = ['LANDSLIDE', 'ROAD_BLOCK', 'DEBRIS']
        if (!validTypes.includes(type)) {
          return NextResponse.json(
            { error: `Invalid obstacle type. Must be one of: ${validTypes.join(', ')}` },
            { status: 400 },
          )
        }

        if (!isWithinGeofence(latitude, longitude)) {
          return NextResponse.json(
            {
              error: `Coordinates (${latitude}, ${longitude}) are outside the operational geofence. ` +
                `Valid range: Lat ${GEOFENCE.latMin}–${GEOFENCE.latMax}, Long ${GEOFENCE.lngMin}–${GEOFENCE.lngMax}`,
            },
            { status: 400 },
          )
        }

        const obstacle: ObstacleRecord = {
          id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          latitude,
          longitude,
          placedBy,
          createdAt: Date.now(),
          geojson: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        }

        sharedState.obstacles.push(obstacle)
        sharedState.lastUpdated = Date.now()

        return NextResponse.json({ success: true, obstacle })
      }

      // ── clearObstacles ───────────────────────────────────────────────
      case 'clearObstacles': {
        const count = sharedState.obstacles.length
        sharedState.obstacles = []
        sharedState.lastUpdated = Date.now()

        return NextResponse.json({ success: true, cleared: count })
      }

      // ── dispatchTeam: STANDBY → EN_ROUTE with incident binding ───────
      case 'dispatchTeam': {
        const { teamId, incidentId } = body.payload

        if (!teamId || !incidentId) {
          return NextResponse.json(
            { error: 'teamId and incidentId are required' },
            { status: 400 },
          )
        }

        const teamIndex = sharedState.teams.findIndex((t) => t.id === teamId)
        if (teamIndex === -1) {
          return NextResponse.json(
            { error: `Team not found: ${teamId}` },
            { status: 404 },
          )
        }

        const team = sharedState.teams[teamIndex]
        if (team.status !== 'STANDBY' && team.status !== 'AVAILABLE') {
          return NextResponse.json(
            { error: `Team ${teamId} is not in STANDBY/AVAILABLE status (current: ${team.status}). Cannot dispatch.` },
            { status: 409 },
          )
        }

        const incident = incidents.find((i) => i.id === incidentId)
        if (!incident) {
          return NextResponse.json(
            { error: `Incident not found: ${incidentId}` },
            { status: 404 },
          )
        }

        // Update team status to EN_ROUTE, bind incident coords
        sharedState.teams[teamIndex] = {
          ...team,
          status: 'EN_ROUTE',
          assignedIncidentId: incidentId,
          // Position stays at base until ON_SITE arrival snap
          latitude: team.baseLatitude,
          longitude: team.baseLongitude,
          updatedAt: Date.now(),
        }

        // Update incident assignment
        const incIndex = incidents.findIndex((i) => i.id === incidentId)
        if (incIndex !== -1) {
          incidents[incIndex] = {
            ...incidents[incIndex],
            assignedTo: teamId,
            status: 'IN_PROGRESS',
          }
        }

        sharedState.lastUpdated = Date.now()

        return NextResponse.json({
          success: true,
          team: sharedState.teams[teamIndex],
          incident,
        })
      }

      // ── sendBroadcast: multi-channel broadcast dispatch ──────────────
      case 'sendBroadcast': {
        const { header, message, severity, channel, sentBy } = body.payload

        if (!header?.trim() || !message?.trim()) {
          return NextResponse.json(
            { error: 'header and message are required' },
            { status: 400 },
          )
        }

        if (!['advisory', 'alert', 'evacuate'].includes(severity)) {
          return NextResponse.json(
            { error: 'severity must be advisory, alert, or evacuate' },
            { status: 400 },
          )
        }

        if (!['public', 'tactical', 'interagency'].includes(channel)) {
          return NextResponse.json(
            { error: 'channel must be public, tactical, or interagency' },
            { status: 400 },
          )
        }

        const broadcast: BroadcastRecord = {
          id: `bcast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          header: header.trim(),
          message: message.trim().slice(0, 250),
          severity: severity as BroadcastRecord['severity'],
          channel: channel as BroadcastRecord['channel'],
          sentBy: sentBy || 'SEOC-Admin',
          createdAt: Date.now(),
        }

        sharedState.broadcasts.unshift(broadcast)
        // Keep max 50 broadcasts
        if (sharedState.broadcasts.length > 50) {
          sharedState.broadcasts = sharedState.broadcasts.slice(0, 50)
        }
        sharedState.lastUpdated = Date.now()

        return NextResponse.json({ success: true, broadcast })
      }

      // ── updateIncident: modify incident status/assignment ────────────
      case 'updateIncident': {
        const { id, status, assignedTo } = body.payload

        if (!id) {
          return NextResponse.json(
            { error: 'incident id is required' },
            { status: 400 },
          )
        }

        const incIndex = incidents.findIndex((i) => i.id === id)
        if (incIndex === -1) {
          return NextResponse.json(
            { error: `Incident not found: ${id}` },
            { status: 404 },
          )
        }

        if (status !== undefined) incidents[incIndex].status = status
        if (assignedTo !== undefined) incidents[incIndex].assignedTo = assignedTo

        sharedState.lastUpdated = Date.now()

        return NextResponse.json({ success: true, incident: incidents[incIndex] })
      }

      // ── Unknown action ───────────────────────────────────────────────
      default:
        return NextResponse.json(
          {
            error: `Unknown action: "${(action as string) ?? 'undefined'}". ` +
              'Valid actions: updateTeam, addObstacle, clearObstacles, dispatchTeam, sendBroadcast, updateIncident',
          },
          { status: 400 },
        )
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
# QuakeRelief
**Real-time Earthquake Disaster Intelligence & Coordination Platform**

> 🏆 **HACK4HUMANITY** — [Visit hackathon](https://hack4humanity.brainallianz.org/)

An AI-augmented, multi-portal situational awareness system that bridges citizens, field rescue squads, and SEOC command centres during earthquake emergencies — delivering verified incident intelligence, live tactical mapping, fleet coordination, and automated priority ranking from a single unified dashboard.

---

## The Problem

India sits in one of the world's most seismically active zones. When a major earthquake strikes, the first 72 hours are critical — yet emergency response is hampered by:

- **Information chaos** — citizen reports, social media, and government feeds flood in simultaneously with no triage mechanism
- **Slow verification** — SEOC analysts manually cross-reference each report against multiple sources before acting
- **Coordination gaps** — field teams have no unified view of incidents, resources, or each other's positions
- **No public-facing channel** — affected citizens lack real-time safety information, resource locations, or check-in tools
- **Resource blindness** — hospitals and relief camps reach capacity without central tracking, causing critical bottlenecks

QuakeRelief addresses every one of these failure points.

---

## The Solution

QuakeRelief is a **Proof-of-Concept web application** that simulates a complete earthquake emergency operations workflow — from the moment a 6.2 magnitude earthquake strikes Latur district, Maharashtra, through the first critical hours of multi-agency response.

The platform provides **three role-based portals** served from a single Next.js application:

| Portal | Users | Purpose |
|--------|-------|---------|
| **Citizen Safety** | Affected public | Report incidents, locate resources, safety check-in, live alerts |
| **Rescue Operations** | Field squads (NDRF, SDRF, Fire, Medical, Police, Army) | Tactical map with routing, mission progress, incident queue |
| **SEOC Command Centre** | Emergency operations administrators | GIS command map, fleet dispatch, verification pipeline, AI intelligence, multi-channel broadcast |

All three portals share a **real-time synchronized state** — when an admin dispatches a team, the rescue squad's portal updates within 800ms. When a citizen reports an incident, it flows into the admin's verification pipeline.

---

## Key Features

### Public Portal
- **Live alert banner** with severity-coded emergency notifications
- **Interactive incident map** with type-coded markers (collapse, fire, landslide, flood, medical, road block)
- **Citizen incident reporting** with automatic spatiotemporal clustering (nearby reports auto-escalate to HIGHLY_PROBABLE)
- **Resource locator** — hospitals, relief camps, water points, shelters, medical camps with live capacity bars
- **Safety check-in system** — citizens mark themselves SAFE or NEEDS_ASSISTANCE
- **Animated metric counters** — total incidents, verified, active alerts, deployed teams

### Rescue Portal (Field Operations)
- **Role-based squad authentication** with real-time status preview (pulled from shared state)
- **Tactical Leaflet map** with:
  - Priority-driven radar circles (CRITICAL=250m, HIGH=150m, MEDIUM/LOW=75m) per incident
  - Type-based color coding (red=collapse, pink=medical, orange=landslide, yellow=road block, red=fire, blue=flood)
  - Pulsing squad position marker with EN_ROUTE blue dot tracking
  - OSRM-powered street-grid routing polylines from squad position to assigned incident
  - Other team markers with unit-type icons
  - Epicenter pulsing marker
- **Mission progress tracker** — 5-stage milestone meter (STANDBY → DISPATCHED → EN_ROUTE → ON_SITE → RESOLVED)
- **Incident queue** with accept-task, route-to-incident, and arrive-on-site actions
- **Resource proximity cards** showing nearest hospitals, relief camps, water points

### SEOC Command Centre (Admin)
- **Operational overview** — 4 live metric cards (Total Incidents, Verified, Active Alerts, Deployed Teams) that update dynamically
- **Data verification pipeline** — multi-tier verification system (TIER_1: Government/NCS/IMD, TIER_2: Citizen clusters, TIER_3: Social media) with Verify/Reject buttons that persist via API and recompute metrics in real-time
- **GIS command map** with:
  - Fleet sidebar with team status badges and per-team dispatch dropdowns
  - Map filter tabs (All / Incidents / Teams / Resources)
  - Auto-routing polylines for all EN_ROUTE teams
  - Tactical team labels for active units
- **Incident timeline** — chronological event log with priority-coded entries
- **Activity timeline** — full operational log from earthquake detection to current status
- **Command broadcast module** — multi-channel broadcast (Public Safety / Tactical Order / Inter-Agency) with severity selection (Advisory / Alert / Evacuate), template shortcuts, and message history
- **AI intelligence summary** — 3-agent AI analysis (Situation Report, Priority Ranking, Action Recommendations) with full reasoning traces
- **Analytics dashboard** — interactive Recharts visualizations (incident type distribution, priority breakdown, verification funnel, resource utilization)

### Cross-Cutting
- **Real-time state synchronization** via action-based API dispatch + 800ms polling
- **Zustand global store** for auth, role, squad session state
- **Dynamic dark/light theme** via next-themes
- **Responsive design** — mobile-first with Tailwind CSS breakpoints
- **Animated counters, skeleton loaders, and toast notifications** throughout

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, SSR/Hydration) |
| **Language** | TypeScript 5 (strict mode) |
| **Frontend** | React 19 |
| **Styling** | Tailwind CSS 4 + tailwindcss-animate |
| **UI Components** | shadcn/ui (New York style, 60+ components) |
| **Icons** | Lucide React |
| **State Management** | Zustand (client state), TanStack Query (server state) |
| **Mapping** | Leaflet 1.9 + react-leaflet, OpenStreetMap tiles |
| **Routing** | OSRM (Open Source Routing Machine) via self-hosted API |
| **Charts** | Recharts 2 |
| **Forms** | React Hook Form + Zod validation |
| **Database ORM** | Prisma 6 (SQLite) |
| **Database** | SQLite (file-based) |
| **Real-time** | Socket.IO client, polling-based shared state API |
| **Animations** | Framer Motion 12 |
| **Notifications** | Sonner (toast system) |
| **Theming** | next-themes (dark/light mode) |
| **Package Manager** | Bun |
| **Linting** | ESLint 9 + eslint-config-next |

---

## Proof of Concept

The PoC simulates the **Latur District Earthquake (M6.2)** — a realistic scenario based on the 1993 Killari earthquake zone:

- **Epicentre**: 18.07°N, 76.62°E (Killari, Latur district, Maharashtra, India)
- **Simulated time**: T+2 hours post-earthquake
- **8 pre-seeded incidents** across 6 types (3 collapses, 1 landslide, 2 medical, 1 road block, 1 fire)
- **6 rescue teams** (NDRF, SDRF, Medical, Fire, Police, Army) with varied statuses
- **10 resource locations** (hospitals, relief camps, water points, shelters, medical camps, warehouses)
- **8 verification entries** across 3 tiers with confidence scores
- **3 AI agent outputs** (Situation, Priority, Recommendations) with full reasoning chains
- **4 active alerts** (CRITICAL, EVACUATION, WARNING) targeted by role
- **12 API endpoints** for incidents, resources, verifications, alerts, state, routing, broadcast, field updates, safety check-in, agents, and seeding

### What the PoC Demonstrates

1. **End-to-end incident lifecycle** — citizen report → spatiotemporal clustering → admin verification → squad dispatch → field routing → on-site arrival → resolution
2. **Real-time cross-portal synchronization** — admin dispatches a team, rescue portal updates in < 1 second
3. **Multi-tier data verification** with human-in-the-loop confirmation
4. **Street-grid-accurate routing** via OSRM (no straight-line fallbacks)
5. **AI-augmented decision support** with transparent reasoning traces
6. **Multi-channel broadcast** from a single command centre

---

## How to Run Locally (⚠️ Known Setup Notes (errors) that we are working on 🏗️)

- **Tailwind v4 Styling on Windows/Bun:** Depending on your local environment and bundler (Next.js Turbopack), custom CSS `@import` rules for `tw-animate-css` may fail to resolve automatically. 
- **Workaround:** If styles do not render on initial startup, ensure PostCSS dependencies are linked or temporarily bypass `@import "tw-animate-css";` in `src/app/globals.css`.)

### Prerequisites

- **Bun** (v1.3+) — [install](https://bun.sh)
- **Git**
- No Node.js required (Bun includes its own runtime)

### Installation

```bash
# Clone the repository
git clone https://github.com/neeraj17-p/QuakeRelief
cd QuakeRelief

# Install dependencies
bun install

# Push database schema (creates SQLite DB at db/custom.db)
bun run db:push

# (Optional) Seed the database with PoC data
curl -s http://localhost:3000/api/seed  # After starting dev server
```

### Run

```bash
# Start development server (port 3000)
bun run dev
```

The application will be available at `http://localhost:3000`.

### Quick Tour

1. Open `http://localhost:3000` — you'll see the track selection screen
2. **Citizen Safety** — no login required, immediately shows the public portal with map, alerts, resources, and safety check-in
3. **Rescue Operations** — select a squad (e.g., NDRF Team Alpha), authenticate to enter the tactical map with routing and incident queue
4. **SEOC Command Centre** — click to enter the full admin dashboard with verification pipeline, fleet dispatch, AI intelligence, and analytics

### Lint

```bash
bun run lint
```

## Demo

- 🎥 Video : [Demo_vid](https://drive.google.com/file/d/1ZIXYGRB_lUqPtsrPFupfsv48LQitOH09/view?usp=sharing)
---

## Project Structure

```
src/
├── app/
|   ├── globals.css
│   ├── layout.tsx              # Root layout with Toaster
│   ├── page.tsx                # Main entry — role router, WebSocket, alert polling
│   └── api/
│       ├── incidents/route.ts  # CRUD + spatiotemporal clustering
│       ├── resources/route.ts  # Resource listing
│       ├── verification/route.ts  # GET list + PATCH verify/reject
│       ├── alerts/route.ts     # Role-filtered alerts
│       ├── state/route.ts      # Shared state API (teams, obstacles, broadcasts)
│       ├── route/route.ts      # OSRM proxy with retry logic
│       ├── broadcast/route.ts  # Broadcast persistence
│       ├── field-update/route.ts   # Field team updates
│       ├── safety-check/route.ts   # Citizen safety check-in
│       ├── agents/route.ts    # AI agent outputs
│       └── seed/route.ts       # Database seeding
├── components/
│   ├── quake-relief/
│   │   ├── public/public-portal.tsx    # Citizen-facing portal (~1550 lines)
│   │   ├── rescue/rescue-portal.tsx    # Field operations portal (~1100 lines)
│   │   ├── admin/admin-portal.tsx      # SEOC command centre (~1160 lines)
│   │   └── shared/
│   │       ├── auth-gate.tsx           # Role selection + squad auth
│   │       ├── map-inner.tsx           # Leaflet map core (routing, polylines, markers)
│   │       ├── map-wrapper.tsx         # Dynamic import wrapper (SSR-safe)
│   │       ├── analytics-charts.tsx    # Recharts dashboard
│   │       ├── live-feed.tsx           # Real-time alert feed
│   │       ├── navbar.tsx / locked-navbar.tsx / footer.tsx
│   │       ├── icon-factories.ts      # Leaflet DivIcon factories
│   │       └── incident-detail-sheet.tsx
│   └── ui/                       # 60+ shadcn/ui components
├── hooks/
│   ├── use-shared-state.ts     # Cross-portal real-time state (800ms polling)
│   ├── use-quake-ws.ts         # WebSocket connection for live alerts
│   ├── use-gps.ts              # Geolocation API hook
│   └── use-animated-counter.ts
├── store/
│   └── app-store.ts            # Zustand global store (auth, role, squad state)
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── mock-data.ts            # PoC seed data (Latur earthquake scenario)
│   ├── route-utils.ts          # OSRM routing utilities
│   └── utils.ts                # Tailwind merge helper
prisma/
└── schema.prisma               # 8 models (EarthquakeEvent, Incident, FieldUpdate, Alert, VerificationEntry, Resource, SafetyCheckIn, AgentOutput, RescueTeam)
```

---

## Database Schema

The application uses **8 interconnected models** in SQLite via Prisma:

- **EarthquakeEvent** — seismic event metadata (magnitude, depth, epicentre, source)
- **Incident** — field reports with type, priority, verification tier, spatiotemporal clustering
- **FieldUpdate** — status progression logs per incident (EN_ROUTE, ON_SITE, RESOLVED)
- **Alert** — emergency notifications with severity and role-based targeting
- **VerificationEntry** — multi-source data triage with confidence scores and admin review
- **Resource** — critical infrastructure (hospitals, camps, shelters, water points)
- **SafetyCheckIn** — citizen safety status (SAFE / NEEDS_ASSISTANCE) with GPS
- **AgentOutput** — AI-generated intelligence (situation, priority, recommendations) with reasoning traces
- **RescueTeam** — squad registry with status, position, and assignment

---

## Challenges

- **Leaflet SSR compatibility** — Leaflet requires the `window` object. Solved via `next/dynamic` with `ssr: false` and a preloading strategy using `icon-factories.ts`
- **Cross-portal real-time sync without WebSocket** — Achieved via an action-based shared state API (`/api/state`) with 800ms polling and optimistic local updates
- **OSRM routing reliability** — Self-hosted OSRM can fail under load. Implemented 3-tier exponential backoff retry (1s, 2s, 4s) with strict no-fallback policy (no straight lines)
- **Map timing race conditions** — Hazard circles must draw after the Leaflet map instance is available. Solved via `mapReady` state guard in useEffect dependency arrays
- **Template literal syntax errors in className** — Tailwind classes inside JS template literals must be properly quoted to avoid `ReferenceError`

---

## Future Scope

- [ ] **WebSocket migration** — Replace polling with Socket.IO server for true real-time sync
- [ ] **AI verification agent** — LLM-powered automatic verification of citizen reports
- [ ] **Mobile PWA** — Offline-capable progressive web app for field teams
- [ ] **Aftershock prediction** — Real-time seismological data feed with probability alerts
- [ ] **Drone imagery integration** — Aerial damage assessment overlay on the GIS map
- [ ] **Multi-event support** — Handle concurrent earthquakes across different districts
- [ ] **NDMA/SDMA API integration** — Connect to India's national disaster management APIs
- [ ] **Voice broadcast** — TTS-generated emergency announcements for illiterate populations
- [ ] **Multi-language** — Marathi and Hindi localization via next-intl (already in dependencies)
- [ ] **Exportable reports** — PDF/CSV incident and verification reports for government submissions

---

## License

This project is developed as a Proof-of-Concept for disaster management research. Contact the maintainers for licensing details.

---

## Team

| Name | 
|------|
| Dakh Shinde | 
| Tanmay Patil | 
| Tanmay Dahake |
| Neeraj Piralkar |


## Acknowledgements

- **National Disaster Management Authority (NDMA), India** — for operational workflows and verification tier concepts
- **National Centre for Seismology (NCS)** — for earthquake data protocols
- **OpenStreetMap contributors** — for map tile data
- **Open Source Routing Machine (OSRM)** — for street-level routing
- **Leaflet** — for the mapping engine
- **shadcn/ui** — for the component library

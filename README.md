# QuakeRelief

<p align="center">
  <strong>Real-time Earthquake Disaster Intelligence & Coordination Platform</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-New_York-18181b" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Bun-Runtime-orange?logo=bun" alt="Bun" />
  <img src="https://img.shields.io/badge/SQLite-Prisma-47a248?logo=sqlite&logoColor=white" alt="Prisma + SQLite" />
  <img src="https://img.shields.io/badge/i18n-3_Languages-purple" alt="i18n (en/hi/mr)" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## Overview

QuakeRelief is an **AI-augmented, multi-portal disaster intelligence system** that bridges citizens, field rescue squads, and SEOC (State Emergency Operations Centre) command centres during earthquake emergencies.

It delivers **verified incident intelligence, live tactical mapping, fleet coordination, multilingual voice + text alerts, and automated AI-powered triage** — all from a single unified web application.

---

## The Problem

India sits in one of the world's most seismically active zones. When a major earthquake strikes, the first 72 hours are critical — yet emergency response is hampered by:

- **Information chaos** — citizen reports, social media, and government feeds flood in simultaneously with no triage mechanism
- **Slow verification** — SEOC analysts manually cross-reference each report against multiple sources before acting
- **Coordination gaps** — field teams have no unified view of incidents, resources, or each other's positions
- **No public-facing channel** — affected citizens lack real-time safety information, resource locations, or check-in tools
- **Language barriers** — emergency alerts must reach populations speaking Hindi, Marathi, and English
- **Resource blindness** — hospitals and relief camps reach capacity without central tracking, causing critical bottlenecks

QuakeRelief addresses every one of these failure points.

---

## The Solution

QuakeRelief simulates a complete earthquake emergency operations workflow — from the moment a **M6.2 earthquake strikes Latur district, Maharashtra**, through the first critical hours of multi-agency response.

The platform provides **three role-based portals** served from a single Next.js application:

| Portal | Users | Purpose |
|--------|-------|--------|
| **Citizen Safety** | Affected public | Report incidents, locate resources, safety check-in, SOS, live alerts, people finder |
| **Rescue Operations** | Field squads (NDRF, SDRF, Fire, Medical, Police, Army) | Tactical map with routing, mission progress, incident queue, voice alerts |
| **SEOC Command Centre** | Emergency ops administrators | GIS command map, fleet dispatch, verification pipeline, AI intelligence, multi-channel voice + text broadcast, analytics |

All three portals share a **real-time synchronized state** via Socket.IO — when an admin dispatches a team, the rescue squad's portal updates within milliseconds. When a citizen reports an incident, it flows into the admin's verification pipeline instantly.

---

## Key Features

### 🏛️ Public Portal (Citizen Safety)
- **Live alert banner** with severity-coded emergency notifications
- **Interactive Leaflet map** with type-coded markers (collapse, fire, landslide, flood, medical, road block)
- **Citizen incident reporting** with automatic spatiotemporal clustering (nearby reports auto-escalate to `HIGHLY_PROBABLE`)
- **Resource locator** — hospitals, relief camps, water points, shelters, medical camps with live capacity bars
- **Safety check-in system** — citizens mark themselves `SAFE` or `NEEDS_ASSISTANCE`
- **People finder** — search and locate checked-in individuals
- **SOS panic button** with emergency contact quick-dial
- **Infrastructure damage reporting** with structured forms
- **Seismic information panel** — event details, aftershock tracker, weather, evacuation zones
- **Animated metric counters** — total incidents, verified, active alerts, deployed teams

### 🚒 Rescue Portal (Field Operations)
- **Role-based squad authentication** with real-time status preview
- **Tactical Leaflet map** with:
  - Priority-driven radar circles (CRITICAL=250m, HIGH=150m, MEDIUM/LOW=75m) per incident
  - Type-based color coding (red=collapse, pink=medical, orange=landslide, yellow=road block, red=fire, blue=flood)
  - Pulsing squad position marker with EN_ROUTE blue dot tracking
  - **Valhalla-powered street-grid routing** polylines (only shown for squads in `EN_ROUTE` status)
  - 3-layer routing fallback: Valhalla API → encoded polyline decode → smooth interpolated path
  - Other team markers with unit-type icons
  - Epicenter pulsing marker
- **Mission progress tracker** — 5-stage milestone meter (STANDBY → DISPATCHED → EN_ROUTE → ON_SITE → RESOLVED)
- **Incident queue** with accept-task, route-to-incident, and arrive-on-site actions
- **Resource proximity cards** showing nearest hospitals, relief camps, water points
- **Voice alert synthesis** — BCP 47 locale-aware TTS (en-IN, hi-IN, mr-IN) for field announcements

### 🎯 SEOC Command Centre (Admin)
- **Operational overview** — 4 live metric cards (Total Incidents, Verified, Active Alerts, Deployed Teams)
- **Data verification pipeline** — multi-tier verification system:
  - **TIER_1**: Government/NCS/IMD sources
  - **TIER_2**: Citizen report clusters
  - **TIER_3**: Social media (Twitter, WhatsApp)
  - Verify button sets status to `VERIFIED` with green badge (stays in queue for audit trail)
- **GIS command map** with:
  - Fleet sidebar with team status badges and per-team dispatch dropdowns
  - Map filter tabs (All / Incidents / Teams / Resources)
  - Auto-routing polylines for `EN_ROUTE` teams only
  - Tactical team labels for active units
- **Command broadcast module** — multi-channel broadcast with:
  - **"Voice + Text Alert"** button — broadcasts text AND triggers `speechSynthesis.speak()` in all 3 portals simultaneously using BCP 47 locale codes
  - **"Send"** button — text-only broadcast
  - Channels: Public Safety / Tactical Order / Inter-Agency
  - Severity: Advisory / Alert / Evacuate
  - Template shortcuts and message history
- **AI intelligence summary** — 3-agent AI analysis (Situation Report, Priority Ranking, Action Recommendations) with full reasoning traces
- **AI-powered report triage** — dual-mode (LLM via z-ai-web-dev-sdk + heuristic keyword-based fallback)
- **Incident timeline** — chronological event log with priority-coded entries
- **Activity timeline** — full operational log from earthquake detection to current status
- **Analytics dashboard** — interactive Recharts visualizations (incident type distribution, priority breakdown, verification funnel, resource utilization)
- **Data export** — API endpoint for incident and verification data export

### ⚡ Cross-Cutting
- **Real-time state synchronization** via two Socket.IO mini-services (event stream + state sync)
- **Zustand global store** for auth, role, squad session state
- **Multilingual support** — English, Hindi (हिन्दी), Marathi (मराठी) via `next-intl` with instant locale switching and `localStorage` persistence
- **Dynamic dark/light theme** via `next-themes`
- **PWA-ready** — service worker, manifest, offline-capable
- **Responsive design** — mobile-first with Tailwind CSS 4 breakpoints
- **Animated counters, skeleton loaders, toast notifications** throughout
- **Voice synthesis** — Web Speech API with BCP 47 locale codes (`en-IN`, `hi-IN`, `mr-IN`) for multilingual emergency announcements

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Next.js (App Router, SSR/Hydration) | 16.x |
| **Language** | TypeScript (strict mode) | 5.x |
| **Frontend** | React | 19.x |
| **Runtime** | Bun | 1.3+ |
| **Styling** | Tailwind CSS + tailwindcss-animate | 4.x |
| **UI Components** | shadcn/ui (New York style) + Radix UI | 60+ components |
| **Icons** | Lucide React | 0.525+ |
| **State Management** | Zustand (client), TanStack Query (server) | 5.x |
| **Mapping** | Leaflet + react-leaflet + leaflet-routing-machine | 1.9+ / 5.0+ |
| **Routing Engine** | Valhalla (OpenStreetMap) with 3-layer fallback | — |
| **Charts** | Recharts | 2.15+ |
| **Forms** | React Hook Form + Zod | 7.60+ / 4.0+ |
| **Database ORM** | Prisma | 6.x |
| **Database** | SQLite | — |
| **Real-time** | Socket.IO (two independent services) | 4.8+ |
| **i18n** | next-intl | 4.3+ |
| **Animations** | Framer Motion | 12.x |
| **Notifications** | Sonner | 2.0+ |
| **Theming** | next-themes (dark/light) | 0.4+ |
| **AI/LLM** | z-ai-web-dev-sdk (triage + intelligence) | 0.0.18+ |
| **Auth** | NextAuth.js | 4.x |
| **Markdown** | react-markdown | 10.x |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Caddy Reverse Proxy                         │
│                    (Single-origin WebSocket routing)                │
└──────────┬──────────────────┬──────────────────┬───────────────────┘
           │                  │                  │
     ┌─────▼──────┐  ┌───────▼──────┐  ┌──────▼──────────┐
     │  Next.js   │  │  Quake WS   │  │  WS Sync       │
     │  :3000     │  │  :3004      │  │  Service :3005  │
     │            │  │             │  │                 │
     │ • SSR/RSC  │  │ • Earthquake│  │ • Dispatch sync │
     │ • 13 APIs  │  │   event     │  │ • Squad location│
     │ • 3 Portals│  │   simulator │  │ • Verification  │
     │ • i18n     │  │ • Role-based│  │ • Incident push │
     └─────┬──────┘  │   alerts    │  │ • State sync    │
           │         └─────────────┘  └──────┬──────────┘
     ┌─────▼──────┐                            │
     │  Prisma    │◄───────────────────────────┘
     │  + SQLite  │
     │  (8 models)│
     └────────────┘
```

### Mini-Services

Two standalone **Bun-powered** Socket.IO microservices handle real-time communication:

| Service | Port | Purpose |
|---------|------|---------|
| **quake-ws** | 3004 | Simulated earthquake event stream — broadcasts ALERT, INCIDENT_UPDATE, VERIFICATION_UPDATE, RESOURCE_UPDATE, FIELD_UPDATE events every 15-20s with role-based routing |
| **ws-sync-service** | 3005 | Cross-portal state synchronization — dispatch updates, squad locations, verification changes, incident creation propagated to all connected clients via rooms |

Both services use `bun --hot` for auto-restart during development and support graceful shutdown.

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
- **13 API endpoints** for incidents, resources, verifications, alerts, state, routing, broadcast, field updates, safety check-in, agents, triage, export, and seeding

### What the PoC Demonstrates

1. **End-to-end incident lifecycle** — citizen report → spatiotemporal clustering → admin verification → squad dispatch → field routing → on-site arrival → resolution
2. **Real-time cross-portal synchronization** — admin dispatches a team, rescue portal updates in < 1 second via Socket.IO
3. **Multi-tier data verification** with human-in-the-loop confirmation and in-place status badges
4. **Street-grid-accurate routing** via Valhalla with 3-layer fallback (never returns empty)
5. **AI-augmented decision support** with transparent reasoning traces and dual-mode triage (LLM + heuristic)
6. **Multi-channel voice + text broadcast** from a single command centre to all portals simultaneously
7. **Multilingual support** — instant English/Hindi/Marathi switching across all portals

---

## Getting Started

### Prerequisites

- **Bun** (v1.3+) — [install](https://bun.sh)
- **Git**

> No Node.js required — Bun includes its own JavaScript runtime.

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/QuakeRelief.git
cd QuakeRelief

# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push database schema (creates SQLite DB at db/custom.db)
bun run db:push

# Start mini-services (in separate terminals)
cd mini-services/quake-ws && bun install && bun run dev
cd mini-services/ws-sync-service && bun install && bun run dev

# Seed the database with PoC data (after starting the dev server)
curl -s http://localhost:3000/api/seed
```

### Run

```bash
# Start development server (port 3000)
bun run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
bun run build
bun run start  # Starts standalone server on port 3000
```

### Quick Tour

1. Open `http://localhost:3000` — you'll see the track selection screen
2. **Citizen Safety** — no login required; immediately shows the public portal with map, alerts, resources, safety check-in, SOS, and people finder
3. **Rescue Operations** — select a squad (e.g., NDRF Team Alpha), authenticate to enter the tactical map with routing and incident queue
4. **SEOC Command Centre** — click to enter the full admin dashboard with verification pipeline, fleet dispatch, AI intelligence, voice broadcast, and analytics

### Lint

```bash
bun run lint
```

---

## Project Structure

```
QuakeRelief/
├── prisma/
│   └── schema.prisma                 # 9 models (SQLite)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (Geist font, Theme, i18n, PWA meta)
│   │   ├── page.tsx                  # Client SPA entry (AuthGate → role portal)
│   │   ├── globals.css               # Tailwind CSS 4 global styles
│   │   └── api/
│   │       ├── incidents/route.ts    # CRUD + spatiotemporal clustering
│   │       ├── resources/route.ts    # Resource listing & management
│   │       ├── verification/route.ts # Multi-tier verify/reject pipeline
│   │       ├── alerts/route.ts       # Role-filtered emergency alerts
│   │       ├── state/route.ts        # Shared state API (health check)
│   │       ├── route/route.ts        # Valhalla routing proxy (3-layer fallback)
│   │       ├── broadcast/route.ts    # Command broadcast persistence
│   │       ├── field-update/route.ts # Field team status updates
│   │       ├── safety-check/route.ts # Citizen safety check-in
│   │       ├── agents/route.ts       # AI agent intelligence outputs
│   │       ├── triage/route.ts       # AI-powered report triage
│   │       ├── export/route.ts       # Data export endpoint
│   │       ├── ws-bridge/route.ts    # REST → Socket.IO bridge
│   │       └── seed/route.ts         # Database seeding
│   │
│   ├── components/
│   │   ├── ui/                       # 60+ shadcn/ui components
│   │   ├── language-selector.tsx     # i18n locale picker (en/hi/mr)
│   │   ├── pwa-register.tsx          # Service worker registration
│   │   └── quake-relief/
│   │       ├── public/               # Citizen Safety portal
│   │       │   ├── public-portal.tsx
│   │       │   ├── AlertBanner.tsx
│   │       │   ├── QuickActions.tsx
│   │       │   ├── SafetyMapAndIncidents.tsx
│   │       │   ├── InfoPanels.tsx
│   │       │   ├── SafetyCheckinForm.tsx
│   │       │   ├── PeopleFinder.tsx
│   │       │   ├── InfraReportForm.tsx
│   │       │   └── SosAndEmergency.tsx
│   │       ├── rescue/               # Field Operations portal
│   │       │   ├── rescue-portal.tsx
│   │       │   ├── squad-header.tsx
│   │       │   ├── tactical-map-section.tsx
│   │       │   ├── active-task-panel.tsx
│   │       │   ├── incident-queue.tsx
│   │       │   └── resource-quick-view.tsx
│   │       ├── admin/                # SEOC Command Centre portal
│   │       │   ├── admin-portal.tsx
│   │       │   ├── AIIntelSummary.tsx
│   │       │   ├── CommandBroadcast.tsx
│   │       │   ├── FleetSidebar.tsx
│   │       │   ├── IncidentTimeline.tsx
│   │       │   ├── ActivityTimeline.tsx
│   │       │   └── VerificationPipeline.tsx
│   │       └── shared/               # Shared components
│   │           ├── auth-gate.tsx      # Role-based track selection
│   │           ├── locked-navbar.tsx  # Authenticated portal navbar
│   │           ├── navbar.tsx
│   │           ├── footer.tsx
│   │           ├── live-feed.tsx      # Real-time event feed
│   │           ├── map-wrapper.tsx    # Leaflet SSR-safe wrapper
│   │           ├── map-inner.tsx      # Map core (routing, polylines, markers)
│   │           ├── icon-factories.tsx # Leaflet DivIcon factories
│   │           ├── analytics-charts.tsx
│   │           └── incident-detail-sheet.tsx
│   │
│   ├── hooks/
│   │   ├── use-shared-state.ts       # Cross-portal real-time state
│   │   ├── use-quake-ws.ts           # WebSocket (quake-ws :3004)
│   │   ├── use-socket-sync.ts        # Socket.IO state sync (:3005)
│   │   ├── use-voice-alert-listener.ts  # Voice alert synthesis (Web Speech API)
│   │   ├── use-gps.ts                # Geolocation API hook
│   │   ├── use-mobile.ts             # Mobile viewport detection
│   │   ├── use-animated-counter.ts   # Animated number counter
│   │   ├── use-service-worker.ts     # Service worker registration
│   │   └── use-toast.ts             # Toast notifications
│   │
│   ├── store/
│   │   └── app-store.ts              # Zustand global store
│   │
│   ├── lib/
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── mock-data.ts              # PoC seed data (Latur M6.2 scenario)
│   │   ├── ai-triage.ts             # Dual-mode AI triage (LLM + heuristic)
│   │   ├── route-utils.ts           # Route generation & haversine distance
│   │   └── utils.ts                 # cn() utility (clsx + tailwind-merge)
│   │
│   └── i18n/
│       ├── index.ts                  # Locale definitions (en, hi, mr)
│       ├── provider.tsx              # I18nProvider + localStorage persistence
│       ├── locale-context.tsx        # React context for locale switching
│       ├── en.json                   # English translations (~457 lines)
│       ├── hi.json                   # Hindi translations (~457 lines)
│       └── mr.json                   # Marathi translations (~457 lines)
│
├── mini-services/
│   ├── quake-ws/                     # Socket.IO event simulator (:3004)
│   │   ├── index.ts
│   │   └── package.json
│   └── ws-sync-service/              # Socket.IO state sync (:3005)
│       ├── index.ts
│       └── package.json
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker
│   ├── logo.svg
│   ├── robots.txt
│   └── icons/
│
└── db/
    └── custom.db                    # SQLite database (auto-generated)
```

---

## Database Schema

The application uses **9 interconnected models** in SQLite via Prisma:

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **EarthquakeEvent** | Seismic event metadata | magnitude, depth, lat/lng, source (NCS), status (ACTIVE/MONITORING/RESOLVED) |
| **Incident** | Field reports with triage | type (6 types), priority (4 levels), verificationTier, clusterId, spatiotemporal clustering |
| **FieldUpdate** | Field team progress logs | status (EN_ROUTE/ON_SITE/RESOLVED), per-incident timeline |
| **Alert** | Emergency notifications | severity (INFO/WARNING/CRITICAL/EVACUATION), targetRole (PUBLIC/RESCUE/ADMIN/ALL) |
| **VerificationEntry** | Multi-source data triage | sourceTier (TIER_1/2/3), sourceType (NCS/IMD/CITIZEN/TWITTER/WHATSAPP), confidence score, status |
| **Resource** | Relief infrastructure | type (6 types), capacity, currentLoad, status (OPERATIONAL/OVERLOADED/DAMAGED/CLOSED) |
| **SafetyCheckIn** | Citizen safety status | status (SAFE/NEEDS_ASSISTANCE), GPS location |
| **AgentOutput** | AI intelligence | agentType (SITUATION/PRIORITY/RECOMMENDATION), full reasoning trace |
| **RescueTeam** | Squad registry | unitType (NDRF/SDRF/POLICE/FIRE/MEDICAL/ARMY), status, GPS, assignment |

---

## Internationalization (i18n)

QuakeRelief supports **3 languages** with instant switching and persistent locale selection:

| Locale | Language | Script | BCP 47 Code |
|--------|----------|--------|-------------|
| `en` | English | Latin | `en-IN` |
| `hi` | Hindi | Devanagari | `hi-IN` |
| `mr` | Marathi | Devanagari | `mr-IN` |

- Powered by **next-intl** with React context-based locale switching
- Locale persisted in `localStorage` with cross-tab sync
- Voice synthesis uses BCP 47 codes for proper language-specific TTS
- Translation files: `src/i18n/en.json`, `src/i18n/hi.json`, `src/i18n/mr.json` (~457 lines each, 15+ sections)

---

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **Leaflet SSR compatibility** — requires `window` object | `next/dynamic` with `ssr: false` + preloaded icon factories in `icon-factories.tsx` |
| **Cross-portal real-time sync** | Two Socket.IO mini-services + REST bridge API for server-initiated broadcasts |
| **Valhalla routing reliability** — public instances can be slow/fail | 3-layer fallback: Valhalla API → encoded polyline decode → smooth interpolated path (haversine-based) with multi-host failover |
| **Single-origin WebSocket proxying** | Caddy reverse proxy with `XTransformPort` query parameter routing |
| **Multilingual voice synthesis** | Web Speech API with BCP 47 locale codes (en-IN, hi-IN, mr-IN) and cross-portal broadcast via custom event |
| **Map timing race conditions** | `mapReady` state guard in useEffect dependency arrays |
| **Mobile-first responsive design** | Tailwind CSS 4 breakpoints with 44px minimum touch targets |
| **AI triage availability** | Dual-mode: z-ai-web-dev-sdk LLM with automatic fallback to heuristic keyword-based triage |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET/POST` | `/api/incidents` | List / create incidents with spatiotemporal clustering |
| `GET/PATCH` | `/api/verification` | List verification entries / verify or reject |
| `GET` | `/api/alerts` | Role-filtered active alerts |
| `GET` | `/api/resources` | Resource locations with capacity data |
| `GET` | `/api/state` | Application state / health check |
| `POST` | `/api/route` | Valhalla routing with 3-layer fallback |
| `POST` | `/api/broadcast` | Persist command broadcast messages |
| `POST` | `/api/field-update` | Field team status updates |
| `POST` | `/api/safety-check` | Citizen safety check-in |
| `GET` | `/api/agents` | AI agent intelligence outputs |
| `POST` | `/api/triage` | AI-powered incident triage (LLM + heuristic) |
| `GET` | `/api/export` | Export incident and verification data |
| `POST` | `/api/ws-bridge` | REST → Socket.IO event bridge |
| `POST` | `/api/seed` | Seed database with PoC data |

---

## Roadmap

- [x] **Three role-based portals** — Citizen, Rescue, SEOC Command
- [x] **Real-time WebSocket synchronization** — Socket.IO with event stream + state sync
- [x] **Multi-tier data verification pipeline** — with in-place status badges
- [x] **Street-grid routing** — Valhalla with multi-host failover and 3-layer fallback
- [x] **AI-powered triage** — LLM + heuristic dual-mode
- [x] **Multilingual support** — English, Hindi, Marathi via next-intl
- [x] **Voice synthesis** — BCP 47 locale-aware TTS across all portals
- [x] **Voice + Text broadcast** — simultaneous multi-portal emergency announcements
- [x] **PWA support** — service worker, manifest, offline-capable
- [x] **Dark/light theme** — next-themes with system preference detection
- [x] **AI intelligence summary** — 3-agent analysis with reasoning traces
- [X] **Exportable reports** — PDF/CSV incident and verification reports for government submissions
- [ ] **Mobile PWA optimization** — full offline capability for field teams
- [ ] **Aftershock prediction** — real-time seismological data feed with probability alerts
- [ ] **Drone imagery integration** — aerial damage assessment overlay on GIS map
- [ ] **Multi-event support** — handle concurrent earthquakes across different districts
- [ ] **NDMA/SDMA API integration** — connect to India's national disaster management APIs
- [ ] **Docker deployment** — containerized deployment with docker-compose
- [ ] **End-to-end encryption** — secure communication for sensitive incident data

---

## License

This project is licensed under the **MIT License**. See `LICENSE` for details.

---

## Acknowledgements

- **National Disaster Management Authority (NDMA), India** — for operational workflows and verification tier concepts
- **National Centre for Seismology (NCS)** — for earthquake data protocols
- **India Meteorological Department (IMD)** — for seismic and weather data standards
- **OpenStreetMap contributors** — for map tile data and Valhalla routing
- **Leaflet** — for the mapping engine
- **shadcn/ui** — for the component library
- **Vercel** — for Next.js
- **Bun** — for the JavaScript runtime

---

<p align="center">
  <strong>Built for disaster resilience. Open for collaboration.</strong>
</p>

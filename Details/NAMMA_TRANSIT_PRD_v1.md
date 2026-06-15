# NAMMA TRANSIT PRD v1.0

## Screens
1. **Home / LiveMap** — Interactive map showing live transit vehicles, route search input
2. **Route Results** — List of transit options sorted by TRS with fare, duration, transfers
3. **Active Journey** — Turn-by-turn navigation with live tracking, ETA, TRS updates
4. **Crowd Pulse** — Real-time crowd density reports per route/stop
5. **Profile** — Language toggle (EN/TA), alert preferences, theme

## Features
- **Route Search** — Search transit routes by origin/destination using OSM Nominatim
- **Reliability Scoring (TRS)** — Trip Reliability Score (0–100) for each route based on historical & real-time data
- **Live Tracking** — Real-time vehicle positions on map (WebSocket stream), movement simulation during active journey
- **Adaptive Alerts** — Proactive delay/disruption notifications with reroute suggestions
- **Tamil Support** — Full Tamil (ta) language toggle across all screens

## Tech Stack (Hackathon Demo)

### Frontend
- **React 19 + TanStack Start** (SSR via Nitro) — chosen for rapid prototyping; Flutter targeted for production
- **MapLibre GL** (open-source Mapbox GL fork) with OpenFreeMap tiles — Mapbox SDK targeted for production
- **Tailwind CSS v4** — utility-first styling
- **Maplibre GL** — map rendering

### Backend
- **FastAPI** (Python) — REST + WebSocket API
- **SQLite** (dev/fallback) — PostgreSQL + PostGIS targeted for production
- **XGBoost** — TRS prediction model (rule-based fallback when model not trained)

### Infrastructure (production target)
- Future: Flutter, Mapbox SDK, PostgreSQL + PostGIS, Redis, Kafka, AWS

## Data Sources

| Source | Status | Notes |
|---|---|---|
| OSM Nominatim (geocoding) | Integrated | Route search origin/destination |
| GTFS / GTFS-Realtime | Planned | Requires feed ingestion pipeline |
| Chennai Metro open data | Planned | Requires API access |
| Indian Railways NTES/CRIS | Planned | CRIS API requires MoU |
| HERE Traffic API | Planned | Requires developer account |
| IMD Weather | Planned | Available via public API |
| Crowd Pulse telemetry | MVP mock | Real user adoption needed post-MVP |

## API Endpoints (FastAPI + WebSocket)

| Endpoint | Method | Status |
|---|---|---|
| `/api/transit/routes/plan` | GET | Implemented (mock) |
| `/api/transit/vehicles/live` | GET | Implemented (mock, HTTP fallback) |
| `/api/transit/vehicles/live/ws` | WebSocket | Implemented (mock, 3s stream) |
| `/api/transit/reliability/trs` | GET | Implemented (XGBoost / rule) |
| `/api/transit/crowd/report` | POST | Implemented |
| `/api/transit/crowd/recent` | GET | Implemented |
| `/api/transit/alerts/subscribe` | POST | Implemented (stub) |
| `/api/transit/alerts/unsubscribe` | DELETE | Implemented (stub) |
| `/api/transit/voice/lookup` | GET | Implemented (IVR stub) |

## Notes
- All route/vehicle/crowd data is **simulated** for demo purposes. UI labels indicate "Simulated" on all mock-data screens.
- The Flutter → React stack change was made for hackathon velocity. The architecture (5 screens, TRS, WebSocket, Crowd Pulse) is framework-agnostic and portable.

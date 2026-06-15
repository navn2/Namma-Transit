# Data Sources — NAMMA TRANSIT

| Source | What | MVP Status | Production Target | Priority |
|---|---|---|---|---|
| **Transit Routes** | Route geometries, stops, frequencies | ✅ SQLite seed (static) | GTFS-RT (real-time) feed ingestion | P0 |
| **Vehicle Positions** | Live bus/train locations | ✅ Mock (deterministic hash per route_id) | GPS telemetry via IoT/gateway API | P0 |
| **Crowd Pulse** | Crowd-sourced occupancy reports | ✅ Verification pipeline with telemetry checks | Full mobile app integration + Yatri Points gamification | P0 |
| **TRS (Transit Reliability Score)** | Reliability prediction per route | ✅ XGBoost model with rule fallback | Trained XGBoost on historical GTFS-RT + Crowd Pulse data | P0 |
| **Adaptive Last-Mile** | Transfer risk analysis | ✅ Transfer risk engine with weather/headway/crowding factors | Real-time weather + historical transfer failure data | P1 |
| **Maps / Tiles** | Map rendering | ✅ OpenFreeMap (free tile server) | Mapbox SDK with traffic + isochrones | P1 |
| **SMS / Voice Alerts** | IVR for non-smartphone users | ✅ SMS alert subscription endpoint + IVR lookup stub | Twilio / Exotel integration | P1 |
| **Tamil i18n** | Tamil-language UI | ✅ JSON key/value translation | Native Tamil NLP + voice TTS for IVR | P1 |
| **Auth / User Profiles** | User accounts, preferences, Yatri Points | ✅ Demo mode (auto-create user) | Auth0 / Supabase Auth + phone OTP | P2 |
| **Historical Trip Data** | Past trips for personalized TRS | ❌ None | User trip history from GPS traces + ticket scans | P2 |
| **Weather Data** | Rain, temperature for last-mile risk | ❌ None | OpenWeatherMap / IMD API | P2 |
| **Traffic Data** | Road congestion for bus ETA | ❌ None | Mapbox traffic / Google Roads API | P3 |
| **Incident Reports** | Accidents, road closures, protests | ❌ None | Government open data + Crowd Pulse expansion | P3 |
| **Real-time Fares** | Dynamic fare updates | ❌ None | Transit authority integration | P3 |

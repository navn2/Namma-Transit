# Graph Report - ECOLANE  (2026-06-16)

## Corpus Check
- 146 files · ~52,718 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1142 nodes · 1625 edges · 105 communities (99 shown, 6 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 162 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5d6a55e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 89 edges
2. `User` - 21 edges
3. `CrowdReport` - 19 edges
4. `CrowdReportPayload` - 17 edges
5. `t()` - 17 edges
6. `compilerOptions` - 17 edges
7. `TRSFeatures` - 16 edges
8. `apiFetch()` - 16 edges
9. `Namma Transit — Complete Project Documentation` - 16 edges
10. `TransferConnection` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Session` --uses--> `User`  [INFERRED]
  Backend/app/utils/auth_dep.py → Backend/app/db/models.py
- `User` --uses--> `User`  [INFERRED]
  Backend/app/utils/auth_dep.py → Backend/app/db/models.py
- `Any` --uses--> `SMSAlertSubscription`  [INFERRED]
  Backend/app/services/sms_gateway.py → Backend/app/db/models.py
- `SubscribeRequest` --uses--> `User`  [INFERRED]
  Backend/app/alerts/push.py → Backend/app/db/models.py
- `Session` --uses--> `User`  [INFERRED]
  Backend/app/alerts/push.py → Backend/app/db/models.py

## Import Cycles
- None detected.

## Communities (105 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (55): login(), register(), Session, Session, Session, Session, Session, User (+47 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (54): dependencies, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-react, @hookform/resolvers, input-otp (+46 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (40): CompassButton(), ControlButton(), DEFAULT_ARC_LAYOUT, DEFAULT_ARC_PAINT, defaultStyles, MapArc(), MapArcDatum, MapArcEvent (+32 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (38): useIsMobile(), Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader() (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (33): consumeLastCapturedError(), renderErrorPage(), LovableErrorOptions, LovableEvents, reportLovableError(), Window, Route, Route (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (28): subscribe(), trigger(), verify_otp(), Session, Session, Session, Session, BaseModel (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (23): AuthResponse, AuthUser, loginUser(), logoutUser(), registerUser(), ApiError, apiFetch(), clearAuth() (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (27): _broadcast_trs_update(), _broadcast_vehicle_update(), _cleanup_stale_data(), _det_broadcast_val(), Namma Transit scheduler — background jobs for transit intelligence., Deterministic integer in [lo, hi] from a minute-aligned seed.      Changes only, cleanup_stale_vehicles(), crowding_level() (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (30): crowd_stats(), _det_route_features(), _generate_mock_routes(), get_trs(), _haversine(), _is_peak_hour(), _mock_transfer_legs(), plan_route() (+22 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (29): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+21 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (14): AccordionContent, AccordionItem, AccordionTrigger, Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (18): EcoLogo(), cn(), Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), Pagination() (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.23
Nodes (23): Any, Session, WebSocket, CrowdReport, A crowd-sourced observation from a transit user., Represents one leg of a multi-modal trip., The gap between two consecutive legs where a transfer happens., TransferConnection (+15 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (21): 1. Clone & Core Structure, 1. Home Map & Trust Dashboard, 2. Backend Setup, 2. Multi-Modal Route Planning & TRS Breakdown, 3. Active Journey Navigation, 3. Frontend Setup, 4. Crowd Pulse reporting, 5. Profile & Bilingual UI (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (12): t(), JourneyPage(), ProfilePage(), getRecommendationReasons(), getTransferRiskLabel(), getTrsBarColor(), getTrsExplanation(), getTrsLabel() (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (19): 5.1 App Shell & Navigation, 5.2 Screens (Routes), 5.3 Components, 5.4 API Client Layer, 5.5 i18n (Internationalisation), 5.6 Styling, 5. Frontend — React + TanStack, `bottom-nav.tsx` (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.19
Nodes (17): Session, User, A segment of a transit route with reliability metrics., TransitSegment, _compute_telemetry_confidence(), process_crowd_report(), Crowd Pulse Network — passive telemetry ingestion and verification.  Transforms, Compute a confidence score (0.0–1.0) for a telemetry reading. (+9 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (15): aggregate_route_trs(), _load_model(), predict_trs(), XGBoost-based Trip Reliability Score (TRS) computation.  The TRS is the primary, Return a TRS score (0–100) for the given feature set.      Uses the XGBoost mode, Deterministic TRS estimator — mirrors trained model intent., Return a segment reliability score 0–100., Aggregate segment and transfer scores into a single route TRS. (+7 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (11): logout(), Session, Session, User, Any, get_current_user(), create_access_token(), create_reset_token() (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.21
Nodes (13): Session, IVRRequestLog, Log of IVR voice lookups., lookup_vehicles_at_stop(), _mock_eta(), process_ivr_call(), IVR Gateway — voice-based transit lookup service.  Provides a mock IVR interface, Process an IVR call: resolve stop → lookup vehicles → log request.      Returns (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (13): Any, Session, broadcast_delay_alert(), format_sms(), SMS Gateway — route delay notification service.  Sends SMS alerts about transit, Unsubscribe from alerts for a route., Send delay alerts to all subscribers of a route., Format an SMS message using a template and language. (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (9): CrowdStats, getCrowdStats(), BottomNav(), tabs, MobileShell(), CrowdPage(), CrowdReport, ReportType (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (13): 7. Database Schema, `crowd_reports`, `ivr_request_logs`, `otp_tokens`, `reliability_forecasts`, `reliability_history`, `reward_transactions`, `routes` (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.35
Nodes (5): Any, WebSocket, ConnectionManager, WebSocket realtime event gateway.  Channels:   /ws/vehicles      — live vehicle, ws_endpoint()

### Community 30 - "Community 30"
Cohesion: 0.23
Nodes (7): Lang, loadLang(), setLang(), translations, Route, Splash(), Route

### Community 31 - "Community 31"
Cohesion: 0.24
Nodes (11): compute_transfer_risk(), evaluate_trip_transfers(), overall_transfer_risk(), Adaptive Last-Mile Protection — transfer risk and alternative routing.  Prevents, Generate a human-readable alternative suggestion., Evaluate all transfer connections in a multi-modal trip.      Returns a list of, Aggregate transfer risks into a single trip-level risk value.      Uses the maxi, Result of transfer risk analysis. (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (12): _det_choice(), _det_hash(), live_vehicles(), live_vehicles_ws(), Return live positions of transit vehicles near a location., Deterministic Chennai-themed crowd reports so the feed never looks empty in a de, Get recent verified crowd reports from the database., Deterministic float in [lo, hi] from a string seed. (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (10): API Endpoints (FastAPI + WebSocket), Backend, Data Sources, Features, Frontend, Infrastructure (production target), NAMMA TRANSIT PRD v1.0, Notes (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 35 - "Community 35"
Cohesion: 0.31
Nodes (7): getStatsOverview(), LiveVehicle, StatsOverview, subscribeVehicles(), MapPage(), Suggestion, getTrsColor()

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (9): EXECUTIVE DIRECTIVE, FINAL TRANSFORMATION INSTRUCTIONS FOR ANTIGRAVITY, PART IX — SECURITY, PART VIII — REALTIME ARCHITECTURE, PART XI — DESIGN SYSTEM, PART XII — DEPLOYMENT, PART XIII — ROADMAP, Problem Statement (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (9): 12. Known Limitations & Stubs, 13. localStorage Keys — Full Reference, 14. Change Log, 1. Project Overview, 2. Repository Structure, 9. Tech Stack Alignment, Namma Transit — Complete Project Documentation, Table of Contents (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.20
Nodes (10): 4.1 Entry Point, 4.2 Configuration, 4.3 Database Layer, 4.4 API Routes, 4.5 ML Modules, 4.7 Scheduler, 4. Backend — FastAPI, `adaptive_last_mile.py` — Transfer Risk Engine (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (6): Session, on_startup(), get_db(), init_db(), _parse_pg_kwargs(), Extract sslmode and other pg-specific kwargs from URL query, then strip them.

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (5): Session, trs_band(), process_ussd(), USSD Gateway — transit lookup via unstructured supplementary service data.  Enab, USSDResponse

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (7): 1. Prerequisites, 2. Install Dependencies, 3. Environment Variables, 4. Running the server, Namma Transit Backend API, Setup Instructions, Technologies Used

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (8): Alerts, Crowd Reporting, Live Vehicles, PART VII — API ARCHITECTURE, Reliability, Rewards, Route Planning, Voice

### Community 47 - "Community 47"
Cohesion: 0.25
Nodes (7): 1. Prerequisites, 2. Install Dependencies, 3. Environment Variables, 4. Running the App, Ecolens Frontend Web Application, Setup Instructions, Technologies Used

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (7): badges, ecoscoreTrend, forecast, routes, todayExposure, trips, weeklyPollution

### Community 49 - "Community 49"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 50 - "Community 50"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 52 - "Community 52"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (5): generateRoutes(), GenerateRoutesResponse, RouteOption, TransferRisk, TrsBreakdown

### Community 54 - "Community 54"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (6): Module 1: LiveMap Engine, Module 2: Reliability Intelligence Engine, Module 3: Crowd Pulse Network, Module 4: Adaptive Last-Mile Protection, Module 5: Equity Infrastructure, PART III — PRODUCT MODULES

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (6): 4.6 Services, `crowd_pulse.py` — Crowd Pulse Network, `ivr_gateway.py` — IVR Voice Lookup, `rewards_service.py` — Yatri Points Ledger, `sms_gateway.py` — SMS Alert Gateway, `ussd_gateway.py` — USSD Session Gateway

### Community 58 - "Community 58"
Cohesion: 0.40
Nodes (5): Core Tables, Database Stack, PART VI — DATA ARCHITECTURE, Sample Users Schema, Vehicle Schema

### Community 59 - "Community 59"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 60 - "Community 60"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (3): Session, summary(), date

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (4): Core Outcome, Mission, PART I — STRATEGIC FOUNDATION, Vision

### Community 64 - "Community 64"
Cohesion: 0.50
Nodes (4): Crowd Contribution, IVR Flow, Journey Planning, PART IV — USER FLOWS

### Community 65 - "Community 65"
Cohesion: 0.50
Nodes (4): Fraud Prevention, PART V — REWARDS ECONOMY, Redemption, Yatri Points

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (4): PART II — ECOLENS MIGRATION STRATEGY, Preserve, Remove, Replace

### Community 67 - "Community 67"
Cohesion: 0.50
Nodes (4): 11. Running the Project, Backend, Frontend, Vite Proxy

### Community 68 - "Community 68"
Cohesion: 0.50
Nodes (4): 8. API Endpoints Reference, New Trust & Community Endpoints — Response Shapes, Query Parameters, Transit Routes

### Community 69 - "Community 69"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 70 - "Community 70"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 74 - "Community 74"
Cohesion: 0.67
Nodes (3): Authoritative Product, Architecture, Migration, AI, Data and Transformation Blueprint, NAMMA TRANSIT ENTERPRISE MASTER SPECIFICATION, Successor Platform to EcoLens

### Community 75 - "Community 75"
Cohesion: 0.67
Nodes (3): Corporate Dashboard, Municipal Dashboard, PART X — ADMIN PORTALS

### Community 76 - "Community 76"
Cohesion: 0.67
Nodes (3): 10. Environment Variables, Backend (`Backend/.env`), Frontend (`Frontend/.env`)

### Community 77 - "Community 77"
Cohesion: 0.67
Nodes (3): 3. Tech Stack, Backend, Frontend

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (3): 6. Features Implemented, Core Product Features, ML & Intelligence Features

## Knowledge Gaps
- **495 isolated node(s):** `Session`, `date`, `Session`, `Session`, `ndarray` (+490 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 11` to `Community 2`, `Community 3`, `Community 10`, `Community 16`, `Community 20`, `Community 21`, `Community 22`, `Community 26`, `Community 27`, `Community 34`, `Community 35`, `Community 39`, `Community 40`, `Community 42`, `Community 43`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 54`, `Community 55`, `Community 59`, `Community 60`, `Community 69`, `Community 70`, `Community 71`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `User` connect `Community 0` to `Community 18`, `Community 12`, `Community 5`, `Community 23`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `Community 6` to `Community 27`, `Community 35`, `Community 4`, `Community 53`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `User` (e.g. with `Session` and `Session`) actually correct?**
  _`User` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `CrowdReport` (e.g. with `Session` and `Any`) actually correct?**
  _`CrowdReport` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Session`, `date`, `Session` to the rest of the system?**
  _586 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05563093622795115 - nodes in this community are weakly interconnected._
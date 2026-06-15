import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search, Navigation, MapPin, X, Crosshair, Compass, ArrowLeft, Bus, Clock, TrendingUp,
  Users, ArrowLeftRight, Activity, ShieldCheck,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Map, MapRoute, MapMarker, MarkerContent, type MapRef } from "@/components/ui/map";
import { subscribeVehicles, getStatsOverview, type LiveVehicle, type StatsOverview } from "@/lib/api/transit";
import { getTrsColor } from "./routes";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";
const MAP_STYLE = MAPBOX_TOKEN 
  ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`
  : "https://tiles.openfreemap.org/styles/liberty";

interface Suggestion {
  name: string;
  coords: [number, number];
}

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Live Map · Namma Transit" }] }),
  component: MapPage,
});

function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [originText, setOriginText] = useState("My Location");
  const [destText, setDestText] = useState("");
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [isDirectionsExpanded, setIsDirectionsExpanded] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<Suggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<LiveVehicle | null>(null);
  const [stats, setStats] = useState<StatsOverview | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserLocation(c);
          setOriginCoords(c);
          mapRef.current?.flyTo({ center: c, zoom: 14, duration: 1000 });
        },
        () => {
          const def: [number, number] = [80.2707, 13.0827];
          setUserLocation(def);
          setOriginCoords(def);
        }
      );
    }
  }, []);

  // Subscribe to live vehicles via WebSocket (falls back to polling)
  useEffect(() => {
    const unsubscribe = subscribeVehicles((data) => setVehicles(data));
    return unsubscribe;
  }, []);

  // Trust Dashboard stats (Network Reliability, Community Reports, etc.)
  useEffect(() => {
    getStatsOverview().then(setStats);
  }, []);

  const searchNominatim = async (q: string, setResults: (s: Suggestion[]) => void, setLoading: (b: boolean) => void) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/transit/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.map((item: any) => ({
        name: item.display_name.split(",").slice(0, 3).join(","),
        coords: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number],
      })));
    } catch { setResults([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchNominatim(originText, setOriginSuggestions, setLoadingOrigin), 400);
    return () => clearTimeout(timer);
  }, [originText]);

  useEffect(() => {
    const timer = setTimeout(() => searchNominatim(destText, setDestSuggestions, setLoadingDest), 400);
    return () => clearTimeout(timer);
  }, [destText]);

  const selectSuggestion = (type: "origin" | "dest", item: Suggestion) => {
    if (type === "origin") {
      setOriginText(item.name);
      setOriginCoords(item.coords);
      setShowOriginSuggestions(false);
      mapRef.current?.flyTo({ center: item.coords, zoom: 14, duration: 1000 });
    } else {
      setDestText(item.name);
      setDestCoords(item.coords);
      setShowDestSuggestions(false);
      setIsRoutingMode(true);
      setIsDirectionsExpanded(false);
      mapRef.current?.flyTo({ center: item.coords, zoom: 13, duration: 1200 });
    }
  };

  const handleSearchRoute = () => {
    if (!originCoords || !destCoords) return;
    navigate({
      to: "/routes",
      search: { olat: originCoords[1], olng: originCoords[0], dlat: destCoords[1], dlng: destCoords[0] },
    });
  };

  const handleLocateMe = () => {
    if (userLocation) {
      mapRef.current?.flyTo({ center: userLocation, zoom: 15, duration: 1000 });
      setOriginCoords(userLocation);
      setOriginText("My Location");
    }
  };

  const startPt = originCoords || userLocation || [80.2707, 13.0827];
  const endPt = destCoords;

  return (
    <MobileShell>
      <div className="relative h-dvh min-h-[480px] overflow-hidden bg-background">
        <Map
          ref={mapRef}
          theme="dark"
          center={userLocation || [80.2707, 13.0827]}
          zoom={14}
          pitch={50}
          className="absolute inset-0 h-full w-full"
          styles={{ light: MAP_STYLE, dark: MAP_STYLE }}
          attributionControl={false}
        >
          {/* Live vehicle markers */}
          {vehicles.map((v, i) => (
            <MapMarker key={`v-${i}`} longitude={v.lng} latitude={v.lat}>
              <MarkerContent>
                <div onClick={() => setSelectedVehicle(v)} className="flex flex-col items-center cursor-pointer transition-all hover:scale-110">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold shadow-md ${
                    v.vehicle_type === "metro" ? "bg-sky-500 text-white" : "bg-emerald-500 text-white"
                  }`}>
                    {v.vehicle_type === "metro" ? "M" : "B"}
                  </span>
                  <span className="mt-0.5 rounded bg-card/80 px-1 py-0.5 text-[8px] font-mono border border-border shadow-xs">{v.route_id}</span>
                </div>
              </MarkerContent>
            </MapMarker>
          ))}

          {/* Start marker */}
          {isRoutingMode && startPt && (
            <MapMarker longitude={startPt[0]} latitude={startPt[1]}>
              <MarkerContent>
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-eco-green text-background shadow-lg">
                    <Navigation className="h-4 w-4 rotate-45" />
                  </span>
                  <span className="mt-1 rounded bg-card/90 px-1 py-0.5 text-[9px] border border-border shadow font-mono">Start</span>
                </div>
              </MarkerContent>
            </MapMarker>
          )}

          {/* Destination marker */}
          {isRoutingMode && endPt && (
            <MapMarker longitude={endPt[0]} latitude={endPt[1]}>
              <MarkerContent>
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-eco-red shadow-lg">
                    <MapPin className="h-4 w-4 text-background" />
                  </span>
                  <span className="mt-1 rounded bg-card/90 px-1 py-0.5 text-[9px] border border-border shadow font-mono">End</span>
                </div>
              </MarkerContent>
            </MapMarker>
          )}
        </Map>

        {/* Top search panel */}
        <div className="absolute inset-x-0 top-0 z-20 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex justify-end mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-eco-orange/30 bg-eco-orange/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-eco-orange">
              Simulated
            </span>
          </div>
          {!isDirectionsExpanded ? (
            <div className="flex items-center gap-3 rounded-full border border-border bg-card/85 px-4 py-3 shadow-lg backdrop-blur-md">
              <Search className="h-4 w-4 text-eco-orange ml-1" />
              <input
                type="text"
                value={destText}
                onChange={(e) => setDestText(e.target.value)}
                onFocus={() => { setIsDirectionsExpanded(true); setShowDestSuggestions(true); }}
                placeholder={t("map.search")}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {destText && (
                <button onClick={() => { setDestText(""); setDestCoords(null); setIsRoutingMode(false); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="h-5 w-[1px] bg-border/80" />
              <button onClick={() => setIsDirectionsExpanded(true)} className="p-1 text-eco-orange hover:text-eco-orange/80">
                <Navigation className="h-4 w-4 rotate-45" />
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card/85 p-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                <button onClick={() => { setIsDirectionsExpanded(false); setIsRoutingMode(false); setDestCoords(null); setDestText(""); }} className="p-1 hover:bg-muted rounded-full text-muted-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold text-xs text-foreground font-mono">{t("map.plan")}</span>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                <div className="relative flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eco-green/10 text-eco-green">
                    <Compass className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={originText}
                    onFocus={() => { setShowOriginSuggestions(true); setShowDestSuggestions(false); }}
                    onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 250)}
                    onChange={(e) => { setOriginText(e.target.value); setShowOriginSuggestions(true); }}
                    placeholder={t("map.origin")}
                    className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-border py-1"
                  />
                  <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => { setOriginText(""); setOriginCoords(null); }} />
                </div>
                <div className="relative flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eco-red/10 text-eco-red">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={destText}
                    onFocus={() => { setShowDestSuggestions(true); setShowOriginSuggestions(false); }}
                    onBlur={() => setTimeout(() => setShowDestSuggestions(false), 250)}
                    onChange={(e) => { setDestText(e.target.value); setShowDestSuggestions(true); }}
                    placeholder={t("map.destination")}
                    className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-border py-1"
                  />
                  <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => { setDestText(""); setDestCoords(null); setIsRoutingMode(false); }} />
                </div>
              </div>
              {/* Suggestions */}
              {showOriginSuggestions && originText.trim().length >= 2 && originText !== "My Location" && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border bg-background/95 p-2">
                  {loadingOrigin && <div className="px-3 py-2 text-xs text-muted-foreground">{t("map.searching")}</div>}
                  {!loadingOrigin && originSuggestions.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground font-mono">{t("map.noResults")}</div>}
                  {originSuggestions.map((item, idx) => (
                    <button key={"o-" + idx} onMouseDown={() => selectSuggestion("origin", item)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-card text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {showDestSuggestions && destText.trim().length >= 2 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border bg-background/95 p-2">
                  {loadingDest && <div className="px-3 py-2 text-xs text-muted-foreground">{t("map.searching")}</div>}
                  {!loadingDest && destSuggestions.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground font-mono">{t("map.noResults")}</div>}
                  {destSuggestions.map((item, idx) => (
                    <button key={"d-" + idx} onMouseDown={() => selectSuggestion("dest", item)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-card text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-eco-red" />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {destCoords && originCoords && (
                <button onClick={handleSearchRoute} className="mt-3 w-full rounded-2xl bg-eco-orange py-3 text-sm font-semibold text-background active:scale-[0.98] transition-all">
                  {t("routes.title")}
                </button>
              )}
            </div>
          )}

          {/* Value Proposition Card */}
          {!isDirectionsExpanded && (
            <div className="mt-2 flex items-start gap-3 rounded-2xl border border-eco-orange/25 bg-card/85 px-4 py-3 shadow-lg backdrop-blur-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-eco-orange/15 text-eco-orange">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-bold text-foreground">{t("app.title")}</span>
                  <span className="font-mono text-[8px] uppercase tracking-widest text-eco-orange">{t("app.tagline")}</span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-foreground">{t("valueProp.subtitle")}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{t("valueProp.body")}</p>
              </div>
            </div>
          )}

          {/* Trust Dashboard */}
          {!((showOriginSuggestions && originText.trim().length >= 2 && originText !== "My Location") || (showDestSuggestions && destText.trim().length >= 2)) && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-[116px] shrink-0 flex-col gap-1.5 rounded-2xl border border-border bg-card/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span className="font-mono text-[8px] uppercase tracking-widest leading-tight">{t("dashboard.networkReliability")}</span>
                </div>
                {stats ? (
                  <span className={cn("text-lg font-bold leading-none", getTrsColor(stats.network_reliability_pct).match(/text-\S+/)?.[0])}>
                    {stats.network_reliability_pct}%
                  </span>
                ) : (
                  <div className="h-5 w-12 animate-pulse rounded bg-muted" />
                )}
              </div>

              <div className="flex min-w-[116px] shrink-0 flex-col gap-1.5 rounded-2xl border border-border bg-card/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Bus className="h-3 w-3" />
                  <span className="font-mono text-[8px] uppercase tracking-widest leading-tight">{t("dashboard.reliableRoutes")}</span>
                </div>
                {stats ? (
                  <span className="text-lg font-bold leading-none text-eco-green">{stats.reliable_routes_count}/{stats.total_routes_sampled}</span>
                ) : (
                  <div className="h-5 w-12 animate-pulse rounded bg-muted" />
                )}
              </div>

              <div className="flex min-w-[116px] shrink-0 flex-col gap-1.5 rounded-2xl border border-border bg-card/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span className="font-mono text-[8px] uppercase tracking-widest leading-tight">{t("dashboard.communityReports")}</span>
                </div>
                {stats ? (
                  <span className="text-lg font-bold leading-none text-eco-blue">{stats.community_reports_today}</span>
                ) : (
                  <div className="h-5 w-12 animate-pulse rounded bg-muted" />
                )}
              </div>

              <div className="flex min-w-[116px] shrink-0 flex-col gap-1.5 rounded-2xl border border-border bg-card/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ArrowLeftRight className="h-3 w-3" />
                  <span className="font-mono text-[8px] uppercase tracking-widest leading-tight">{t("dashboard.transferSuccess")}</span>
                </div>
                {stats ? (
                  <span className={cn("text-lg font-bold leading-none", getTrsColor(stats.transfer_success_rate_pct).match(/text-\S+/)?.[0])}>
                    {stats.transfer_success_rate_pct}%
                  </span>
                ) : (
                  <div className="h-5 w-12 animate-pulse rounded bg-muted" />
                )}
              </div>

              <div className="flex min-w-[150px] shrink-0 flex-col gap-1.5 rounded-2xl border border-border bg-card/85 px-3 py-2.5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span className="font-mono text-[8px] uppercase tracking-widest leading-tight">{t("dashboard.systemStatus")}</span>
                </div>
                {stats ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold leading-none">
                    <span className={cn("h-2 w-2 rounded-full", stats.system_status === "operational" ? "bg-eco-green" : "bg-eco-orange")} />
                    {stats.system_status === "operational" ? t("dashboard.status.operational") : t("dashboard.status.minorDelays")}
                  </span>
                ) : (
                  <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Locate me */}
        <div className="absolute right-4 top-24 z-10">
          <button onClick={handleLocateMe} className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/85 shadow-lg backdrop-blur-md hover:bg-card transition-all active:scale-95">
            <Crosshair className="h-5 w-5 text-eco-blue" />
          </button>
        </div>

        {/* Selected Vehicle Info Tooltip Card */}
        {selectedVehicle && (
          <div className="absolute inset-x-4 bottom-24 z-20 animate-in slide-in-from-bottom duration-300">
            <div className="rounded-3xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-eco-orange/15 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-eco-orange mb-1.5">
                    {selectedVehicle.vehicle_type === "metro" ? "Chennai Metro" : "MTC Bus"}
                  </span>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    {selectedVehicle.vehicle_id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="rounded-full bg-muted p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-center font-mono text-[10px]">
                <div className="rounded-xl bg-muted/40 p-2">
                  <span className="block text-muted-foreground">Route</span>
                  <span className="font-bold text-xs text-foreground mt-0.5 block">{selectedVehicle.route_id}</span>
                </div>
                <div className="rounded-xl bg-muted/40 p-2">
                  <span className="block text-muted-foreground">Speed</span>
                  <span className="font-bold text-xs text-foreground mt-0.5 block">{selectedVehicle.speed_kmh} km/h</span>
                </div>
                <div className="rounded-xl bg-muted/40 p-2">
                  <span className="block text-muted-foreground">Crowd</span>
                  <span className="font-bold text-xs text-foreground mt-0.5 block capitalize">{selectedVehicle.crowding}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick route button when destination is set */}
        {isRoutingMode && endPt && (
          <div className="absolute inset-x-4 bottom-4 z-10">
            <div className="rounded-3xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-eco-red" />
                  <span className="text-sm font-semibold truncate">{destText}</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{t("routes.crowd")}</span>
              </div>
              <button onClick={handleSearchRoute} className="w-full rounded-2xl bg-eco-orange py-3.5 text-sm font-semibold text-background active:scale-[0.98] transition-all">
                {t("routes.title")}
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

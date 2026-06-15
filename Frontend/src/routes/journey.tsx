import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Navigation, MapPin, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus, X, RotateCcw, CheckCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Map, MapRoute, MapMarker, MarkerContent, useMap, type MapRef } from "@/components/ui/map";
import { getTrsLabel, getTrsExplanation } from "./routes";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";
const LIGHT_STYLE = MAPBOX_TOKEN 
  ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`
  : "https://tiles.openfreemap.org/styles/liberty";
const DARK_STYLE = LIGHT_STYLE;

import { toast } from "sonner";

function readNavigationState() {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("nt:nav");
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function readProgress() {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem("nt:nav_progress") ?? 0);
}

export const Route = createFileRoute("/journey")({
  head: () => ({ meta: [{ title: "Active Journey · Namma Transit" }] }),
  component: JourneyPage,
});

function JourneyPage() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [navState, setNavState] = useState(readNavigationState);
  const [progress, setProgress] = useState(readProgress);
  const [completed, setCompleted] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(null);
  const [showAlert, setShowAlert] = useState(true);

  const path: [number, number][] = navState?.path ?? [];
  const destCoords = navState?.destCoords ?? null;
  const originCoords = navState?.originCoords ?? null;
  const trs = navState?.trs ?? 85;
  const durationMin = navState?.durationMin ?? 0;
  const routeLabel = navState?.routeLabel ?? "";
  const transfers = navState?.transfers ?? 0;
  const nextStop = navState?.nextStop ?? "";
  const transferTrs = navState?.transferTrs ?? 85;
  const transferRiskLevel = navState?.transferRiskLevel ?? null;
  const transferFailureProb = navState?.transferFailureProb ?? 0;
  const overallTransferRisk = navState?.overallTransferRisk ?? 0;
  const healthKey = transfers > 0
    ? (transferRiskLevel === "critical" ? "critical" : transferRiskLevel === "warning" ? "warning" : "safe")
    : "good";

  useEffect(() => {
    if (path.length > 0) {
      const currentIdx = Math.min(progress, path.length - 1);
      setCurrentCoords(path[currentIdx]);
      if (currentIdx >= path.length - 1) {
        setCompleted(true);
      }
    }
  }, [navState, progress]);

  useEffect(() => {
    if (completed || path.length === 0) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + 1;
        localStorage.setItem("nt:nav_progress", String(next));
        if (next >= path.length) {
          clearInterval(interval);
          setCompleted(true);
          setCurrentCoords(path[path.length - 1]);
          return path.length - 1;
        }
        setCurrentCoords(path[next]);
        mapRef.current?.easeTo({ center: path[next], zoom: 16, duration: 1000 });
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [completed, path]);

  const progressPct = path.length > 0 ? Math.round((progress / (path.length - 1)) * 100) : 0;
  const etaRemaining = Math.max(1, Math.round(durationMin * (1 - progressPct / 100)));

  const getInstruction = () => {
    if (completed) return t("journey.arrived");
    if (progress < 3) return `In ${(3 - progress) * 100}m, continue toward ${routeLabel}`;
    if (progress < 6) return `In ${(6 - progress) * 80}m, turn right`;
    return `In ${(path.length - progress) * 100}m, proceed to destination`;
  };

  const handleEndTrip = () => {
    if (completed) {
      const lifetimeTrips = Number(localStorage.getItem("nt:lifetime_trips") ?? 0) + 1;
      const trsSum = Number(localStorage.getItem("nt:trs_sum") ?? 0) + trs;
      const trsCount = Number(localStorage.getItem("nt:trs_count") ?? 0) + 1;
      localStorage.setItem("nt:lifetime_trips", String(lifetimeTrips));
      localStorage.setItem("nt:trs_sum", String(trsSum));
      localStorage.setItem("nt:trs_count", String(trsCount));
    }
    localStorage.removeItem("nt:nav");
    localStorage.removeItem("nt:nav_progress");
    navigate({ to: "/map" });
  };

  const handleReroute = async () => {
    if (!currentCoords || !destCoords) return;
    try {
      toast.info("Calculating optimal alternative route...");
      const res = await fetch(`/api/transit/routes/plan?origin_lat=${currentCoords[1]}&origin_lng=${currentCoords[0]}&dest_lat=${destCoords[1]}&dest_lng=${destCoords[0]}`);
      const data = await res.json();
      const newRoute = data.routes?.[0];
      if (newRoute) {
        const updatedState = {
          ...navState,
          path: newRoute.polyline,
          routeLabel: newRoute.label + " (Recalculated)",
          trs: newRoute.trs,
          durationMin: newRoute.duration_min,
        };
        localStorage.setItem("nt:nav", JSON.stringify(updatedState));
        localStorage.setItem("nt:nav_progress", "0");
        setNavState(updatedState);
        setProgress(0);
        setCompleted(false);
        setShowAlert(false);
        toast.success("Rerouted successfully! Avoided 5 min congestion delay.");
      }
    } catch (e) {
      toast.error("Rerouting failed. Continuing on original path.");
    }
  };

  return (
    <MobileShell>
      <div className="relative h-dvh overflow-hidden bg-background">
        <Map
          ref={mapRef}
          theme="dark"
          center={currentCoords || originCoords || [80.2707, 13.0827]}
          zoom={16}
          pitch={55}
          className="absolute inset-0 h-full w-full"
          styles={{ light: LIGHT_STYLE, dark: DARK_STYLE }}
          attributionControl={false}
        >
          {originCoords && (
            <MapMarker longitude={originCoords[0]} latitude={originCoords[1]}>
              <MarkerContent>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-eco-green text-background shadow-lg">
                  <Navigation className="h-3.5 w-3.5 rotate-45" />
                </span>
              </MarkerContent>
            </MapMarker>
          )}
          {destCoords && (
            <MapMarker longitude={destCoords[0]} latitude={destCoords[1]}>
              <MarkerContent>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-eco-red shadow-lg">
                  <MapPin className="h-3.5 w-3.5 text-background" />
                </span>
              </MarkerContent>
            </MapMarker>
          )}
          {path.length > 1 && (
            <MapRoute id="nav-path" coordinates={path} color="#f97316" width={5} opacity={0.9} />
          )}
          {currentCoords && !completed && (
            <MapMarker longitude={currentCoords[0]} latitude={currentCoords[1]}>
              <MarkerContent>
                <span className="relative flex h-8 w-8 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-eco-orange/30 animate-ping" />
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-eco-orange text-background shadow-md">
                    <Navigation className="h-3 w-3 fill-current" />
                  </span>
                </span>
              </MarkerContent>
            </MapMarker>
          )}
        </Map>

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-20 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-lg backdrop-blur-md">
            <button onClick={handleEndTrip} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" /> End
            </button>
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-eco-green animate-pulse" />
              {t("journey.title")}
              <span className="inline-flex items-center gap-1 rounded-full border border-eco-orange/30 bg-eco-orange/10 px-1.5 py-0 font-mono text-[7px] uppercase tracking-widest text-eco-orange">Sim</span>
            </span>
            <span className="font-mono text-xs font-bold text-eco-green">{trs} TRS</span>
          </div>
        </div>

        {/* Connection Confidence Card — adaptive last-mile */}
        {showAlert && !completed && transfers > 0 && (() => {
          const successPct = Math.round((1 - transferFailureProb) * 100);
          const expectedDelayMin = Math.max(0, Math.round(transferFailureProb * 15));
          const trend = healthKey === "critical"
            ? { Icon: TrendingDown, label: t("journey.confidence.trend.declining"), color: "text-eco-red" }
            : healthKey === "warning"
              ? { Icon: Minus, label: t("journey.confidence.trend.stable"), color: "text-eco-orange" }
              : { Icon: TrendingUp, label: t("journey.confidence.trend.improving"), color: "text-eco-green" };
          const TrendIcon = trend.Icon;
          const healthColor = healthKey === "critical" ? "text-eco-red" : healthKey === "warning" ? "text-eco-orange" : "text-eco-green";
          return (
            <div className="absolute inset-x-4 top-24 z-20 animate-in slide-in-from-top-3 duration-300">
              <div className={cn(
                "rounded-2xl border bg-card/95 p-4 shadow-lg backdrop-blur-md",
                healthKey === "critical" ? "border-eco-red/40" : healthKey === "warning" ? "border-eco-orange/40" : "border-eco-green/40"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn("h-4 w-4", healthColor)} />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t("journey.confidence.title")}
                    </span>
                  </div>
                  <button onClick={() => setShowAlert(false)} className="shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-2 text-sm font-semibold">
                  {t("journey.confidence.connectionTemplate")
                    .replace("{pct}", String(successPct))
                    .replace("{stop}", nextStop || t("journey.confidence.title"))}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-muted/40 p-2">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {t("journey.confidence.expectedDelay")}
                    </span>
                    <span className="mt-0.5 block font-bold">{expectedDelayMin} {t("routes.min")}</span>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-2">
                    <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {t("journey.confidence.health")}
                    </span>
                    <span className={cn("mt-0.5 block font-bold", healthColor)}>
                      {t(`journey.confidence.health.${healthKey}`)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-xl bg-muted/40 p-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {t("journey.confidence.trend")}
                    </span>
                    <span className={cn("flex items-center gap-1 font-bold", trend.color)}>
                      <TrendIcon className="h-3.5 w-3.5" /> {trend.label}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t(`journey.confidence.message.${healthKey}`)}
                </p>

                {healthKey === "critical" && (
                  <button
                    onClick={handleReroute}
                    className="mt-3 w-full rounded-2xl bg-eco-red py-2.5 text-sm font-semibold text-background active:scale-[0.98] transition-all"
                  >
                    {t("alert.reroute")}
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Adaptive Alert Banner */}
        {showAlert && !completed && !transfers && progress > 2 && progress < 8 && (
          <div className="absolute inset-x-4 top-24 z-20 animate-in slide-in-from-top-3 duration-300">
            <div className="flex items-start gap-3 rounded-2xl border border-eco-orange/40 bg-card/95 p-4 shadow-lg backdrop-blur-md">
              <AlertTriangle className="h-5 w-5 shrink-0 text-eco-orange" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t("alert.delay")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">5 min delay reported on this segment</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleReroute}
                    className="rounded-full bg-eco-orange px-3 py-1 text-xs font-semibold text-background active:scale-95 transition-transform"
                  >
                    {t("alert.reroute")}
                  </button>
                  <button
                    onClick={() => setShowAlert(false)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {t("alert.dismiss")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom sheet */}
        <div className="absolute inset-x-4 bottom-4 z-20">
          <div className="rounded-3xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur-md">
            {completed ? (
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-eco-green/15">
                  <CheckCircle className="h-7 w-7 text-eco-green" />
                </div>
                <h2 className="mt-3 text-lg font-bold">{t("journey.arrived")}</h2>
                <button onClick={handleEndTrip} className="mt-4 w-full rounded-2xl bg-eco-orange py-3 text-sm font-semibold text-background">
                  Complete Trip
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-eco-green opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-eco-green" />
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {t("journey.eta")}: <strong className="text-foreground">{etaRemaining} {t("routes.min")}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {t("journey.trs")}: <strong className="text-eco-green">{trs}% · {getTrsLabel(trs)}</strong>
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {getTrsExplanation(trs, transfers > 0)}
                </p>

                <div className={cn(
                  "mt-3 flex items-center gap-2.5 rounded-2xl border p-3",
                  healthKey === "critical" ? "border-eco-red/30 bg-eco-red/5" :
                  healthKey === "warning" ? "border-eco-orange/30 bg-eco-orange/5" :
                  "border-eco-green/30 bg-eco-green/5"
                )}>
                  {healthKey === "critical" || healthKey === "warning" ? (
                    <AlertTriangle className={cn("h-5 w-5 shrink-0", healthKey === "critical" ? "text-eco-red" : "text-eco-orange")} />
                  ) : (
                    <CheckCircle className="h-5 w-5 shrink-0 text-eco-green" />
                  )}
                  <p className={cn(
                    "text-sm font-semibold",
                    healthKey === "critical" ? "text-eco-red" : healthKey === "warning" ? "text-eco-orange" : "text-eco-green"
                  )}>
                    {t(`journey.confidence.statement.${healthKey}`)}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 w-full rounded-full bg-border/40 overflow-hidden">
                  <div className="h-full rounded-full bg-eco-orange transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{routeLabel}</span>
                  <span>{progressPct}% complete</span>
                </div>

                <p className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-sm font-medium">
                  {getInstruction()}
                </p>

                <button onClick={handleEndTrip} className="mt-4 w-full rounded-2xl border border-eco-red/30 py-3 text-sm font-semibold text-eco-red">
                  {t("journey.end")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

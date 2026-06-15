import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, Bus, Train, ArrowRight, CheckCircle2, Loader2, AlertTriangle, Users, IndianRupee, MapPin, Navigation, List, Columns3, X } from "lucide-react";
import { useState, useEffect } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { generateRoutes, type RouteOption } from "@/lib/api/routes";

export const Route = createFileRoute("/routes")({
  head: () => ({ meta: [{ title: "Route options · Namma Transit" }] }),
  component: RoutesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    olat: Number(search.olat ?? 0),
    olng: Number(search.olng ?? 0),
    dlat: Number(search.dlat ?? 0),
    dlng: Number(search.dlng ?? 0),
  }),
});

export function getTrsColor(score: number) {
  if (score >= 90) return "bg-[var(--trs-exceptional)]/15 text-[var(--trs-exceptional)] border-[var(--trs-exceptional)]/20";
  if (score >= 80) return "bg-[var(--trs-reliable)]/15 text-[var(--trs-reliable)] border-[var(--trs-reliable)]/20";
  if (score >= 60) return "bg-[var(--trs-moderate)]/15 text-[var(--trs-moderate)] border-[var(--trs-moderate)]/20";
  if (score >= 40) return "bg-[var(--trs-risk)]/15 text-[var(--trs-risk)] border-[var(--trs-risk)]/20";
  return "bg-[var(--trs-avoid)]/15 text-[var(--trs-avoid)] border-[var(--trs-avoid)]/20";
}

export function getTrsLabel(score: number) {
  if (score >= 90) return t("trs.exceptional");
  if (score >= 80) return t("trs.reliable");
  if (score >= 60) return t("trs.moderate");
  if (score >= 40) return t("trs.risk");
  return t("trs.avoid");
}

export function getTrsExplanation(score: number, hasTransfers = false) {
  if (hasTransfers && score < 60) return t("trs.explain.transferRisk");
  if (score >= 90) return t("trs.explain.exceptional");
  if (score >= 80) return t("trs.explain.reliable");
  if (score >= 60) return t("trs.explain.moderate");
  if (score >= 40) return t("trs.explain.risk");
  return t("trs.explain.avoid");
}

export function getTransferRiskLabel(route: RouteOption) {
  if (!route.transfers) return null;
  const level = route.transfer_risks?.[0]?.risk_level;
  if (level === "critical") return t("routes.transferRisk.high");
  if (level === "warning") return t("routes.transferRisk.moderate");
  return t("routes.transferRisk.low");
}

export function getTransferRiskColor(route: RouteOption) {
  const level = route.transfer_risks?.[0]?.risk_level;
  if (level === "critical") return "text-[var(--trs-avoid)]";
  if (level === "warning") return "text-[var(--trs-risk)]";
  return "text-[var(--trs-reliable)]";
}

function getTrsBarColor(score: number) {
  if (score >= 90) return "bg-[var(--trs-exceptional)]";
  if (score >= 80) return "bg-[var(--trs-reliable)]";
  if (score >= 60) return "bg-[var(--trs-moderate)]";
  if (score >= 40) return "bg-[var(--trs-risk)]";
  return "bg-[var(--trs-avoid)]";
}

function getRecommendationReasons(route: RouteOption, all: RouteOption[]): string[] {
  const reasons: string[] = [];

  const maxTrs = Math.max(...all.map((r) => r.trs || 0));
  if ((route.trs || 0) === maxTrs) reasons.push(t("routes.reason.highestReliability"));

  if (!route.transfers) {
    reasons.push(t("routes.reason.noTransfers"));
  } else {
    const transferRoutes = all.filter((r) => (r.transfers || 0) > 0);
    const minRisk = Math.min(...transferRoutes.map((r) => r.overall_transfer_risk ?? 1));
    if ((route.overall_transfer_risk ?? 1) === minRisk) reasons.push(t("routes.reason.lowestTransferRisk"));
  }

  const minDuration = Math.min(...all.map((r) => r.duration_min));
  if (route.duration_min === minDuration) reasons.push(t("routes.reason.fastestRoute"));

  if (route.crowding === "low") reasons.push(t("routes.reason.lowCrowding"));

  return reasons.slice(0, 3);
}

function ScoreBar({ label, value, suffix }: { label: string; value: number; suffix?: React.ReactNode }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        {suffix ?? <span className="font-mono font-semibold">{Math.round(clamped)}%</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", getTrsBarColor(clamped))} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function getCrowdColor(crowd?: string) {
  if (crowd === "high") return "bg-red-500";
  if (crowd === "medium") return "bg-yellow-500";
  return "bg-green-500";
}

function getModeDisplay(mode?: string) {
  if (mode === "metro") {
    return <span className="flex items-center gap-1 text-xs font-semibold text-foreground"><Train className="h-4 w-4 text-sky-400" /> Metro</span>;
  }
  if (mode === "multimodal") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Bus className="h-4 w-4 text-emerald-400" />
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <Train className="h-4 w-4 text-sky-400" />
        <span className="text-[10px] text-muted-foreground font-normal">(1 transfer)</span>
      </span>
    );
  }
  return <span className="flex items-center gap-1 text-xs font-semibold text-foreground"><Bus className="h-4 w-4 text-emerald-400" /> MTC Bus</span>;
}

function RoutesPage() {
  const navigate = useNavigate();
  const { olat, olng, dlat, dlng } = useSearch({ from: "/routes" });
  const [selected, setSelected] = useState("bus");
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [trsBreakdownRoute, setTrsBreakdownRoute] = useState<RouteOption | null>(null);

  useEffect(() => {
    const hasCoords = olat !== 0 && olng !== 0 && dlat !== 0 && dlng !== 0;
    if (!hasCoords) {
      setLoading(false);
      setError(t("routes.noCoords"));
      return;
    }
    setLoading(true);
    generateRoutes({ lat: olat, lng: olng }, { lat: dlat, lng: dlng })
      .then((data) => {
        setRoutes(data);
        const rec = data.find((r) => r.recommended);
        if (rec) setSelected(rec.type);
      })
      .catch(() => setError(t("routes.error")))
      .finally(() => setLoading(false));
  }, [olat, olng, dlat, dlng]);

  const startJourney = (route: RouteOption) => {
    const transferRisk = route.transfer_risks?.[0];
    const navState = {
      originCoords: [olng, olat] as [number, number],
      destCoords: [dlng, dlat] as [number, number],
      path: route.polyline || [[olng, olat], [dlng, dlat]],
      routeLabel: route.label,
      trs: route.trs || 80,
      durationMin: route.duration_min,
      transfers: route.transfers || 0,
      nextStop: route.transfer_hub || (route.transfers && route.transfers > 0 ? route.label.split("→")[route.transfers - 1]?.trim() || "" : ""),
      transferTrs: route.trs || 80,
      transferBuffer: transferRisk?.effective_buffer_sec ? Math.round(transferRisk.effective_buffer_sec / 60) : 5,
      transferRiskLevel: transferRisk?.risk_level || null,
      transferFailureProb: transferRisk?.failure_probability || 0,
      overallTransferRisk: route.overall_transfer_risk || 0,
    };
    localStorage.setItem("nt:nav", JSON.stringify(navState));
    navigate({ to: "/journey" });
  };

  return (
    <MobileShell>
      <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Link to="/map" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            {t("routes.title")}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </h1>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-eco-orange/30 bg-eco-orange/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-eco-orange">
            Simulated
          </span>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-eco-red/40 bg-eco-red/10 p-4 text-sm text-eco-red">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-3 rounded bg-muted" />
                  <div className="h-3 rounded bg-muted" />
                  <div className="h-3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && routes.length > 0 && (
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => setCompareMode(false)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-semibold font-mono transition-colors",
                !compareMode ? "bg-eco-orange/10 text-eco-orange border border-eco-orange/20" : "text-muted-foreground border border-border"
              )}
            >
              <List className="h-3 w-3" /> List
            </button>
            <button
              onClick={() => setCompareMode(true)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-semibold font-mono transition-colors",
                compareMode ? "bg-eco-orange/10 text-eco-orange border border-eco-orange/20" : "text-muted-foreground border border-border"
              )}
            >
              <Columns3 className="h-3 w-3" /> Compare
            </button>
          </div>
        )}

        {!loading && routes.length > 0 && !compareMode && (
          <div className="mt-3 space-y-3">
            {routes.map((r) => {
              const active = selected === r.type;
              const trs = r.trs || 80;
              return (
                <button
                  key={r.route_id ?? r.type}
                  onClick={() => setSelected(r.type)}
                  className={cn(
                    "w-full rounded-2xl border bg-card p-4 text-left transition-all duration-200 hover:border-muted-foreground/30",
                    active ? "border-eco-orange glow-orange" : "border-border",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getModeDisplay(r.mode)}
                      {r.recommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-eco-green/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-eco-green">
                          <CheckCircle2 className="h-2.5 w-2.5" /> {t("routes.recommended")}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrsBreakdownRoute(r);
                      }}
                      className={cn("rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1", getTrsColor(trs))}
                    >
                      {trs}% {getTrsLabel(trs)} <span className="text-[10px] opacity-75">ⓘ</span>
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{r.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {getTrsExplanation(trs, (r.transfers || 0) > 0)}
                  </p>
                  {r.recommended && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {t("routes.whyRecommended")}
                      </span>
                      {getRecommendationReasons(r, routes).map((reason) => (
                        <span key={reason} className="rounded-full border border-eco-green/20 bg-eco-green/10 px-2 py-0.5 text-[10px] font-medium text-eco-green">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px] text-muted-foreground border-t border-border/40 pt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/75" /> {r.duration_min} {t("routes.min")}
                    </div>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5 text-muted-foreground/75" /> ₹{r.fare_inr || Math.round(parseFloat(String(r.distance_km || 0)) * 2.5 + 10)}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={cn("h-2 w-2 rounded-full", getCrowdColor(r.crowding))} />
                      <span className="capitalize">{r.crowding || "low"} {t("routes.crowd")}</span>
                    </div>
                  </div>
                  {r.transfers !== undefined && r.transfers > 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                      <span>{r.transfers} transfer{r.transfers > 1 ? "s" : ""}</span>
                      <span className={cn("font-semibold", getTransferRiskColor(r))}>
                        · {getTransferRiskLabel(r)}
                      </span>
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Comparison table */}
        {!loading && routes.length > 0 && compareMode && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Route</th>
                  <th className="px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">TRS</th>
                  <th className="px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Time</th>
                  <th className="px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fare</th>
                  <th className="px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Crowd</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r, idx) => {
                  const trs = r.trs || 80;
                  const isRec = r.recommended;
                  return (
                    <tr
                      key={r.route_id ?? idx}
                      onClick={() => { setSelected(r.type); setCompareMode(false); }}
                      className={cn(
                        "border-b border-border/30 transition-colors cursor-pointer hover:bg-muted/20",
                        selected === r.type && "bg-eco-orange/5"
                      )}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {r.mode === "metro" ? <Train className="h-3.5 w-3.5 text-sky-400" /> : <Bus className="h-3.5 w-3.5 text-emerald-400" />}
                          <span className="font-semibold text-[11px]">{r.label}</span>
                          {isRec && <CheckCircle2 className="h-3 w-3 text-eco-green" />}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold", getTrsColor(trs))}>
                          {trs}%
                        </span>
                        <div className="mt-0.5 text-[9px] text-muted-foreground">{getTrsLabel(trs)}</div>
                        {!!r.transfers && (
                          <div className={cn("mt-0.5 text-[9px] font-semibold", getTransferRiskColor(r))}>
                            {getTransferRiskLabel(r)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{r.duration_min}m</td>
                      <td className="px-3 py-3 text-muted-foreground">₹{r.fare_inr || "-"}</td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1">
                          <span className={cn("h-1.5 w-1.5 rounded-full", getCrowdColor(r.crowding))} />
                          <span className="text-[10px] text-muted-foreground capitalize">{r.crowding || "low"}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && routes.length > 0 && (
          <button
            onClick={() => {
              const selectedRoute = routes.find((r) => r.type === selected);
              if (selectedRoute) startJourney(selectedRoute);
            }}
            className="mt-5 w-full block rounded-2xl bg-eco-orange py-3.5 text-center text-base font-semibold text-background hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Navigation className="h-4 w-4 inline mr-2" />
            {t("routes.start")}
          </button>
        )}

        {/* TRS Breakdown Modal */}
        {trsBreakdownRoute && (() => {
          const trs = trsBreakdownRoute.trs || 80;
          const hasTransfers = (trsBreakdownRoute.transfers || 0) > 0;
          const breakdown = trsBreakdownRoute.trs_breakdown ?? {
            historical_reliability: trs,
            traffic_conditions: trs,
            transfer_confidence: hasTransfers ? 80 : 100,
            crowd_confidence: trs,
            overall_reliability: trs,
          };
          return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-eco-orange">
                  {t("routes.breakdown.title")}
                </h3>
                <button
                  onClick={() => setTrsBreakdownRoute(null)}
                  className="rounded-full bg-muted p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold">{trsBreakdownRoute.label}</span>
                    <span className={cn("rounded-full border px-3 py-1 font-mono text-sm font-bold", getTrsColor(trs))}>
                      {trs}% {getTrsLabel(trs)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getTrsExplanation(trs, hasTransfers)}
                  </p>
                </div>

                <div className="space-y-3 border-y border-border/30 py-4">
                  <ScoreBar label={t("routes.breakdown.historical")} value={breakdown.historical_reliability} />
                  <ScoreBar label={t("routes.breakdown.traffic")} value={breakdown.traffic_conditions} />
                  {hasTransfers ? (
                    <ScoreBar label={t("routes.breakdown.transfer")} value={breakdown.transfer_confidence} />
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t("routes.breakdown.transfer")}</span>
                      <span className="font-mono font-semibold text-eco-green">{t("routes.breakdown.noTransfer")}</span>
                    </div>
                  )}
                  <ScoreBar label={t("routes.breakdown.crowd")} value={breakdown.crowd_confidence} />
                  <ScoreBar label={t("routes.breakdown.overall")} value={breakdown.overall_reliability} />
                </div>

                <div className="rounded-xl bg-muted/40 p-3 text-xs">
                  <span className="font-semibold block mb-1">
                    {t("routes.breakdown.title")}: {getTrsLabel(trs)}
                  </span>
                  <span className="text-muted-foreground leading-relaxed">
                    {getTrsExplanation(trs, hasTransfers)}
                  </span>
                </div>

                <button
                  onClick={() => setTrsBreakdownRoute(null)}
                  className="w-full rounded-2xl bg-muted py-3 text-sm font-semibold text-foreground hover:bg-muted/80"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </MobileShell>
  );
}

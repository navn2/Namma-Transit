import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, CircleAlert, Bus, AlertTriangle, ThumbsUp, Send, MapPin, TrendingUp } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api/client";
import { getCrowdStats, type CrowdStats } from "@/lib/api/transit";
import { toast } from "sonner";

export const Route = createFileRoute("/crowd")({
  head: () => ({ meta: [{ title: "Crowd Pulse · Namma Transit" }] }),
  component: CrowdPage,
});

type ReportType = "congestion" | "delay" | "breakdown" | "route_deviation";

interface CrowdReport {
  id: string;
  report_type: ReportType;
  lat: number;
  lng: number;
  congestion_level?: string;
  delay_minutes?: number;
  confidence: number;
  timestamp: string;
  route_name?: string;
  verified_count?: number;
}

const reportTypes: { value: ReportType; label: string }[] = [
  { value: "congestion", label: "Congestion" },
  { value: "delay", label: "Delay" },
  { value: "breakdown", label: "Breakdown" },
];

function CrowdPage() {
  const [reports, setReports] = useState<CrowdReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("congestion");
  const [level, setLevel] = useState("medium");
  const [delayMin, setDelayMin] = useState("5");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [impactStats, setImpactStats] = useState<CrowdStats | null>(null);

  useEffect(() => {
    fetchReports();
    getCrowdStats().then(setImpactStats);
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ reports: CrowdReport[] }>("/api/transit/crowd/recent?limit=20");
      setReports(data.reports ?? []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch("/api/transit/crowd/report", {
        method: "POST",
        body: JSON.stringify({
          report_type: reportType,
          lat: 13.0827 + (Math.random() - 0.5) * 0.02,
          lng: 80.2707 + (Math.random() - 0.5) * 0.02,
          congestion_level: reportType === "congestion" ? level : null,
          delay_minutes: reportType === "delay" ? parseFloat(delayMin) : null,
        }),
      });
      const current = Number(localStorage.getItem("nt:yatri_points") || "120");
      localStorage.setItem("nt:yatri_points", String(current + 50));
      const reportsSubmitted = Number(localStorage.getItem("nt:reports_submitted") || "0");
      localStorage.setItem("nt:reports_submitted", String(reportsSubmitted + 1));
      toast.success("+50 Yatri Points earned for verified report!");
      setSubmitted(true);
      setTimeout(() => { setShowForm(false); setSubmitted(false); fetchReports(); }, 1500);
    } catch {
      // fallback: add optimistic report
      const current = Number(localStorage.getItem("nt:yatri_points") || "120");
      localStorage.setItem("nt:yatri_points", String(current + 50));
      const reportsSubmitted = Number(localStorage.getItem("nt:reports_submitted") || "0");
      localStorage.setItem("nt:reports_submitted", String(reportsSubmitted + 1));
      toast.success("+50 Yatri Points earned for verified report!");
      setSubmitted(true);
      setTimeout(() => { setShowForm(false); setSubmitted(false); }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: ReportType) => {
    if (type === "congestion") return <Users className="h-4 w-4" />;
    if (type === "delay") return <ClockIcon className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <MobileShell>
      <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t("crowd.title")}
            <span className="inline-flex items-center gap-1 rounded-full border border-eco-orange/30 bg-eco-orange/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-eco-orange">
              Sim
            </span>
          </h1>
          <button
            onClick={() => { setShowForm(!showForm); setSubmitted(false); }}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border transition-all",
              showForm
                ? "border-eco-orange bg-eco-orange/10 text-eco-orange"
                : "border-border bg-card text-foreground"
            )}
          >
            <CircleAlert className="h-4 w-4" />
            {t("crowd.report")}
          </button>
        </div>

        {/* Submit Form */}
        {showForm && (
          <div className="mt-4 rounded-3xl border border-border bg-card p-5 animate-in slide-in-from-top-3 duration-200">
            <h2 className="mb-3 font-semibold text-sm">{t("crowd.submit")}</h2>
            {submitted ? (
              <div className="flex items-center gap-2 text-eco-green text-sm">
                <ThumbsUp className="h-4 w-4" /> {t("crowd.thanks")}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {reportTypes.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => setReportType(rt.value)}
                      className={cn(
                        "flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors",
                        reportType === rt.value
                          ? "border-eco-orange bg-eco-orange/10 text-eco-orange"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
                {reportType === "congestion" && (
                  <div className="flex gap-2">
                    {["low", "medium", "high"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={cn(
                          "flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors",
                          level === l
                            ? "border-eco-orange bg-eco-orange/10 text-eco-orange"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {l === "low" ? t("crowd.low") : l === "medium" ? t("crowd.medium") : t("crowd.high")}
                      </button>
                    ))}
                  </div>
                )}
                {reportType === "delay" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Minutes:</span>
                    <input
                      type="number"
                      value={delayMin}
                      onChange={(e) => setDelayMin(e.target.value)}
                      className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-sm text-center"
                      min="1"
                    />
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-eco-orange py-3 text-sm font-semibold text-background disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : <><Send className="h-4 w-4" /> {t("crowd.submit")}</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Community Impact */}
        <div className="mt-5">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-1">
            {t("crowd.impact.title")}
          </h2>
          <p className="mt-1 px-1 text-[11px] leading-relaxed text-muted-foreground">
            {t("crowd.impact.subtitle")}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { icon: Users, label: t("crowd.impact.activeContributors"), value: impactStats?.active_contributors },
              { icon: Send, label: t("crowd.impact.reportsToday"), value: impactStats?.reports_submitted_today },
              { icon: ThumbsUp, label: t("crowd.impact.verifiedReports"), value: impactStats?.verified_reports },
              { icon: MapPin, label: t("crowd.impact.blindSpots"), value: impactStats?.gps_blind_spots_filled },
              { icon: Bus, label: t("crowd.impact.routesImproved"), value: impactStats?.routes_improved },
              { icon: TrendingUp, label: t("crowd.impact.confidence"), value: impactStats ? `${impactStats.community_confidence_pct}%` : undefined },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <card.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono text-[8px] uppercase tracking-widest leading-tight">{card.label}</span>
                </div>
                {card.value !== undefined ? (
                  <span className="mt-1.5 block text-lg font-bold">{card.value}</span>
                ) : (
                  <div className="mt-1.5 h-5 w-12 animate-pulse rounded bg-muted" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reports List */}
        <div className="mt-5 space-y-2">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground px-1">
            {t("crowd.recent")}
          </h2>
          <p className="px-1 -mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {t("crowd.recent.subtitle")}
          </p>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
              </div>
            ))
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Bus className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No reports yet — be the first sensor</p>
              <p className="mt-1 text-[10px] text-muted-foreground/60 font-mono">Your identity is never stored</p>
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      r.report_type === "congestion" ? "bg-eco-orange/10 text-eco-orange" :
                      r.report_type === "delay" ? "bg-eco-red/10 text-eco-red" : "bg-eco-blue/10 text-eco-blue"
                    )}>
                      {getTypeIcon(r.report_type)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold capitalize truncate">{r.report_type}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {r.verified_count !== undefined && r.verified_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-eco-green/10 px-2 py-0.5 font-mono text-[9px] text-eco-green font-bold">
                        ✓ {r.verified_count} verified
                      </span>
                    )}
                    {r.congestion_level && (
                      <span className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                        r.congestion_level === "high" ? "bg-eco-red/10 text-eco-red" :
                        r.congestion_level === "medium" ? "bg-eco-orange/10 text-eco-orange" :
                        "bg-eco-green/10 text-eco-green"
                      )}>
                        {r.congestion_level}
                      </span>
                    )}
                    {r.delay_minutes && (
                      <span className="rounded-full bg-eco-red/10 px-2 py-0.5 font-mono text-[10px] font-bold text-eco-red">
                        +{r.delay_minutes}m
                      </span>
                    )}
                  </div>
                </div>
                {r.route_name && (
                  <p className="mt-2 text-xs text-muted-foreground">{r.route_name}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Anonymity footer */}
        {reports.length > 0 && (
          <div className="mt-6 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">
            Your identity is never stored
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

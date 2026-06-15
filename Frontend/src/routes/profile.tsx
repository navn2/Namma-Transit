import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { User, Bell, ChevronRight, RotateCcw, Info, Sun, Moon, Languages } from "lucide-react";
import { useState, useEffect } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { t, setLang, loadLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · Namma Transit" }] }),
  component: ProfilePage,
});

import { toast } from "sonner";

function ProfilePage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [lang, setLangState] = useState<Lang>("en");
  const [delayAlerts, setDelayAlerts] = useState(true);
  const [transferAlerts, setTransferAlerts] = useState(true);
  
  const [yatriPoints, setYatriPoints] = useState(() => {
    if (typeof window === "undefined") return 120;
    const val = localStorage.getItem("nt:yatri_points");
    if (!val) {
      localStorage.setItem("nt:yatri_points", "120");
      return 120;
    }
    return Number(val);
  });

  const [trustScore, setTrustScore] = useState(() => {
    if (typeof window === "undefined") return 98;
    const val = localStorage.getItem("nt:trust_score");
    if (!val) {
      localStorage.setItem("nt:trust_score", "98");
      return 98;
    }
    return Number(val);
  });

  const [lifetimeTrips] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("nt:lifetime_trips") ?? "0");
  });

  const [reportsSubmitted] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("nt:reports_submitted") ?? "0");
  });

  const [avgReliability] = useState(() => {
    if (typeof window === "undefined") return 85;
    const sum = Number(localStorage.getItem("nt:trs_sum") ?? "0");
    const count = Number(localStorage.getItem("nt:trs_count") ?? "0");
    return count > 0 ? Math.round(sum / count) : 85;
  });

  useEffect(() => {
    const savedLang = loadLang();
    setLangState(savedLang);
    if (localStorage.getItem("theme") === "dark") {
      setDark(true);
      document.documentElement.classList.remove("light");
    } else {
      setDark(false);
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const toggleLang = () => {
    const next: Lang = lang === "en" ? "ta" : "en";
    setLangState(next);
    setLang(next);
  };

  const resetDemo = () => {
    localStorage.clear();
    navigate({ to: "/" });
  };

  const getContributionRank = (points: number) => {
    if (points >= 1000) return t("profile.impact.rank.champion");
    if (points >= 500) return t("profile.impact.rank.trusted");
    if (points >= 200) return t("profile.impact.rank.contributor");
    return t("profile.impact.rank.newcomer");
  };

  return (
    <MobileShell>
      <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        <div className="mt-5 flex items-center gap-4 rounded-3xl border border-border bg-card p-5">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-eco-orange/15 text-2xl font-bold text-eco-orange font-mono">
              NT
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-eco-green" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{t("app.title")} User</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-eco-orange/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-eco-orange font-bold">
                {t("profile.commuter")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-eco-green/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-eco-green font-bold">
                ★ {yatriPoints} Yatri Points
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-eco-blue/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-eco-blue font-bold">
                ✓ {trustScore}% Trust Score
              </span>
            </div>
          </div>
        </div>

        <Section title={t("profile.impact.title")}>
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-card p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("profile.impact.lifetimeTrips")}</div>
              <div className="mt-1 text-xl font-bold">{lifetimeTrips}</div>
            </div>
            <div className="bg-card p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("profile.impact.avgReliability")}</div>
              <div className="mt-1 text-xl font-bold text-eco-green">{avgReliability}%</div>
            </div>
            <div className="bg-card p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("profile.impact.rank")}</div>
              <div className="mt-1 text-sm font-bold text-eco-orange">{getContributionRank(yatriPoints)}</div>
            </div>
            <div className="bg-card p-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{t("profile.impact.reportsSubmitted")}</div>
              <div className="mt-1 text-xl font-bold text-eco-blue">{reportsSubmitted}</div>
            </div>
          </div>
          <div className="border-t border-border p-4">
            <div className="text-xs font-semibold">{t("profile.impact.trustTitle")}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t("profile.impact.trustBody")}</p>
          </div>
        </Section>

        <Section title={t("profile.title")}>
          <button onClick={toggleLang} className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-b-0 hover:bg-muted/30">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">{t("profile.language")}</span>
            <span className="font-mono text-xs font-bold text-eco-orange">{lang === "en" ? "EN" : "தமிழ்"}</span>
          </button>
          <ToggleRow
            icon={dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            label={t("profile.theme")}
            checked={dark}
            onChange={toggleTheme}
          />
        </Section>

        <Section title="Notifications">
          <ToggleRow
            icon={<Bell className="h-4 w-4" />}
            label={t("profile.alerts")}
            checked={delayAlerts}
            onChange={() => setDelayAlerts(!delayAlerts)}
          />
          <ToggleRow
            icon={<Bell className="h-4 w-4" />}
            label={t("profile.transferAlerts")}
            checked={transferAlerts}
            onChange={() => setTransferAlerts(!transferAlerts)}
          />
        </Section>

        <Section title="Active SMS Alert Terminal (Equitable Channels)">
          <div className="bg-background/80 p-4 font-mono text-[10px] text-muted-foreground border-b border-border">
            <span className="text-eco-orange font-bold block mb-1">MOCK SMS CONSOLE</span>
            {localStorage.getItem("nt:sms_log") ? (
              <p className="text-foreground">{localStorage.getItem("nt:sms_log")}</p>
            ) : (
              <p>No active alerts. Enter phone number to simulate SMS updates.</p>
            )}
          </div>
          <div className="p-4 flex gap-2">
            <input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground"
              defaultValue={localStorage.getItem("nt:phone") || ""}
              onChange={(e) => localStorage.setItem("nt:phone", e.target.value)}
            />
            <button
              onClick={() => {
                const phone = localStorage.getItem("nt:phone") || "";
                if (phone) {
                  localStorage.setItem("nt:sms_log", `[${new Date().toLocaleTimeString()}] Subscribed to MTC 27B Delay Notifications. SMS Gateway initialized.`);
                  toast.success("SMS Alerts Configured successfully!");
                  navigate({ to: "/profile" });
                } else {
                  toast.error("Please enter a valid phone number.");
                }
              }}
              className="rounded-xl bg-eco-orange px-3 py-1.5 text-xs font-semibold text-background active:scale-95 transition-transform"
            >
              Verify SMS
            </button>
          </div>
        </Section>

        <button
          onClick={resetDemo}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-eco-orange/30 bg-eco-orange/5 py-3 text-sm font-semibold text-eco-orange"
        >
          <RotateCcw className="h-4 w-4" /> Reset Demo
        </button>

        <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Namma Transit v1.0.0
        </div>
      </div>
    </MobileShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
    </div>
  );
}

function ToggleRow({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm">{label}</span>
      <button
        onClick={onChange}
        className={"relative h-6 w-11 shrink-0 rounded-full transition-colors " + (checked ? "bg-eco-green" : "bg-muted")}
      >
        <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform " + (checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

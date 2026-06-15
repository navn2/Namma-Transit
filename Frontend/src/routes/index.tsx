import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { EcoLogo } from "@/components/eco-logo";
import { t, loadLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Namma Transit — Civic Mobility Intelligence" },
      { name: "description", content: "Namma Transit restores trust in public transit through predictive intelligence and crowd telemetry." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    loadLang();
    const t = setTimeout(() => navigate({ to: "/map" }), 1600);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center overflow-hidden bg-background px-8">
      <div className="absolute inset-x-0 bottom-0 h-1 bg-eco-orange/40">
        <div className="h-full origin-left animate-[grow_1.5s_ease-out_forwards] bg-eco-orange" />
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-xs text-muted-foreground/70">
        SYS.INIT v1.0.0
      </div>
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative">
          <EcoLogo size={120} className="glow-orange" />
        </div>
        <h1 className="font-mono text-4xl font-bold tracking-tight text-foreground">{t("app.title")}</h1>
        <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
          {t("app.tagline")}
        </p>
      </div>
      <style>{`@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </div>
  );
}

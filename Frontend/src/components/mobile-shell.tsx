import { useEffect, useState, type ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { Link } from "@tanstack/react-router";
import { Navigation } from "lucide-react";

export function MobileShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const [hasActiveTrip, setHasActiveTrip] = useState(false);

  useEffect(() => {
    const checkTrip = () => {
      setHasActiveTrip(localStorage.getItem("nt:nav") !== null);
    };
    checkTrip();
    window.addEventListener("storage", checkTrip);
    const interval = setInterval(checkTrip, 1000);
    return () => {
      window.removeEventListener("storage", checkTrip);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background">
      <main className={hideNav ? "flex-1" : "flex-1 pb-24"}>{children}</main>
      
      {hasActiveTrip && !hideNav && (
        <div className="fixed bottom-20 inset-x-4 z-40">
          <Link
            to="/journey"
            className="flex items-center justify-between rounded-full border border-eco-orange/30 bg-eco-orange px-4 py-2.5 text-xs font-semibold text-background shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center gap-1.5 font-mono">
              <Navigation className="h-3.5 w-3.5 fill-current animate-bounce rotate-45" />
              Active Commute Running
            </span>
            <span className="font-mono underline">View Trip</span>
          </Link>
        </div>
      )}

      {!hideNav && <BottomNav />}
    </div>
  );
}

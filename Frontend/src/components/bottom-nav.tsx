import { Link, useRouterState } from "@tanstack/react-router";
import { Map, Route, Navigation, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/map", label: "Live Map", icon: Map },
  { to: "/routes", label: "Routes", icon: Route },
  { to: "/journey", label: "Journey", icon: Navigation },
  { to: "/crowd", label: "Crowd", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-center gap-1 px-3 py-1"
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  active
                    ? "bg-eco-orange text-background"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-wider",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Calendar, Wallet, Menu } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import type { LucideIcon } from "lucide-react";

type Tab = { to?: string; key: TKey; icon: LucideIcon; exact?: boolean };

const tabs: Tab[] = [
  { to: "/", key: "nav.dashboard", icon: LayoutDashboard, exact: true },
  { to: "/members", key: "nav.members", icon: Users },
  { to: "/events", key: "nav.events", icon: Calendar },
  { to: "/fees", key: "nav.fee", icon: Wallet },
];

function isActive(pathname: string, to?: string, exact?: boolean) {
  if (!to) return false;
  if (exact || to === "/") return pathname === to;
  return pathname === to || pathname.startsWith(to + "/");
}

/** Mobile-only bottom tab bar for the admin dashboard. */
export function BottomNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const unread = useUnreadNotifications();

  const itemCls = (active: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-all duration-200 ${
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch gap-1 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(pathname, tab.to, tab.exact);
          return (
            <Link key={tab.to} to={tab.to!} className={itemCls(active)}>
              {active && (
                <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary transition-all duration-200" />
              )}
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? "scale-110" : ""}`}
              />
              <span className="text-[10px] font-medium leading-none transition-opacity duration-200">
                {t(tab.key)}
              </span>
            </Link>
          );
        })}
        <button onClick={onMenuClick} className={itemCls(false)} aria-label={t("nav.menu")}>
          <span className="relative">
            <Menu className="h-5 w-5 shrink-0" />
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium leading-none transition-opacity duration-200">
            {t("nav.menu")}
          </span>
        </button>
      </div>
    </nav>
  );
}

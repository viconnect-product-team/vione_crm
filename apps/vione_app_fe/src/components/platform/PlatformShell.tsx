import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  ShieldCheck,
  ArrowLeft,
  Menu,
  X,
  KeyRound,
  ScrollText,
  ReceiptText,
  Bot,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";

type NavItem = { to: string; label: string; icon: LucideIcon };

function useNav(): NavItem[] {
  const t = useT();
  return [
    { to: "/platform", label: t("platform.tab.assoc"), icon: Building2 },
    { to: "/platform/admins", label: t("platform.tab.admins"), icon: ShieldCheck },
    { to: "/platform/permissions", label: t("platform.tab.permissions"), icon: KeyRound },
    { to: "/platform/audit", label: t("platform.tab.audit"), icon: ScrollText },
    { to: "/platform/ai-audit", label: t("platform.tab.aiaudit"), icon: Bot },
    {
      to: "/platform/renewal-audit",
      label: t("platform.tab.renewalAudit"),
      icon: ReceiptText,
    },
    { to: "/platform/introduction-operations", label: t("nav.platform.introOps"), icon: Activity },
  ];
}

function isActive(pathname: string | undefined, to: string) {
  if (!pathname) return false;
  if (to === "/platform") return pathname === "/platform";
  return pathname === to || pathname.startsWith(to + "/");
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const items = useNav();
  const pathname = useRouterState({ select: (s) => s?.location?.pathname });
  return (
    <div className="space-y-0.5 px-3">
      {items.map((it) => {
        const active = isActive(pathname, it.to);
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--shadow-glow)]"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="h-[16px] w-[16px] shrink-0" />
            <span className="flex-1 text-left">{it.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function ShellSidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const t = useT();
  return (
    <aside
      className={`${mobile ? "flex h-screen w-[280px] max-w-[85vw]" : "sticky top-0 hidden h-screen w-[260px] lg:flex"} shrink-0 flex-col border-r border-sidebar-border`}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      <div className="flex h-[72px] items-center gap-3 border-b border-sidebar-border px-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-primary-foreground"
          style={{ background: "var(--gradient-card)" }}
        >
          VBA
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13px] font-semibold text-sidebar-primary-foreground">
            {t("platform.title")}
          </div>
          <div className="truncate text-[11px] text-sidebar-foreground/60">
            {t("platform.subtitle")}
          </div>
        </div>
      </div>

      <div className="sidebar-scroll flex-1 overflow-y-auto py-4">
        <NavList onNavigate={onNavigate} />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ArrowLeft className="h-[16px] w-[16px]" />
          {t("platform.backToApp")}
        </Link>
      </div>
    </aside>
  );
}

export function PlatformShell({ children }: { children: ReactNode }) {
  const t = useT();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <ShellSidebar />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl animate-in slide-in-from-left duration-200">
            <ShellSidebar mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label={t("platform.title")}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">{t("platform.title")}</span>
          <button
            onClick={async () => {
              try {
                await logout();
              } catch {
                /* ignore */
              }
              window.location.href = "/auth";
            }}
            className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            {t("platform.signOut")}
          </button>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

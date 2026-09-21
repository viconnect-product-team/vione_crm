import { HelpCircle, Menu, Search } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import { AssociationSwitcher } from "@/components/dashboard/AssociationSwitcher";
import { ProfileMenu } from "@/components/dashboard/ProfileMenu";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { TopbarBreadcrumb } from "@/components/dashboard/TopbarBreadcrumb";
import { useCommandPalette } from "@/components/dashboard/CommandPalette";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const t = useT();
  const { setOpen } = useCommandPalette();

  return (
    <header className="sticky top-0 z-50 flex h-14 sm:h-16 lg:h-[72px] w-full items-center justify-between gap-1.5 sm:gap-2.5 lg:gap-4 border-b border-border bg-background/95 px-2.5 sm:px-4 lg:px-8 backdrop-blur-md max-w-full transition-colors duration-200">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5 flex-1 lg:flex-initial">
        <button
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <TopbarBreadcrumb />
      </div>

      {/* Quick search — opens the ⌘K command palette */}
      <div className="hidden max-w-xs lg:max-w-md flex-1 md:flex mx-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex h-9 lg:h-10 w-full items-center gap-2.5 rounded-full border border-border bg-secondary/80 pl-3.5 pr-2 text-left text-xs lg:text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          aria-label={t("cmd.open")}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{t("top.search")}</span>
          <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right-side controls */}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 md:gap-2">
        {/* Mobile: icon trigger for the palette */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full p-1.5 sm:p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label={t("cmd.open")}
        >
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <AssociationSwitcher />
        <LangSwitcher />
        <ThemeSwitcher className="hidden sm:inline-flex" />
        <NotificationCenter />

        <button className="hidden rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground xl:inline-flex">
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Profile */}
        <ProfileMenu />
      </div>
    </header>
  );
}

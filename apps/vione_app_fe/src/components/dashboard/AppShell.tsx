import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { MobileMenuDrawer } from "./MobileMenuDrawer";
import { CommandPaletteProvider } from "./CommandPalette";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-['Inter',sans-serif] text-foreground antialiased">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile drawer (swipe + tap-outside to close) */}
        <MobileMenuDrawer open={mobileOpen} onOpenChange={setMobileOpen} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-6 lg:p-8">{children}</main>
          <BottomNav onMenuClick={() => setMobileOpen(true)} />
        </div>
      </div>
    </CommandPaletteProvider>
  );
}

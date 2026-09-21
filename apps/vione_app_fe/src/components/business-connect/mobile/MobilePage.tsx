// BC-Mobile-0B — page scaffold for the BC mobile shell.
// Standardizes: horizontal padding, side safe-area, bottom clearance for the
// fixed bottom nav (+ iPhone home indicator). Pages are NOT forced into
// cards — content composes its own surfaces.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MobilePage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("bc-page-enter flex flex-1 flex-col", className)}
      style={{
        paddingLeft: "max(1.25rem, var(--bc-mobile-safe-left))",
        paddingRight: "max(1.25rem, var(--bc-mobile-safe-right))",
        paddingBottom: "calc(var(--bc-mobile-nav-h) + var(--bc-mobile-safe-bottom) + 24px)",
      }}
    >
      {children}
    </div>
  );
}

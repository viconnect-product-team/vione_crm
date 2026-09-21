import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BusinessConnectTopBar({
  title,
  back,
  onBack,
  left,
  right,
  className,
}: {
  title?: string;
  back?: boolean;
  onBack?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  const t = useT();
  // An empty bar (no title, back, or slots) would render as a blank band above
  // the page — keep only the safe-area inset in that case.
  const empty = !title && !back && !left && !right;
  if (empty) {
    return <div aria-hidden="true" style={{ paddingTop: "var(--bc-mobile-safe-top-compact)" }} />;
  }
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[rgba(216,178,130,0.15)] bg-[var(--bc-mobile-surface)]/80 backdrop-blur-lg -mx-5 w-[calc(100%+2.5rem)]",
        className,
      )}
      style={{ paddingTop: "var(--bc-mobile-safe-top-compact)" }}
    >
      <div
        style={{ height: "var(--bc-mobile-header-h)" }}
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[var(--bc-mobile-header-gap)] px-3"
      >
        <div className="flex min-w-11 items-center justify-start pl-1">
          {back ? (
            <button
              type="button"
              onClick={onBack ?? (() => window.history.back())}
              aria-label={t("bc.mobile.topbar.back")}
              className="grid h-[var(--bc-mobile-header-action)] w-[var(--bc-mobile-header-action)] place-items-center rounded-full text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)]"
            >
              <ChevronLeft
                style={{
                  height: "var(--bc-mobile-header-icon)",
                  width: "var(--bc-mobile-header-icon)",
                }}
              />
            </button>
          ) : (
            left
          )}
        </div>
        {title ? (
          <h1 className="truncate text-center text-[16px] font-semibold tracking-tight text-[var(--bc-mobile-text)]">
            {title}
          </h1>
        ) : (
          <span />
        )}
        <div
          className="flex min-w-11 items-center justify-end pr-1"
          style={{ paddingRight: "calc(0.25rem + var(--bc-mobile-safe-right))" }}
        >
          {right}
        </div>
      </div>
    </header>
  );
}

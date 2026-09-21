import { Moon, Sun, Contrast } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { useT } from "@/lib/i18n";

type TKey = Parameters<ReturnType<typeof useT>>[0];

type Variant = "default" | "overlay";

/**
 * Three-mode appearance switcher: light / dark / high-contrast.
 * Keeps the indigo enterprise identity in every mode.
 */
export function ThemeSwitcher({
  variant = "default",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const isOverlay = variant === "overlay";

  const wrap = isOverlay
    ? "inline-flex items-center rounded-lg bg-foreground/40 p-0.5 backdrop-blur-md gap-0.5"
    : "inline-flex items-center rounded-lg bg-card p-0.5 gap-0.5";

  const baseBtn =
    "inline-flex h-7 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  const activeCls = isOverlay
    ? "bg-card text-foreground shadow-sm"
    : "bg-primary text-primary-foreground shadow-sm";

  const idleCls = isOverlay
    ? "text-primary-foreground/70 hover:text-primary-foreground"
    : "text-muted-foreground hover:text-foreground";

  const opts: { mode: Theme; icon: typeof Sun; labelKey: TKey }[] = [
    { mode: "light", icon: Sun, labelKey: "theme.light" },
    { mode: "dark", icon: Moon, labelKey: "theme.dark" },
    { mode: "contrast", icon: Contrast, labelKey: "theme.contrast" },
  ];

  return (
    <div role="group" aria-label={t("theme.label")} className={`${wrap} ${className}`}>
      {opts.map((o) => {
        const Icon = o.icon;
        const active = theme === o.mode;
        return (
          <button
            key={o.mode}
            type="button"
            onClick={() => setTheme(o.mode)}
            aria-pressed={active}
            aria-label={t(o.labelKey)}
            title={t(o.labelKey)}
            className={`${baseBtn} ${active ? activeCls : idleCls}`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

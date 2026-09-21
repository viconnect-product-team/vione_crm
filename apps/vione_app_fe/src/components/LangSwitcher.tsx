import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { useLang, type Lang } from "@/lib/i18n";

type Variant = "default" | "dropdown" | "overlay" | "inline";
type ThemeMode = "dark" | "light" | "contrast";

export function LangSwitcher({
  variant = "default",
  className = "",
  showFullLabel = false,
  themeMode,
}: {
  variant?: Variant;
  className?: string;
  /** Show the full language name ("Tiếng Việt" / "English") on wider screens. */
  showFullLabel?: boolean;
  themeMode?: ThemeMode;
}) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const opts: { code: Lang; label: string; full: string }[] = [
    { code: "vi", label: "VI", full: "Tiếng Việt" },
    { code: "en", label: "EN", full: "English" },
    { code: "km", label: "KM", full: "ភាសាខ្មែរ" },
    { code: "my", label: "MY", full: "မြန်မာဘာသာ" },
    { code: "lo", label: "LO", full: "ພາສາລາວ" },
    { code: "ja", label: "JA", full: "日本語" },
    { code: "ko", label: "KO", full: "한국어" },
    { code: "zh", label: "ZH", full: "中文" },
  ];

  const current = opts.find((o) => o.code === lang) ?? opts[0];

  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  // If explicit "inline" is requested
  if (variant === "inline") {
    const baseBtn =
      "relative inline-flex h-7 min-w-[36px] items-center justify-center gap-1 rounded-md px-2 text-xs transition-colors";
    return (
      <div role="group" aria-label="Language" className={`inline-flex items-center rounded-lg bg-card p-0.5 gap-0.5 border border-border ${className}`}>
        {opts.map((o) => {
          const active = lang === o.code;
          return (
            <button
              key={o.code}
              type="button"
              onClick={() => setLang(o.code)}
              aria-pressed={active}
              aria-label={o.full}
              title={o.full}
              className={`${baseBtn} ${
                active
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`tracking-wide ${showFullLabel ? "sm:hidden" : ""}`}>{o.label}</span>
              {showFullLabel && <span className="hidden tracking-wide sm:inline">{o.full}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // Determine container and button classes based on themeMode
  const triggerBtnClass = isContrast
    ? "border-white/50 bg-black text-white hover:bg-zinc-900"
    : isDark
    ? "border-amber-500/40 bg-[#161B28] text-slate-100 hover:bg-white/10 hover:border-amber-400"
    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-amber-500 shadow-xs";

  const dropdownMenuClass = isContrast
    ? "border-white bg-black text-white shadow-2xl"
    : isDark
    ? "border-amber-500/30 bg-[#0E1320]/98 text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
    : "border-slate-200 bg-white text-slate-900 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl";

  const activeItemClass = isContrast
    ? "bg-white text-black font-extrabold shadow-sm"
    : "bg-gradient-to-r from-[#F7D896] via-[#E2B755] to-[#C49338] text-slate-950 font-black shadow-xs";

  const inactiveItemClass = isContrast
    ? "text-slate-300 hover:bg-zinc-800 hover:text-white"
    : isDark
    ? "text-slate-300 hover:bg-white/10 hover:text-[#E8C986]"
    : "text-slate-700 hover:bg-amber-500/10 hover:text-amber-800";

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.full}`}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-xs transition-all focus:outline-none cursor-pointer ${triggerBtnClass}`}
      >
        <span className="uppercase tracking-wider text-[11px] font-extrabold">{current.label}</span>
        <ChevronDown className="h-3 w-3 text-[#B18B44] transition-transform duration-200" />
      </button>

      {open && (
        <div
          role="listbox"
          className={`vba-pop-in absolute right-0 z-[9999] mt-2 w-44 overflow-hidden rounded-2xl border p-1.5 ${dropdownMenuClass}`}
        >
          <div className="space-y-0.5">
            {opts.map((o) => {
              const active = lang === o.code;
              return (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => {
                    setLang(o.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    active ? activeItemClass : inactiveItemClass
                  }`}
                >
                  <span className="text-left font-medium">{o.full}</span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

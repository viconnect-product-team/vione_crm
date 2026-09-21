import { toast } from "sonner";

export interface MobileToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function getActiveTheme(): "dark" | "light" | "contrast" {
  if (typeof document === "undefined") return "dark";
  const doc = document.documentElement;
  if (doc.classList.contains("hc") || doc.dataset.theme === "contrast") return "contrast";
  if (doc.classList.contains("dark") || doc.dataset.theme === "dark") return "dark";
  return "light";
}

function triggerHaptic(type: "success" | "warning" | "error" | "info" = "info") {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      if (type === "success") navigator.vibrate([40, 30, 60]);
      else if (type === "error") navigator.vibrate([80, 50, 80]);
      else navigator.vibrate(40);
    }
  } catch {
    /* ignore */
  }
}

export const mobileToast = {
  success(message: string, options?: MobileToastOptions) {
    triggerHaptic("success");
    const theme = getActiveTheme();

    toast.custom((t) => (
      <div
        className={`w-full max-w-sm rounded-2xl p-3.5 backdrop-blur-xl border transition-all duration-300 shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-3 ${
          theme === "contrast"
            ? "bg-black border-[#FFD700] text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.35)]"
            : theme === "light"
            ? "bg-white/95 border-emerald-500/30 text-slate-900 shadow-[0_10px_30px_rgba(16,185,129,0.15)]"
            : "bg-[#0F1420]/95 border-emerald-500/40 text-white shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(16,185,129,0.12)]"
        }`}
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            theme === "contrast"
              ? "bg-[#FFD700] text-black"
              : "bg-emerald-500 text-white"
          }`}
        >
          ✓
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight">{message}</p>
          {options?.description && (
            <p
              className={`mt-0.5 text-[11px] leading-snug ${
                theme === "contrast" ? "text-[#E6C200]" : theme === "light" ? "text-slate-600" : "text-slate-300"
              }`}
            >
              {options.description}
            </p>
          )}
          {options?.action && (
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t);
                options.action?.onClick();
              }}
              className="mt-2 text-[11px] font-bold underline cursor-pointer"
            >
              {options.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="opacity-60 hover:opacity-100 text-xs px-1"
        >
          ✕
        </button>
      </div>
    ), { duration: options?.duration || 4000 });
  },

  error(message: string, options?: MobileToastOptions) {
    triggerHaptic("error");
    const theme = getActiveTheme();

    toast.custom((t) => (
      <div
        className={`w-full max-w-sm rounded-2xl p-3.5 backdrop-blur-xl border transition-all duration-300 shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-3 ${
          theme === "contrast"
            ? "bg-black border-red-500 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
            : theme === "light"
            ? "bg-white/95 border-red-500/30 text-slate-900 shadow-[0_10px_30px_rgba(239,68,68,0.15)]"
            : "bg-[#0F1420]/95 border-red-500/40 text-white shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(239,68,68,0.15)]"
        }`}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
          ✕
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight">{message}</p>
          {options?.description && (
            <p className={`mt-0.5 text-[11px] leading-snug ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
              {options.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="opacity-60 hover:opacity-100 text-xs px-1"
        >
          ✕
        </button>
      </div>
    ), { duration: options?.duration || 5000 });
  },

  info(message: string, options?: MobileToastOptions) {
    triggerHaptic("info");
    const theme = getActiveTheme();

    toast.custom((t) => (
      <div
        className={`w-full max-w-sm rounded-2xl p-3.5 backdrop-blur-xl border transition-all duration-300 shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-3 ${
          theme === "contrast"
            ? "bg-black border-[#FFD700] text-[#FFD700]"
            : theme === "light"
            ? "bg-white/95 border-[#D8B282]/40 text-slate-900 shadow-[0_10px_30px_rgba(216,178,130,0.2)]"
            : "bg-[#0F1420]/95 border-[#D8B282]/50 text-white shadow-[0_12px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(216,178,130,0.12)]"
        }`}
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            theme === "contrast"
              ? "bg-[#FFD700] text-black"
              : "bg-gradient-to-br from-[#E2B755] to-[#B8860B] text-slate-950"
          }`}
        >
          ★
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight">{message}</p>
          {options?.description && (
            <p className={`mt-0.5 text-[11px] leading-snug ${theme === "light" ? "text-slate-600" : "text-slate-300"}`}>
              {options.description}
            </p>
          )}
          {options?.action && (
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t);
                options.action?.onClick();
              }}
              className="mt-2 text-[11px] font-bold underline cursor-pointer"
            >
              {options.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="opacity-60 hover:opacity-100 text-xs px-1"
        >
          ✕
        </button>
      </div>
    ), { duration: options?.duration || 4000 });
  },
};

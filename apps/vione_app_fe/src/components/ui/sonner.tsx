import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/lib/theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  const themeToastClass =
    theme === "light"
      ? "group toast group-[.toaster]:bg-white/95 group-[.toaster]:text-slate-900 group-[.toaster]:border-[#003B95]/25 group-[.toaster]:border group-[.toaster]:shadow-[0_12px_36px_rgba(0,59,149,0.12),0_2px_8px_rgba(0,0,0,0.06)] group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:font-sans"
      : theme === "contrast"
      ? "group toast group-[.toaster]:bg-black group-[.toaster]:text-white group-[.toaster]:border-2 group-[.toaster]:border-amber-400 group-[.toaster]:shadow-[0_0_24px_rgba(245,158,11,0.5)] group-[.toaster]:rounded-2xl group-[.toaster]:font-sans"
      : "group toast group-[.toaster]:bg-[#070D1A]/95 group-[.toaster]:text-slate-100 group-[.toaster]:border-[#003B95]/50 group-[.toaster]:border group-[.toaster]:shadow-[0_12px_36px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.2)] group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:font-sans";

  const themeDescClass =
    theme === "light"
      ? "group-[.toast]:text-slate-600 text-xs mt-0.5"
      : theme === "contrast"
      ? "group-[.toast]:text-amber-200 text-xs mt-0.5"
      : "group-[.toast]:text-slate-300 text-xs mt-0.5";

  const themeActionClass =
    theme === "light"
      ? "group-[.toast]:bg-[#003B95] group-[.toast]:text-white font-bold group-[.toast]:rounded-xl"
      : theme === "contrast"
      ? "group-[.toast]:bg-amber-400 group-[.toast]:text-black font-black group-[.toast]:rounded-xl"
      : "group-[.toast]:bg-gradient-to-r group-[.toast]:from-amber-400 group-[.toast]:to-amber-500 group-[.toast]:text-slate-950 font-bold group-[.toast]:rounded-xl";

  const themeCancelClass =
    theme === "light"
      ? "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700 group-[.toast]:rounded-xl"
      : theme === "contrast"
      ? "group-[.toast]:bg-zinc-900 group-[.toast]:text-white group-[.toast]:border group-[.toast]:border-amber-400/50 group-[.toast]:rounded-xl"
      : "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-300 group-[.toast]:rounded-xl";

  return (
    <Sonner
      className="toaster group"
      theme={theme === "contrast" ? "dark" : theme}
      toastOptions={{
        classNames: {
          toast: themeToastClass,
          description: themeDescClass,
          actionButton: themeActionClass,
          cancelButton: themeCancelClass,
          success:
            theme === "light"
              ? "group-[.toast]:text-emerald-700 group-[.toast]:border-emerald-300"
              : theme === "contrast"
              ? "group-[.toast]:text-emerald-400 group-[.toast]:border-emerald-400"
              : "group-[.toast]:text-emerald-300 group-[.toast]:border-emerald-500/40",
          error:
            theme === "light"
              ? "group-[.toast]:text-rose-700 group-[.toast]:border-rose-300"
              : theme === "contrast"
              ? "group-[.toast]:text-rose-400 group-[.toast]:border-rose-400"
              : "group-[.toast]:text-rose-300 group-[.toast]:border-rose-500/40",
          info:
            theme === "light"
              ? "group-[.toast]:text-sky-700 group-[.toast]:border-sky-300"
              : theme === "contrast"
              ? "group-[.toast]:text-cyan-400 group-[.toast]:border-cyan-400"
              : "group-[.toast]:text-sky-300 group-[.toast]:border-sky-500/40",
          warning:
            theme === "light"
              ? "group-[.toast]:text-amber-700 group-[.toast]:border-amber-300"
              : theme === "contrast"
              ? "group-[.toast]:text-yellow-300 group-[.toast]:border-yellow-400"
              : "group-[.toast]:text-amber-300 group-[.toast]:border-amber-500/40",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };


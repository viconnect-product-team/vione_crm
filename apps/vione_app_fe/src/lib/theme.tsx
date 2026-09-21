import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "contrast";

const STORAGE_KEY = "vba.theme";

type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Cycles light → dark → contrast → light */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // High-contrast builds on the dark surface set, then overrides tokens via .hc
  root.classList.toggle("dark", theme === "dark" || theme === "contrast");
  root.classList.toggle("hc", theme === "contrast");
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "light" ? "light" : "dark";
}

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "contrast" || saved === "light") return saved;
  } catch {
    /* ignore */
  }
  if (window.matchMedia?.("(prefers-contrast: more)").matches) return "contrast";
  return "light";
}

const ORDER: Theme[] = ["light", "dark", "contrast"];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Hydrate from stored/device preference on mount.
  useEffect(() => {
    const initial = readInitial();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  };

  const toggle = () => setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

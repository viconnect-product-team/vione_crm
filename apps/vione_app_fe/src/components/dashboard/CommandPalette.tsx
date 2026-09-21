import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { Contrast, Moon, Sun } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { navGroups } from "@/lib/nav-items";
import { useT } from "@/lib/i18n";
import { useRole } from "@/hooks/use-role";
import { useTheme } from "@/lib/theme";

type Ctx = { open: boolean; setOpen: (v: boolean) => void; toggle: () => void };
const CommandPaletteContext = createContext<Ctx | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

const RECENT_KEY = "vba.cmd.recent";

function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(to: string) {
  try {
    const next = [to, ...getRecent().filter((p) => p !== to)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const t = useT();
  const navigate = useNavigate();
  const { isPlatformAdmin } = useRole();
  const { theme, toggle: toggleTheme } = useTheme();
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (open) setRecent(getRecent());
  }, [open]);

  const go = useCallback(
    (to: string) => {
      pushRecent(to);
      setOpen(false);
      navigate({ to });
    },
    [navigate, setOpen],
  );

  const groups = navGroups.filter((g) => !g.platformOnly || isPlatformAdmin);

  // Flat lookup for resolving recent paths to their nav item.
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const recentItems = recent
    .map((to) => allItems.find((it) => it.to === to))
    .filter((it): it is (typeof allItems)[number] => Boolean(it));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("cmd.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("cmd.empty")}</CommandEmpty>

        {recentItems.length > 0 && (
          <CommandGroup heading={t("cmd.recent")}>
            {recentItems.map((item) => {
              const Icon = item.icon;
              const label = t(item.key);
              return (
                <CommandItem
                  key={`recent-${item.to}`}
                  value={`recent ${label} ${item.to}`}
                  onSelect={() => go(item.to)}
                >
                  <Icon />
                  <span>{label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandGroup heading={t("cmd.actions")}>
          <CommandItem
            value="theme toggle dark light contrast tuong phan"
            onSelect={() => {
              toggleTheme();
              setOpen(false);
            }}
          >
            {theme === "light" ? <Moon /> : theme === "dark" ? <Contrast /> : <Sun />}
            <span>
              {theme === "light"
                ? t("theme.dark")
                : theme === "dark"
                  ? t("theme.contrast")
                  : t("theme.light")}
            </span>
          </CommandItem>
        </CommandGroup>

        {groups.map((group, i) => (
          <CommandGroup key={i} heading={group.label ? t(group.label) : t("cmd.navigation")}>
            {group.items.map((item) => {
              const Icon = item.icon;
              const label = t(item.key);
              return (
                <CommandItem
                  key={item.to}
                  value={`${label} ${item.to}`}
                  onSelect={() => go(item.to)}
                >
                  <Icon />
                  <span>{label}</span>
                  {item.to === "/" && <CommandShortcut>⌘K</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

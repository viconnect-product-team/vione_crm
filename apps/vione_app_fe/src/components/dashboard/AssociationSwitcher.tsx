import { Check, ChevronsUpDown, Building2, Shield, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { useT, type TKey } from "@/lib/i18n";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import {
  listMyAssociationsFn,
  setActiveAssociationFn,
  type MyAssociation,
} from "@/lib/associations.functions";

function roleBadgeKey(role: string, isPlatformAdmin: boolean): TKey {
  if (isPlatformAdmin) return "role.badge.platform";
  const r = (role ?? "").toLowerCase();
  if (r === "admin" || r === "association_admin") return "role.badge.admin";
  if (r === "moderator") return "role.badge.moderator";
  return "role.badge.member";
}

function AssocAvatar({ assoc, size = "md" }: { assoc: MyAssociation; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[11px]";
  const initials = assoc.name.trim().slice(0, 2).toUpperCase();
  if (assoc.logoUrl) {
    return <img src={assoc.logoUrl} alt="" className={`${dim} shrink-0 rounded-lg object-cover`} />;
  }
  return (
    <div
      className={`${dim} grid shrink-0 place-items-center rounded-lg font-bold text-primary-foreground`}
      style={{ background: "var(--gradient-card)" }}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role, isPlatformAdmin }: { role: string; isPlatformAdmin: boolean }) {
  const t = useT();
  const key = roleBadgeKey(role, isPlatformAdmin);
  const tone =
    key === "role.badge.platform"
      ? "bg-primary/10 text-primary"
      : key === "role.badge.admin"
        ? "bg-info/10 text-info"
        : key === "role.badge.moderator"
          ? "bg-warning/15 text-warning"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}
    >
      {key === "role.badge.platform" && <Shield className="h-3 w-3" />}
      {t(key)}
    </span>
  );
}

export function AssociationSwitcher() {
  const t = useT();
  const router = useRouter();
  const { isPlatformAdmin } = useRole();
  const fetchMine = useServerFn(listMyAssociationsFn);
  const setActive = useServerFn(setActiveAssociationFn);

  const { data: items, reload } = useServerData<MyAssociation[]>(() => fetchMine(), []);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      // Focus search shortly after the dropdown mounts.
      const id = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
  }, [open]);

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

  if (!items || items.length === 0) return null;

  const active = items.find((a) => a.isActive) ?? items[0];
  const multi = items.length > 1;
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((a: any) => a.name.toLowerCase().includes(q)) : items;

  const onSelect = async (a: MyAssociation) => {
    if (a.isActive || busy) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await setActive({ data: { associationId: a.associationId } });
      toast.success(t("assoc.switch.switched"));
      setOpen(false);
      await reload();
      // Notify other components (Sidebar, etc.) to refetch tenant-scoped data,
      // then invalidate all loaders so no stale cross-association data leaks.
      window.dispatchEvent(new Event("association-changed"));
      router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => multi && setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2 text-sm transition-colors ${
          multi ? "hover:bg-muted" : "cursor-default"
        }`}
        aria-haspopup={multi ? "listbox" : undefined}
        aria-expanded={multi ? open : undefined}
        aria-label={active.name}
      >
        <AssocAvatar assoc={active} size="sm" />
        <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
          <span className="max-w-[150px] truncate font-semibold text-foreground">
            {active.name}
          </span>
        </span>
        {multi && <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && multi && (
        <div
          role="listbox"
          className="vba-pop-in absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-[var(--shadow-elevated)]"
        >
          <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {t("assoc.switch.title")}
          </div>
          {items.length > 6 && (
            <div className="mb-1 flex items-center gap-2 rounded-lg border border-border bg-secondary px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered[0]) onSelect(filtered[0]);
                }}
                placeholder={t("assoc.switch.search")}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                aria-label={t("assoc.switch.search")}
              />
            </div>
          )}
          <div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
                {t("assoc.switch.noResult")}
              </p>
            )}
            {filtered.map((a: any) => (
              <button
                key={a.associationId}
                onClick={() => onSelect(a)}
                disabled={busy}
                role="option"
                aria-selected={a.isActive}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors duration-[var(--motion-fast)] ease-out focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
                  a.isActive ? "bg-accent" : "hover:bg-muted"
                }`}
              >
                <AssocAvatar assoc={a} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {a.name}
                    </span>
                  </span>
                  <span className="mt-0.5 block">
                    <RoleBadge role={a.role} isPlatformAdmin={isPlatformAdmin} />
                  </span>
                </span>
                {a.isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

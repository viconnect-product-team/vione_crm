import { useMemo, useState } from "react";
import { Link2, Loader2, Check, Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServerData } from "@/hooks/use-server-data";
import { useT } from "@/lib/i18n";
import { linkMemberErrorKey } from "@/lib/link-member-error";
import {
  listLinkableMembersFn,
  linkMyMemberProfileFn,
  type LinkableMember,
} from "@/lib/current-member.functions";

/**
 * Searchable modal to find a member profile matching the account email,
 * link it, then hand control back so the caller can open a new card editor.
 */
export function LinkMemberModal({
  open,
  onOpenChange,
  onLinked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful link so the caller can create a new card. */
  onLinked?: () => void;
}) {
  const t = useT();
  const { data, loading, reload } = useServerData<LinkableMember[]>(
    () => listLinkableMembersFn(),
    [],
  );
  const linkFn = useServerFn(linkMyMemberProfileFn);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((m) =>
      [m.name, m.code, m.associationName].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [data, query]);

  const handleLink = async (memberId: string) => {
    setBusyId(memberId);
    try {
      await linkFn({ data: { memberId } });
      toast.success(t("bc.link.success"));
      reload();
      onOpenChange(false);
      onLinked?.();
    } catch (e) {
      toast.error(t(linkMemberErrorKey(e)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" aria-hidden />
            {t("bc.link.search.title")}
          </DialogTitle>
          <DialogDescription>{t("bc.link.search.desc")}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("bc.link.search.placeholder")}
            aria-label={t("bc.link.search.placeholder")}
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("bc.link.loading")}
            </div>
          ) : data.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">{t("bc.link.none")}</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">{t("bc.link.search.noResults")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((m) => {
                const busy = busyId === m.id;
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">
                          {m.code} · {m.associationName}
                        </span>
                      </div>
                    </div>
                    {m.alreadyLinked ? (
                      <button
                        onClick={() => void handleLink(m.id)}
                        disabled={busy}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        {t("bc.link.selectLinked")}
                      </button>
                    ) : (
                      <button
                        onClick={() => void handleLink(m.id)}
                        disabled={busy}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
                      >
                        {busy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("bc.link.linking")}
                          </>
                        ) : (
                          t("bc.link.linkAndCreate")
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

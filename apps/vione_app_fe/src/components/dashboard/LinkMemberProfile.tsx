import { useState } from "react";
import { Link2, Loader2, Check, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { useT } from "@/lib/i18n";
import { linkMemberErrorKey } from "@/lib/link-member-error";
import {
  listLinkableMembersFn,
  linkMyMemberProfileFn,
  unlinkMyMemberProfileFn,
  type LinkableMember,
} from "@/lib/current-member.functions";

/**
 * Prompts the signed-in user to link their account to a matching member
 * profile (by email) so member-scoped features (business cards, etc.) have
 * data. Calls onLinked after a successful link so the parent can reload.
 */
export function LinkMemberProfile({ onLinked }: { onLinked?: () => void }) {
  const t = useT();
  const { data, loading, reload } = useServerData<LinkableMember[]>(
    () => listLinkableMembersFn(),
    [],
  );
  const linkFn = useServerFn(linkMyMemberProfileFn);
  const unlinkFn = useServerFn(unlinkMyMemberProfileFn);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleLink = async (memberId: string) => {
    setBusyId(memberId);
    try {
      await linkFn({ data: { memberId } });
      toast.success(t("bc.link.success"));
      reload();
      onLinked?.();
    } catch (e) {
      toast.error(t(linkMemberErrorKey(e)));
    } finally {
      setBusyId(null);
    }
  };

  const handleUnlink = async (memberId: string) => {
    setBusyId(memberId);
    try {
      await unlinkFn({ data: { memberId } });
      toast.success(t("bc.link.unlinked"));
      reload();
      onLinked?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("bc.link.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("bc.link.desc")}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("bc.link.loading")}
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("bc.link.none")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((m) => {
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
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Check className="h-3.5 w-3.5" />
                      {t("bc.link.linked")}
                    </span>
                    <button
                      onClick={() => void handleUnlink(m.id)}
                      disabled={busy}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        t("bc.link.unlink")
                      )}
                    </button>
                  </div>
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
                      t("bc.link.action")
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

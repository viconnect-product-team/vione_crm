// BC-5.1 — Outgoing (sent) connection requests list.

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useCancelRequest, useCounterparts, useOutgoingRequests } from "@/hooks/use-connection";
import { PersonRow } from "./PersonRow";

export function OutgoingRequestsList() {
  const t = useT();
  const q = useOutgoingRequests();
  const cancel = useCancelRequest();
  const userIds = useMemo(
    () => (q.data ?? []).map((r: any) => r.recipient.userId!).filter(Boolean),
    [q.data],
  );
  const counterparts = useCounterparts(userIds);

  if (q.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted/30" />
        ))}
      </div>
    );
  }
  if (q.isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
      >
        {t("bc.conn.err.internal")}
      </div>
    );
  }
  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center" data-testid="bc-empty">
        <p className="text-sm font-semibold text-foreground">{t("bc.conn.empty.sent.title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("bc.conn.empty.sent.body")}</p>
      </div>
    );
  }
  return (
    <ul role="list" className="flex flex-col gap-3" data-testid="bc-outgoing-list">
      {rows.map((r: any) => {
        const cp = counterparts.data?.get(r.recipient.userId ?? "");
        return (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
          >
            <PersonRow
              counterpart={cp}
              fallbackUserId={r.recipient.userId ?? ""}
              subtitle={new Date(r.createdAt).toLocaleDateString()}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={cancel.isPending}
              onClick={() =>
                cancel.mutate({
                  requestId: r.id,
                  targetPersonNodeId: r.recipient.personNodeId,
                })
              }
              data-testid="bc-outgoing-cancel"
            >
              {cancel.isPending ? t("bc.conn.working") : t("bc.conn.action.cancel")}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

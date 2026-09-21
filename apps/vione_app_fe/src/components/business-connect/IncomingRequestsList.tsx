// BC-5.1 — Incoming connection requests list.

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import {
  useAcceptRequest,
  useCounterparts,
  useDeclineRequest,
  useIncomingRequests,
} from "@/hooks/use-connection";
import { PersonRow } from "./PersonRow";

export function IncomingRequestsList() {
  const t = useT();
  const q = useIncomingRequests();
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();

  const userIds = useMemo(
    () => (q.data ?? []).map((r: any) => r.requester.userId!).filter(Boolean),
    [q.data],
  );
  const counterparts = useCounterparts(userIds);

  if (q.isPending) {
    return <ListSkeleton />;
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
      <Empty title={t("bc.conn.empty.incoming.title")} body={t("bc.conn.empty.incoming.body")} />
    );
  }
  return (
    <ul role="list" className="flex flex-col gap-3" data-testid="bc-incoming-list">
      {rows.map((r: any) => {
        const cp = counterparts.data?.get(r.requester.userId ?? "");
        const busy = accept.isPending || decline.isPending;
        return (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
          >
            <PersonRow
              counterpart={cp}
              fallbackUserId={r.requester.userId ?? ""}
              subtitle={formatDate(r.createdAt)}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  accept.mutate({
                    requestId: r.id,
                    targetPersonNodeId: r.requester.personNodeId,
                  })
                }
                data-testid="bc-incoming-accept"
              >
                {t("bc.conn.action.accept")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  decline.mutate({
                    requestId: r.id,
                    targetPersonNodeId: r.requester.personNodeId,
                  })
                }
                data-testid="bc-incoming-decline"
              >
                {t("bc.conn.action.decline")}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted/30" />
      ))}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center" data-testid="bc-empty">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

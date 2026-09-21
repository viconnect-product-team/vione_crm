// BC-5.1 — Connected people list with disconnect/block per-row actions.

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n";
import { useConnectedPeople, useCounterparts } from "@/hooks/use-connection";
import { PersonRow } from "./PersonRow";
import { DisconnectDialog } from "./DisconnectDialog";
import { BlockDialog } from "./BlockDialog";

export function ConnectedPeopleList() {
  const t = useT();
  const q = useConnectedPeople();
  const userIds = useMemo(
    () => (q.data ?? []).map((r: any) => r.person.userId!).filter(Boolean),
    [q.data],
  );
  const counterparts = useCounterparts(userIds);

  const [target, setTarget] = useState<{
    nodeId: string;
    label: string;
    mode: "disconnect" | "block";
  } | null>(null);

  if (q.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
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
        <p className="text-sm font-semibold text-foreground">
          {t("bc.conn.empty.connected.title")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t("bc.conn.empty.connected.body")}</p>
      </div>
    );
  }

  return (
    <>
      <ul role="list" className="flex flex-col gap-3" data-testid="bc-connected-list">
        {rows.map((r: any) => {
          const cp = counterparts.data?.get(r.person.userId ?? "");
          const label = cp?.displayName?.trim() || (r.person.userId ?? "").slice(0, 8);
          return (
            <li
              key={r.connectionId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
            >
              <PersonRow
                counterpart={cp}
                fallbackUserId={r.person.userId ?? ""}
                subtitle={new Date(r.connectedAt).toLocaleDateString()}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t("bc.conn.more")}
                    data-testid="bc-connected-menu"
                  >
                    {t("bc.conn.more")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      setTarget({
                        nodeId: r.person.personNodeId,
                        label,
                        mode: "disconnect",
                      })
                    }
                  >
                    {t("bc.conn.action.disconnect")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setTarget({
                        nodeId: r.person.personNodeId,
                        label,
                        mode: "block",
                      })
                    }
                    className="text-destructive focus:text-destructive"
                  >
                    {t("bc.conn.action.block")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>

      <DisconnectDialog
        open={target?.mode === "disconnect"}
        onOpenChange={(o) => !o && setTarget(null)}
        targetPersonNodeId={target?.mode === "disconnect" ? target.nodeId : null}
        personLabel={target?.mode === "disconnect" ? target.label : null}
      />
      <BlockDialog
        open={target?.mode === "block"}
        onOpenChange={(o) => !o && setTarget(null)}
        targetPersonNodeId={target?.mode === "block" ? target.nodeId : null}
        personLabel={target?.mode === "block" ? target.label : null}
      />
    </>
  );
}

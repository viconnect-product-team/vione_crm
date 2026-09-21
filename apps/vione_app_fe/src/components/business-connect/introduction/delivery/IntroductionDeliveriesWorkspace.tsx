// BC-6.3 — Intermediary delivery workspace (To Deliver / Delivered tabs).
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import {
  useOutgoingIntroductionDeliveries,
  usePendingIntroductionDeliveries,
  useRevokeIntroductionDelivery,
} from "@/hooks/use-introduction-deliveries";
import type { IntroductionDeliveryDTO, PendingDeliveryItemDTO } from "@/lib/graph";
import { DeliverIntroductionDialog } from "./DeliverIntroductionDialog";

export function IntroductionDeliveriesWorkspace() {
  const t = useT();
  const [tab, setTab] = useState<"pending" | "delivered">("pending");
  const [selected, setSelected] = useState<PendingDeliveryItemDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const pending = usePendingIntroductionDeliveries();
  const outgoing = useOutgoingIntroductionDeliveries();
  const revoke = useRevokeIntroductionDelivery();

  function openDialog(item: PendingDeliveryItemDTO) {
    setSelected(item);
    setDialogOpen(true);
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("bc.introDelivery.workspace.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("bc.introDelivery.workspace.subtitle")}</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "delivered")}>
        <TabsList aria-label={t("bc.introDelivery.workspace.tabsAria")}>
          <TabsTrigger value="pending">{t("bc.introDelivery.tab.pending")}</TabsTrigger>
          <TabsTrigger value="delivered">{t("bc.introDelivery.tab.delivered")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pending.isLoading && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t("bc.introDelivery.loading")}
            </p>
          )}
          {pending.data && pending.data.length === 0 && (
            <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("bc.introDelivery.empty.pending")}
            </p>
          )}
          {pending.data && pending.data.length > 0 && (
            <ul className="space-y-3" role="list">
              {pending.data.map((r: any) => (
                <li
                  key={r.introductionRequestId}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-2 text-sm font-medium">
                    {t("bc.introDelivery.row.requester", {
                      id: r.requester.personNodeId.slice(0, 8),
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("bc.introDelivery.row.target", {
                      id: r.target.personNodeId.slice(0, 8),
                    })}
                  </div>
                  <Button className="mt-3" size="sm" onClick={() => openDialog(r)}>
                    {t("bc.introDelivery.action.deliver")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="delivered">
          {outgoing.isLoading && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t("bc.introDelivery.loading")}
            </p>
          )}
          {outgoing.data && outgoing.data.items.length === 0 && (
            <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("bc.introDelivery.empty.delivered")}
            </p>
          )}
          {outgoing.data && outgoing.data.items.length > 0 && (
            <ul className="space-y-3" role="list">
              {outgoing.data.items.map((d) => (
                <DeliveredRow
                  key={d.id}
                  d={d}
                  onRevoke={(id) => revoke.mutate(id)}
                  busy={revoke.isPending}
                />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <DeliverIntroductionDialog open={dialogOpen} onOpenChange={setDialogOpen} item={selected} />
    </main>
  );
}

function DeliveredRow({
  d,
  onRevoke,
  busy,
}: {
  d: IntroductionDeliveryDTO;
  onRevoke: (id: string) => void;
  busy: boolean;
}) {
  const t = useT();
  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {t("bc.introDelivery.row.target", {
              id: d.target.personNodeId.slice(0, 8),
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("bc.introDelivery.row.requester", {
              id: d.requester.personNodeId.slice(0, 8),
            })}
          </div>
        </div>
        <Badge variant={d.status === "delivered" ? "secondary" : "outline"}>
          {t(`bc.introDelivery.status.${d.status}` as never)}
        </Badge>
      </div>
      {d.deliveryNote && (
        <p className="mt-1 whitespace-pre-line rounded bg-muted p-2 text-sm">{d.deliveryNote}</p>
      )}
      {d.status === "delivered" && (
        <Button
          className="mt-3"
          size="sm"
          variant="outline"
          onClick={() => onRevoke(d.id)}
          disabled={busy}
        >
          {t("bc.introDelivery.action.revoke")}
        </Button>
      )}
    </li>
  );
}

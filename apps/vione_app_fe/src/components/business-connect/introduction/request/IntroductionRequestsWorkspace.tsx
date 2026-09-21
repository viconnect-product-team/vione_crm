// BC-6.2 — Introduction Requests workspace (Incoming / Sent tabs).
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n";
import {
  useAcceptIntroductionRequest,
  useCancelIntroductionRequest,
  useDeclineIntroductionRequest,
  useIncomingIntroductionRequests,
  useOutgoingIntroductionRequests,
} from "@/hooks/use-introduction-requests";
import { IntroductionRequestRow } from "./IntroductionRequestRow";

export function IntroductionRequestsWorkspace() {
  const t = useT();
  const [tab, setTab] = useState<"incoming" | "sent">("incoming");
  const incoming = useIncomingIntroductionRequests();
  const outgoing = useOutgoingIntroductionRequests();
  const accept = useAcceptIntroductionRequest();
  const decline = useDeclineIntroductionRequest();
  const cancel = useCancelIntroductionRequest();
  const busy = accept.isPending || decline.isPending || cancel.isPending;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("bc.introReq.workspace.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("bc.introReq.workspace.subtitle")}</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "incoming" | "sent")}>
        <TabsList aria-label={t("bc.introReq.workspace.tabsAria")}>
          <TabsTrigger value="incoming">{t("bc.introReq.tab.incoming")}</TabsTrigger>
          <TabsTrigger value="sent">{t("bc.introReq.tab.sent")}</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          {incoming.isLoading && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t("bc.introReq.loading")}
            </p>
          )}
          {incoming.data && incoming.data.items.length === 0 && (
            <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("bc.introReq.empty.incoming")}
            </p>
          )}
          {incoming.data && incoming.data.items.length > 0 && (
            <ul className="space-y-3" role="list">
              {incoming.data.items.map((r: any) => (
                <IntroductionRequestRow
                  key={r.id}
                  request={r}
                  variant="incoming"
                  busy={busy}
                  onAccept={(id) => accept.mutate(id)}
                  onDecline={(id) => decline.mutate(id)}
                />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {outgoing.isLoading && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t("bc.introReq.loading")}
            </p>
          )}
          {outgoing.data && outgoing.data.items.length === 0 && (
            <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("bc.introReq.empty.sent")}
            </p>
          )}
          {outgoing.data && outgoing.data.items.length > 0 && (
            <ul className="space-y-3" role="list">
              {outgoing.data.items.map((r: any) => (
                <IntroductionRequestRow
                  key={r.id}
                  request={r}
                  variant="outgoing"
                  busy={busy}
                  onCancel={(id) => cancel.mutate(id)}
                />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

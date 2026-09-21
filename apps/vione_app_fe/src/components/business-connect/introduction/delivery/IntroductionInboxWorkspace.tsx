// BC-6.3 — Target introduction inbox.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import {
  useAcknowledgeIntroductionDelivery,
  useIncomingIntroductionDeliveries,
} from "@/hooks/use-introduction-deliveries";
import type { IntroductionDeliveryDTO } from "@/lib/graph";
// BC-6.3F.1 — Connect CTA MUST route through the canonical
// ConnectionStateAction (which delegates to ConnectionSDK). No direct
// GlobalConnectionService / ConnectionService / user_connections access
// is permitted from this surface.
import { ConnectionStateAction } from "@/components/business-connect/ConnectionStateAction";

export function IntroductionInboxWorkspace() {
  const t = useT();
  const inbox = useIncomingIntroductionDeliveries();
  const ack = useAcknowledgeIntroductionDelivery();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("bc.introDelivery.inbox.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("bc.introDelivery.inbox.subtitle")}</p>
      </header>

      {inbox.isLoading && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t("bc.introDelivery.loading")}
        </p>
      )}

      {inbox.data && inbox.data.items.length === 0 && (
        <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("bc.introDelivery.empty.inbox")}
        </p>
      )}

      {inbox.data && inbox.data.items.length > 0 && (
        <ul className="space-y-3" role="list">
          {inbox.data.items.map((d) => (
            <TargetIntroductionCard
              key={d.id}
              d={d}
              onAcknowledge={(id) => ack.mutate(id)}
              busy={ack.isPending}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function TargetIntroductionCard({
  d,
  onAcknowledge,
  busy,
}: {
  d: IntroductionDeliveryDTO;
  onAcknowledge: (id: string) => void;
  busy: boolean;
}) {
  const t = useT();
  const isDelivered = d.status === "delivered";
  return (
    <li className="rounded-lg border border-border bg-card p-4" data-testid="intro-delivery-card">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {t("bc.introDelivery.inbox.from", {
              intermediary: d.intermediary.personNodeId.slice(0, 8),
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("bc.introDelivery.inbox.about", {
              requester: d.requester.personNodeId.slice(0, 8),
            })}
          </div>
        </div>
        <Badge variant={isDelivered ? "default" : "outline"}>
          {t(`bc.introDelivery.status.${d.status}` as never)}
        </Badge>
      </div>

      {d.deliveryNote && (
        <p className="mt-1 whitespace-pre-line rounded bg-muted p-2 text-sm">{d.deliveryNote}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link
            to="/business-connect/introductions/$targetPersonNodeId"
            params={{ targetPersonNodeId: d.requester.personNodeId }}
          >
            {t("bc.introDelivery.action.viewProfile")}
          </Link>
        </Button>
        {/* Canonical connection lifecycle — no auto-send, user must confirm. */}
        <ConnectionStateAction targetPersonNodeId={d.requester.personNodeId} variant="inline" />
        {isDelivered && (
          <Button size="sm" onClick={() => onAcknowledge(d.id)} disabled={busy}>
            {t("bc.introDelivery.action.acknowledge")}
          </Button>
        )}
      </div>
    </li>
  );
}

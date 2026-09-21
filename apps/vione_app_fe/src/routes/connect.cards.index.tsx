import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/dashboard/StateKit";
import { useServerData } from "@/hooks/use-server-data";
import { useT } from "@/lib/i18n";
import { BusinessCardSDK } from "@/lib/business-card";
import type { BusinessCardSummary, CardStatus } from "@/lib/business-card/business-card.types";

export const Route = createFileRoute("/connect/cards/")({
  ssr: false,
  component: ConnectCardsPage,
});

const STATUS_KEY: Record<CardStatus, `connect.status.${string}`> = {
  draft: "connect.status.draft",
  published: "connect.status.published",
  hidden: "connect.status.hidden",
  archived: "connect.status.archived",
  suspended: "connect.status.suspended",
  rejected: "connect.status.rejected",
};

function ConnectCardsPage() {
  const t = useT();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const eligibility = useServerData(() => BusinessCardSDK.globalEligibility(), null);
  const cards = useServerData<BusinessCardSummary[]>(() => BusinessCardSDK.listGlobal(), []);

  const eligible = eligibility.data?.eligible ?? true;

  async function createCard() {
    setCreating(true);
    try {
      const { id } = await BusinessCardSDK.createGlobalDraft();
      navigate({ to: "/connect/cards/$cardId/edit", params: { cardId: id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("connect.cards.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("connect.cards.subtitle")}</p>
        </div>
        <Button onClick={() => void createCard()} disabled={creating || !eligible}>
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          <span>{t("connect.cards.new")}</span>
        </Button>
      </div>

      {!eligible && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
          {t("connect.cards.inactive")}
        </div>
      )}

      <div className="mt-6">
        {cards.loading ? (
          <ListSkeleton rows={3} />
        ) : cards.error ? (
          <ErrorState description={cards.error} onRetry={cards.reload} />
        ) : cards.data.length === 0 ? (
          <EmptyState title={t("connect.cards.empty")} description={t("connect.cards.emptyHint")} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {cards.data.map((c: any) => (
              <li key={c.id}>
                <Link
                  to="/connect/cards/$cardId/edit"
                  params={{ cardId: c.id }}
                  className="block rounded-xl border bg-card p-4 transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-3">
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt=""
                        className="size-12 rounded-lg object-cover bg-muted"
                      />
                    ) : (
                      <div className="size-12 rounded-lg bg-muted" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {c.displayName || c.slug}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {c.professionalTitle || c.companyName || "—"}
                      </p>
                    </div>
                    {c.cardKind === "primary" && (
                      <Star
                        className="size-4 shrink-0 text-warning"
                        aria-label={t("connect.card.primary")}
                      />
                    )}
                  </div>
                  <div className="mt-3">
                    <Badge variant="secondary">{t((STATUS_KEY[c.status as CardStatus] ?? "connect.status.draft") as never)}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

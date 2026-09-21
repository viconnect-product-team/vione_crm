// BC-UI-1 — My Business Card editor surface.
//
// Lists the current user's global cards, allows creating a draft, and edits a
// selected card in place via GlobalCardBuilder. UI + client integration only;
// all reads/mutations flow through BusinessCardSDK.

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/dashboard/StateKit";
import { GlobalCardBuilder } from "@/components/connect/GlobalCardBuilder";
import { useServerData } from "@/hooks/use-server-data";
import { useT } from "@/lib/i18n";
import { BusinessCardSDK } from "@/lib/business-card";
import type { BusinessCard, BusinessCardSummary } from "@/lib/business-card/business-card.types";

export const Route = createFileRoute("/business-connect/my-card")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Business Card — ViOne" },
      { name: "description", content: "Build and publish your digital business card." },
    ],
  }),
  component: MyCardPage,
});

function MyCardPage() {
  const t = useT();

  const cards = useServerData<BusinessCardSummary[]>(() => BusinessCardSDK.listGlobal(), []);
  const eligibility = useServerData(() => BusinessCardSDK.globalEligibility(), null);
  const eligible = eligibility.data?.eligible ?? true;

  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<BusinessCard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);

  async function pick(cardId: string) {
    setSelectedId(cardId);
    setLoadingCard(true);
    setLoadError(null);
    try {
      const c = await BusinessCardSDK.getGlobal(cardId);
      setSelected(c);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t("bc.myCard.error"));
    } finally {
      setLoadingCard(false);
    }
  }

  async function createCard() {
    setCreating(true);
    try {
      const { id } = await BusinessCardSDK.createGlobalDraft();
      cards.reload();
      await pick(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("bc.myCard.error"));
    } finally {
      setCreating(false);
    }
  }

  // Editing a selected card.
  if (selectedId) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => {
            setSelectedId(null);
            setSelected(null);
            setLoadError(null);
          }}
        >
          <ArrowLeft className="size-4" />
          {t("bc.myCard.pick")}
        </Button>
        {loadError ? (
          <ErrorState description={loadError} onRetry={() => void pick(selectedId)} />
        ) : loadingCard || !selected ? (
          <div className="grid min-h-[40vh] place-items-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <GlobalCardBuilder card={selected} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("bc.myCard.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("bc.myCard.subtitle")}</p>
        </div>
        <Button onClick={() => void createCard()} disabled={creating || !eligible}>
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          <span>{t("bc.myCard.create")}</span>
        </Button>
      </div>

      {cards.loading ? (
        <ListSkeleton rows={3} />
      ) : cards.error ? (
        <ErrorState description={cards.error} onRetry={cards.reload} />
      ) : cards.data.length === 0 ? (
        <EmptyState title={t("bc.myCard.empty")} description={t("bc.myCard.emptyDesc")} />
      ) : (
        <ul role="list" className="grid gap-3 sm:grid-cols-2">
          {cards.data.map((c: any) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => void pick(c.id)}
                className="block w-full rounded-xl border bg-card p-4 text-left transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="size-12 rounded-lg bg-muted object-cover"
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
                    <Star className="size-4 shrink-0 text-warning" aria-hidden />
                  )}
                </div>
                <div className="mt-3">
                  <Badge variant="secondary">{t(`connect.status.${c.status}` as never)}</Badge>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

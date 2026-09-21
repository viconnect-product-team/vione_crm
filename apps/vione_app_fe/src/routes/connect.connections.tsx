// BC-2.4 — My Connections. The owner's persistent Business Relationships built
// on Saved Business Cards. Shows the LIVE target summary (never a duplicated
// snapshot), plus owner-only favorite/notes. No messaging or CRM here.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookmarkX, Building2, Loader2, Star } from "lucide-react";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/dashboard/StateKit";
import { useServerData } from "@/hooks/use-server-data";
import { useT } from "@/lib/i18n";
import { BusinessCardSDK } from "@/lib/business-card";
import type { SavedCard } from "@/lib/business-card";

export const Route = createFileRoute("/connect/connections")({
  ssr: false,
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const t = useT();
  const { data, loading, error, reload } = useServerData<SavedCard[]>(
    () => BusinessCardSDK.relationships.list(),
    [],
  );
  const [items, setItems] = useState<SavedCard[] | null>(null);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [busy, setBusy] = useState<string | null>(null);

  const list = items ?? data ?? [];
  const shown = useMemo(
    () => (filter === "favorites" ? list.filter((c) => c.favorite) : list),
    [list, filter],
  );

  function patch(next: SavedCard[]) {
    setItems(next);
  }

  async function toggleFavorite(card: SavedCard) {
    setBusy(card.id);
    try {
      const updated = await BusinessCardSDK.relationships.setFavorite(
        card.targetCardId,
        !card.favorite,
      );
      patch(list.map((c: any) => (c.id === card.id ? { ...c, favorite: updated.favorite } : c)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function remove(card: SavedCard) {
    setBusy(card.id);
    try {
      await BusinessCardSDK.relationships.remove(card.targetCardId);
      patch(list.filter((c) => c.id !== card.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function saveNote(card: SavedCard, notes: string) {
    try {
      const updated = await BusinessCardSDK.relationships.setNote(card.targetCardId, notes || null);
      patch(list.map((c: any) => (c.id === card.id ? { ...c, notes: updated.notes } : c)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {t("connect.connections.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("connect.connections.subtitle")}</p>
        </div>
      </div>

      <div
        role="group"
        aria-label={t("connect.connections.title")}
        className="mt-4 flex items-center gap-2"
      >
        {(["all", "favorites"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`focus-visible:ring-2 focus-visible:ring-ring rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f === "all" ? t("connect.connections.all") : t("connect.connections.favorites")}
          </button>
        ))}
        {!loading && !error ? (
          <span className="ml-auto text-xs text-muted-foreground">
            {t("connect.connections.count", { n: list.length })}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {loading && !items ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : shown.length === 0 ? (
          <EmptyState
            title={t("connect.connections.empty")}
            description={t("connect.connections.emptyHint")}
          />
        ) : (
          <ul role="list" className="space-y-3">
            {shown.map((card) => (
              <ConnectionRow
                key={card.id}
                card={card}
                busy={busy === card.id}
                onToggleFavorite={() => void toggleFavorite(card)}
                onRemove={() => void remove(card)}
                onSaveNote={(n) => void saveNote(card, n)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ConnectionRow({
  card,
  busy,
  onToggleFavorite,
  onRemove,
  onSaveNote,
}: {
  card: SavedCard;
  busy: boolean;
  onToggleFavorite: () => void;
  onRemove: () => void;
  onSaveNote: (notes: string) => void;
}) {
  const t = useT();
  const [note, setNote] = useState(card.notes ?? "");
  const target = card.target;
  const name = target.displayName || target.slug;

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        {target.avatarUrl ? (
          <img
            src={target.avatarUrl}
            alt=""
            className="size-11 rounded-xl object-cover"
            width={44}
            height={44}
          />
        ) : (
          <div className="grid size-11 place-items-center rounded-xl bg-muted text-base font-semibold text-muted-foreground">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {target.unavailable ? (
            <p className="truncate text-sm font-semibold text-muted-foreground">
              {t("connect.connections.unavailable")}
            </p>
          ) : (
            <Link
              to="/b/$slug"
              params={{ slug: target.slug }}
              className="truncate text-sm font-semibold text-foreground hover:underline"
            >
              {name}
            </Link>
          )}
          {target.professionalTitle ? (
            <p className="truncate text-xs text-muted-foreground">{target.professionalTitle}</p>
          ) : null}
          {target.companyName ? (
            <p className="mt-0.5 inline-flex items-center gap-1 truncate text-xs font-medium text-primary">
              <Building2 className="size-3" />
              {target.companyName}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={busy}
            aria-pressed={card.favorite}
            aria-label={t("connect.connections.favorites")}
            className="focus-visible:ring-2 focus-visible:ring-ring grid size-8 place-items-center rounded-lg hover:bg-accent disabled:opacity-50"
          >
            <Star
              className={`size-4 ${card.favorite ? "fill-warning text-warning" : "text-muted-foreground"}`}
            />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            aria-label={t("connect.connections.remove")}
            className="focus-visible:ring-2 focus-visible:ring-ring grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <BookmarkX className="size-4" />}
          </button>
        </div>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== (card.notes ?? "") && onSaveNote(note)}
        placeholder={t("connect.connections.notesPlaceholder")}
        rows={2}
        className="focus-visible:ring-2 focus-visible:ring-ring mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
      />

      {card.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}

// BC-UI-1 — Saved Business Cards Library (shared surface component).
//
// Extracted from the original /connect/saved-cards route so both /connect and
// the new /business-connect product surface render one implementation. UI +
// client integration ONLY: every read/mutation flows through the
// use-saved-cards hooks (SavedCardSDK). No table access, no server-fn imports.
// Private notes/tags never enter the URL, telemetry or share surfaces.

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Search, LayoutGrid, List as ListIcon, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/dashboard/StateKit";
import { useT, type TKey } from "@/lib/i18n";
import {
  SAVED_CARDS_SECTIONS,
  SAVED_CARD_SORTS,
  normalizeSort,
  isDefaultSearch,
  type SavedCardsSearch,
  type SavedCardsSection,
  type SavedCardSort,
} from "@/lib/business-card/saved-card.search";
import {
  useSavedCards,
  useSavedCardCollections,
  useSaveCardMutations,
  useSavedCardCollectionMutations,
} from "@/hooks/use-saved-cards";
import { SavedCardItem, type SavedCardIntent } from "@/components/business-connect/SavedCardItem";
import {
  SavedCardNotesDialog,
  SavedCardTagsDialog,
  SavedCardMoveDialog,
  SavedCardRemoveDialog,
  CreateCollectionDialog,
} from "@/components/business-connect/SavedCardDialogs";
import type { SavedCard } from "@/lib/business-card/relationship.types";

const SECTION_KEY: Record<SavedCardsSection, TKey> = {
  all: "sc.section.all",
  favorites: "sc.section.favorites",
  recent: "sc.section.recent",
  frequent: "sc.section.frequent",
  archived: "sc.section.archived",
};

const SORT_KEY: Record<SavedCardSort, TKey> = {
  recentlySaved: "sc.sort.recentlySaved",
  recentlyOpened: "sc.sort.recentlyOpened",
  frequentlyOpened: "sc.sort.frequentlyOpened",
  name: "sc.sort.name",
  company: "sc.sort.company",
};

export type SavedCardsLibraryProps = {
  /** Fully normalized, contract-safe search state. */
  search: SavedCardsSearch;
  /** Patch the route search (canonical, typed). */
  onPatch: (patch: Partial<SavedCardsSearch>) => void;
  /** Reset the route search to canonical defaults. */
  onReset: () => void;
};

export function SavedCardsLibrary({ search, onPatch, onReset }: SavedCardsLibraryProps) {
  const t = useT();

  const { cards, isLoading, isError, refetch, isFetching } = useSavedCards(search);
  const collectionsQuery = useSavedCardCollections();
  const collections = collectionsQuery.data ?? [];
  const customCollections = collections.filter((c) => !c.isSystem);

  const mut = useSaveCardMutations();
  const collMut = useSavedCardCollectionMutations();

  const [notesTarget, setNotesTarget] = useState<SavedCard | null>(null);
  const [tagsTarget, setTagsTarget] = useState<SavedCard | null>(null);
  const [moveTarget, setMoveTarget] = useState<SavedCard | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SavedCard | null>(null);
  const [createColl, setCreateColl] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const announceRef = useRef<HTMLDivElement>(null);

  async function run(id: string, action: () => Promise<unknown>, okKey: TKey) {
    setBusyId(id);
    try {
      await action();
      toast.success(t(okKey));
    } catch {
      toast.error(t("sc.toast.error"));
    } finally {
      setBusyId(null);
    }
  }

  const onIntent = useCallback(
    (card: SavedCard, intent: SavedCardIntent) => {
      switch (intent.type) {
        case "open":
          void mut.recordOpen.mutateAsync({ targetCardId: card.targetCardId }).catch(() => {});
          window.open(`/b/${card.target.slug}`, "_blank", "noopener");
          break;
        case "favorite":
          void run(
            card.id,
            () =>
              mut.setFavorite.mutateAsync({
                targetCardId: card.targetCardId,
                favorite: intent.value,
              }),
            intent.value ? "sc.toast.favorited" : "sc.toast.unfavorited",
          );
          break;
        case "archive":
          void run(
            card.id,
            () =>
              mut.setArchived.mutateAsync({
                targetCardId: card.targetCardId,
                archived: intent.value,
              }),
            intent.value ? "sc.toast.archived" : "sc.toast.restored",
          );
          break;
        case "move":
          setMoveTarget(card);
          break;
        case "tags":
          setTagsTarget(card);
          break;
        case "notes":
          setNotesTarget(card);
          break;
        case "remove":
          setRemoveTarget(card);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mut],
  );

  const resultCount = cards.length;
  const announcement = isFetching
    ? t("sc.sr.saving")
    : t("sc.sr.results").replace("{n}", String(resultCount));

  const emptyView = (() => {
    if (!isDefaultSearch(search) && search.section === "all") {
      return <EmptyState title={t("sc.empty.noResult")} description={t("sc.empty.noResultDesc")} />;
    }
    switch (search.section) {
      case "favorites":
        return <EmptyState title={t("sc.empty.favorites")} description={t("sc.empty.desc")} />;
      case "archived":
        return <EmptyState title={t("sc.empty.archived")} description={t("sc.empty.desc")} />;
      default:
        return <EmptyState title={t("sc.empty.title")} description={t("sc.empty.desc")} />;
    }
  })();

  return (
    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
      {/* Collections sidebar */}
      <aside className="space-y-4">
        <nav aria-label={t("sc.section.all")} className="flex flex-row flex-wrap gap-1 md:flex-col">
          {SAVED_CARDS_SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={search.section === s}
              onClick={() => onPatch({ section: s, collection: "" })}
              className={
                "rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                (search.section === s
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              {t(SECTION_KEY[s])}
            </button>
          ))}
        </nav>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("sc.collections.title")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={t("sc.collections.create")}
              onClick={() => setCreateColl(true)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {customCollections.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">{t("sc.collections.none")}</p>
          ) : (
            <ul className="space-y-0.5" role="list">
              {customCollections.map((c: any) => (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={search.collection === c.id}
                    onClick={() =>
                      onPatch({
                        collection: search.collection === c.id ? "" : c.id,
                        section: "all",
                      })
                    }
                    className={
                      "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                      (search.collection === c.id
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted")
                    }
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: c.color ?? "var(--muted-foreground)" }}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main column */}
      <section aria-label={t("sc.title")}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search.q}
              onChange={(e) => onPatch({ q: e.target.value.slice(0, 200) })}
              placeholder={t("sc.search.placeholder")}
              aria-label={t("sc.search.label")}
              className="pl-9"
            />
          </div>

          <Select value={search.sort} onValueChange={(v) => onPatch({ sort: normalizeSort(v) })}>
            <SelectTrigger className="w-full sm:w-44" aria-label={t("sc.sort.label")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAVED_CARD_SORTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(SORT_KEY[s])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            className="flex items-center gap-1 rounded-lg border p-0.5"
            role="group"
            aria-label={t("sc.view.grid")}
          >
            <Button
              variant={search.view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              aria-pressed={search.view === "grid"}
              aria-label={t("sc.view.grid")}
              onClick={() => onPatch({ view: "grid" })}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={search.view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              aria-pressed={search.view === "list"}
              aria-label={t("sc.view.list")}
              onClick={() => onPatch({ view: "list" })}
            >
              <ListIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Active filters + reset */}
        {!isDefaultSearch(search) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {search.tags.map((tg) => (
              <Badge key={tg} variant="secondary" className="gap-1 pr-1">
                {tg}
                <button
                  type="button"
                  aria-label={`${t("sc.action.remove")} ${tg}`}
                  onClick={() => onPatch({ tags: search.tags.filter((x: any) => x !== tg) })}
                  className="rounded-full p-0.5 hover:bg-background/60"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="size-3.5" />
              {t("sc.filters.reset")}
            </Button>
          </div>
        )}

        {/* Live region */}
        <div
          ref={announceRef}
          data-testid="sc-announcement"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {announcement}
        </div>

        {/* Results */}
        <div className="mt-4" aria-busy={isFetching || undefined}>
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : isError ? (
            <ErrorState description={t("sc.error")} onRetry={() => void refetch()} />
          ) : resultCount === 0 ? (
            emptyView
          ) : (
            <ul
              role="list"
              className={
                search.view === "grid"
                  ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-2"
              }
            >
              {cards.map((card) => (
                <li key={card.id}>
                  <SavedCardItem
                    card={card}
                    view={search.view}
                    busy={busyId === card.id}
                    onIntent={(intent) => onIntent(card, intent)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Dialogs */}
      <SavedCardNotesDialog
        card={notesTarget}
        open={notesTarget !== null}
        onOpenChange={(v) => !v && setNotesTarget(null)}
        busy={mut.setNote.isPending}
        onSave={(notes) => {
          const target = notesTarget;
          if (!target) return;
          void run(
            target.id,
            () => mut.setNote.mutateAsync({ targetCardId: target.targetCardId, notes }),
            "sc.notes.saved",
          ).then(() => setNotesTarget(null));
        }}
      />

      <SavedCardTagsDialog
        card={tagsTarget}
        open={tagsTarget !== null}
        onOpenChange={(v) => !v && setTagsTarget(null)}
        busy={mut.setTags.isPending}
        onSave={(names) => {
          const target = tagsTarget;
          if (!target) return;
          void run(
            target.id,
            () => mut.setTags.mutateAsync({ targetCardId: target.targetCardId, names }),
            "sc.toast.tagsSaved",
          ).then(() => setTagsTarget(null));
        }}
      />

      <SavedCardMoveDialog
        card={moveTarget}
        open={moveTarget !== null}
        onOpenChange={(v) => !v && setMoveTarget(null)}
        busy={mut.move.isPending}
        collections={collections}
        onMove={(collectionId) => {
          const target = moveTarget;
          if (!target) return;
          void run(
            target.id,
            () => mut.move.mutateAsync({ targetCardId: target.targetCardId, collectionId }),
            "sc.toast.moved",
          ).then(() => setMoveTarget(null));
        }}
      />

      <SavedCardRemoveDialog
        open={removeTarget !== null}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        busy={mut.remove.isPending}
        onConfirm={() => {
          const target = removeTarget;
          if (!target) return;
          void run(
            target.id,
            () => mut.remove.mutateAsync({ targetCardId: target.targetCardId }),
            "sc.toast.removed",
          ).then(() => setRemoveTarget(null));
        }}
      />

      <CreateCollectionDialog
        open={createColl}
        onOpenChange={setCreateColl}
        busy={collMut.create.isPending}
        onCreate={(name) => {
          void run(
            "create-collection",
            () => collMut.create.mutateAsync({ name }),
            "sc.toast.collectionCreated",
          ).then(() => setCreateColl(false));
        }}
      />
    </div>
  );
}

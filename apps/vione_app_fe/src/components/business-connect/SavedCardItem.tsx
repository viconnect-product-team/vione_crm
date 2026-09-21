// BC-3.1 — Saved Card tile / row.
//
// Presentational only. Reads a SavedCard DTO (already resolved through
// SavedCardSDK) and emits intent callbacks. Never queries tables, never renders
// private notes/tags into share/public surfaces — this component only appears in
// the owner's authenticated library.

import { useMemo } from "react";
import {
  Star,
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  FolderInput,
  Tag as TagIcon,
  StickyNote,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n";
import { availabilityOf } from "@/lib/business-card/saved-card.contracts";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import type { SavedCardsView } from "@/lib/business-card/saved-card.search";

export type SavedCardIntent =
  | { type: "open" }
  | { type: "favorite"; value: boolean }
  | { type: "archive"; value: boolean }
  | { type: "move" }
  | { type: "tags" }
  | { type: "notes" }
  | { type: "remove" };

type Props = {
  card: SavedCard;
  view: SavedCardsView;
  busy?: boolean;
  onIntent: (intent: SavedCardIntent) => void;
};

export function SavedCardItem({ card, view, busy, onIntent }: Props) {
  const t = useT();
  const unavailable = useMemo(() => availabilityOf(card.target) === "unavailable", [card.target]);
  const name = card.target.displayName || card.company || "—";
  const subtitle = card.target.professionalTitle || card.target.companyName || card.company || "—";

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={
        "group relative flex gap-3 rounded-xl border bg-card p-4 transition focus-within:ring-2 focus-within:ring-ring hover:border-primary/50 " +
        (view === "list" ? "items-center" : "flex-col")
      }
      aria-busy={busy || undefined}
    >
      <div
        className={view === "list" ? "flex flex-1 items-center gap-3" : "flex items-center gap-3"}
      >
        {card.target.avatarUrl && !unavailable ? (
          <img
            src={card.target.avatarUrl}
            alt=""
            className="size-12 shrink-0 rounded-lg bg-muted object-cover"
          />
        ) : (
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground"
            aria-hidden
          >
            {unavailable ? "·" : initials || "·"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {unavailable ? (
            <>
              <p className="truncate font-medium text-muted-foreground">
                {t("sc.availability.unavailableMsg")}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t("sc.availability.unavailableHint")}
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onIntent({ type: "open" })}
                className="block max-w-full truncate text-left font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
              >
                {name}
              </button>
              <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
            </>
          )}
        </div>

        {card.favorite && (
          <Star
            className="size-4 shrink-0 fill-warning text-warning"
            aria-label={t("sc.action.unfavorite")}
          />
        )}
      </div>

      {/* Private tags — owner-only surface. */}
      {card.tags.length > 0 && !unavailable && (
        <div className={"flex flex-wrap gap-1.5 " + (view === "list" ? "max-w-[40%]" : "mt-1")}>
          {card.tags.slice(0, 4).map((tg) => (
            <Badge key={tg} variant="secondary" className="text-xs">
              {tg}
            </Badge>
          ))}
          {card.tags.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{card.tags.length - 4}
            </Badge>
          )}
        </div>
      )}

      <div
        className={
          view === "list" ? "ml-auto flex items-center gap-1" : "mt-3 flex items-center gap-1"
        }
      >
        {!unavailable && (
          <Button
            variant="ghost"
            size="icon"
            className="min-h-9 min-w-9"
            aria-pressed={card.favorite}
            aria-label={card.favorite ? t("sc.action.unfavorite") : t("sc.action.favorite")}
            disabled={busy}
            onClick={() => onIntent({ type: "favorite", value: !card.favorite })}
          >
            <Star className={"size-4 " + (card.favorite ? "fill-warning text-warning" : "")} />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-9 min-w-9"
              aria-label={t("sc.action.more")}
              disabled={busy}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {!unavailable && (
              <>
                <DropdownMenuItem onClick={() => onIntent({ type: "open" })}>
                  <ExternalLink className="size-4" />
                  {t("sc.action.open")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onIntent({ type: "move" })}>
                  <FolderInput className="size-4" />
                  {t("sc.action.move")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onIntent({ type: "tags" })}>
                  <TagIcon className="size-4" />
                  {t("sc.action.tags")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onIntent({ type: "notes" })}>
                  <StickyNote className="size-4" />
                  {t("sc.action.notes")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onIntent({ type: "archive", value: !card.archived })}>
              {card.archived ? (
                <>
                  <ArchiveRestore className="size-4" />
                  {t("sc.action.restore")}
                </>
              ) : (
                <>
                  <Archive className="size-4" />
                  {t("sc.action.archive")}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onIntent({ type: "remove" })}
            >
              <Trash2 className="size-4" />
              {t("sc.action.remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

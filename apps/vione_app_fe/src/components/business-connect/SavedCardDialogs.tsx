// BC-3.1 — Saved Card edit dialogs (notes, tags, move, remove).
//
// Each dialog is a thin controlled UI over the mutation callbacks passed in from
// the route. No table access, no server-fn imports here — the route wires these
// to SavedCardSDK via the useSaveCardMutations hook. Private notes/tags live only
// inside these owner-authenticated dialogs.

import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";
import { normalizeTagName } from "@/lib/business-card/saved-card.contracts";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import type { SavedCardCollection } from "@/lib/business-card/collection.types";

const NOTE_MAX = 2000;

// ── Notes ──────────────────────────────────────────────────────────────────────

export function SavedCardNotesDialog({
  card,
  open,
  onOpenChange,
  busy,
  onSave,
}: {
  card: SavedCard | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  busy?: boolean;
  onSave: (notes: string | null) => void;
}) {
  const t = useT();
  const [value, setValue] = useState("");
  useEffect(() => {
    if (open) setValue(card?.notes ?? "");
  }, [open, card]);

  const dirty = (card?.notes ?? "") !== value;
  const tooLong = value.length > NOTE_MAX;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sc.notes.title")}</DialogTitle>
          <DialogDescription>{t("sc.notes.private")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="sc-note" className="sr-only">
            {t("sc.notes.title")}
          </Label>
          <Textarea
            id="sc-note"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("sc.notes.placeholder")}
            rows={6}
            autoFocus
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{dirty ? t("sc.notes.unsaved") : ""}</span>
            <span className={tooLong ? "text-destructive" : ""}>
              {value.length}/{NOTE_MAX}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("sc.remove.cancel")}
          </Button>
          <Button
            disabled={busy || tooLong || !dirty}
            onClick={() => onSave(value.trim() ? value.trim() : null)}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("sc.notes.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tags ───────────────────────────────────────────────────────────────────────

export function SavedCardTagsDialog({
  card,
  open,
  onOpenChange,
  busy,
  suggestions,
  onSave,
}: {
  card: SavedCard | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  busy?: boolean;
  suggestions?: string[];
  onSave: (names: string[]) => void;
}) {
  const t = useT();
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (open) {
      setTags(card?.tags ?? []);
      setDraft("");
    }
  }, [open, card]);

  const normalizedSet = useMemo(() => new Set(tags.map((tg) => normalizeTagName(tg))), [tags]);

  function add(raw: string) {
    const name = raw.trim();
    if (!name) return;
    const norm = normalizeTagName(name);
    if (!norm || normalizedSet.has(norm)) {
      setDraft("");
      return;
    }
    setTags((prev) => [...prev, name]);
    setDraft("");
  }

  function remove(tg: string) {
    setTags((prev) => prev.filter((x: any) => x !== tg));
  }

  const chips = (suggestions ?? []).filter((s) => !normalizedSet.has(normalizeTagName(s)));
  const dirty =
    tags.length !== (card?.tags.length ?? 0) || tags.some((x, i) => x !== (card?.tags ?? [])[i]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sc.tags.title")}</DialogTitle>
          <DialogDescription>{t("sc.tags.private")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5" aria-live="polite">
            {tags.length === 0 && (
              <span className="text-sm text-muted-foreground">{t("sc.tags.empty")}</span>
            )}
            {tags.map((tg) => (
              <Badge key={tg} variant="secondary" className="gap-1 pr-1">
                {tg}
                <button
                  type="button"
                  onClick={() => remove(tg)}
                  aria-label={`${t("sc.action.remove")} ${tg}`}
                  className="rounded-full p-0.5 hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add(draft);
                }
              }}
              placeholder={t("sc.tags.placeholder")}
              aria-label={t("sc.tags.add")}
            />
            <Button type="button" variant="outline" onClick={() => add(draft)}>
              {t("sc.tags.add")}
            </Button>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {chips.slice(0, 12).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("sc.remove.cancel")}
          </Button>
          <Button disabled={busy || !dirty} onClick={() => onSave(tags)}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("sc.filters.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Move to collection ───────────────────────────────────────────────────────

export function SavedCardMoveDialog({
  card,
  open,
  onOpenChange,
  busy,
  collections,
  onMove,
}: {
  card: SavedCard | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  busy?: boolean;
  collections: SavedCardCollection[];
  onMove: (collectionId: string | null) => void;
}) {
  const t = useT();
  const current = card?.collectionId ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sc.collections.moveTo")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1" role="listbox" aria-label={t("sc.collections.moveTo")}>
          <button
            type="button"
            role="option"
            aria-selected={current === null}
            disabled={busy}
            onClick={() => onMove(null)}
            className={
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
              (current === null ? "bg-muted font-medium" : "")
            }
          >
            {t("sc.collections.uncategorized")}
          </button>
          {collections.map((c: any) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={current === c.id}
              disabled={busy}
              onClick={() => onMove(c.id)}
              className={
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                (current === c.id ? "bg-muted font-medium" : "")
              }
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: c.color ?? "var(--muted-foreground)" }}
                aria-hidden
              />
              <span className="flex-1 truncate">{c.name}</span>
              {c.isSystem && (
                <Badge variant="outline" className="text-[10px]">
                  {t("sc.collections.system")}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{c.count}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Remove confirmation ──────────────────────────────────────────────────────

export function SavedCardRemoveDialog({
  open,
  onOpenChange,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  busy?: boolean;
  onConfirm: () => void;
}) {
  const t = useT();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("sc.remove.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("sc.remove.body")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("sc.remove.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("sc.remove.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Create collection ────────────────────────────────────────────────────────

export function CreateCollectionDialog({
  open,
  onOpenChange,
  busy,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  busy?: boolean;
  onCreate: (name: string) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  useEffect(() => {
    if (open) setName("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sc.collections.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="sc-coll-name">{t("sc.collections.name")}</Label>
          <Input
            id="sc-coll-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("sc.collections.namePlaceholder")}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) onCreate(name.trim());
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("sc.remove.cancel")}
          </Button>
          <Button disabled={busy || !name.trim()} onClick={() => onCreate(name.trim())}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("sc.collections.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

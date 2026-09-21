// Quản lý một danh thiếp trong kho: xem thông tin, chỉnh nhãn, ghi chú, xoá.
// Dùng lại chrome MeSheet (dialog semantics, Escape/backdrop, inert khi bận).

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { MeSheet } from "./MeSheet";
import type { CardVaultItem } from "@/hooks/use-card-vault";

const MAX_LABELS = 6;

function parseLabels(raw: string, single: boolean): string[] {
  const list = raw
    .split(",")
    .map((v) => v.trim().replace(/\s+/g, " ").slice(0, 60))
    .filter(Boolean);
  const unique = Array.from(new Set(list));
  return single ? unique.slice(0, 1) : unique.slice(0, MAX_LABELS);
}

export function CardVaultManageSheet({
  item,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  item: CardVaultItem;
  busy: boolean;
  onClose: () => void;
  onSave: (labels: string[], note: string | null) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const single = item.kind === "scanned";
  const [labels, setLabels] = useState(item.labels.join(", "));
  const [note, setNote] = useState(item.note ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fieldClass =
    "min-h-11 w-full rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 py-2.5 text-[14px] text-[var(--bc-mobile-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-gold,var(--bc-mobile-navy))]";

  const details: Array<[string, string | null]> = [
    [t("bc.mobile.me.cards.field.title"), item.title],
    [t("bc.mobile.me.cards.field.company"), item.companyName],
    [t("bc.mobile.me.cards.field.phone"), item.phone],
    [t("bc.mobile.me.cards.field.email"), item.email],
    [t("bc.mobile.me.cards.field.website"), item.website],
    [t("bc.mobile.me.cards.field.address"), item.address],
  ];
  const visible = details.filter(([, v]) => Boolean(v));

  return (
    <MeSheet
      title={item.displayName ?? t("bc.mobile.me.cards.unknownName")}
      subtitle={
        item.kind === "saved_card"
          ? t("bc.mobile.me.cards.kind.saved")
          : t("bc.mobile.me.cards.kind.scanned")
      }
      busy={busy}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-11 flex-1 rounded-full border border-[var(--bc-mobile-border)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] disabled:opacity-60"
          >
            {t("bc.mobile.me.cancel")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave(parseLabels(labels, single), note.trim() ? note.trim() : null)}
            className="min-h-11 flex-1 rounded-full bg-[var(--bc-mobile-text)] px-4 text-[14px] font-semibold text-[var(--bc-mobile-surface)] disabled:opacity-60"
          >
            {busy ? (
              <Loader2
                aria-hidden="true"
                className="mx-auto h-4 w-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              t("bc.mobile.me.cards.save")
            )}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 px-5 py-4">
        {visible.length > 0 && (
          <dl className="grid gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-4">
            {visible.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3">
                <dt className="text-[12.5px] text-[var(--bc-mobile-muted)]">{label}</dt>
                <dd className="min-w-0 break-words text-right text-[13.5px] text-[var(--bc-mobile-text)]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <label className="grid gap-1.5">
          <span className="text-[12.5px] font-medium text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.me.cards.labels")}
          </span>
          <input
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            disabled={busy}
            placeholder={
              single
                ? t("bc.mobile.me.cards.labels.placeholderSingle")
                : t("bc.mobile.me.cards.labels.placeholder")
            }
            className={fieldClass}
          />
          <span className="text-[11.5px] text-[var(--bc-mobile-muted)]">
            {single
              ? t("bc.mobile.me.cards.labels.hintSingle")
              : t("bc.mobile.me.cards.labels.hint")}
          </span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-[12.5px] font-medium text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.me.cards.note")}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 2000))}
            disabled={busy}
            rows={4}
            placeholder={t("bc.mobile.me.cards.note.placeholder")}
            className={`${fieldClass} resize-none`}
          />
        </label>

        <div className="rounded-2xl border border-[var(--bc-mobile-border)] p-4">
          {confirmDelete ? (
            <div className="grid gap-3">
              <p role="alert" className="text-[13px] text-[var(--bc-mobile-text)]">
                {item.kind === "saved_card"
                  ? t("bc.mobile.me.cards.delete.confirmSaved")
                  : t("bc.mobile.me.cards.delete.confirmScanned")}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-11 flex-1 rounded-full border border-[var(--bc-mobile-border)] text-[14px] disabled:opacity-60"
                >
                  {t("bc.mobile.me.cancel")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onDelete}
                  className="min-h-11 flex-1 rounded-full bg-[var(--destructive)] text-[14px] font-semibold text-[var(--destructive-foreground)] disabled:opacity-60"
                >
                  {t("bc.mobile.me.cards.delete.confirmCta")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
              className="flex min-h-11 w-full items-center justify-center gap-2 text-[14px] font-medium text-[var(--destructive)] disabled:opacity-60"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.me.cards.delete")}
            </button>
          )}
        </div>
      </div>
    </MeSheet>
  );
}

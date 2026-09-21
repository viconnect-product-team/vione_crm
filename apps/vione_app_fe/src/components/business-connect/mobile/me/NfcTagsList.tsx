// BC-Mobile-5C — NFC tag registry list (presentational).
//
// Renders the owner's programmed NFC tags with derived status
// (ACTIVE / STALE / REVOKED), write time, and link-level last tap.
// Status is never color-only: a labelled badge with a dot + text.
// Revoke is a two-step inline confirmation; raw ids never render.

import { useState } from "react";
import { Ban, Loader2, Nfc, Pencil } from "lucide-react";
import { useFmt, useT } from "@/lib/i18n";
import type {
  IdentityNfcTagInfo,
  IdentityNfcTagStatus,
} from "@/lib/business-connect/mobile/nfc-tags.types";
import { NFC_TAG_LABEL_MAX } from "@/lib/business-connect/mobile/nfc-tags.validation";

const STATUS_TOKEN: Record<IdentityNfcTagStatus, string> = {
  ACTIVE: "var(--bc-mobile-success)",
  STALE: "var(--bc-mobile-muted)",
  REVOKED: "var(--bc-mobile-danger)",
};

function StatusBadge({ status }: { status: IdentityNfcTagStatus }) {
  const t = useT();
  const label =
    status === "ACTIVE"
      ? t("bc.mobile.me.nfc.tags.status.active")
      : status === "STALE"
        ? t("bc.mobile.me.nfc.tags.status.stale")
        : t("bc.mobile.me.nfc.tags.status.revoked");
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--bc-mobile-border)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--bc-mobile-text)]">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_TOKEN[status] }}
      />
      {label}
    </span>
  );
}

export function NfcTagsList({
  tags,
  revokingId,
  renamingId,
  renameFailedId,
  onRevoke,
  onRename,
}: {
  tags: IdentityNfcTagInfo[];
  revokingId: string | null;
  renamingId?: string | null;
  renameFailedId?: string | null;
  onRevoke: (tagId: string) => void;
  onRename?: (tagId: string, label: string) => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat(fmt.locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );

  return (
    <ul role="list" aria-label={t("bc.mobile.me.nfc.tags.listAria")} className="grid gap-3">
      {tags.map((tag) => {
        const name = tag.label ?? t("bc.mobile.me.nfc.tags.defaultName");
        const confirming = confirmId === tag.id;
        const revoking = revokingId === tag.id;
        const editing = editId === tag.id;
        const renaming = renamingId === tag.id;
        return (
          <li
            key={tag.id}
            className="rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-4 shadow-[var(--bc-mobile-shadow-v)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]">
                  <Nfc
                    aria-hidden="true"
                    className="h-4.5 w-4.5 text-[var(--bc-mobile-muted)]"
                    strokeWidth={1.8}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold text-[var(--bc-mobile-text)]">
                    {name}
                  </span>
                  <span className="block text-[12px] text-[var(--bc-mobile-muted)]">
                    {t("bc.mobile.me.nfc.tags.writtenAt", { time: formatTime(tag.writtenAt) })}
                  </span>
                </span>
              </span>
              <StatusBadge status={tag.status} />
            </div>

            <p className="mt-2.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {tag.lastTappedAt
                ? t("bc.mobile.me.nfc.tags.lastTap", { time: fmt.rel(tag.lastTappedAt) })
                : t("bc.mobile.me.nfc.tags.never")}
            </p>

            {onRename && editing ? (
              <form
                className="mt-3 rounded-2xl bg-[var(--bc-mobile-surface-2)] px-3.5 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (renaming) return;
                  onRename(tag.id, draft);
                }}
              >
                <label
                  htmlFor={`nfc-tag-name-${tag.id}`}
                  className="block text-[12px] font-medium text-[var(--bc-mobile-muted)]"
                >
                  {t("bc.mobile.me.nfc.tags.renameLabel")}
                </label>
                <input
                  id={`nfc-tag-name-${tag.id}`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={NFC_TAG_LABEL_MAX}
                  autoFocus
                  placeholder={t("bc.mobile.me.nfc.tags.renamePlaceholder")}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3 text-[14px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
                />
                <p className="mt-1.5 text-[11.5px] leading-snug text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.me.nfc.tags.renameHint")}
                </p>
                {renameFailedId === tag.id ? (
                  <p role="alert" className="mt-1.5 text-[12px] text-[var(--bc-mobile-danger)]">
                    {t("bc.mobile.me.nfc.tags.renameFailed")}
                  </p>
                ) : null}
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="submit"
                    disabled={renaming}
                    className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-4 text-[13px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                  >
                    {renaming ? (
                      <Loader2
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin motion-reduce:animate-none"
                        strokeWidth={1.8}
                      />
                    ) : null}
                    {renaming
                      ? t("bc.mobile.me.nfc.tags.renameSaving")
                      : t("bc.mobile.me.nfc.tags.renameSave")}
                  </button>
                  <button
                    type="button"
                    disabled={renaming}
                    onClick={() => setEditId(null)}
                    className="min-h-10 flex-1 rounded-full border border-[var(--bc-mobile-border)] px-4 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                  >
                    {t("bc.mobile.me.cancel")}
                  </button>
                </div>
              </form>
            ) : null}

            {onRename && !editing && !confirming ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmId(null);
                  setDraft(tag.label ?? "");
                  setEditId(tag.id);
                }}
                aria-label={t("bc.mobile.me.nfc.tags.renameAria", { name })}
                className="mt-3 flex min-h-10 items-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-4 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
              >
                <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                {t("bc.mobile.me.nfc.tags.rename")}
              </button>
            ) : null}

            {tag.status !== "REVOKED" &&
              !editing &&
              (confirming ? (
                <div className="mt-3 rounded-2xl bg-[var(--bc-mobile-surface-2)] px-3.5 py-3">
                  <p className="text-[12.5px] leading-snug text-[var(--bc-mobile-text)]">
                    {t("bc.mobile.me.nfc.tags.revokeConfirm")}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      disabled={revoking}
                      onClick={() => {
                        setConfirmId(null);
                        onRevoke(tag.id);
                      }}
                      className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-danger)] px-4 text-[13px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                    >
                      {revoking && (
                        <Loader2
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin motion-reduce:animate-none"
                          strokeWidth={1.8}
                        />
                      )}
                      {t("bc.mobile.me.nfc.tags.revoke")}
                    </button>
                    <button
                      type="button"
                      disabled={revoking}
                      onClick={() => setConfirmId(null)}
                      className="min-h-10 flex-1 rounded-full border border-[var(--bc-mobile-border)] px-4 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                    >
                      {t("bc.mobile.me.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(tag.id)}
                  aria-label={t("bc.mobile.me.nfc.tags.revokeAria", { name })}
                  className="mt-3 flex min-h-10 items-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-4 text-[13px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                >
                  <Ban aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  {t("bc.mobile.me.nfc.tags.revoke")}
                </button>
              ))}
          </li>
        );
      })}
    </ul>
  );
}

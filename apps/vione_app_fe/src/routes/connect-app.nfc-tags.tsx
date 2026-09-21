// BC-Mobile-5C — /connect-app/nfc-tags: NFC tag registry page (Me Hub).
// Lists the owner's programmed NFC tags with derived status
// (ACTIVE/STALE/REVOKED), write time, link-level last tap, and revoke.
// Owner-only: every read/mutation derives the actor server-side.

import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Loader2, Nfc } from "lucide-react";
import { useT } from "@/lib/i18n";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import { NfcTagsList } from "@/components/business-connect/mobile/me/NfcTagsList";
import {
  bcIdentityNfcTagsListFn,
  bcIdentityNfcTagRevokeFn,
  bcIdentityNfcTagRenameFn,
} from "@/lib/business-connect/mobile/nfc-tags.functions";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";
import type { IdentityNfcTagInfo } from "@/lib/business-connect/mobile/nfc-tags.types";

export const Route = createFileRoute("/connect-app/nfc-tags")({
  head: () => ({
    meta: [
      { title: "Quản lý thẻ NFC — Business Connect" },
      {
        name: "description",
        content: "Danh sách thẻ NFC đã ghi, trạng thái và lượt chạm gần nhất.",
      },
      { property: "og:title", content: "Quản lý thẻ NFC — Business Connect" },
      {
        property: "og:description",
        content: "Danh sách thẻ NFC đã ghi, trạng thái và lượt chạm gần nhất.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NfcTagsPage,
});

function NfcTagsPage() {
  const t = useT();
  const listTags = useServerFn(bcIdentityNfcTagsListFn);
  const revokeTag = useServerFn(bcIdentityNfcTagRevokeFn);
  const renameTag = useServerFn(bcIdentityNfcTagRenameFn);

  const [tags, setTags] = useState<IdentityNfcTagInfo[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameFailedId, setRenameFailedId] = useState<string | null>(null);
  const [renameDone, setRenameDone] = useState(false);

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      setTags(await listTags());
    } catch {
      setLoadFailed(true);
    }
  }, [listTags]);

  useEffect(() => {
    reportIdentityMetric("NFC_TAGS_VIEWED");
    void load();
  }, [load]);

  async function handleRevoke(tagId: string) {
    if (revokingId) return;
    setRevokingId(tagId);
    try {
      const updated = await revokeTag({ data: { tagId } });
      setTags((prev) => prev?.map((tag) => (tag.id === tagId ? updated : tag)) ?? prev);
    } catch {
      // Revoke failed — reload to resync the honest server state.
      await load();
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRename(tagId: string, label: string) {
    if (renamingId) return;
    setRenamingId(tagId);
    setRenameFailedId(null);
    setRenameDone(false);
    try {
      const updated = await renameTag({ data: { tagId, label } });
      setTags((prev) => prev?.map((tag) => (tag.id === tagId ? updated : tag)) ?? prev);
      setRenameDone(true);
    } catch {
      setRenameFailedId(tagId);
    } finally {
      setRenamingId(null);
    }
  }

  return (
    <MobilePage>
      <BusinessConnectTopBar title={t("bc.mobile.me.nfc.tags.pageTitle")} back />
      <div className="grid gap-4 pt-6">
        <p className="text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.me.nfc.tags.pageDesc")}
        </p>

        {loadFailed ? (
          <section className="rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-6 text-center shadow-[var(--bc-mobile-shadow-v)]">
            <p role="alert" className="text-[14px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.loadError")}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 min-h-11 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[14px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
            >
              {t("bc.mobile.me.retry")}
            </button>
          </section>
        ) : !tags ? (
          <section
            aria-busy="true"
            aria-label={t("bc.mobile.me.nfc.tags.pageTitle")}
            className="flex justify-center rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-10 shadow-[var(--bc-mobile-shadow-v)]"
          >
            <Loader2
              aria-hidden="true"
              className="h-6 w-6 animate-spin text-[var(--bc-mobile-muted)] motion-reduce:animate-none"
              strokeWidth={1.8}
            />
          </section>
        ) : tags.length === 0 ? (
          <section className="rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-6 text-center shadow-[var(--bc-mobile-shadow-v)]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]">
              <Nfc
                aria-hidden="true"
                className="h-5.5 w-5.5 text-[var(--bc-mobile-muted)]"
                strokeWidth={1.8}
              />
            </div>
            <p className="mt-3 text-[14.5px] font-semibold text-[var(--bc-mobile-text)]">
              {t("bc.mobile.me.nfc.tags.empty")}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.nfc.tags.emptyHint")}
            </p>
            <Link
              to="/connect-app/me"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--bc-mobile-text)] px-6 text-[14px] font-semibold text-[var(--bc-mobile-surface)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.me.nfc.tags.backToMe")}
            </Link>
          </section>
        ) : (
          <>
            <p role="status" aria-live="polite" className="sr-only">
              {renameDone ? t("bc.mobile.me.nfc.tags.renameSuccess") : ""}
            </p>
            <NfcTagsList
              tags={tags}
              revokingId={revokingId}
              renamingId={renamingId}
              renameFailedId={renameFailedId}
              onRevoke={handleRevoke}
              onRename={(tagId, label) => void handleRename(tagId, label)}
            />
            <p className="text-[12px] leading-snug text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.nfc.tags.tapNote")}
            </p>
          </>
        )}
      </div>
    </MobilePage>
  );
}

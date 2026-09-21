// BC-Mobile-2D — Person Journey (read-only timeline section).
//
// Contract: docs/business-connect/mobile/BC_MOBILE_2D_TIMELINE_DATA_CONTRACT.md
// UX (spec §22): compact, calm, readable — dot + hairline list; primary line
// is the milestone label, secondary line is the localized date. Read-only:
// no actions, no sheets, no mutations. Self-sufficient: the server fn
// re-checks authorization, so this section renders nothing when the viewer
// is not allowed (fail-closed, same posture as the 2C page).
//
// Failure isolation: journey loading/error NEVER blocks the identity hero.

import { useEffect, useState } from "react";
import { MoreVertical, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFmt, useT, type TKey } from "@/lib/i18n";

import { MomentManageSheet } from "./MomentManageSheet";
import { useBusinessConnectPersonJourney } from "@/hooks/use-business-connect-person-journey";

import type {
  BcMobileJourneyItem,
  BcMobileJourneyKind,
} from "@/lib/business-connect/mobile/person-journey.types";

const KIND_LABEL: Record<BcMobileJourneyKind, TKey> = {
  connected: "bc.mobile.person.journey.event.connected",
  introduction: "bc.mobile.person.journey.event.introduction",
  card_saved: "bc.mobile.person.journey.event.cardSaved",
  contact_shared: "bc.mobile.person.journey.event.contactShared",
  business_card_scanned: "bc.mobile.person.journey.event.cardScanned",
  moment: "bc.mobile.person.journey.event.moment",
};

const HEADING_CLASS =
  "text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]";

function MomentPhotoLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("bc.mobile.moment.photos.previewTitle")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label={t("bc.mobile.moment.photos.previewClose")}
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </div>
  );
}

/** BC-Mobile-2E — a saved Moment: title (event name or truthful i18n
 * fallback), date + place, private note (clamped), and a signed-photo
 * thumbnail. Tapping the thumbnail opens a full-screen viewer.
 * Chủ sở hữu có thể sửa hoặc xoá khoảnh khắc của chính mình. */
function MomentJourneyRow({
  item,
  personId,
  onChanged,
}: {
  item: BcMobileJourneyItem;
  personId?: string;
  onChanged: () => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const [viewing, setViewing] = useState(false);
  const [managing, setManaging] = useState(false);
  const m = item.moment;
  if (!m) return null;
  const title = m.title ?? t("bc.mobile.person.journey.moment.fallbackTitle");
  const momentId = item.id.startsWith("moment:") ? item.id.slice("moment:".length) : null;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-snug text-[var(--bc-mobile-text)]">
            {title}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--bc-mobile-muted)]">
            {fmt.date(item.occurredAt)}
            {m.placeLabel ? ` · ${m.placeLabel}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          {m.photoUrl ? (
            <span className="relative shrink-0">
              <button
                type="button"
                onClick={() => setViewing(true)}
                aria-label={t("bc.mobile.moment.photos.preview")}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
              >
                <img
                  src={m.photoUrl}
                  alt={title}
                  loading="lazy"
                  className="h-14 w-14 rounded-xl border border-[var(--bc-mobile-border)] object-cover"
                />
              </button>
              {m.photoCount > 1 ? (
                <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--bc-mobile-muted)]">
                  +{m.photoCount - 1}
                </span>
              ) : null}
            </span>
          ) : null}
          {momentId ? (
            <button
              type="button"
              onClick={() => setManaging(true)}
              aria-label={t("bc.mobile.moment.manage.actions")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)]"
            >
              <MoreVertical aria-hidden="true" className="h-4.5 w-4.5" strokeWidth={1.8} />
            </button>
          ) : null}
        </div>
      </div>
      {m.note ? (
        <p className="mt-1 line-clamp-2 whitespace-pre-line text-[13px] leading-snug text-[var(--bc-mobile-muted)]">
          {m.note}
        </p>
      ) : null}
      {viewing && m.photoUrl ? (
        <MomentPhotoLightbox src={m.photoUrl} alt={title} onClose={() => setViewing(false)} />
      ) : null}
      {momentId ? (
        <MomentManageSheet
          open={managing}
          onOpenChange={setManaging}
          momentId={momentId}
          occurredAt={item.occurredAt}
          title={m.title}
          placeLabel={m.placeLabel}
          note={m.note}
          photoUrls={m.photoUrl ? [m.photoUrl] : []}
          targetPersonId={personId}
          hasPhotos={m.photoCount > 0}
          onChanged={onChanged}
        />
      ) : null}
    </div>
  );
}

function JourneySkeleton() {
  const t = useT();
  return (
    <div
      role="status"
      aria-label={t("bc.mobile.person.journey.loading")}
      className="mt-3 space-y-4 border-t border-[var(--bc-mobile-border)] pt-4"
    >
      <span className="sr-only">{t("bc.mobile.person.journey.loading")}</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bc-mobile-border)]"
          />
          <span
            aria-hidden="true"
            className="h-3.5 w-2/3 animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
          />
        </div>
      ))}
    </div>
  );
}

export function PersonJourney({
  personId,
  enabled = true,
}: {
  personId: string;
  enabled?: boolean;
}) {
  const t = useT();
  const fmt = useFmt();
  const q = useBusinessConnectPersonJourney({ personId, enabled });
  const queryClient = useQueryClient();
  // Sửa/xoá một khoảnh khắc làm mới dòng thời gian và thẻ Ghi chú (cùng nguồn).
  const refreshJourney = () => {
    void queryClient.invalidateQueries({ queryKey: ["bc-mobile", "person-journey"] });
  };

  // Fail-closed: unauthorized viewers see nothing (the section is absent,
  // never an error). Disabled consumers also render nothing.
  if (!enabled || q.status === "unavailable") return null;

  return (
    <section
      className="mt-10"
      aria-labelledby="bc-mobile-journey-heading"
      aria-busy={q.status === "loading"}
    >
      <h2 id="bc-mobile-journey-heading" className={HEADING_CLASS}>
        {t("bc.mobile.person.journey.title")}
      </h2>

      {q.status === "loading" ? (
        <JourneySkeleton />
      ) : q.status === "error" ? (
        <div className="mt-3 border-t border-[var(--bc-mobile-border)] pt-3">
          <p role="alert" className="text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.person.journey.error")}
          </p>
          <button
            type="button"
            onClick={q.retry}
            className="mt-1 inline-flex min-h-11 items-center text-[14px] font-medium text-[var(--bc-mobile-navy)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
          >
            {t("bc.mobile.person.journey.retry")}
          </button>
        </div>
      ) : q.items.length === 0 ? (
        <p className="mt-3 border-t border-[var(--bc-mobile-border)] pt-3 text-[13px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.person.journey.empty")}
        </p>
      ) : (
        <>
          <ol className="mt-3 border-t border-[var(--bc-mobile-border)]">
            {q.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 border-b border-[var(--bc-mobile-border)] py-3"
              >
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bc-mobile-navy)]"
                />
                {item.kind === "moment" ? (
                  <MomentJourneyRow item={item} personId={personId} onChanged={refreshJourney} />
                ) : (
                  <div className="min-w-0">
                    <p className="text-[14px] leading-snug text-[var(--bc-mobile-text)]">
                      {t(KIND_LABEL[item.kind])}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--bc-mobile-muted)]">
                      {fmt.date(item.occurredAt)}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ol>
          {q.hasNextPage ? (
            <button
              type="button"
              onClick={q.fetchNextPage}
              disabled={q.isFetchingNextPage}
              className="mt-1 inline-flex min-h-11 w-full items-center justify-center text-[14px] font-medium text-[var(--bc-mobile-navy)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
            >
              {q.isFetchingNextPage
                ? t("bc.mobile.person.journey.loadingMore")
                : t("bc.mobile.person.journey.viewMore")}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

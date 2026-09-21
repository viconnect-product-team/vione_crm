// Person Notes — the "Ghi chú" tab of the relationship profile.
//
// Read-only projection of ALREADY canonical data: the private notes attached
// to saved Moments in the person journey. No new backend, no parallel note
// store, no editing here — notes are authored in the Moment composer.

import { useFmt, useT } from "@/lib/i18n";
import { useBusinessConnectPersonJourney } from "@/hooks/use-business-connect-person-journey";

const HEADING_CLASS =
  "text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--bc-mobile-muted)]";

export function PersonNotes({ personId, enabled = true }: { personId: string; enabled?: boolean }) {
  const t = useT();
  const fmt = useFmt();
  const q = useBusinessConnectPersonJourney({ personId, enabled });

  if (!enabled || q.status === "unavailable") return null;

  const notes =
    q.status === "ok"
      ? q.items.filter((item) => item.kind === "moment" && !!item.moment?.note?.trim())
      : [];

  return (
    <section className="mt-6" aria-labelledby="bc-mobile-notes-heading">
      <h2 id="bc-mobile-notes-heading" className={HEADING_CLASS}>
        {t("bc.mobile.person.notes.title")}
      </h2>

      {q.status === "loading" ? (
        <p className="mt-3 border-t border-[var(--bc-mobile-border)] pt-3 text-[13px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.person.notes.loading")}
        </p>
      ) : q.status === "error" ? (
        <div className="mt-3 border-t border-[var(--bc-mobile-border)] pt-3">
          <p role="alert" className="text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.person.notes.error")}
          </p>
          <button
            type="button"
            onClick={q.retry}
            className="mt-1 inline-flex min-h-11 items-center text-[14px] font-medium text-[var(--bc-mobile-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
          >
            {t("bc.mobile.person.notes.retry")}
          </button>
        </div>
      ) : notes.length === 0 ? (
        <p className="mt-3 border-t border-[var(--bc-mobile-border)] pt-3 text-[13px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.person.notes.empty")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2 border-t border-[var(--bc-mobile-border)] pt-3">
          {notes.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5"
            >
              <p className="text-[12px] text-[var(--bc-mobile-muted)]">
                {fmt.date(item.occurredAt)}
                {item.moment?.placeLabel ? ` · ${item.moment.placeLabel}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--bc-mobile-text)]">
                {item.moment?.note}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

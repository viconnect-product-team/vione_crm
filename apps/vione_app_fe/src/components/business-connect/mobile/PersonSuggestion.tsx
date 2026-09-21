// BC-Mobile-6A — Person Detail "V · Gợi ý" section.
// BC-Mobile-6B — contextual [ Liên hệ ] entry → RelationshipActionSheet.
//
// At most ONE evidence-backed suggestion for THIS person. Fail-closed: any
// parse/authorization/evidence failure renders NOTHING (the section simply
// doesn't exist). 6B: the contact entry is rendered ONLY when the person
// resolves through the current authorized DTO (2C fail-closed) — a stale
// recommendation can never authorize an action.

import { MessagesSquare, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLang, useT } from "@/lib/i18n";
import {
  useDismissRelationshipRecommendation,
  usePersonRelationshipRecommendation,
} from "@/hooks/use-relationship-intelligence";
import { recordIntelInteraction } from "@/hooks/use-relationship-personalization";
import { useBusinessConnectPerson } from "@/hooks/use-business-connect-person";
import { resolveRelationshipActions } from "@/lib/business-connect/mobile/relationship-actions";
import { trackRelationshipIntel } from "@/lib/business-connect/mobile/relationship-intelligence.telemetry";
import { RelationshipActionSheet } from "./RelationshipActionSheet";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]";

export function PersonSuggestion({ personId }: { personId: string }) {
  const t = useT();
  const { lang } = useLang();
  const { recommendation, initialLoading, error, retry } = usePersonRelationshipRecommendation(
    personId,
    lang,
  );
  const dismiss = useDismissRelationshipRecommendation();

  // 6B — action availability derives from the CURRENT authorized person DTO
  // (cached 2C query; a stale recommendation never carries contact data).
  const personQuery = useBusinessConnectPerson(personId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const person = personQuery.status === "ok" ? personQuery.person : null;
  const actionsAvailable =
    recommendation != null && person != null
      ? resolveRelationshipActions(person, recommendation.type).actions.length > 0
      : false;

  useEffect(() => {
    if (recommendation) {
      trackRelationshipIntel("RELATIONSHIP_RECOMMENDATION_RENDERED", {
        surface: "person",
        count: 1,
      });
    }
  }, [recommendation]);

  if (initialLoading) {
    return (
      <section
        aria-busy="true"
        role="status"
        aria-label={t("bc.mobile.intel.loading")}
        className="mt-6"
      >
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
        <div className="mt-2.5 h-4 w-3/5 animate-pulse rounded bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6">
        <div role="alert" className="flex items-center gap-3">
          <p className="text-[13px] text-[var(--bc-mobile-muted)]">{t("bc.mobile.intel.error")}</p>
          <button
            type="button"
            onClick={retry}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${FOCUS}`}
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            {t("bc.mobile.intel.retry")}
          </button>
        </div>
      </section>
    );
  }

  if (!recommendation) return null;

  const contextLine = recommendation.aiSuggestion ?? t("bc.mobile.intel.reconnect.suggestion");

  return (
    <section aria-labelledby="bc-person-intel-title" className="mt-6">
      <h2
        id="bc-person-intel-title"
        className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]"
      >
        {t("bc.mobile.intel.person.title")}
      </h2>
      <div className="mt-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug text-[var(--bc-mobile-text)]">{contextLine}</p>
          <p className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.intel.reason.lastInteraction", { days: recommendation.reason.days })}
          </p>
          {actionsAvailable ? (
            <button
              type="button"
              data-testid="bc6b-contact"
              aria-label={t("bc.mobile.intel.actions.contact.a11y", {
                name: person?.displayName ?? "",
              })}
              onClick={() => {
                trackRelationshipIntel("RELATIONSHIP_ACTION_SHEET_OPENED", {
                  surface: "person",
                  recommendationType: "reconnect",
                });
                setSheetOpen(true);
              }}
              className={`mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-4 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${FOCUS}`}
            >
              <MessagesSquare aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              {t("bc.mobile.intel.actions.contact")}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={t("bc.mobile.intel.dismiss")}
          disabled={dismiss.isPending}
          onClick={() => {
            // 6C: coarse behavioral signal; 6A snooze mutation stays authoritative.
            recordIntelInteraction("recommendation_dismissed", "reconnect");
            dismiss.mutate(
              { personId, type: "reconnect" },
              {
                onSuccess: () => toast.success(t("bc.mobile.intel.dismiss.done")),
                onError: () => toast.error(t("bc.mobile.intel.error")),
              },
            );
          }}
          className={`inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] disabled:opacity-50 ${FOCUS}`}
        >
          <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
      {person ? (
        <RelationshipActionSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          person={person}
          recommendationType={recommendation.type}
          contextLine={contextLine}
        />
      ) : null}
    </section>
  );
}

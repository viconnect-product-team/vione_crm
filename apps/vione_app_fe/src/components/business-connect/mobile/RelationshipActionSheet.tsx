// BC-Mobile-6B — RelationshipActionSheet (5C/V sheet semantics).
// Human-confirmed action routing from a 6A recommendation. Deterministic
// availability from the CURRENT authorized person DTO; unavailable actions
// are omitted, never shown disabled; tel:/mailto: destinations rebuilt via
// the centralized 5D sanitizers. No AI, no mutations, no autonomous work.
import { useNavigate } from "@tanstack/react-router";
import { CalendarClock, ListChecks, Mail, NotebookPen, Phone, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { BcMobilePersonDetail } from "@/hooks/use-business-connect-person";
import {
  resolveRelationshipActions,
  type RelationshipActionItem,
} from "@/lib/business-connect/mobile/relationship-actions";
import { orderRelationshipActions } from "@/lib/business-connect/mobile/relationship-personalization.engine";
import {
  recordActionSelected,
  useRelationshipPersonalization,
} from "@/hooks/use-relationship-personalization";
import { trackRelationshipIntel } from "@/lib/business-connect/mobile/relationship-intelligence.telemetry";
import { PersonPlanSheet } from "./PersonPlanSheet";
import type { BcMobilePersonPlanKind } from "@/lib/business-connect/mobile/person-plan.types";

export type RelationshipActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** CURRENT authorized person DTO (2C fail-closed). Never from the recommendation payload. */
  person: BcMobilePersonDetail;
  /** Allowlisted recommendation type (e.g. "reconnect"); unknown → no actions. */
  recommendationType: string;
  /** One-line minimal context (already-grounded suggestion text). */
  contextLine?: string | null;
};

const ACTION_META: Record<
  RelationshipActionItem["kind"],
  { label: TKey; a11y: TKey; icon: (className: string) => ReactNode }
> = {
  call: {
    label: "bc.mobile.intel.actions.call",
    a11y: "bc.mobile.intel.actions.call.a11y",
    icon: (c) => <Phone className={c} aria-hidden="true" />,
  },
  email: {
    label: "bc.mobile.intel.actions.email",
    a11y: "bc.mobile.intel.actions.email.a11y",
    icon: (c) => <Mail className={c} aria-hidden="true" />,
  },
  save_meeting_moment: {
    label: "bc.mobile.intel.actions.moment",
    a11y: "bc.mobile.intel.actions.moment.a11y",
    icon: (c) => <NotebookPen className={c} aria-hidden="true" />,
  },
  create_follow_up: {
    label: "bc.mobile.plan.followUp",
    a11y: "bc.mobile.plan.followUp.a11y",
    icon: (c) => <ListChecks className={c} aria-hidden="true" />,
  },
  schedule_meeting: {
    label: "bc.mobile.plan.meeting",
    a11y: "bc.mobile.plan.meeting.a11y",
    icon: (c) => <CalendarClock className={c} aria-hidden="true" />,
  },
};

export function RelationshipActionSheet({
  open,
  onOpenChange,
  person,
  recommendationType,
  contextLine,
}: RelationshipActionSheetProps) {
  const t = useT();
  const navigate = useNavigate();
  const close = () => onOpenChange(false);

  // Derived from the current DTO at every open — a stale recommendation can
  // never authorize an action (§13/§46). 6C: ORDER may be personalized;
  // availability stays 6B-authoritative (nothing added/removed/disabled).
  const { profile } = useRelationshipPersonalization(open);
  const resolved = resolveRelationshipActions(person, recommendationType);
  const availability = {
    ...resolved,
    actions: orderRelationshipActions(resolved.actions, profile?.preferredAction ?? null),
  };
  const displayName = person.displayName ?? "";
  // 6D: kế hoạch riêng tư (việc theo dõi / cuộc gặp dự kiến).
  const [planKind, setPlanKind] = useState<BcMobilePersonPlanKind | null>(null);

  const handlePlan = (kind: BcMobilePersonPlanKind) => {
    trackRelationshipIntel("RELATIONSHIP_ACTION_SELECTED", {
      surface: "person",
      action: kind === "meeting" ? "schedule_meeting" : "create_follow_up",
      result: "navigated",
    });
    close();
    setPlanKind(kind);
  };

  const handleMoment = () => {
    trackRelationshipIntel("RELATIONSHIP_ACTION_SELECTED", {
      surface: "person",
      action: "save_meeting_moment",
      result: "navigated",
    });
    // 6C: coarse behavioral signal (never influences contact ordering).
    recordActionSelected("save_meeting_moment");
    trackRelationshipIntel("RELATIONSHIP_MOMENT_FLOW_OPENED", { surface: "person" });
    close();
    navigate({
      to: "/connect-app/moment/$personId",
      params: { personId: person.personId },
    });
  };

  const rowClass =
    "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-[var(--bc-mobile-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const iconClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary";

  return (
    <>
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bc-app">
        <DrawerHeader className="relative border-b border-border px-4 pb-3 text-left">
          <div className="flex items-center gap-3 pr-10">
            {person.avatarUrl ? (
              <img
                src={person.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                aria-hidden="true"
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <DrawerTitle className="truncate text-base font-semibold">
                {t("bc.mobile.intel.actions.sheet.title", { name: displayName })}
              </DrawerTitle>
              {person.headline ? (
                <p className="truncate text-xs text-muted-foreground">
                  {person.headline}
                  {person.companyName ? ` · ${person.companyName}` : ""}
                </p>
              ) : person.companyName ? (
                <p className="truncate text-xs text-muted-foreground">{person.companyName}</p>
              ) : null}
            </div>
          </div>
          <DrawerDescription className="mt-1 text-xs text-muted-foreground">
            {contextLine ?? t("bc.mobile.intel.actions.sheet.subtitle")}
          </DrawerDescription>
          <DrawerClose asChild>
            <button
              type="button"
              aria-label={t("bc.mobile.sheet.close")}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--bc-mobile-surface)]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-2">
          {availability.actions.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              {t("bc.mobile.intel.actions.unavailable")}
            </p>
          ) : (
            <ul aria-label={t("bc.mobile.intel.actions.sheet.subtitle")}>
              {availability.actions.map((action) => {
                const meta = ACTION_META[action.kind];
                const a11y = t(meta.a11y, { name: displayName });
                if (action.kind === "create_follow_up" || action.kind === "schedule_meeting") {
                  const planKindForAction: BcMobilePersonPlanKind =
                    action.kind === "schedule_meeting" ? "meeting" : "follow_up";
                  return (
                    <li key={action.kind}>
                      <button
                        type="button"
                        data-testid={`bc6b-action-${action.kind}`}
                        aria-label={a11y}
                        className={rowClass}
                        onClick={() => handlePlan(planKindForAction)}
                      >
                        <span className={iconClass}>{meta.icon("h-4.5 w-4.5")}</span>
                        {t(meta.label)}
                      </button>
                    </li>
                  );
                }
                if (action.kind === "save_meeting_moment") {
                  return (
                    <li key={action.kind}>
                      <button
                        type="button"
                        data-testid={`bc6b-action-${action.kind}`}
                        aria-label={a11y}
                        className={rowClass}
                        onClick={handleMoment}
                      >
                        <span className={iconClass}>{meta.icon("h-4.5 w-4.5")}</span>
                        {t(meta.label)}
                      </button>
                    </li>
                  );
                }
                // call / email — transport handoffs. Opened, never "completed".
                return (
                  <li key={action.kind}>
                    <a
                      href={action.destination ?? "#"}
                      data-testid={`bc6b-action-${action.kind}`}
                      aria-label={a11y}
                      className={cn(rowClass)}
                      onClick={() => {
                        trackRelationshipIntel("RELATIONSHIP_ACTION_SELECTED", {
                          surface: "person",
                          action: action.kind,
                          result: "handoff_opened",
                        });
                        trackRelationshipIntel(
                          action.kind === "call"
                            ? "RELATIONSHIP_CALL_OPENED"
                            : "RELATIONSHIP_EMAIL_OPENED",
                          { surface: "person" },
                        );
                        // 6C: coarse behavioral signal for action-order adaptation.
                        recordActionSelected(action.kind);
                        close();
                      }}
                    >
                      <span className={iconClass}>{meta.icon("h-4.5 w-4.5")}</span>
                      {t(meta.label)}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </DrawerContent>
    </Drawer>
    {planKind ? (
      <PersonPlanSheet
        open
        onOpenChange={(next) => {
          if (!next) setPlanKind(null);
        }}
        personId={person.personId}
        personName={displayName}
        kind={planKind}
      />
    ) : null}
    </>
  );
}

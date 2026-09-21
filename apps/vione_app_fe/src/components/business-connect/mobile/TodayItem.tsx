// BC-Mobile-1A/1B — one "Today" briefing row.
//
// Presentation is driven by SEMANTIC props (kind, urgency, title/context
// lines, optional route) — never by raw backend records. Urgency is conveyed
// by text (kind-specific description line) and icon, not color alone.
//
// BC-Mobile-1B (visual polish only): rows read as editorial briefing lines
// separated by hairline dividers (divide-y on the parent list) — no elevated
// per-item cards, no colored row backgrounds. Genuinely overdue items get a
// tiny danger dot in addition to the existing text cue; actionable rows get
// a barely-there press scale (disabled under reduced motion).

import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  CalendarSync,
  ChevronRight,
  ClipboardCheck,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { hasTKey, useFmt, useT, type TKey } from "@/lib/i18n";
import type { BcMobileTodayItem, BcMobileTodayKind } from "@/hooks/use-business-connect-home";

const KIND_ICON: Record<BcMobileTodayKind, LucideIcon> = {
  meeting: CalendarClock,
  follow_up: ClipboardCheck,
  connection: UserPlus,
  introduction: Users,
  relationship: Sparkles,
  calendar: CalendarSync,
};

function tr(key: string, t: (k: TKey) => string): string {
  return hasTKey(key) ? t(key as TKey) : key;
}

/** Compact time context: meeting start → HH:mm; follow-up due → short date. */
function contextTime(item: BcMobileTodayItem, locale: string): string | null {
  if (item.startsAt) {
    return new Date(item.startsAt).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (item.dueAt) {
    return new Date(item.dueAt).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });
  }
  return null;
}

export function TodayItem({
  item,
  onSelect,
}: {
  item: BcMobileTodayItem;
  onSelect?: (item: BcMobileTodayItem) => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const Icon = KIND_ICON[item.kind];
  const title = tr(item.titleKey, t);

  const time = contextTime(item, fmt.locale);
  // High-urgency items surface their server-provided description as a text
  // cue (e.g. "Cần xử lý ngay.") — urgency is never color-only.
  const urgent =
    (item.urgency === "critical" || item.urgency === "high") && item.descriptionKey
      ? tr(item.descriptionKey, t)
      : null;
  const context = [urgent, time, item.counterpartDisplayName]
    .filter((p): p is string => Boolean(p))
    .join(" · ");

  // Danger red is reserved for genuinely overdue items only, and always as a
  // companion to the text cue — never the whole-row signal.
  const overdue = item.category === "overdue";

  const ariaLabel = context ? `${title}. ${context}` : title;
  const isEventAction = Boolean(onSelect) && (item.id.startsWith("event:") || item.action.targetRoute === "/events/$eventId");
  const canRoute = !isEventAction && item.action.canRoute && Boolean(item.action.targetRoute);

  const body = (
    <>
      <span
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-navy)]"
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-[var(--bc-mobile-text)]">
          {title}
        </span>
        {context ? (
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--bc-mobile-muted)]">
            {overdue ? (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bc-mobile-danger)]"
              />
            ) : null}
            <span className="truncate">{context}</span>
          </span>
        ) : null}
      </span>
      {canRoute || isEventAction ? (
        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 self-center text-[var(--bc-mobile-muted)]"
        />
      ) : null}
    </>
  );

  const rowClass = "flex min-h-[60px] w-full items-center gap-3.5 py-4 text-left";

  return (
    <li>
      {isEventAction ? (
        <button
          type="button"
          onClick={() => onSelect?.(item)}
          aria-label={ariaLabel}
          className={`${rowClass} rounded-lg transition-transform duration-150 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none motion-reduce:active:scale-100`}
        >
          {body}
        </button>
      ) : canRoute ? (
        <Link
          to={item.action.targetRoute as any}
          params={(item.action.targetParams ?? {}) as any}
          search={(item.action.targetSearch ?? {}) as any}
          aria-label={ariaLabel}
          className={`${rowClass} rounded-lg transition-transform duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none motion-reduce:active:scale-100`}
        >
          {body}
        </Link>
      ) : (
        <div aria-label={ariaLabel} className={rowClass}>
          {body}
        </div>
      )}
    </li>
  );
}

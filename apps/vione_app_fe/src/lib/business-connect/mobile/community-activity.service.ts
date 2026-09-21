// BC-Mobile-7B — Community activity pure mapping/policy helpers (client-safe).
// Every whitelist boundary lives here and is unit-tested: private fields can
// never pass through these mappers (see BC_MOBILE_7B_ACTIVITY_AUDIT.md).

import { normalizeCommunitySearch } from "./community.service";
import type {
  CommunityEventCapacityStateDTO,
  CommunityInterestLevel,
  CommunityEventRegistrationStateDTO,
  CommunityEventSummaryDTO,
  CommunityOpportunityPreviewDTO,
  CommunityOpportunitySummaryDTO,
} from "./community-activity.types";

export const COMMUNITY_EVENTS_PAGE_SIZE = 20;
export const COMMUNITY_OPPORTUNITIES_PAGE_SIZE = 20;
export const COMMUNITY_ACTIVITY_PREVIEW_LIMIT = 2;
export const COMMUNITY_OPP_SHORT_DESC_LEN = 140;

const DAY_MS = 86_400_000;

const CANONICAL_OPP_TYPES: ReadonlySet<string> = new Set([
  "partnership",
  "investment",
  "supply",
  "demand",
  "distribution",
  "other",
]);

/**
 * Privileged events row. The index signature deliberately allows extra
 * (private) columns — qr_fields, internal metadata — so tests can prove
 * they never leak through the mapper.
 */
export type CommunityEventRow = {
  id: string;
  name: string;
  date: string;
  location: string | null;
  type: string | null;
  status: string;
  capacity: number | null;
  [privateField: string]: unknown;
};

export type CommunityOpportunityRow = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  region: string | null;
  industry: string | null;
  deadline: string | null;
  status: string;
  created_at: string;
  poster_id: string | null;
  [privateField: string]: unknown;
};

/** Canonical registration = any status except 'cancelled' (writer uses 'registered'). */
export function isRegistrationActive(status: string | null | undefined): boolean {
  return (status ?? "") !== "cancelled";
}

/** Canonical event statuses that may still accept registrations. */
export function isEventRegistrationOpenStatus(status: string): boolean {
  return status === "upcoming";
}

/** Statuses shown in the upcoming list (future, not finished/cancelled). */
export function isEventListableStatus(status: string): boolean {
  return status === "upcoming" || status === "ongoing";
}

export function mapCapacityState(
  capacity: number | null | undefined,
  activeRegistrations: number,
): CommunityEventCapacityStateDTO {
  if (!capacity || capacity <= 0) return null; // no canonical capacity semantics
  return activeRegistrations >= capacity ? "full" : "open";
}

export function mapRegistrationState(input: {
  status: string;
  isRegistered: boolean;
  isFull: boolean;
}): CommunityEventRegistrationStateDTO {
  if (input.status === "cancelled") return "cancelled";
  if (input.status === "completed" || input.status === "ongoing") return "closed";
  if (input.isRegistered) return "registered";
  if (input.isFull) return "full";
  return "available";
}

/** WHITELIST mapper — only the fields below ever leave the server. */
export function mapCommunityEventSummary(
  row: CommunityEventRow,
  opts: { isRegistered: boolean; activeRegistrations: number },
): CommunityEventSummaryDTO {
  const capacityState = mapCapacityState(row.capacity, opts.activeRegistrations);
  return {
    eventRef: row.id,
    title: row.name,
    startAt: String(row.date),
    locationLabel: row.location ?? null,
    formatLabel: row.type ?? null,
    registrationState: mapRegistrationState({
      status: row.status,
      isRegistered: opts.isRegistered,
      isFull: capacityState === "full",
    }),
    capacityState,
  };
}

/** Register CTA policy: explicit, canonical, never optimistic. */
export function canInitiateRegistration(input: {
  registrationState: CommunityEventRegistrationStateDTO;
  hasMemberRecord: boolean;
  dateInFutureOrToday: boolean;
}): boolean {
  return (
    input.registrationState === "available" && input.hasMemberRecord && input.dateInFutureOrToday
  );
}

/**
 * Date-block parts parsed WITHOUT Date() — events.date is a date-only column,
 * so timezone conversion would be fabrication. Returns null on malformed input.
 */
export function eventDateParts(isoDate: string): { day: string; month: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!m) return null;
  return { day: m[3], month: Number(m[2]) };
}

/** Today as YYYY-MM-DD (UTC) for canonical date-column comparisons. */
export function todayIsoDate(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/** Canonical taxonomy mapping — unknown types render NOTHING (never invented). */
export function normalizeOpportunityCategory(type: string | null | undefined): string | null {
  if (!type) return null;
  const raw = type.startsWith("opp.type.") ? type.slice("opp.type.".length) : type;
  return CANONICAL_OPP_TYPES.has(raw) ? `opp.type.${raw}` : null;
}

/** UTC-safe derived days until canonical deadline; clamped at 0; null when unknown. */
export function opportunityDaysLeft(
  deadline: string | null | undefined,
  nowMs: number,
): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil((ms - nowMs) / DAY_MS));
}

/** An opportunity is listable when canonically open and not past its deadline. */
export function isOpportunityActive(
  row: Pick<CommunityOpportunityRow, "status" | "deadline">,
  nowMs: number,
): boolean {
  if (row.status !== "open") return false;
  if (!row.deadline) return true;
  const ms = new Date(row.deadline).getTime();
  if (Number.isNaN(ms)) return false;
  return ms >= nowMs;
}

/** Collapse whitespace and clamp — plain-text only, rendered as a text node. */
export function truncatePlain(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length === 0) return null;
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** WHITELIST mapper — only the fields below ever leave the server. */
export function mapCommunityOpportunitySummary(
  row: CommunityOpportunityRow,
  opts: {
    organizationLabel: string | null;
    interested: boolean;
    interestLevel?: CommunityInterestLevel | null;
    nowMs: number;
  },
): CommunityOpportunitySummaryDTO {
  const expiresAt = row.deadline ?? null;
  return {
    opportunityRef: row.id,
    title: row.title,
    categoryKey: normalizeOpportunityCategory(row.type),
    organizationLabel: opts.organizationLabel,
    shortDescription: truncatePlain(row.description, COMMUNITY_OPP_SHORT_DESC_LEN),
    publishedAt: row.created_at,
    expiresAt,
    daysLeft: opportunityDaysLeft(expiresAt, opts.nowMs),
    interested: opts.interested,
    interestLevel: opts.interested ? (opts.interestLevel ?? "high") : null,
  };
}

export function mapCommunityOpportunityPreview(
  row: CommunityOpportunityRow,
  opts: { organizationLabel: string | null; nowMs: number },
): CommunityOpportunityPreviewDTO {
  return {
    opportunityRef: row.id,
    title: row.title,
    categoryKey: normalizeOpportunityCategory(row.type),
    organizationLabel: opts.organizationLabel,
    daysLeft: opportunityDaysLeft(row.deadline, opts.nowMs),
  };
}

/** Interest CTA policy: open + not expired + not own post + member record. */
export function canInitiateInterest(input: {
  status: string;
  deadline: string | null;
  nowMs: number;
  isOwnPost: boolean;
  hasMemberRecord: boolean;
  alreadyInterested: boolean;
}): boolean {
  if (input.alreadyInterested || input.isOwnPost || !input.hasMemberRecord) return false;
  return isOpportunityActive({ status: input.status, deadline: input.deadline }, input.nowMs);
}

/** Search normalization — reuse the 7A-tested PostgREST-safe normalizer. */
export function normalizeActivitySearch(raw: string): string {
  return normalizeCommunitySearch(raw).replace(/[%*]/g, " ").replace(/\s+/g, " ").trim();
}

/** Offset pagination math (deterministic, bounded). */
export function nextActivityOffset(
  loadedInPage: number,
  offset: number,
  totalCount: number,
): number | null {
  const next = offset + loadedInPage;
  return next < totalCount ? next : null;
}

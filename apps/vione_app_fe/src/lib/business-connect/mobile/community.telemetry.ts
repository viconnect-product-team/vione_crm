// BC-Mobile-7A — Community telemetry (allowlist-only, zero PII).
// Metrics carry NO community ids, member refs, names, search queries,
// event/opportunity titles, or check-in credentials.
// BC-Mobile-7B adds the §81 activity metrics only.

export type CommunityMetric =
  | "COMMUNITY_OPENED"
  | "COMMUNITY_MEMBER_LIST_OPENED"
  | "COMMUNITY_MEMBER_PROFILE_OPENED"
  | "COMMUNITY_SEARCH_USED"
  | "COMMUNITY_CONNECT_OPENED"
  | "COMMUNITY_CONNECT_SENT"
  | "COMMUNITY_CONNECT_FAILED"
  | "COMMUNITY_EVENTS_OPENED"
  | "COMMUNITY_EVENT_OPENED"
  | "COMMUNITY_EVENT_REGISTER_SELECTED"
  | "COMMUNITY_EVENT_REGISTERED"
  | "COMMUNITY_OPPORTUNITIES_OPENED"
  | "COMMUNITY_OPPORTUNITY_OPENED"
  | "COMMUNITY_OPPORTUNITY_ACTION_SELECTED";

const ALLOWED_METRICS: ReadonlySet<string> = new Set<CommunityMetric>([
  "COMMUNITY_OPENED",
  "COMMUNITY_MEMBER_LIST_OPENED",
  "COMMUNITY_MEMBER_PROFILE_OPENED",
  "COMMUNITY_SEARCH_USED",
  "COMMUNITY_CONNECT_OPENED",
  "COMMUNITY_CONNECT_SENT",
  "COMMUNITY_CONNECT_FAILED",
  "COMMUNITY_EVENTS_OPENED",
  "COMMUNITY_EVENT_OPENED",
  "COMMUNITY_EVENT_REGISTER_SELECTED",
  "COMMUNITY_EVENT_REGISTERED",
  "COMMUNITY_OPPORTUNITIES_OPENED",
  "COMMUNITY_OPPORTUNITY_OPENED",
  "COMMUNITY_OPPORTUNITY_ACTION_SELECTED",
]);

export function reportCommunityMetric(name: CommunityMetric): void {
  if (!ALLOWED_METRICS.has(name)) return;
  try {
    console.info(`[bc-community] ${name}`);
  } catch {
    // Telemetry must never throw into the user path.
  }
}

// BC-Mobile-6A — Relationship Intelligence composition service.
//
// Framework-free (DI): the server adapter injects Supabase-backed ports;
// tests inject in-memory ports. Authorization is fail-closed at the ports
// (viewer-scoped queries); this module composes evidence → deterministic
// selection → optional AI wording (wording ONLY, never ranking).
//
// Privacy: ports return minimal rows; the DTO carries no notes/photos/PII.

import { parseBcMobilePersonId } from "./person-journey.types";
import {
  buildEvidence,
  latestMomentByPerson,
  rankReconnectCandidates,
  selectReconnectCandidate,
  type ReconnectCandidate,
  type RelationshipDismissal,
} from "./relationship-intelligence.engine";
import { trackRelationshipIntel } from "./relationship-intelligence.telemetry";
import type { RelationshipPersonalizationPolicy } from "./relationship-personalization.types";
import {
  RELATIONSHIP_INTELLIGENCE_CONFIG,
  type BcMobilePersonRecommendationResult,
  type BcMobileRelIntelPersonKind,
  type BcMobileTodayRecommendationsResult,
  type RelationshipIntelligenceConfig,
  type RelationshipRecommendation,
  type RelationshipRecommendationPerson,
  type RelationshipWordingLocale,
} from "./relationship-intelligence.types";

// ── Ports (minimal, viewer-scoped) ─────────────────────────────────────────

export type ConnectionEdge = {
  connectionId: string;
  counterpartUserId: string;
  connectedAt: string;
};

export type SavedCardEdge = {
  targetCardId: string;
  savedAt: string;
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  companyName: string | null;
  industryLabel?: string | null;
  areaLabel?: string | null;
};

export type GuestContactEdge = {
  id: string;
  displayName: string;
  firstSharedAt: string | null;
  source: string | null;
  areaLabel?: string | null;
};

export type MomentEdge = { personId: string; occurredAt: string };

export type CounterpartPublicSummary = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  companyName: string | null;
  areaLabel?: string | null;
};

export type RelationshipWordingPort = (input: {
  locale: RelationshipWordingLocale;
  daysSinceLastInteraction: number;
}) => Promise<string | null>;

export interface RelationshipIntelligenceDeps {
  /** Accepted connections, OLDEST activity first, bounded. */
  listOldestConnections(viewerId: string, limit: number): Promise<ConnectionEdge[]>;
  listSavedCardEdges(viewerId: string, limit: number): Promise<SavedCardEdge[]>;
  listGuestEdges(viewerId: string, limit: number): Promise<GuestContactEdge[]>;
  /** Owner moments (timestamps + target only), newest first, bounded. */
  listRecentMomentEdges(viewerId: string, limit: number): Promise<MomentEdge[]>;
  /** Privacy-safe public summaries (PUBLISHED + PUBLIC cards only). */
  resolveConnectionSummaries(userIds: string[]): Promise<CounterpartPublicSummary[]>;
  listDismissals(viewerId: string): Promise<RelationshipDismissal[]>;
  /** Single-person fail-closed authorization + edge (null ⇒ omit silently). */
  getAcceptedConnectionEdge(viewerId: string, targetUserId: string): Promise<ConnectionEdge | null>;
  getSavedCardEdge(viewerId: string, targetCardId: string): Promise<SavedCardEdge | null>;
  getGuestEdge(viewerId: string, guestId: string): Promise<GuestContactEdge | null>;
  /** Optional AI wording port (server injects; absent ⇒ deterministic). */
  wording?: RelationshipWordingPort;
  /** 6C: viewer personalization policy; absent or failing ⇒ deterministic defaults. */
  personalization?: (viewerId: string) => Promise<RelationshipPersonalizationPolicy | null>;
}

/** 6C: the ONLY user-influenceable knob is the reconnect threshold. */
function effectiveConfig(
  policy: RelationshipPersonalizationPolicy | null,
): RelationshipIntelligenceConfig {
  if (!policy) return RELATIONSHIP_INTELLIGENCE_CONFIG;
  return {
    ...RELATIONSHIP_INTELLIGENCE_CONFIG,
    RECONNECT_AFTER_DAYS: policy.reconnectThresholdDays,
  } as RelationshipIntelligenceConfig;
}

/** 6C: master/type switches suppress BEFORE any selection or ranking. */
function isSuppressed(policy: RelationshipPersonalizationPolicy | null): boolean {
  if (!policy) return false;
  // 6A ships only the "reconnect" type — type-level OFF ⇒ fully quiet.
  return !policy.recommendationsEnabled || !policy.reconnectEnabled;
}

// ── Composition ────────────────────────────────────────────────────────────

function recommendationId(personId: string): string {
  return `${personId}:reconnect`;
}

async function applyWording(
  deps: RelationshipIntelligenceDeps,
  locale: RelationshipWordingLocale,
  candidate: ReconnectCandidate,
): Promise<{ aiSuggestion: string | null; wordingSource: "deterministic" | "ai" }> {
  if (!deps.wording || !RELATIONSHIP_INTELLIGENCE_CONFIG.AI_WORDING_ENABLED) {
    return { aiSuggestion: null, wordingSource: "deterministic" };
  }
  try {
    const text = await deps.wording({ locale, daysSinceLastInteraction: candidate.days });
    if (text) return { aiSuggestion: text, wordingSource: "ai" };
  } catch {
    trackRelationshipIntel("RELATIONSHIP_AI_FALLBACK_USED", { reason: "gateway" });
  }
  return { aiSuggestion: null, wordingSource: "deterministic" };
}

async function toRecommendation(
  deps: RelationshipIntelligenceDeps,
  locale: RelationshipWordingLocale,
  candidate: ReconnectCandidate,
  person: RelationshipRecommendationPerson,
  nowIso: string,
): Promise<RelationshipRecommendation> {
  const wording = await applyWording(deps, locale, candidate);
  return {
    id: recommendationId(candidate.personId),
    person,
    type: "reconnect",
    reason: {
      kind: "last_interaction",
      days: candidate.days,
      evidenceKind: candidate.evidenceKind,
    },
    aiSuggestion: wording.aiSuggestion,
    wordingSource: wording.wordingSource,
    generatedAt: nowIso,
  };
}

/** Home: evidence-backed reconnect suggestions across all three person kinds. */
export async function composeTodayRecommendations(
  deps: RelationshipIntelligenceDeps,
  viewerId: string,
  locale: RelationshipWordingLocale,
  now: Date = new Date(),
): Promise<BcMobileTodayRecommendationsResult> {
  const nowMs = now.getTime();
  const nowIso = now.toISOString();

  const [connections, savedCards, guests, moments, dismissals, policy] = await Promise.all([
    deps.listOldestConnections(
      viewerId,
      RELATIONSHIP_INTELLIGENCE_CONFIG.HOME_CANDIDATE_CONNECTIONS,
    ),
    deps.listSavedCardEdges(viewerId, RELATIONSHIP_INTELLIGENCE_CONFIG.HOME_CANDIDATE_SAVED_CARDS),
    deps.listGuestEdges(viewerId, RELATIONSHIP_INTELLIGENCE_CONFIG.HOME_CANDIDATE_GUESTS),
    deps.listRecentMomentEdges(viewerId, RELATIONSHIP_INTELLIGENCE_CONFIG.MOMENT_READ_WINDOW),
    deps.listDismissals(viewerId),
    deps.personalization ? deps.personalization(viewerId) : Promise.resolve(null),
  ]);

  // 6C: explicit suppression happens before any selection or ranking.
  if (isSuppressed(policy)) return { recommendations: [] };
  const config = effectiveConfig(policy);
  if (policy?.cadenceSource === "adaptive") {
    trackRelationshipIntel("PERSONALIZATION_ADAPTATION_APPLIED", { surface: "home" });
  }
  const momentsByPerson = latestMomentByPerson(moments);

  const summaries = await deps.resolveConnectionSummaries(
    connections.map((c: any) => c.counterpartUserId),
  );
  const summaryById = new Map(summaries.map((s) => [s.userId, s]));

  type Enriched = ReconnectCandidate & { person: RelationshipRecommendationPerson };
  const candidates: Enriched[] = [];

  for (const c of connections) {
    const personId = `u:${c.counterpartUserId}`;
    const evidence = buildEvidence({
      personId,
      kind: "connection",
      startedAt: c.connectedAt,
      latestMomentAt: momentsByPerson.get(personId) ?? null,
    });
    const sel = selectReconnectCandidate(evidence, dismissals, nowMs, config);
    if (!sel) continue;
    const s = summaryById.get(c.counterpartUserId);
    candidates.push({
      ...sel,
      person: {
        personId,
        displayName: s?.displayName ?? null,
        avatarUrl: s?.avatarUrl ?? null,
        headline: s?.headline ?? null,
        companyName: s?.companyName ?? null,
        industryLabel: null,
        areaLabel: s?.areaLabel ?? null,
      },
    });
  }

  for (const card of savedCards) {
    const personId = `c:${card.targetCardId}`;
    const evidence = buildEvidence({
      personId,
      kind: "saved_card",
      startedAt: card.savedAt,
      latestMomentAt: momentsByPerson.get(personId) ?? null,
    });
    const sel = selectReconnectCandidate(evidence, dismissals, nowMs, config);
    if (!sel) continue;
    candidates.push({
      ...sel,
      person: {
        personId,
        displayName: card.displayName,
        avatarUrl: card.avatarUrl,
        headline: card.headline,
        companyName: card.companyName,
        industryLabel: card.industryLabel ?? null,
        areaLabel: card.areaLabel ?? null,
      },
    });
  }

  for (const g of guests) {
    const personId = `g:${g.id}`;
    const evidence = buildEvidence({
      personId,
      kind: "guest_contact",
      startedAt: g.firstSharedAt,
      originSource: g.source,
      latestMomentAt: momentsByPerson.get(personId) ?? null,
    });
    const sel = selectReconnectCandidate(evidence, dismissals, nowMs, config);
    if (!sel) continue;
    candidates.push({
      ...sel,
      person: {
        personId,
        displayName: g.displayName,
        avatarUrl: null,
        headline: null,
        companyName: null,
        industryLabel: null,
        areaLabel: g.areaLabel ?? null,
      },
    });
  }

  const top = rankReconnectCandidates(candidates).slice(0, config.MAX_HOME_RECOMMENDATIONS);
  const recommendations: RelationshipRecommendation[] = [];
  for (const c of top) {
    recommendations.push(await toRecommendation(deps, locale, c, c.person, nowIso));
  }
  return { recommendations };
}

const KIND_MAP: Record<string, BcMobileRelIntelPersonKind> = {
  connection: "connection",
  saved_card: "saved_card",
  guest_contact: "guest_contact",
};

/**
 * Person Detail: at most ONE suggestion, fail-closed. ANY failure to parse,
 * authorize, or resolve evidence ⇒ { recommendation: null } (section hidden).
 */
export async function composePersonRecommendation(
  deps: RelationshipIntelligenceDeps,
  viewerId: string,
  personId: string,
  locale: RelationshipWordingLocale,
  now: Date = new Date(),
): Promise<BcMobilePersonRecommendationResult> {
  const nowMs = now.getTime();
  const parsed = parseBcMobilePersonId(personId);
  if (!parsed) return { recommendation: null };
  const kind = KIND_MAP[parsed.kind];
  if (!kind) return { recommendation: null };

  let startedAt: string | null = null;
  let originSource: string | null = null;
  let person: RelationshipRecommendationPerson;

  if (kind === "connection") {
    const edge = await deps.getAcceptedConnectionEdge(viewerId, parsed.id);
    if (!edge) return { recommendation: null };
    startedAt = edge.connectedAt;
    const [summary] = await deps.resolveConnectionSummaries([parsed.id]);
    person = {
      personId,
      displayName: summary?.displayName ?? null,
      avatarUrl: summary?.avatarUrl ?? null,
      headline: summary?.headline ?? null,
      companyName: summary?.companyName ?? null,
      industryLabel: null,
      areaLabel: summary?.areaLabel ?? null,
    };
  } else if (kind === "saved_card") {
    const edge = await deps.getSavedCardEdge(viewerId, parsed.id);
    if (!edge) return { recommendation: null };
    startedAt = edge.savedAt;
    person = {
      personId,
      displayName: edge.displayName,
      avatarUrl: edge.avatarUrl,
      headline: edge.headline,
      companyName: edge.companyName,
      industryLabel: edge.industryLabel ?? null,
      areaLabel: edge.areaLabel ?? null,
    };
  } else {
    const edge = await deps.getGuestEdge(viewerId, parsed.id);
    if (!edge) return { recommendation: null };
    startedAt = edge.firstSharedAt;
    originSource = edge.source;
    person = {
      personId,
      displayName: edge.displayName,
      avatarUrl: null,
      headline: null,
      companyName: null,
      industryLabel: null,
      areaLabel: edge.areaLabel ?? null,
    };
  }

  const [moments, dismissals, policy] = await Promise.all([
    deps.listRecentMomentEdges(viewerId, RELATIONSHIP_INTELLIGENCE_CONFIG.MOMENT_READ_WINDOW),
    deps.listDismissals(viewerId),
    deps.personalization ? deps.personalization(viewerId) : Promise.resolve(null),
  ]);
  // 6C: explicit suppression happens before any selection.
  if (isSuppressed(policy)) return { recommendation: null };
  if (policy?.cadenceSource === "adaptive") {
    trackRelationshipIntel("PERSONALIZATION_ADAPTATION_APPLIED", { surface: "person" });
  }
  const config = effectiveConfig(policy);
  const latestMoment = latestMomentByPerson(moments).get(personId) ?? null;

  const evidence = buildEvidence({
    personId,
    kind,
    startedAt,
    originSource,
    latestMomentAt: latestMoment,
  });
  if (!evidence.lastMeaningfulInteraction) {
    trackRelationshipIntel("RELATIONSHIP_RECOMMENDATION_RENDER_BLOCKED_MISSING_EVIDENCE", {
      surface: "person",
      reason: "no_evidence",
    });
    return { recommendation: null };
  }

  const sel = selectReconnectCandidate(evidence, dismissals, nowMs, config);
  if (!sel) return { recommendation: null };

  const recommendation = await toRecommendation(deps, locale, sel, person, now.toISOString());
  return { recommendation };
}

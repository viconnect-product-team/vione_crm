// BC-9.0 — Context builders (§10). Pure composition over ALREADY-FETCHED safe
// projections. Actual RLS-scoped fetching wires in Turn B via
// `service.server.ts`, which passes safe projections into these builders.
//
// Each builder:
//   1. Filters incoming facts to the capability's allowlisted sources.
//   2. Applies the capability's context window bounds.
//   3. Records what was omitted so the response can surface honest limitations.
//   4. Returns a fully-formed BusinessConnectAIContextEnvelope.
//
// Builders never fetch. Builders never widen scope. Builders never touch
// private notes — the safe-fact type system prevents it.

import { CONTEXT_WINDOWS, BUSINESS_CONNECT_AI_POLICY_VERSION } from "./context-policy";
import { getPromptEntry } from "./prompt-registry";
import { allowedSourcesFor, type BusinessConnectAICapability } from "./registry";
import { redactBusinessConnectAIContext } from "./redaction";
import type {
  BusinessConnectAIContextEnvelope,
  BusinessConnectSafeFact,
  IntelligenceScope,
  ModelPolicyClass,
  ViewerContext,
} from "./types";

export type BuildContextInput = {
  requestId: string;
  capability: BusinessConnectAICapability;
  viewerContext: ViewerContext;
  scope: IntelligenceScope;
  candidateFacts: readonly BusinessConnectSafeFact[];
  modelPolicy: ModelPolicyClass;
  now?: Date;
};

function isoOrNull(v: string | undefined | null): string | null {
  return v ?? null;
}

function withinDays(updatedAt: string, days: number, reference: number): boolean {
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return false;
  return reference - t <= days * 24 * 60 * 60 * 1000;
}

function pickLatest<T extends { updatedAt: string }>(arr: readonly T[], max: number): readonly T[] {
  return [...arr].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, max);
}

function foldWindows(
  capability: BusinessConnectAICapability,
  facts: readonly BusinessConnectSafeFact[],
  nowMs: number,
): {
  kept: BusinessConnectSafeFact[];
  omissions: string[];
} {
  const omissions: string[] = [];
  const byKind: Record<string, BusinessConnectSafeFact[]> = {};
  for (const f of facts) {
    (byKind[f.kind] ??= []).push(f);
  }

  const kept: BusinessConnectSafeFact[] = [];
  const w = CONTEXT_WINDOWS;

  const takeCapped = <T extends BusinessConnectSafeFact>(
    kind: T["kind"],
    max: number,
    filter?: (f: T) => boolean,
  ) => {
    const src = (byKind[kind] ?? []) as T[];
    const filtered = filter ? src.filter(filter) : src;
    const limited = pickLatest(filtered, max);
    if (filtered.length > limited.length) {
      omissions.push(
        `Đã bỏ ${filtered.length - limited.length} bản ghi ${kind} vượt ngưỡng ${max}.`,
      );
    }
    kept.push(...limited);
  };

  takeCapped("person", 25);
  takeCapped("organization", 15);
  takeCapped("relationship", w.relationshipRecentActivityMax, (f) =>
    withinDays(f.updatedAt, w.relationshipRecentActivityDays, nowMs),
  );
  takeCapped("introduction", w.introductionsMax);
  takeCapped("meeting", w.meetingHistoryMax);
  takeCapped("agenda_item", w.agendaItemsMax);
  takeCapped("shared_note", w.sharedNotesMax);
  takeCapped("meeting_outcome", w.meetingHistoryMax);
  takeCapped("follow_up", w.followUpsMax);
  takeCapped("work_item", w.workHubItemsMax);
  takeCapped("opportunity_signal", 20);

  // Capability-specific bans applied AFTER windows (defense in depth).
  const allowed = new Set(allowedSourcesFor(capability));
  const finalKept = kept.filter((f) => {
    if (!allowed.has(f.sourceDomain)) {
      omissions.push(
        `Bỏ fact ${f.kind} vì nguồn ${f.sourceDomain} không thuộc allowlist của năng lực.`,
      );
      return false;
    }
    return true;
  });

  return { kept: finalKept, omissions };
}

function summarizeFreshness(facts: readonly BusinessConnectSafeFact[]) {
  if (facts.length === 0) {
    return { oldestSourceUpdatedAt: null, newestSourceUpdatedAt: null };
  }
  const times = facts
    .map((f) => Date.parse(f.updatedAt))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  return {
    oldestSourceUpdatedAt: isoOrNull(new Date(times[0]).toISOString()),
    newestSourceUpdatedAt: isoOrNull(new Date(times[times.length - 1]).toISOString()),
  };
}

function buildEnvelope(
  input: BuildContextInput,
  extraExclusions: readonly string[] = [],
): BusinessConnectAIContextEnvelope {
  const now = input.now ?? new Date();
  const { kept, omissions } = foldWindows(input.capability, input.candidateFacts, now.getTime());
  const freshness = summarizeFreshness(kept);
  const prompt = getPromptEntry(input.capability);

  const envelope: BusinessConnectAIContextEnvelope = {
    requestId: input.requestId,
    capability: input.capability,
    viewerContext: input.viewerContext,
    scope: input.scope,
    safeFacts: kept,
    exclusions: [...omissions, ...extraExclusions],
    dataFreshness: {
      generatedAt: now.toISOString(),
      oldestSourceUpdatedAt: freshness.oldestSourceUpdatedAt,
      newestSourceUpdatedAt: freshness.newestSourceUpdatedAt,
    },
    sourceVersions: {},
    policyVersion: BUSINESS_CONNECT_AI_POLICY_VERSION,
    promptVersion: prompt.version,
    modelPolicy: input.modelPolicy,
  };

  return redactBusinessConnectAIContext(envelope);
}

// ── Public builders (§10) — thin, capability-typed wrappers. ────────────────

export function buildRelationshipBriefingContext(input: BuildContextInput) {
  return buildEnvelope({ ...input, capability: "relationship_briefing" });
}
export function buildMeetingPreparationContext(input: BuildContextInput) {
  return buildEnvelope({ ...input, capability: "meeting_preparation" }, ["private meeting notes"]);
}
export function buildIntroductionDraftContext(input: BuildContextInput) {
  return buildEnvelope({ ...input, capability: "introduction_draft" });
}
export function buildFollowUpDraftContext(input: BuildContextInput) {
  return buildEnvelope({ ...input, capability: "follow_up_draft" }, ["private meeting notes"]);
}
export function buildNextActionContext(input: BuildContextInput) {
  return buildEnvelope({ ...input, capability: "next_action_suggestion" });
}
export function buildOpportunitySignalContext(input: BuildContextInput) {
  return buildEnvelope({ ...input, capability: "opportunity_signal_summary" });
}
export function buildNetworkQueryContext(input: BuildContextInput) {
  return buildEnvelope({ ...input, capability: "network_query" });
}
export function buildWorkHubAssistantContext(input: BuildContextInput) {
  return buildEnvelope({ ...input, capability: "work_hub_assistant" });
}

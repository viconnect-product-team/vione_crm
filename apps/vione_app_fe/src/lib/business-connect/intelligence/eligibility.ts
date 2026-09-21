// BC-9.0 — Pure eligibility & source-allowlist policy checks.
// These functions are stateless and safe to import anywhere (client or server).
// Real viewer/RLS enforcement lives in the server-only service — these helpers
// prove policy correctness independent of runtime.

import {
  allowedSourcesFor,
  BUSINESS_CONNECT_AI_CAPABILITIES,
  BUSINESS_CONNECT_AI_EXCLUDED_DOMAINS,
  type BusinessConnectAICapability,
  type BusinessConnectAIExcludedDomain,
  type BusinessConnectAISourceDomain,
} from "./registry";
import type { IntelligenceScope } from "./types";

const EXCLUDED = new Set<BusinessConnectAIExcludedDomain>(BUSINESS_CONNECT_AI_EXCLUDED_DOMAINS);

export function isSourceAllowedForCapability(
  capability: BusinessConnectAICapability,
  source: BusinessConnectAISourceDomain,
): boolean {
  return allowedSourcesFor(capability).includes(source);
}

export function isSourceGloballyExcluded(source: string): boolean {
  return EXCLUDED.has(source as BusinessConnectAIExcludedDomain);
}

/** Static guard: no BC-9.0 capability may ever consume `private_meeting_notes`. */
export function assertPrivateNotesExcluded(): void {
  for (const cap of BUSINESS_CONNECT_AI_CAPABILITIES) {
    const sources = allowedSourcesFor(cap);
    for (const s of sources) {
      if ((s as string) === "private_meeting_notes") {
        throw new Error(`[BC-9.0] private_meeting_notes reached capability allowlist: ${cap}`);
      }
    }
  }
}

/** Compatibility check between capability and requested scope shape. */
export function isScopeCompatible(
  capability: BusinessConnectAICapability,
  scope: IntelligenceScope,
): boolean {
  switch (capability) {
    case "relationship_briefing":
      return scope.type === "person" || scope.type === "organization";
    case "meeting_preparation":
      return scope.type === "meeting";
    case "introduction_draft":
      return scope.type === "introduction" || scope.type === "person";
    case "follow_up_draft":
      return scope.type === "meeting" || scope.type === "person";
    case "next_action_suggestion":
      return scope.type === "work_hub" || scope.type === "global_business_connect";
    case "opportunity_signal_summary":
      return (
        scope.type === "global_business_connect" ||
        scope.type === "person" ||
        scope.type === "organization"
      );
    case "network_query":
      return true; // network queries may span any scope
    case "work_hub_assistant":
      return scope.type === "work_hub" || scope.type === "global_business_connect";
  }
}

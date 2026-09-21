// BC-9.0 Turn B2 — Viewer-scoped safe fact loader.
//
// This module is the ONLY place in the intelligence runtime that talks to
// the domain projections. It reads through the AUTHENTICATED viewer's
// supabase client so RLS enforces scope end-to-end. Every source domain the
// registry exposes maps to a distinct projection view — projections that
// aren't yet published return empty and the loader honestly records the
// omission so the response surfaces a "insufficient data" limitation.
//
// This turn ships the LOADER SHAPE and viewer wiring. The concrete safe
// projection queries for each domain are added in a subsequent turn (they
// are additive — the runtime is production-safe today because the loader
// returns empty facts, the model produces low-confidence honest output,
// and every invariant test still passes).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { BusinessConnectAICapability } from "../registry";
import type { BusinessConnectSafeFact, IntelligenceScope, ViewerContext } from "../types";

export type LoadFactsInput = {
  supabase: SupabaseClient<Database>;
  viewer: ViewerContext;
  capability: BusinessConnectAICapability;
  scope: IntelligenceScope;
};

export type LoadFactsResult = {
  facts: readonly BusinessConnectSafeFact[];
  omissions: readonly string[];
  sourceVersions: Record<string, string>;
};

/**
 * Load safe facts for the given capability + scope. Currently returns an
 * empty set with a clear omission so the runtime, redactor, prompt fence,
 * tool loop and validators all execute end-to-end while the domain
 * projections are published in a follow-up turn.
 *
 * When projections land, this function grows one branch per capability that
 * reads from the safe view for each allowed source domain (relationship,
 * meeting, agenda, shared_notes, outcome, follow_up, work_hub_item, etc.)
 * — always through `input.supabase` so RLS enforces viewer scope.
 */
export async function loadBusinessConnectAIFacts(input: LoadFactsInput): Promise<LoadFactsResult> {
  void input; // viewer & supabase are wired; concrete queries are the next turn
  return {
    facts: [],
    omissions: [
      "Nguồn dữ liệu chi tiết cho năng lực này chưa được kích hoạt trong bản B2. Kết quả sẽ ở mức tin cậy thấp và không chứa fact cụ thể.",
    ],
    sourceVersions: {},
  };
}

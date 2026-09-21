// BC-3.1F — Abuse control service (server-invoked).
// Delegates the state-changing report action to the controlled SECURITY DEFINER
// RPC (gn_report_user), which enforces auth, self-report protection, and report
// rate limiting authoritatively in the database. Reads use RLS-scoped selects.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { GlobalNetworkError, toGlobalNetworkError } from "./errors";
import { requireGlobalNetworkUser } from "./identity";
import { withTelemetry } from "./telemetry";
import { GN_REPORT_CATEGORIES, type GnReportCategory, type ReportUserInput } from "./abuse.types";

type DB = SupabaseClient<Database>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(v: unknown): string {
  if (typeof v !== "string" || !UUID.test(v)) {
    throw new GlobalNetworkError("NETWORK_TARGET_NOT_FOUND");
  }
  return v;
}

function normalizeCategory(v: unknown): GnReportCategory {
  return GN_REPORT_CATEGORIES.includes(v as GnReportCategory) ? (v as GnReportCategory) : "other";
}

export const AbuseService = {
  /** Report another user for review. Rate limited server-side (max 5/hour). */
  async reportUser(
    supabase: DB,
    userId: string | null | undefined,
    input: ReportUserInput,
  ): Promise<{ reportId: string }> {
    await requireGlobalNetworkUser(supabase, userId);
    const reported = assertUuid(input?.reportedUserId);
    const category = normalizeCategory(input?.category);
    const details = typeof input?.details === "string" ? input.details.slice(0, 2000) : undefined;
    const connectionId =
      typeof input?.connectionId === "string" && UUID.test(input.connectionId)
        ? input.connectionId
        : undefined;

    return withTelemetry("block", reported, async () => {
      const { data, error } = await supabase.rpc("gn_report_user", {
        _reported_user_id: reported,
        _category: category,
        _details: details,
        _connection_id: connectionId,
      });
      if (error) throw toGlobalNetworkError(error);
      return { reportId: String(data) };
    });
  },
};

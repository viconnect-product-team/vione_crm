// BC-6.4 — Introduction Outcome Service (server-only).
// All mutations go through SECURITY DEFINER RPCs (intro_outcome_*).

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  IntroductionOutcomeError,
  INTRODUCTION_OUTCOME_MAX_NOTE,
  toIntroductionOutcomeError,
  type IntroductionOutcomeDTO,
  type IntroductionOutcomePageDTO,
  type IntroductionOutcomeSource,
  type IntroductionOutcomeStatus,
  type IntroductionOutcomeType,
  type ListOutcomesOptions,
  type MarkProgressedInput,
} from "./types";

interface OutcomeRow {
  id: string;
  introduction_delivery_id: string;
  introduction_request_id: string;
  requester_user_id: string;
  requester_person_node_id: string;
  intermediary_user_id: string;
  intermediary_person_node_id: string;
  target_user_id: string;
  target_person_node_id: string;
  status: IntroductionOutcomeStatus;
  outcome_type: IntroductionOutcomeType | null;
  outcome_source: IntroductionOutcomeSource | null;
  outcome_note: string | null;
  acknowledged_at: string | null;
  connection_observed_at: string | null;
  progressed_at: string | null;
  resolved_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

type DB = SupabaseClient<any>;

function toDTO(row: OutcomeRow, viewerUid: string | null): IntroductionOutcomeDTO {
  const canSeeNote = viewerUid === row.requester_user_id || viewerUid === row.intermediary_user_id;
  return {
    id: row.id,
    introductionDeliveryId: row.introduction_delivery_id,
    introductionRequestId: row.introduction_request_id,
    status: row.status,
    outcomeType: row.outcome_type,
    outcomeSource: row.outcome_source,
    requester: { personNodeId: row.requester_person_node_id },
    intermediary: { personNodeId: row.intermediary_person_node_id },
    target: { personNodeId: row.target_person_node_id },
    outcomeNote: canSeeNote && row.outcome_note ? row.outcome_note : undefined,
    acknowledgedAt: row.acknowledged_at,
    connectionObservedAt: row.connection_observed_at,
    progressedAt: row.progressed_at,
    resolvedAt: row.resolved_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class IntroductionOutcomeService {
  constructor(
    private readonly sb: DB,
    private readonly viewerUserId: string | null,
  ) {}

  private uid(): string {
    if (!this.viewerUserId) throw new IntroductionOutcomeError("INTRO_OUTCOME_FORBIDDEN");
    return this.viewerUserId;
  }

  private validateNote(note: string | undefined): string | undefined {
    if (note == null) return undefined;
    const trimmed = String(note).trim();
    if (!trimmed) return undefined;
    if (trimmed.length > INTRODUCTION_OUTCOME_MAX_NOTE)
      throw new IntroductionOutcomeError("INTRO_OUTCOME_NOTE_INVALID");
    if (/[<>]/.test(trimmed)) throw new IntroductionOutcomeError("INTRO_OUTCOME_NOTE_INVALID");
    return trimmed;
  }

  private async invokeRpc(
    name:
      | "intro_outcome_create_on_ack"
      | "intro_outcome_observe_connection"
      | "intro_outcome_mark_progressed"
      | "intro_outcome_mark_no_outcome"
      | "intro_outcome_expire",
    args: Record<string, unknown>,
  ): Promise<IntroductionOutcomeDTO> {
    const { data, error } = await (
      this.sb as unknown as {
        rpc: (
          n: string,
          a: Record<string, unknown>,
        ) => Promise<{ data: OutcomeRow | null; error: unknown }>;
      }
    ).rpc(name, args);
    if (error || !data) throw toIntroductionOutcomeError(error);
    return toDTO(data, this.viewerUserId);
  }

  /** System-only: create outcome on delivery acknowledgment. */
  createOnAcknowledged(deliveryId: string) {
    return this.invokeRpc("intro_outcome_create_on_ack", {
      p_delivery_id: deliveryId,
    });
  }

  /** System-only: attempt canonical connection observation. */
  observeConnection(outcomeId: string) {
    return this.invokeRpc("intro_outcome_observe_connection", {
      p_outcome_id: outcomeId,
    });
  }

  async markProgressed(input: MarkProgressedInput): Promise<IntroductionOutcomeDTO> {
    this.uid();
    const note = this.validateNote(input.note);
    return this.invokeRpc("intro_outcome_mark_progressed", {
      p_outcome_id: input.outcomeId,
      p_note: note ?? null,
    });
  }

  markNoOutcome(outcomeId: string) {
    this.uid();
    return this.invokeRpc("intro_outcome_mark_no_outcome", {
      p_outcome_id: outcomeId,
    });
  }

  /** System-only lazy expiry. */
  expireOutcome(outcomeId: string) {
    return this.invokeRpc("intro_outcome_expire", { p_outcome_id: outcomeId });
  }

  async getOutcome(id: string): Promise<IntroductionOutcomeDTO> {
    const { data, error } = await (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              maybeSingle: () => Promise<{ data: OutcomeRow | null; error: unknown }>;
            };
          };
        };
      }
    )
      .from("introduction_outcomes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw toIntroductionOutcomeError(error);
    if (!data) throw new IntroductionOutcomeError("INTRO_OUTCOME_NOT_FOUND");
    return toDTO(data, this.viewerUserId);
  }

  private async listBy(
    column: "requester_user_id" | "intermediary_user_id",
    opts: ListOutcomesOptions | undefined,
  ): Promise<IntroductionOutcomePageDTO> {
    const uid = this.uid();
    const limit = Math.min(Math.max(1, opts?.limit ?? 25), 100);
    const status = opts?.status ?? "all";

    let q = (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (c: string, v: string) => unknown;
          };
        };
      }
    )
      .from("introduction_outcomes")
      .select("*")
      .eq(column, uid) as unknown as {
      eq: (c: string, v: string) => typeof q;
      order: (
        c: string,
        o: { ascending: boolean },
      ) => {
        limit: (n: number) => Promise<{ data: OutcomeRow[] | null; error: unknown }>;
      };
    };

    if (status !== "all") q = q.eq("status", status);

    const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
    if (error) throw toIntroductionOutcomeError(error);
    return {
      items: (data ?? []).map((r: any) => toDTO(r, uid)),
      nextCursor: null,
    };
  }

  listRequesterOutcomes(opts?: ListOutcomesOptions) {
    return this.listBy("requester_user_id", opts);
  }
  listIntermediaryOutcomes(opts?: ListOutcomesOptions) {
    return this.listBy("intermediary_user_id", opts);
  }

  /** Intermediary impact aggregate (v1: simple counts). */
  async getIntermediaryImpact(): Promise<{
    delivered: number;
    acknowledged: number;
    connected: number;
    progressed: number;
    notConnected: number;
    expired: number;
    pending: number;
  }> {
    const uid = this.uid();
    const { data, error } = await (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => Promise<{
              data: Array<{
                status: string;
                outcome_type: string | null;
                acknowledged_at: string | null;
              }> | null;
              error: unknown;
            }>;
          };
        };
      }
    )
      .from("introduction_outcomes")
      .select("status, outcome_type, acknowledged_at")
      .eq("intermediary_user_id", uid);
    if (error) throw toIntroductionOutcomeError(error);
    const rows = data ?? [];
    let delivered = 0,
      acknowledged = 0,
      connected = 0,
      progressed = 0;
    let notConnected = 0,
      expired = 0,
      pending = 0;
    for (const r of rows) {
      delivered += 1;
      if (r.acknowledged_at) acknowledged += 1;
      if (r.status === "pending") pending += 1;
      if (r.outcome_type === "connected") connected += 1;
      else if (r.outcome_type === "progressed") progressed += 1;
      else if (r.outcome_type === "not_connected") notConnected += 1;
      else if (r.outcome_type === "closed_no_outcome") expired += 1;
    }
    return { delivered, acknowledged, connected, progressed, notConnected, expired, pending };
  }
}

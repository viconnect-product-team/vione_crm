// BC-6.3 — Introduction Delivery Service (server-only).
// Owns: auth actor, eligibility check, block recheck, DTO redaction. All
// mutations go through SECURITY DEFINER RPCs (intro_delivery_*).

import type { SupabaseClient } from "@supabase/supabase-js";
import { RelationshipGraphRepository } from "../../graph.repository.server";
import type { IntroductionPathSnapshot } from "../request/types";
import {
  IntroductionDeliveryError,
  INTRODUCTION_DELIVERY_MAX_NOTE,
  toIntroductionDeliveryError,
  type DeliverIntroductionInput,
  type IntroductionDeliveryDTO,
  type IntroductionDeliveryPageDTO,
  type IntroductionDeliveryStatus,
  type IntroductionDeliverySummaryDTO,
  type ListDeliveriesOptions,
  type PendingDeliveryItemDTO,
} from "./types";

interface DeliveryRow {
  id: string;
  introduction_request_id: string;
  requester_user_id: string;
  requester_person_node_id: string;
  intermediary_user_id: string;
  intermediary_person_node_id: string;
  target_user_id: string;
  target_person_node_id: string;
  status: IntroductionDeliveryStatus;
  delivery_note: string | null;
  delivery_snapshot: Record<string, unknown>;
  created_at: string;
  delivered_at: string | null;
  acknowledged_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
}

interface AcceptedRequestRow {
  id: string;
  requester_user_id: string;
  requester_person_node_id: string;
  intermediary_user_id: string;
  intermediary_person_node_id: string;
  target_person_node_id: string;
  path_id: string;
  introduction_version: string;
  strength_version: string;
  responded_at: string | null;
  updated_at: string;
  path_snapshot: IntroductionPathSnapshot;
}

type DB = SupabaseClient<any>;

function summaryFromSnapshot(
  snap: Record<string, unknown> | IntroductionPathSnapshot,
  introVer: string,
  strengthVer: string,
): IntroductionDeliverySummaryDTO {
  const s = (snap ?? {}) as Partial<IntroductionPathSnapshot>;
  return {
    pathId: (s.pathId as string) ?? "",
    depth: (s.depth ?? 2) as 2 | 3,
    confidence: (s.confidence ?? "medium") as IntroductionDeliverySummaryDTO["confidence"],
    reasonCodes: Array.isArray(s.reasonCodes)
      ? (s.reasonCodes as IntroductionDeliverySummaryDTO["reasonCodes"]).slice(0, 6)
      : [],
    introductionVersion: (s.introductionVersion as string) ?? introVer,
    strengthVersion: (s.strengthVersion as string) ?? strengthVer,
  };
}

function toDTO(row: DeliveryRow, viewerUid: string): IntroductionDeliveryDTO {
  const canSeeNote = viewerUid === row.intermediary_user_id || viewerUid === row.target_user_id;
  return {
    id: row.id,
    introductionRequestId: row.introduction_request_id,
    requester: { personNodeId: row.requester_person_node_id },
    intermediary: { personNodeId: row.intermediary_person_node_id },
    target: { personNodeId: row.target_person_node_id },
    status: row.status,
    deliveryNote: canSeeNote && row.delivery_note ? row.delivery_note : undefined,
    deliverySummary: summaryFromSnapshot(row.delivery_snapshot, "", ""),
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    acknowledgedAt: row.acknowledged_at,
    revokedAt: row.revoked_at,
    expiresAt: row.expires_at,
  };
}

export class IntroductionDeliveryService {
  private readonly repo: RelationshipGraphRepository;
  constructor(
    private readonly sb: DB,
    private readonly viewerUserId: string | null,
  ) {
    this.repo = new RelationshipGraphRepository(sb as never);
  }

  private uid(): string {
    if (!this.viewerUserId) throw new IntroductionDeliveryError("INTRO_DELIVERY_FORBIDDEN");
    return this.viewerUserId;
  }

  private validateNote(note: string | undefined): string | undefined {
    if (note == null) return undefined;
    const trimmed = String(note).trim();
    if (!trimmed) return undefined;
    if (trimmed.length > INTRODUCTION_DELIVERY_MAX_NOTE)
      throw new IntroductionDeliveryError("INTRO_DELIVERY_NOTE_INVALID");
    if (/[<>]/.test(trimmed)) throw new IntroductionDeliveryError("INTRO_DELIVERY_NOTE_INVALID");
    return trimmed;
  }

  private async loadBlockedPersonNodeIds(userId: string): Promise<Set<string>> {
    try {
      const { ConnectionService } = await import("@/lib/connection/service.server");
      return new Set(await ConnectionService.listBlockedPersonNodeIds(this.sb, userId));
    } catch {
      return new Set();
    }
  }

  async deliverIntroduction(input: DeliverIntroductionInput): Promise<IntroductionDeliveryDTO> {
    const uid = this.uid();
    const note = this.validateNote(input.deliveryNote);

    // Load accepted request scoped to actor as intermediary.
    const { data: reqRow, error: reqErr } = await (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              eq: (
                c: string,
                v: string,
              ) => {
                maybeSingle: () => Promise<{ data: AcceptedRequestRow | null; error: unknown }>;
              };
            };
          };
        };
      }
    )
      .from("introduction_requests")
      .select(
        "id, requester_user_id, requester_person_node_id, intermediary_user_id, intermediary_person_node_id, target_person_node_id, path_id, introduction_version, strength_version, responded_at, updated_at, path_snapshot",
      )
      .eq("id", input.introductionRequestId)
      .eq("intermediary_user_id", uid)
      .maybeSingle();
    if (reqErr) throw toIntroductionDeliveryError(reqErr);
    if (!reqRow) throw new IntroductionDeliveryError("INTRO_DELIVERY_REQUEST_NOT_ACCEPTED");

    // Block recheck: intermediary ↔ target, requester ↔ target.
    const blockedByIntermediary = await this.loadBlockedPersonNodeIds(uid);
    if (blockedByIntermediary.has(reqRow.target_person_node_id))
      throw new IntroductionDeliveryError("INTRO_DELIVERY_BLOCKED");
    const blockedByRequester = await this.loadBlockedPersonNodeIds(reqRow.requester_user_id);
    if (blockedByRequester.has(reqRow.target_person_node_id))
      throw new IntroductionDeliveryError("INTRO_DELIVERY_BLOCKED");

    // Verify target person still active.
    const targetNode = await this.repo.getNode(reqRow.target_person_node_id);
    if (!targetNode || targetNode.node_kind !== "person" || targetNode.status !== "active")
      throw new IntroductionDeliveryError("INTRO_DELIVERY_TARGET_UNAVAILABLE");

    const snapshot = {
      ...(reqRow.path_snapshot ?? {}),
      introductionRequestId: reqRow.id,
      requesterPersonNodeId: reqRow.requester_person_node_id,
      intermediaryPersonNodeId: reqRow.intermediary_person_node_id,
      targetPersonNodeId: reqRow.target_person_node_id,
      requestAcceptedAt: reqRow.responded_at ?? reqRow.updated_at,
      deliveredAt: new Date().toISOString(),
    };

    const { data, error } = await (
      this.sb as unknown as {
        rpc: (
          n: string,
          a: Record<string, unknown>,
        ) => Promise<{ data: DeliveryRow | null; error: unknown }>;
      }
    ).rpc("intro_delivery_deliver", {
      p_introduction_request_id: input.introductionRequestId,
      p_delivery_note: note ?? null,
      p_delivery_snapshot: snapshot,
      p_idempotency_key: input.idempotencyKey ?? null,
    });
    if (error || !data) throw toIntroductionDeliveryError(error);
    return toDTO(data, uid);
  }

  private async invokeLifecycle(
    name: "intro_delivery_acknowledge" | "intro_delivery_revoke",
    id: string,
  ): Promise<IntroductionDeliveryDTO> {
    const uid = this.uid();
    const { data, error } = await (
      this.sb as unknown as {
        rpc: (
          n: string,
          a: Record<string, unknown>,
        ) => Promise<{ data: DeliveryRow | null; error: unknown }>;
      }
    ).rpc(name, { p_id: id });
    if (error || !data) throw toIntroductionDeliveryError(error);
    return toDTO(data, uid);
  }

  acknowledgeDelivery(id: string) {
    return this.invokeLifecycle("intro_delivery_acknowledge", id);
  }
  revokeDelivery(id: string) {
    return this.invokeLifecycle("intro_delivery_revoke", id);
  }

  async getDelivery(id: string): Promise<IntroductionDeliveryDTO> {
    const uid = this.uid();
    const { data, error } = await (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              maybeSingle: () => Promise<{ data: DeliveryRow | null; error: unknown }>;
            };
          };
        };
      }
    )
      .from("introduction_deliveries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw toIntroductionDeliveryError(error);
    if (!data) throw new IntroductionDeliveryError("INTRO_DELIVERY_NOT_FOUND");
    return toDTO(data, uid);
  }

  private async listBy(
    column: "target_user_id" | "intermediary_user_id" | "requester_user_id",
    opts: ListDeliveriesOptions | undefined,
  ): Promise<IntroductionDeliveryPageDTO> {
    const uid = this.uid();
    const limit = Math.min(Math.max(1, opts?.limit ?? 25), 100);
    const status = opts?.status ?? "all";

    let q = (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              in: (c: string, v: string[]) => unknown;
              order: (
                c: string,
                o: { ascending: boolean },
              ) => {
                limit: (n: number) => Promise<{ data: DeliveryRow[] | null; error: unknown }>;
              };
            };
          };
        };
      }
    )
      .from("introduction_deliveries")
      .select("*")
      .eq(column, uid) as unknown as {
      in: (c: string, v: string[]) => typeof q;
      order: (
        c: string,
        o: { ascending: boolean },
      ) => {
        limit: (n: number) => Promise<{ data: DeliveryRow[] | null; error: unknown }>;
      };
    };

    if (status === "active") q = q.in("status", ["delivered"]);
    else if (status === "terminal") q = q.in("status", ["acknowledged", "revoked", "expired"]);

    const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
    if (error) throw toIntroductionDeliveryError(error);
    return {
      items: (data ?? []).map((r: any) => toDTO(r, uid)),
      nextCursor: null,
    };
  }

  listIncomingForTarget(opts?: ListDeliveriesOptions) {
    return this.listBy("target_user_id", opts);
  }
  listOutgoingForIntermediary(opts?: ListDeliveriesOptions) {
    return this.listBy("intermediary_user_id", opts);
  }
  listStatusForRequester(opts?: ListDeliveriesOptions) {
    return this.listBy("requester_user_id", opts);
  }

  /** Accepted requests owned by viewer as intermediary WITHOUT an active delivery. */
  async listPendingDeliveries(): Promise<PendingDeliveryItemDTO[]> {
    const uid = this.uid();
    const { data: reqs, error } = await (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              eq: (
                c: string,
                v: string,
              ) => {
                order: (
                  c: string,
                  o: { ascending: boolean },
                ) => {
                  limit: (
                    n: number,
                  ) => Promise<{ data: AcceptedRequestRow[] | null; error: unknown }>;
                };
              };
            };
          };
        };
      }
    )
      .from("introduction_requests")
      .select(
        "id, requester_user_id, requester_person_node_id, intermediary_user_id, intermediary_person_node_id, target_person_node_id, path_id, introduction_version, strength_version, responded_at, updated_at, path_snapshot",
      )
      .eq("intermediary_user_id", uid)
      .eq("status", "accepted")
      .order("responded_at", { ascending: false })
      .limit(100);
    if (error) throw toIntroductionDeliveryError(error);
    if (!reqs || reqs.length === 0) return [];

    const ids = reqs.map((r: any) => r.id);
    const { data: active } = await (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              in: (
                c: string,
                v: string[],
              ) => Promise<{
                data: Array<{ introduction_request_id: string }> | null;
                error: unknown;
              }>;
            };
          };
        };
      }
    )
      .from("introduction_deliveries")
      .select("introduction_request_id")
      .eq("status", "delivered")
      .in("introduction_request_id", ids);
    const activeSet = new Set((active ?? []).map((r: any) => r.introduction_request_id));
    return reqs
      .filter((r) => !activeSet.has(r.id))
      .map((r: any) => ({
        introductionRequestId: r.id,
        requester: { personNodeId: r.requester_person_node_id },
        intermediary: { personNodeId: r.intermediary_person_node_id },
        target: { personNodeId: r.target_person_node_id },
        selectedPath: summaryFromSnapshot(
          r.path_snapshot,
          r.introduction_version,
          r.strength_version,
        ),
        acceptedAt: r.responded_at ?? r.updated_at,
      }));
  }
}

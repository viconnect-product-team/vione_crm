// BC-6.2 — Introduction Request Service (server-only).
// Owns: auth actor, path revalidation, block-check, DTO redaction. All
// mutations go through SECURITY DEFINER RPCs — no direct table writes.

import type { SupabaseClient } from "@supabase/supabase-js";
import { SmartIntroductionService } from "../introduction.service.server";
import { RelationshipGraphRepository } from "../../graph.repository.server";
import { SMART_INTRODUCTION_VERSION } from "../types";
import { RELATIONSHIP_STRENGTH_VERSION } from "../../strength/types";
import {
  IntroductionRequestError,
  toIntroductionRequestError,
  INTRODUCTION_REQUEST_MAX_NOTE,
  type IntroductionPathSnapshot,
  type IntroductionRequestDTO,
  type IntroductionRequestPageDTO,
  type IntroductionRequestStatus,
  type ListRequestsOptions,
  type SelectedPathSummaryDTO,
  type SendIntroductionRequestInput,
} from "./types";

// Row shape from public.introduction_requests. Kept local because generated
// Supabase types may not be regenerated yet.
interface IRRow {
  id: string;
  requester_user_id: string;
  requester_person_node_id: string;
  intermediary_user_id: string;
  intermediary_person_node_id: string;
  target_person_node_id: string;
  path_id: string;
  introduction_version: string;
  strength_version: string;
  status: IntroductionRequestStatus;
  request_note: string | null;
  path_snapshot: IntroductionPathSnapshot;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  cancelled_at: string | null;
  expires_at: string | null;
}

type DB = SupabaseClient<any>;

function isPending(row: IRRow): boolean {
  return row.status === "pending";
}

function toDTO(row: IRRow, viewerUserId: string): IntroductionRequestDTO {
  const snap = row.path_snapshot ?? ({} as IntroductionPathSnapshot);
  const summary: SelectedPathSummaryDTO = {
    pathId: row.path_id,
    depth: (snap.depth ?? 2) as 2 | 3,
    confidence: snap.confidence ?? "medium",
    reasonCodes: Array.isArray(snap.reasonCodes) ? snap.reasonCodes.slice(0, 6) : [],
    introductionVersion: row.introduction_version,
    strengthVersion: row.strength_version,
  };
  const viewerIsParticipant =
    viewerUserId === row.requester_user_id || viewerUserId === row.intermediary_user_id;
  return {
    id: row.id,
    requester: { personNodeId: row.requester_person_node_id },
    intermediary: { personNodeId: row.intermediary_person_node_id },
    target: { personNodeId: row.target_person_node_id },
    status: row.status,
    requestNote: viewerIsParticipant && row.request_note ? row.request_note : undefined,
    selectedPath: summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at,
    cancelledAt: row.cancelled_at,
    expiresAt: row.expires_at,
  };
}

export class IntroductionRequestService {
  private readonly repo: RelationshipGraphRepository;
  constructor(
    private readonly sb: DB,
    private readonly viewerUserId: string | null,
  ) {
    this.repo = new RelationshipGraphRepository(sb as never);
  }

  private uid(): string {
    if (!this.viewerUserId) throw new IntroductionRequestError("INTRO_REQUEST_FORBIDDEN");
    return this.viewerUserId;
  }

  /** Resolve the user_id behind a Person graph node. Never leaks to client. */
  private async userIdFor(personNodeId: string): Promise<string | null> {
    const node = await this.repo.getNode(personNodeId);
    if (!node || node.node_kind !== "person") return null;
    if (node.external_ref_type !== "user_profile") return null;
    const ref = (node as { external_ref_id?: unknown }).external_ref_id;
    return typeof ref === "string" ? ref : null;
  }

  private validateNote(note: string | undefined): string | undefined {
    if (note == null) return undefined;
    const trimmed = String(note).trim();
    if (!trimmed) return undefined;
    if (trimmed.length > INTRODUCTION_REQUEST_MAX_NOTE)
      throw new IntroductionRequestError("INTRO_REQUEST_NOTE_INVALID");
    // Plain text only — reject obvious HTML/script attempts.
    if (/[<>]/.test(trimmed)) throw new IntroductionRequestError("INTRO_REQUEST_NOTE_INVALID");
    return trimmed;
  }

  async sendRequest(input: SendIntroductionRequestInput): Promise<IntroductionRequestDTO> {
    const uid = this.uid();
    const note = this.validateNote(input.requestNote);

    // 1. Resolve target + validate connectivity via BC-6.1 service (RLS-safe).
    const svc = new SmartIntroductionService(this.sb as never, uid);
    let page;
    try {
      page = await svc.findIntroductionPaths({
        targetPersonNodeId: input.targetPersonNodeId,
        maxDepth: 2,
        limit: 25,
      });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "TARGET_NOT_FOUND" || code === "INTRODUCTION_NOT_AVAILABLE")
        throw new IntroductionRequestError("INTRO_REQUEST_PATH_INVALID");
      throw new IntroductionRequestError("INTRO_REQUEST_INTERNAL_ERROR");
    }

    if (page.state === "TARGET_ALREADY_CONNECTED")
      throw new IntroductionRequestError("INTRO_REQUEST_TARGET_ALREADY_CONNECTED");
    if (page.state !== "OK" || page.items.length === 0)
      throw new IntroductionRequestError("INTRO_REQUEST_PATH_INVALID");

    // 2. Match requested path.
    const match = page.items.find((p) => p.pathId === input.pathId);
    if (!match) throw new IntroductionRequestError("INTRO_REQUEST_PATH_INVALID");

    // 3. 2-hop policy.
    if (match.depth !== 2) throw new IntroductionRequestError("INTRO_REQUEST_PATH_UNSUPPORTED");

    // 4. Extract primary intermediary FROM the validated path — never client.
    const primary = match.intermediaries[0];
    if (!primary?.personNodeId) throw new IntroductionRequestError("INTRO_REQUEST_PATH_INVALID");

    const intermediaryUserId = await this.userIdFor(primary.personNodeId);
    if (!intermediaryUserId)
      throw new IntroductionRequestError("INTRO_REQUEST_INTERMEDIARY_UNAVAILABLE");
    if (intermediaryUserId === uid)
      throw new IntroductionRequestError("INTRO_REQUEST_PATH_INVALID");

    // 5. Build immutable path snapshot.
    const snapshot: IntroductionPathSnapshot = {
      pathId: match.pathId,
      introductionVersion: match.introductionVersion,
      strengthVersion: match.strengthVersion,
      depth: match.depth,
      intermediaryNodeIds: match.intermediaries.map((i) => i.personNodeId),
      targetNodeId: match.target.personNodeId,
      confidence: match.confidence,
      reasonCodes: match.reasons.map((r: any) => r.code),
      generatedAt: match.generatedAt,
    };

    // 6. Persist via RPC (SECURITY DEFINER).
    const { data, error } = await (
      this.sb as unknown as {
        rpc: (
          name: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: IRRow | null; error: unknown }>;
      }
    ).rpc("intro_request_send", {
      p_intermediary_user_id: intermediaryUserId,
      p_intermediary_person_node_id: primary.personNodeId,
      p_target_person_node_id: input.targetPersonNodeId,
      p_path_id: match.pathId,
      p_introduction_version: match.introductionVersion ?? SMART_INTRODUCTION_VERSION,
      p_strength_version: match.strengthVersion ?? RELATIONSHIP_STRENGTH_VERSION,
      p_path_snapshot: snapshot,
      p_request_note: note ?? null,
      p_idempotency_key: input.idempotencyKey ?? null,
    });
    if (error || !data) throw toIntroductionRequestError(error);
    return toDTO(data, uid);
  }

  private async invokeLifecycleRPC(
    name: "intro_request_accept" | "intro_request_decline" | "intro_request_cancel",
    id: string,
  ): Promise<IntroductionRequestDTO> {
    const uid = this.uid();
    const { data, error } = await (
      this.sb as unknown as {
        rpc: (
          n: string,
          a: Record<string, unknown>,
        ) => Promise<{ data: IRRow | null; error: unknown }>;
      }
    ).rpc(name, { p_id: id });
    if (error || !data) throw toIntroductionRequestError(error);
    return toDTO(data, uid);
  }

  acceptRequest(id: string) {
    return this.invokeLifecycleRPC("intro_request_accept", id);
  }
  declineRequest(id: string) {
    return this.invokeLifecycleRPC("intro_request_decline", id);
  }
  cancelRequest(id: string) {
    return this.invokeLifecycleRPC("intro_request_cancel", id);
  }

  async getRequest(id: string): Promise<IntroductionRequestDTO> {
    const uid = this.uid();
    const { data, error } = await (
      this.sb as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string,
            ) => {
              maybeSingle: () => Promise<{ data: IRRow | null; error: unknown }>;
            };
          };
        };
      }
    )
      .from("introduction_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw toIntroductionRequestError(error);
    if (!data) throw new IntroductionRequestError("INTRO_REQUEST_NOT_FOUND");
    return toDTO(data, uid);
  }

  private async listBy(
    column: "requester_user_id" | "intermediary_user_id",
    opts: ListRequestsOptions | undefined,
  ): Promise<IntroductionRequestPageDTO> {
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
              in?: (c: string, v: string[]) => unknown;
              order: (
                c: string,
                o: { ascending: boolean },
              ) => {
                limit: (n: number) => Promise<{ data: IRRow[] | null; error: unknown }>;
              };
            };
          };
        };
      }
    )
      .from("introduction_requests")
      .select("*")
      .eq(column, uid) as unknown as {
      in: (c: string, v: string[]) => typeof q;
      order: (
        c: string,
        o: { ascending: boolean },
      ) => {
        limit: (n: number) => Promise<{ data: IRRow[] | null; error: unknown }>;
      };
    };
    if (status === "pending")
      q = (q as unknown as { in: (c: string, v: string[]) => typeof q }).in("status", ["pending"]);
    if (status === "terminal")
      q = (q as unknown as { in: (c: string, v: string[]) => typeof q }).in("status", [
        "accepted",
        "declined",
        "cancelled",
        "expired",
      ]);
    const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
    if (error) throw toIntroductionRequestError(error);
    return {
      items: (data ?? []).map((r: any) => toDTO(r, uid)),
      nextCursor: null,
    };
  }

  listIncoming(opts?: ListRequestsOptions) {
    return this.listBy("intermediary_user_id", opts);
  }
  listOutgoing(opts?: ListRequestsOptions) {
    return this.listBy("requester_user_id", opts);
  }
}

export function ircIsPendingRow(row: IRRow): boolean {
  return isPending(row);
}

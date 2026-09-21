// BC-Mobile-5E — Connection Handshake service tests.
//
// Contract coverage:
//  - pairState → viewer-relative DTO mapping (blocked → neutral unavailable;
//    terminal statuses → none; actionable states carry connectionId).
//  - Token → owner resolution is SERVER-side only: the owner id comes from
//    the privileged lookup, never from client input, and never leaves the
//    service boundary.
//  - Unknown/revoked tokens collapse to the neutral unavailable state and
//    never reach the connection domain (no oracle, no wasted RPC).
//  - Self handshakes short-circuit before the pair-state read.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: vi.fn() },
}));
vi.mock("@/lib/global-network/service", () => ({
  GlobalConnectionService: { getState: vi.fn(), sendRequest: vi.fn() },
}));

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { GlobalConnectionService } from "@/lib/global-network/service";
import {
  getIdentityConnectionState,
  pairStateToIdentityConnection,
  sendIdentityConnectionRequest,
} from "@/lib/business-connect/mobile/identity-connect.service";
import type { PairState } from "@/lib/global-network/types";

const TOKEN = "a".repeat(64);
const VIEWER = "11111111-1111-4111-8111-111111111111";
const OWNER = "22222222-2222-4222-8222-222222222222";
const supabase = {} as never;

/** Stub the two-step privileged lookup: active link → active identity. */
function mockAdminLookup(ownerUserId: string | null) {
  (supabaseAdmin.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    const maybeSingle = async () => ({
      data:
        table === "identity_share_links"
          ? ownerUserId
            ? { identity_id: "identity-1" }
            : null
          : ownerUserId
            ? { owner_user_id: ownerUserId }
            : null,
    });
    return {
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pairStateToIdentityConnection", () => {
  const base: PairState = {
    targetUserId: OWNER,
    status: "none",
    direction: "none",
    connectionId: null,
    blocked: false,
  };

  it("maps blocked pairs (either direction) to neutral unavailable", () => {
    expect(pairStateToIdentityConnection({ ...base, blocked: true })).toEqual({
      state: "unavailable",
      connectionId: null,
    });
  });

  it("maps self and accepted to non-actionable states", () => {
    expect(pairStateToIdentityConnection({ ...base, direction: "self" })).toEqual({
      state: "self",
      connectionId: null,
    });
    expect(pairStateToIdentityConnection({ ...base, status: "accepted" })).toEqual({
      state: "connected",
      connectionId: null,
    });
  });

  it("maps pending directions to actionable states carrying the connection id", () => {
    expect(
      pairStateToIdentityConnection({
        ...base,
        status: "pending",
        direction: "outgoing",
        connectionId: "c-1",
      }),
    ).toEqual({ state: "outgoing_pending", connectionId: "c-1" });
    expect(
      pairStateToIdentityConnection({
        ...base,
        status: "pending",
        direction: "incoming",
        connectionId: "c-2",
      }),
    ).toEqual({ state: "incoming_pending", connectionId: "c-2" });
  });

  it("maps terminal statuses and none to a fresh-request state", () => {
    for (const status of ["declined", "cancelled", "disconnected", "none"] as const) {
      expect(pairStateToIdentityConnection({ ...base, status }).state).toBe("none");
    }
  });
});

describe("getIdentityConnectionState", () => {
  it("returns neutral unavailable for unknown tokens WITHOUT touching the connection domain", async () => {
    mockAdminLookup(null);
    const result = await getIdentityConnectionState(supabase, VIEWER, TOKEN);
    expect(result).toEqual({ state: "unavailable", connectionId: null });
    expect(GlobalConnectionService.getState).not.toHaveBeenCalled();
  });

  it("short-circuits self before the pair-state read", async () => {
    mockAdminLookup(VIEWER);
    const result = await getIdentityConnectionState(supabase, VIEWER, TOKEN);
    expect(result).toEqual({ state: "self", connectionId: null });
    expect(GlobalConnectionService.getState).not.toHaveBeenCalled();
  });

  it("resolves the owner server-side and maps the delegated pair state", async () => {
    mockAdminLookup(OWNER);
    (GlobalConnectionService.getState as ReturnType<typeof vi.fn>).mockResolvedValue({
      targetUserId: OWNER,
      status: "pending",
      direction: "incoming",
      connectionId: "c-9",
      blocked: false,
    });
    const result = await getIdentityConnectionState(supabase, VIEWER, TOKEN);
    expect(GlobalConnectionService.getState).toHaveBeenCalledWith(supabase, VIEWER, OWNER);
    expect(result).toEqual({ state: "incoming_pending", connectionId: "c-9" });
    // The DTO never carries the owner id.
    expect(JSON.stringify(result)).not.toContain(OWNER);
  });
});

describe("sendIdentityConnectionRequest", () => {
  it("throws the neutral identity_unavailable for unknown tokens", async () => {
    mockAdminLookup(null);
    await expect(sendIdentityConnectionRequest(supabase, VIEWER, TOKEN)).rejects.toThrow(
      "identity_unavailable",
    );
    expect(GlobalConnectionService.sendRequest).not.toHaveBeenCalled();
  });

  it("targets the SERVER-resolved owner with a manual source and passes the mutation key", async () => {
    mockAdminLookup(OWNER);
    (GlobalConnectionService.sendRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      connectionId: "c-1",
      status: "pending",
      idempotent: false,
    });
    await sendIdentityConnectionRequest(supabase, VIEWER, TOKEN, "mk-12345678");
    expect(GlobalConnectionService.sendRequest).toHaveBeenCalledWith(supabase, VIEWER, {
      targetUserId: OWNER,
      source: { type: "manual" },
      mutationKey: "mk-12345678",
    });
  });
});

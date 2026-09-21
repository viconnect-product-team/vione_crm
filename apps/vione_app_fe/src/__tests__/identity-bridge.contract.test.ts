import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveActiveAssociationContext,
  resolveActiveMemberId,
  resolveAccountStatus,
  resolveBusinessCardOwnerContext,
} from "@/lib/identity/identity-bridge.server";
import { PlatformIdentitySDK } from "@/lib/identity/platform-identity-sdk";

// ---------------------------------------------------------------------------
// BC-1.2 — Identity Bridge contract + logic tests. Deterministic, no network.
// A minimal chainable Supabase stub drives the pure resolution logic.
// ---------------------------------------------------------------------------

type QResult = { data: unknown; error: null };

function makeSupabase(cfg: {
  rpc?: Record<string, unknown>;
  tables?: Record<string, unknown>; // keyed by table name -> maybeSingle/list payload
  lists?: Record<string, unknown[]>; // keyed by table name -> array result (no maybeSingle)
}) {
  const rpc = cfg.rpc ?? {};
  return {
    rpc: async (name: string): Promise<QResult> => ({
      data: name in rpc ? rpc[name] : null,
      error: null,
    }),
    from(table: string) {
      const builder: any = {
        _table: table,
        select() {
          return builder;
        },
        eq() {
          return builder;
        },
        async maybeSingle(): Promise<QResult> {
          return { data: cfg.tables?.[table] ?? null, error: null };
        },
        then(resolve: (r: QResult) => void) {
          // Awaiting the builder (list query) resolves to the array payload.
          resolve({ data: cfg.lists?.[table] ?? [], error: null });
        },
      };
      return builder;
    },
  } as any;
}

describe("BC-1.2 active association bridge", () => {
  it("1. user without member -> null active association context", async () => {
    const sb = makeSupabase({ rpc: { current_member_id: null, current_association_id: null } });
    const ctx = await resolveActiveAssociationContext(sb, "user-1");
    expect(ctx).toBeNull();
  });

  it("2. association member -> correct active context", async () => {
    const sb = makeSupabase({
      rpc: { current_member_id: "M-1", current_association_id: "assoc-1" },
      tables: { members: { status: "active" }, memberships: { role: "admin" } },
    });
    const ctx = await resolveActiveAssociationContext(sb, "user-1");
    expect(ctx).toEqual({
      userId: "user-1",
      memberId: "M-1",
      associationId: "assoc-1",
      memberStatus: "active",
      associationRole: "admin",
    });
  });

  it("resolveActiveMemberId returns null gracefully", async () => {
    const sb = makeSupabase({ rpc: { current_member_id: null } });
    expect(await resolveActiveMemberId(sb)).toBeNull();
  });
});

describe("BC-1.2 cross-association selection", () => {
  it("3. cross-association selection is rejected by the trusted RPC path", () => {
    // The bridge delegates to set_active_association, which RAISES for a
    // non-member. Contract: the fn surfaces that error rather than persisting.
    const fns = readFileSync(
      join(process.cwd(), "src/lib/identity/identity-bridge.functions.ts"),
      "utf8",
    );
    expect(fns).toContain("set_active_association");
    expect(fns).toMatch(/if \(error\) throw new Error\(error\.message\)/);
  });
});

describe("BC-1.2 account status separation", () => {
  it("4. platform account status is separate from member status", async () => {
    // suspended platform account, even though the member row is 'active'.
    const sb = makeSupabase({
      tables: { user_profiles: { account_status: "suspended" } },
    });
    const status = await resolveAccountStatus(sb, "user-1");
    expect(status).toBe("suspended");
  });

  it("defaults to active when no profile row exists", async () => {
    const sb = makeSupabase({});
    expect(await resolveAccountStatus(sb, "user-1")).toBe("active");
  });
});

describe("BC-1.2 card-owner bridge", () => {
  it("5. legacy card with unique members.user_id resolves owner", async () => {
    const sb = makeSupabase({
      tables: { member_business_cards: { id: "card-1", member_id: "M-1", association_id: "a-1" } },
      lists: { members: [{ user_id: "user-9" }] },
    });
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-1");
    expect(ctx).toEqual({
      cardId: "card-1",
      memberId: "M-1",
      associationId: "a-1",
      ownerUserId: "user-9",
      ownershipMode: "legacy_member",
    });
  });

  it("6. legacy card without linked user returns unresolved", async () => {
    const sb = makeSupabase({
      tables: { member_business_cards: { id: "card-2", member_id: "M-2", association_id: "a-1" } },
      lists: { members: [{ user_id: null }] },
    });
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-2");
    expect(ctx.ownershipMode).toBe("unresolved");
    expect(ctx.ownerUserId).toBeUndefined();
  });

  it("7. ambiguous ownership is never guessed", async () => {
    const sb = makeSupabase({
      tables: { member_business_cards: { id: "card-3", member_id: "M-3", association_id: "a-1" } },
      lists: { members: [{ user_id: "user-a" }, { user_id: "user-b" }] },
    });
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-3");
    expect(ctx.ownershipMode).toBe("unresolved");
    expect(ctx.ownerUserId).toBeUndefined();
  });

  it("missing card returns unresolved", async () => {
    const sb = makeSupabase({});
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-x");
    expect(ctx).toEqual({ cardId: "card-x", ownershipMode: "unresolved" });
  });
});

describe("BC-1.2 community placeholders", () => {
  it("8. community context returns empty without fabrication", async () => {
    expect(await PlatformIdentitySDK.getCommunityContexts()).toEqual([]);
    expect(await PlatformIdentitySDK.hasCommunity()).toBe(false);
  });
});

describe("BC-1.2 backward compatibility", () => {
  it("9. existing current_member_id() resolver is unchanged (still an rpc wrapper)", () => {
    const cm = readFileSync(join(process.cwd(), "src/lib/current-member.ts"), "utf8");
    expect(cm).toContain('supabase.rpc("current_member_id")');
    // Bridge does NOT redefine the frozen RPCs.
    const srv = readFileSync(
      join(process.cwd(), "src/lib/identity/identity-bridge.server.ts"),
      "utf8",
    );
    expect(srv).not.toMatch(/function\s+current_member_id/);
    expect(srv).not.toMatch(/function\s+current_association_id/);
  });

  it("10. my-pass behavior preserved: still derives member from current_member_id path", () => {
    const mp = readFileSync(
      join(process.cwd(), "src/lib/member-identity-pass/my-pass.functions.ts"),
      "utf8",
    );
    expect(mp).toContain("resolveMemberIdOrNull");
    // Graceful empty-pass path is retained.
    expect(mp).toContain("if (!memberId) return empty;");
  });

  it("SDK exposes the frozen BC-1.2 surface", () => {
    for (const m of [
      "getCurrentUser",
      "getProfile",
      "getAccountStatus",
      "isAccountActive",
      "getContexts",
      "getAssociationContexts",
      "getActiveAssociationContext",
      "hasAssociation",
      "getCommunityContexts",
      "hasCommunity",
      "resolveBusinessCardOwnerContext",
    ] as const) {
      expect(typeof (PlatformIdentitySDK as any)[m]).toBe("function");
    }
  });
});

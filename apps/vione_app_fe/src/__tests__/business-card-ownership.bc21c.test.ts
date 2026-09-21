import { describe, it, expect } from "vitest";
import {
  requireBusinessCardOwner,
  canManageBusinessCard,
  BC_AUTHZ_ERR,
} from "@/lib/business-card-authz";

// ---------------------------------------------------------------------------
// BC-2.1C — Owner-aware authorization helper.
// Verifies requireBusinessCardOwner() enforces the FROZEN ownership priority
// (owner_user_id → unique legacy member → deny) and never grants unresolved
// cards. Deterministic; a minimal chainable Supabase stub drives the logic.
// ---------------------------------------------------------------------------

type QResult = { data: unknown; error: null };

function makeSupabase(cfg: {
  tables?: Record<string, unknown>;
  lists?: Record<string, unknown[]>;
  currentMemberId?: string | null;
}) {
  return {
    async rpc(fn: string): Promise<QResult> {
      if (fn === "current_member_id") {
        return { data: cfg.currentMemberId ?? null, error: null };
      }
      return { data: null, error: null };
    },
    from(table: string) {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        async maybeSingle(): Promise<QResult> {
          return { data: cfg.tables?.[table] ?? null, error: null };
        },
        then(resolve: (r: QResult) => void) {
          resolve({ data: cfg.lists?.[table] ?? [], error: null });
        },
      };
      return builder;
    },
  } as any;
}

const card = (owner: string | null, member: string | null = null) => ({
  member_business_cards: {
    id: "card-1",
    member_id: member,
    association_id: member ? "a-1" : null,
    owner_user_id: owner,
  },
});

describe("BC-2.1C requireBusinessCardOwner", () => {
  it("global_user: owner_user_id === auth.uid() is authorized", async () => {
    const sb = makeSupabase({ tables: card("user-1") });
    const authz = await requireBusinessCardOwner(sb, "user-1", "card-1");
    expect(authz.ownershipMode).toBe("global_user");
    expect(authz.ownerUserId).toBe("user-1");
  });

  it("global_user: different user is forbidden", async () => {
    const sb = makeSupabase({ tables: card("user-1") });
    await expect(requireBusinessCardOwner(sb, "user-2", "card-1")).rejects.toThrow(
      BC_AUTHZ_ERR.FORBIDDEN,
    );
  });

  it("legacy_member: caller's resolved member matches card member", async () => {
    const sb = makeSupabase({
      tables: card(null, "M-1"),
      lists: { members: [{ user_id: "user-9" }] },
      currentMemberId: "M-1",
    });
    const authz = await requireBusinessCardOwner(sb, "user-9", "card-1");
    expect(authz.ownershipMode).toBe("legacy_member");
    expect(authz.memberId).toBe("M-1");
  });

  it("legacy_member: caller resolves to a different member -> forbidden", async () => {
    const sb = makeSupabase({
      tables: card(null, "M-1"),
      lists: { members: [{ user_id: "user-9" }] },
      currentMemberId: "M-2",
    });
    await expect(requireBusinessCardOwner(sb, "user-9", "card-1")).rejects.toThrow(
      BC_AUTHZ_ERR.FORBIDDEN,
    );
  });

  it("unresolved: unlinked member card is denied", async () => {
    const sb = makeSupabase({
      tables: card(null, "M-1"),
      lists: { members: [] },
      currentMemberId: "M-1",
    });
    await expect(requireBusinessCardOwner(sb, "user-9", "card-1")).rejects.toThrow(
      BC_AUTHZ_ERR.UNRESOLVED,
    );
  });

  it("unresolved: ambiguous member mapping is denied (never guessed)", async () => {
    const sb = makeSupabase({
      tables: card(null, "M-1"),
      lists: { members: [{ user_id: "u-a" }, { user_id: "u-b" }] },
      currentMemberId: "M-1",
    });
    await expect(requireBusinessCardOwner(sb, "u-a", "card-1")).rejects.toThrow(
      BC_AUTHZ_ERR.UNRESOLVED,
    );
  });

  it("missing card -> unresolved deny", async () => {
    const sb = makeSupabase({ tables: { member_business_cards: null } });
    await expect(requireBusinessCardOwner(sb, "user-1", "card-x")).rejects.toThrow(
      BC_AUTHZ_ERR.UNRESOLVED,
    );
  });

  it("explicit owner takes priority over a legacy member link", async () => {
    const sb = makeSupabase({
      tables: card("user-explicit", "M-1"),
      lists: { members: [{ user_id: "user-legacy" }] },
      currentMemberId: "M-1",
    });
    const authz = await requireBusinessCardOwner(sb, "user-explicit", "card-1");
    expect(authz.ownershipMode).toBe("global_user");
    // The legacy member link must not authorize the legacy user here.
    await expect(requireBusinessCardOwner(sb, "user-legacy", "card-1")).rejects.toThrow(
      BC_AUTHZ_ERR.FORBIDDEN,
    );
  });
});

describe("BC-2.1C canManageBusinessCard (non-throwing)", () => {
  it("returns authz for the owner", async () => {
    const sb = makeSupabase({ tables: card("user-1") });
    const authz = await canManageBusinessCard(sb, "user-1", "card-1");
    expect(authz?.ownershipMode).toBe("global_user");
  });

  it("returns null for a non-owner", async () => {
    const sb = makeSupabase({ tables: card("user-1") });
    expect(await canManageBusinessCard(sb, "user-2", "card-1")).toBeNull();
  });

  it("returns null for an unresolved card", async () => {
    const sb = makeSupabase({
      tables: card(null, "M-1"),
      lists: { members: [] },
      currentMemberId: "M-1",
    });
    expect(await canManageBusinessCard(sb, "user-9", "card-1")).toBeNull();
  });
});

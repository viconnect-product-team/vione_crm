import { describe, it, expect } from "vitest";
import { resolveBusinessCardOwnerContext } from "@/lib/identity/identity-bridge.server";

// ---------------------------------------------------------------------------
// BC-2.1A — Business Card Ownership Foundation.
// Verifies the additive owner_user_id resolver priority WITHOUT any cutover:
//   1. explicit owner_user_id -> "global_user"
//   2. unique legacy member   -> "legacy_member"
//   3. null / ambiguous       -> "unresolved"
// Deterministic, no network. A minimal chainable Supabase stub drives logic.
// ---------------------------------------------------------------------------

type QResult = { data: unknown; error: null };

function makeSupabase(cfg: {
  tables?: Record<string, unknown>;
  lists?: Record<string, unknown[]>;
}) {
  return {
    from(table: string) {
      const builder: any = {
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
          resolve({ data: cfg.lists?.[table] ?? [], error: null });
        },
      };
      return builder;
    },
  } as any;
}

describe("BC-2.1A owner resolver priority", () => {
  it("1. explicit owner_user_id wins -> global_user", async () => {
    const sb = makeSupabase({
      tables: {
        member_business_cards: {
          id: "card-1",
          member_id: "M-1",
          association_id: "a-1",
          owner_user_id: "user-explicit",
        },
      },
      // Even if a legacy member link exists, explicit ownership takes priority.
      lists: { members: [{ user_id: "user-legacy" }] },
    });
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-1");
    expect(ctx.ownershipMode).toBe("global_user");
    expect(ctx.ownerUserId).toBe("user-explicit");
  });

  it("2. legacy compatibility: no owner_user_id, unique member -> legacy_member", async () => {
    const sb = makeSupabase({
      tables: {
        member_business_cards: {
          id: "card-2",
          member_id: "M-2",
          association_id: "a-1",
          owner_user_id: null,
        },
      },
      lists: { members: [{ user_id: "user-9" }] },
    });
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-2");
    expect(ctx.ownershipMode).toBe("legacy_member");
    expect(ctx.ownerUserId).toBe("user-9");
  });

  it("3. unresolved: no owner_user_id, unlinked member", async () => {
    const sb = makeSupabase({
      tables: {
        member_business_cards: {
          id: "card-3",
          member_id: "M-3",
          association_id: "a-1",
          owner_user_id: null,
        },
      },
      lists: { members: [] },
    });
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-3");
    expect(ctx.ownershipMode).toBe("unresolved");
    expect(ctx.ownerUserId).toBeUndefined();
  });

  it("4. unresolved: ambiguous member mapping is never guessed", async () => {
    const sb = makeSupabase({
      tables: {
        member_business_cards: {
          id: "card-4",
          member_id: "M-4",
          association_id: "a-1",
          owner_user_id: null,
        },
      },
      lists: { members: [{ user_id: "u-a" }, { user_id: "u-b" }] },
    });
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-4");
    expect(ctx.ownershipMode).toBe("unresolved");
    expect(ctx.ownerUserId).toBeUndefined();
  });

  it("5. missing card -> unresolved (no throw)", async () => {
    const sb = makeSupabase({ tables: { member_business_cards: null } });
    const ctx = await resolveBusinessCardOwnerContext(sb, "card-missing");
    expect(ctx).toEqual({ cardId: "card-missing", ownershipMode: "unresolved" });
  });
});

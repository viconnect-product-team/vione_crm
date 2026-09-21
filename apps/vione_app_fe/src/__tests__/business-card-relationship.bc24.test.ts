import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapRowToSavedCard } from "@/lib/business-card/relationship.mappers";
import { RelationshipService } from "@/lib/business-card/relationship.service";
import { REL_ERR } from "@/lib/business-card/relationship.types";

// ---------------------------------------------------------------------------
// BC-2.4 — Saved Business Cards / Relationship foundation.
// Verifies mapper purity + service invariants (self-save, idempotency, source
// normalization, tag hygiene) without a live DB.
// ---------------------------------------------------------------------------

vi.mock("@/lib/business-card/relationship.repository", () => {
  const store: Record<string, Record<string, unknown>> = {};
  return {
    RelationshipRepository: {
      findByTarget: vi.fn(
        async (_s, owner: string, target: string) => store[`${owner}:${target}`] ?? null,
      ),
      insert: vi.fn(async (_s, row: Record<string, unknown>) => {
        const saved = {
          id: `edge-${Object.keys(store).length + 1}`,
          saved_at: "2025-01-01T00:00:00Z",
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
          first_met_at: null,
          met_at: null,
          reminder_at: null,
          target: null,
          ...row,
        };
        store[`${row.owner_user_id}:${row.target_card_id}`] = saved;
        return saved;
      }),
      deleteByTarget: vi.fn(async (_s, owner: string, target: string) => {
        const key = `${owner}:${target}`;
        if (store[key]) {
          delete store[key];
          return 1;
        }
        return 0;
      }),
      existsByTarget: vi.fn(async (_s, owner: string, target: string) =>
        Boolean(store[`${owner}:${target}`]),
      ),
      listByOwner: vi.fn(async () => Object.values(store)),
    },
    updateByTarget: vi.fn(
      async (_s, owner: string, target: string, patch: Record<string, unknown>) => {
        const key = `${owner}:${target}`;
        if (!store[key]) return null;
        store[key] = { ...store[key], ...patch };
        return store[key];
      },
    ),
  };
});

// Fake supabase: only member_business_cards SELECT is used by the service.
function fakeSupabase(target: { id: string; owner_user_id: string | null } | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: target, error: null }),
        }),
      }),
    }),
  } as never;
}

const OWNER = "user-owner";

describe("mapRowToSavedCard", () => {
  it("maps a row with a resolvable target", () => {
    const dto = mapRowToSavedCard({
      id: "e1",
      target_card_id: "card-1",
      saved_at: "2025-01-01T00:00:00Z",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      favorite: true,
      tags: ["vip"],
      notes: "met at expo",
      source: "qr",
      target: {
        id: "card-1",
        slug: "an",
        display_name: "An",
        status: "published",
        public_mode: "public",
      },
    });
    expect(dto.target.unavailable).toBe(false);
    expect(dto.target.displayName).toBe("An");
    expect(dto.favorite).toBe(true);
    expect(dto.source).toBe("qr");
  });

  it("flags unavailable when the target embed is null (RLS-hidden)", () => {
    const dto = mapRowToSavedCard({
      id: "e2",
      target_card_id: "card-x",
      saved_at: "t",
      created_at: "t",
      updated_at: "t",
      target: null,
    });
    expect(dto.target.unavailable).toBe(true);
    expect(dto.tags).toEqual([]);
    expect(dto.source).toBe("profile");
  });
});

describe("RelationshipService invariants", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects saving your own card", async () => {
    const sb = fakeSupabase({ id: "card-mine", owner_user_id: OWNER });
    await expect(
      RelationshipService.save(sb, OWNER, { targetCardId: "card-mine" }),
    ).rejects.toThrow(REL_ERR.SELF_SAVE);
  });

  it("rejects saving a non-resolvable target", async () => {
    const sb = fakeSupabase(null);
    await expect(RelationshipService.save(sb, OWNER, { targetCardId: "ghost" })).rejects.toThrow(
      REL_ERR.TARGET_NOT_FOUND,
    );
  });

  it("saves a valid target and is idempotent", async () => {
    const sb = fakeSupabase({ id: "card-other", owner_user_id: "someone-else" });
    const first = await RelationshipService.save(sb, OWNER, { targetCardId: "card-other" });
    const again = await RelationshipService.save(sb, OWNER, { targetCardId: "card-other" });
    expect(again.id).toBe(first.id);
    expect(await RelationshipService.exists(sb, OWNER, "card-other")).toBe(true);
  });

  it("normalizes an invalid source to 'profile'", async () => {
    const sb = fakeSupabase({ id: "card-src", owner_user_id: "x" });
    const dto = await RelationshipService.save(sb, OWNER, {
      targetCardId: "card-src",
      source: "hacked" as never,
    });
    expect(dto.source).toBe("profile");
  });

  it("cleans tags (trim, dedupe, cap) on save", async () => {
    const sb = fakeSupabase({ id: "card-tags", owner_user_id: "x" });
    const dto = await RelationshipService.save(sb, OWNER, {
      targetCardId: "card-tags",
      tags: ["  VIP ", "vip", "partner", "", "partner"],
    });
    expect(dto.tags).toEqual(["VIP", "partner"]);
  });

  it("removes an edge and reports removal", async () => {
    const sb = fakeSupabase({ id: "card-del", owner_user_id: "x" });
    await RelationshipService.save(sb, OWNER, { targetCardId: "card-del" });
    expect(await RelationshipService.unsave(sb, OWNER, "card-del")).toEqual({ removed: true });
    expect(await RelationshipService.unsave(sb, OWNER, "card-del")).toEqual({ removed: false });
  });

  it("throws NOT_FOUND when updating a non-existent edge", async () => {
    const sb = fakeSupabase({ id: "card-none", owner_user_id: "x" });
    await expect(RelationshipService.favorite(sb, OWNER, "card-none", true)).rejects.toThrow(
      REL_ERR.NOT_FOUND,
    );
  });
});

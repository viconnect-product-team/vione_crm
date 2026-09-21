import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// BC-2.1D — Business Card Platform Service Extraction.
// Verifies LeadService owns the lead/analytics business logic (projection,
// status-history + reply metadata composition, stats aggregation) while all
// persistence is delegated to the repository boundary. No live DB.
// ---------------------------------------------------------------------------

const memberId = "member-1";

vi.mock("@/lib/current-member", () => ({
  resolveMemberId: vi.fn(async () => memberId),
}));

const { leadRepo, cardRepo } = vi.hoisted(() => ({
  leadRepo: {
    listByOwnerMember: vi.fn(),
    findStatusMetaForOwner: vi.fn(),
    updateForOwner: vi.fn(async () => undefined),
    listStatusSince: vi.fn(),
    listInteractionsSince: vi.fn(),
  },
  cardRepo: { listCardIdsByMember: vi.fn(async () => ["card-1"]) },
}));
vi.mock("@/lib/business-card/lead.repository", () => ({ LeadRepository: leadRepo }));
vi.mock("@/lib/business-card/business-card.repository", () => ({
  BusinessCardRepository: cardRepo,
}));

import { LeadService } from "@/lib/business-card/lead.service";

const supabase = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  cardRepo.listCardIdsByMember.mockResolvedValue(["card-1"]);
});

describe("BC-2.1D LeadService.listMyLeads", () => {
  it("projects rows and parses history/replies from metadata", async () => {
    leadRepo.listByOwnerMember.mockResolvedValue([
      {
        id: "l1",
        card_id: "card-1",
        requester_name: "Ann",
        requester_email: null,
        requester_phone: null,
        message: "hi",
        lead_type: "contact",
        status: "new",
        preferred_time: null,
        created_at: "2025-05-01T00:00:00Z",
        updated_at: "2025-05-02T00:00:00Z",
        metadata: {
          history: [{ at: "2025-05-01T00:00:00Z", from: null, to: "new" }],
          replies: [{ at: "2025-05-02T00:00:00Z", channel: "email", body: "ok" }],
          junk: [{ nope: true }],
        },
        member_business_cards: { slug: "ann", display_name: "Ann Co" },
      },
    ]);
    const [lead] = await LeadService.listMyLeads(supabase);
    expect(lead.cardSlug).toBe("ann");
    expect(lead.cardName).toBe("Ann Co");
    expect(lead.history).toHaveLength(1);
    expect(lead.replies).toHaveLength(1);
    expect(lead.replies[0].channel).toBe("email");
  });
});

describe("BC-2.1D LeadService.updateStatus", () => {
  it("appends a history entry and persists via repository", async () => {
    leadRepo.findStatusMetaForOwner.mockResolvedValue({ status: "new", metadata: {} });
    const res = await LeadService.updateStatus(supabase, "l1", "read", "seen");
    expect(res.ok).toBe(true);
    const patch = (leadRepo.updateForOwner.mock.calls[0] as unknown[])[3] as Record<
      string,
      unknown
    >;
    expect(patch.status).toBe("read");
    const meta = patch.metadata as { history: { from: string; to: string; note: string }[] };
    expect(meta.history.at(-1)).toMatchObject({ from: "new", to: "read", note: "seen" });
  });

  it("rejects an invalid status", async () => {
    await expect(LeadService.updateStatus(supabase, "l1", "bogus" as never)).rejects.toThrow();
  });
});

describe("BC-2.1D LeadService.sendReply", () => {
  it("marks responded when requested and status permits", async () => {
    leadRepo.findStatusMetaForOwner.mockResolvedValue({ status: "new", metadata: {} });
    await LeadService.sendReply(supabase, {
      id: "l1",
      channel: "email",
      body: "hello",
      markResponded: true,
    });
    const patch = (leadRepo.updateForOwner.mock.calls[0] as unknown[])[3] as Record<
      string,
      unknown
    >;
    expect(patch.status).toBe("responded");
  });

  it("does not re-mark an already-responded lead", async () => {
    leadRepo.findStatusMetaForOwner.mockResolvedValue({ status: "responded", metadata: {} });
    await LeadService.sendReply(supabase, {
      id: "l1",
      channel: "note",
      body: "note",
      markResponded: true,
    });
    const patch = (leadRepo.updateForOwner.mock.calls[0] as unknown[])[3] as Record<
      string,
      unknown
    >;
    expect(patch.status).toBeUndefined();
  });
});

describe("BC-2.1D LeadService.getStats", () => {
  it("aggregates leads + interactions with a filled daily range", async () => {
    const today = new Date().toISOString().slice(0, 10);
    leadRepo.listStatusSince.mockResolvedValue([
      { status: "new", created_at: `${today}T01:00:00Z` },
      { status: "responded", created_at: `${today}T02:00:00Z` },
    ]);
    leadRepo.listInteractionsSince.mockResolvedValue([
      { interaction_type: "unique_view", created_at: `${today}T03:00:00Z` },
      { interaction_type: "share", created_at: `${today}T04:00:00Z` },
    ]);
    const stats = await LeadService.getStats(supabase, 7);
    expect(stats.rangeDays).toBe(7);
    expect(stats.daily).toHaveLength(7);
    expect(stats.totalLeads).toBe(2);
    expect(stats.totalInteractions).toBe(2);
    expect(stats.uniqueViews).toBe(1);
    expect(stats.respondedLeads).toBe(1);
    expect(stats.responseRate).toBeCloseTo(0.5);
    // interactions were scoped through the card repository, not a direct query.
    expect(cardRepo.listCardIdsByMember).toHaveBeenCalledWith(supabase, memberId);
  });

  it("skips interaction reads when the member owns no cards", async () => {
    cardRepo.listCardIdsByMember.mockResolvedValue([]);
    leadRepo.listStatusSince.mockResolvedValue([]);
    leadRepo.listInteractionsSince.mockResolvedValue([]);
    const stats = await LeadService.getStats(supabase, 30);
    expect(stats.totalInteractions).toBe(0);
    expect(leadRepo.listInteractionsSince).toHaveBeenCalledWith(supabase, [], expect.any(String));
  });
});

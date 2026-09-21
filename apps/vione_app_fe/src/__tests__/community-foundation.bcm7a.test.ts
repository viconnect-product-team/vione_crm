// BC-Mobile-7A — Community Foundation release-gate tests.
// Proves: DTO whitelists never leak private members fields or platform user
// ids; ordering/pagination/search normalization are deterministic; the
// connect policy is explicit-only; telemetry stays on the allowlist.

import { describe, expect, it, vi } from "vitest";
import {
  COMMUNITY_MEMBERS_PAGE_SIZE,
  canInitiateConnect,
  mapCommunityMemberProfile,
  mapCommunityMemberSummary,
  mapCommunitySummary,
  nextCommunityOffset,
  normalizeCommunityRole,
  normalizeCommunitySearch,
  sortCommunitySummaries,
  type CommunityCardRow,
  type CommunityMemberRow,
} from "@/lib/business-connect/mobile/community.service";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";
import type { CommunitySummaryDTO } from "@/lib/business-connect/mobile/community.types";

const VIEWER = "viewer-user-id";

/** A members row polluted with every private field the audit bans. */
const DIRTY_MEMBER: CommunityMemberRow = {
  id: "M-001",
  name: "Nguyễn Văn An",
  industry: "Công nghệ",
  region: "Hà Nội",
  user_id: "platform-user-xyz",
  email: "an@private.vn",
  phone: "+84900000000",
  contact: "Zalo: an.nguyen",
  address: "123 Private Street",
  tax_code: "0123456789",
  fee: 5000000,
  payment_status: "unpaid",
  level: "gold",
  notes: "internal admin note",
  card_url: "https://internal.example/card",
};

const PUBLIC_CARD: CommunityCardRow = {
  member_id: "M-001",
  avatar_url: "https://cdn.example/avatar.jpg",
  professional_title: "Giám đốc",
  company_name: "ViOne",
  headline: "Kết nối để phát triển",
  bio: "10 năm xây dựng hệ sinh thái.",
  website: "https://vione.example",
  slug: "vione-an",
  status: "published",
  visibility: "public",
};

describe("member DTO whitelist", () => {
  it("summary contains ONLY the allowlisted keys", () => {
    const dto = mapCommunityMemberSummary(DIRTY_MEMBER, PUBLIC_CARD, VIEWER);
    expect(Object.keys(dto).sort()).toEqual(
      [
        "avatarUrl",
        "companyName",
        "displayName",
        "hasPublicCard",
        "industryLabel",
        "isSelf",
        "jobTitle",
        "memberRef",
      ].sort(),
    );
  });

  it("summary never leaks private values or platform user ids", () => {
    const dto = mapCommunityMemberSummary(DIRTY_MEMBER, PUBLIC_CARD, VIEWER);
    const json = JSON.stringify(dto);
    for (const banned of [
      "an@private.vn",
      "+84900000000",
      "123 Private Street",
      "0123456789",
      "unpaid",
      "internal admin note",
      "platform-user-xyz",
      "user_id",
      "email",
      "phone",
      "tax_code",
      "payment_status",
    ]) {
      expect(json).not.toContain(banned);
    }
  });

  it("profile whitelist adds only narrative card fields, still no user id", () => {
    const dto = mapCommunityMemberProfile({
      row: DIRTY_MEMBER,
      card: PUBLIC_CARD,
      viewerUserId: VIEWER,
      communityName: "Hiệp hội Test",
      viewerRole: "member",
      connectionState: "none",
      connectionId: null,
    });
    expect(dto.headline).toBe("Kết nối để phát triển");
    expect(dto.bio).toContain("hệ sinh thái");
    expect(dto.website).toBe("https://vione.example");
    expect(dto.regionLabel).toBe("Hà Nội");
    const json = JSON.stringify(dto);
    expect(json).not.toContain("platform-user-xyz");
    expect(json).not.toContain("an@private.vn");
    expect(json).not.toContain("tax_code");
    expect(dto.hasPlatformIdentity).toBe(true);
    expect(dto.canConnect).toBe(true);
  });

  it("members without a public card still appear with base fields only", () => {
    const dto = mapCommunityMemberSummary(DIRTY_MEMBER, null, VIEWER);
    expect(dto.hasPublicCard).toBe(false);
    expect(dto.avatarUrl).toBeNull();
    expect(dto.jobTitle).toBeNull();
    expect(dto.displayName).toBe("Nguyễn Văn An");
    expect(dto.industryLabel).toBe("Công nghệ");
  });

  it("isSelf reflects the viewer, never the other way around", () => {
    expect(mapCommunityMemberSummary(DIRTY_MEMBER, null, "platform-user-xyz").isSelf).toBe(true);
    expect(mapCommunityMemberSummary(DIRTY_MEMBER, null, VIEWER).isSelf).toBe(false);
  });
});

describe("community summary + ordering", () => {
  const base: CommunitySummaryDTO = {
    communityId: "c1",
    name: "Beta",
    logoUrl: null,
    shortDescription: null,
    memberCount: 12,
    viewerRole: "member",
    isDefault: false,
  };

  it("maps membership + association with role normalization", () => {
    const dto = mapCommunitySummary(
      { association_id: "c1", role: "admin", is_default: true },
      { id: "c1", name: "Alpha", logo_url: null, tagline: "Tầm nhìn", about: "Mô tả" },
      42,
    );
    expect(dto.viewerRole).toBe("admin");
    expect(dto.isDefault).toBe(true);
    expect(dto.shortDescription).toBe("Tầm nhìn");
    expect(dto.memberCount).toBe(42);
  });

  it("normalizeCommunityRole only honors admin", () => {
    expect(normalizeCommunityRole("admin")).toBe("admin");
    expect(normalizeCommunityRole("owner")).toBe("member");
    expect(normalizeCommunityRole(null)).toBe("member");
  });

  it("default community first, then Vietnamese name order", () => {
    const sorted = sortCommunitySummaries([
      { ...base, communityId: "z", name: "An", isDefault: false },
      { ...base, communityId: "d", name: "Zulu", isDefault: true },
      { ...base, communityId: "a", name: "Bình", isDefault: false },
    ]);
    expect(sorted.map((c: any) => c.communityId)).toEqual(["d", "z", "a"]);
  });
});

describe("search normalization + pagination", () => {
  it("strips PostgREST-breaking characters and clamps length", () => {
    expect(normalizeCommunitySearch('  Nguyễn (An), "CEO". \\  ')).toBe("Nguyễn An CEO");
    expect(normalizeCommunitySearch("a".repeat(200))).toHaveLength(80);
    expect(normalizeCommunitySearch("   ")).toBe("");
  });

  it("offset pagination math is bounded and exact", () => {
    expect(nextCommunityOffset(25, 0, 100)).toBe(25);
    expect(nextCommunityOffset(25, 75, 100)).toBeNull();
    expect(nextCommunityOffset(10, 0, 10)).toBeNull();
    expect(COMMUNITY_MEMBERS_PAGE_SIZE).toBe(25);
  });
});

describe("connect policy (explicit, calm, never from lists)", () => {
  it("allows only: not self, platform identity present, pair state none", () => {
    expect(canInitiateConnect({ isSelf: false, hasPlatformIdentity: true, state: "none" })).toBe(
      true,
    );
    expect(canInitiateConnect({ isSelf: true, hasPlatformIdentity: true, state: "none" })).toBe(
      false,
    );
    expect(canInitiateConnect({ isSelf: false, hasPlatformIdentity: false, state: "none" })).toBe(
      false,
    );
    for (const state of [
      "outgoing_pending",
      "incoming_pending",
      "connected",
      "unavailable",
    ] as const) {
      expect(canInitiateConnect({ isSelf: false, hasPlatformIdentity: true, state })).toBe(false);
    }
  });
});

describe("telemetry allowlist (no PII, no ids)", () => {
  it("emits only allowlisted metrics", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    reportCommunityMetric("COMMUNITY_OPENED");
    reportCommunityMetric("COMMUNITY_CONNECT_SENT");
    // not on the allowlist — must be dropped
    reportCommunityMetric("COMMUNITY_OPENED:community-id-123" as never);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith("[bc-community] COMMUNITY_OPENED");
    spy.mockRestore();
  });
});

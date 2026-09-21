// BC-Mobile-7B — Community Events & Opportunities release-gate tests (pure).
//
// Proves: DTO whitelists never leak check-in credentials, attendee data,
// poster private contacts, tenant internals, or raw platform user ids;
// registration/interest viewer-state mapping is truthful; the canonical
// policies are explicit-only; the server adapter (source boundary) writes
// ONLY to the two canonical tables, reads never write, and touches zero
// cross-domain surfaces (connections, journeys, moments, notifications, AI).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  COMMUNITY_ACTIVITY_PREVIEW_LIMIT,
  COMMUNITY_EVENTS_PAGE_SIZE,
  COMMUNITY_OPP_SHORT_DESC_LEN,
  COMMUNITY_OPPORTUNITIES_PAGE_SIZE,
  canInitiateInterest,
  canInitiateRegistration,
  eventDateParts,
  isEventListableStatus,
  isEventRegistrationOpenStatus,
  isOpportunityActive,
  isRegistrationActive,
  mapCapacityState,
  mapCommunityEventSummary,
  mapCommunityOpportunityPreview,
  mapCommunityOpportunitySummary,
  mapRegistrationState,
  nextActivityOffset,
  normalizeActivitySearch,
  normalizeOpportunityCategory,
  opportunityDaysLeft,
  todayIsoDate,
  truncatePlain,
  type CommunityEventRow,
  type CommunityOpportunityRow,
} from "@/lib/business-connect/mobile/community-activity.service";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";

// ── Privacy fixtures ─────────────────────────────────────────────────────────

/** An events row polluted with every private field the audit bans. */
const DIRTY_EVENT: CommunityEventRow = {
  id: "evt-1",
  name: "CEO Networking Dinner",
  date: "2026-09-18",
  location: "InterContinental Hanoi",
  type: "dinner",
  status: "upcoming",
  capacity: 50,
  qr_fields: { secret: "CHECKIN-SECRET-QR" },
  checkin_credential: "CHK-SECRET-999",
  created_by: "raw-admin-user-id",
  tenant_internal_meta: "TENANT-META-XYZ",
  attendee_emails: ["guest@private.vn", "vip@private.vn"],
  attendee_phones: ["+84911111111"],
  internal_note: "do not publish",
};

/** An opportunities row polluted with poster private contact + internals. */
const DIRTY_OPP: CommunityOpportunityRow = {
  id: "opp-1",
  title: "Tìm đối tác triển khai ERP",
  description: "  Cần đối tác   triển khai ERP\ngiai đoạn 1.  ",
  type: "partnership",
  budget_min: 500_000_000,
  budget_max: 900_000_000,
  region: "Hà Nội",
  industry: "Công nghệ",
  deadline: "2026-09-30T00:00:00.000Z",
  status: "open",
  created_at: "2026-08-01T00:00:00.000Z",
  poster_id: "member-poster-1",
  poster_email: "poster@private.vn",
  poster_phone: "+84922222222",
  owner_user_id: "raw-poster-user-id",
  approval_meta: "APPROVAL-INTERNAL",
  tenant_note: "tenant only",
};

const NOW = Date.UTC(2026, 7, 10); // 2026-08-10 UTC

// ── Event DTO whitelist ──────────────────────────────────────────────────────

describe("event DTO whitelist (no check-in credential / attendee / internals)", () => {
  it("summary contains ONLY the allowlisted keys", () => {
    const dto = mapCommunityEventSummary(DIRTY_EVENT, {
      isRegistered: true,
      activeRegistrations: 3,
    });
    expect(Object.keys(dto).sort()).toEqual(
      [
        "capacityState",
        "eventRef",
        "formatLabel",
        "locationLabel",
        "registrationState",
        "startAt",
        "title",
      ].sort(),
    );
  });

  it("summary never leaks check-in credentials, attendee data, or tenant internals", () => {
    const dto = mapCommunityEventSummary(DIRTY_EVENT, {
      isRegistered: false,
      activeRegistrations: 0,
    });
    const json = JSON.stringify(dto);
    for (const banned of [
      "CHECKIN-SECRET-QR",
      "CHK-SECRET-999",
      "raw-admin-user-id",
      "TENANT-META-XYZ",
      "guest@private.vn",
      "vip@private.vn",
      "+84911111111",
      "do not publish",
      "qr_fields",
      "checkin",
      "attendee",
      "created_by",
    ]) {
      expect(json).not.toContain(banned);
    }
  });

  it("date passes through as date-only (no timezone fabrication)", () => {
    const dto = mapCommunityEventSummary(DIRTY_EVENT, {
      isRegistered: false,
      activeRegistrations: 0,
    });
    expect(dto.startAt).toBe("2026-09-18");
  });
});

// ── Registration viewer-state mapping ────────────────────────────────────────

describe("registration state is viewer-specific and truthful", () => {
  const base = { status: "upcoming", isFull: false };

  it("registered viewer sees 'registered', other viewer sees 'available'", () => {
    expect(mapRegistrationState({ ...base, isRegistered: true })).toBe("registered");
    expect(mapRegistrationState({ ...base, isRegistered: false })).toBe("available");
  });

  it("canonical terminal statuses win over viewer state", () => {
    expect(mapRegistrationState({ status: "cancelled", isRegistered: true, isFull: false })).toBe(
      "cancelled",
    );
    expect(mapRegistrationState({ status: "completed", isRegistered: true, isFull: false })).toBe(
      "closed",
    );
    expect(mapRegistrationState({ status: "ongoing", isRegistered: false, isFull: false })).toBe(
      "closed",
    );
  });

  it("full only when the viewer is NOT registered", () => {
    expect(mapRegistrationState({ ...base, isRegistered: false, isFull: true })).toBe("full");
    expect(mapRegistrationState({ ...base, isRegistered: true, isFull: true })).toBe("registered");
  });

  it("active registration = any status except 'cancelled'", () => {
    expect(isRegistrationActive("registered")).toBe(true);
    expect(isRegistrationActive("attended")).toBe(true);
    expect(isRegistrationActive("cancelled")).toBe(false);
    expect(isRegistrationActive(null)).toBe(true);
    expect(isRegistrationActive(undefined)).toBe(true);
  });

  it("capacity null when the canonical event has no capacity semantics", () => {
    expect(mapCapacityState(null, 10)).toBeNull();
    expect(mapCapacityState(0, 10)).toBeNull();
    expect(mapCapacityState(-5, 10)).toBeNull();
    expect(mapCapacityState(10, 10)).toBe("full");
    expect(mapCapacityState(10, 9)).toBe("open");
  });

  it("listable / open statuses follow the canonical sets", () => {
    expect(isEventListableStatus("upcoming")).toBe(true);
    expect(isEventListableStatus("ongoing")).toBe(true);
    expect(isEventListableStatus("completed")).toBe(false);
    expect(isEventListableStatus("cancelled")).toBe(false);
    expect(isEventRegistrationOpenStatus("upcoming")).toBe(true);
    expect(isEventRegistrationOpenStatus("ongoing")).toBe(false);
  });

  it("register CTA policy: available + member record + future/today only", () => {
    const ok = {
      registrationState: "available",
      hasMemberRecord: true,
      dateInFutureOrToday: true,
    } as const;
    expect(canInitiateRegistration(ok)).toBe(true);
    expect(canInitiateRegistration({ ...ok, registrationState: "registered" })).toBe(false);
    expect(canInitiateRegistration({ ...ok, registrationState: "full" })).toBe(false);
    expect(canInitiateRegistration({ ...ok, registrationState: "closed" })).toBe(false);
    expect(canInitiateRegistration({ ...ok, registrationState: "cancelled" })).toBe(false);
    expect(canInitiateRegistration({ ...ok, hasMemberRecord: false })).toBe(false);
    expect(canInitiateRegistration({ ...ok, dateInFutureOrToday: false })).toBe(false);
  });
});

// ── Opportunity DTO whitelist + viewer state ─────────────────────────────────

describe("opportunity DTO whitelist (no poster private contact / owner id)", () => {
  it("summary contains ONLY the allowlisted keys", () => {
    const dto = mapCommunityOpportunitySummary(DIRTY_OPP, {
      organizationLabel: "ViOne",
      interested: true,
      nowMs: NOW,
    });
    expect(Object.keys(dto).sort()).toEqual(
      [
        "categoryKey",
        "daysLeft",
        "expiresAt",
        "interested",
        "interestLevel",
        "opportunityRef",
        "organizationLabel",
        "publishedAt",
        "shortDescription",
        "title",
      ].sort(),
    );
  });

  it("preview contains ONLY the bounded preview keys", () => {
    const dto = mapCommunityOpportunityPreview(DIRTY_OPP, {
      organizationLabel: "ViOne",
      nowMs: NOW,
    });
    expect(Object.keys(dto).sort()).toEqual(
      ["categoryKey", "daysLeft", "opportunityRef", "organizationLabel", "title"].sort(),
    );
  });

  it("neither summary nor preview leaks poster contact, owner id, or internals", () => {
    const summary = mapCommunityOpportunitySummary(DIRTY_OPP, {
      organizationLabel: null,
      interested: false,
      nowMs: NOW,
    });
    const preview = mapCommunityOpportunityPreview(DIRTY_OPP, {
      organizationLabel: null,
      nowMs: NOW,
    });
    for (const dto of [summary, preview]) {
      const json = JSON.stringify(dto);
      for (const banned of [
        "poster@private.vn",
        "+84922222222",
        "raw-poster-user-id",
        "APPROVAL-INTERNAL",
        "tenant only",
        "member-poster-1",
        "email",
        "phone",
        "user_id",
      ]) {
        expect(json).not.toContain(banned);
      }
    }
  });

  it("interested flag is the viewer's own state, mapped verbatim", () => {
    const interested = mapCommunityOpportunitySummary(DIRTY_OPP, {
      organizationLabel: null,
      interested: true,
      nowMs: NOW,
    });
    const notInterested = mapCommunityOpportunitySummary(DIRTY_OPP, {
      organizationLabel: null,
      interested: false,
      nowMs: NOW,
    });
    expect(interested.interested).toBe(true);
    expect(notInterested.interested).toBe(false);
  });
});

describe("opportunity policy + derivation", () => {
  it("taxonomy: canonical types map, unknown types render NOTHING", () => {
    expect(normalizeOpportunityCategory("partnership")).toBe("opp.type.partnership");
    expect(normalizeOpportunityCategory("opp.type.supply")).toBe("opp.type.supply");
    expect(normalizeOpportunityCategory("crypto-scam")).toBeNull();
    expect(normalizeOpportunityCategory("")).toBeNull();
    expect(normalizeOpportunityCategory(null)).toBeNull();
  });

  it("daysLeft is UTC-safe, ceiled, clamped at 0, null when unknown", () => {
    expect(opportunityDaysLeft("2026-08-20T00:00:00.000Z", NOW)).toBe(10);
    expect(opportunityDaysLeft("2026-08-01T00:00:00.000Z", NOW)).toBe(0);
    expect(opportunityDaysLeft(null, NOW)).toBeNull();
    expect(opportunityDaysLeft("not-a-date", NOW)).toBeNull();
  });

  it("active = open + not past deadline", () => {
    expect(isOpportunityActive({ status: "open", deadline: "2026-09-01T00:00:00.000Z" }, NOW)).toBe(
      true,
    );
    expect(isOpportunityActive({ status: "open", deadline: null }, NOW)).toBe(true);
    expect(isOpportunityActive({ status: "open", deadline: "2026-07-01T00:00:00.000Z" }, NOW)).toBe(
      false,
    );
    expect(isOpportunityActive({ status: "closed", deadline: null }, NOW)).toBe(false);
    expect(isOpportunityActive({ status: "draft", deadline: null }, NOW)).toBe(false);
  });

  it("interest CTA policy: open + not expired + not own post + member + not already", () => {
    const ok = {
      status: "open",
      deadline: "2026-09-01T00:00:00.000Z",
      nowMs: NOW,
      isOwnPost: false,
      hasMemberRecord: true,
      alreadyInterested: false,
    };
    expect(canInitiateInterest(ok)).toBe(true);
    expect(canInitiateInterest({ ...ok, alreadyInterested: true })).toBe(false);
    expect(canInitiateInterest({ ...ok, isOwnPost: true })).toBe(false);
    expect(canInitiateInterest({ ...ok, hasMemberRecord: false })).toBe(false);
    expect(canInitiateInterest({ ...ok, status: "closed" })).toBe(false);
    expect(canInitiateInterest({ ...ok, deadline: "2026-07-01T00:00:00.000Z" })).toBe(false);
  });
});

// ── Shared helpers ───────────────────────────────────────────────────────────

describe("shared activity helpers", () => {
  it("preview/paging constants are bounded per spec", () => {
    expect(COMMUNITY_ACTIVITY_PREVIEW_LIMIT).toBe(2);
    expect(COMMUNITY_EVENTS_PAGE_SIZE).toBe(20);
    expect(COMMUNITY_OPPORTUNITIES_PAGE_SIZE).toBe(20);
    expect(COMMUNITY_OPP_SHORT_DESC_LEN).toBe(140);
  });

  it("eventDateParts parses WITHOUT Date() and rejects malformed input", () => {
    expect(eventDateParts("2026-09-18")).toEqual({ day: "18", month: 9 });
    expect(eventDateParts("2026-12-01T10:00:00Z")).toEqual({ day: "01", month: 12 });
    expect(eventDateParts("18/09/2026")).toBeNull();
    expect(eventDateParts("")).toBeNull();
  });

  it("todayIsoDate is a UTC date-only stamp", () => {
    expect(todayIsoDate(Date.UTC(2026, 7, 10, 23, 59))).toBe("2026-08-10");
  });

  it("truncatePlain collapses whitespace and clamps with ellipsis", () => {
    expect(truncatePlain("  a   b\nc  ", 10)).toBe("a b c");
    expect(truncatePlain("x".repeat(200), 140)).toHaveLength(140);
    expect(truncatePlain("   ", 10)).toBeNull();
    expect(truncatePlain(null, 10)).toBeNull();
  });

  it("search normalization strips PostgREST/ILIKE metacharacters", () => {
    expect(normalizeActivitySearch('  ERP (phase), "1". %* \\  ')).toBe("ERP phase 1");
    expect(normalizeActivitySearch("a".repeat(200))).toHaveLength(80);
    expect(normalizeActivitySearch("   ")).toBe("");
  });

  it("offset pagination math is bounded and exact", () => {
    expect(nextActivityOffset(20, 0, 45)).toBe(20);
    expect(nextActivityOffset(5, 40, 45)).toBeNull();
    expect(nextActivityOffset(20, 0, 20)).toBeNull();
  });
});

// ── Server adapter source boundary ───────────────────────────────────────────

const SERVER_SRC = readFileSync(
  join(process.cwd(), "src/lib/business-connect/mobile/community-activity.server.ts"),
  "utf8",
);
const SERVER_CODE = SERVER_SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

function functionBody(name: string): string {
  const start = SERVER_CODE.indexOf(`export async function ${name}`);
  expect(start).toBeGreaterThan(-1);
  const rest = SERVER_CODE.slice(start);
  const next = rest.indexOf("export async function", 10);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("server adapter boundary (source-audited)", () => {
  it("reads ONLY from whitelisted canonical tables", () => {
    const tables = [...SERVER_CODE.matchAll(/(?<!storage)\.from\("([^"]+)"/g)].map((m) => m[1]);
    expect(tables.length).toBeGreaterThan(0);
    for (const t of new Set(tables)) {
      expect([
        "memberships",
        "members",
        "events",
        "event_registrations",
        "associations",
        "opportunities",
        "opportunity_interests",
        "member_business_cards",
        // Nhắc hẹn liên hệ lại của CHÍNH người xem (RLS own-row), không phải
        // backend sự kiện/cơ hội song song.
        "community_opportunity_followups",
        // Nhật ký lịch sử own-row của chính người xem (append-only, RLS own-row).
        "community_opportunity_followup_events",
        // Đính kèm tệp/liên kết own-row của chính người xem (RLS own-row).
        "community_opportunity_followup_attachments",
      ]).toContain(t);
    }
  });

  it("writes ONLY to the two canonical tables (no parallel backend)", () => {
    const writes = [...SERVER_CODE.matchAll(/\.from\("([^"]+)"\)\.insert\(/g)].map((m) => m[1]);
    expect(writes.sort()).toEqual([
      "community_opportunity_followup_attachments",
      "community_opportunity_followup_events",
      "event_registrations",
      "opportunity_interests",
    ]);
    // Huỷ đăng ký là cập nhật trạng thái trên CHÍNH bảng canonical — không có
    // bảng/backend song song. Mọi update khác vẫn bị cấm.
    const updates = [...SERVER_CODE.matchAll(/\.from\("([^"]+)"\)\s*\.update\(/g)].map((m) => m[1]);
    // Cập nhật mức độ quan tâm ghi trên CHÍNH bảng canonical opportunity_interests.
    expect(updates.sort()).toEqual([
      "community_opportunity_followups",
      "event_registrations",
      "opportunity_interests",
    ]);
    expect(SERVER_CODE).toMatch(/status: "cancelled"/);
    // Upsert chỉ dùng cho bảng nhắc hẹn own-row (một nhắc hẹn mỗi cơ hội).
    const upserts = [...SERVER_CODE.matchAll(/\.from\("([^"]+)"\)\s*\.upsert\(/g)].map((m) => m[1]);
    expect(new Set(upserts)).toEqual(new Set(["community_opportunity_followups"]));
    // Bỏ quan tâm = gỡ chính bản ghi quan tâm của người xem trên bảng canonical.
    const deletes = [...SERVER_CODE.matchAll(/\.from\("([^"]+)"\)\s*\.delete\(/g)].map((m) => m[1]);
    expect(deletes.sort()).toEqual([
      "community_opportunity_followup_attachments",
      "opportunity_interests",
    ]);
    expect(SERVER_CODE).not.toMatch(/\.rpc\(/);
  });

  it("no-write-on-read: every read path is mutation-free", () => {
    for (const readFn of [
      "listCommunityEvents",
      "getCommunityEventDetail",
      "listCommunityOpportunities",
      "getCommunityOpportunityDetail",
      "getCommunityActivityPreview",
    ]) {
      const body = functionBody(readFn);
      expect(body).not.toMatch(/\.insert\(/);
      expect(body).not.toMatch(/\.update\(/);
      expect(body).not.toMatch(/\.upsert\(/);
      expect(body).not.toMatch(/\.delete\(/);
      expect(body).not.toMatch(/\.rpc\(/);
    }
  });

  it("SELECT whitelists are pinned (no qr/check-in/creator columns)", () => {
    expect(SERVER_CODE).toContain('"id, name, date, location, type, status, capacity"');
    expect(SERVER_CODE).toContain('"id, code, name, email, phone"');
    expect(SERVER_CODE).toContain('"member_id, company_name"');
    expect(SERVER_CODE).not.toMatch(/select\([^)]*qr/i);
    expect(SERVER_CODE).not.toContain("checkin_credential");
  });

  it("poster projection is opaque: id + name only, never email/phone/user id", () => {
    expect(SERVER_CODE).toContain('.select("id, name")');
    expect(SERVER_CODE).toContain("{ memberRef: posterData.id, displayName: posterData.name }");
    expect(SERVER_CODE).not.toContain("posterData.email");
    expect(SERVER_CODE).not.toContain("posterData.phone");
    expect(SERVER_CODE).not.toContain("posterData.user_id");
  });

  it("network boundary: zero cross-domain surfaces (connections/journeys/moments/notifications)", () => {
    for (const banned of [
      "user_connections",
      "guest_contacts",
      "graph_edges",
      "graph_nodes",
      "journey",
      "moment",
      "notification",
      "rel_intel",
      "recommendation",
    ]) {
      expect(SERVER_CODE).not.toContain(banned);
    }
  });

  it("AI boundary: zero LLM calls", () => {
    for (const banned of ["ai-provider", "openai", "generateText", "streamText", "llm"]) {
      expect(SERVER_CODE).not.toContain(banned);
    }
  });
});

// ── Telemetry allowlist (7B metrics) ─────────────────────────────────────────

describe("telemetry allowlist (no PII, no refs)", () => {
  it("emits only allowlisted 7B activity metrics", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    reportCommunityMetric("COMMUNITY_EVENTS_OPENED");
    reportCommunityMetric("COMMUNITY_EVENT_REGISTERED");
    reportCommunityMetric("COMMUNITY_OPPORTUNITY_ACTION_SELECTED");
    // suffixed with refs/ids — must be dropped
    reportCommunityMetric("COMMUNITY_EVENT_OPENED:evt-1" as never);
    reportCommunityMetric("COMMUNITY_OPPORTUNITY_OPENED:opp-1" as never);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith("[bc-community] COMMUNITY_EVENT_REGISTERED");
    spy.mockRestore();
  });
});

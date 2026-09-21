// BC-7.10 Turn A — Pure agenda policy tests.
import { describe, it, expect } from "vitest";
import {
  canDeleteAgendaItem,
  canManageAgenda,
  canReadAgenda,
  canTransitionAgendaItem,
  deriveAgendaPermissions,
  isAgendaMeetingStateEligible,
  normalizeAgendaDescription,
  normalizeAgendaTitle,
  normalizeEstimatedMinutes,
} from "@/lib/meeting/collaboration/agenda-policy";
import {
  isAllowedAgendaTransition,
  isKnownAgendaStatus,
} from "@/lib/meeting/collaboration/registry";

const organizerCtx = (overrides: Partial<Parameters<typeof canManageAgenda>[0]> = {}) => ({
  viewerUserId: "u1",
  organizerUserId: "u1",
  isParticipant: true,
  meetingStatus: "confirmed" as const,
  ...overrides,
});

describe("agenda registry — transitions", () => {
  it("allows planned → in_discussion|discussed|skipped", () => {
    expect(isAllowedAgendaTransition("planned", "in_discussion")).toBe(true);
    expect(isAllowedAgendaTransition("planned", "discussed")).toBe(true);
    expect(isAllowedAgendaTransition("planned", "skipped")).toBe(true);
  });
  it("allows in_discussion → discussed|skipped only", () => {
    expect(isAllowedAgendaTransition("in_discussion", "discussed")).toBe(true);
    expect(isAllowedAgendaTransition("in_discussion", "skipped")).toBe(true);
    expect(isAllowedAgendaTransition("in_discussion", "planned")).toBe(false);
  });
  it("treats discussed and skipped as terminal", () => {
    expect(isAllowedAgendaTransition("discussed", "in_discussion")).toBe(false);
    expect(isAllowedAgendaTransition("skipped", "in_discussion")).toBe(false);
    expect(isAllowedAgendaTransition("discussed", "skipped")).toBe(false);
  });
  it("guards unknown status strings", () => {
    expect(isKnownAgendaStatus("planned")).toBe(true);
    expect(isKnownAgendaStatus("frozen")).toBe(false);
  });
});

describe("agenda authority", () => {
  it("only organizer can manage; participants and strangers cannot", () => {
    expect(canManageAgenda(organizerCtx())).toBe(true);
    expect(canManageAgenda(organizerCtx({ viewerUserId: "u2", isParticipant: true }))).toBe(false);
    expect(canManageAgenda(organizerCtx({ viewerUserId: "u3", isParticipant: false }))).toBe(false);
  });
  it("blocks management when meeting is cancelled", () => {
    expect(canManageAgenda(organizerCtx({ meetingStatus: "cancelled" }))).toBe(false);
    expect(isAgendaMeetingStateEligible("cancelled")).toBe(false);
    expect(isAgendaMeetingStateEligible("in_progress")).toBe(true);
  });
  it("participants and organizer can read; strangers cannot", () => {
    expect(canReadAgenda(organizerCtx())).toBe(true);
    expect(canReadAgenda(organizerCtx({ viewerUserId: "u2", isParticipant: true }))).toBe(true);
    expect(canReadAgenda(organizerCtx({ viewerUserId: "u2", isParticipant: false }))).toBe(false);
  });
  it("delete allowed only for planned items and only for organizer", () => {
    const ctx = organizerCtx();
    expect(canDeleteAgendaItem(ctx, { status: "planned" })).toBe(true);
    expect(canDeleteAgendaItem(ctx, { status: "in_discussion" })).toBe(false);
    expect(canDeleteAgendaItem(ctx, { status: "discussed" })).toBe(false);
    const participant = organizerCtx({ viewerUserId: "u2" });
    expect(canDeleteAgendaItem(participant, { status: "planned" })).toBe(false);
  });
  it("canTransition combines authority and registry rules", () => {
    const ctx = organizerCtx();
    expect(canTransitionAgendaItem(ctx, "planned", "discussed")).toBe(true);
    expect(canTransitionAgendaItem(ctx, "discussed", "planned")).toBe(false);
    const participant = organizerCtx({ viewerUserId: "u2" });
    expect(canTransitionAgendaItem(participant, "planned", "discussed")).toBe(false);
  });
  it("derives full permission bundle", () => {
    const p = deriveAgendaPermissions(organizerCtx());
    expect(p).toEqual({ canCreate: true, canReorder: true, canManage: true, canRead: true });
    const p2 = deriveAgendaPermissions(organizerCtx({ viewerUserId: "u2", isParticipant: true }));
    expect(p2).toEqual({ canCreate: false, canReorder: false, canManage: false, canRead: true });
  });
});

describe("agenda input normalization", () => {
  it("trims and enforces title length", () => {
    expect(normalizeAgendaTitle("  hi  ")).toBe("hi");
    expect(() => normalizeAgendaTitle("")).toThrow("MEETING_COLLABORATION_VALIDATION");
    expect(() => normalizeAgendaTitle("x".repeat(241))).toThrow("MEETING_COLLABORATION_VALIDATION");
  });
  it("normalizes description: null on empty, throws on overflow", () => {
    expect(normalizeAgendaDescription(null)).toBeNull();
    expect(normalizeAgendaDescription("   ")).toBeNull();
    expect(normalizeAgendaDescription("ok")).toBe("ok");
    expect(() => normalizeAgendaDescription("x".repeat(2001))).toThrow(
      "MEETING_COLLABORATION_VALIDATION",
    );
  });
  it("validates estimated minutes", () => {
    expect(normalizeEstimatedMinutes(null)).toBeNull();
    expect(normalizeEstimatedMinutes(30)).toBe(30);
    expect(() => normalizeEstimatedMinutes(-1)).toThrow("MEETING_COLLABORATION_VALIDATION");
    expect(() => normalizeEstimatedMinutes(24 * 60 + 1)).toThrow(
      "MEETING_COLLABORATION_VALIDATION",
    );
    expect(() => normalizeEstimatedMinutes(1.5)).toThrow("MEETING_COLLABORATION_VALIDATION");
  });
});

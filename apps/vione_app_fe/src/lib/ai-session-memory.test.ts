import { describe, it, expect, beforeEach } from "vitest";
import {
  emptyMemory,
  sanitizeMemory,
  saveMemory,
  loadMemory,
  clearMemory,
  MEMORY_CAPS,
  type AiSessionMemory,
} from "@/lib/ai-session-memory";
import { resolveFollowUpContext } from "@/lib/ai-context-resolver";

function seedMemory(over: Partial<AiSessionMemory> = {}): AiSessionMemory {
  return { ...emptyMemory("assoc-1"), ...over };
}

describe("ai-session-memory", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") window.sessionStorage.clear();
  });

  it("caps arrays at max size", () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      id: `e${i}`,
      label: `Entity ${i}`,
      kind: "member" as const,
    }));
    const mem = seedMemory({ recentEntities: many });
    const safe = sanitizeMemory(mem);
    expect(safe.recentEntities.length).toBe(MEMORY_CAPS.recentEntities);
  });

  it("clamps long text values", () => {
    const long = "x".repeat(1000);
    const safe = sanitizeMemory(seedMemory({ lastUserIntent: long }));
    expect(safe.lastUserIntent!.length).toBeLessThanOrEqual(MEMORY_CAPS.textLength + 1);
  });

  it("clear memory returns empty state", () => {
    saveMemory(seedMemory({ recentEntities: [{ id: "a", label: "A", kind: "member" }] }));
    const cleared = clearMemory("assoc-1");
    expect(cleared.recentEntities).toEqual([]);
    expect(cleared.recentResults).toEqual([]);
    expect(cleared.activeCapability).toBeNull();
  });

  it("association switch clears memory (mismatch returns fresh)", () => {
    saveMemory(seedMemory({ recentEntities: [{ id: "a", label: "A", kind: "member" }] }));
    const loaded = loadMemory("assoc-2");
    expect(loaded.recentEntities).toEqual([]);
    expect(loaded.associationId).toBe("assoc-2");
  });
});

describe("resolveFollowUpContext", () => {
  const base = seedMemory({
    activeCapability: "member",
    lastCapability: "member",
    recentEntities: [
      { id: "m1", label: "Cty Logistics A", kind: "member" },
      { id: "m2", label: "Cty Logistics B", kind: "member" },
    ],
  });

  it("resolves 'họ' to prior context", () => {
    const r = resolveFollowUpContext("Viết thông báo mời họ tham gia", base);
    expect(r.isFollowUp).toBe(true);
    expect(r.resolvedCapability).toBe("member");
    expect(r.resolvedEntities).toEqual(["m1", "m2"]);
    expect(r.clarificationNeeded).toBe(false);
  });

  it("resolves 'nhóm này'", () => {
    const r = resolveFollowUpContext("Xuất danh sách nhóm này", base);
    expect(r.isFollowUp).toBe(true);
    expect(r.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("detects 'ở Hà Nội' as a region filter", () => {
    const r = resolveFollowUpContext("Ai ở Hà Nội?", base);
    expect(r.isFollowUp).toBe(true);
    expect(r.resolvedFilters.some((f) => f.label === "Hà Nội")).toBe(true);
  });

  it("resolves 'tài liệu trên'", () => {
    const docMem = seedMemory({
      activeCapability: "document",
      recentSources: [{ id: "d1", title: "Quy chế", capability: "document" }],
    });
    const r = resolveFollowUpContext("Tóm tắt tài liệu trên", docMem);
    expect(r.isFollowUp).toBe(true);
    expect(r.resolvedSourceIds).toEqual(["d1"]);
  });

  it("flags low confidence when no prior context exists", () => {
    const empty = seedMemory();
    const r = resolveFollowUpContext("Viết thông báo mời họ tham gia", empty);
    expect(r.isFollowUp).toBe(true);
    expect(r.clarificationNeeded).toBe(true);
    expect(r.confidence).toBeLessThan(0.5);
  });

  it("is not a follow-up for a fresh standalone question", () => {
    const r = resolveFollowUpContext("Tìm hội viên ngành logistics", base);
    expect(r.isFollowUp).toBe(false);
    expect(r.clarificationNeeded).toBe(false);
  });
});

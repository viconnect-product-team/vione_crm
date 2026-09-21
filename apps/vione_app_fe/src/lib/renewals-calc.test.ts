import { describe, it, expect } from "vitest";
import { addOneYear, daysBetween, toRecord, mapMember } from "@/lib/renewals-calc";

describe("addOneYear", () => {
  it("cộng 1 năm cho ngày thường, không đổi hành vi", () => {
    const r = addOneYear(new Date("2027-06-15T00:00:00Z"));
    expect(r.toISOString().slice(0, 10)).toBe("2028-06-15");
  });

  it("29/2 năm nhuận → 28/2 năm đích (không rollover sang 01/3)", () => {
    const r = addOneYear(new Date("2028-02-29T00:00:00Z"));
    expect(r.toISOString().slice(0, 10)).toBe("2029-02-28");
  });

  it("24 → 25 cũng lùi về 28/2", () => {
    const r = addOneYear(new Date("2024-02-29T00:00:00Z"));
    expect(r.toISOString().slice(0, 10)).toBe("2025-02-28");
  });
});

describe("daysBetween", () => {
  it("tính số ngày dương tới ngày tương lai", () => {
    const from = new Date("2027-01-01T00:00:00Z");
    expect(daysBetween(from, "2027-01-11")).toBe(10);
  });

  it("trả số âm khi ngày đích đã qua", () => {
    const from = new Date("2027-01-11T00:00:00Z");
    expect(daysBetween(from, "2027-01-01")).toBe(-10);
  });

  it("bằng 0 khi cùng ngày", () => {
    const from = new Date("2027-01-01T00:00:00Z");
    expect(daysBetween(from, "2027-01-01")).toBe(0);
  });
});

const baseRow = () => ({
  id: "m1",
  code: "HV001",
  name: "Cty A",
  type: "company",
  level: "gold",
  industry: "tech",
  region: "north",
  status: "active",
  joined_at: "2020-01-01",
  fee_year: 2027,
  fee_paid: true,
});

describe("toRecord", () => {
  it("status = renewed khi có renewed_at", () => {
    const rec = toRecord({ ...baseRow(), term_end: "2999-01-01", renewed_at: "2027-01-01" });
    expect(rec.status).toBe("renewed");
    expect(rec.id).toBe("RNW-HV001");
  });

  it("status = overdue khi term_end đã qua", () => {
    const rec = toRecord({ ...baseRow(), term_end: "2000-01-01" });
    expect(rec.status).toBe("overdue");
    expect(rec.daysLeft).toBeLessThan(0);
  });

  it("status = upcoming khi còn xa (>30 ngày)", () => {
    const rec = toRecord({ ...baseRow(), term_end: "2999-01-01" });
    expect(rec.status).toBe("upcoming");
  });
});

describe("mapMember", () => {
  it("map các field nhận null/undefined về default an toàn", () => {
    const m = mapMember(baseRow());
    expect(m.contact).toBe("");
    expect(m.reminderCount).toBe(0);
    expect(m.website).toBeUndefined();
  });
});

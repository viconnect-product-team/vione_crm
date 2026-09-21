import { describe, it, expect } from "vitest";
import { mapInvoice, mapReminder, mapMember } from "@/lib/fees-calc";

const memberRow = () => ({
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

const invoiceRow = () => ({
  id: "inv1",
  invoice_no: "INV-001",
  member: memberRow(),
  year: 2027,
  amount: "1500000",
  due_date: "2027-03-01",
  status: "unpaid",
});

describe("mapInvoice", () => {
  it("map hoá đơn chuẩn, ép amount string → number", () => {
    const inv = mapInvoice(invoiceRow());
    expect(inv.amount).toBe(1500000);
    expect(inv.member.code).toBe("HV001");
    expect(inv.paidAt).toBeUndefined();
  });

  it("amount = null → 0 (Number(null) === 0)", () => {
    const inv = mapInvoice({ ...invoiceRow(), amount: null });
    expect(inv.amount).toBe(0);
  });

  it("amount = undefined → NaN (tín hiệu lỗi dữ liệu cố ý không che giấu, không phải bug)", () => {
    // Không thêm fallback: Number(undefined) === NaN. Giữ nguyên để lỗi dữ liệu
    // nguồn (thiếu cột amount) lộ ra rõ ràng thay vì âm thầm hoá thành 0.
    const inv = mapInvoice({ ...invoiceRow(), amount: undefined });
    expect(Number.isNaN(inv.amount)).toBe(true);
  });
});

describe("mapReminder", () => {
  it("map reminder, ánh xạ by_name → by", () => {
    const rem = mapReminder({
      id: "r1",
      invoice_id: "inv1",
      channel: "email",
      sent_at: "2027-02-01",
      by_name: "Admin",
      note: "Nhắc lần 1",
    });
    expect(rem.by).toBe("Admin");
    expect(rem.channel).toBe("email");
    expect(rem.note).toBe("Nhắc lần 1");
  });

  it("note vắng mặt → undefined", () => {
    const rem = mapReminder({
      id: "r1",
      invoice_id: "inv1",
      channel: "sms",
      sent_at: "2027-02-01",
      by_name: "Admin",
    });
    expect(rem.note).toBeUndefined();
  });
});

describe("mapMember (fees-calc, bản trùng lặp có chủ đích)", () => {
  it("default an toàn cho field vắng", () => {
    const m = mapMember(memberRow());
    expect(m.email).toBe("");
    expect(m.taxCode).toBeUndefined();
  });
});

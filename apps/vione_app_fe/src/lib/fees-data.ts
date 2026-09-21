import type { Member } from "@/lib/members-data";

export type FeeStatus = "paid" | "unpaid" | "overdue";

export type FeeRecord = {
  id: string;
  member: Member;
  memberId?: string;
  year: number;
  amount: number;
  paidAt?: string;
  dueDate: string;
  status: FeeStatus;
  invoiceNo: string;
  method?: "bank" | "card" | "cash" | "ewallet";
};

export function feeKpis(records: FeeRecord[]) {
  const total = records.reduce((s, r) => s + r.amount, 0);
  const collected = records.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const outstanding = total - collected;
  const overdueCount = records.filter((r) => r.status === "overdue").length;
  const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0;
  return { total, collected, outstanding, overdueCount, collectionRate };
}

export function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

export type ReminderChannel = "email" | "sms" | "call" | "zalo";

export type ReminderEntry = {
  id: string;
  invoiceId: string;
  channel: ReminderChannel;
  sentAt: string; // ISO
  by: string;
  note?: string;
};

export const DEFAULT_FEE_INVOICES: FeeRecord[] = [
  {
    id: "INV-2026-001",
    invoiceNo: "HD-2026-001",
    year: 2026,
    amount: 20000000,
    dueDate: "2026-03-31",
    status: "unpaid",
    member: {
      id: "c1983000-0000-4000-8000-000000000001",
      code: "M1983-007",
      name: "Lê Hoàng Long",
      contact: "Lê Hoàng Long",
      email: "ceo.tongthuky@ceo1983.com",
      phone: "0983000001",
      type: "company",
      level: "memberLevel.large",
      industry: "ind.it",
      region: "region.north",
      status: "active",
      joinedAt: "2026-01-01T00:00:00Z",
      feeYear: 2026,
      feePaid: false,
      address: "Hà Nội, Việt Nam",
      about: "Tổng Thư Ký CLB Doanh Nhân CEO 1983",
    },
  },
  {
    id: "INV-2026-002",
    invoiceNo: "HD-2026-002",
    year: 2026,
    amount: 15000000,
    dueDate: "2026-04-15",
    status: "unpaid",
    member: {
      id: "c1983000-0000-4000-8000-000000000002",
      code: "M1983-008",
      name: "Nguyễn Văn Cường",
      contact: "Nguyễn Văn Cường",
      email: "ceo.thanhvien@ceo1983.com",
      phone: "0983000002",
      type: "company",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joinedAt: "2026-01-01T00:00:00Z",
      feeYear: 2026,
      feePaid: false,
      address: "Hà Nội, Việt Nam",
      about: "Phó Ban Phát Triển Hội Viên CLB CEO 1983",
    },
  },
  {
    id: "INV-2026-003",
    invoiceNo: "HD-2026-003",
    year: 2026,
    amount: 25000000,
    dueDate: "2026-02-28",
    status: "overdue",
    member: {
      id: "c1983000-0000-4000-8000-000000000003",
      code: "M1983-009",
      name: "Vũ Thu Trang",
      contact: "Vũ Thu Trang",
      email: "ceo.taichinh@ceo1983.com",
      phone: "0983000003",
      type: "company",
      level: "memberLevel.large",
      industry: "ind.finance",
      region: "region.north",
      status: "active",
      joinedAt: "2026-01-01T00:00:00Z",
      feeYear: 2026,
      feePaid: false,
      address: "Hà Nội, Việt Nam",
      about: "Trưởng Ban Tài Chính & Quỹ Đầu Tư CLB CEO 1983",
    },
  },
  {
    id: "INV-2026-004",
    invoiceNo: "HD-2026-004",
    year: 2026,
    amount: 10000000,
    dueDate: "2026-03-01",
    paidAt: "2026-03-05",
    status: "paid",
    method: "bank",
    member: {
      id: "c1983000-0000-4000-8000-000000000004",
      code: "M1983-010",
      name: "Phạm Quang Huy",
      contact: "Phạm Quang Huy",
      email: "ceo.truyenthong@ceo1983.com",
      phone: "0983000004",
      type: "company",
      level: "memberLevel.small",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joinedAt: "2026-01-01T00:00:00Z",
      feeYear: 2026,
      feePaid: true,
      address: "Hà Nội, Việt Nam",
      about: "Trưởng Ban Truyền Thông & Sự Kiện CLB CEO 1983",
    },
  },
];

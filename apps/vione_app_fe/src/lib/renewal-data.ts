import { type Member } from "@/lib/members-data";

export type RenewalStatus = "upcoming" | "due" | "overdue" | "renewed";

export type PaymentStatus = "unpaid" | "pending" | "paid";

export type RenewalRecord = {
  id: string;
  member: Member;
  currentTermEnd: string; // ISO date
  daysLeft: number; // negative if overdue
  status: RenewalStatus;
  paymentStatus: PaymentStatus;
  lastReminder?: string; // ISO date
  reminderCount: number;
  newTermEnd?: string;
  renewedAt?: string;
};

export function renewalKpis(records: RenewalRecord[]) {
  const total = records.length;
  const upcoming = records.filter((r) => r.status === "upcoming").length;
  const due = records.filter((r) => r.status === "due").length;
  const overdue = records.filter((r) => r.status === "overdue").length;
  const renewed = records.filter((r) => r.status === "renewed").length;
  const renewalRate = total > 0 ? Math.round((renewed / total) * 100) : 0;
  return { total, upcoming, due, overdue, renewed, renewalRate };
}

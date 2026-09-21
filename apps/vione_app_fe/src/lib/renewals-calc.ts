import type { Member } from "./members-data";
import type { RenewalRecord, RenewalStatus } from "./renewal-data";

export type Row = Record<string, unknown>;

export function mapMember(r: Row): Member {
  return {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    contact: (r.contact as string) ?? "",
    email: (r.email as string) ?? "",
    phone: (r.phone as string) ?? "",
    type: r.type as Member["type"],
    level: r.level as Member["level"],
    industry: r.industry as Member["industry"],
    region: r.region as Member["region"],
    status: r.status as Member["status"],
    joinedAt: ((r.joined_at ?? r.joinedAt) as string) ?? "",
    feeYear: Number(r.fee_year ?? r.feeYear ?? new Date().getFullYear()),
    feePaid: Boolean(r.fee_paid ?? r.feePaid),
    address: (r.address as string) ?? "",
    website: (r.website as string) ?? undefined,
    taxCode: ((r.tax_code ?? r.taxCode) as string) ?? undefined,
    employees: ((r.employees as number) ?? undefined),
    about: (r.about as string) ?? "",
    termEnd: ((r.term_end ?? r.termEnd) as string) ?? undefined,
    reminderCount: Number(r.reminder_count ?? r.reminderCount ?? 0),
    lastReminder: ((r.last_reminder ?? r.lastReminder) as string) ?? undefined,
    renewedAt: ((r.renewed_at ?? r.renewedAt) as string) ?? undefined,
    newTermEnd: ((r.new_term_end ?? r.newTermEnd) as string) ?? undefined,
  };
}

export function daysBetween(from: Date, toIso: string) {
  const to = new Date(toIso);
  to.setHours(0, 0, 0, 0);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/**
 * Cộng đúng 1 năm vào ngày cho trước, xử lý an toàn năm nhuận.
 * Nếu setFullYear(+1) làm nhảy tháng (do ngày nguồn là 29/2 mà năm đích không
 * có 29/2 → JS rollover sang 01/3), lùi về ngày cuối tháng gốc bằng setDate(0).
 * Ví dụ: 2028-02-29 → 2029-02-28 (thay vì 2029-03-01).
 */
export function addOneYear(date: Date): Date {
  const originalMonth = date.getMonth();
  const result = new Date(date.getTime());
  result.setFullYear(result.getFullYear() + 1);
  if (result.getMonth() !== originalMonth) {
    // Rollover xảy ra (ví dụ 29/2 → 01/3) → lùi về ngày cuối tháng gốc.
    result.setDate(0);
  }
  return result;
}

export function toRecord(r: Row): RenewalRecord {
  const m = mapMember(r);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rawTermEnd = (r.term_end ?? r.termEnd ?? m.termEnd) as string | undefined;
  const termEnd = rawTermEnd
    ? (rawTermEnd.includes("T") ? rawTermEnd.slice(0, 10) : rawTermEnd)
    : today.toISOString().slice(0, 10);
  const daysLeft = daysBetween(today, termEnd);
  const isRenewed = Boolean(r.renewed_at ?? r.renewedAt ?? m.renewedAt);
  let status: RenewalStatus;
  if (isRenewed) status = "renewed";
  else if (daysLeft < 0) status = "overdue";
  else if (daysLeft <= 30) status = "due";
  else status = "upcoming";

  const paymentStatus = ((r.payment_status ?? r.paymentStatus ?? (m.feePaid ? "paid" : "unpaid")) as string as RenewalRecord["paymentStatus"]) ?? "unpaid";
  const lastReminder = ((r.last_reminder ?? r.lastReminder ?? m.lastReminder) as string) ?? undefined;
  const reminderCount = Number(r.reminder_count ?? r.reminderCount ?? m.reminderCount ?? 0);
  const newTermEnd = ((r.new_term_end ?? r.newTermEnd ?? m.newTermEnd) as string) ?? undefined;
  const renewedAt = ((r.renewed_at ?? r.renewedAt ?? m.renewedAt) as string) ?? undefined;

  return {
    id: `RNW-${m.code}`,
    member: m,
    currentTermEnd: termEnd,
    daysLeft,
    status,
    paymentStatus,
    lastReminder,
    reminderCount,
    newTermEnd,
    renewedAt,
  };
}

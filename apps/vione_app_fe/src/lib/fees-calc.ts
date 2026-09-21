import type { Member } from "./members-data";
import type { FeeRecord, FeeStatus, ReminderChannel, ReminderEntry } from "./fees-data";

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
    joinedAt: r.joined_at as string,
    feeYear: r.fee_year as number,
    feePaid: r.fee_paid as boolean,
    address: (r.address as string) ?? "",
    website: (r.website as string) ?? undefined,
    taxCode: (r.tax_code as string) ?? undefined,
    employees: (r.employees as number) ?? undefined,
    about: (r.about as string) ?? "",
    termEnd: (r.term_end as string) ?? undefined,
    reminderCount: (r.reminder_count as number) ?? 0,
    lastReminder: (r.last_reminder as string) ?? undefined,
    renewedAt: (r.renewed_at as string) ?? undefined,
    newTermEnd: (r.new_term_end as string) ?? undefined,
  };
}

export function mapInvoice(r: Row): FeeRecord {
  return {
    id: r.id as string,
    invoiceNo: r.invoice_no as string,
    member: mapMember(r.member as Row),
    year: r.year as number,
    amount: Number(r.amount),
    paidAt: (r.paid_at as string) ?? undefined,
    dueDate: r.due_date as string,
    status: r.status as FeeStatus,
    method: (r.method as FeeRecord["method"]) ?? undefined,
  };
}

export function mapReminder(r: Row): ReminderEntry {
  return {
    id: r.id as string,
    invoiceId: r.invoice_id as string,
    channel: r.channel as ReminderChannel,
    sentAt: r.sent_at as string,
    by: r.by_name as string,
    note: (r.note as string) ?? undefined,
  };
}

import type { TKey } from "./i18n";

export type ActivityType = "email" | "call" | "meeting" | "event" | "payment" | "note";
export type EventRole = "attendee" | "sponsor" | "speaker" | "partner";
export type PayMethod = "bank" | "card" | "cash" | "evoucher";
export type PayStatus = "paid" | "pending" | "refunded";
export type PayKind = "fee" | "event" | "sponsor";

export type ActivityEntry = {
  id: string;
  type: ActivityType;
  date: string; // ISO datetime
  title: string;
  by: string;
  detail?: string;
};

export type EventEntry = {
  id: string;
  name: string;
  date: string;
  role: EventRole;
  checkedIn: boolean;
  attendees: number;
};

export type PaymentEntry = {
  id: string;
  invoice: string;
  date: string;
  kind: PayKind;
  description: string;
  amount: number; // VND
  method: PayMethod;
  status: PayStatus;
};

// History data is loaded from the database via getCompanyHistoryFn
// (see src/lib/companies.functions.ts).

export const ACTIVITY_LABEL: Record<ActivityType, TKey> = {
  email: "actType.email",
  call: "actType.call",
  meeting: "actType.meeting",
  event: "actType.event",
  payment: "actType.payment",
  note: "actType.note",
};

export const EVENT_ROLE_LABEL: Record<EventRole, TKey> = {
  attendee: "erole.attendee",
  sponsor: "erole.sponsor",
  speaker: "erole.speaker",
  partner: "erole.partner",
};

export const PAY_METHOD_LABEL: Record<PayMethod, TKey> = {
  bank: "pay.bank",
  card: "pay.card",
  cash: "pay.cash",
  evoucher: "pay.evoucher",
};

export const PAY_STATUS_LABEL: Record<PayStatus, TKey> = {
  paid: "pay.status.paid",
  pending: "pay.status.pending",
  refunded: "pay.status.refunded",
};

export const PAY_KIND_LABEL: Record<PayKind, TKey> = {
  fee: "pay.kind.fee",
  event: "pay.kind.event",
  sponsor: "pay.kind.sponsor",
};

export function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

import type { TKey } from "./i18n";

export type AttendeeBadge = "vip" | "speaker" | "sponsor" | "member" | "guest";
export type CheckinResult = "success" | "already" | "invalid";

export type Attendee = {
  id: string;
  name: string;
  initials: string;
  title: string;
  company: string;
  phone: string;
  badges: AttendeeBadge[];
  membership: TKey; // memberLevel.* key
  ticketType?: string;
  checkedIn?: boolean;
  seatAssignment?: string;
  paymentStatus?: string;
  sponsorType?: "regular" | "new";
  packageType?: "cash" | "in_kind";
  inKindDescription?: string;
};

export type TicketStat = {
  ticketType: string;
  registered: number;
  checkedIn: number;
};

export type RecentEntry = {
  attendee: Attendee;
  result: CheckinResult;
  time: string;
};

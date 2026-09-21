export type MemberType = "company" | "individual";
export type MemberStatus = "active" | "pending" | "expired";
export type IndustryKey =
  | "ind.trade"
  | "ind.it"
  | "ind.manufacturing"
  | "ind.realestate"
  | "ind.finance";
export type RegionKey = "region.north" | "region.central" | "region.south";
export type MemberLevelKey =
  | "memberLevel.large"
  | "memberLevel.medium"
  | "memberLevel.small"
  | "memberLevel.individual";

export type Member = {
  id: string;
  code: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  type: MemberType;
  level: MemberLevelKey;
  industry: IndustryKey;
  region: RegionKey;
  status: MemberStatus;
  joinedAt: string; // ISO
  createdAt?: string; // ISO
  feeYear: number;
  feePaid: boolean;
  address: string;
  website?: string;
  taxCode?: string;
  employees?: number;
  about: string;
  // Renewal fields (populated when loaded from the database)
  termEnd?: string;
  reminderCount?: number;
  lastReminder?: string;
  renewedAt?: string;
  newTermEnd?: string;
  executiveRole?: string;
  department?: string;
};

export const MEMBERS: Member[] = [];

// Replace the in-memory members store with real data loaded from the DB.
export function hydrateMembers(members: Member[]) {
  MEMBERS.splice(0, MEMBERS.length, ...members);
}

export function getMember(id: string) {
  return MEMBERS.find((m) => m.id === id);
}

export type MemberContactPatch = Partial<Pick<Member, "email" | "phone" | "address">>;

export function updateMemberContact(id: string, patch: MemberContactPatch) {
  const m = MEMBERS.find((x) => x.id === id);
  if (!m) return undefined;
  if (patch.email !== undefined) m.email = patch.email;
  if (patch.phone !== undefined) m.phone = patch.phone;
  if (patch.address !== undefined) m.address = patch.address;
  return m;
}

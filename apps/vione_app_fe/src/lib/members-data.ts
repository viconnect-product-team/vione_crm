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

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: "c1983000-0000-4000-8000-000000000001",
    code: "M1983-001",
    name: "Lê Văn Nam",
    contact: "Lê Văn Nam",
    email: "ceo.le.nam@vinagroup.vn",
    phone: "0983000001",
    type: "company",
    level: "memberLevel.large",
    industry: "ind.it",
    region: "region.north",
    status: "active",
    joinedAt: "2025-01-15T00:00:00Z",
    feeYear: 2026,
    feePaid: true,
    address: "Tòa nhà Keangnam Landmark 72, Cầu Giấy, Hà Nội",
    website: "https://vinagroup.vn",
    about: "Chủ tịch HĐQT VinaTech Group · Chủ tịch CLB Doanh Nhân CEO 1983",
  },
  {
    id: "c1983000-0000-4000-8000-000000000002",
    code: "M1983-002",
    name: "Nguyễn Văn Cường",
    contact: "Nguyễn Văn Cường",
    email: "ceo.cuong@anthinhcorp.com",
    phone: "0983000002",
    type: "company",
    level: "memberLevel.medium",
    industry: "ind.trade",
    region: "region.north",
    status: "active",
    joinedAt: "2025-02-10T00:00:00Z",
    feeYear: 2026,
    feePaid: true,
    address: "Số 88 Láng Hạ, Đống Đa, Hà Nội",
    website: "https://anthinhcorp.com",
    about: "Phó Ban Phát Triển Hội Viên CLB CEO 1983 · TGĐ An Thịnh Corp",
  },
  {
    id: "c1983000-0000-4000-8000-000000000003",
    code: "M1983-003",
    name: "Vũ Thu Trang",
    contact: "Vũ Thu Trang",
    email: "trang.vu@asiacapital.vn",
    phone: "0983000003",
    type: "company",
    level: "memberLevel.large",
    industry: "ind.finance",
    region: "region.north",
    status: "active",
    joinedAt: "2025-03-01T00:00:00Z",
    feeYear: 2026,
    feePaid: true,
    address: "Tầng 18, Lotte Center, Ba Đình, Hà Nội",
    website: "https://asiacapital.vn",
    about: "Trưởng Ban Tài Chính & Quỹ Xúc Tiến Thương Mại CLB CEO 1983",
  },
  {
    id: "c1983000-0000-4000-8000-000000000004",
    code: "M1983-004",
    name: "Phạm Quang Huy",
    contact: "Phạm Quang Huy",
    email: "huy.pham@newvisionmedia.vn",
    phone: "0983000004",
    type: "company",
    level: "memberLevel.small",
    industry: "ind.trade",
    region: "region.north",
    status: "active",
    joinedAt: "2025-03-15T00:00:00Z",
    feeYear: 2026,
    feePaid: true,
    address: "Tòa nhà Discovery Complex, Cầu Giấy, Hà Nội",
    website: "https://newvisionmedia.vn",
    about: "Trưởng Ban Truyền Thông & Thương Hiệu CLB Doanh Nhân CEO 1983",
  },
  {
    id: "c1983000-0000-4000-8000-000000000005",
    code: "M1983-005",
    name: "Hoàng Minh Trí",
    contact: "Hoàng Minh Trí",
    email: "tri.hoang@vinalogistics.com",
    phone: "0983000005",
    type: "company",
    level: "memberLevel.large",
    industry: "ind.trade",
    region: "region.south",
    status: "active",
    joinedAt: "2025-04-01T00:00:00Z",
    feeYear: 2026,
    feePaid: true,
    address: "Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh",
    website: "https://vinalogistics.com",
    about: "Tổng Giám Đốc Vina Logistics · Chuyên gia Chuỗi Cung Ứng Quốc Tế",
  },
  {
    id: "c1983000-0000-4000-8000-000000000006",
    code: "M1983-006",
    name: "Trần Đức Minh",
    contact: "Trần Đức Minh",
    email: "minh.tran@thanglongland.vn",
    phone: "0983000006",
    type: "company",
    level: "memberLevel.medium",
    industry: "ind.realestate",
    region: "region.north",
    status: "active",
    joinedAt: "2025-05-12T00:00:00Z",
    feeYear: 2026,
    feePaid: true,
    address: "Khu Đô Thị Vinhomes Riverside, Long Biên, Hà Nội",
    website: "https://thanglongland.vn",
    about: "Giám Đốc Dự Án Bất Động Sản Công Nghiệp Thăng Long Land",
  },
  {
    id: "c1983000-0000-4000-8000-000000000007",
    code: "M1983-007",
    name: "Đỗ Thúy Hằng",
    contact: "Đỗ Thúy Hằng",
    email: "hang.do@hoaphatmec.com",
    phone: "0983000007",
    type: "company",
    level: "memberLevel.large",
    industry: "ind.manufacturing",
    region: "region.central",
    status: "active",
    joinedAt: "2025-06-20T00:00:00Z",
    feeYear: 2026,
    feePaid: true,
    address: "KCN Hòa Khánh, Liên Chiểu, Đà Nẵng",
    website: "https://hoaphatmec.com",
    about: "Chủ tịch HĐQT Hòa Phát Mechanical & Smart Automation",
  },
  {
    id: "c1983000-0000-4000-8000-000000000008",
    code: "M1983-008",
    name: "Mai Thanh Tùng",
    contact: "Mai Thanh Tùng",
    email: "tung.mai@ecofarmtech.vn",
    phone: "0983000008",
    type: "individual",
    level: "memberLevel.individual",
    industry: "ind.trade",
    region: "region.south",
    status: "active",
    joinedAt: "2025-07-08T00:00:00Z",
    feeYear: 2026,
    feePaid: true,
    address: "Số 12 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh",
    website: "https://ecofarmtech.vn",
    about: "Nhà Sáng Lập EcoFarm Tech · Nông nghiệp công nghệ cao tuần hoàn",
  },
];

export const MEMBERS: Member[] = [...DEFAULT_MEMBERS];

// Replace the in-memory members store with real data loaded from the DB.
export function hydrateMembers(members: Member[]) {
  if (Array.isArray(members) && members.length > 0) {
    MEMBERS.splice(0, MEMBERS.length, ...members);
  } else if (MEMBERS.length === 0) {
    MEMBERS.splice(0, MEMBERS.length, ...DEFAULT_MEMBERS);
  }
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

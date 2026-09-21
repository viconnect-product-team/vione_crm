// Mock data for the VBA member PWA. Self-contained, no backend required.

export const member = {
  name: "Nguyễn Văn Minh",
  company: "Công ty TNHH Minh Phát",
  status: "Hội viên chính thức",
  code: "HV123456",
  validUntil: "31/12/2025",
  verified: true,
  // Public card details
  type: "company" as "company" | "individual",
  title: "Giám đốc điều hành",
  email: "minh@minhphat.vn",
  phone: "0901 234 567",
  taxCode: "0312345678",
  industry: "Thương mại · Dịch vụ",
  region: "Miền Trung",
  address: "12 Nguyễn Huệ, Đà Nẵng",
  website: "minhphat.vn",
  joinedAt: "14/03/2022",
};

export type Opportunity = {
  id: string;
  tag: string;
  title: string;
  company: string;
  time: string;
  color: string;
};

export const opportunities: Opportunity[] = [
  {
    id: "o1",
    tag: "Hợp tác kinh doanh",
    title: "Tìm đối tác phân phối sản phẩm khu vực miền Trung",
    company: "Công ty TNHH Minh Phát",
    time: "2 giờ trước",
    color: "#7c6cff",
  },
  {
    id: "o2",
    tag: "Đầu tư",
    title: "Tìm nhà đầu tư cho dự án nông nghiệp công nghệ cao",
    company: "Công ty CP Green Farm",
    time: "1 ngày trước",
    color: "#3fbf7f",
  },
  {
    id: "o3",
    tag: "Tuyển dụng",
    title: "Tuyển Giám đốc kinh doanh ngành thiết bị công nghiệp",
    company: "Công ty CP ABC",
    time: "2 ngày trước",
    color: "#4a9eff",
  },
  {
    id: "o4",
    tag: "Phân phối",
    title: "Cần nhà phân phối thực phẩm sạch tại miền Bắc",
    company: "Công ty TNHH Food Healthy",
    time: "3 ngày trước",
    color: "#e8a04c",
  },
];

export const opportunityTabs = [
  "Tất cả",
  "Hợp tác kinh doanh",
  "Đầu tư",
  "Phân phối",
  "Tuyển dụng",
];

export type Product = {
  id: string;
  name: string;
  company: string;
  category: string;
  likes: number;
  views: number;
  time: string;
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Tinh chất thiên nhiên Ngọc Lan Premium",
    company: "Công ty CP Ngọc Lan",
    category: "Mỹ phẩm · Làm đẹp",
    likes: 24,
    views: 126,
    time: "2 giờ trước",
  },
  {
    id: "p2",
    name: "Máy đóng gói tự động Model X200",
    company: "Công ty CP Cơ khí Việt",
    category: "Máy móc · Thiết bị",
    likes: 18,
    views: 96,
    time: "5 giờ trước",
  },
  {
    id: "p3",
    name: "Hạt dinh dưỡng cao cấp Mix 6 loại",
    company: "Công ty TNHH Food Healthy",
    category: "Thực phẩm · Đồ uống",
    likes: 32,
    views: 210,
    time: "1 ngày trước",
  },
];

export const productTabs = ["Sản phẩm", "Dịch vụ", "Video", "Danh mục"];

export type AppEvent = {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
  place: string;
};

export const events: AppEvent[] = [
  {
    id: "e1",
    day: "20",
    month: "JUN",
    title: "Hội thảo: Chuyển đổi số trong doanh nghiệp",
    time: "08:30 - 12:00",
    place: "Khách sạn Melia Hà Nội",
  },
  {
    id: "e2",
    day: "05",
    month: "JUL",
    title: "Diễn đàn Kinh tế Việt Nam 2025",
    time: "13:30 - 17:00",
    place: "Trung tâm Hội nghị Quốc gia",
  },
  {
    id: "e3",
    day: "15",
    month: "AUG",
    title: "Gặp gỡ giao lưu Hội viên Hiệp hội",
    time: "18:00 - 21:00",
    place: "Khách sạn Lotte Hà Nội",
  },
];

export const eventTabs = ["Sắp diễn ra", "Đang diễn ra", "Đã diễn ra"];

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: "event" | "fee" | "opportunity" | "system";
};

export const notifications: AppNotification[] = [
  {
    id: "n1",
    title: "Sự kiện sắp diễn ra",
    body: "Hội thảo Chuyển đổi số sẽ bắt đầu lúc 08:30 ngày 20/06.",
    time: "1 giờ trước",
    unread: true,
    type: "event",
  },
  {
    id: "n2",
    title: "Cơ hội mới phù hợp",
    body: "Có 1 cơ hội hợp tác kinh doanh mới phù hợp với hồ sơ của bạn.",
    time: "3 giờ trước",
    unread: true,
    type: "opportunity",
  },
  {
    id: "n3",
    title: "Nhắc gia hạn hội phí",
    body: "Thẻ hội viên của bạn còn hiệu lực đến 31/12/2025.",
    time: "1 ngày trước",
    unread: false,
    type: "fee",
  },
  {
    id: "n4",
    title: "Cập nhật hệ thống",
    body: "Ứng dụng vừa được cập nhật tính năng mới.",
    time: "2 ngày trước",
    unread: false,
    type: "system",
  },
];

export type Conversation = {
  id: string;
  name: string;
  last: string;
  time: string;
  unread: number;
};

export const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Công ty CP Green Farm",
    last: "Cảm ơn anh, mình sẽ gửi hồ sơ ngay.",
    time: "5 phút",
    unread: 2,
  },
  {
    id: "c2",
    name: "Trần Thị Hương",
    last: "Hẹn gặp tại sự kiện tuần sau nhé!",
    time: "1 giờ",
    unread: 0,
  },
  {
    id: "c3",
    name: "Ban Thư ký Hiệp hội",
    last: "Thông tin gia hạn thẻ đã được cập nhật.",
    time: "1 ngày",
    unread: 0,
  },
];

export const memberBenefits = [
  { title: "Tham dự sự kiện", desc: "miễn phí & ưu đãi" },
  { title: "Kết nối hơn", desc: "1000+ doanh nghiệp" },
  { title: "Quảng bá thương hiệu", desc: "trên kênh Hiệp hội" },
];

// ---- Event check-in (QR/NFC) ----
export type CheckinEvent = {
  id: string;
  code: string; // QR/NFC payload expected
  title: string;
  date: string;
  time: string;
  place: string;
};

// Events the member is registered for and can check in to.
export const checkinEvents: CheckinEvent[] = [
  {
    id: "e1",
    code: "VBA-EVT-2025-0620",
    title: "Hội thảo: Chuyển đổi số trong doanh nghiệp",
    date: "20/06/2025",
    time: "08:30 - 12:00",
    place: "Khách sạn Melia Hà Nội",
  },
  {
    id: "e2",
    code: "VBA-EVT-2025-0705",
    title: "Diễn đàn Kinh tế Việt Nam 2025",
    date: "05/07/2025",
    time: "13:30 - 17:00",
    place: "Trung tâm Hội nghị Quốc gia",
  },
];

export type CheckinStatus = "success" | "already" | "invalid";

export type SyncState = "pending" | "synced";

export type CheckinRecord = {
  id: string;
  eventId: string | null;
  eventTitle: string;
  status: CheckinStatus;
  method: "qr" | "nfc";
  at: string; // ISO timestamp
  sync: SyncState;
};

const CHECKIN_KEY = "vba_member_checkins";

export function loadCheckins(): CheckinRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHECKIN_KEY) ?? "[]") as CheckinRecord[];
  } catch {
    return [];
  }
}

export function saveCheckins(list: CheckinRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(list));
}

/** Simulate scanning a payload and resolving the check-in result. */
export function resolveCheckin(
  payload: string,
  method: "qr" | "nfc",
  history: CheckinRecord[],
): CheckinRecord {
  const event = checkinEvents.find((e: any) => e.code === payload);
  let status: CheckinStatus;
  if (!event) {
    status = "invalid";
  } else if (history.some((r) => r.eventId === event.id && r.status !== "invalid")) {
    status = "already";
  } else {
    status = "success";
  }
  return {
    id: `chk-${Date.now()}`,
    eventId: event?.id ?? null,
    eventTitle: event?.title ?? "Mã không hợp lệ",
    status,
    method,
    at: new Date().toISOString(),
    sync: "pending",
  };
}

/** Records still waiting to be pushed to the server. */
export function pendingCheckins(list: CheckinRecord[]): CheckinRecord[] {
  return list.filter((r) => r.sync === "pending");
}

export const profileMenu = [
  "Thông tin cá nhân",
  "Thông tin doanh nghiệp",
  "Quản lý thành viên",
  "Lịch sử hoạt động",
  "Bài viết đã đăng",
  "Sản phẩm đã đăng",
  "Cơ hội đã đăng",
  "Thông báo của tôi",
  "Cài đặt",
];

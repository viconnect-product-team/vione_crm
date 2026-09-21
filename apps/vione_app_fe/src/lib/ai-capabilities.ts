import {
  BookOpen,
  Users,
  Handshake,
  Wallet,
  Calendar,
  Store,
  Bell,
  FileBarChart,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * AI Capability Registry — Phase 10, Step 2.
 *
 * This is the safe orchestration layer for the Association AI Engine. It is a
 * pure client-safe registry: NO backend calls, NO AI provider, NO prompt
 * engineering. It only describes capabilities, the permissions/context they
 * require, and the real in-app routes they can link to.
 *
 * Permission decisions are still enforced server-side (RLS + role checks in the
 * server function). This registry only decides what to *offer* in the UI; it
 * never grants access.
 */

export type CapabilityId =
  | "document"
  | "member"
  | "networking"
  | "fee"
  | "event"
  | "marketplace"
  | "notification"
  | "executive"
  | "announcement";

/** Minimum role needed to use a capability. "member" = any authenticated user. */
export type CapabilityRole = "member" | "moderator" | "admin";

/** A link to a real, existing route (validated against the router). */
export type CapabilityLink = {
  label: string;
  to: string;
};

/** A card shown in the right panel when a capability is active. */
export type CapabilityCardField = {
  label: string;
  /** Honest placeholder — real values require the data step (not this step). */
  hint: string;
};

export type Capability = {
  id: CapabilityId;
  label: string;
  icon: LucideIcon;
  description: string;
  /** Minimum role required. */
  minRole: CapabilityRole;
  /** Which datasets this capability reads (permission-scoped server-side). */
  contextSources: string[];
  /** Keywords used for lightweight, deterministic capability routing. */
  keywords: string[];
  /** Suggested prompts shown when this capability is active. */
  suggestedPrompts: string[];
  /** Suggested actions — only real routes. */
  actions: CapabilityLink[];
  /** Related modules — only real routes. */
  relatedModules: CapabilityLink[];
  /** Fields shown on the dynamic capability card in the right panel. */
  cardFields: CapabilityCardField[];
};

export const CAPABILITIES: Capability[] = [
  {
    id: "document",
    label: "Trợ lý Tài liệu",
    icon: BookOpen,
    description: "Tra cứu, tóm tắt và hỏi đáp trên kho tài liệu bạn có quyền xem.",
    minRole: "member",
    contextSources: ["documents"],
    keywords: ["tài liệu", "văn bản", "biên bản", "quy chế", "quy định", "document", "tóm tắt"],
    suggestedPrompts: [
      "Tóm tắt các văn bản mới nhất trong tháng này",
      "Tìm tài liệu liên quan đến hội phí",
      "Liệt kê quy chế nội bộ hiện hành",
    ],
    actions: [{ label: "Mở Trung tâm tài liệu", to: "/documents" }],
    relatedModules: [{ label: "Tài liệu", to: "/documents" }],
    cardFields: [
      { label: "Tài liệu gần đây", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
      { label: "Danh mục", hint: "Theo quyền xem của bạn" },
      { label: "Phạm vi tìm kiếm", hint: "Chỉ tài liệu được phân quyền" },
    ],
  },
  {
    id: "member",
    label: "Trợ lý Hội viên",
    icon: Users,
    description: "Tìm kiếm và phân nhóm hội viên theo ngành, khu vực, cấp độ.",
    minRole: "member",
    contextSources: ["members"],
    keywords: ["hội viên", "thành viên", "ngành", "khu vực", "danh bạ", "member", "doanh nghiệp"],
    suggestedPrompts: [
      "Tìm hội viên ngành Logistics",
      "Danh sách hội viên mới gia nhập gần đây",
      "Hội viên nào ở Hà Nội?",
    ],
    actions: [{ label: "Mở Danh bạ hội viên", to: "/members" }],
    relatedModules: [
      { label: "Hội viên", to: "/members" },
      { label: "Phân nhóm", to: "/segments" },
    ],
    cardFields: [
      { label: "Số hội viên", hint: "Theo phạm vi bạn thấy" },
      { label: "Ngành nghề", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
      { label: "Khu vực", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
    ],
  },
  {
    id: "networking",
    label: "Trợ lý Kết nối",
    icon: Handshake,
    description: "Gợi ý kết nối và cơ hội hợp tác giữa các hội viên.",
    minRole: "member",
    contextSources: ["members", "marketplace"],
    keywords: ["kết nối", "hợp tác", "networking", "cơ hội", "giới thiệu", "đối tác"],
    suggestedPrompts: [
      "Gợi ý hội viên phù hợp để kết nối với doanh nghiệp logistics",
      "Các cơ hội hợp tác mới được chia sẻ gần đây",
      "Ai nên kết nối với nhau trong ngành công nghệ?",
    ],
    actions: [
      { label: "Mở Kết nối", to: "/network" },
      { label: "Xem cơ hội", to: "/opportunities" },
    ],
    relatedModules: [
      { label: "Kết nối", to: "/network" },
      { label: "Cơ hội", to: "/opportunities" },
    ],
    cardFields: [
      { label: "Kết nối gợi ý", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
      { label: "Cơ hội mới", hint: "Theo quyền xem của bạn" },
    ],
  },
  {
    id: "fee",
    label: "Trợ lý Hội phí",
    icon: Wallet,
    description: "Phân tích tình trạng thu hội phí, công nợ và tỷ lệ thu.",
    minRole: "moderator",
    contextSources: ["fees"],
    keywords: [
      "hội phí",
      "công nợ",
      "thu phí",
      "hóa đơn",
      "fee",
      "tài chính",
      "đóng phí",
      "chưa thu",
    ],
    suggestedPrompts: [
      "Hội phí tháng này còn bao nhiêu chưa thu?",
      "Nhóm hội viên nào cần nhắc đóng hội phí?",
      "Tỷ lệ thu hội phí quý này là bao nhiêu?",
    ],
    actions: [
      { label: "Mở Trung tâm hội phí", to: "/fees" },
      { label: "Xem gia hạn", to: "/renewal" },
    ],
    relatedModules: [
      { label: "Hội phí", to: "/fees" },
      { label: "Báo cáo tài chính", to: "/finance-report" },
    ],
    cardFields: [
      { label: "Tình trạng thu", hint: "Chỉ quản trị viên" },
      { label: "Công nợ", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
      { label: "Tỷ lệ thu", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
    ],
  },
  {
    id: "event",
    label: "Trợ lý Sự kiện",
    icon: Calendar,
    description: "Tổng hợp sự kiện, đăng ký và check-in.",
    minRole: "member",
    contextSources: ["events"],
    keywords: ["sự kiện", "hội thảo", "đăng ký", "check-in", "event", "lịch", "tham dự"],
    suggestedPrompts: [
      "Tổng hợp các sự kiện sắp diễn ra",
      "Sự kiện nào có tỷ lệ đăng ký cao nhất?",
      "Có bao nhiêu người đã đăng ký sự kiện tuần này?",
    ],
    actions: [{ label: "Mở Sự kiện", to: "/events" }],
    relatedModules: [{ label: "Sự kiện", to: "/events" }],
    cardFields: [
      { label: "Sự kiện sắp tới", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
      { label: "Đăng ký", hint: "Theo quyền xem của bạn" },
    ],
  },
  {
    id: "marketplace",
    label: "Trợ lý Marketplace",
    icon: Store,
    description: "Khám phá sản phẩm, cơ hội và yêu cầu báo giá.",
    minRole: "member",
    contextSources: ["marketplace"],
    keywords: ["marketplace", "sản phẩm", "báo giá", "mua", "bán", "dịch vụ", "chào hàng"],
    suggestedPrompts: [
      "Sản phẩm mới nào vừa được đăng?",
      "Các yêu cầu báo giá đang chờ xử lý",
      "Gợi ý sản phẩm phù hợp cho ngành xây dựng",
    ],
    actions: [
      { label: "Mở Marketplace", to: "/marketplace" },
      { label: "Không gian của tôi", to: "/marketplace/workspace" },
    ],
    relatedModules: [{ label: "Marketplace", to: "/marketplace" }],
    cardFields: [
      { label: "Sản phẩm", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
      { label: "Yêu cầu báo giá", hint: "Theo quyền xem của bạn" },
    ],
  },
  {
    id: "notification",
    label: "Trợ lý Thông báo",
    icon: Bell,
    description: "Tổng hợp thông báo và tin tức của hiệp hội.",
    minRole: "member",
    contextSources: ["notifications"],
    keywords: ["thông báo", "tin tức", "nhắc", "notification", "cập nhật"],
    suggestedPrompts: ["Có thông báo nào quan trọng chưa đọc?", "Tổng hợp tin tức tuần này"],
    actions: [{ label: "Mở Thông báo", to: "/notifications" }],
    relatedModules: [{ label: "Thông báo", to: "/notifications" }],
    cardFields: [
      { label: "Chưa đọc", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
      { label: "Gần đây", hint: "Theo quyền xem của bạn" },
    ],
  },
  {
    id: "announcement",
    label: "Trợ lý Soạn thảo",
    icon: Megaphone,
    description: "Soạn thông báo, email và nội dung truyền thông.",
    minRole: "moderator",
    contextSources: ["notifications"],
    keywords: ["soạn", "viết", "thông báo mời", "email", "truyền thông", "draft", "nội dung"],
    suggestedPrompts: [
      "Viết thông báo mời hội viên tham dự sự kiện tuần sau",
      "Soạn thông báo nhắc đóng hội phí với giọng trang trọng",
    ],
    actions: [{ label: "Mở Thông báo", to: "/notifications" }],
    relatedModules: [{ label: "Thông báo", to: "/notifications" }],
    cardFields: [{ label: "Bản nháp", hint: "Kết quả cần kiểm tra trước khi gửi" }],
  },
  {
    id: "executive",
    label: "Trợ lý Điều hành",
    icon: FileBarChart,
    description: "Báo cáo tổng hợp và chỉ số điều hành cho lãnh đạo.",
    minRole: "admin",
    contextSources: ["members", "fees", "events"],
    keywords: [
      "báo cáo",
      "lãnh đạo",
      "điều hành",
      "tổng quan",
      "chủ tịch",
      "kpi",
      "tăng trưởng",
      "executive",
    ],
    suggestedPrompts: [
      "Tạo báo cáo ngắn cho Chủ tịch Hiệp hội trong tuần này",
      "Tổng hợp tăng trưởng hội viên và thu hội phí tháng này",
      "Những việc nào đang chờ phê duyệt?",
    ],
    actions: [
      { label: "Mở Bảng điều hành", to: "/" },
      { label: "Báo cáo tài chính", to: "/finance-report" },
    ],
    relatedModules: [
      { label: "Bảng điều hành", to: "/" },
      { label: "Phân nhóm", to: "/segments" },
    ],
    cardFields: [
      { label: "Chỉ số nhanh", hint: "Chỉ quản trị viên" },
      { label: "Chờ phê duyệt", hint: "Sẽ hiển thị khi kết nối dữ liệu" },
      { label: "Sự kiện gần đây", hint: "Theo quyền xem của bạn" },
    ],
  },
];

export const DEFAULT_CAPABILITY_ID: CapabilityId = "document";

/**
 * Capability-aware memory policy — Phase 10, Step 3.
 *
 * Declares WHAT each capability is allowed to remember in session memory and
 * what follow-up suggestions it can offer. These are SAFE fields only:
 * ids, display titles/names, categories, regions, dates, statuses, and
 * aggregate metrics. It explicitly must NOT include raw payment-sensitive
 * details, private member contact fields, or full document contents.
 */
export type CapabilityMemoryPolicy = {
  /** Safe fields this capability may remember (documentation + guard reference). */
  rememberFields: string[];
  /** Follow-up suggestion labels offered when this capability is active. */
  followUpSuggestions: string[];
};

export const CAPABILITY_MEMORY: Record<CapabilityId, CapabilityMemoryPolicy> = {
  document: {
    rememberFields: ["document ids", "document titles", "categories", "last search terms"],
    followUpSuggestions: ["Tóm tắt tài liệu trên", "Tìm tài liệu liên quan", "Lọc theo danh mục"],
  },
  member: {
    rememberFields: [
      "member ids",
      "safe display names",
      "industries",
      "regions",
      "member type",
      "last filters",
    ],
    followUpSuggestions: [
      "Lọc tiếp theo tỉnh/thành",
      "Tạo thông báo cho nhóm này",
      "Xuất danh sách",
      "Mở hồ sơ hội viên",
    ],
  },
  networking: {
    rememberFields: ["member ids", "safe display names", "industries", "opportunity ids"],
    followUpSuggestions: ["Gợi ý kết nối tiếp", "Xem cơ hội liên quan", "Tạo lời mời kết nối"],
  },
  fee: {
    // Aggregate metrics only — never raw payment-sensitive details.
    rememberFields: ["period", "status", "aggregate metrics only"],
    followUpSuggestions: ["Lọc theo kỳ", "Nhắc nhóm chưa đóng", "Xuất báo cáo tổng hợp"],
  },
  event: {
    rememberFields: ["event ids", "event titles", "dates", "registration status"],
    followUpSuggestions: [
      "Xem đăng ký sự kiện này",
      "Tạo thông báo mời tham dự",
      "Sự kiện kế tiếp",
    ],
  },
  marketplace: {
    rememberFields: ["product/opportunity ids", "titles", "categories", "owner display names"],
    followUpSuggestions: ["Lọc theo danh mục", "Xem chi tiết", "Liên hệ chủ tin"],
  },
  notification: {
    rememberFields: ["notification ids", "titles", "categories"],
    followUpSuggestions: ["Xem thông báo liên quan", "Đánh dấu đã đọc"],
  },
  announcement: {
    rememberFields: ["draft topic", "audience label", "tone", "selected source context"],
    followUpSuggestions: ["Điều chỉnh giọng văn", "Chọn đối tượng nhận", "Tạo bản nháp"],
  },
  executive: {
    // Summary metrics only.
    rememberFields: ["summary metrics only", "reporting period", "action items"],
    followUpSuggestions: ["Xuất báo cáo", "Xem việc chờ phê duyệt", "Đổi kỳ báo cáo"],
  },
};

export function getCapabilityMemory(id: CapabilityId): CapabilityMemoryPolicy {
  return CAPABILITY_MEMORY[id];
}

export function getCapability(id: CapabilityId): Capability {
  return CAPABILITIES.find((c) => c.id === id) ?? CAPABILITIES[0];
}

/** Rank order for role gating. */
const ROLE_RANK: Record<CapabilityRole, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
};

export function canUseCapability(cap: Capability, userRank: number): boolean {
  return userRank >= ROLE_RANK[cap.minRole];
}

export function userRoleRank(opts: { isAdmin: boolean; isModerator: boolean }): number {
  if (opts.isAdmin) return ROLE_RANK.admin;
  if (opts.isModerator) return ROLE_RANK.moderator;
  return ROLE_RANK.member;
}

/**
 * Deterministic capability routing (no LLM). Picks the capability whose
 * keywords best match the text. Falls back to `previous` (session context) when
 * the text is a short follow-up with no strong signal, else DEFAULT.
 */
export function routeCapability(text: string, previous: CapabilityId | null): CapabilityId {
  const lower = text.toLowerCase();
  let best: { id: CapabilityId; score: number } | null = null;
  for (const cap of CAPABILITIES) {
    let score = 0;
    for (const kw of cap.keywords) {
      if (lower.includes(kw.toLowerCase())) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { id: cap.id, score };
    }
  }
  if (best) return best.id;
  // No keyword hit: treat as a follow-up and keep the previous capability
  // (session-only conversation context), otherwise use the default.
  return previous ?? DEFAULT_CAPABILITY_ID;
}

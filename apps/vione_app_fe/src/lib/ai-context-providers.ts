import type { AiCapability } from "@/lib/ai-capability-router";

/**
 * AI Context Providers — Phase 10, Step 4.
 *
 * Deterministic, permission-aware providers that turn already-permitted,
 * safe data snapshots into a normalized context (sources + metrics +
 * limitations + suggested actions). NO backend/AI calls here — the caller
 * passes in whatever RLS-permitted data it already has. Providers NEVER invent
 * data: if a dataset is missing they add an honest limitation instead.
 *
 * Safety rules enforced here:
 * - Only safe display fields are emitted (name, company, code, industry,
 *   region, level, status, title, category, date, aggregate metrics).
 * - Private fields (tax_code, phone, email, private notes, raw payment rows)
 *   are never read or emitted.
 * - Fee/executive details are aggregate-only for non-admin users.
 */

export type PermissionLevel = "member" | "moderator" | "admin" | "platform";

export type SourceType = "document" | "member" | "fee" | "event" | "marketplace" | "notification";

export type ContextSource = {
  id: string;
  type: SourceType;
  title: string;
  subtitle?: string;
  route?: string;
  safeSummary?: string;
  updatedAt?: string;
};

export type SuggestedAction = {
  label: string;
  route?: string;
  intent?: string;
  disabled?: boolean;
  reason?: string;
};

export type ProviderResult = {
  sources: ContextSource[];
  metrics: Record<string, number | string>;
  limitations: string[];
  suggestedActions: SuggestedAction[];
};

/* ---------- Safe data snapshot shapes (caller-provided) ---------- */

export type SafeDocument = {
  id: string;
  title: string;
  category?: string;
  type?: string;
  uploadedBy?: string;
  updatedAt?: string;
  hasFullText?: boolean;
};

export type SafeMember = {
  id: string;
  name: string;
  company?: string;
  memberCode?: string;
  industry?: string;
  region?: string;
  level?: string;
  status?: string;
};

export type FeeAggregate = {
  expected?: number;
  collected?: number;
  outstanding?: number;
  overdue?: number;
  dueSoon?: number;
  recentPaid?: number;
  collectionRate?: number;
};

export type OwnFeeSummary = {
  status?: string;
  amountDue?: number;
  dueDate?: string;
};

export type SafeEvent = {
  id: string;
  title: string;
  date?: string;
  registrations?: number;
  isUpcoming?: boolean;
};

export type SafeListing = {
  id: string;
  title: string;
  category?: string;
  owner?: string;
  interestCount?: number;
  isMine?: boolean;
  updatedAt?: string;
};

export type SafeNotification = {
  id: string;
  title: string;
  category?: string;
  read?: boolean;
  route?: string;
  updatedAt?: string;
};

export type ExecutiveMetrics = {
  members?: number;
  fees?: number;
  events?: number;
  opportunities?: number;
  notifications?: number;
};

export type DataSnapshot = {
  documents?: SafeDocument[];
  members?: SafeMember[];
  fees?: FeeAggregate;
  myFee?: OwnFeeSummary;
  events?: SafeEvent[];
  marketplace?: SafeListing[];
  notifications?: SafeNotification[];
  executive?: ExecutiveMetrics;
};

const isAdminLike = (p: PermissionLevel) => p === "admin" || p === "moderator" || p === "platform";

function empty(): ProviderResult {
  return { sources: [], metrics: {}, limitations: [], suggestedActions: [] };
}

/* ---------- Providers ---------- */

export function documentProvider(data: SafeDocument[] | undefined): ProviderResult {
  const res = empty();
  if (!data || data.length === 0) {
    res.limitations.push("Chưa có tài liệu nào trong phạm vi quyền truy cập của bạn.");
    return res;
  }
  const anyFullText = data.some((d) => d.hasFullText);
  if (!anyFullText) {
    res.limitations.push("Hiện hệ thống chỉ có metadata tài liệu, chưa có nội dung toàn văn.");
  }
  res.metrics = { total: data.length };
  res.sources = data.slice(0, 8).map((d) => ({
    id: d.id,
    type: "document",
    title: d.title,
    subtitle: [d.category, d.type].filter(Boolean).join(" · ") || undefined,
    route: "/documents",
    safeSummary: d.hasFullText ? undefined : "Chỉ có metadata (tiêu đề, loại, ngày).",
    updatedAt: d.updatedAt,
  }));
  res.suggestedActions = [{ label: "Mở Trung tâm tài liệu", route: "/documents" }];
  return res;
}

export function memberProvider(
  data: SafeMember[] | undefined,
  permission: PermissionLevel,
): ProviderResult {
  const res = empty();
  if (!data || data.length === 0) {
    res.limitations.push("Chưa có hội viên nào trong phạm vi quyền truy cập của bạn.");
    return res;
  }
  if (!isAdminLike(permission)) {
    res.limitations.push(
      "Chỉ hiển thị thông tin danh bạ công khai; thông tin liên hệ riêng tư không được hiển thị.",
    );
  }
  res.metrics = { total: data.length };
  res.sources = data.slice(0, 12).map((m) => ({
    id: m.id,
    type: "member",
    title: m.company ? `${m.name} — ${m.company}` : m.name,
    subtitle: [m.industry, m.region, m.level].filter(Boolean).join(" · ") || undefined,
    route: "/members",
    safeSummary: m.status ? `Trạng thái: ${m.status}` : undefined,
  }));
  res.suggestedActions = [
    { label: "Mở Danh bạ hội viên", route: "/members" },
    { label: "Phân nhóm", route: "/segments" },
  ];
  return res;
}

export function networkingProvider(members: SafeMember[] | undefined): ProviderResult {
  const res = empty();
  if (!members || members.length === 0) {
    res.limitations.push("Chưa đủ dữ liệu hội viên để gợi ý kết nối.");
    return res;
  }
  res.limitations.push("Gợi ý kết nối dựa trên ngành/khu vực; không có điểm khớp giả định.");
  res.metrics = { candidates: members.length };
  res.sources = members.slice(0, 6).map((m) => ({
    id: m.id,
    type: "member",
    title: m.company ? `${m.name} — ${m.company}` : m.name,
    subtitle: [m.industry, m.region].filter(Boolean).join(" · ") || undefined,
    route: "/network",
  }));
  res.suggestedActions = [
    { label: "Mở Kết nối", route: "/network" },
    { label: "Xem cơ hội", route: "/opportunities" },
  ];
  return res;
}

export function feeProvider(
  data: FeeAggregate | undefined,
  myFee: OwnFeeSummary | undefined,
  permission: PermissionLevel,
): ProviderResult {
  const res = empty();
  if (isAdminLike(permission)) {
    if (!data) {
      res.limitations.push("Chưa có dữ liệu hội phí tổng hợp.");
      return res;
    }
    res.metrics = {
      ...(data.expected != null ? { expected: data.expected } : {}),
      ...(data.collected != null ? { collected: data.collected } : {}),
      ...(data.outstanding != null ? { outstanding: data.outstanding } : {}),
      ...(data.overdue != null ? { overdue: data.overdue } : {}),
      ...(data.dueSoon != null ? { dueSoon: data.dueSoon } : {}),
      ...(data.recentPaid != null ? { recentPaid: data.recentPaid } : {}),
      ...(data.collectionRate != null ? { collectionRate: `${data.collectionRate}%` } : {}),
    };
    res.suggestedActions = [
      { label: "Mở Trung tâm hội phí", route: "/fees" },
      { label: "Xem gia hạn", route: "/renewal" },
    ];
    res.limitations.push(
      "Chỉ hiển thị số liệu tổng hợp; không hiển thị chi tiết thanh toán cá nhân.",
    );
    return res;
  }
  // Member: only own summary if it exists.
  if (myFee) {
    res.metrics = {
      ...(myFee.status ? { status: myFee.status } : {}),
      ...(myFee.amountDue != null ? { amountDue: myFee.amountDue } : {}),
      ...(myFee.dueDate ? { dueDate: myFee.dueDate } : {}),
    };
    res.suggestedActions = [{ label: "Xem hội phí của tôi", route: "/renewal" }];
    return res;
  }
  res.limitations.push(
    "Bạn chưa có quyền xem số liệu hội phí tổng hợp; chỉ có thể xem hội phí của chính mình.",
  );
  return res;
}

export function eventProvider(data: SafeEvent[] | undefined): ProviderResult {
  const res = empty();
  if (!data || data.length === 0) {
    res.limitations.push("Chưa có sự kiện nào trong phạm vi quyền truy cập của bạn.");
    return res;
  }
  const upcoming = data.filter((e: any) => e.isUpcoming);
  res.metrics = { total: data.length, upcoming: upcoming.length };
  res.sources = (upcoming.length > 0 ? upcoming : data).slice(0, 8).map((e: any) => ({
    id: e.id,
    type: "event",
    title: e.title,
    subtitle: e.date,
    route: "/events",
    safeSummary: e.registrations != null ? `${e.registrations} đăng ký` : undefined,
    updatedAt: e.date,
  }));
  res.suggestedActions = [{ label: "Mở Sự kiện", route: "/events" }];
  return res;
}

export function marketplaceProvider(data: SafeListing[] | undefined): ProviderResult {
  const res = empty();
  if (!data || data.length === 0) {
    res.limitations.push("Chưa có tin đăng nào trong phạm vi quyền truy cập của bạn.");
    return res;
  }
  res.metrics = {
    total: data.length,
    mine: data.filter((l: any) => l.isMine).length,
  };
  res.sources = data.slice(0, 8).map((l: any) => ({
    id: l.id,
    type: "marketplace",
    title: l.title,
    subtitle: [l.category, l.owner].filter(Boolean).join(" · ") || undefined,
    route: "/marketplace",
    safeSummary: l.interestCount != null ? `${l.interestCount} quan tâm` : undefined,
    updatedAt: l.updatedAt,
  }));
  res.suggestedActions = [
    { label: "Mở Marketplace", route: "/marketplace" },
    { label: "Không gian của tôi", route: "/marketplace/workspace" },
  ];
  return res;
}

export function notificationProvider(data: SafeNotification[] | undefined): ProviderResult {
  const res = empty();
  if (!data || data.length === 0) {
    res.limitations.push("Không có thông báo nào trong phạm vi quyền truy cập của bạn.");
    return res;
  }
  const unread = data.filter((n) => !n.read);
  res.metrics = { total: data.length, unread: unread.length };
  res.sources = data.slice(0, 8).map((n: any) => ({
    id: n.id,
    type: "notification",
    title: n.title,
    subtitle: n.category,
    route: n.route ?? "/notifications",
    updatedAt: n.updatedAt,
  }));
  res.suggestedActions = [{ label: "Mở Thông báo", route: "/notifications" }];
  return res;
}

export function executiveProvider(
  data: ExecutiveMetrics | undefined,
  permission: PermissionLevel,
): ProviderResult {
  const res = empty();
  if (!isAdminLike(permission)) {
    res.limitations.push("Báo cáo điều hành chỉ dành cho quản trị viên / ban điều hành.");
    return res;
  }
  if (!data) {
    res.limitations.push("Chưa có số liệu điều hành tổng hợp.");
    return res;
  }
  res.metrics = {
    ...(data.members != null ? { members: data.members } : {}),
    ...(data.fees != null ? { fees: data.fees } : {}),
    ...(data.events != null ? { events: data.events } : {}),
    ...(data.opportunities != null ? { opportunities: data.opportunities } : {}),
    ...(data.notifications != null ? { notifications: data.notifications } : {}),
  };
  res.limitations.push("Chỉ hiển thị số liệu tổng hợp phục vụ điều hành.");
  res.suggestedActions = [
    { label: "Mở Bảng điều hành", route: "/" },
    { label: "Báo cáo tài chính", route: "/finance-report" },
  ];
  return res;
}

export function announcementProvider(): ProviderResult {
  const res = empty();
  res.limitations.push(
    "Đây là bối cảnh để soạn thảo; bản nháp cần được kiểm tra trước khi gửi. Hệ thống không tự gửi.",
  );
  res.suggestedActions = [{ label: "Mở Thông báo", route: "/notifications" }];
  return res;
}

/** Route a capability to its provider using the given snapshot + permission. */
export function runProvider(
  capability: AiCapability,
  data: DataSnapshot,
  permission: PermissionLevel,
): ProviderResult {
  switch (capability) {
    case "document_qa":
      return documentProvider(data.documents);
    case "member_search":
      return memberProvider(data.members, permission);
    case "networking":
      return networkingProvider(data.members);
    case "fee_analysis":
      return feeProvider(data.fees, data.myFee, permission);
    case "event_summary":
      return eventProvider(data.events);
    case "marketplace":
      return marketplaceProvider(data.marketplace);
    case "notification_summary":
      return notificationProvider(data.notifications);
    case "executive_report":
      return executiveProvider(data.executive, permission);
    case "announcement_draft":
      return announcementProvider();
    case "general":
    default: {
      const res = empty();
      res.limitations.push(
        "Chưa xác định rõ năng lực phù hợp; vui lòng nêu cụ thể hơn (tài liệu, hội viên, hội phí, sự kiện…).",
      );
      return res;
    }
  }
}

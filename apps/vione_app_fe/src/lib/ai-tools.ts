import {
  UserSquare,
  Megaphone,
  Users,
  FileSearch,
  Wallet,
  FileBarChart,
  Handshake,
  Store,
  Calendar,
  ClipboardList,
  IdCard,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CapabilityId, CapabilityRole } from "@/lib/ai-capabilities";

/**
 * AI Tool Registry & Action Engine — Phase 10, Step 7.
 *
 * Client-safe, deterministic registry describing what ACTIONS the assistant may
 * propose. It does NOT execute anything automatically. Flow is always:
 *   understand → plan → propose (Action Card) → user confirms → execute.
 *
 * MVP safety rules (enforced here):
 * - Every tool is READ-ONLY. The only side effect allowed is navigation
 *   (opening an existing in-app route the user already has access to).
 * - No mutation tools (delete/approve/reject/send/notify/mark-paid/publish).
 * - Sensitive verbs (export/generate) require explicit confirmation before the
 *   assistant navigates the user to the module where they perform it manually.
 * - Permission is checked (role + capability) before a tool is offered; if not
 *   permitted it renders disabled with an explanation. Real access is still
 *   enforced server-side by RLS — this registry only decides what to *offer*.
 */

export type ToolKind = "navigate" | "search" | "generate" | "export";

/** Rank order for role gating (mirror of ai-capabilities ROLE_RANK). */
const ROLE_RANK: Record<CapabilityRole, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
};

export type AiToolContext = {
  /** Resolved user role rank (see userRoleRank in ai-capabilities). */
  rank: number;
  /** Whether an association is currently selected/active. */
  hasAssociation?: boolean;
};

export type ToolAvailability = {
  allowed: boolean;
  /** Vietnamese explanation shown when disabled. */
  reason?: string;
};

export type AiTool = {
  id: string;
  name: string;
  description: string;
  capability: CapabilityId;
  kind: ToolKind;
  /** Minimum role required to see/use this tool. */
  requiredRole: CapabilityRole;
  /** Optional named permission (documentation + future server check). */
  requiredPermission?: string;
  /** Confirmation required before execution (export/generate/etc.). */
  requiresConfirmation: boolean;
  /** Real, existing in-app route this tool opens. */
  route: string;
  icon: LucideIcon;
  /** Read-only MVP flag — always true in this phase. */
  readOnly: boolean;
  /** Future natural-language description for the LLM tool schema. */
  aiDescription: string;
};

export const AI_TOOLS: AiTool[] = [
  {
    id: "OpenMemberProfile",
    name: "Mở hồ sơ hội viên",
    description: "Mở danh bạ hội viên để xem hồ sơ chi tiết.",
    capability: "member",
    kind: "navigate",
    requiredRole: "member",
    requiresConfirmation: false,
    route: "/members",
    icon: UserSquare,
    readOnly: true,
    aiDescription: "Navigate to the member directory to open a member profile.",
  },
  {
    id: "SearchMembers",
    name: "Tìm kiếm hội viên",
    description: "Tìm hội viên theo ngành, khu vực hoặc cấp độ.",
    capability: "member",
    kind: "search",
    requiredRole: "member",
    requiresConfirmation: false,
    route: "/members",
    icon: Users,
    readOnly: true,
    aiDescription: "Search members by industry, region or level within permitted scope.",
  },
  {
    id: "CreateAnnouncementDraft",
    name: "Tạo bản nháp thông báo",
    description: "Soạn bản nháp thông báo (cần kiểm tra trước khi gửi).",
    capability: "announcement",
    kind: "generate",
    requiredRole: "moderator",
    requiredPermission: "announcement.draft",
    requiresConfirmation: true,
    route: "/notifications",
    icon: Megaphone,
    readOnly: true,
    aiDescription: "Generate an announcement draft. Never sends; requires human review.",
  },
  {
    id: "SearchDocuments",
    name: "Tìm tài liệu",
    description: "Tra cứu tài liệu trong phạm vi quyền xem của bạn.",
    capability: "document",
    kind: "search",
    requiredRole: "member",
    requiresConfirmation: false,
    route: "/documents",
    icon: FileSearch,
    readOnly: true,
    aiDescription: "Search permitted documents by title, category and date.",
  },
  {
    id: "OpenFeeCenter",
    name: "Mở Trung tâm hội phí",
    description: "Xem tổng quan tình hình hội phí.",
    capability: "fee",
    kind: "navigate",
    requiredRole: "moderator",
    requiresConfirmation: false,
    route: "/fees",
    icon: Wallet,
    readOnly: true,
    aiDescription: "Open the fee center to review aggregate fee status.",
  },
  {
    id: "ExportFeeReport",
    name: "Xuất báo cáo hội phí",
    description: "Mở báo cáo tài chính để xuất dữ liệu tổng hợp.",
    capability: "fee",
    kind: "export",
    requiredRole: "admin",
    requiredPermission: "fee.export",
    requiresConfirmation: true,
    route: "/finance-report",
    icon: FileBarChart,
    readOnly: true,
    aiDescription: "Open the finance report page to export aggregate fee data.",
  },
  {
    id: "CreateOpportunity",
    name: "Mở tạo cơ hội",
    description: "Mở khu vực cơ hội hợp tác / kết nối.",
    capability: "networking",
    kind: "navigate",
    requiredRole: "member",
    requiresConfirmation: false,
    route: "/opportunities",
    icon: Handshake,
    readOnly: true,
    aiDescription: "Navigate to opportunities to create a networking opportunity.",
  },
  {
    id: "OpenMarketplace",
    name: "Mở Marketplace",
    description: "Xem các tin đăng và cơ hội trên Marketplace.",
    capability: "marketplace",
    kind: "navigate",
    requiredRole: "member",
    requiresConfirmation: false,
    route: "/marketplace",
    icon: Store,
    readOnly: true,
    aiDescription: "Open the marketplace listings.",
  },
  {
    id: "OpenEvent",
    name: "Mở sự kiện",
    description: "Xem danh sách sự kiện và lịch tổ chức.",
    capability: "event",
    kind: "navigate",
    requiredRole: "member",
    requiresConfirmation: false,
    route: "/events",
    icon: Calendar,
    readOnly: true,
    aiDescription: "Open the events list.",
  },
  {
    id: "ExportAttendees",
    name: "Xuất danh sách tham dự",
    description: "Mở trang đăng ký sự kiện để xuất danh sách tham dự.",
    capability: "event",
    kind: "export",
    requiredRole: "moderator",
    requiredPermission: "event.export",
    requiresConfirmation: true,
    route: "/event-registrations",
    icon: ClipboardList,
    readOnly: true,
    aiDescription: "Open event registrations to export the attendee list.",
  },
  {
    id: "GenerateMemberCard",
    name: "Tạo thẻ hội viên",
    description: "Mở khu vực thẻ hội viên để tạo/hiển thị thẻ.",
    capability: "member",
    kind: "generate",
    requiredRole: "member",
    requiresConfirmation: true,
    route: "/members",
    icon: IdCard,
    readOnly: true,
    aiDescription: "Generate a member card for a selected member.",
  },
  {
    id: "OpenNotifications",
    name: "Mở thông báo",
    description: "Xem trung tâm thông báo của bạn.",
    capability: "notification",
    kind: "navigate",
    requiredRole: "member",
    requiresConfirmation: false,
    route: "/notifications",
    icon: Bell,
    readOnly: true,
    aiDescription: "Open the notifications center.",
  },
];

export function getTool(id: string): AiTool | undefined {
  return AI_TOOLS.find((t) => t.id === id);
}

/** All tools declared for a given capability. */
export function getToolsForCapability(capId: CapabilityId): AiTool[] {
  return AI_TOOLS.filter((t) => t.capability === capId);
}

/**
 * Permission gate. Decides whether a tool may be *offered/executed* in the UI.
 * Real data access is always re-checked server-side by RLS.
 */
export function canExecuteTool(tool: AiTool, ctx: AiToolContext): ToolAvailability {
  if (ctx.hasAssociation === false) {
    return { allowed: false, reason: "Chưa chọn hiệp hội" };
  }
  if (ctx.rank < ROLE_RANK[tool.requiredRole]) {
    const roleLabel =
      tool.requiredRole === "admin"
        ? "quản trị viên"
        : tool.requiredRole === "moderator"
          ? "điều hành viên"
          : "hội viên";
    return { allowed: false, reason: `Cần quyền ${roleLabel}` };
  }
  return { allowed: true };
}

export type ActionPlanStep = {
  order: number;
  label: string;
  toolId?: string;
};

export type ActionPlan = {
  capability: CapabilityId;
  /** Ordered, human-readable plan (Vietnamese). */
  steps: ActionPlanStep[];
  /** Tools proposed for this request, in offer order. */
  tools: AiTool[];
};

/**
 * Deterministic action planning (NO LLM). Given a capability and the raw
 * message, produce an ordered plan and the tools to propose. Only permitted
 * tools are marked executable; disabled ones still appear with a reason so the
 * user understands why an action is unavailable.
 */
export function planActions(capId: CapabilityId, message: string, ctx: AiToolContext): ActionPlan {
  const lower = message.toLowerCase();
  const wantsExport = /(xuất|export|tải|download|csv|excel)/.test(lower);

  let tools = getToolsForCapability(capId);
  // If the user did not ask to export, de-prioritise export tools but still
  // offer them (disabled state handled by permission gate at render time).
  tools = [...tools].sort((a, b) => {
    const aExport = a.kind === "export" ? 1 : 0;
    const bExport = b.kind === "export" ? 1 : 0;
    if (wantsExport) return bExport - aExport; // exports first
    return aExport - bExport; // exports last
  });

  const steps: ActionPlanStep[] = [];
  let order = 1;
  const searchTool = tools.find((t) => t.kind === "search");
  const exportTool = tools.find((t) => t.kind === "export");
  const navTool = tools.find((t) => t.kind === "navigate");
  const genTool = tools.find((t) => t.kind === "generate");

  if (searchTool) {
    steps.push({ order: order++, label: `Tìm kiếm dữ liệu liên quan`, toolId: searchTool.id });
  }
  if (wantsExport && exportTool) {
    steps.push({
      order: order++,
      label: `Chuẩn bị xuất dữ liệu (cần xác nhận)`,
      toolId: exportTool.id,
    });
  }
  if (genTool && !wantsExport) {
    steps.push({ order: order++, label: `Soạn bản nháp (cần xác nhận)`, toolId: genTool.id });
  }
  if (navTool) {
    steps.push({ order: order++, label: `Mở màn hình liên quan`, toolId: navTool.id });
  }
  if (steps.length === 0 && tools[0]) {
    steps.push({ order: order++, label: `Mở màn hình liên quan`, toolId: tools[0].id });
  }

  // Silence unused ctx lint while keeping the signature future-proof.
  void ctx;

  return { capability: capId, steps, tools };
}

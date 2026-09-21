import {
  Users,
  FileSpreadsheet,
  Wallet,
  CalendarClock,
  Handshake,
  FileBarChart,
  BookOpenCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CapabilityId, CapabilityRole } from "@/lib/ai-capabilities";
import { getTool, type AiTool, type ToolAvailability } from "@/lib/ai-tools";

/**
 * Enterprise AI Workflow Engine — Phase 10, Step 8.
 *
 * Human-in-the-loop workflow orchestration. The AI plans and previews a
 * multi-step business workflow, but NEVER executes protected/destructive steps
 * automatically. Flow is always:
 *   understand → plan → build workflow → preview → confirm → execute → report.
 *
 * MVP safety rules (enforced here):
 * - No destructive execution. This module defines/orchestrates workflows and
 *   simulates read/analyze/generate/navigate steps; it performs no mutations.
 * - Protected step types (EXPORT/SEND/DELETE/APPROVE) always require explicit
 *   user confirmation before running.
 * - History is session-only (managed by the UI); nothing is persisted.
 * - Real data access is still enforced server-side by RLS.
 */

/* ----------------------------- Step taxonomy ----------------------------- */

export type WorkflowStepType =
  | "READ"
  | "SEARCH"
  | "ANALYZE"
  | "GENERATE"
  | "NAVIGATE"
  | "EXPORT"
  | "SEND"
  | "DELETE"
  | "APPROVE";

/** Step types that run automatically (safe, read-only). */
export const AUTOMATIC_STEP_TYPES: WorkflowStepType[] = [
  "READ",
  "SEARCH",
  "ANALYZE",
  "GENERATE",
  "NAVIGATE",
];

/** Step types that MUST be confirmed by a human before running. */
export const CONFIRMATION_STEP_TYPES: WorkflowStepType[] = ["EXPORT", "SEND", "DELETE", "APPROVE"];

export function stepRequiresConfirmation(type: WorkflowStepType): boolean {
  return CONFIRMATION_STEP_TYPES.includes(type);
}

/* ----------------------------- Definitions ------------------------------- */

export type AiWorkflowStep = {
  id: string;
  type: WorkflowStepType;
  /** Optional tool from the tool registry backing this step. */
  toolId?: string;
  title: string;
  description: string;
  /** Rough estimate in seconds (for the preview UI). */
  estimatedDuration: number;
  requiresConfirmation: boolean;
};

export type ConfirmationPolicy = "auto" | "per-protected-step" | "final";

export type AiWorkflow = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  supportedCapabilities: CapabilityId[];
  requiredRole: CapabilityRole;
  requiredPermissions: string[];
  steps: AiWorkflowStep[];
  confirmationPolicy: ConfirmationPolicy;
  /** Keywords used for deterministic workflow matching (no LLM). */
  triggers: string[];
};

const step = (
  id: string,
  type: WorkflowStepType,
  title: string,
  description: string,
  estimatedDuration: number,
  toolId?: string,
): AiWorkflowStep => ({
  id,
  type,
  toolId,
  title,
  description,
  estimatedDuration,
  requiresConfirmation: stepRequiresConfirmation(type),
});

export const AI_WORKFLOWS: AiWorkflow[] = [
  {
    id: "member-list",
    name: "Tìm & mở danh sách hội viên",
    description: "Tìm hội viên theo tiêu chí rồi mở danh sách để xem chi tiết.",
    icon: Users,
    supportedCapabilities: ["member"],
    requiredRole: "member",
    requiredPermissions: [],
    confirmationPolicy: "per-protected-step",
    triggers: ["danh sách hội viên", "tìm hội viên", "hội viên ngành", "danh bạ"],
    steps: [
      step(
        "search",
        "SEARCH",
        "Tìm hội viên",
        "Tìm hội viên phù hợp trong phạm vi quyền.",
        2,
        "SearchMembers",
      ),
      step(
        "open",
        "NAVIGATE",
        "Mở danh sách hội viên",
        "Mở danh bạ để xem chi tiết.",
        1,
        "OpenMemberProfile",
      ),
    ],
  },
  {
    id: "member-export",
    name: "Xuất danh sách hội viên (CSV)",
    description: "Tìm hội viên, tạo bản xem trước CSV rồi mở trang xuất.",
    icon: FileSpreadsheet,
    supportedCapabilities: ["member"],
    requiredRole: "moderator",
    requiredPermissions: ["member.export"],
    confirmationPolicy: "per-protected-step",
    triggers: [
      "xuất hội viên",
      "export hội viên",
      "csv hội viên",
      "tải danh sách hội viên",
      "xuất danh sách",
    ],
    steps: [
      step("search", "SEARCH", "Tìm hội viên", "Lọc hội viên theo tiêu chí.", 2, "SearchMembers"),
      step(
        "preview",
        "GENERATE",
        "Tạo bản xem trước CSV",
        "Chuẩn bị dữ liệu xuất (chỉ trường an toàn).",
        2,
      ),
      step(
        "export",
        "EXPORT",
        "Mở trang xuất",
        "Mở màn hình xuất để tải dữ liệu.",
        1,
        "ExportFeeReport",
      ),
    ],
  },
  {
    id: "fee-reminder",
    name: "Nhắc hội viên chưa đóng hội phí",
    description: "Tìm công nợ, soạn bản nháp nhắc và xem trước danh sách nhận.",
    icon: Wallet,
    supportedCapabilities: ["fee"],
    requiredRole: "moderator",
    requiredPermissions: ["fee.read"],
    confirmationPolicy: "per-protected-step",
    triggers: ["chưa đóng hội phí", "nhắc hội phí", "công nợ", "quá hạn", "nhắc đóng phí"],
    steps: [
      step(
        "find",
        "SEARCH",
        "Tìm khoản chưa đóng",
        "Tổng hợp công nợ theo phạm vi quyền.",
        2,
        "OpenFeeCenter",
      ),
      step(
        "draft",
        "GENERATE",
        "Soạn bản nháp nhắc",
        "Tạo nội dung nhắc (chưa gửi).",
        2,
        "CreateAnnouncementDraft",
      ),
      step(
        "audience",
        "ANALYZE",
        "Xem trước danh sách nhận",
        "Kiểm tra đối tượng nhận trước khi gửi.",
        1,
      ),
    ],
  },
  {
    id: "event-invitation",
    name: "Mời tham dự sự kiện sắp tới",
    description: "Chọn sự kiện, soạn lời mời và xem trước thông báo.",
    icon: CalendarClock,
    supportedCapabilities: ["event"],
    requiredRole: "moderator",
    requiredPermissions: [],
    confirmationPolicy: "per-protected-step",
    triggers: ["mời sự kiện", "lời mời", "sự kiện sắp tới", "mời tham dự"],
    steps: [
      step("event", "READ", "Chọn sự kiện sắp tới", "Lấy sự kiện sắp diễn ra.", 1, "OpenEvent"),
      step(
        "invite",
        "GENERATE",
        "Soạn lời mời",
        "Tạo bản nháp lời mời (chưa gửi).",
        2,
        "CreateAnnouncementDraft",
      ),
      step("preview", "ANALYZE", "Xem trước thông báo", "Kiểm tra nội dung thông báo.", 1),
    ],
  },
  {
    id: "marketplace-match",
    name: "Gợi ý kết nối từ Marketplace",
    description: "Tìm tin đăng, tìm hội viên phù hợp và soạn gợi ý kết nối.",
    icon: Handshake,
    supportedCapabilities: ["marketplace", "networking"],
    requiredRole: "member",
    requiredPermissions: [],
    confirmationPolicy: "per-protected-step",
    triggers: ["marketplace", "gợi ý kết nối", "tìm đối tác", "hợp tác", "cơ hội"],
    steps: [
      step(
        "listing",
        "SEARCH",
        "Tìm tin Marketplace",
        "Tìm tin đăng phù hợp.",
        2,
        "OpenMarketplace",
      ),
      step(
        "members",
        "SEARCH",
        "Tìm hội viên phù hợp",
        "Đối chiếu ngành/khu vực.",
        2,
        "SearchMembers",
      ),
      step(
        "draft",
        "GENERATE",
        "Soạn gợi ý kết nối",
        "Tạo đề xuất kết nối (chưa gửi).",
        2,
        "CreateOpportunity",
      ),
    ],
  },
  {
    id: "executive-report",
    name: "Báo cáo điều hành hằng tuần",
    description: "Thu thập KPI, tạo tóm tắt và xem trước báo cáo.",
    icon: FileBarChart,
    supportedCapabilities: ["executive"],
    requiredRole: "admin",
    requiredPermissions: ["executive.read"],
    confirmationPolicy: "per-protected-step",
    triggers: ["báo cáo tuần", "báo cáo điều hành", "kpi", "tổng quan tuần", "báo cáo chủ tịch"],
    steps: [
      step("kpi", "ANALYZE", "Thu thập KPI", "Tổng hợp chỉ số (chỉ số liệu tổng hợp).", 2),
      step("summary", "GENERATE", "Tạo tóm tắt", "Soạn tóm tắt điều hành.", 2),
      step("preview", "ANALYZE", "Xem trước báo cáo", "Kiểm tra báo cáo trước khi dùng.", 1),
    ],
  },
  {
    id: "document-summary",
    name: "Tóm tắt tài liệu",
    description: "Tìm tài liệu, thu thập nguồn và tạo tóm tắt.",
    icon: BookOpenCheck,
    supportedCapabilities: ["document"],
    requiredRole: "member",
    requiredPermissions: [],
    confirmationPolicy: "per-protected-step",
    triggers: ["tóm tắt tài liệu", "tìm tài liệu", "văn bản", "quy chế", "tài liệu"],
    steps: [
      step(
        "search",
        "SEARCH",
        "Tìm tài liệu",
        "Tìm tài liệu theo phạm vi quyền.",
        2,
        "SearchDocuments",
      ),
      step("collect", "READ", "Thu thập nguồn", "Đọc metadata các tài liệu liên quan.", 1),
      step("summary", "GENERATE", "Tạo tóm tắt", "Tóm tắt theo nội dung được phép truy cập.", 2),
    ],
  },
];

export function getWorkflow(id: string): AiWorkflow | undefined {
  return AI_WORKFLOWS.find((w) => w.id === id);
}

export function workflowsForCapability(capId: CapabilityId): AiWorkflow[] {
  return AI_WORKFLOWS.filter((w) => w.supportedCapabilities.includes(capId));
}

/* ----------------------------- Run state machine ------------------------- */

export type StepStatus =
  | "pending"
  | "running"
  | "awaiting-confirmation"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

export type WorkflowOutcome = "running" | "completed" | "cancelled" | "failed" | "paused";

export type RunStep = {
  step: AiWorkflowStep;
  status: StepStatus;
  availability: ToolAvailability;
  tool?: AiTool;
  error?: string;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  name: string;
  steps: RunStep[];
  outcome: WorkflowOutcome;
  startedAt: number;
  finishedAt?: number;
};

const ROLE_RANK: Record<CapabilityRole, number> = { member: 0, moderator: 1, admin: 2 };

export type WorkflowRunContext = {
  rank: number;
  hasAssociation?: boolean;
};

function stepAvailability(
  wf: AiWorkflow,
  s: AiWorkflowStep,
  ctx: WorkflowRunContext,
): ToolAvailability {
  if (ctx.hasAssociation === false) return { allowed: false, reason: "Chưa chọn hiệp hội" };
  if (ctx.rank < ROLE_RANK[wf.requiredRole]) {
    const roleLabel =
      wf.requiredRole === "admin"
        ? "quản trị viên"
        : wf.requiredRole === "moderator"
          ? "điều hành viên"
          : "hội viên";
    return { allowed: false, reason: `Cần quyền ${roleLabel}` };
  }
  return { allowed: true };
}

/** Build an initial (all-pending) run for a workflow. */
export function initWorkflowRun(
  wf: AiWorkflow,
  ctx: WorkflowRunContext,
  runId: string,
): WorkflowRun {
  return {
    id: runId,
    workflowId: wf.id,
    name: wf.name,
    startedAt: Date.now(),
    outcome: "running",
    steps: wf.steps.map((s) => ({
      step: s,
      status: "pending",
      availability: stepAvailability(wf, s, ctx),
      tool: s.toolId ? getTool(s.toolId) : undefined,
    })),
  };
}

function recompute(run: WorkflowRun): WorkflowRun {
  const anyFailed = run.steps.some((s) => s.status === "failed");
  const awaiting = run.steps.some((s) => s.status === "awaiting-confirmation");
  const allDone = run.steps.every((s) => ["succeeded", "skipped", "cancelled"].includes(s.status));
  let outcome: WorkflowOutcome = run.outcome;
  if (run.outcome !== "cancelled") {
    if (anyFailed) outcome = "paused";
    else if (awaiting) outcome = "paused";
    else if (allDone) outcome = "completed";
    else outcome = "running";
  }
  return {
    ...run,
    outcome,
    finishedAt: outcome === "completed" || outcome === "cancelled" ? Date.now() : run.finishedAt,
  };
}

/**
 * Advance the run through automatic steps. Stops when it reaches a protected
 * step (awaiting-confirmation), a permission-denied step (failed → paused), or
 * the end (completed). Pure — returns a new run.
 */
export function advanceRun(run: WorkflowRun): WorkflowRun {
  if (run.outcome === "cancelled" || run.outcome === "completed") return run;
  const steps = run.steps.map((s) => ({ ...s }));

  for (const rs of steps) {
    if (["succeeded", "skipped", "cancelled"].includes(rs.status)) continue;

    if (!rs.availability.allowed) {
      rs.status = "failed";
      rs.error = rs.availability.reason ?? "Không có quyền thực hiện bước này.";
      break;
    }
    if (rs.step.requiresConfirmation) {
      rs.status = "awaiting-confirmation";
      break;
    }
    // Automatic, permitted step: mark done (read-only simulation).
    rs.status = "succeeded";
  }

  return recompute({ ...run, steps });
}

/** Confirm the currently awaiting protected step, then continue automatically. */
export function confirmStep(run: WorkflowRun, stepId: string): WorkflowRun {
  const steps = run.steps.map((s) =>
    s.step.id === stepId && s.status === "awaiting-confirmation"
      ? { ...s, status: "succeeded" as StepStatus }
      : { ...s },
  );
  return advanceRun(recompute({ ...run, steps }));
}

/** Skip a failed or awaiting step and continue. */
export function skipStep(run: WorkflowRun, stepId: string): WorkflowRun {
  const steps = run.steps.map((s) =>
    s.step.id === stepId && (s.status === "failed" || s.status === "awaiting-confirmation")
      ? { ...s, status: "skipped" as StepStatus, error: undefined }
      : { ...s },
  );
  return advanceRun(recompute({ ...run, steps }));
}

/** Retry a failed step (re-evaluates and continues). */
export function retryStep(run: WorkflowRun, stepId: string): WorkflowRun {
  const steps = run.steps.map((s) =>
    s.step.id === stepId && s.status === "failed"
      ? { ...s, status: "pending" as StepStatus, error: undefined }
      : { ...s },
  );
  return advanceRun(recompute({ ...run, steps }));
}

/** Cancel the whole run. */
export function cancelRun(run: WorkflowRun): WorkflowRun {
  const steps = run.steps.map((s) =>
    ["succeeded", "skipped"].includes(s.status)
      ? { ...s }
      : { ...s, status: "cancelled" as StepStatus },
  );
  return { ...run, steps, outcome: "cancelled", finishedAt: Date.now() };
}

export function totalEstimatedDuration(wf: AiWorkflow): number {
  return wf.steps.reduce((sum, s) => sum + s.estimatedDuration, 0);
}

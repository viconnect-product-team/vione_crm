/**
 * ViOne Platform - Business Status Enums
 */

export enum ConnectionStatus {
  NONE = "none",
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  BLOCKED = "blocked",
}

export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEWING = "reviewing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum MeetingStatus {
  PROPOSED = "proposed",
  CONFIRMED = "confirmed",
  RESCHEDULED = "rescheduled",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum DealStage {
  LEAD = "lead",
  PROSPECT = "prospect",
  NEGOTIATING = "negotiating",
  PROPOSAL_SENT = "proposal_sent",
  CONTRACT_SIGNED = "contract_signed",
  LOST = "lost",
}

export enum ApprovalStatus {
  DRAFT = "draft",
  PENDING_CHECKER = "pending_checker",
  PENDING_APPROVER = "pending_approver",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum AttendanceStatus {
  ON_TIME = "on_time",
  LATE = "late",
  EARLY_LEAVE = "early_leave",
  ABSENT = "absent",
}

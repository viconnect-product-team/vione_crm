// BC-3.1F — Abuse controls & notification DTOs (client-safe).
// Additive to the frozen BC-3.0 networking domain. No PII beyond public
// business-card projections; report rows never expose reporter identity to the
// reported user (enforced by RLS).

import type { CounterpartSummary } from "./types";

export const GN_REPORT_CATEGORIES = [
  "spam",
  "harassment",
  "impersonation",
  "inappropriate",
  "other",
] as const;
export type GnReportCategory = (typeof GN_REPORT_CATEGORIES)[number];

export const GN_REPORT_STATUSES = ["open", "reviewing", "actioned", "dismissed"] as const;
export type GnReportStatus = (typeof GN_REPORT_STATUSES)[number];

export type ReportUserInput = {
  reportedUserId: string;
  category: GnReportCategory;
  details?: string;
  connectionId?: string | null;
};

export const GN_NOTIFICATION_TYPES = [
  "connection_request",
  "connection_accepted",
  "connection_status_update",
] as const;
export type GnNotificationType = (typeof GN_NOTIFICATION_TYPES)[number];

/** Viewer-safe networking notification. `actor` is a PUBLIC card projection only. */
export type GnNotificationDTO = {
  id: string;
  type: GnNotificationType;
  connectionId: string | null;
  actor: CounterpartSummary | null;
  read: boolean;
  createdAt: string;
};

export type GnNotificationPrefs = {
  connectionRequest: boolean;
  connectionAccepted: boolean;
  connectionStatusUpdate: boolean;
};

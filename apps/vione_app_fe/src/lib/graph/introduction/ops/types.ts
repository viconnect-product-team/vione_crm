// BC-6.8R — Ops types + frozen registry constants.
// Client-safe. Re-exports DTO types from the functions module so both
// server-fn and SDK consumers stay type-aligned. No PII in any payload.

export const INTRODUCTION_OPS_VERSION = "1.0.0" as const;

export type OpsScope = "platform" | "association";

/** Frozen 10-code alert registry evaluated by `intro_ops_alerts_evaluate`. */
export const OPS_ALERT_CODES = [
  "outbox.pending.warn",
  "outbox.pending.critical",
  "outbox.lag.warn",
  "outbox.lag.critical",
  "consumer.failure_ratio.warn",
  "consumer.failure_ratio.critical",
  "consumer.dead_letter.critical",
  "scheduler.stale.warn",
  "scheduler.stale.critical",
  "requests.failure_ratio.critical",
] as const;
export type OpsAlertCode = (typeof OPS_ALERT_CODES)[number];

export const OPS_ALERT_SEVERITY_BY_CODE: Record<OpsAlertCode, "warning" | "critical"> = {
  "outbox.pending.warn": "warning",
  "outbox.pending.critical": "critical",
  "outbox.lag.warn": "warning",
  "outbox.lag.critical": "critical",
  "consumer.failure_ratio.warn": "warning",
  "consumer.failure_ratio.critical": "critical",
  "consumer.dead_letter.critical": "critical",
  "scheduler.stale.warn": "warning",
  "scheduler.stale.critical": "critical",
  "requests.failure_ratio.critical": "critical",
};

export const OPS_ALERT_CATEGORY_BY_CODE: Record<OpsAlertCode, string> = {
  "outbox.pending.warn": "outbox",
  "outbox.pending.critical": "outbox",
  "outbox.lag.warn": "outbox",
  "outbox.lag.critical": "outbox",
  "consumer.failure_ratio.warn": "consumer",
  "consumer.failure_ratio.critical": "consumer",
  "consumer.dead_letter.critical": "consumer",
  "scheduler.stale.warn": "scheduler",
  "scheduler.stale.critical": "scheduler",
  "requests.failure_ratio.critical": "requests",
};

export const OPS_JOB_NAMES = [
  "outcome_consumer_batch",
  "outcome_expire_sweep",
  "outcome_reconcile",
  "intro_ops_alerts_evaluate",
] as const;
export type OpsJobName = (typeof OPS_JOB_NAMES)[number];

export type OpsScopeArgs = {
  scope: OpsScope;
  associationId: string | null;
};
export type OpsScopeRangeArgs = OpsScopeArgs & { rangeHours: number };
export type OpsScopeLimitArgs = OpsScopeArgs & { limit: number };

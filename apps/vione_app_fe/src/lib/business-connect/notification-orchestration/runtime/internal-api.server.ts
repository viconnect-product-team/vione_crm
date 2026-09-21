// BC-8.1 §AL — Internal runtime API barrel.
//
// SERVICE-ROLE ONLY. Never re-exported from ../index.ts. UI code must not
// reach these functions; call sites are cron endpoints and admin tools.

export { consumeNotificationOutboxBatch, computeChannelPlan } from "./consumer.server";
export { dispatchNotificationBatch, replayDeadLetterDispatch } from "./dispatcher.server";
export {
  claimAndFulfillSchedulesBatch,
  computeReminderSchedule,
  upsertScheduleIdempotent,
  cancelSchedulesForSource,
} from "./scheduler.server";
export {
  seedEscalationSchedule,
  cancelEscalationsForSource,
  computeEscalationSteps,
} from "./escalation.server";
export {
  recoverStuckProcessing,
  expireNotificationsBatch,
  reconcileNotificationRuntime,
} from "./reconciliation.server";
export { writeNotificationIdempotent, writeEventReceipt, hasReceipt } from "./persistence.server";
export {
  defaultProviderRegistry,
  NotificationProviderRegistry,
  InAppNotificationAdapter,
  UnsupportedEmailAdapter,
  UnsupportedPushAdapter,
} from "./adapters.server";
export { computeNextRetryAt, isMaxAttemptsReached } from "./retry-policy";
export { classifyNotificationDispatchError } from "./error-classifier";
export type { AdapterResult, ConsumeReport, DispatchReport, CanonicalFacts } from "./types";

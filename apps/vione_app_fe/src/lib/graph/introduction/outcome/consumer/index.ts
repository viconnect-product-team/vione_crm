// BC-6.6 — Consumer barrel. Type-only exports for tests / infra code.
// The public IntroductionOutcomeSDK is UNCHANGED and lives in ../index.ts.
export {
  OUTCOME_EVENT_SCHEMA_VERSION,
  OUTCOME_EVENT_KINDS,
  DISPATCH_STATUSES,
  CONSUMER_BATCH_DEFAULT,
  CONSUMER_BATCH_MAX,
  RETRY_BACKOFF_MINUTES,
  CONSUMER_ERROR_CODES,
  computeNextAttemptAt,
  isSupportedOutcomeEventKind,
} from "./types";
export type {
  OutcomeEventEnvelope,
  OutcomeEventKind,
  OutcomeEventDispatchAdapter,
  AdapterResult,
  AdapterResultKind,
  DispatchStatus,
  ConsumerErrorCode,
} from "./types";

// BC-8.1 Turn B — Runtime public barrel.
//
// Only TYPES and pure helpers are re-exported here. Server-only modules
// (`*.server.ts`) are NEVER re-exported so client-reachable imports of this
// barrel stay safe. Runtime services are called from cron endpoints via
// `./internal-api.server`.

export type {
  AdapterResult,
  AdapterResultKind,
  CanonicalFacts,
  ConsumeReport,
  DispatchReport,
  RuntimeNotificationRow,
  RuntimeDispatchRow,
} from "./types";
export { NOTIFICATION_BATCH_DEFAULTS } from "./types";
export {
  classifyNotificationDispatchError,
  NOTIFICATION_INTERNAL_ERROR_CODES,
} from "./error-classifier";
export {
  computeNextRetryAt,
  isMaxAttemptsReached,
  NOTIFICATION_MAX_ATTEMPTS,
} from "./retry-policy";

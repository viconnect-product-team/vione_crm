// BC-6.8R — Public barrel for the Introduction Ops module.
export {
  INTRODUCTION_OPS_VERSION,
  OPS_ALERT_CODES,
  OPS_ALERT_SEVERITY_BY_CODE,
  OPS_ALERT_CATEGORY_BY_CODE,
  OPS_JOB_NAMES,
  type OpsScope,
  type OpsAlertCode,
  type OpsJobName,
  type OpsScopeArgs,
  type OpsScopeRangeArgs,
  type OpsScopeLimitArgs,
} from "./types";
export {
  SmartIntroductionOpsSDK,
  introductionOpsKeys,
  type SmartIntroductionOpsSDKType,
} from "./ops.sdk";
export type {
  OpsAccess,
  OpsAdapterRow,
  OpsAdapterStats,
  OpsAlert,
  OpsConsumerRun,
  OpsHealthSummary,
  OpsJobRun,
  OpsOutboxStats,
  OpsOutcomeStats,
  OpsStatsByStatus,
  OpsSubsystemStatus,
} from "./ops.functions";

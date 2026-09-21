// BC-9.0 — Business Connect Intelligence: client-safe barrel.
//
// UI/hook code imports from this module only. Runtime, provider adapters,
// tool executor and persistence live in `runtime/*.server.ts` (Turn B) and
// are NEVER re-exported here.

export * from "./registry";
export * from "./errors";
export * from "./context-policy";
export * from "./types";
export * from "./eligibility";
export * from "./model-routing";
export * from "./prompt-registry";
export * from "./response-schemas";
export * from "./context-builders";
export {
  BusinessConnectIntelligenceSDK,
  BUSINESS_CONNECT_AI_SDK_METHODS,
  safeRef,
  type BusinessConnectIntelligenceSDKType,
  type AIResultEnvelope,
  type GenerateRequest,
  type QueryRequest,
} from "./sdk";

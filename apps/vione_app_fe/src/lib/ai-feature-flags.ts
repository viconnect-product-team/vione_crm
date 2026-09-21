/**
 * AI Feature Flags — Phase 10, Step 5 (client-safe).
 *
 * The real LLM provider is controlled SERVER-SIDE by the AI_REAL_PROVIDER_ENABLED
 * env var (see ai-provider.server.ts) — the client cannot and must not read
 * server env. This client flag only decides whether the /ai UI routes send
 * requests through the server gateway (askAssociationAiFn) instead of the local
 * deterministic mock engine.
 *
 * Both paths are safe: even when the UI calls the gateway, the server keeps the
 * provider on `mock` until the server env flag is enabled. Keep this false until
 * the server gateway is wired into the UI in the next step.
 */
export const AI_USE_SERVER_GATEWAY = true;

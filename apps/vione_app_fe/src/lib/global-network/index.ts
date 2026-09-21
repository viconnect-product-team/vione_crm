// BC-3.1A — Global Business Networking domain barrel.
// BC-3.1B — application service/SDK layer added (still no UI in these slices).

export * from "./types";
export * from "./errors";
export * from "./state-machine";
export * from "./source";
export { requireGlobalNetworkUser } from "./identity";
export { GlobalConnectionRepository, mapConnectionRow } from "./repository";
export { GlobalConnectionService } from "./service";
export { createGlobalConnectionSDK } from "./sdk";
export type { GlobalConnectionSDK } from "./sdk";
export { resolveRelationshipState } from "./relationship-state";

// Business Card — Shared Business Service capability registration (ADR-BC-010).
//
// Declares the Business Card domain as a shared service and pins the SDK as the
// one entrypoint other surfaces (Marketplace, Association, Community, AI) must
// use. Importing this module registers the capability; it has no side effects
// beyond the registry entry and never changes card behavior.

import { registerCapability, type ServiceCapability } from "@/lib/platform/service-registry";
import { BusinessCardSDK } from "./business-card.sdk";

export const BUSINESS_CARD_CAPABILITY: ServiceCapability = registerCapability({
  id: "business-card",
  name: "Business Card",
  layer: "shared",
  version: 1,
  capabilities: [
    "get",
    "list",
    "create",
    "update",
    "delete",
    "publish",
    "hide",
    "archive",
    "share",
    "getPublic",
    "generateVCard",
    "generateQR",
    "generateShare",
    "resolveOwner",
    "resolveVisibility",
    "recordLead",
    "analytics",
  ],
  sdk: BusinessCardSDK,
  consumers: [
    "association",
    "business-connect",
    "community",
    "marketplace",
    "ai",
    "crm",
    "affiliate",
  ],
});

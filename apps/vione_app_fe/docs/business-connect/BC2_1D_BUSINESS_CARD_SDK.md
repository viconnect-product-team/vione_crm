# BUSINESS_CARD_SDK — Public Consumer Entrypoint (BC-2.1D)

`BusinessCardSDK` (`src/lib/business-card/business-card.sdk.ts`) is the **single
client-safe entrypoint** other product surfaces (Marketplace, Association,
Community, AI, CRM, Affiliate) use to consume the Business Card service. It wraps
the server-function adapters — consumers never import `*.functions.ts`,
repositories, or Supabase tables directly.

## Shape

- `BusinessCardSDK.get / list / create / update / delete / publish / hide`
- `BusinessCardSDK.getGlobal`, `getPublic`, `getPreview`
- `BusinessCardSDK.generateVCard`, `generateQR`, `resolveOwner`
- `BusinessCardSDK.relationships.{ save, remove, isSaved }`
- Lead layer surfaced through the notifications / cards routes via the
  `listMyBusinessCardLeadsFn` family (adapters over `LeadService`).

## Rules

- Client-safe: no server-only imports, safe in components and hooks.
- Stable contract: consumers depend on the SDK, not internal service/repository
  signatures.
- Registered as a versioned capability (see the capability doc).

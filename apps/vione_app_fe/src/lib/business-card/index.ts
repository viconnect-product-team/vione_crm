// Business Card shared service — public barrel.
//
// Consumers (Marketplace, Association, Community, AI, UI) import from here.
// The SDK is the supported entrypoint; types are re-exported for convenience.
// Server functions call the service/repository directly (server side only).

export { BusinessCardSDK } from "./business-card.sdk";
export { BusinessCardService } from "./business-card.service";
export { BusinessCardRepository } from "./business-card.repository";
export { BUSINESS_CARD_CAPABILITY } from "./business-card.capability";
export {
  buildSharePayload,
  cardPublicUrl,
  generateQR,
  generateVCard,
  resolveTheme,
  type CardSharePayload,
  type ShareContact,
} from "./business-card.share";
export * from "./business-card.types";
export {
  validateCardForPublish,
  validateBusinessCardForPublish,
  isPublishable,
  type PublishIssue,
  type PublishIssueCode,
  type PublishValidationInput,
} from "./publish-validation";
export type { GlobalBuilderEligibility } from "./global-builder.functions";
export {
  buildProfileHead,
  buildJsonLd,
  buildTitle,
  buildDescription,
  buildKeywords,
  selectSchemaKind,
  socialProfiles,
  profileUrl,
  absoluteAsset,
  buildProfileSitemapEntry,
  renderSitemapXml,
  type ProfileHead,
  type SeoContext,
  type ProfileSchemaKind,
  type SitemapEntry,
  type HeadMeta,
  type HeadLink,
  type HeadScript,
} from "./seo-engine";
export { RelationshipService } from "./relationship.service";
export { RelationshipRepository } from "./relationship.repository";
export {
  SAVED_CARD_SOURCES,
  REL_ERR,
  type SavedCard,
  type SavedCardTarget,
  type SavedCardSource,
  type SaveCardInput,
  type RelationshipMetadataPatch,
} from "./relationship.types";
// ── BC-3.0 Saved Card organization layer ────────────────────────────────────
export { SavedCardSDK } from "./saved-card.sdk";
export { SavedCardService } from "./saved-card.service";
export { SavedCardRepository } from "./saved-card.repository";
export { SavedCardCollectionRepository } from "./collection.repository";
export { suggestForSavedCard, mapRowToCollection } from "./saved-card.mappers";
export { SavedCardTagService } from "./saved-card-tag.service";
export { SavedCardTagRepository } from "./saved-card-tag.repository";
export {
  CANONICAL_SAVED_CARD_SOURCES,
  ACCEPTED_SAVED_CARD_SOURCES,
  SAVED_CARD_TAG_ERR,
  normalizeSavedCardSource,
  normalizeTagName,
  availabilityOf,
  type CanonicalSavedCardSource,
  type SavedCardAvailability,
  type SavedCardTag,
} from "./saved-card.contracts";
export {
  SYSTEM_COLLECTIONS,
  SYSTEM_COLLECTION_SLUGS,
  SAVED_CARD_ERR,
  type SavedCardCollection,
  type SavedCardCollectionKind,
  type SystemCollectionSlug,
  type CreateCollectionInput,
  type UpdateCollectionInput,
  type SavedCardSearchQuery,
  type SavedCardSuggestion,
} from "./collection.types";
export { BusinessInteractionService } from "./interaction.service";
export { InteractionRepository } from "./interaction.repository";
export { buildInteractionTimeline, mapRowToInteraction } from "./interaction.mappers";
export {
  INTERACTION_TYPES,
  INTERACTION_ERR,
  type BusinessInteraction,
  type InteractionType,
  type CreateInteractionInput,
  type UpdateInteractionInput,
  type InteractionTimeline,
} from "./interaction.types";
export { LeadService } from "./lead.service";
export { LeadRepository } from "./lead.repository";
export {
  REPLY_TEMPLATES,
  LEAD_STATUSES,
  type LeadStatus,
  type ReplyChannel,
  type ReplyTemplate,
  type LeadReplyEntry,
  type LeadHistoryEntry,
  type BusinessCardLead,
  type DailyPoint,
  type StatusBreakdown,
  type BusinessCardStats,
} from "./lead.types";

// BC-9.0 — Structured response schemas (§22–§29). Zod-based, no bounds inside
// schema fields — bounds/limits are enforced in prompt text and post-generation
// validators (see ai-sdk-agent-patterns note on schema constraint fragility).

import { z } from "zod";

const SafeRefSchema = z.object({
  id: z.string(),
  route: z.string().optional(),
  label: z.string(),
});

const CitationSchema = z.object({
  sourceType: z.string(),
  sourceRef: SafeRefSchema,
  updatedAt: z.string(),
});

const ConfidenceSchema = z.enum(["low", "medium", "high"]);

const BaseMetaShape = {
  confidence: ConfidenceSchema,
  citations: z.array(CitationSchema),
  limitations: z.array(z.string()),
};

// 23. Relationship Briefing
export const RelationshipBriefingResponseSchema = z.object({
  headline: z.string(),
  relationshipSummary: z.string(),
  knownFacts: z.array(z.string()),
  recentInteractions: z.array(z.string()),
  sharedContext: z.array(z.string()),
  openThreads: z.array(z.string()),
  suggestedConversationTopics: z.array(z.string()),
  risksOrUnknowns: z.array(z.string()),
  ...BaseMetaShape,
});
export type RelationshipBriefingResponse = z.infer<typeof RelationshipBriefingResponseSchema>;

// 24. Meeting Preparation
export const MeetingPreparationResponseSchema = z.object({
  meetingObjective: z.string(),
  participantBriefs: z.array(z.object({ personRef: SafeRefSchema, brief: z.string() })),
  agendaPreparation: z.array(z.string()),
  relevantHistory: z.array(z.string()),
  openCommitments: z.array(z.string()),
  suggestedQuestions: z.array(z.string()),
  watchouts: z.array(z.string()),
  preparationChecklist: z.array(z.string()),
  ...BaseMetaShape,
});
export type MeetingPreparationResponse = z.infer<typeof MeetingPreparationResponseSchema>;

// 25. Introduction Draft
export const IntroductionDraftResponseSchema = z.object({
  subject: z.string(),
  opening: z.string(),
  mutualContext: z.string(),
  valueStatement: z.string(),
  consentAwareIntroduction: z.string(),
  closing: z.string(),
  fullDraft: z.string(),
  assumptions: z.array(z.string()),
  ...BaseMetaShape,
});
export type IntroductionDraftResponse = z.infer<typeof IntroductionDraftResponseSchema>;

// 26. Follow-up Draft
export const FollowUpDraftResponseSchema = z.object({
  subject: z.string(),
  greeting: z.string(),
  keyPoints: z.array(z.string()),
  commitments: z.array(z.string()),
  nextSteps: z.array(z.string()),
  proposedDeadlineText: z.string(),
  closing: z.string(),
  fullDraft: z.string(),
  assumptions: z.array(z.string()),
  ...BaseMetaShape,
});
export type FollowUpDraftResponse = z.infer<typeof FollowUpDraftResponseSchema>;

// 27. Next Action
export const NextActionSuggestionResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      rank: z.number(),
      actionKind: z.string(),
      rationale: z.string(),
      targetRoute: z.string(),
      urgency: z.enum(["low", "medium", "high"]),
      evidence: z.array(CitationSchema),
      confidence: ConfidenceSchema,
      requiresHumanDecision: z.literal(true),
    }),
  ),
  omittedReasons: z.array(z.string()),
  ...BaseMetaShape,
});
export type NextActionSuggestionResponse = z.infer<typeof NextActionSuggestionResponseSchema>;

// 28. Opportunity Signals
export const OpportunitySignalResponseSchema = z.object({
  signals: z.array(
    z.object({
      type: z.enum([
        "warm_introduction_opportunity",
        "reconnect_opportunity",
        "meeting_follow_up_opportunity",
        "shared_interest_opportunity",
        "organization_connection_opportunity",
        "dormant_relationship_review",
      ]),
      title: z.string(),
      rationale: z.string(),
      relatedEntities: z.array(SafeRefSchema),
      evidence: z.array(CitationSchema),
      strength: z.enum(["low", "medium", "high"]),
      confidence: ConfidenceSchema,
      recommendedReviewRoute: z.string(),
    }),
  ),
  ...BaseMetaShape,
});
export type OpportunitySignalResponse = z.infer<typeof OpportunitySignalResponseSchema>;

// 29. Network Query
export const NetworkQueryResponseSchema = z.object({
  answer: z.string(),
  supportingFacts: z.array(z.string()),
  relatedPeople: z.array(SafeRefSchema),
  relatedOrganizations: z.array(SafeRefSchema),
  relatedMeetings: z.array(SafeRefSchema),
  uncertainties: z.array(z.string()),
  ...BaseMetaShape,
});
export type NetworkQueryResponse = z.infer<typeof NetworkQueryResponseSchema>;

// Work Hub Assistant — conversational, keeps same meta rules.
export const WorkHubAssistantResponseSchema = z.object({
  answer: z.string(),
  referencedItems: z.array(SafeRefSchema),
  followUpQuestions: z.array(z.string()),
  ...BaseMetaShape,
});
export type WorkHubAssistantResponse = z.infer<typeof WorkHubAssistantResponseSchema>;

export const BUSINESS_CONNECT_AI_RESPONSE_SCHEMAS = Object.freeze({
  relationship_briefing: RelationshipBriefingResponseSchema,
  meeting_preparation: MeetingPreparationResponseSchema,
  introduction_draft: IntroductionDraftResponseSchema,
  follow_up_draft: FollowUpDraftResponseSchema,
  next_action_suggestion: NextActionSuggestionResponseSchema,
  opportunity_signal_summary: OpportunitySignalResponseSchema,
  network_query: NetworkQueryResponseSchema,
  work_hub_assistant: WorkHubAssistantResponseSchema,
});

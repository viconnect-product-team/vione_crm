// BC-Mobile-7B — Community Events & Opportunities contracts (client-safe).
// Canonical domains: public.events / public.event_registrations /
// public.opportunities / public.opportunity_interests.
// Explicit whitelists — NEVER add: qr_fields, creator/tenant internals,
// attendee fields, poster private contacts, admin/approval metadata,
// check-in credentials (see BC_MOBILE_7B_ACTIVITY_AUDIT.md).

/** Truthful mobile registration state, mapped from canonical status + capacity + viewer registration. */
export type CommunityEventRegistrationStateDTO =
  | "available"
  | "registered"
  | "closed"
  | "full"
  | "cancelled";

/** null when the canonical event has no capacity semantics (capacity <= 0). */
export type CommunityEventCapacityStateDTO = "open" | "full" | null;

export type CommunityEventSummaryDTO = {
  /** Opaque reference (events.id). */
  eventRef: string;
  title: string;
  /** Canonical events.date — date-only (YYYY-MM-DD). No time exists canonically. */
  startAt: string;
  locationLabel: string | null;
  /** Canonical events.type, plain text. */
  formatLabel: string | null;
  registrationState: CommunityEventRegistrationStateDTO;
  capacityState: CommunityEventCapacityStateDTO;
};

export type CommunityEventDetailDTO = {
  event: CommunityEventSummaryDTO;
  communityId: string;
  communityName: string;
  /** Server-decided: viewer may register right now (member record + eligible). */
  canRegister: boolean;
  /** Registered viewers may hand off to the canonical /m/checkin surface. */
  checkinHandoff: boolean;
};

export type CommunityEventsTabDTO = "upcoming" | "registered";

export type CommunityEventPageDTO = {
  items: CommunityEventSummaryDTO[];
  totalCount: number;
  nextOffset: number | null;
};

export type CommunityOpportunitySummaryDTO = {
  /** Opaque reference (opportunities.id). */
  opportunityRef: string;
  title: string;
  /** Canonical i18n key (opp.type.*) when the type matches the taxonomy; else null. */
  categoryKey: string | null;
  /** Poster's published public-card company (viewer-RLS projection); else null. */
  organizationLabel: string | null;
  /** Server-truncated plain text. */
  shortDescription: string | null;
  publishedAt: string;
  expiresAt: string | null;
  /** UTC-safe derived days until canonical deadline; null when unknown. */
  daysLeft: number | null;
  interested: boolean;
  /** Mức độ quan tâm của người xem: "high" | "low"; null khi chưa quan tâm. */
  interestLevel: CommunityInterestLevel | null;
};

/** Mức độ quan tâm canonical (opportunity_interests.interest_level). */
export type CommunityInterestLevel = "high" | "low";

/** Safe poster handoff — opaque memberRef only, never user id / contacts. */
export type CommunityOpportunityPosterDTO = {
  memberRef: string;
  displayName: string;
};

export type CommunityOpportunityDetailDTO = {
  opportunity: CommunityOpportunitySummaryDTO;
  description: string | null;
  regionLabel: string | null;
  industryLabel: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  poster: CommunityOpportunityPosterDTO | null;
  communityId: string;
  communityName: string;
  /** Server-decided: open + not expired + not own post + viewer has member record. */
  canExpressInterest: boolean;
  /** Nhắc hẹn liên hệ lại đang hoạt động của người xem; null khi chưa đặt. */
  followUp: CommunityOpportunityFollowUpDTO | null;
  /** Lịch sử ghi chú / đổi trạng thái của CHÍNH người xem (mới nhất trước). */
  followUpHistory: CommunityOpportunityFollowUpEventDTO[];
  /** Tệp/liên kết người xem tự đính kèm cho cơ hội (own-row). */
  followUpAttachments: CommunityOpportunityAttachmentDTO[];
};

/** Đính kèm own-row cho một cơ hội: liên kết ngoài hoặc tệp trong kho riêng. */
export type CommunityOpportunityAttachmentDTO = {
  id: string;
  kind: "link" | "file";
  title: string;
  /** Chỉ có với kind = "link". */
  url: string | null;
  /** Chỉ có với kind = "file" — đường dẫn trong kho riêng của người xem. */
  storagePath: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

/** Một mốc lịch sử theo dõi cơ hội (community_opportunity_followup_events). */
export type CommunityOpportunityFollowUpEventKind =
  | "note"
  | "progress"
  | "scheduled"
  | "done"
  | "cancelled";

export type CommunityOpportunityFollowUpEventDTO = {
  id: string;
  kind: CommunityOpportunityFollowUpEventKind;
  progress: CommunityOpportunityProgressDTO | null;
  remindAt: string | null;
  note: string | null;
  /** ISO timestamp (UTC). */
  createdAt: string;
};

/** Nhắc hẹn liên hệ lại cho một cơ hội (bảng canonical
 *  community_opportunity_followups — chỉ của chính người xem). */
export type CommunityOpportunityProgressDTO = "planned" | "messaged" | "replied" | "closed";

export type CommunityOpportunityFollowUpDTO = {
  /** YYYY-MM-DD (ngày nhắc); null khi mới lưu tiến độ, chưa đặt lịch nhắc. */
  remindAt: string | null;
  /** Tiến độ theo đuổi cơ hội do chính người xem ghi nhận. */
  progress: CommunityOpportunityProgressDTO;
  /** Ghi chú/nội dung tin nhắn gần nhất người xem đã lưu. */
  note: string | null;
  status: "pending" | "done" | "cancelled";
  /** true khi đang chờ và đã tới/quá ngày nhắc (server tính). */
  due: boolean;
  /** Số ngày còn lại tới ngày nhắc (âm = quá hạn); null khi chưa đặt lịch. */
  daysUntil: number | null;
};

export type CommunityOpportunityPageDTO = {
  items: CommunityOpportunitySummaryDTO[];
  totalCount: number;
  nextOffset: number | null;
};

/** Bounded Community Detail preview rows (max COMMUNITY_ACTIVITY_PREVIEW_LIMIT). */
export type CommunityOpportunityPreviewDTO = {
  opportunityRef: string;
  title: string;
  categoryKey: string | null;
  organizationLabel: string | null;
  daysLeft: number | null;
};

export type CommunityActivityPreviewDTO = {
  nextEvents: CommunityEventSummaryDTO[];
  openOpportunities: CommunityOpportunityPreviewDTO[];
};

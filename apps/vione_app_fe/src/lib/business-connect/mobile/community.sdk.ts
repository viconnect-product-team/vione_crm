// BC-Mobile-7A — CommunitySDK (client-safe façade).
// Only entry point UI/hook code uses. No React, no Supabase, no admin client.
// BC-Mobile-7B adds the activity (events/opportunities) surface.

import {
  connectCommunityMemberFn,
  getCommunityDetailFn,
  getCommunityMemberProfileFn,
  listCommunityMembersFn,
  updateCommunityMemberRoleFn,
  listMyCommunitiesFn,
} from "./community.functions";
import {
  expressCommunityOpportunityInterestFn,
  withdrawCommunityOpportunityInterestFn,
  scheduleCommunityOpportunityFollowUpFn,
  updateCommunityOpportunityFollowUpFn,
  saveCommunityOpportunityProgressFn,
  addCommunityOpportunityAttachmentFn,
  removeCommunityOpportunityAttachmentFn,
  getCommunityActivityPreviewFn,
  getCommunityEventDetailFn,
  getCommunityOpportunityDetailFn,
  listCommunityEventsFn,
  listCommunityOpportunitiesFn,
  cancelCommunityEventRegistrationFn,
  registerCommunityEventFn,
} from "./community-activity.functions";
import {
  listCommunityInvitesFn,
  createCommunityInviteFn,
  cancelCommunityInviteFn,
  resendCommunityInviteFn,
  getCommunityInviteByTokenFn,
  acceptCommunityInviteFn,
  listCommunityInviteTemplatesFn,
  saveCommunityInviteTemplateFn,
  resetCommunityInviteTemplateFn,
  updateAcceptedInviteRoleFn,
  listInviteRoleHistoryFn,
} from "./community-invite.functions";
import type {
  CommunityInviteTemplateDTO,
  InviteLocale,
} from "./community-invite-template";
import type {
  CommunityInviteDTO,
  CommunityInviteAcceptResult,
  CommunityInvitePreviewDTO,
} from "./community-invite.server";
import { getCommunityNewsDetailFn, listCommunityNewsFn } from "./community-news.functions";
import type { CommunityNewsDetailDTO, CommunityNewsPageDTO } from "./community-news.types";
import type {
  CommunityActivityPreviewDTO,
  CommunityEventDetailDTO,
  CommunityEventPageDTO,
  CommunityEventsTabDTO,
  CommunityInterestLevel,
  CommunityOpportunityDetailDTO,
  CommunityOpportunityPageDTO,
} from "./community-activity.types";
import type {
  CommunityDetailDTO,
  CommunityMemberPageDTO,
  CommunityMemberRoleFilter,
  CommunityMemberProfileDTO,
  CommunitySummaryDTO,
} from "./community.types";

export const CommunitySDK = {
  listMyCommunities: (): Promise<CommunitySummaryDTO[]> => listMyCommunitiesFn(),

  getDetail: (communityId: string): Promise<CommunityDetailDTO | null> =>
    getCommunityDetailFn({ data: { communityId } }),

  listMembers: (input: {
    communityId: string;
    query?: string;
    offset?: number;
    roleFilter?: CommunityMemberRoleFilter;
  }): Promise<CommunityMemberPageDTO | null> => listCommunityMembersFn({ data: input }),

  /** Danh sách lời mời qua email do chính người dùng đã gửi. */
  listInvites: (input: { communityId: string }): Promise<CommunityInviteDTO[]> =>
    listCommunityInvitesFn({ data: input }),

  /** Gửi (ghi nhận) lời mời tham gia cộng đồng qua email. */
  createInvite: (input: {
    communityId: string;
    email: string;
    note?: string;
    inviteUrl?: string;
    locale?: InviteLocale;
    invitedRole?: "admin" | "member";
  }) => createCommunityInviteFn({ data: input }),

  /** Mẫu email lời mời (vi/en) của cộng đồng. */
  listInviteTemplates: (input: {
    communityId: string;
  }): Promise<{ templates: CommunityInviteTemplateDTO[]; canEdit: boolean }> =>
    listCommunityInviteTemplatesFn({ data: input }),

  /** Lưu mẫu email lời mời cho một ngôn ngữ (chỉ quản trị viên). */
  saveInviteTemplate: (input: {
    communityId: string;
    locale: InviteLocale;
    subject: string;
    body: string;
  }): Promise<{ ok: true } | { ok: false; reason: "forbidden" }> =>
    saveCommunityInviteTemplateFn({ data: input }),

  /** Khôi phục mẫu mặc định cho một ngôn ngữ (chỉ quản trị viên). */
  resetInviteTemplate: (input: {
    communityId: string;
    locale: InviteLocale;
  }): Promise<{ ok: true } | { ok: false; reason: "forbidden" }> =>
    resetCommunityInviteTemplateFn({ data: input }),

  /** Gửi lại một lời mời đang chờ (cập nhật thời điểm gửi). */
  resendInvite: (input: {
    inviteRef: string;
    locale?: InviteLocale;
  }): Promise<{ ok: true; invite: CommunityInviteDTO } | { ok: false; reason: "not_pending" }> =>
    resendCommunityInviteFn({ data: input }),

  /** Lịch sử đổi vai trò gắn với một lời mời. */
  listInviteRoleHistory: (inviteRef: string) => listInviteRoleHistoryFn({ data: { inviteRef } }),

  /** Đổi vai trò của thành viên đã chấp nhận lời mời (chỉ quản trị viên). */
  updateAcceptedInviteRole: (input: {
    inviteRef: string;
    role: "admin" | "member";
  }): Promise<
    { ok: true } | { ok: false; reason: "forbidden" | "not_accepted" | "last_admin" }
  > => updateAcceptedInviteRoleFn({ data: input }),

  /** Xem thông tin lời mời từ mã token (người nhận đã đăng nhập). */
  getInviteByToken: (input: { token: string }): Promise<CommunityInvitePreviewDTO | null> =>
    getCommunityInviteByTokenFn({ data: input }),

  /** Chấp nhận lời mời bằng mã token sau khi xác nhận email. */
  acceptInvite: (input: { token: string; email: string }): Promise<CommunityInviteAcceptResult> =>
    acceptCommunityInviteFn({ data: input }),

  /** Hủy một lời mời đang chờ. */
  cancelInvite: (input: { inviteRef: string }): Promise<{ ok: true }> =>
    cancelCommunityInviteFn({ data: input }),

  /** Đổi vai trò thành viên (chỉ quản trị viên cộng đồng). */
  updateMemberRole: (input: {
    communityId: string;
    memberRef: string;
    role: "admin" | "member";
  }): Promise<{ ok: true }> => updateCommunityMemberRoleFn({ data: input }),

  getMemberProfile: (input: {
    communityId: string;
    memberRef: string;
  }): Promise<CommunityMemberProfileDTO | null> => getCommunityMemberProfileFn({ data: input }),

  connect: (input: {
    communityId: string;
    memberRef: string;
    mutationKey?: string;
  }): Promise<{ ok: true }> => connectCommunityMemberFn({ data: input }),

  // ── BC-Mobile-7B — Events ──────────────────────────────────────────────
  listEvents: (input: {
    communityId: string;
    tab: CommunityEventsTabDTO;
    offset?: number;
  }): Promise<CommunityEventPageDTO | null> => listCommunityEventsFn({ data: input }),

  getEventDetail: (input: {
    communityId: string;
    eventRef: string;
  }): Promise<CommunityEventDetailDTO | null> => getCommunityEventDetailFn({ data: input }),

  registerForEvent: (input: { communityId: string; eventRef: string }): Promise<{ ok: true }> =>
    registerCommunityEventFn({ data: input }),

  cancelEventRegistration: (input: {
    communityId: string;
    eventRef: string;
  }): Promise<{ ok: true }> => cancelCommunityEventRegistrationFn({ data: input }),

  // ── BC-Mobile-7B — Opportunities ───────────────────────────────────────
  listOpportunities: (input: {
    communityId: string;
    query?: string;
    offset?: number;
  }): Promise<CommunityOpportunityPageDTO | null> => listCommunityOpportunitiesFn({ data: input }),

  getOpportunityDetail: (input: {
    communityId: string;
    opportunityRef: string;
  }): Promise<CommunityOpportunityDetailDTO | null> =>
    getCommunityOpportunityDetailFn({ data: input }),

  expressInterest: (input: {
    communityId: string;
    opportunityRef: string;
    interestLevel?: CommunityInterestLevel;
  }): Promise<{ ok: true }> => expressCommunityOpportunityInterestFn({ data: input }),

  withdrawInterest: (input: {
    communityId: string;
    opportunityRef: string;
  }): Promise<{ ok: true }> => withdrawCommunityOpportunityInterestFn({ data: input }),

  /** Đặt lịch nhắc liên hệ lại (số ngày kể từ hôm nay). */
  scheduleOpportunityFollowUp: (input: {
    communityId: string;
    opportunityRef: string;
    inDays: number;
  }): Promise<{ ok: true }> => scheduleCommunityOpportunityFollowUpFn({ data: input }),

  /** Cập nhật tiến độ nhắc hẹn: đã liên hệ (done) hoặc bỏ nhắc (cancel). */
  updateOpportunityFollowUp: (input: {
    communityId: string;
    opportunityRef: string;
    action: "done" | "cancel";
  }): Promise<{ ok: true }> => updateCommunityOpportunityFollowUpFn({ data: input }),

  /** Lưu tiến độ theo đuổi cơ hội (kèm nội dung tin nhắn vừa gửi, nếu có). */
  saveOpportunityProgress: (input: {
    communityId: string;
    opportunityRef: string;
    progress: "planned" | "messaged" | "replied" | "closed";
    note?: string;
  }): Promise<{ ok: true }> => saveCommunityOpportunityProgressFn({ data: input }),

  /** Thêm đính kèm (liên kết hoặc tệp đã tải lên) cho cơ hội. */
  addOpportunityAttachment: (input: {
    communityId: string;
    opportunityRef: string;
    kind: "link" | "file";
    title?: string;
    url?: string;
    storagePath?: string;
    mimeType?: string;
    sizeBytes?: number;
  }): Promise<{ ok: true }> => addCommunityOpportunityAttachmentFn({ data: input }),

  /** Gỡ một đính kèm của chính người xem. */
  removeOpportunityAttachment: (input: { attachmentId: string }): Promise<{ ok: true }> =>
    removeCommunityOpportunityAttachmentFn({ data: input }),

  // ── BC-Mobile-7B+ — Bảng tin cộng đồng ─────────────────────────────────
  listNews: (input: {
    communityId: string;
    offset?: number;
  }): Promise<CommunityNewsPageDTO | null> => listCommunityNewsFn({ data: input }),

  getNewsDetail: (input: {
    communityId: string;
    newsRef: string;
  }): Promise<CommunityNewsDetailDTO | null> => getCommunityNewsDetailFn({ data: input }),

  getActivityPreview: (communityId: string): Promise<CommunityActivityPreviewDTO | null> =>
    getCommunityActivityPreviewFn({ data: { communityId } }),
};

export type CommunitySDKType = typeof CommunitySDK;

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConnectAppGateway } from '../connect-app.gateway';
import { ConnectOpportunityRepository } from '../repositories/connect-opportunity.repository';
import * as crypto from 'crypto';

/**
 * ConnectOpportunityService — Business logic service for business opportunities & network connections.
 * 100% separated from SQL & database queries via ConnectOpportunityRepository.
 */
@Injectable()
export class ConnectOpportunityService {
  private readonly logger = new Logger(ConnectOpportunityService.name);

  constructor(
    private readonly repo: ConnectOpportunityRepository,
    private readonly gateway: ConnectAppGateway,
  ) {}

  async checkCommunityMembership(userId: string, communityId: string): Promise<boolean> {
    return this.repo.checkMembership(userId, communityId);
  }

  async listCommunityOpportunities(userId: string, communityId: string, query: string, offset: number) {
    await this.checkCommunityMembership(userId, communityId);

    const limit = 10;
    const opportunities = await this.repo.findOpportunities(query, offset, limit);

    const oppIds = opportunities.map(o => o.id);
    let interestMap = new Map<string, string>();
    if (oppIds.length > 0) {
      const interests = await this.repo.findInterestsByMemberAndOppIds(userId, oppIds);
      interests.forEach(i => interestMap.set(i.opportunity_id, 'high'));
    }

    const totalCount = opportunities.length;
    const now = Date.now();
    const items = opportunities.map(o => {
      const deadlineMs = o.deadline ? new Date(o.deadline).getTime() : null;
      const daysLeft = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24))) : null;
      return {
        opportunityRef: o.id,
        title: o.title,
        summary: o.description || null,
        endsAt: o.deadline ? new Date(o.deadline).toISOString() : null,
        daysLeft,
        valLabel: o.budget_max ? `${o.budget_min ? o.budget_min + ' - ' : ''}${o.budget_max}` : (o.region || o.industry || null),
        status: o.status,
        interested: interestMap.has(o.id),
        interestLevel: interestMap.get(o.id) || null,
      };
    });

    return {
      items,
      totalCount,
      nextOffset: items.length === limit ? offset + limit : null,
    };
  }

  async getCommunityOpportunityDetail(userId: string, communityId: string, opportunityRef: string) {
    await this.checkCommunityMembership(userId, communityId);

    const o = await this.repo.findOpportunityById(opportunityRef);
    if (!o) throw new NotFoundException('opportunity_not_found');

    const interests = await this.repo.findInterest(userId, opportunityRef);
    const poster = o.poster_id ? await this.repo.findPosterMember(o.poster_id) : [];
    const p = poster[0];
    const assoc = await this.repo.findAssociation(communityId);

    const now = Date.now();
    const deadlineMs = o.deadline ? new Date(o.deadline).getTime() : null;
    const daysLeft = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24))) : null;

    const interestedMembers = await this.getOpportunityInterestedMembers(opportunityRef);
    const isPoster = Boolean(
      (o.poster_id && String(o.poster_id).toLowerCase() === String(userId).toLowerCase()) ||
      (p && String(p.id).toLowerCase() === String(userId).toLowerCase())
    );

    return {
      opportunity: {
        opportunityRef: o.id,
        id: o.id,
        title: o.title,
        categoryKey: o.type || 'opp.type.partnership',
        organizationLabel: p?.company || p?.name || 'Doanh nghiệp thành viên',
        shortDescription: o.description ? o.description.substring(0, 160) : null,
        publishedAt: o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString(),
        expiresAt: o.deadline ? new Date(o.deadline).toISOString() : null,
        daysLeft,
        interested: interests.length > 0,
        interestLevel: interests[0]?.interest_level || (interests.length > 0 ? 'high' : null),
        isPoster,
      },
      description: o.description || null,
      regionLabel: o.region || 'Toàn quốc',
      industryLabel: o.industry || 'Đa ngành',
      budgetMin: o.budget_min != null ? Number(o.budget_min) : null,
      budgetMax: o.budget_max != null ? Number(o.budget_max) : null,
      poster: p ? {
        memberRef: p.id,
        displayName: p.name,
        company: p.company,
        phone: p.phone,
        userId: o.poster_id,
      } : null,
      isPoster,
      interestedMembers,
      interestedCount: interestedMembers.length,
      communityId,
      communityName: assoc[0]?.name || 'CLB Doanh Nhân CEO 1983',
      canExpressInterest: true,
      followUp: null,
      followUpHistory: [],
      followUpAttachments: [],
      claimedBy: o.claimed_by_name ? {
        id: o.claimed_by_id,
        name: o.claimed_by_name,
        at: o.claimed_at,
        phone: o.claimed_phone,
        company: o.claimed_company,
      } : null,
    };
  }

  async createCommunityOpportunity(userId: string, communityId: string, data: any) {
    const oppId = `OPP-${Date.now().toString(36).toUpperCase()}`;
    await this.repo.insertCommunityOpportunity(oppId, communityId, userId, data);

    return {
      ok: true,
      opportunityId: oppId,
      title: data.title,
    };
  }

  async claimCommunityOpportunity(userId: string, communityId: string, opportunityRef: string) {
    const member = await this.repo.findMember(userId);
    const userProfile = await this.repo.findUserProfile(userId);

    const claimantName = member[0]?.name || userProfile[0]?.display_name || 'Hội viên VIONE';
    const claimantPhone = member[0]?.phone || '';
    const claimantCompany = member[0]?.company || userProfile[0]?.company_name || '';

    const oppRow = await this.repo.findOpportunityRow(opportunityRef);
    if (!oppRow || oppRow.length === 0) {
      throw new NotFoundException('Không tìm thấy thông tin cơ hội giao thương này trên hệ thống ViOne!');
    }
    const posterId = oppRow[0]?.poster_id;
    if (posterId && (posterId.toString() === userId.toString() || posterId.toString() === member[0]?.id?.toString() || posterId.toString() === member[0]?.code?.toString())) {
      throw new BadRequestException('Bạn là người đăng cơ hội này nên không thể tự nhận hoặc tự ứng tuyển cho chính mình!');
    }
    const oppTitle = oppRow[0]?.title || 'Cơ hội kết nối';
    const assocId = (communityId && communityId.trim().length > 10) ? communityId.trim() : (oppRow[0]?.association_id || null);

    await this.repo.updateOpportunityClaim(opportunityRef, {
      userId,
      name: claimantName,
      phone: claimantPhone,
      company: claimantCompany,
    });

    const intId = `INT-${Date.now().toString(36).toUpperCase()}`;
    await this.repo.insertOpportunityInterest({
      id: intId,
      opportunityId: opportunityRef,
      memberId: userId,
      message: 'Đã nhận cơ hội trên ứng dụng VIONE Mobile',
      contact: claimantPhone,
      interestLevel: 'high',
      associationId: assocId,
    });

    const notifClaimantId = crypto.randomUUID();
    const dedupeClaimant = `claim_${opportunityRef}_${userId}_${Date.now()}`;
    await this.repo.insertBusinessNotification({
      id: notifClaimantId,
      recipientUserId: userId,
      sourceRecordId: opportunityRef,
      dedupeKey: dedupeClaimant,
      eventKind: 'opportunity_claimed',
      notificationKind: 'opportunity_claimed',
      titleKey: 'Đã tiếp nhận cơ hội thành công',
      bodyKey: `Bạn đã tiếp nhận cơ hội "${oppTitle}". Dữ liệu đã đồng bộ về hệ thống CRM.`,
      safeDisplayData: { opportunityId: opportunityRef, title: oppTitle, claimantName, claimantCompany, communityId },
    });

    let notifPosterId = '';
    if (posterId && posterId !== userId) {
      notifPosterId = crypto.randomUUID();
      const dedupePoster = `claim_peer_${opportunityRef}_${posterId}_${Date.now()}`;
      await this.repo.insertBusinessNotification({
        id: notifPosterId,
        recipientUserId: String(posterId),
        sourceRecordId: opportunityRef,
        dedupeKey: dedupePoster,
        eventKind: 'opportunity_claimed_by_peer',
        notificationKind: 'opportunity_claimed_by_peer',
        titleKey: 'Cơ hội của bạn đã có người nhận kết nối',
        bodyKey: `${claimantName} (${claimantCompany || 'Doanh nghiệp'}) đã tiếp nhận cơ hội "${oppTitle}".`,
        safeDisplayData: { opportunityId: opportunityRef, title: oppTitle, claimantName, claimantCompany, claimantPhone },
      });
    }

    const crmCode = `NOTIF-OPP-${Date.now().toString().slice(-6)}`;
    await this.repo.insertCrmNotification(
      crmCode,
      'Tiếp nhận cơ hội kết nối',
      `${claimantName} (${claimantCompany}) đã tiếp nhận cơ hội: ${oppTitle}`,
      communityId,
    );

    try {
      this.gateway.emitNotification(userId, {
        id: notifClaimantId,
        title: 'Đã tiếp nhận cơ hội thành công',
        body: `Bạn đã tiếp nhận cơ hội "${oppTitle}". Dữ liệu đã đồng bộ về hệ thống CRM.`,
        notificationKind: 'opportunity_claimed',
        appScope: 'all',
        createdAt: new Date().toISOString(),
      });
      this.gateway.emitUnreadNotificationCount(userId, 1);

      if (posterId && posterId !== userId) {
        this.gateway.emitNotification(String(posterId), {
          id: notifPosterId,
          title: 'Cơ hội của bạn đã có người nhận kết nối',
          body: `${claimantName} (${claimantCompany || 'Doanh nghiệp'}) đã tiếp nhận cơ hội "${oppTitle}".`,
          notificationKind: 'opportunity_claimed_by_peer',
          appScope: 'all',
          createdAt: new Date().toISOString(),
        });
        this.gateway.emitUnreadNotificationCount(String(posterId), 1);
      }

      this.gateway.emitToAll('notification:new', {
        title: 'Tiếp nhận cơ hội kết nối',
        body: `${claimantName} (${claimantCompany}) đã tiếp nhận cơ hội: ${oppTitle}`,
        appScope: 'all',
        sentAt: new Date().toISOString(),
      });
      this.gateway.emitToAll('notification:count', {});
    } catch (wsErr) {
      this.logger.warn('Realtime WS emit error:', wsErr);
    }

    return {
      ok: true,
      claimedBy: {
        id: userId,
        name: claimantName,
        phone: claimantPhone,
        company: claimantCompany,
        at: new Date().toISOString(),
      },
    };
  }

  async expressCommunityOpportunityInterest(
    userId: string,
    communityId: string,
    opportunityRef: string,
    interestLevel?: string,
  ) {
    const intId = `INT-${Date.now().toString(36).toUpperCase()}`;
    const member = await this.repo.findMember(userId);
    const contact = member[0]?.phone || member[0]?.contact || '';
    const claimantName = member[0]?.name || 'Hội viên VIONE';
    const claimantCompany = member[0]?.company || '';

    const oppRow = await this.repo.findOpportunityRow(opportunityRef);
    if (!oppRow || oppRow.length === 0) {
      throw new NotFoundException('Không tìm thấy thông tin cơ hội giao thương này trên hệ thống ViOne!');
    }
    const posterId = oppRow[0]?.poster_id;
    if (posterId && (posterId.toString() === userId.toString() || posterId.toString() === member[0]?.id?.toString() || posterId.toString() === member[0]?.code?.toString())) {
      throw new BadRequestException('Bạn là người đăng cơ hội này nên không thể tự gửi yêu cầu quan tâm cho chính mình!');
    }
    const oppTitle = oppRow[0]?.title || 'Cơ hội kết nối';
    const assocId = (communityId && communityId.trim().length > 10) ? communityId.trim() : (oppRow[0]?.association_id || null);

    await this.repo.upsertOpportunityInterest({
      id: intId,
      opportunityId: opportunityRef,
      memberId: userId,
      message: interestLevel === 'high' ? 'Quan tâm cao cơ hội này' : 'Quan tâm thấp cơ hội này',
      contact,
      interestLevel: interestLevel || 'high',
      associationId: assocId,
    });

    const notifId = crypto.randomUUID();
    const dedupeInterest = `interest_${opportunityRef}_${userId}_${Date.now()}`;
    const isLow = interestLevel === 'low';
    const notifTitle = isLow ? 'Đã chuyển cơ hội sang quan tâm thấp' : 'Đã gửi mức độ quan tâm cơ hội';
    const notifBody = isLow
      ? `Bạn đã chuyển cơ hội "${oppTitle}" sang mức quan tâm thấp.`
      : `Bạn đã đăng ký quan tâm cơ hội "${oppTitle}". Dữ liệu đã đồng bộ về CRM.`;

    await this.repo.insertBusinessNotification({
      id: notifId,
      recipientUserId: userId,
      sourceRecordId: opportunityRef,
      dedupeKey: dedupeInterest,
      eventKind: 'opportunity_interest_sent',
      notificationKind: 'opportunity_interest_sent',
      titleKey: notifTitle,
      bodyKey: notifBody,
      safeDisplayData: { opportunityId: opportunityRef, title: oppTitle, interestLevel, communityId },
      priority: 'medium',
    });

    try {
      this.gateway.emitNotification(userId, {
        id: notifId,
        title: notifTitle,
        body: notifBody,
        notificationKind: 'opportunity_interest_sent',
        appScope: 'all',
        createdAt: new Date().toISOString(),
      });
      this.gateway.emitUnreadNotificationCount(userId, 1);

      this.gateway.emitToAll('notification:new', {
        title: isLow ? 'Doanh nghiệp chuyển cơ hội sang quan tâm thấp' : 'Doanh nghiệp đăng ký quan tâm cơ hội',
        body: `${claimantName} (${claimantCompany}) ${isLow ? 'chuyển sang quan tâm thấp' : 'đăng ký quan tâm'} cơ hội: ${oppTitle}`,
        appScope: 'all',
        sentAt: new Date().toISOString(),
      });
      this.gateway.emitToAll('notification:count', {});
    } catch (wsErr) {
      this.logger.warn('Realtime WS error:', wsErr);
    }

    if (posterId && String(posterId) !== String(userId)) {
      const posterNotifId = crypto.randomUUID();
      const posterDedupe = `interest_poster_${opportunityRef}_${userId}_${Date.now()}`;
      const posterNotifTitle = 'Có đối tác quan tâm đến cơ hội của bạn';
      const posterNotifBody = `${claimantName}${claimantCompany ? ` (${claimantCompany})` : ''} vừa quan tâm cơ hội: "${oppTitle}".`;

      await this.repo.insertBusinessNotification({
        id: posterNotifId,
        recipientUserId: String(posterId),
        sourceRecordId: opportunityRef,
        dedupeKey: posterDedupe,
        eventKind: 'opportunity_interest_received',
        notificationKind: 'opportunity_interest_received',
        titleKey: posterNotifTitle,
        bodyKey: posterNotifBody,
        safeDisplayData: { opportunityId: opportunityRef, title: oppTitle, claimantName, claimantCompany, claimantUserId: userId },
      });

      try {
        this.gateway.emitNotification(String(posterId), {
          id: posterNotifId,
          title: posterNotifTitle,
          body: posterNotifBody,
          notificationKind: 'opportunity_interest_received',
          appScope: 'all',
          createdAt: new Date().toISOString(),
        });
        this.gateway.emitUnreadNotificationCount(String(posterId), 1);
      } catch (wsErr) {
        this.logger.warn('Poster realtime WS error:', wsErr);
      }
    }

    return { ok: true };
  }

  async withdrawCommunityOpportunityInterest(userId: string, communityId: string, opportunityRef: string) {
    await this.repo.deleteOpportunityInterest(opportunityRef, userId);
    return { ok: true };
  }

  async scheduleCommunityOpportunityFollowUp(userId: string, communityId: string, opportunityRef: string, inDays: number) {
    const nextAction = new Date(Date.now() + inDays * 24 * 60 * 60 * 1000);
    await this.repo.upsertOpportunityFollowup(userId, opportunityRef, nextAction);
    return { ok: true };
  }

  async updateCommunityOpportunityFollowUp(userId: string, communityId: string, opportunityRef: string, action: string) {
    if (action === 'done' || action === 'cancel') {
      await this.repo.clearOpportunityFollowupNextAction(userId, opportunityRef);
    }
    return { ok: true };
  }

  async saveCommunityOpportunityProgress(userId: string, communityId: string, opportunityRef: string, progress: string, note: string) {
    await this.repo.upsertOpportunityProgress(userId, opportunityRef, progress, note);
    return { ok: true };
  }

  async addCommunityOpportunityAttachment(userId: string, input: any) {
    const attachmentId = crypto.randomUUID();
    await this.repo.insertOpportunityAttachment(userId, { ...input, id: attachmentId });
    return { ok: true };
  }

  async removeCommunityOpportunityAttachment(userId: string, attachmentId: string) {
    await this.repo.deleteOpportunityAttachment(userId, attachmentId);
    return { ok: true };
  }

  // ── CRM & Full System Opportunity CRUD ─────────────────────────────────────
  async listAllOpportunities(userId: string) {
    try {
      const opps = await this.repo.listAllOpportunitiesWithDetails();
      const interests = await this.repo.listAllInterestsWithDetails();

      const interestCounts: Record<string, number> = {};
      for (const it of interests) {
        const oppId = String(it.opportunity_id);
        interestCounts[oppId] = (interestCounts[oppId] || 0) + 1;
      }

      return {
        opportunities: opps.map(r => ({
          id: String(r.id),
          posterId: String(r.poster_id || ''),
          posterName: r.poster_name || undefined,
          posterAvatar: r.poster_avatar || undefined,
          posterPhone: r.poster_phone || undefined,
          posterCompany: r.poster_company || undefined,
          title: r.title,
          description: r.description || '',
          type: r.type || 'opp.type.partnership',
          budgetMin: r.budget_min != null ? Number(r.budget_min) : undefined,
          budgetMax: r.budget_max != null ? Number(r.budget_max) : undefined,
          region: r.region || '',
          industry: r.industry || '',
          deadline: r.deadline ? new Date(r.deadline).toISOString() : new Date().toISOString(),
          status: r.status || 'open',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          views: Number(r.views || 0),
          emoji: r.emoji || '💡',
          claimedById: r.claimed_by_id || undefined,
          claimedByName: r.claimed_by_name || undefined,
          claimedAt: r.claimed_at ? new Date(r.claimed_at).toISOString() : undefined,
          claimedPhone: r.claimed_phone || undefined,
          claimedCompany: r.claimed_company || undefined,
          contactName: r.contact_name || undefined,
          contactPhone: r.contact_phone || undefined,
          contactTitle: r.contact_title || undefined,
          company: r.company || undefined,
          image: r.image || undefined,
        })),
        interests: interests.map(it => ({
          id: String(it.id),
          opportunityId: String(it.opportunity_id),
          memberId: String(it.member_id || ''),
          memberName: it.member_name || undefined,
          memberAvatar: it.member_avatar || undefined,
          memberPhone: it.member_phone || undefined,
          memberEmail: it.member_email || undefined,
          memberCompany: it.member_company || undefined,
          message: it.message || '',
          contact: it.contact || it.member_phone || '',
          interestLevel: it.interest_level || 'high',
          createdAt: it.created_at ? new Date(it.created_at).toISOString() : new Date().toISOString(),
        })),
        interestCounts,
      };
    } catch (err) {
      this.logger.error('Error in listAllOpportunities:', err);
      return { opportunities: [], interests: [], interestCounts: {} };
    }
  }

  async getOpportunityById(opportunityId: string) {
    try {
      const r = await this.repo.getOpportunityByIdWithDetails(opportunityId);
      if (!r) return null;

      const interests = await this.repo.getInterestsByOppIdWithDetails(opportunityId);

      return {
        opportunity: {
          id: String(r.id),
          posterId: String(r.poster_id || ''),
          posterName: r.poster_name || undefined,
          posterAvatar: r.poster_avatar || undefined,
          posterPhone: r.poster_phone || undefined,
          posterCompany: r.poster_company || undefined,
          title: r.title,
          description: r.description || '',
          type: r.type || 'opp.type.partnership',
          budgetMin: r.budget_min != null ? Number(r.budget_min) : undefined,
          budgetMax: r.budget_max != null ? Number(r.budget_max) : undefined,
          region: r.region || '',
          industry: r.industry || '',
          deadline: r.deadline ? new Date(r.deadline).toISOString() : new Date().toISOString(),
          status: r.status || 'open',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          views: Number(r.views || 0),
          emoji: r.emoji || '💡',
          claimedById: r.claimed_by_id || undefined,
          claimedByName: r.claimed_by_name || undefined,
          claimedAt: r.claimed_at ? new Date(r.claimed_at).toISOString() : undefined,
          claimedPhone: r.claimed_phone || undefined,
          claimedCompany: r.claimed_company || undefined,
          contactName: r.contact_name || undefined,
          contactPhone: r.contact_phone || undefined,
          contactTitle: r.contact_title || undefined,
          company: r.company || undefined,
          image: r.image || undefined,
        },
        interests: interests.map(it => ({
          id: String(it.id),
          opportunityId: String(it.opportunity_id),
          memberId: String(it.member_id || ''),
          memberName: it.member_name || undefined,
          memberAvatar: it.member_avatar || undefined,
          memberPhone: it.member_phone || undefined,
          memberEmail: it.member_email || undefined,
          memberCompany: it.member_company || undefined,
          message: it.message || '',
          contact: it.contact || it.member_phone || '',
          interestLevel: it.interest_level || 'high',
          createdAt: it.created_at ? new Date(it.created_at).toISOString() : new Date().toISOString(),
        })),
      };
    } catch (err) {
      this.logger.error('Error in getOpportunityById:', err);
      return null;
    }
  }

  async createOpportunity(userId: string, data: any) {
    const oppId = data.id || `OPP-${Date.now().toString(36).toUpperCase()}`;
    const assocId = data.associationId || 'c1983000-0000-4000-8000-000000001983';

    const { member, user } = await this.repo.findMemberOrUser(userId);
    const contactName = (data.contactName || member?.name || user?.name || 'Ban Quản Trị').trim();
    const contactPhone = (data.contactPhone || member?.phone || user?.phone || '').trim();
    const contactTitle = (data.contactTitle || 'Đại diện hợp tác').trim();
    const company = (data.company || 'CLB Doanh Nhân CEO 1983').trim();

    await this.repo.insertOpportunityRecord(oppId, assocId, userId, {
      ...data,
      contactName,
      contactPhone,
      contactTitle,
      company,
    });

    return { ok: true, id: oppId };
  }

  async deleteOpportunity(userId: string, opportunityId: string) {
    await this.repo.deleteOpportunity(opportunityId);
    return { ok: true };
  }

  async updateOpportunity(userId: string, opportunityId: string, data: any) {
    await this.repo.updateOpportunity(opportunityId, data);
    return { ok: true };
  }

  async toggleOpportunityStatus(userId: string, opportunityId: string) {
    const nextStatus = await this.repo.toggleOpportunityStatus(opportunityId);
    return { ok: true, status: nextStatus };
  }

  async listMyOpportunities(userId: string) {
    try {
      const opportunities = await this.repo.listMyOpportunities();
      const oppIds = opportunities.map(o => o.id);
      let myInterests = new Set<string>();
      if (oppIds.length > 0) {
        const ints = await this.repo.findInterestsByContactOrMember(userId);
        myInterests = new Set(ints.map(i => String(i.opportunity_id)));
      }

      const OPP_COLORS = ['#D97706', '#F59E0B', '#B45309', '#D8B282', '#EDB028'];

      const myMembers = await this.repo.findMembersByUserId(userId);
      const myIds = new Set<string>([
        String(userId).toLowerCase(),
        ...(myMembers[0]?.id ? [String(myMembers[0].id).toLowerCase()] : []),
        ...(myMembers[0]?.code ? [String(myMembers[0].code).toLowerCase()] : []),
        ...(myMembers[0]?.user_id ? [String(myMembers[0].user_id).toLowerCase()] : []),
      ]);

      if (opportunities.length === 0) {
        return [];
      }

      const TAG_VI_MAP: Record<string, string> = {
        partnership: 'Hợp tác B2B',
        investment: 'Đầu tư & Vốn',
        trade: 'Giao thương',
        supply: 'Cung ứng',
        b2b: 'Hợp tác B2B',
        export: 'Xuất nhập khẩu',
      };

      return opportunities.map((o, i) => {
        const rawTag = o.type || o.tag || 'Hợp tác B2B';
        const tagVi = TAG_VI_MAP[rawTag.toLowerCase()] || rawTag;
        const bMin = o.budget_min ? Number(o.budget_min) : undefined;
        const bMax = o.budget_max ? Number(o.budget_max) : undefined;
        let formattedVal = o.value || o.estimated_value || '';
        if (!formattedVal && (bMin || bMax)) {
          if (bMin && bMax && bMin !== bMax) {
            formattedVal = `${bMin.toLocaleString('vi-VN')} - ${bMax.toLocaleString('vi-VN')} đ`;
          } else if (bMax) {
            formattedVal = `${bMax.toLocaleString('vi-VN')} đ`;
          } else if (bMin) {
            formattedVal = `Từ ${bMin.toLocaleString('vi-VN')} đ`;
          }
        }
        if (!formattedVal) {
          formattedVal = 'Thỏa thuận B2B';
        }

        return {
          id: String(o.id),
          tag: tagVi,
          title: o.title,
          description: o.description || o.summary || '',
          company: o.company || o.poster_company || o.association_name || o.region || o.industry || 'CLB Doanh Nhân CEO 1983',
          time: o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString(),
          color: OPP_COLORS[i % OPP_COLORS.length],
          interested: myInterests.has(String(o.id)),
          image: o.image || o.cover_image || null,
          posterId: o.poster_id || o.poster_code || 'admin',
          posterCode: o.poster_code || o.poster_id || 'admin',
          posterName: o.contact_name || o.poster_name || o.poster_company || 'Hội viên CLB',
          contactName: o.contact_name || o.poster_name || 'Đại diện hợp tác',
          contactPhone: o.contact_phone || null,
          contactTitle: o.contact_title || 'Đại diện hợp tác',
          value: formattedVal,
          estimatedValue: Number(o.estimated_value || bMax || bMin || 0) || undefined,
          budgetMin: bMin,
          budgetMax: bMax,
          claimed: Boolean(o.claimed_by_id || o.claimed_at || o.claimed_by_name),
          claimedById: o.claimed_by_id || undefined,
          claimedByName: o.claimed_by_name || undefined,
          claimedAt: o.claimed_at ? new Date(o.claimed_at).toISOString() : undefined,
          claimedPhone: o.claimed_phone || undefined,
          claimedCompany: o.claimed_company || undefined,
          status: o.status || 'open',
          isOwner: myIds.has(String(o.poster_id || '').toLowerCase()) || (Boolean(o.poster_code) && myIds.has(String(o.poster_code).toLowerCase())),
        };
      });
    } catch {
      return [];
    }
  }

  async expressOpportunityInterest(userId: string, opportunityId: string, message?: string) {
    return this.expressCommunityOpportunityInterest(userId, '', opportunityId, 'high');
  }

  async incrementOpportunityView(opportunityId: string) {
    try {
      await this.repo.incrementOpportunityView(opportunityId);
      return { ok: true, id: opportunityId };
    } catch (err) {
      this.logger.warn('incrementOpportunityView error:', err);
      return { ok: false };
    }
  }

  async getOpportunityInterestedMembers(opportunityId: string) {
    try {
      const rows = await this.repo.getOpportunityInterestedMembers(opportunityId);
      return rows.map((r) => ({
        id: r.id,
        opportunityId: r.opportunity_id,
        memberId: r.member_id,
        name: r.name,
        company: r.company,
        phone: r.phone,
        email: r.email,
        contact: r.contact || r.phone,
        message: r.message,
        interestLevel: r.interest_level || 'high',
        createdAt: r.created_at,
      }));
    } catch (err) {
      this.logger.error('getOpportunityInterestedMembers error:', err);
      return [];
    }
  }
}

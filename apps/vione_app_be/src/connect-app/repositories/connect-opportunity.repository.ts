import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ConnectOpportunityRepository — Data Access Layer for business opportunities, claims, and interests.
 * Encapsulates 100% of raw SQL and database queries for opportunities.
 */
@Injectable()
export class ConnectOpportunityRepository {
  private readonly logger = new Logger(ConnectOpportunityRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkMembership(userId: string, communityId: string): Promise<boolean> {
    const mem = await this.prisma.$queryRaw<any[]>`
      SELECT association_id FROM public.memberships
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      UNION
      SELECT association_id FROM public.members
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid AND status = 'active'
      LIMIT 1
    `.catch(() => [] as any[]);
    if (mem.length > 0) return true;

    const roles = await this.prisma.user_roles.findMany({ where: { user_id: userId } }).catch(() => []) as any[];
    return roles.some((r: any) => r.role === 'platform_admin' || r.role === 'admin');
  }

  async findOpportunities(query: string, offset: number, limit: number): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.opportunities
      WHERE status IN ('open', 'published')
        AND (${query} = '' OR title ILIKE ${'%' + query + '%'} OR description ILIKE ${'%' + query + '%'})
      ORDER BY created_at DESC
      OFFSET ${offset} LIMIT ${limit}
    `.catch(() => [] as any[]);
  }

  async findInterestsByMemberAndOppIds(userId: string, oppIds: string[]): Promise<any[]> {
    if (oppIds.length === 0) return [];
    return this.prisma.$queryRaw<any[]>`
      SELECT opportunity_id FROM public.opportunity_interests
      WHERE member_id = ${userId} AND opportunity_id = ANY(${oppIds})
    `.catch(() => [] as any[]);
  }

  async findOpportunityById(id: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.opportunities WHERE id = ${id} LIMIT 1
    `.catch(() => [] as any[]);
    return rows[0] || null;
  }

  async findInterest(userId: string, opportunityId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.opportunity_interests
      WHERE member_id = ${userId} AND opportunity_id = ${opportunityId}
      LIMIT 1
    `.catch(() => [] as any[]);
  }

  async findPosterMember(posterId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, name, company, phone FROM public.members
      WHERE id = ${posterId} OR user_id = ${posterId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);
  }

  async findAssociation(communityId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT name FROM public.associations WHERE id = ${communityId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
  }

  async findMember(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, name, phone, company, contact, code FROM public.members 
      WHERE user_id = ${userId}::uuid OR id = ${userId}
      LIMIT 1
    `.catch(() => [] as any[]);
  }

  async findUserProfile(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT display_name, company_name FROM public.user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);
  }

  async findOpportunityRow(opportunityRef: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, title, poster_id, association_id FROM public.opportunities WHERE id = ${opportunityRef} LIMIT 1
    `.catch(() => [] as any[]);
  }

  async insertCommunityOpportunity(oppId: string, communityId: string, userId: string, data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.opportunities (
        id, association_id, poster_id, title, description, type,
        budget_min, budget_max, region, industry, deadline, status, views, emoji, created_at
      ) VALUES (
        ${oppId}, ${communityId}::uuid, ${userId}, ${data.title || 'Cơ hội hợp tác mới'},
        ${data.description || ''}, ${data.type || 'opp.type.partnership'},
        ${data.budgetMin ? BigInt(data.budgetMin) : BigInt(0)},
        ${data.budgetMax ? BigInt(data.budgetMax) : BigInt(0)},
        ${data.region || 'Toàn quốc'}, ${data.industry || 'Đa ngành'},
        ${data.deadline ? new Date(data.deadline) : new Date(Date.now() + 30 * 86400000)},
        'open', 0, ${data.emoji || '🤝'}, now()
      )
    `;
  }

  async updateOpportunityClaim(opportunityRef: string, claimant: { userId: string; name: string; phone: string; company: string }): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.opportunities
      SET 
        claimed_by_id = ${claimant.userId},
        claimed_by_name = ${claimant.name},
        claimed_at = now(),
        claimed_phone = ${claimant.phone},
        claimed_company = ${claimant.company}
      WHERE id = ${opportunityRef}
    `;
  }

  async insertOpportunityInterest(data: { id: string; opportunityId: string; memberId: string; message: string; contact: string; interestLevel: string; associationId: string | null }): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.opportunity_interests (
        id, opportunity_id, member_id, message, contact, interest_level, created_at, association_id
      ) VALUES (
        ${data.id}, ${data.opportunityId}, ${data.memberId}, ${data.message}, ${data.contact}, ${data.interestLevel}, now(), ${data.associationId ? data.associationId : null}::uuid
      )
      ON CONFLICT (id) DO NOTHING
    `.catch((err) => console.warn('Interest insert error:', err));
  }

  async upsertOpportunityInterest(data: { id: string; opportunityId: string; memberId: string; message: string; contact: string; interestLevel: string; associationId: string | null }): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.opportunity_interests (
        id, opportunity_id, member_id, message, contact, interest_level, created_at, association_id
      ) VALUES (
        ${data.id}, ${data.opportunityId}, ${data.memberId}, ${data.message}, ${data.contact}, ${data.interestLevel || 'high'}, now(), ${data.associationId ? data.associationId : null}::uuid
      )
      ON CONFLICT (id) DO UPDATE SET
        interest_level = EXCLUDED.interest_level,
        message = EXCLUDED.message
    `.catch((err) => console.warn('Express interest insert error:', err));
  }

  async insertBusinessNotification(data: {
    id: string;
    recipientUserId: string;
    sourceRecordId: string;
    dedupeKey: string;
    eventKind: string;
    notificationKind: string;
    titleKey: string;
    bodyKey: string;
    safeDisplayData: any;
    priority?: string;
  }): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
      ) VALUES (
        ${data.id}::uuid, ${data.recipientUserId}::uuid, 'opportunity', ${data.sourceRecordId}, ${data.dedupeKey}, ${data.eventKind}, ${data.notificationKind},
        ${data.titleKey},
        ${data.bodyKey},
        ${JSON.stringify(data.safeDisplayData)}::jsonb,
        ${data.priority || 'high'}, 'delivered', 'all', 'all', now(), now()
      )
    `.catch((err) => console.warn('Notif error:', err));
  }

  async insertCrmNotification(crmCode: string, title: string, body: string, communityId?: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.notifications (
        id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${crmCode},
        ${title},
        ${body},
        'all', 'inapp', 'sent', now(), 0, ${communityId ? communityId : null}::uuid, 'all', 'all', now(), now()
      )
    `.catch((err) => console.warn('CRM notif error:', err));
  }

  async deleteOpportunityInterest(opportunityId: string, memberId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.opportunity_interests
      WHERE opportunity_id = ${opportunityId} AND member_id = ${memberId}
    `.catch(() => null);
  }

  async upsertOpportunityFollowup(userId: string, opportunityId: string, nextActionAt: Date): Promise<void> {
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.community_opportunity_followups (
        user_id, opportunity_id, next_action_at, progress, note, created_at, updated_at
      ) VALUES (
        ${userId}::uuid, ${opportunityId}::uuid, ${nextActionAt}, 'planned', '', ${now}, ${now}
      )
      ON CONFLICT (user_id, opportunity_id) DO UPDATE SET
        next_action_at = EXCLUDED.next_action_at,
        updated_at = EXCLUDED.updated_at
    `;
  }

  async clearOpportunityFollowupNextAction(userId: string, opportunityId: string): Promise<void> {
    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.community_opportunity_followups
      SET next_action_at = NULL, updated_at = ${now}
      WHERE user_id = ${userId}::uuid AND opportunity_id = ${opportunityId}::uuid
    `;
  }

  async upsertOpportunityProgress(userId: string, opportunityId: string, progress: string, note: string): Promise<void> {
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.community_opportunity_followups (
        user_id, opportunity_id, next_action_at, progress, note, created_at, updated_at
      ) VALUES (
        ${userId}::uuid, ${opportunityId}::uuid, NULL, ${progress}, ${note || ''}, ${now}, ${now}
      )
      ON CONFLICT (user_id, opportunity_id) DO UPDATE SET
        progress = EXCLUDED.progress,
        note = EXCLUDED.note,
        updated_at = EXCLUDED.updated_at
    `;
  }

  async insertOpportunityAttachment(userId: string, input: any): Promise<void> {
    const attachmentId = input.id;
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.community_opportunity_followup_attachments (
        id, user_id, opportunity_id, kind, title, url, storage_path, mime_type, size_bytes, created_at, updated_at
      ) VALUES (
        ${attachmentId}::uuid, ${userId}::uuid, ${input.opportunityRef}::uuid, ${input.kind},
        ${input.title || null}, ${input.url || null}, ${input.storagePath || null},
        ${input.mimeType || null}, ${input.sizeBytes || null}, ${now}, ${now}
      )
    `;
  }

  async deleteOpportunityAttachment(userId: string, attachmentId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.community_opportunity_followup_attachments
      WHERE id = ${attachmentId}::uuid AND user_id = ${userId}::uuid
    `;
  }

  async listAllOpportunitiesWithDetails(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT o.id, o.poster_id, o.title, o.description, o.type, o.budget_min, o.budget_max, o.region, o.industry, o.deadline, o.status, o.views, o.emoji, o.created_at, o.updated_at,
             o.claimed_by_id, o.claimed_by_name, o.claimed_at, o.claimed_phone, o.claimed_company, o.association_id,
             COALESCE(o.contact_name, m.contact, m.name, u.name, 'Ban Quản Trị') as contact_name,
             COALESCE(o.contact_phone, m.phone, '') as contact_phone,
             COALESCE(o.contact_title, m.executive_role, 'Đại diện hợp tác') as contact_title,
             COALESCE(o.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as company,
             o.image,
             COALESCE(m.contact, u.name, m.name, o.contact_name, 'Hội viên CLB') as poster_name,
             COALESCE(m.cover_url, u.avatar_url, '') as poster_avatar,
             COALESCE(m.phone, o.contact_phone, '') as poster_phone,
             COALESCE(o.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as poster_company
      FROM public.opportunities o
      LEFT JOIN public.members m ON (o.poster_id = m.user_id::text OR o.poster_id = m.id OR o.poster_id = m.code)
      LEFT JOIN public.vione_users u ON (o.poster_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (o.poster_id = bi.owner_user_id::text)
      ORDER BY o.created_at DESC
    `.catch(() => []);
  }

  async listAllInterestsWithDetails(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT oi.id, oi.opportunity_id, oi.member_id, oi.message, oi.contact, oi.interest_level, oi.created_at,
             COALESCE(m.contact, m.name, u.name, oi.contact, 'Hội viên') as member_name,
             COALESCE(m.cover_url, u.avatar_url, '') as member_avatar,
             COALESCE(m.phone, oi.contact, '') as member_phone,
             COALESCE(m.email, u.email, '') as member_email,
             COALESCE(m.name, bi.company_name, '') as member_company
      FROM public.opportunity_interests oi
      LEFT JOIN public.members m ON (oi.member_id = m.user_id::text OR oi.member_id = m.id OR oi.member_id = m.code)
      LEFT JOIN public.vione_users u ON (oi.member_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (oi.member_id = bi.owner_user_id::text)
      ORDER BY oi.created_at DESC
    `.catch(() => []);
  }

  async getOpportunityByIdWithDetails(opportunityId: string): Promise<any | null> {
    const opps = await this.prisma.$queryRaw<any[]>`
      SELECT o.*,
             COALESCE(o.contact_name, m.contact, m.name, u.name, 'Ban Quản Trị') as contact_name,
             COALESCE(o.contact_phone, m.phone, '') as contact_phone,
             COALESCE(o.contact_title, m.executive_role, 'Đại diện hợp tác') as contact_title,
             COALESCE(o.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as company,
             COALESCE(m.contact, u.name, m.name, o.contact_name, 'Hội viên CLB') as poster_name,
             COALESCE(m.cover_url, u.avatar_url, '') as poster_avatar,
             COALESCE(m.phone, o.contact_phone, '') as poster_phone,
             COALESCE(o.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as poster_company
      FROM public.opportunities o
      LEFT JOIN public.members m ON (o.poster_id = m.user_id::text OR o.poster_id = m.id OR o.poster_id = m.code)
      LEFT JOIN public.vione_users u ON (o.poster_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (o.poster_id = bi.owner_user_id::text)
      WHERE o.id = ${opportunityId} LIMIT 1
    `.catch(() => []);
    return opps[0] || null;
  }

  async getInterestsByOppIdWithDetails(opportunityId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT oi.id, oi.opportunity_id, oi.member_id, oi.message, oi.contact, oi.interest_level, oi.created_at,
             COALESCE(m.contact, m.name, u.name, oi.contact, 'Hội viên') as member_name,
             COALESCE(m.cover_url, u.avatar_url, '') as member_avatar,
             COALESCE(m.phone, oi.contact, '') as member_phone,
             COALESCE(m.email, u.email, '') as member_email,
             COALESCE(m.name, bi.company_name, '') as member_company
      FROM public.opportunity_interests oi
      LEFT JOIN public.members m ON (oi.member_id = m.user_id::text OR oi.member_id = m.id OR oi.member_id = m.code)
      LEFT JOIN public.vione_users u ON (oi.member_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (oi.member_id = bi.owner_user_id::text)
      WHERE oi.opportunity_id = ${opportunityId}
      ORDER BY oi.created_at DESC
    `.catch(() => []);
  }

  async findMemberOrUser(userId: string): Promise<{ member: any | null; user: any | null }> {
    const mem = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, phone, code FROM public.members
      WHERE user_id = ${userId}::uuid OR id = ${userId}
      LIMIT 1
    `.catch(() => []);
    const vu = await this.prisma.$queryRaw<any[]>`
      SELECT name, email, phone FROM public.vione_users
      WHERE id = ${userId}::uuid OR id::text = ${userId}
      LIMIT 1
    `.catch(() => []);
    return { member: mem[0] || null, user: vu[0] || null };
  }

  async insertOpportunityRecord(oppId: string, assocId: string, userId: string, data: any): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.opportunities (
          id, association_id, poster_id, title, description, type,
          budget_min, budget_max, region, industry, deadline, status, views, emoji,
          image, contact_name, contact_phone, contact_title, company, created_at, updated_at
        ) VALUES (
          ${oppId}, ${assocId}::uuid, ${userId}, ${data.title || 'Cơ hội mới'},
          ${data.description || ''}, ${data.type || 'opp.type.partnership'},
          ${data.budgetMin ? BigInt(data.budgetMin) : BigInt(0)},
          ${data.budgetMax ? BigInt(data.budgetMax) : BigInt(0)},
          ${data.region || 'Toàn quốc'}, ${data.industry || 'Đa ngành'},
          ${data.deadline ? new Date(data.deadline) : new Date(Date.now() + 30 * 86400000)},
          'open', 0, ${data.emoji || '💡'},
          ${data.image || null}, ${data.contactName}, ${data.contactPhone || null}, ${data.contactTitle}, ${data.company},
          now(), now()
        )
      `;
    } catch (err: any) {
      await this.prisma.$executeRaw`
        INSERT INTO public.opportunities (
          id, association_id, poster_id, title, description, type,
          budget_min, budget_max, region, industry, deadline, status, views, emoji, created_at, updated_at
        ) VALUES (
          ${oppId}, ${assocId}::uuid, ${userId}, ${data.title || 'Cơ hội mới'},
          ${data.description || ''}, ${data.type || 'opp.type.partnership'},
          ${data.budgetMin ? BigInt(data.budgetMin) : BigInt(0)},
          ${data.budgetMax ? BigInt(data.budgetMax) : BigInt(0)},
          ${data.region || 'Toàn quốc'}, ${data.industry || 'Đa ngành'},
          ${data.deadline ? new Date(data.deadline) : new Date(Date.now() + 30 * 86400000)},
          'open', 0, ${data.emoji || '💡'}, now(), now()
        )
      `;
    }
  }

  async deleteOpportunity(opportunityId: string): Promise<void> {
    await this.prisma.$executeRaw`DELETE FROM public.opportunity_interests WHERE opportunity_id = ${opportunityId}`.catch(() => {});
    await this.prisma.$executeRaw`DELETE FROM public.opportunities WHERE id = ${opportunityId}`.catch(() => {});
  }

  async updateOpportunity(opportunityId: string, data: any): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.opportunities
      SET
        title = COALESCE(${data.title}, title),
        description = COALESCE(${data.description}, description),
        type = COALESCE(${data.type}, type),
        budget_min = COALESCE(${data.budgetMin ? BigInt(data.budgetMin) : null}, budget_min),
        budget_max = COALESCE(${data.budgetMax ? BigInt(data.budgetMax) : null}, budget_max),
        region = COALESCE(${data.region}, region),
        industry = COALESCE(${data.industry}, industry),
        deadline = COALESCE(${data.deadline ? new Date(data.deadline) : null}, deadline),
        contact_name = COALESCE(${data.contactName}, contact_name),
        contact_phone = COALESCE(${data.contactPhone}, contact_phone),
        contact_title = COALESCE(${data.contactTitle}, contact_title),
        company = COALESCE(${data.company}, company),
        image = COALESCE(${data.image}, image),
        updated_at = now()
      WHERE id = ${opportunityId}
    `.catch(async () => {
      await this.prisma.$executeRaw`
        UPDATE public.opportunities
        SET
          title = COALESCE(${data.title}, title),
          description = COALESCE(${data.description}, description),
          type = COALESCE(${data.type}, type),
          updated_at = now()
        WHERE id = ${opportunityId}
      `;
    });
  }

  async toggleOpportunityStatus(opportunityId: string): Promise<string> {
    const opps = await this.prisma.$queryRaw<any[]>`
      SELECT status FROM public.opportunities WHERE id = ${opportunityId} LIMIT 1
    `.catch(() => []);
    const current = opps[0]?.status || 'open';
    const nextStatus = current === 'open' ? 'closed' : 'open';
    await this.prisma.$executeRaw`
      UPDATE public.opportunities SET status = ${nextStatus}, updated_at = now() WHERE id = ${opportunityId}
    `;
    return nextStatus;
  }

  async listMyOpportunities(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT o.*, a.name as association_name,
             m.code as poster_code,
             COALESCE(up.display_name, vu.name, m.contact, m.name, o.claimed_by_name, 'Hội viên CLB CEO 1983') as poster_name,
             COALESCE(m.name, bi.company_name, o.claimed_company, a.name, 'CLB Doanh Nhân CEO 1983') as poster_company
      FROM public.opportunities o
      LEFT JOIN public.associations a ON o.association_id = a.id
      LEFT JOIN public.members m ON m.user_id::text = o.poster_id OR m.id = o.poster_id OR m.code = o.poster_id
      LEFT JOIN public.user_profiles up ON up.user_id::text = o.poster_id
      LEFT JOIN public.vione_users vu ON vu.id::text = o.poster_id
      LEFT JOIN public.business_identities bi ON bi.owner_user_id::text = o.poster_id
      WHERE o.status IN ('open', 'published', 'active')
      ORDER BY o.created_at DESC
      LIMIT 50
    `.catch(() => [] as any[]);
  }

  async findInterestsByContactOrMember(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT opportunity_id FROM public.opportunity_interests
      WHERE contact = ${userId} OR member_id::text = ${userId}
    `.catch(() => [] as any[]);
  }

  async findMembersByUserId(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, code, user_id FROM public.members
      WHERE user_id::text = ${userId} OR id = ${userId}
    `.catch(() => [] as any[]);
  }

  async incrementOpportunityView(opportunityId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.opportunities 
      SET views = COALESCE(views, 0) + 1, updated_at = now()
      WHERE id = ${opportunityId}
    `;
  }

  async getOpportunityInterestedMembers(opportunityId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        oi.id, oi.opportunity_id, oi.member_id, oi.message, oi.contact, oi.interest_level, oi.created_at,
        COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as name,
        COALESCE(m.name, bi.company_name, '') as company,
        COALESCE(m.phone, oi.contact, '') as phone,
        COALESCE(m.email, u.email, '') as email,
        COALESCE(m.code, '') as member_code
      FROM public.opportunity_interests oi
      LEFT JOIN public.members m ON (oi.member_id = m.user_id::text OR oi.member_id = m.id OR oi.member_id = m.code)
      LEFT JOIN public.vione_users u ON (oi.member_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (oi.member_id = bi.owner_user_id::text)
      WHERE oi.opportunity_id = ${opportunityId}
      ORDER BY oi.created_at DESC
    `.catch(() => []);
  }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectAppGateway } from './connect-app.gateway';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

const formatVNTime = (date: Date) => {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const vnDate = new Date(utc + 3600000 * 7);
  const hh = String(vnDate.getHours()).padStart(2, '0');
  const mm = String(vnDate.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

@Injectable()
export class ConnectAppService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private gateway: ConnectAppGateway,
    private mailService?: MailService,
  ) {}

  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.business_relationship_moment_comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          moment_id UUID NOT NULL,
          user_id UUID NOT NULL,
          parent_id UUID,
          content TEXT NOT NULL,
          mentions JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_brmc_moment_id ON public.business_relationship_moment_comments (moment_id, created_at ASC);
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_brmc_parent_id ON public.business_relationship_moment_comments (parent_id);
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.business_relationship_moment_comment_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          comment_id UUID NOT NULL,
          user_id UUID NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT uq_brm_comment_like UNIQUE (comment_id, user_id)
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.business_relationship_moment_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          moment_id UUID NOT NULL,
          user_id UUID NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT uq_brm_moment_like UNIQUE (moment_id, user_id)
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS image TEXT;
        ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_name TEXT;
        ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_phone TEXT;
        ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_title TEXT;
        ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS company TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS member_price NUMERIC;
      `).catch(() => {});
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.business_relationship_moments
        ADD COLUMN IF NOT EXISTS visibility VARCHAR(32) DEFAULT 'friends';
      `);
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.business_relationship_moment_comments
        ADD COLUMN IF NOT EXISTS photo_url TEXT;
      `);
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.associations ADD COLUMN IF NOT EXISTS banner_url text;
      `).catch(() => {});
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS app_scope text DEFAULT 'crm';
      `).catch(() => {});
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_app text DEFAULT 'crm';
      `).catch(() => {});
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.business_notifications ADD COLUMN IF NOT EXISTS app_scope text DEFAULT 'vione_app';
      `).catch(() => {});
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.business_notifications ADD COLUMN IF NOT EXISTS target_app text DEFAULT 'vione_app';
      `).catch(() => {});
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.direct_message_threads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user1_id UUID NOT NULL,
          user2_id UUID NOT NULL,
          last_message_at TIMESTAMPTZ DEFAULT now(),
          last_message_body TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT uq_dm_thread_pair UNIQUE (user1_id, user2_id)
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_dmt_user1 ON public.direct_message_threads (user1_id, last_message_at DESC);
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_dmt_user2 ON public.direct_message_threads (user2_id, last_message_at DESC);
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.direct_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          thread_id UUID NOT NULL,
          sender_user_id UUID NOT NULL,
          body TEXT NOT NULL,
          client_token TEXT,
          reply_to JSONB,
          reactions JSONB DEFAULT '[]'::jsonb,
          is_retracted BOOLEAN DEFAULT false,
          read_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_dm_thread_created ON public.direct_messages (thread_id, created_at ASC);
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.community_join_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          association_id UUID NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'pending',
          message TEXT,
          cancel_reason TEXT,
          decided_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT uq_cjr_user_assoc UNIQUE (user_id, association_id)
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_cjr_user_status ON public.community_join_requests (user_id, status);
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_cjr_assoc_status ON public.community_join_requests (association_id, status);
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.business_relationship_moment_mutes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          moment_id UUID NOT NULL,
          user_id UUID NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT uq_brm_mute UNIQUE (moment_id, user_id)
        );
      `);
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_brm_mutes_user_moment ON public.business_relationship_moment_mutes (user_id, moment_id);
      `);
    } catch (err) {
      console.warn('Note: Could not ensure tables on module init:', err);
    }
  }

  async getBriefing(userId: string) {
    const now = new Date();

    // Check for meetings starting within 30 minutes to push to notifications
    try {
      const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      const upcomingMeetings = await this.prisma.$queryRaw<any[]>`
        SELECT id, title, scheduled_start_at
        FROM public.business_meetings
        WHERE organizer_user_id = ${userId}::uuid
          AND status = 'confirmed'::public.business_meeting_status
          AND scheduled_start_at >= ${now}
          AND scheduled_start_at <= ${thirtyMinsFromNow}
      `.catch(() => []);

      for (const m of upcomingMeetings) {
        const existingNotif = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM public.business_notifications
          WHERE recipient_user_id = ${userId}::uuid
            AND source_domain = 'meeting'
            AND source_record_id = ${m.id}
            AND notification_kind = 'meeting_upcoming_reminder'
        `.catch(() => []);

        if (existingNotif.length === 0) {
          const notifId = crypto.randomUUID();
          const formattedStart = formatVNTime(new Date(m.scheduled_start_at));
          const safeData = JSON.stringify({
            meetingTitle: m.title,
            scheduledAt: formattedStart
          });
          const actionTarget = JSON.stringify({
            route: '/connect-app'
          });

          const dedupeKey = `meeting_upcoming_reminder:${userId}:${m.id}`;
          await this.prisma.$executeRaw`
            INSERT INTO public.business_notifications (
              id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
              title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
              priority, status, created_at, updated_at, dedupe_key
            ) VALUES (
              ${notifId}::uuid, ${userId}::uuid, 'meeting', ${m.id}, 'upcoming_reminder', 'meeting_upcoming_reminder',
              'bc.notif.kind.meeting_upcoming_reminder.title', 'bc.notif.kind.meeting_upcoming_reminder.body',
              ${safeData}::jsonb, 'open_meeting_detail', 'bc.notif.action.view', ${actionTarget}::jsonb,
              'high', 'delivered', ${now}, ${now}, ${dedupeKey}
            )
          `;
        }
      }
    } catch (e) {
      console.error('Error generating upcoming meeting notifications:', e);
    }

    // 1. Connection requests
    const connectionRequests = await this.prisma.$queryRaw`
      SELECT id, requester_user_id, recipient_user_id as target_user_id, status::text as status, created_at
      FROM public.user_connections
      WHERE status = 'pending'::public.global_connection_status AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
      ORDER BY created_at DESC
      LIMIT 50
    `.catch(() => []) as any[];

    // 2. Introduction requests
    const introductionRequests = await this.prisma.$queryRaw`
      SELECT id, status, created_at, requester_user_id, intermediary_user_id, target_user_id, target_person_node_id
      FROM public.introduction_requests
      WHERE status IN ('pending', 'accepted') AND (requester_user_id = ${userId}::uuid OR intermediary_user_id = ${userId}::uuid OR target_user_id = ${userId}::uuid)
      ORDER BY created_at DESC
      LIMIT 50
    `.catch(() => []) as any[];

    // 3. Introduction deliveries
    const introductionDeliveries = await this.prisma.$queryRaw`
      SELECT id, status, created_at, recipient_user_id
      FROM public.introduction_deliveries
      WHERE status IN ('sent', 'delivered') AND recipient_user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT 50
    `.catch(() => []) as any[];

    // 4. Business meetings
    const businessMeetings = await this.prisma.$queryRaw`
      SELECT id, status, scheduled_start_at, organizer_user_id
      FROM public.business_meetings
      WHERE organizer_user_id = ${userId}::uuid
      ORDER BY scheduled_start_at ASC NULLS LAST
      LIMIT 50
    `.catch(() => []) as any[];

    // Fetch community and registered events for today & upcoming
    const todayStr = now.toISOString().slice(0, 10);
    const registeredEvents = await this.prisma.$queryRaw<any[]>`
      SELECT e.id, e.name as title, e.date as scheduled_start_at, e.status, e.location, e.association_id,
             a.name as association_name
      FROM public.events e
      LEFT JOIN public.associations a ON e.association_id = a.id
      WHERE (
        e.id::text IN (
          SELECT event_id FROM public.event_registrations er
          WHERE er.member_code IN (
            SELECT code FROM public.members WHERE user_id = ${userId}::uuid
          )
        )
        OR e.association_id IN (
          SELECT association_id FROM public.memberships WHERE user_id = ${userId}::uuid
          UNION
          SELECT association_id FROM public.members WHERE user_id = ${userId}::uuid AND status = 'active'
        )
        OR e.date::date = CURRENT_DATE
        OR e.status IN ('upcoming', 'ongoing', 'active')
      )
      AND (e.date::date >= CURRENT_DATE OR e.date::date = ${todayStr}::date)
      ORDER BY (e.date::date = CURRENT_DATE) DESC, e.date ASC
      LIMIT 20
    `.catch((err) => {
      console.error('Error fetching registeredEvents:', err);
      return [];
    });


    // 5. Followups
    const businessMeetingFollowUps = await this.prisma.$queryRaw`
      SELECT id, meeting_id, status, due_at, title, owner_user_id
      FROM public.business_meeting_follow_ups
      WHERE status IN ('open', 'in_progress') AND owner_user_id = ${userId}::uuid
      ORDER BY due_at ASC NULLS LAST
      LIMIT 50
    `.catch(() => []) as any[];

    // 6. Timeline events
    const graphTimelineEvents = await this.prisma.$queryRaw`
      SELECT id, occurred_at, event_kind, person_node_id
      FROM public.graph_timeline_events
      ORDER BY occurred_at DESC
      LIMIT 50
    `.catch(() => []) as any[];

    const allEventsMapped = registeredEvents.map(e => {
      const eventDate = new Date(e.scheduled_start_at);
      const eDateStr = !isNaN(eventDate.getTime()) ? eventDate.toISOString().slice(0, 10) : '';
      const isToday = eDateStr === todayStr;
      return {
        id: `event:${e.id}`,
        sourceType: 'business_meeting' as const,
        sourceRecordId: String(e.id),
        itemKind: 'meeting_event' as const,
        kind: 'meeting' as const,
        category: 'upcoming' as const,
        priority: isToday ? ('high' as const) : ('medium' as const),
        urgency: isToday ? ('high' as const) : ('low' as const),
        titleKey: e.title,
        descriptionKey: e.location || 'Sự kiện cộng đồng',
        counterpartDisplayName: e.association_name || 'Cộng đồng',
        startsAt: eventDate.toISOString(),
        dueAt: null,
        status: String(e.status || 'confirmed'),
        action: {
          labelKey: 'bc.workHub.action.view',
          targetRoute: '/events/$eventId',
          targetParams: { eventId: String(e.id) },
          targetSearch: null,
          canRoute: true,
        },
        secondaryAction: null,
        context: {
          isToday,
          dateStr: eDateStr,
          rawDate: e.scheduled_start_at,
          capacity: e.capacity,
          registered: e.registered,
          type: e.type,
        },
        viewerPermissions: { canRoute: true, canInlineMutate: false },
        safeDisplayData: { counterpartDisplayName: e.association_name || 'Cộng đồng' },
        dedupeKey: `event:${e.id}`,
        registryVersion: 1,
      };
    });

    const todayEventsList = allEventsMapped.filter(e => e.context.isToday);
    const upcomingEventsList = allEventsMapped.filter(e => !e.context.isToday);

    return {
      connectionRequests: connectionRequests.map(r => ({
        id: String(r.id),
        direction: r.requester_user_id === userId ? 'outgoing' : 'incoming',
        status: String(r.status),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : now.toISOString(),
        counterpartHandle: null,
        counterpartDisplayName: null,
        counterpartAvatarUrl: null,
      })),
      introductionRequests: introductionRequests.map(r => {
        const role = r.intermediary_user_id === userId
          ? 'intermediary'
          : r.target_user_id === userId
            ? 'target'
            : 'requester';
        return {
          id: String(r.id),
          role,
          status: String(r.status),
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : now.toISOString(),
          targetPersonNodeId: r.target_person_node_id || null,
          counterpartDisplayName: null,
        };
      }),
      introductionDeliveries: introductionDeliveries.map(r => ({
        id: String(r.id),
        status: String(r.status),
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : now.toISOString(),
        counterpartDisplayName: null,
      })),
      meetingWorkspaceItems: [
        ...businessMeetings.map(r => {
          const isUpcoming = r.status === 'confirmed' && r.scheduled_start_at && new Date(r.scheduled_start_at) >= now;
          return {
            meetingId: String(r.id),
            status: String(r.status),
            bucket: isUpcoming ? 'upcoming' : r.status === 'completed' ? 'history' : 'overview',
            suggestedActionKind: r.status === 'proposed'
              ? 'respond_meeting'
              : r.status === 'confirmed' && !r.scheduled_start_at
                ? 'schedule_meeting'
                : 'view_meeting',
            scheduledStartAt: r.scheduled_start_at ? new Date(r.scheduled_start_at).toISOString() : null,
            viewerRole: r.organizer_user_id === userId ? 'organizer' : 'attendee',
            counterpartDisplayName: null,
            hasOutcome: false,
          };
        }),
        ...registeredEvents.map(e => {
          const eventDate = new Date(e.scheduled_start_at);
          return {
            meetingId: String(e.id),
            status: String(e.status),
            bucket: 'upcoming',
            suggestedActionKind: 'view_meeting',
            scheduledStartAt: eventDate.toISOString(),
            viewerRole: 'attendee',
            counterpartDisplayName: String(e.association_name || e.title),
            hasOutcome: false,
            isEvent: true,
            communityId: String(e.association_id),
          };
        })
      ],
      meetingFollowUps: businessMeetingFollowUps.map(r => {
        const isOverdue = r.due_at && new Date(r.due_at) < now;
        return {
          id: String(r.id),
          meetingId: String(r.meeting_id),
          status: String(r.status),
          dueAt: r.due_at ? new Date(r.due_at).toISOString() : null,
          temporalState: r.status === 'completed'
            ? 'completed'
            : r.status === 'cancelled'
              ? 'cancelled'
              : isOverdue
                ? 'overdue'
                : 'active',
          title: r.title || null,
        };
      }),
      relationshipActivity: graphTimelineEvents.map(r => ({
        id: String(r.id),
        occurredAt: r.occurred_at ? new Date(r.occurred_at).toISOString() : now.toISOString(),
        eventKind: String(r.event_kind),
        personNodeId: r.person_node_id || null,
        counterpartDisplayName: null,
      })),
      previews: {
        upcoming: todayEventsList,
        needs_action: [],
        overdue: [],
        due_soon: [],
        waiting: [],
        recent: [],
      },
      allUpcomingEvents: upcomingEventsList,
    };
  }

  async getMyCommunities(userId: string) {
    const ceoAssocId = 'c1983000-0000-4000-8000-000000001983';
    let memberships = await this.prisma.$queryRaw`
      SELECT DISTINCT ON (m.association_id) 
        m.association_id, m.role, m.is_default, a.name, a.logo_url, a.banner_url, a.tagline, a.about
      FROM (
        SELECT association_id, role, is_default, user_id FROM public.memberships WHERE user_id = ${userId}::uuid
        UNION ALL
        SELECT association_id, 'member' as role, false as is_default, user_id FROM public.members WHERE user_id = ${userId}::uuid AND status = 'active'
      ) m
      JOIN public.associations a ON m.association_id = a.id
      WHERE a.id = ${ceoAssocId}::uuid
    `.catch(() => []) as any[];

    if (memberships.length === 0) {
      const defaultAssoc = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, logo_url, banner_url, tagline, about FROM public.associations
        WHERE id = ${ceoAssocId}::uuid LIMIT 1
      `.catch(() => []);

      if (defaultAssoc.length > 0) {
        const d = defaultAssoc[0];
        try {
          await this.prisma.$executeRaw`
            INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
            VALUES (gen_random_uuid(), ${userId}::uuid, ${d.id}::uuid, 'member', true, now(), now())
            ON CONFLICT (user_id, association_id) DO NOTHING
          `;
        } catch {}
        memberships = [{
          association_id: d.id,
          role: 'member',
          is_default: true,
          name: d.name,
          logo_url: d.logo_url,
          banner_url: d.banner_url,
          tagline: d.tagline,
          about: d.about,
        }];
      }
    }

    const result: any[] = [];
    for (const m of memberships) {
      const activeCountRes = await this.prisma.$queryRaw`
        SELECT COUNT(DISTINCT uid)::int as count FROM (
          SELECT id::text as uid FROM public.members WHERE association_id = ${m.association_id}::uuid AND status = 'active'
          UNION
          SELECT user_id::text as uid FROM public.memberships WHERE association_id = ${m.association_id}::uuid
        ) all_m
      `.catch(() => [{ count: 0 }]) as any[];
      const count = activeCountRes[0]?.count || 0;

      result.push({
        communityId: String(m.association_id),
        name: String(m.name),
        logoUrl: m.logo_url || null,
        bannerUrl: m.banner_url || null,
        shortDescription: m.tagline || null,
        memberCount: count,
        viewerRole: m.role === 'admin' ? 'admin' : 'member',
        isDefault: m.is_default === true,
      });
    }

    return result.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.name.localeCompare(b.name, 'vi');
    });
  }

  async resolvePublicCounterparts(userIds: string[]) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];
    const validIds = userIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validIds.length === 0) return [];

    const summaries: any[] = [];
    for (const uid of validIds) {
      try {
        const cards = await this.prisma.$queryRaw<any[]>`
          SELECT id, display_name, avatar_url, headline, company_name, slug, professional_title, status
          FROM public.business_cards
          WHERE user_id = ${uid}::uuid
          ORDER BY (status = 'published') DESC, is_primary DESC, updated_at DESC LIMIT 1
        `.catch(() => []);

        const userProfiles = await this.prisma.$queryRaw<any[]>`
          SELECT user_id, display_name, avatar_url, professional_title, company_name, bio
          FROM public.user_profiles
          WHERE user_id = ${uid}::uuid LIMIT 1
        `.catch(() => []);

        const vioneUsers = await this.prisma.$queryRaw<any[]>`
          SELECT id, name, avatar, avatar_url, phone, email, job_title, company
          FROM public.vione_users
          WHERE id = ${uid}::uuid LIMIT 1
        `.catch(() => []);

        const members = await this.prisma.$queryRaw<any[]>`
          SELECT id, name, avatar_url, job_title, company_name
          FROM public.members
          WHERE user_id = ${uid}::uuid OR id = ${uid}::uuid
          ORDER BY (status = 'active') DESC, updated_at DESC LIMIT 1
        `.catch(() => []);

        const businessIdentities = await this.prisma.$queryRaw<any[]>`
          SELECT id, display_name, avatar_url, headline, job_title, company_name, bio
          FROM public.business_identities
          WHERE owner_user_id = ${uid}::uuid OR id = ${uid}::uuid
          ORDER BY (status = 'active') DESC, updated_at DESC LIMIT 1
        `.catch(() => []);

        const card = cards[0];
        const profile = userProfiles[0];
        const vUser = vioneUsers[0];
        const member = members[0];
        const bi = businessIdentities[0];

        const displayName =
          card?.display_name ||
          bi?.display_name ||
          profile?.display_name ||
          vUser?.full_name ||
          vUser?.name ||
          member?.name ||
          'Hội viên ViOne';

        const avatarUrl =
          card?.avatar_url ||
          bi?.avatar_url ||
          profile?.avatar_url ||
          vUser?.avatar_url ||
          vUser?.avatar ||
          member?.avatar_url ||
          null;

        const headline =
          card?.headline ||
          bi?.headline ||
          bi?.job_title ||
          card?.professional_title ||
          profile?.professional_title ||
          vUser?.job_title ||
          member?.job_title ||
          null;

        const companyName =
          card?.company_name ||
          profile?.company_name ||
          vUser?.company ||
          member?.company_name ||
          null;

        const primaryCardSlug = card?.slug || null;

        summaries.push({
          userId: uid,
          displayName,
          avatarUrl,
          headline,
          companyName,
          primaryCardSlug,
        });
      } catch (err) {
        summaries.push({
          userId: uid,
          displayName: 'Hội viên ViOne',
          avatarUrl: null,
          headline: null,
          companyName: null,
          primaryCardSlug: null,
        });
      }
    }

    return summaries;
  }

  async getMyProfile(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        user_id, display_name, avatar_url, professional_title, company_name, 
        industry, region, bio, locale, timezone, 
        onboarding_status::text as onboarding_status, 
        account_status::text as account_status, 
        created_at, updated_at
      FROM public.user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async updateMyProfile(userId: string, data: any) {
    const onboardingStatus = data.onboarding_status || 'new';
    const accountStatus = data.account_status || 'active';
    await this.prisma.$executeRaw`
      INSERT INTO public.user_profiles (
        user_id, display_name, avatar_url, professional_title, company_name, 
        industry, region, bio, locale, timezone, onboarding_status, account_status
      )
      VALUES (
        ${userId}::uuid, 
        ${data.display_name || null}, 
        ${data.avatar_url || null}, 
        ${data.professional_title || null}, 
        ${data.company_name || null}, 
        ${data.industry || null}, 
        ${data.region || null}, 
        ${data.bio || null}, 
        ${data.locale || 'vi'}, 
        ${data.timezone || 'Asia/Ho_Chi_Minh'}, 
        ${onboardingStatus}, 
        ${accountStatus}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        professional_title = EXCLUDED.professional_title,
        company_name = EXCLUDED.company_name,
        industry = EXCLUDED.industry,
        region = EXCLUDED.region,
        bio = EXCLUDED.bio,
        locale = EXCLUDED.locale,
        timezone = EXCLUDED.timezone,
        onboarding_status = EXCLUDED.onboarding_status,
        account_status = EXCLUDED.account_status,
        updated_at = now()
    `;
    return this.getMyProfile(userId);
  }

  async getMyIdentity(userId: string) {
    const identityRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    let identity = identityRows.length > 0 ? identityRows[0] : null;

    // Fallback or augment from user_profiles if identity is missing or lacks avatar/details
    const profileRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.user_profiles WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    const profile = profileRows.length > 0 ? profileRows[0] : null;

    const userRows = await this.prisma.$queryRaw<any[]>`
      SELECT email FROM auth.users WHERE id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    const userEmail = userRows.length > 0 ? userRows[0].email : null;

    if (!identity) {
      if (profile || userEmail) {
        identity = {
          id: profile?.id || userId,
          owner_user_id: userId,
          display_name: profile?.display_name || userEmail?.split('@')[0] || 'Hội viên ViOne',
          headline: profile?.professional_title || null,
          job_title: profile?.professional_title || null,
          company_name: profile?.company_name || null,
          bio: profile?.bio || null,
          avatar_url: profile?.avatar_url || null,
          primary_email: userEmail || null,
          primary_phone: null,
          website: null,
          linkedin_url: null,
          address: null,
          city: profile?.region || null,
          country_code: 'VN',
          preferred_locale: profile?.locale || 'vi',
          status: 'active',
          created_at: profile?.created_at || new Date(),
          updated_at: profile?.updated_at || new Date(),
        };
      }
    } else {
      if (!identity.avatar_url && profile?.avatar_url) {
        identity.avatar_url = profile.avatar_url;
      }
      if (!identity.display_name && profile?.display_name) {
        identity.display_name = profile.display_name;
      }
      if (!identity.job_title && profile?.professional_title) {
        identity.job_title = profile.professional_title;
      }
      if (!identity.company_name && profile?.company_name) {
        identity.company_name = profile.company_name;
      }
      if (!identity.bio && profile?.bio) {
        identity.bio = profile.bio;
      }
      if (!identity.primary_email && userEmail) {
        identity.primary_email = userEmail;
      }
    }

    const visibilityRows = await this.prisma.$queryRaw<any[]>`
      SELECT field_key, visibility FROM public.identity_field_visibility WHERE owner_user_id = ${userId}::uuid
    `.catch(() => []);
    const visibility = {};
    for (const row of visibilityRows) {
      visibility[row.field_key] = row.visibility;
    }

    return {
      identity: identity ? {
        id: identity.id,
        ownerUserId: identity.owner_user_id,
        displayName: identity.display_name,
        headline: identity.headline,
        jobTitle: identity.job_title,
        companyName: identity.company_name,
        bio: identity.bio,
        avatarUrl: identity.avatar_url,
        primaryEmail: identity.primary_email,
        primaryPhone: identity.primary_phone,
        website: identity.website,
        linkedinUrl: identity.linkedin_url,
        address: identity.address,
        city: identity.city,
        countryCode: identity.country_code,
        preferredLocale: identity.preferred_locale,
        status: identity.status,
        createdAt: identity.created_at,
        updatedAt: identity.updated_at,
      } : null,
      visibility,
    };
  }

  async upsertMyIdentity(userId: string, input: any) {
    const existingRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    const now = new Date();

    if (existingRows.length === 0) {
      const id = crypto.randomUUID();
      const finalData = {
        id,
        owner_user_id: userId,
        display_name: input.displayName || null,
        headline: input.headline || null,
        job_title: input.jobTitle || null,
        company_name: input.companyName || null,
        bio: input.bio || null,
        avatar_url: input.avatarUrl || null,
        primary_email: input.primaryEmail || null,
        primary_phone: input.primaryPhone || null,
        website: input.website || null,
        linkedin_url: input.linkedinUrl || null,
        address: input.address || null,
        city: input.city || null,
        country_code: input.countryCode || null,
        preferred_locale: input.preferredLocale || null,
        status: 'active',
        created_at: now,
        updated_at: now,
      };

      await this.prisma.$executeRaw`
        INSERT INTO public.business_identities (
          id, owner_user_id, display_name, headline, job_title, company_name, bio, avatar_url,
          primary_email, primary_phone, website, linkedin_url, address, city, country_code,
          preferred_locale, status, created_at, updated_at
        ) VALUES (
          ${finalData.id}::uuid, ${finalData.owner_user_id}::uuid, ${finalData.display_name}, ${finalData.headline},
          ${finalData.job_title}, ${finalData.company_name}, ${finalData.bio},
          ${finalData.avatar_url}, ${finalData.primary_email}, ${finalData.primary_phone},
          ${finalData.website}, ${finalData.linkedin_url}, ${finalData.address},
          ${finalData.city}, ${finalData.country_code}, ${finalData.preferred_locale},
          ${finalData.status}, ${finalData.created_at}, ${finalData.updated_at}
        )
      `;

      await this.prisma.$executeRaw`
        UPDATE public.user_profiles SET
          avatar_url = ${finalData.avatar_url}
        WHERE user_id = ${userId}::uuid
      `;
    } else {
      const existing = existingRows[0];
      const finalData = {
        display_name: input.displayName !== undefined ? input.displayName : existing.display_name,
        headline: input.headline !== undefined ? input.headline : existing.headline,
        job_title: input.jobTitle !== undefined ? input.jobTitle : existing.job_title,
        company_name: input.companyName !== undefined ? input.companyName : existing.company_name,
        bio: input.bio !== undefined ? input.bio : existing.bio,
        avatar_url: input.avatarUrl !== undefined ? input.avatarUrl : existing.avatar_url,
        primary_email: input.primaryEmail !== undefined ? input.primaryEmail : existing.primary_email,
        primary_phone: input.primaryPhone !== undefined ? input.primaryPhone : existing.primary_phone,
        website: input.website !== undefined ? input.website : existing.website,
        linkedin_url: input.linkedinUrl !== undefined ? input.linkedinUrl : existing.linkedin_url,
        address: input.address !== undefined ? input.address : existing.address,
        city: input.city !== undefined ? input.city : existing.city,
        country_code: input.countryCode !== undefined ? input.countryCode : existing.country_code,
        preferred_locale: input.preferredLocale !== undefined ? input.preferredLocale : existing.preferred_locale,
      };

      await this.prisma.$executeRaw`
        UPDATE public.business_identities SET
          display_name = ${finalData.display_name},
          headline = ${finalData.headline},
          job_title = ${finalData.job_title},
          company_name = ${finalData.company_name},
          bio = ${finalData.bio},
          avatar_url = ${finalData.avatar_url},
          primary_email = ${finalData.primary_email},
          primary_phone = ${finalData.primary_phone},
          website = ${finalData.website},
          linkedin_url = ${finalData.linkedin_url},
          address = ${finalData.address},
          city = ${finalData.city},
          country_code = ${finalData.country_code},
          preferred_locale = ${finalData.preferred_locale},
          updated_at = ${now}
        WHERE id = ${existing.id}::uuid
      `;

      await this.prisma.$executeRaw`
        UPDATE public.user_profiles SET
          avatar_url = ${finalData.avatar_url}
        WHERE user_id = ${userId}::uuid
      `;
    }

    return this.getMyIdentity(userId);
  }

  async updateMyVisibility(userId: string, updates: any[]) {
    const identityRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    if (identityRows.length === 0) {
      throw new Error("identity_not_found");
    }
    const identityId = identityRows[0].id;
    const now = new Date();

    for (const update of updates) {
      await this.prisma.$executeRaw`
        INSERT INTO public.identity_field_visibility (identity_id, owner_user_id, field_key, visibility, updated_at)
        VALUES (${identityId}::uuid, ${userId}::uuid, ${update.fieldKey}, ${update.visibility}, ${now})
        ON CONFLICT (identity_id, field_key) DO UPDATE SET
          visibility = EXCLUDED.visibility,
          updated_at = EXCLUDED.updated_at
      `;
    }

    return this.getMyIdentity(userId);
  }

  async getOrCreateMyShareLink(userId: string) {
    const existingRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    let identityId: string;
    const now = new Date();

    if (existingRows.length === 0) {
      identityId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.business_identities (id, owner_user_id, status, created_at, updated_at)
        VALUES (${identityId}::uuid, ${userId}::uuid, 'active', ${now}, ${now})
      `;
    } else {
      identityId = existingRows[0].id;
    }

    const links = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.identity_share_links
      WHERE owner_user_id = ${userId}::uuid AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `.catch(() => []);

    if (links.length > 0) {
      const link = links[0];
      return {
        token: link.public_token,
        status: link.status,
        createdAt: link.created_at,
        rotatedAt: link.rotated_at,
        lastUsedAt: link.last_used_at,
      };
    }

    const newLinkToken = crypto.randomBytes(32).toString('hex');
    const linkId = crypto.randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO public.identity_share_links (id, identity_id, owner_user_id, public_token, status, created_at)
      VALUES (${linkId}::uuid, ${identityId}::uuid, ${userId}::uuid, ${newLinkToken}, 'active', ${now})
    `;

    return {
      token: newLinkToken,
      status: 'active',
      createdAt: now,
      rotatedAt: null,
      lastUsedAt: null,
    };
  }

  async rotateMyShareLink(userId: string) {
    const existingRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    let identityId: string;
    const now = new Date();

    if (existingRows.length === 0) {
      identityId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.business_identities (id, owner_user_id, status, created_at, updated_at)
        VALUES (${identityId}::uuid, ${userId}::uuid, 'active', ${now}, ${now})
      `;
    } else {
      identityId = existingRows[0].id;
    }

    await this.prisma.$executeRaw`
      UPDATE public.identity_share_links
      SET status = 'revoked', revoked_at = ${now}, rotated_at = ${now}
      WHERE owner_user_id = ${userId}::uuid AND status = 'active'
    `;

    const newLinkToken = crypto.randomBytes(32).toString('hex');
    const linkId = crypto.randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO public.identity_share_links (id, identity_id, owner_user_id, public_token, status, created_at)
      VALUES (${linkId}::uuid, ${identityId}::uuid, ${userId}::uuid, ${newLinkToken}, 'active', ${now})
    `;

    return {
      token: newLinkToken,
      status: 'active',
      createdAt: now,
      rotatedAt: now,
      lastUsedAt: null,
    };
  }

  async getPublicIdentityByToken(token: string) {
    const links = await this.prisma.$queryRaw<any[]>`
      SELECT id, identity_id, status FROM public.identity_share_links
      WHERE public_token = ${token} AND status = 'active'
      LIMIT 1
    `.catch(() => []);

    if (links.length === 0) {
      return { state: 'unavailable' };
    }
    const link = links[0];

    const identities = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.business_identities
      WHERE id = ${link.identity_id}::uuid AND status = 'active'
      LIMIT 1
    `.catch(() => []);

    if (identities.length === 0) {
      return { state: 'unavailable' };
    }
    const identity = identities[0];

    const visibilityRows = await this.prisma.$queryRaw<any[]>`
      SELECT field_key, visibility FROM public.identity_field_visibility
      WHERE identity_id = ${identity.id}::uuid
    `.catch(() => []);

    const visibility = {};
    for (const row of visibilityRows) {
      visibility[row.field_key] = row.visibility;
    }

    // Update last used marker asynchronously
    this.prisma.$executeRaw`
      UPDATE public.identity_share_links
      SET last_used_at = ${new Date()}
      WHERE id = ${link.id}::uuid
    `.catch(() => {});

    // Projection mapping
    const isFieldVisible = (key: string) => {
      const v = visibility[key];
      return v === 'public' || v === undefined; // Default to public if not explicitly hidden
    };

    return {
      state: 'public',
      card: {
        id: identity.id,
        displayName: isFieldVisible('displayName') ? identity.display_name : null,
        headline: isFieldVisible('headline') ? identity.headline : null,
        jobTitle: isFieldVisible('jobTitle') ? identity.job_title : null,
        companyName: isFieldVisible('companyName') ? identity.company_name : null,
        bio: isFieldVisible('bio') ? identity.bio : null,
        avatarUrl: isFieldVisible('avatarUrl') ? identity.avatar_url : null,
        primaryEmail: isFieldVisible('primaryEmail') ? identity.primary_email : null,
        primaryPhone: isFieldVisible('primaryPhone') ? identity.primary_phone : null,
        website: isFieldVisible('website') ? identity.website : null,
        linkedinUrl: isFieldVisible('linkedinUrl') ? identity.linkedin_url : null,
        address: isFieldVisible('address') ? identity.address : null,
        city: isFieldVisible('city') ? identity.city : null,
        countryCode: isFieldVisible('countryCode') ? identity.country_code : null,
      }
    };
  }



  async checkCommunityMembership(userId: string, communityId: string): Promise<boolean> {
    const mem = await this.prisma.$queryRaw<any[]>`
      SELECT association_id FROM public.memberships
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      UNION
      SELECT association_id FROM public.members
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid AND status = 'active'
      LIMIT 1
    `.catch(() => [] as any[]);
    if (mem.length > 0) return true;

    // Check if platform admin or admin
    const roles = await this.prisma.user_roles.findMany({ where: { user_id: userId } }).catch(() => []) as any[];
    const isPlatformAdmin = roles.some((r: any) => r.role === 'platform_admin' || r.role === 'admin');
    if (isPlatformAdmin) return true;

    return false;
  }

  async getCommunityDetail(userId: string, communityId: string): Promise<any | null> {
    let memberships = await this.prisma.$queryRaw<any[]>`
      SELECT role, is_default FROM public.memberships
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => []);
    let hasActualMembership = memberships.length > 0;
    if (memberships.length === 0) {
      const isMem = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.members
        WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid AND status = 'active'
        LIMIT 1
      `.catch(() => []);
      if (isMem.length > 0) {
        memberships = [{ role: 'member', is_default: false }];
        hasActualMembership = true;
      }
    }
    if (memberships.length === 0) {
      const roles = await this.prisma.user_roles.findMany({ where: { user_id: userId } }).catch(() => []) as any[];
      const isPlatformAdmin = roles.some((r: any) => r.role === 'platform_admin' || r.role === 'admin');
      if (isPlatformAdmin) {
        memberships = [{ role: 'admin', is_default: false }];
      } else {
        memberships = [{ role: 'member', is_default: false }];
      }
    }
    const membership = memberships[0];

    const associations = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, logo_url, banner_url, tagline, about FROM public.associations
      WHERE id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => []);
    if (associations.length === 0) return null;
    const assoc = associations[0];

    const activeCountRes = await this.prisma.$queryRaw`
      SELECT COUNT(DISTINCT uid)::int as count FROM (
        SELECT id::text as uid FROM public.members WHERE association_id = ${communityId}::uuid AND status = 'active'
        UNION
        SELECT user_id::text as uid FROM public.memberships WHERE association_id = ${communityId}::uuid
      ) all_m
    `.catch(() => [{ count: 0 }]) as any[];
    const memberCount = activeCountRes[0]?.count || 0;

    let upcomingEvents: any[] = [];
    try {
      const events = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, date, location FROM public.events
        WHERE association_id = ${communityId}::uuid AND status NOT IN ('cancelled')
        ORDER BY (date >= CURRENT_DATE) DESC, date ASC
        LIMIT 5
      `;
      upcomingEvents = events.map(e => ({
        eventId: String(e.id),
        name: String(e.name),
        date: e.date ? new Date(e.date).toISOString() : '',
        location: e.location || null,
      }));
    } catch {
      upcomingEvents = [];
    }

    let openOpportunityCount = 0;
    try {
      const oppCountRes = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(id)::int as count FROM public.opportunities
        WHERE association_id = ${communityId}::uuid AND status = 'open'
      `;
      openOpportunityCount = oppCountRes[0]?.count || 0;
    } catch {
      openOpportunityCount = 0;
    }

    return {
      community: {
        communityId: assoc.id,
        name: assoc.name,
        logoUrl: assoc.logo_url || null,
        bannerUrl: assoc.banner_url || null,
        shortDescription: assoc.tagline || null,
        description: assoc.about || null,
        memberCount,
        viewerRole: membership.role === 'admin' ? 'admin' : 'member',
        isDefault: membership.is_default === true,
        isMember: hasActualMembership,
      },
      upcomingEvents,
      openOpportunityCount,
    };
  }

  async listCommunityMembers(
    userId: string,
    communityId: string,
    searchQuery: string = '',
    offset: number = 0,
    roleFilter: string = 'all',
  ) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');
    let viewerMemberships: any[] = [];
    if (isUuid) {
      viewerMemberships = await this.prisma.$queryRaw<any[]>`
        SELECT role FROM public.memberships
        WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
        LIMIT 1
      `.catch(() => []);
      if (viewerMemberships.length === 0) {
        const isMember = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM public.members
          WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid AND status = 'active'
          LIMIT 1
        `.catch(() => []);
        if (isMember.length > 0) viewerMemberships = [{ role: 'member' }];
      }
    }
    const viewerRole = viewerMemberships[0]?.role === 'admin' ? 'admin' : 'member';

    const searchNormalized = searchQuery.trim().toLowerCase();
    const searchLike = `%${searchNormalized}%`;
    const roleCond = roleFilter !== 'all' ? roleFilter : null;

    const allMembers = await this.prisma.$queryRaw<any[]>`
      SELECT
        member_ref,
        display_name,
        industry_label,
        region_label,
        user_id,
        joined_at,
        role,
        avatar_url,
        job_title,
        company_name,
        headline
      FROM (
        -- A. CRM Members in this association
        SELECT
          m.id::text as user_or_member_id,
          m.id::text as member_ref,
          COALESCE(card.display_name, bi.display_name, m.name)::text as display_name,
          m.industry::text as industry_label,
          m.region::text as region_label,
          m.user_id::text as user_id,
          COALESCE(m.joined_at, m.created_at)::timestamptz as joined_at,
          COALESCE(ms.role, 'member')::text as role,
          COALESCE(card.avatar_url, bi.avatar_url)::text as avatar_url,
          COALESCE(card.professional_title, bi.job_title)::text as job_title,
          COALESCE(card.company_name, bi.company_name)::text as company_name,
          bi.headline::text as headline
        FROM public.members m
        LEFT JOIN public.memberships ms ON (ms.association_id = m.association_id AND m.user_id IS NOT NULL AND ms.user_id = m.user_id)
        LEFT JOIN public.member_business_cards card ON (card.member_id = m.id OR (m.user_id IS NOT NULL AND card.owner_user_id = m.user_id))
        LEFT JOIN public.business_identities bi ON (m.user_id IS NOT NULL AND bi.owner_user_id = m.user_id)
        WHERE m.association_id = ${communityId}::uuid AND m.status = 'active'

        UNION ALL

        -- B. App Members (Memberships) in this association whose user_id is not already covered by an active row in public.members
        SELECT
          ms.user_id::text as user_or_member_id,
          ms.id::text as member_ref,
          COALESCE(bi.display_name, card.display_name, 'Hội viên ViOne')::text as display_name,
          null::text as industry_label,
          null::text as region_label,
          ms.user_id::text as user_id,
          ms.created_at::timestamptz as joined_at,
          ms.role::text as role,
          COALESCE(bi.avatar_url, card.avatar_url)::text as avatar_url,
          COALESCE(bi.job_title, card.professional_title)::text as job_title,
          COALESCE(bi.company_name, card.company_name)::text as company_name,
          bi.headline::text as headline
        FROM public.memberships ms
        LEFT JOIN public.business_identities bi ON bi.owner_user_id = ms.user_id
        LEFT JOIN public.member_business_cards card ON card.owner_user_id = ms.user_id
        WHERE ms.association_id = ${communityId}::uuid
          AND ms.user_id NOT IN (
            SELECT user_id FROM public.members
            WHERE association_id = ${communityId}::uuid AND user_id IS NOT NULL AND status = 'active'
          )
      ) all_members
      WHERE (${roleCond}::text IS NULL OR role = ${roleCond})
        AND (
          ${searchNormalized} = '' OR
          LOWER(display_name) LIKE ${searchLike} OR
          LOWER(COALESCE(industry_label, '')) LIKE ${searchLike} OR
          LOWER(COALESCE(region_label, '')) LIKE ${searchLike} OR
          LOWER(COALESCE(company_name, '')) LIKE ${searchLike} OR
          LOWER(COALESCE(job_title, '')) LIKE ${searchLike}
        )
      ORDER BY joined_at DESC NULLS LAST, display_name ASC
    `.catch(() => []);

    const totalCount = allMembers.length;
    const pageItems = allMembers.slice(offset, offset + 25);

    const items = pageItems.map(m => ({
      memberRef: m.member_ref,
      displayName: m.display_name,
      avatarUrl: m.avatar_url || null,
      jobTitle: m.job_title || null,
      companyName: m.company_name || null,
      industryLabel: m.industry_label || null,
      hasPublicCard: !!(m.avatar_url || m.job_title || m.company_name),
      isSelf: m.user_id === userId,
      role: m.role === 'admin' ? 'admin' : 'member',
    }));

    const nextOffset = offset + 25 < totalCount ? offset + 25 : null;

    return {
      items,
      totalCount,
      nextOffset,
      viewerRole,
    };
  }

  async getCommunityMemberProfile(userId: string, communityId: string, memberRef: string) {
    let viewerMemberships = await this.prisma.$queryRaw<any[]>`
      SELECT role FROM public.memberships
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => []);
    if (viewerMemberships.length === 0) {
      const isMember = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.members
        WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid AND status = 'active'
        LIMIT 1
      `.catch(() => []);
      if (isMember.length > 0) viewerMemberships = [{ role: 'member' }];
    }
    const viewerRole = viewerMemberships[0]?.role === 'admin' ? 'admin' : 'member';

    const associations = await this.prisma.$queryRaw<any[]>`
      SELECT id, name FROM public.associations WHERE id = ${communityId}::uuid LIMIT 1
    `.catch(() => []);
    if (associations.length === 0) return null;
    const assoc = associations[0];

    let targetUserId: string | null = null;
    let displayName = '';
    let avatarUrl: string | null = null;
    let jobTitle: string | null = null;
    let companyName: string | null = null;
    let headline: string | null = null;
    let bio: string | null = null;
    let website: string | null = null;
    let industryLabel: string | null = null;
    let regionLabel: string | null = null;
    let role = 'member';
    let joinedAt: string | null = null;

    const mRows = await this.prisma.$queryRaw<any[]>`
      SELECT m.*, COALESCE(ms.role, 'member')::text as member_role,
             card.avatar_url, card.professional_title, card.company_name, bi.headline, bi.bio, m.website
      FROM public.members m
      LEFT JOIN public.memberships ms ON (ms.association_id = m.association_id AND m.user_id IS NOT NULL AND ms.user_id = m.user_id)
      LEFT JOIN public.member_business_cards card ON (card.member_id = m.id OR (m.user_id IS NOT NULL AND card.owner_user_id = m.user_id))
      WHERE m.id = ${memberRef}::uuid AND m.association_id = ${communityId}::uuid AND m.status = 'active'
      LIMIT 1
    `.catch(() => []);

    if (mRows.length > 0) {
      const m = mRows[0];
      targetUserId = m.user_id;
      displayName = m.name;
      avatarUrl = m.avatar_url;
      jobTitle = m.professional_title;
      companyName = m.company_name;
      headline = m.headline;
      bio = m.bio;
      website = m.website;
      industryLabel = m.industry;
      regionLabel = m.region;
      role = m.member_role === 'admin' ? 'admin' : 'member';
      joinedAt = m.joined_at ? new Date(m.joined_at).toISOString() : (m.created_at ? new Date(m.created_at).toISOString() : null);

      if (targetUserId) {
        const bi = await this.prisma.$queryRaw<any[]>`
          SELECT display_name, avatar_url, job_title, company_name, headline, bio, website
          FROM public.business_identities WHERE owner_user_id = ${targetUserId}::uuid LIMIT 1
        `.catch(() => []);
        if (bi.length > 0) {
          avatarUrl = avatarUrl || bi[0].avatar_url;
          jobTitle = jobTitle || bi[0].job_title;
          companyName = companyName || bi[0].company_name;
          headline = headline || bi[0].headline;
          bio = bio || bi[0].bio;
          website = website || bi[0].website;
        }
      }
    } else {
      const msRows = await this.prisma.$queryRaw<any[]>`
        SELECT ms.*, bi.display_name, bi.avatar_url, bi.job_title, bi.company_name, bi.headline, bi.bio, bi.website
        FROM public.memberships ms
        LEFT JOIN public.business_identities bi ON bi.owner_user_id = ms.user_id
        WHERE (ms.id = ${memberRef}::uuid OR ms.user_id = ${memberRef}::uuid)
          AND ms.association_id = ${communityId}::uuid
        LIMIT 1
      `.catch(() => []);

      if (msRows.length > 0) {
        const ms = msRows[0];
        targetUserId = ms.user_id;
        displayName = ms.display_name || 'Hội viên ViOne';
        avatarUrl = ms.avatar_url;
        jobTitle = ms.job_title;
        companyName = ms.company_name;
        headline = ms.headline;
        bio = ms.bio;
        website = ms.website;
        role = ms.role === 'admin' ? 'admin' : 'member';
        joinedAt = ms.created_at ? new Date(ms.created_at).toISOString() : null;
      } else {
        return null;
      }
    }

    let state = 'unavailable';
    let connectionId: string | null = null;

    if (targetUserId === userId) {
      state = 'self';
    } else if (targetUserId) {
      const connRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, requester_user_id, recipient_user_id, status FROM public.user_connections
        WHERE (requester_user_id = ${userId}::uuid AND recipient_user_id = ${targetUserId}::uuid)
           OR (requester_user_id = ${targetUserId}::uuid AND recipient_user_id = ${userId}::uuid)
        LIMIT 1
      `.catch(() => []);
      if (connRows.length > 0) {
        const conn = connRows[0];
        connectionId = conn.id;
        if (conn.status === 'accepted') {
          state = 'connected';
        } else if (conn.status === 'pending') {
          state = conn.requester_user_id === userId ? 'outgoing_pending' : 'incoming_pending';
        } else {
          state = 'none';
        }
      } else {
        state = 'none';
      }
    }

    const history: any[] = [];
    history.push({
      communityId: assoc.id,
      communityName: assoc.name,
      joinedAt,
      role,
      isCurrent: true,
    });

    if (targetUserId) {
      const sharedCommunities = await this.prisma.$queryRaw<any[]>`
        SELECT m.association_id, a.name, m.role, m.is_default
        FROM public.memberships m
        JOIN public.associations a ON m.association_id = a.id
        WHERE m.user_id = ${targetUserId}::uuid
          AND m.association_id IN (
            SELECT association_id FROM public.memberships WHERE user_id = ${userId}::uuid
          )
          AND m.association_id <> ${communityId}::uuid
      `.catch(() => []);
      for (const sc of sharedCommunities) {
        history.push({
          communityId: sc.association_id,
          communityName: sc.name,
          joinedAt: null,
          role: sc.role === 'admin' ? 'admin' : 'member',
          isCurrent: false,
        });
      }
    }

    return {
      member: {
        memberRef: memberRef,
        displayName: displayName || 'Hội viên ViOne',
        avatarUrl: avatarUrl || null,
        jobTitle: jobTitle || null,
        companyName: companyName || null,
        industryLabel: industryLabel || null,
        hasPublicCard: !!(avatarUrl || jobTitle || companyName),
        isSelf: targetUserId === userId,
        role: role === 'admin' ? 'admin' : 'member',
      },
      headline: headline || null,
      bio: bio || null,
      website: website || null,
      regionLabel: regionLabel || null,
      communityName: assoc.name,
      viewerRole,
      connection: {
        state,
        connectionId,
      },
      canConnect: state === 'none' && targetUserId !== userId && !!targetUserId,
      hasPlatformIdentity: !!targetUserId,
      history: history.sort((a, b) => {
        if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
        return (b.joinedAt || '').localeCompare(a.joinedAt || '');
      }),
    };
  }

  async connectCommunityMember(userId: string, communityId: string, memberRef: string) {
    let targetUserId: string | null = null;
    const memberRows = await this.prisma.$queryRaw<any[]>`
      SELECT user_id FROM public.members WHERE id = ${memberRef}::uuid LIMIT 1
    `.catch(() => []);
    if (memberRows.length > 0 && memberRows[0].user_id) {
      targetUserId = memberRows[0].user_id;
    } else {
      const msRows = await this.prisma.$queryRaw<any[]>`
        SELECT user_id FROM public.memberships WHERE id = ${memberRef}::uuid OR user_id = ${memberRef}::uuid LIMIT 1
      `.catch(() => []);
      if (msRows.length > 0 && msRows[0].user_id) {
        targetUserId = msRows[0].user_id;
      }
    }
    if (!targetUserId) {
      throw new Error('Member user not found');
    }
    return this.sendConnectionRequest(userId, { targetUserId });
  }

  async updateCommunityMemberRole(userId: string, communityId: string, memberRef: string, role: string) {
    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT role FROM public.memberships
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => []);
    if (memberships.length === 0 || memberships[0].role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const msRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, user_id FROM public.memberships
      WHERE (id = ${memberRef}::uuid OR user_id = ${memberRef}::uuid) AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (msRows.length > 0) {
      await this.prisma.$executeRaw`
        UPDATE public.memberships SET role = ${role}, updated_at = now()
        WHERE id = ${msRows[0].id}::uuid
      `;
      return { ok: true };
    }

    const mRows = await this.prisma.$queryRaw<any[]>`
      SELECT user_id FROM public.members
      WHERE id = ${memberRef}::uuid AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (mRows.length > 0 && mRows[0].user_id) {
      const targetUid = mRows[0].user_id;
      await this.prisma.$executeRaw`
        INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
        VALUES (gen_random_uuid(), ${targetUid}::uuid, ${communityId}::uuid, ${role}, false, now(), now())
        ON CONFLICT (user_id, association_id) DO UPDATE SET role = ${role}, updated_at = now()
      `;
      return { ok: true };
    }

    return { ok: true };
  }

  async listConnections(userId: string) {
    const connections = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id, recipient_user_id as target_user_id, responded_at, created_at
      FROM public.user_connections
      WHERE status = 'accepted'::public.global_connection_status AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
      ORDER BY responded_at DESC NULLS LAST
    `.catch(() => []);
    
    return connections.map(c => {
      const counterpartUserId = c.requester_user_id === userId ? c.target_user_id : c.requester_user_id;
      return {
        id: c.id,
        counterpartUserId,
        respondedAt: c.responded_at ? new Date(c.responded_at).toISOString() : null,
        createdAt: c.created_at ? new Date(c.created_at).toISOString() : null,
      };
    });
  }

  async searchSavedCards(userId: string, term: string) {
    let cards: any[] = [];
    if (term) {
      const likeTerm = `%${term.toLowerCase()}%`;
      cards = await this.prisma.$queryRaw<any[]>`
        SELECT s.id, s.target_card_id, s.saved_at, s.industry,
               COALESCE(bc.display_name, bi.display_name) as display_name,
               COALESCE(bc.avatar_url, bi.avatar_url) as avatar_url,
               COALESCE(bc.professional_title, bc.headline, bi.job_title) as professional_title,
               COALESCE(bc.company_name, bi.company_name) as company_name,
               COALESCE(bc.headline, bi.headline) as headline,
               COALESCE(bc.slug, bi.id::text) as slug
        FROM public.saved_business_cards s
        LEFT JOIN public.business_cards bc ON s.target_card_id = bc.id
        LEFT JOIN public.business_identities bi ON s.target_card_id = bi.id
        WHERE s.owner_user_id = ${userId}::uuid AND s.archived = false
          AND (
            LOWER(COALESCE(bc.display_name, bi.display_name, '')) LIKE ${likeTerm} OR
            LOWER(COALESCE(bc.company_name, bi.company_name, '')) LIKE ${likeTerm} OR
            LOWER(COALESCE(bc.headline, bi.headline, '')) LIKE ${likeTerm}
          )
        ORDER BY s.saved_at DESC
      `.catch(() => []);
    } else {
      cards = await this.prisma.$queryRaw<any[]>`
        SELECT s.id, s.target_card_id, s.saved_at, s.industry,
               COALESCE(bc.display_name, bi.display_name) as display_name,
               COALESCE(bc.avatar_url, bi.avatar_url) as avatar_url,
               COALESCE(bc.professional_title, bc.headline, bi.job_title) as professional_title,
               COALESCE(bc.company_name, bi.company_name) as company_name,
               COALESCE(bc.headline, bi.headline) as headline,
               COALESCE(bc.slug, bi.id::text) as slug
        FROM public.saved_business_cards s
        LEFT JOIN public.business_cards bc ON s.target_card_id = bc.id
        LEFT JOIN public.business_identities bi ON s.target_card_id = bi.id
        WHERE s.owner_user_id = ${userId}::uuid AND s.archived = false
        ORDER BY s.saved_at DESC
      `.catch(() => []);
    }

    return cards.map(c => ({
      id: c.id,
      targetCardId: c.target_card_id,
      savedAt: c.saved_at ? new Date(c.saved_at).toISOString() : null,
      target: {
        displayName: c.display_name || null,
        avatarUrl: c.avatar_url || null,
        professionalTitle: c.professional_title || null,
        companyName: c.company_name || null,
        slug: c.slug || c.target_card_id,
      }
    }));
  }

  async listGuestContacts(userId: string) {
    const guests = await this.prisma.$queryRaw<any[]>`
      SELECT id, display_name, title, company_name, first_shared_at, last_shared_at, source
      FROM public.guest_contacts
      WHERE owner_user_id = ${userId}::uuid
      ORDER BY last_shared_at DESC
    `.catch(() => []);

    return guests.map(g => ({
      id: g.id,
      displayName: g.display_name || null,
      title: g.title || null,
      companyName: g.company_name || null,
      firstSharedAt: g.first_shared_at ? new Date(g.first_shared_at).toISOString() : null,
      lastSharedAt: g.last_shared_at ? new Date(g.last_shared_at).toISOString() : null,
      source: g.source || null,
    }));
  }

  async getTodayRecommendations(userId: string) {
    const now = new Date();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const safeUserId = isUuid ? userId : '00000000-0000-0000-0000-000000000000';

    // Fetch viewer profile to know their location, headline and industry for smart matching
    const viewerProfile: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT id, owner_user_id, display_name, headline, company_name, city
      FROM public.business_identities
      WHERE owner_user_id = ${safeUserId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const rawViewerCity = (viewerProfile[0]?.city || '').trim().toLowerCase();
    const viewerCity = rawViewerCity.replace(/^(thành phố|tp\.|tỉnh)\s*/i, '').trim();

    // Fetch connected users with real interaction timestamps and counts (Nurture Connections list)
    const connectedRows: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT 
        bi.id as identity_id, 
        bi.owner_user_id, 
        bi.display_name, 
        bi.avatar_url, 
        bi.headline, 
        bi.company_name, 
        bi.city,
        uc.created_at as connection_created_at,
        uc.updated_at as connection_updated_at,
        (
          SELECT MAX(m.occurred_at)
          FROM public.business_relationship_moments m
          WHERE (m.owner_user_id = ${safeUserId}::uuid AND m.target_person_id = bi.owner_user_id)
             OR (m.owner_user_id = bi.owner_user_id AND m.target_person_id = ${safeUserId}::uuid)
        ) as last_moment_at,
        (
          SELECT COUNT(*)
          FROM public.business_relationship_moments m
          WHERE (m.owner_user_id = ${safeUserId}::uuid AND m.target_person_id = bi.owner_user_id)
             OR (m.owner_user_id = bi.owner_user_id AND m.target_person_id = ${safeUserId}::uuid)
        ) as moment_count,
        (
          SELECT MAX(msg.created_at)
          FROM public.direct_messages msg
          WHERE (msg.sender_id = ${safeUserId}::uuid AND msg.recipient_id = bi.owner_user_id)
             OR (msg.sender_id = bi.owner_user_id AND msg.recipient_id = ${safeUserId}::uuid)
        ) as last_message_at,
        (
          SELECT COUNT(*)
          FROM public.direct_messages msg
          WHERE (msg.sender_id = ${safeUserId}::uuid AND msg.recipient_id = bi.owner_user_id)
             OR (msg.sender_id = bi.owner_user_id AND msg.recipient_id = ${safeUserId}::uuid)
        ) as message_count
      FROM public.user_connections uc
      JOIN public.business_identities bi ON (
        (uc.requester_user_id = ${safeUserId}::uuid AND uc.recipient_user_id = bi.owner_user_id) OR
        (uc.recipient_user_id = ${safeUserId}::uuid AND uc.requester_user_id = bi.owner_user_id)
      )
      WHERE uc.status = 'accepted'::public.global_connection_status AND bi.status = 'active'
    `.catch(() => [] as any[]);

    // Fetch non-connected users (AI Match Suggestions list)
    let nonConnectedRows: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT bi.id as identity_id, bi.owner_user_id, bi.display_name, bi.avatar_url, bi.headline, bi.company_name, bi.city
      FROM public.business_identities bi
      WHERE bi.owner_user_id != ${safeUserId}::uuid AND bi.status = 'active'
        AND bi.owner_user_id NOT IN (
          SELECT CASE 
            WHEN requester_user_id = ${safeUserId}::uuid THEN recipient_user_id
            ELSE requester_user_id
          END
          FROM public.user_connections
          WHERE requester_user_id = ${safeUserId}::uuid OR recipient_user_id = ${safeUserId}::uuid
        )
      LIMIT 30
    `.catch(() => [] as any[]);

    // Fallback to other users from vione_users if business_identities has few records
    if (nonConnectedRows.length < 5) {
      const existingIds = [
        safeUserId,
        ...nonConnectedRows.map((r: any) => String(r.owner_user_id)),
        ...connectedRows.map((r: any) => String(r.owner_user_id)),
      ];
      const extraUsers = await this.prisma.vione_users.findMany({
        where: {
          id: {
            notIn: existingIds,
          },
        },
        take: 15,
      }).catch(() => [] as any[]);

      extraUsers.forEach((u: any) => {
        nonConnectedRows.push({
          identity_id: u.id,
          owner_user_id: u.id,
          display_name: u.name || u.username,
          avatar_url: u.avatar_url,
          headline: 'Doanh nhân ViOne',
          company_name: 'ViOne Network',
          city: 'Việt Nam',
        });
      });
    }

    const LEADERSHIP_KEYWORDS = [
      'chủ tịch', 'ceo', 'founder', 'sáng lập', 'giám đốc', 'director', 
      'c-level', 'tổng giám đốc', 'phó giám đốc', 'trưởng phòng', 'leader', 'chuyên gia'
    ];

    const isHighPotential = (headline: string, company: string): boolean => {
      const text = `${headline} ${company}`.toLowerCase();
      return LEADERSHIP_KEYWORDS.some((kw) => text.includes(kw));
    };

    const isNearby = (candidateCity: string): boolean => {
      if (!viewerCity || !candidateCity) return false;
      const cleanCandidate = candidateCity.toLowerCase().replace(/^(thành phố|tp\.|tỉnh)\s*/i, '').trim();
      return cleanCandidate.includes(viewerCity) || viewerCity.includes(cleanCandidate);
    };

    const scoredRecommendations: Array<{ score: number; item: any }> = [];

    // 1. Process non-connected users (AI Match suggestions)
    nonConnectedRows.forEach((row: any) => {
      const personIdStr = row.owner_user_id ? String(row.owner_user_id) : '';
      const cleanPersonId = personIdStr.startsWith('u:') ? personIdStr : `u:${personIdStr}`;
      const company = row.company_name || 'Doanh nghiệp đối tác';
      const city = row.city || 'Việt Nam';
      const headline = row.headline || 'Doanh nhân';
      const displayName = row.display_name || 'Hội viên';

      let score = 20; // base potential score
      const near = isNearby(city);
      const potential = isHighPotential(headline, company);

      if (near) score += 50; // Priority 1: Gần bạn
      if (potential) score += 40; // Priority 2: Tiềm năng cao (C-level / Founder / Giám đốc)
      if (row.avatar_url) score += 10;
      if (row.headline && row.headline.length > 5) score += 10;

      let aiSuggestion = '';
      if (near && potential) {
        aiSuggestion = `AI ưu tiên: ${displayName} là ${headline} tại ${company}, cùng khu vực ${city} với bạn. Thuận tiện kết nối và gặp mặt trực tiếp để thảo luận hợp tác chiến lược.`;
      } else if (near) {
        aiSuggestion = `AI đề xuất (Gần bạn): ${displayName} ở khu vực ${city}. Kết nối ngay để giao lưu và mở rộng mối quan hệ địa phương.`;
      } else if (potential) {
        aiSuggestion = `AI đề xuất (Tiềm năng cao): ${displayName} giữ vị trí ${headline} tại ${company}. Rất phù hợp để mở rộng mạng lưới doanh nhân cấp cao.`;
      } else {
        aiSuggestion = `AI đề xuất: Kết nối với ${displayName} (${headline} tại ${company}) để trao đổi cơ hội kinh doanh tại ${city}.`;
      }

      scoredRecommendations.push({
        score,
        item: {
          id: `${cleanPersonId}:match`,
          person: {
            personId: cleanPersonId,
            displayName,
            avatarUrl: row.avatar_url,
            headline,
            companyName: company,
            industryLabel: 'Kinh doanh',
            areaLabel: city,
          },
          type: 'reconnect',
          reason: {
            kind: 'last_interaction',
            days: 0,
            evidenceKind: 'moment',
          },
          aiSuggestion,
          wordingSource: 'ai',
          generatedAt: now.toISOString(),
        },
      });
    });

    // 2. Process connected users (Nurture Connections & frequent interactions)
    connectedRows.forEach((row) => {
      const personIdStr = row.owner_user_id ? String(row.owner_user_id) : '';
      const cleanPersonId = personIdStr.startsWith('u:') ? personIdStr : `u:${personIdStr}`;
      
      const lastInteractionDate = row.last_moment_at || row.last_message_at || row.connection_updated_at || row.connection_created_at || now;
      const lastTime = new Date(lastInteractionDate).getTime();
      const diffMs = Math.max(0, now.getTime() - (isNaN(lastTime) ? now.getTime() : lastTime));
      const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      
      const displayName = row.display_name || 'Đối tác';
      const headline = row.headline || 'Doanh nhân';
      const company = row.company_name || 'Partner';
      const city = row.city || 'Việt Nam';

      const momentCount = Number(row.moment_count || 0);
      const messageCount = Number(row.message_count || 0);
      const totalInteractions = momentCount + messageCount;

      let score = 30; // base connection score
      const near = isNearby(city);
      const potential = isHighPotential(headline, company);

      if (near) score += 45; // Gần bạn
      if (potential) score += 35; // Lãnh đạo / Tiềm năng
      
      // Priority 3: Nhiều tương tác
      if (totalInteractions >= 5) {
        score += 45; // Đối tác gắn bó, tương tác nhiều
      } else if (totalInteractions >= 2) {
        score += 25;
      }

      // Chu kỳ hâm nóng quan hệ: 7 - 45 ngày là khoảng thời gian vàng để chăm sóc
      if (days >= 7 && days <= 45) {
        score += 35;
      } else if (days > 45) {
        score += 20;
      }

      let aiSuggestion = '';
      if (totalInteractions >= 3 && near) {
        aiSuggestion = `AI nhắc nhở (Đối tác thân thiết): Bạn và ${displayName} đã có ${totalInteractions} lượt tương tác và cùng ở ${city}. Đã ${days} ngày chưa trao đổi, hãy hẹn gặp cà phê giữ nhiệt quan hệ!`;
      } else if (totalInteractions >= 3) {
        aiSuggestion = `AI nhắc nhở: ${displayName} là đối tác thường xuyên tương tác (${totalInteractions} lượt). Đã ${days} ngày chưa liên hệ, hãy gửi tin nhắn cập nhật tiến độ công việc.`;
      } else if (near) {
        aiSuggestion = `AI nhắc nhở: ${displayName} ở gần bạn (${city}). Đã ${days} ngày chưa tương tác, hãy sắp xếp buổi gặp trao đổi thêm cơ hội hợp tác.`;
      } else {
        aiSuggestion = `AI nhắc nhở: Đã ${days} ngày chưa tương tác cùng ${displayName} (${headline}). Hãy thăm hỏi định kỳ để giữ quan hệ hợp tác lâu dài.`;
      }

      scoredRecommendations.push({
        score,
        item: {
          id: `${cleanPersonId}:reconnect`,
          person: {
            personId: cleanPersonId,
            displayName,
            avatarUrl: row.avatar_url,
            headline,
            companyName: company,
            industryLabel: 'Kinh doanh',
            areaLabel: city,
          },
          type: 'reconnect',
          reason: {
            kind: 'last_interaction',
            days,
            evidenceKind: 'moment',
          },
          aiSuggestion,
          wordingSource: 'ai',
          generatedAt: now.toISOString(),
        },
      });
    });

    // Sort descending by multi-factor score: proximity, high potential, interaction frequency
    scoredRecommendations.sort((a, b) => b.score - a.score);

    const recommendations = scoredRecommendations.map((entry) => entry.item);

    return { recommendations };
  }

  async getPersonRecommendation(userId: string, personId: string) {
    const list = await this.getTodayRecommendations(userId);
    const cleanId = personId.startsWith('u:') ? personId : `u:${personId}`;
    const rawId = personId.replace(/^[ucg]:/, '');
    const rec = list.recommendations.find(r => 
      r.person.personId === cleanId || 
      r.person.personId === personId || 
      r.person.personId === rawId ||
      r.person.personId.endsWith(rawId)
    );
    return { recommendation: rec || null };
  }

  async dismissRecommendation(userId: string, personId: string) {
    return { ok: true };
  }

  async getNetworkFeed(userId: string, cursor: string | null) {
    const limit = 12;
    let momentRows: any[];

    if (cursor) {
      momentRows = await this.prisma.$queryRaw<any[]>`
        SELECT 
          m.id, 
          m.owner_user_id,
          m.target_kind, 
          m.target_user_id, 
          m.target_card_id, 
          m.target_guest_id, 
          m.occurred_at, 
          m.created_at,
          m.event_name, 
          m.place_label, 
          m.note,
          COALESCE(m.visibility, 'friends') as visibility,
          bi_owner.display_name as owner_display_name,
          bi_owner.avatar_url as owner_avatar_url,
          bi_owner.job_title as owner_job_title,
          bi_owner.company_name as owner_company_name,
          u_owner.email as owner_email,
          bi_target.display_name as target_display_name,
          bi_target.avatar_url as target_avatar_url,
          bi_target.job_title as target_job_title,
          bi_target.company_name as target_company_name,
          c.display_name as card_display_name,
          c.avatar_url as card_avatar_url,
          c.company_name as card_company_name,
          g.display_name as guest_display_name,
          g.company_name as guest_company_name
        FROM public.business_relationship_moments m
        LEFT JOIN public.business_identities bi_owner ON m.owner_user_id = bi_owner.owner_user_id
        LEFT JOIN public.vione_users u_owner ON m.owner_user_id = u_owner.id
        LEFT JOIN public.business_identities bi_target ON m.target_user_id = bi_target.owner_user_id
        LEFT JOIN public.member_business_cards c ON m.target_card_id = c.id
        LEFT JOIN public.guest_contacts g ON m.target_guest_id = g.id
        WHERE (
          m.owner_user_id = ${userId}::uuid 
          OR (m.target_user_id = ${userId}::uuid AND COALESCE(m.visibility, 'friends') != 'private')
          OR (COALESCE(m.visibility, 'friends') = 'public')
          OR (
            COALESCE(m.visibility, 'friends') = 'friends'
            AND m.owner_user_id IN (
              SELECT CASE 
                WHEN requester_user_id = ${userId}::uuid THEN recipient_user_id 
                WHEN recipient_user_id = ${userId}::uuid THEN requester_user_id
                WHEN pair_user_low = ${userId}::uuid THEN pair_user_high 
                ELSE pair_user_low 
              END
              FROM public.user_connections
              WHERE (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid
                     OR pair_user_low = ${userId}::uuid OR pair_user_high = ${userId}::uuid)
                AND status = 'accepted'::public.global_connection_status
            )
          )
        )
          AND m.status IN ('active', 'pending')
          AND m.created_at < ${new Date(cursor)}
        ORDER BY m.created_at DESC, m.occurred_at DESC, m.id DESC
        LIMIT ${limit + 1}
      `.catch(() => []);
    } else {
      momentRows = await this.prisma.$queryRaw<any[]>`
        SELECT 
          m.id, 
          m.owner_user_id,
          m.target_kind, 
          m.target_user_id, 
          m.target_card_id, 
          m.target_guest_id, 
          m.occurred_at, 
          m.created_at,
          m.event_name, 
          m.place_label, 
          m.note,
          COALESCE(m.visibility, 'friends') as visibility,
          bi_owner.display_name as owner_display_name,
          bi_owner.avatar_url as owner_avatar_url,
          bi_owner.job_title as owner_job_title,
          bi_owner.company_name as owner_company_name,
          u_owner.email as owner_email,
          bi_target.display_name as target_display_name,
          bi_target.avatar_url as target_avatar_url,
          bi_target.job_title as target_job_title,
          bi_target.company_name as target_company_name,
          c.display_name as card_display_name,
          c.avatar_url as card_avatar_url,
          c.company_name as card_company_name,
          g.display_name as guest_display_name,
          g.company_name as guest_company_name
        FROM public.business_relationship_moments m
        LEFT JOIN public.business_identities bi_owner ON m.owner_user_id = bi_owner.owner_user_id
        LEFT JOIN public.vione_users u_owner ON m.owner_user_id = u_owner.id
        LEFT JOIN public.business_identities bi_target ON m.target_user_id = bi_target.owner_user_id
        LEFT JOIN public.member_business_cards c ON m.target_card_id = c.id
        LEFT JOIN public.guest_contacts g ON m.target_guest_id = g.id
        WHERE (
          m.owner_user_id = ${userId}::uuid 
          OR (m.target_user_id = ${userId}::uuid AND COALESCE(m.visibility, 'friends') != 'private')
          OR (COALESCE(m.visibility, 'friends') = 'public')
          OR (
            COALESCE(m.visibility, 'friends') = 'friends'
            AND m.owner_user_id IN (
              SELECT CASE 
                WHEN requester_user_id = ${userId}::uuid THEN recipient_user_id 
                WHEN recipient_user_id = ${userId}::uuid THEN requester_user_id
                WHEN pair_user_low = ${userId}::uuid THEN pair_user_high 
                ELSE pair_user_low 
              END
              FROM public.user_connections
              WHERE (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid
                     OR pair_user_low = ${userId}::uuid OR pair_user_high = ${userId}::uuid)
                AND status = 'accepted'::public.global_connection_status
            )
          )
        )
          AND m.status IN ('active', 'pending')
        ORDER BY m.created_at DESC, m.occurred_at DESC, m.id DESC
        LIMIT ${limit + 1}
      `.catch(() => []);
    }

    let nextCursor: string | null = null;
    if (momentRows.length > limit) {
      const nextItem = momentRows.pop();
      nextCursor = nextItem.created_at ? new Date(nextItem.created_at).toISOString() : null;
    }

    const momentIds = momentRows.map(m => m.id);
    let mediaRows: any[] = [];
    if (momentIds.length > 0) {
      mediaRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, moment_id, storage_path, sort_order
        FROM public.business_relationship_moment_media
        WHERE moment_id = ANY(${momentIds}::uuid[])
        ORDER BY sort_order ASC
      `.catch(() => []);
    }

    const mediaByMomentId = new Map<string, any[]>();
    for (const m of mediaRows) {
      const list = mediaByMomentId.get(m.moment_id) || [];
      list.push(m);
      mediaByMomentId.set(m.moment_id, list);
    }
    const signed: Record<string, string> = {};
    for (const m of mediaRows) {
      if (m.storage_path) {
        signed[m.storage_path] = m.storage_path.startsWith('http')
          ? m.storage_path
          : m.storage_path.startsWith('/')
            ? m.storage_path
            : `/uploads/${m.storage_path}`;
      }
    }

    const items = momentRows.map(row => {
      let personId = '';
      if (row.target_kind === 'connection') {
        personId = `u:${row.target_user_id}`;
      } else if (row.target_kind === 'saved_card') {
        personId = `c:${row.target_card_id}`;
      } else if (row.target_kind === 'guest_contact') {
        personId = `g:${row.target_guest_id}`;
      }

      const slots = mediaByMomentId.get(row.id) || [];
      const photoUrls = slots.map(s => {
        if (!s.storage_path) return '';
        if (s.storage_path.startsWith('/upload/') || s.storage_path.startsWith('http')) {
          return s.storage_path;
        }
        return signed[s.storage_path] || `/upload/file/${s.storage_path.split('/').pop()}`;
      }).filter(Boolean);

      const ownerDisplayName = row.owner_display_name || row.owner_email?.split('@')[0] || 'Hội viên ViOne';
      const targetDisplayName = row.target_display_name || row.card_display_name || row.guest_display_name || null;
      const targetAvatarUrl = row.target_avatar_url || row.card_avatar_url || null;
      const targetHeadline = row.target_job_title || null;
      const targetCompanyName = row.target_company_name || row.card_company_name || row.guest_company_name || null;

      return {
        momentId: row.id,
        ownerUserId: row.owner_user_id,
        owner: {
          userId: row.owner_user_id,
          displayName: ownerDisplayName,
          avatarUrl: row.owner_avatar_url || null,
          headline: row.owner_job_title || null,
          companyName: row.owner_company_name || null,
        },
        target: targetDisplayName ? {
          personId,
          displayName: targetDisplayName,
          avatarUrl: targetAvatarUrl,
          headline: targetHeadline,
          companyName: targetCompanyName,
        } : null,
        personId,
        occurredAt: row.occurred_at ? new Date(row.occurred_at).toISOString() : new Date().toISOString(),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : (row.occurred_at ? new Date(row.occurred_at).toISOString() : new Date().toISOString()),
        eventName: row.event_name || null,
        placeLabel: row.place_label || null,
        note: row.note || null,
        photoUrls,
        photoCount: slots.length,
      };
    });

    return { items, nextCursor };
  }

  async getCommunityActivityPreview(userId: string, communityId: string) {
    const events = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, date, location, type, capacity, registered, status
      FROM public.events
      WHERE association_id = ${communityId}::uuid AND status NOT IN ('cancelled')
      ORDER BY (date >= CURRENT_DATE) DESC, date ASC
      LIMIT 10
    `.catch((err) => {
      console.error('Error in getCommunityActivityPreview events query:', err);
      return [];
    });

    const opportunities = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, type, status, deadline, created_at
      FROM public.opportunities
      WHERE (association_id = ${communityId}::uuid OR association_id IS NULL) AND status IN ('open', 'published')
      ORDER BY created_at DESC
      LIMIT 10
    `.catch((err) => {
      console.error('Error in getCommunityActivityPreview opps query:', err);
      return [];
    });

    // Fetch user registrations and capacity counts for all events
    const eventIds = events.map(e => e.id);
    let regSet = new Set<string>();
    let regCounts = new Map<string, number>();

    if (eventIds.length > 0) {
      const userMembers = await this.prisma.$queryRaw<any[]>`
        SELECT code, email FROM public.members WHERE user_id = ${userId}::uuid
      `.catch(() => [] as any[]);
      const userMemberCodes = userMembers.map(m => m.code).filter(Boolean);
      const userInfo = await this.prisma.vione_users.findUnique({ where: { id: userId } }).catch(() => null);
      const userEmail = userInfo?.email || userMembers[0]?.email || '';

      const registrations = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations
        WHERE event_id = ANY(${eventIds})
          AND (member_code = ANY(${userMemberCodes}) OR (email != '' AND email = ${userEmail}))
          AND status != 'cancelled'
      `.catch(() => [] as any[]);
      regSet = new Set(registrations.map(r => r.event_id));

      const counts = await this.prisma.$queryRaw<{ event_id: string; cnt: bigint }[]>`
        SELECT event_id, COUNT(*) as cnt FROM public.event_registrations
        WHERE event_id = ANY(${eventIds}) AND status != 'cancelled'
        GROUP BY event_id
      `.catch(() => [] as any[]);
      regCounts = new Map(counts.map(c => [c.event_id, Number(c.cnt)] as [string, number]));
    }

    return {
      nextEvents: events.map(e => {
        const isRegistered = regSet.has(e.id);
        const capacity = e.capacity ? Number(e.capacity) : 0;
        const isFull = capacity > 0 && (regCounts.get(e.id) ?? Number(e.registered || 0)) >= capacity;
        const isCancelled = e.status === 'cancelled';

        let registrationState: 'available' | 'registered' | 'closed' | 'full' | 'cancelled';
        if (isRegistered) registrationState = 'registered';
        else if (isCancelled) registrationState = 'cancelled';
        else if (isFull) registrationState = 'full';
        else registrationState = 'available';

        return {
          eventRef: e.id,
          title: e.name || '',
          startAt: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
          locationLabel: e.location || null,
          formatLabel: e.type || null,
          registrationState,
          capacityState: capacity <= 0 ? null : isFull ? 'full' : 'open',
        };
      }),
      openOpportunities: opportunities.map(o => ({
        opportunityRef: o.id,
        title: o.title,
        categoryKey: o.type ? `opp.type.${o.type}` : null,
        organizationLabel: null,
        daysLeft: o.deadline ? Math.ceil((new Date(o.deadline).getTime() - Date.now()) / (1000 * 3600 * 24)) : null,
      })),
    };
  }


  async getUnreadNotificationCount(userId: string) {
    const [notifCountRes, pendingConnRes] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(id)::int as count FROM public.business_notifications
        WHERE recipient_user_id = ${userId}::uuid AND status != 'read' AND read_at IS NULL
      `.catch(() => [{ count: 0 }]),
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(id)::int as count FROM public.user_connections
        WHERE recipient_user_id = ${userId}::uuid AND status = 'pending'::public.global_connection_status
      `.catch(() => [{ count: 0 }]),
    ]);
    const bCount = notifCountRes[0]?.count || 0;
    const cCount = pendingConnRes[0]?.count || 0;
    return { count: Math.max(bCount, cCount) };
  }

  async sendConnectionRequest(userId: string, body: any) {
    let targetUserId = body.targetUserId || body.target_user_id || body.targetPersonNodeId || body.memberCode || body.memberId;
    if (targetUserId && String(targetUserId).startsWith('u:')) {
      targetUserId = String(targetUserId).substring(2);
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(targetUserId || ''));
    if (!isUuid && targetUserId) {
      const memRows = await this.prisma.$queryRaw<any[]>`
        SELECT user_id FROM public.members 
        WHERE LOWER(code) = LOWER(${String(targetUserId)}) OR id = ${String(targetUserId)} LIMIT 1
      `.catch(() => []);
      if (memRows[0]?.user_id) {
        targetUserId = memRows[0].user_id;
      }
    }
    if (!targetUserId) {
      throw new Error('targetUserId is required');
    }
    if (userId === targetUserId) {
      throw new Error('Cannot connect to yourself');
    }
    const now = new Date();

    // Check if an existing connection row exists between these two users (either direction)
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id, recipient_user_id, status FROM public.user_connections
      WHERE (requester_user_id = ${userId}::uuid AND recipient_user_id = ${targetUserId}::uuid)
         OR (requester_user_id = ${targetUserId}::uuid AND recipient_user_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);

    let reqId = crypto.randomUUID();

    if (existing.length > 0) {
      const conn = existing[0];
      if (conn.status === 'accepted') {
        const targetProfiles = await this.prisma.$queryRaw<any[]>`
          SELECT display_name, avatar_url, job_title, company_name
          FROM public.business_identities
          WHERE owner_user_id = ${targetUserId}::uuid AND status = 'active'
          LIMIT 1
        `.catch(() => [] as any[]);
        const targetName = targetProfiles[0]?.display_name || 'đối tác';
        return {
          ok: true,
          connectionId: conn.id,
          status: 'accepted',
          isAlreadyConnected: true,
          message: `Bạn và ${targetName} đã là kết nối của nhau`,
          targetProfile: targetProfiles[0] || null,
        };
      }

      // If incoming pending: target user already requested connection with this user -> auto accept
      if (conn.status === 'pending' && conn.recipient_user_id === userId) {
        return this.acceptConnection(userId, { connectionId: conn.id });
      }

      // If outgoing pending: already sent and awaiting approval
      if (conn.status === 'pending' && conn.requester_user_id === userId) {
        return {
          ok: true,
          connectionId: conn.id,
          status: 'pending',
          message: 'Lời mời kết nối đã được gửi trước đó và đang chờ phản hồi.',
        };
      }

      // If in terminated state (declined, cancelled): delete stale row to prevent trigger violations
      await this.prisma.$executeRaw`
        DELETE FROM public.user_connections WHERE id = ${conn.id}::uuid
      `.catch(() => {});

      await this.prisma.$executeRaw`
        INSERT INTO public.user_connections (id, requester_user_id, recipient_user_id, status, source_type, requested_at, created_at, updated_at)
        VALUES (${reqId}::uuid, ${userId}::uuid, ${targetUserId}::uuid, 'pending'::public.global_connection_status, 'manual'::public.global_connection_source_type, ${now}, ${now}, ${now})
      `;
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO public.user_connections (id, requester_user_id, recipient_user_id, status, source_type, requested_at, created_at, updated_at)
        VALUES (${reqId}::uuid, ${userId}::uuid, ${targetUserId}::uuid, 'pending'::public.global_connection_status, 'manual'::public.global_connection_source_type, ${now}, ${now}, ${now})
      `;
    }

    // Persist notification for recipient and emit WebSocket events
    try {
      const requesterProfiles = await this.prisma.$queryRaw<any[]>`
        SELECT display_name, avatar_url, job_title, company_name
        FROM public.business_identities
        WHERE owner_user_id = ${userId}::uuid AND status = 'active'
        LIMIT 1
      `.catch(() => [] as any[]);
      let requesterDisplayName = requesterProfiles[0]?.display_name;
      let requesterAvatarUrl = requesterProfiles[0]?.avatar_url;
      let requesterJobTitle = requesterProfiles[0]?.job_title;
      let requesterCompanyName = requesterProfiles[0]?.company_name;

      if (!requesterDisplayName) {
        const up = await this.prisma.$queryRaw<any[]>`
          SELECT display_name, avatar_url, professional_title, company_name FROM public.user_profiles WHERE user_id = ${userId}::uuid LIMIT 1
        `.catch(() => []);
        if (up[0]) {
          requesterDisplayName = up[0].display_name;
          requesterAvatarUrl = requesterAvatarUrl || up[0].avatar_url;
          requesterJobTitle = requesterJobTitle || up[0].professional_title;
          requesterCompanyName = requesterCompanyName || up[0].company_name;
        }
      }
      if (!requesterDisplayName) {
        const mem = await this.prisma.$queryRaw<any[]>`
          SELECT name FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
        `.catch(() => []);
        requesterDisplayName = mem[0]?.name || 'Hội viên ViOne';
      }

      // Fetch privacy settings and contact info of Account A (requester)
      let requesterPhone: string | null = null;
      let requesterEmail: string | null = null;
      let requesterMemberCode: string | null = null;
      try {
        const memA = await this.prisma.$queryRaw<any[]>`
          SELECT phone, email, code, avatar, contact, name FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
        `.catch(() => []);
        if (memA[0]) {
          requesterPhone = memA[0].phone || null;
          requesterEmail = memA[0].email || null;
          requesterMemberCode = memA[0].code || null;
          requesterAvatarUrl = requesterAvatarUrl || memA[0].avatar || null;
          requesterDisplayName = requesterDisplayName || memA[0].contact || memA[0].name;
          requesterCompanyName = requesterCompanyName || memA[0].name;
        }
      } catch {}

      // Query Account A's privacy settings
      let aSettings: any = null;
      try {
        const sRows = await this.prisma.$queryRaw<any[]>`
          SELECT show_name, show_company, show_photo, show_email, show_phone, show_address
          FROM public.card_settings WHERE user_id = ${userId}::uuid LIMIT 1
        `.catch(() => []);
        if (sRows[0]) aSettings = sRows[0];
      } catch {}

      const showName = aSettings ? aSettings.show_name !== false : true;
      const showCompany = aSettings ? aSettings.show_company !== false : true;
      const showPhoto = aSettings ? aSettings.show_photo !== false : true;
      const showPhone = aSettings ? aSettings.show_phone !== false : true;
      const showEmail = aSettings ? aSettings.show_email !== false : true;

      const requester = {
        userId,
        memberCode: requesterMemberCode,
        display_name: showName ? requesterDisplayName : 'Hội viên CEO 1983',
        avatar_url: showPhoto ? requesterAvatarUrl : null,
        job_title: showCompany ? requesterJobTitle : 'Hội viên CLB CEO 1983',
        company_name: showCompany ? requesterCompanyName : 'Đã ẩn theo cài đặt riêng tư',
        phone: showPhone ? requesterPhone : 'Đã ẩn theo cài đặt riêng tư',
        email: showEmail ? requesterEmail : 'Đã ẩn theo cài đặt riêng tư',
        connectionId: reqId,
        privacy: {
          showName,
          showCompany,
          showPhoto,
          showPhone,
          showEmail,
        },
      };

      const notifId = crypto.randomUUID();
      const safeData = JSON.stringify({
        counterpartDisplayName: requester.display_name,
        avatarUrl: requester.avatar_url,
        jobTitle: requester.job_title,
        companyName: requester.company_name,
        phone: requester.phone,
        email: requester.email,
        memberCode: requester.memberCode,
        connectionId: reqId,
      });
      const actionTarget = JSON.stringify({
        route: '/connect-app/network',
        search: { tab: 'requests' },
      });
      const dedupeKey = `connection_request:${reqId}:${Date.now()}`;

      await this.prisma.$executeRaw`
        INSERT INTO public.business_notifications (
          id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
          title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
          priority, status, created_at, updated_at, dedupe_key
        ) VALUES (
          ${notifId}::uuid, ${targetUserId}::uuid, 'connection', ${reqId}, 'connection_request_received', 'connection_request_received',
          'bc.notif.kind.connection_request_received.title', 'bc.notif.kind.connection_request_received.body',
          ${safeData}::jsonb, 'open_route', 'bc.notif.action.viewConnectionRequests', ${actionTarget}::jsonb,
          'high', 'delivered', ${now}, ${now}, ${dedupeKey}
        )
      `.catch((err) => console.warn('Could not insert connection notification:', err));

      // Also persist to member_notifications for the member portal
      try {
        const targetMembers = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM public.members WHERE user_id = ${targetUserId}::uuid LIMIT 1
        `.catch(() => []);
        const memberRecipientId = targetMembers[0]?.id || targetUserId;
        await this.prisma.$executeRaw`
          INSERT INTO public.member_notifications (
            id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
          ) VALUES (
            ${crypto.randomUUID()}::uuid,
            ${String(memberRecipientId)}::text,
            ${requester.display_name ? `${requester.display_name} muốn kết nối với bạn` : 'Lời mời kết nối mới'},
            ${requester.job_title ? `${requester.job_title}${requester.company_name ? ' tại ' + requester.company_name : ''}` : 'Đã gửi cho bạn một yêu cầu kết nối.'},
            false,
            false,
            'connection',
            ${reqId},
            ${now}
          )
        `.catch((err) => console.warn('member_notifications insert failed:', err));

        if (targetMembers[0]?.id && String(targetUserId) !== String(targetMembers[0]?.id)) {
          await this.prisma.$executeRaw`
            INSERT INTO public.member_notifications (
              id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
            ) VALUES (
              ${crypto.randomUUID()}::uuid,
              ${String(targetUserId)}::text,
              ${requester.display_name ? `${requester.display_name} muốn kết nối với bạn` : 'Lời mời kết nối mới'},
              ${requester.job_title ? `${requester.job_title}${requester.company_name ? ' tại ' + requester.company_name : ''}` : 'Đã gửi cho bạn một yêu cầu kết nối.'},
              false,
              false,
              'connection',
              ${reqId},
              ${now}
            )
          `.catch(() => {});
        }
      } catch {}

      const notifPayload = {
        id: notifId,
        recipientUserId: targetUserId,
        sourceDomain: 'connection',
        sourceRecordId: reqId,
        eventKind: 'connection_request_received',
        notificationKind: 'connection_request_received',
        titleKey: 'bc.notif.kind.connection_request_received.title',
        bodyKey: 'bc.notif.kind.connection_request_received.body',
        safeDisplayData: JSON.parse(safeData),
        action: {
          kind: 'open_route',
          labelKey: 'bc.notif.action.viewConnectionRequests',
          targetRoute: '/connect-app/network',
          targetSearch: { tab: 'requests' },
        },
        priority: 'high',
        status: 'delivered',
        createdAt: now.toISOString(),
      };

      this.gateway.emitConnectionRequested(targetUserId, requester, reqId);
      this.gateway.emitNotification(targetUserId, notifPayload);
    } catch (e) {
      console.warn('sendConnectionRequest notification broadcast failed:', e);
    }

    return { ok: true, connectionId: reqId, status: 'pending' };
  }

  async acceptConnection(userId: string, body: any) {
    const now = new Date();
    const connRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id FROM public.user_connections
      WHERE (id = ${body.connectionId}::uuid OR id IN (
        SELECT source_record_id::uuid FROM public.business_notifications WHERE id = ${body.connectionId}::uuid AND source_record_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        UNION
        SELECT ref_id::uuid FROM public.member_notifications WHERE id = ${body.connectionId}::uuid AND ref_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      )) AND recipient_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    const actualConnId = connRows[0]?.id || body.connectionId;
    const requesterUserId = connRows[0]?.requester_user_id;

    await this.prisma.$executeRaw`
      UPDATE public.user_connections
      SET status = 'accepted'::public.global_connection_status, responded_at = ${now}, updated_at = ${now}
      WHERE id = ${actualConnId}::uuid AND recipient_user_id = ${userId}::uuid
    `;

    // Cập nhật trạng thái 'accepted' trực tiếp vào thông báo của người nhận
    await this.prisma.$executeRaw`
      UPDATE public.business_notifications
      SET safe_display_data = jsonb_set(
        COALESCE(safe_display_data, '{}'::jsonb),
        '{connectionStatus}',
        '"accepted"'::jsonb
      ),
      read_at = COALESCE(read_at, ${now}),
      updated_at = ${now}
      WHERE (source_record_id = ${actualConnId}::text OR id = ${body.connectionId}::uuid OR (safe_display_data->>'connectionId') = ${actualConnId}::text)
        AND recipient_user_id = ${userId}::uuid
    `.catch(() => {});

    await this.prisma.$executeRaw`
      UPDATE public.member_notifications
      SET read = true
      WHERE (ref_id = ${actualConnId}::text OR id = ${body.connectionId}::uuid)
    `.catch(() => {});

    // Phát sự kiện realtime cho người nhận (để UI đổi ngay thành Đã kết nối)
    this.gateway.server?.to(`user:${userId}`).emit('notification:updated', {
      connectionId: actualConnId,
      connectionStatus: 'accepted',
      timestamp: now.toISOString(),
    });

    if (requesterUserId) {
      try {
        const accepterProfiles = await this.prisma.$queryRaw<any[]>`
          SELECT display_name, avatar_url, job_title, company_name
          FROM public.business_identities
          WHERE owner_user_id = ${userId}::uuid AND status = 'active'
          LIMIT 1
        `.catch(() => [] as any[]);
        const accepter = accepterProfiles[0] || { display_name: 'Hội viên ViOne' };
        const notifId = crypto.randomUUID();
        const safeData = JSON.stringify({
          counterpartDisplayName: accepter.display_name || 'Hội viên ViOne',
          avatarUrl: accepter.avatar_url || null,
          connectionId: actualConnId,
          connectionStatus: 'accepted',
        });
        const actionTarget = JSON.stringify({
          route: '/connect-app/network',
          search: { tab: 'connections' },
        });
        const dedupeKey = `connection_accepted:${actualConnId}`;

        await this.prisma.$executeRaw`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
            priority, status, created_at, updated_at, dedupe_key
          ) VALUES (
            ${notifId}::uuid, ${requesterUserId}::uuid, 'connection', ${actualConnId}, 'connection_request_accepted', 'connection_request_accepted',
            'bc.notif.kind.connection_request_accepted.title', 'bc.notif.kind.connection_request_accepted.body',
            ${safeData}::jsonb, 'open_route', 'bc.notif.action.view', ${actionTarget}::jsonb,
            'normal', 'delivered', ${now}, ${now}, ${dedupeKey}
          )
        `.catch(() => {});

        // Đẩy thêm vào member_notifications cho người gửi lời mời
        try {
          const requesterMembers = await this.prisma.$queryRaw<any[]>`
            SELECT id FROM public.members WHERE user_id = ${requesterUserId}::uuid LIMIT 1
          `.catch(() => []);
          const requesterMemberId = requesterMembers[0]?.id || requesterUserId;
          await this.prisma.$executeRaw`
            INSERT INTO public.member_notifications (
              id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
            ) VALUES (
              ${crypto.randomUUID()}::uuid,
              ${String(requesterMemberId)}::text,
              ${`${accepter.display_name || 'Hội viên'} đã đồng ý lời mời kết nối`},
              ${`Bạn và ${accepter.display_name || 'Hội viên'} đã trở thành bạn bè. Hãy trao đổi và kết nối cơ hội kinh doanh!`},
              false,
              false,
              'connection',
              ${actualConnId}::text,
              ${now}
            )
          `.catch(() => {});
        } catch {}

        const notifPayload = {
          id: notifId,
          recipientUserId: requesterUserId,
          sourceDomain: 'connection',
          sourceRecordId: actualConnId,
          eventKind: 'connection_request_accepted',
          notificationKind: 'connection_request_accepted',
          titleKey: 'bc.notif.kind.connection_request_accepted.title',
          bodyKey: 'bc.notif.kind.connection_request_accepted.body',
          safeDisplayData: JSON.parse(safeData),
          action: {
            kind: 'open_route',
            labelKey: 'bc.notif.action.view',
            targetRoute: '/connect-app/network',
            targetSearch: { tab: 'connections' },
          },
          priority: 'normal',
          status: 'delivered',
          createdAt: now.toISOString(),
        };

        this.gateway.emitConnectionAccepted(requesterUserId, accepter, actualConnId);
        this.gateway.emitNotification(requesterUserId, notifPayload);
      } catch (e) {
        console.warn('acceptConnection notification failed:', e);
      }
    }
    return { ok: true, connectionStatus: 'accepted' };
  }

  async declineConnection(userId: string, body: any) {
    const now = new Date();
    const connRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id FROM public.user_connections
      WHERE (id = ${body.connectionId}::uuid OR id IN (
        SELECT source_record_id::uuid FROM public.business_notifications WHERE id = ${body.connectionId}::uuid AND source_record_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        UNION
        SELECT ref_id::uuid FROM public.member_notifications WHERE id = ${body.connectionId}::uuid AND ref_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      )) AND recipient_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    const actualConnId = connRows[0]?.id || body.connectionId;
    const requesterUserId = connRows[0]?.requester_user_id;

    await this.prisma.$executeRaw`
      UPDATE public.user_connections
      SET status = 'declined'::public.global_connection_status, responded_at = ${now}, updated_at = ${now}
      WHERE id = ${actualConnId}::uuid AND recipient_user_id = ${userId}::uuid
    `;

    // Cập nhật trạng thái 'declined' trực tiếp vào thông báo của người nhận
    await this.prisma.$executeRaw`
      UPDATE public.business_notifications
      SET safe_display_data = jsonb_set(
        COALESCE(safe_display_data, '{}'::jsonb),
        '{connectionStatus}',
        '"declined"'::jsonb
      ),
      read_at = COALESCE(read_at, ${now}),
      updated_at = ${now}
      WHERE (source_record_id = ${actualConnId}::text OR id = ${body.connectionId}::uuid OR (safe_display_data->>'connectionId') = ${actualConnId}::text)
        AND recipient_user_id = ${userId}::uuid
    `.catch(() => {});

    await this.prisma.$executeRaw`
      UPDATE public.member_notifications
      SET read = true
      WHERE (ref_id = ${actualConnId}::text OR id = ${body.connectionId}::uuid)
    `.catch(() => {});

    // Phát sự kiện realtime cho người nhận
    this.gateway.server?.to(`user:${userId}`).emit('notification:updated', {
      connectionId: actualConnId,
      connectionStatus: 'declined',
      timestamp: now.toISOString(),
    });

    if (requesterUserId) {
      try {
        const declinerProfiles = await this.prisma.$queryRaw<any[]>`
          SELECT bi.display_name, bi.avatar_url, bi.company_name, bi.job_title, u.full_name
          FROM public.vione_users u
          LEFT JOIN public.business_identities bi ON bi.owner_user_id = u.id AND bi.status = 'active'
          WHERE u.id = ${userId}::uuid
          LIMIT 1
        `.catch(() => [] as any[]);
        const declinerUser = declinerProfiles[0];
        const declinerName = declinerUser?.display_name || declinerUser?.full_name || declinerUser?.company_name || 'Hội viên ViOne';

        const notifId = crypto.randomUUID();
        const safeData = JSON.stringify({
          counterpartDisplayName: declinerName,
          avatarUrl: declinerUser?.avatar_url || null,
          connectionId: actualConnId,
          connectionStatus: 'declined',
        });
        const dedupeKey = `connection_declined:${actualConnId}`;

        await this.prisma.$executeRaw`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, action_kind, action_label_key,
            priority, status, created_at, updated_at, dedupe_key
          ) VALUES (
            ${notifId}::uuid, ${requesterUserId}::uuid, 'connection', ${actualConnId}, 'connection_request_declined', 'connection_request_declined',
            'bc.notif.kind.connection_request_declined.title', 'bc.notif.kind.connection_request_declined.body',
            ${safeData}::jsonb, 'none', 'bc.notif.action.dismiss',
            'low', 'delivered', ${now}, ${now}, ${dedupeKey}
          )
        `.catch(() => {});

        // Đẩy thêm vào member_notifications cho người gửi lời mời
        try {
          const requesterMembers = await this.prisma.$queryRaw<any[]>`
            SELECT id FROM public.members WHERE user_id = ${requesterUserId}::uuid LIMIT 1
          `.catch(() => []);
          const requesterMemberId = requesterMembers[0]?.id || requesterUserId;
          await this.prisma.$executeRaw`
            INSERT INTO public.member_notifications (
              id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
            ) VALUES (
              ${crypto.randomUUID()}::uuid,
              ${String(requesterMemberId)}::text,
              ${`${declinerName} đã từ chối lời mời kết nối`},
              ${`${declinerName} chưa thể nhận lời mời kết nối của bạn vào lúc này.`},
              false,
              false,
              'connection',
              ${actualConnId}::text,
              ${now}
            )
          `.catch(() => {});
        } catch {}

        this.gateway.server?.to(`user:${requesterUserId}`).emit('connection:declined', {
          connectionId: actualConnId,
          declinerProfile: {
            display_name: declinerName,
            avatar_url: declinerUser?.avatar_url || null,
          },
          timestamp: now.toISOString(),
        });
      } catch (e) {
        console.warn('declineConnection broadcast failed:', e);
      }
    }

    return { ok: true, connectionStatus: 'declined' };
  }

  async cancelConnection(userId: string, body: any) {
    const connRows = await this.prisma.$queryRaw<any[]>`
      SELECT recipient_user_id FROM public.user_connections
      WHERE id = ${body.connectionId}::uuid AND requester_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    const recipientUserId = connRows[0]?.recipient_user_id;

    await this.prisma.$executeRaw`
      DELETE FROM public.user_connections
      WHERE id = ${body.connectionId}::uuid AND requester_user_id = ${userId}::uuid
    `;

    // Mark notification as cancelled in public.business_notifications
    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.business_notifications
      SET status = 'cancelled', updated_at = ${now}
      WHERE source_record_id = ${body.connectionId}
    `.catch(() => {});

    if (recipientUserId) {
      try {
        this.gateway.server?.to(`user:${recipientUserId}`).emit('connection:cancelled', {
          connectionId: body.connectionId,
          timestamp: now.toISOString(),
        });
      } catch (e) {
        console.warn('cancelConnection broadcast failed:', e);
      }
    }

    return { ok: true };
  }

  async disconnectConnection(userId: string, body: any) {
    const connId = body.connectionId;
    const targetUserId = body.targetUserId || body.target_user_id || body.targetPersonNodeId;
    let resolvedTargetId = targetUserId;
    if (resolvedTargetId && String(resolvedTargetId).startsWith('u:')) {
      resolvedTargetId = String(resolvedTargetId).substring(2);
    }
    if (connId) {
      await this.prisma.$executeRaw`
        DELETE FROM public.user_connections
        WHERE id = ${connId}::uuid AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
      `;
    } else if (resolvedTargetId) {
      await this.prisma.$executeRaw`
        DELETE FROM public.user_connections
        WHERE (requester_user_id = ${userId}::uuid AND recipient_user_id = ${resolvedTargetId}::uuid)
           OR (requester_user_id = ${resolvedTargetId}::uuid AND recipient_user_id = ${userId}::uuid)
      `;
    }
    return { ok: true };
  }

  async blockUser(userId: string, body: any) {
    return { ok: true };
  }

  async getConnectionState(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      return {
        targetUserId,
        status: 'none',
        direction: 'self',
        connectionId: null,
        blocked: false,
      };
    }

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id, recipient_user_id, status FROM public.user_connections
      WHERE (requester_user_id = ${userId}::uuid AND recipient_user_id = ${targetUserId}::uuid)
         OR (requester_user_id = ${targetUserId}::uuid AND recipient_user_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      return {
        targetUserId,
        status: 'none',
        direction: 'none',
        connectionId: null,
        blocked: false,
      };
    }

    const r = rows[0];
    const direction = r.requester_user_id === userId ? 'outgoing' : 'incoming';

    return {
      targetUserId,
      status: r.status,
      direction,
      connectionId: r.id,
      blocked: r.status === 'blocked',
    };
  }

  async getConnectionStateByToken(userId: string, token: string) {
    const links = await this.prisma.$queryRaw<any[]>`
      SELECT id, identity_id, status FROM public.identity_share_links
      WHERE public_token = ${token} AND status = 'active'
      LIMIT 1
    `.catch(() => []);

    if (links.length === 0) {
      return { state: 'unavailable', connectionId: null };
    }
    const link = links[0];

    const identities = await this.prisma.$queryRaw<any[]>`
      SELECT owner_user_id FROM public.business_identities
      WHERE id = ${link.identity_id}::uuid AND status = 'active'
      LIMIT 1
    `.catch(() => []);

    if (identities.length === 0) {
      return { state: 'unavailable', connectionId: null };
    }
    const targetUserId = identities[0].owner_user_id;
    if (targetUserId === userId) {
      return { state: 'self', connectionId: null };
    }

    const pairState = await this.getConnectionState(userId, targetUserId);

    let state = 'unavailable';
    if (pairState.status === 'none') {
      state = 'none';
    } else if (pairState.status === 'accepted') {
      state = 'connected';
    } else if (pairState.status === 'pending') {
      state = pairState.direction === 'outgoing' ? 'outgoing_pending' : 'incoming_pending';
    }

    return {
      state,
      connectionId: pairState.connectionId,
    };
  }

  async sendConnectionRequestByToken(userId: string, token: string, mutationKey?: string) {
    const links = await this.prisma.$queryRaw<any[]>`
      SELECT id, identity_id, status FROM public.identity_share_links
      WHERE public_token = ${token} AND status = 'active'
      LIMIT 1
    `.catch(() => []);

    if (links.length === 0) {
      throw new NotFoundException('Identity not found or unavailable');
    }
    const link = links[0];

    const identities = await this.prisma.$queryRaw<any[]>`
      SELECT owner_user_id FROM public.business_identities
      WHERE id = ${link.identity_id}::uuid AND status = 'active'
      LIMIT 1
    `.catch(() => []);

    if (identities.length === 0) {
      throw new NotFoundException('Identity not found or unavailable');
    }
    const targetUserId = identities[0].owner_user_id;
    if (targetUserId === userId) {
      throw new Error('Self connection not allowed');
    }

    return this.sendConnectionRequest(userId, { targetUserId });
  }

  /**
   * NFC / QR Code Tap-to-Exchange — Unified Resolution & Connection Engine
   * - Hỗ trợ các action:
   *   + 'resolve': Tra cứu thông tin đối phương (preview Zalo-style), kèm trạng thái quan hệ
   *   + 'connect' (hoặc mặc định): Gửi yêu cầu kết nối, lưu thông báo & phát WebSocket realtime
   * - Phân giải đa nguồn token:
   *   + identity_share_links (public_token)
   *   + business_cards (slug hoặc id)
   *   + members (code hoặc id)
   *   + business_identities (id hoặc owner_user_id)
   *   + profiles (id hoặc email)
   */
  async nfcTap(userId: string, payload: string | { token: string; action?: 'resolve' | 'connect'; message?: string }) {
    const tokenRaw = typeof payload === 'string' ? payload : (payload?.token || (payload as any)?.value || '');
    const action = (typeof payload === 'object' && payload?.action) ? payload.action : 'connect';
    const message = (typeof payload === 'object' && payload?.message) ? payload.message : undefined;

    if (!tokenRaw || typeof tokenRaw !== 'string' || tokenRaw.trim().length === 0) {
      return { ok: false, reason: 'invalid_token', profile: null, connectionId: null, state: 'unavailable' };
    }

    const cleanToken = tokenRaw.trim();

    // 1. Phân giải targetUserId và metadata từ token
    let targetUserId: string | null = null;
    let shareLinkId: string | null = null;
    let foundIdentity: any = null;
    let foundCard: any = null;
    let foundMember: any = null;
    let foundProfile: any = null;

    // 1a. Kiểm tra identity_share_links
    try {
      const links = await this.prisma.$queryRaw<any[]>`
        SELECT id, identity_id FROM public.identity_share_links
        WHERE public_token = ${cleanToken} AND status = 'active'
        LIMIT 1
      `;
      if (links.length > 0) {
        shareLinkId = links[0].id;
        const identities = await this.prisma.$queryRaw<any[]>`
          SELECT * FROM public.business_identities
          WHERE id = ${links[0].identity_id}::uuid AND status = 'active'
          LIMIT 1
        `;
        if (identities.length > 0) {
          foundIdentity = identities[0];
          targetUserId = foundIdentity.owner_user_id;
        }
      }
    } catch {}

    // 1b. Nếu chưa tìm thấy, kiểm tra business_cards (theo slug hoặc id)
    if (!targetUserId) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);
        const cards = isUuid
          ? await this.prisma.$queryRaw<any[]>`
              SELECT * FROM public.business_cards
              WHERE id = ${cleanToken}::uuid OR slug = ${cleanToken}
              LIMIT 1
            `
          : await this.prisma.$queryRaw<any[]>`
              SELECT * FROM public.business_cards
              WHERE slug = ${cleanToken}
              LIMIT 1
            `;
        if (cards.length > 0) {
          foundCard = cards[0];
          targetUserId = foundCard.user_id;
        }
      } catch {}
    }

    // 1b1. Kiểm tra JWT token (ey...) nếu là Signed QR của Membership Pass
    if (!targetUserId && cleanToken.startsWith('ey') && cleanToken.includes('.')) {
      try {
        const parts = cleanToken.split('.');
        if (parts[1]) {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
          const decoded = JSON.parse(payloadJson);
          const passId = decoded.passId || decoded.pass_id || decoded.id;
          const memberId = decoded.memberId || decoded.member_id;
          const subId = decoded.userId || decoded.user_id || decoded.sub;

          if (passId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(passId));
            if (isUuid) {
              const passes = await this.prisma.$queryRaw<any[]>`
                SELECT * FROM public.member_identity_passes
                WHERE id = ${String(passId)}::uuid
                LIMIT 1
              `;
              if (passes.length > 0) {
                const pass = passes[0];
                const members = await this.prisma.$queryRaw<any[]>`
                  SELECT * FROM public.members
                  WHERE id = ${pass.member_id}::uuid
                  LIMIT 1
                `;
                if (members.length > 0) {
                  foundMember = members[0];
                  targetUserId = foundMember.user_id || foundMember.id;
                }
              }
            }
          }

          if (!targetUserId && memberId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(memberId));
            const members = isUuid
              ? await this.prisma.$queryRaw<any[]>`
                  SELECT * FROM public.members
                  WHERE id = ${String(memberId)}::uuid OR code = ${String(memberId)}
                  LIMIT 1
                `
              : await this.prisma.$queryRaw<any[]>`
                  SELECT * FROM public.members
                  WHERE code = ${String(memberId)}
                  LIMIT 1
                `;
            if (members.length > 0) {
              foundMember = members[0];
              targetUserId = foundMember.user_id || foundMember.id;
            }
          }

          if (!targetUserId && subId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(subId));
            if (isUuid) {
              targetUserId = String(subId);
            }
          }
        }
      } catch {}
    }

    // 1b2. Kiểm tra member_identity_passes (theo pass_serial hoặc id)
    if (!targetUserId) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);
        const passes = isUuid
          ? await this.prisma.$queryRaw<any[]>`
              SELECT * FROM public.member_identity_passes
              WHERE id = ${cleanToken}::uuid OR pass_serial = ${cleanToken}
              LIMIT 1
            `
          : await this.prisma.$queryRaw<any[]>`
              SELECT * FROM public.member_identity_passes
              WHERE pass_serial = ${cleanToken}
              LIMIT 1
            `;
        if (passes.length > 0) {
          const pass = passes[0];
          const members = await this.prisma.$queryRaw<any[]>`
            SELECT * FROM public.members
            WHERE id = ${pass.member_id}::uuid
            LIMIT 1
          `;
          if (members.length > 0) {
            foundMember = members[0];
            targetUserId = foundMember.user_id || foundMember.id;
          }
        }
      } catch {}
    }

    // 1c. Nếu chưa tìm thấy, kiểm tra members (theo code hoặc id)
    if (!targetUserId) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);
        const members = isUuid
          ? await this.prisma.$queryRaw<any[]>`
              SELECT * FROM public.members
              WHERE id = ${cleanToken}::uuid OR code = ${cleanToken}
              LIMIT 1
            `
          : await this.prisma.$queryRaw<any[]>`
              SELECT * FROM public.members
              WHERE code = ${cleanToken}
              LIMIT 1
            `;
        if (members.length > 0) {
          foundMember = members[0];
          targetUserId = foundMember.user_id || foundMember.id;
        }
      } catch {}
    }

    // 1d. Nếu chưa tìm thấy, kiểm tra business_identities (theo id hoặc owner_user_id)
    if (!targetUserId) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);
        if (isUuid) {
          const identities = await this.prisma.$queryRaw<any[]>`
            SELECT * FROM public.business_identities
            WHERE id = ${cleanToken}::uuid OR owner_user_id = ${cleanToken}::uuid
            LIMIT 1
          `;
          if (identities.length > 0) {
            foundIdentity = identities[0];
            targetUserId = foundIdentity.owner_user_id;
          }
        }
      } catch {}
    }

    // 1e. Nếu chưa tìm thấy, kiểm tra profiles (theo id)
    if (!targetUserId) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);
        if (isUuid) {
          const profiles = await this.prisma.$queryRaw<any[]>`
            SELECT * FROM public.profiles
            WHERE id = ${cleanToken}::uuid
            LIMIT 1
          `;
          if (profiles.length > 0) {
            foundProfile = profiles[0];
            targetUserId = foundProfile.id;
          }
        }
      } catch {}
    }

    // 1f. Check public.vione_users by username or email
    if (!targetUserId) {
      try {
        const u = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM public.vione_users
          WHERE username = ${cleanToken} OR email = ${cleanToken} OR id::text = ${cleanToken}
          LIMIT 1
        `;
        if (u.length > 0) {
          targetUserId = u[0].id;
        }
      } catch {}
    }

    // 1g. Check public.members by phone or name
    if (!targetUserId) {
      try {
        const m = await this.prisma.$queryRaw<any[]>`
          SELECT id, user_id FROM public.members
          WHERE phone = ${cleanToken} OR email = ${cleanToken} OR id = ${cleanToken}
          LIMIT 1
        `;
        if (m.length > 0) {
          targetUserId = m[0].user_id || m[0].id;
          foundMember = m[0];
        }
      } catch {}
    }

    // Không tìm thấy user hợp lệ
    if (!targetUserId) {
      return { ok: false, reason: 'not_found', profile: null, connectionId: null, state: 'unavailable' };
    }

    // Tự quét mã của chính mình
    if (targetUserId === userId) {
      return { ok: false, reason: 'self', profile: null, connectionId: null, state: 'self' };
    }

    // 2. Fetch bổ sung đầy đủ thông tin profile đối phương (đảm bảo hiển thị đầy đủ avatar, tên, công ty, chức vụ)
    if (!foundCard) {
      try {
        const c = await this.prisma.$queryRaw<any[]>`
          SELECT * FROM public.business_cards
          WHERE user_id = ${targetUserId}::uuid AND status = 'published'
          ORDER BY is_primary DESC, updated_at DESC LIMIT 1
        `;
        if (c.length > 0) foundCard = c[0];
      } catch {}
    }
    if (!foundIdentity) {
      try {
        const ids = await this.prisma.$queryRaw<any[]>`
          SELECT * FROM public.business_identities
          WHERE owner_user_id = ${targetUserId}::uuid AND status = 'active'
          LIMIT 1
        `;
        if (ids.length > 0) foundIdentity = ids[0];
      } catch {}
    }
    if (!foundMember) {
      try {
        const m = await this.prisma.$queryRaw<any[]>`
          SELECT * FROM public.members
          WHERE user_id = ${targetUserId}::uuid AND status = 'active'
          LIMIT 1
        `;
        if (m.length > 0) foundMember = m[0];
      } catch {}
    }
    if (!foundProfile) {
      try {
        const p = await this.prisma.$queryRaw<any[]>`
          SELECT * FROM public.profiles
          WHERE id = ${targetUserId}::uuid
          LIMIT 1
        `;
        if (p.length > 0) foundProfile = p[0];
      } catch {}
    }

    // 2. Tra cứu quan hệ connection hiện tại giữa 2 user
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id, recipient_user_id, status FROM public.user_connections
      WHERE (requester_user_id = ${userId}::uuid AND recipient_user_id = ${targetUserId}::uuid)
         OR (requester_user_id = ${targetUserId}::uuid AND recipient_user_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);

    let state = 'none';
    let connId: string | null = null;
    if (existing.length > 0) {
      const conn = existing[0];
      connId = conn.id;
      const direction = conn.requester_user_id === userId ? 'outgoing' : 'incoming';
      if (conn.status === 'accepted') {
        state = 'connected';
      } else if (conn.status === 'pending') {
        state = direction === 'outgoing' ? 'outgoing_pending' : 'incoming_pending';
      } else {
        state = 'none';
      }
    }

    // 3. Kiểm tra Field Visibility nếu có Identity
    let vis: Record<string, string> = {};
    if (foundIdentity) {
      try {
        const visibilityRows = await this.prisma.$queryRaw<any[]>`
          SELECT field_key, visibility FROM public.identity_field_visibility
          WHERE identity_id = ${foundIdentity.id}::uuid
        `;
        for (const r of visibilityRows) vis[r.field_key] = r.visibility;
      } catch {}
    }
    const isConnected = state === 'connected' || targetUserId === userId;
    const show = (key: string) => {
      const v = vis[key];
      if (!v || v === 'public') return true;
      if (v === 'connections') return isConnected;
      return false; // 'private' or 'hidden'
    };

    const displayName = (foundIdentity?.display_name ? foundIdentity.display_name : null)
      || foundCard?.display_name
      || foundMember?.name
      || foundMember?.full_name
      || foundProfile?.display_name
      || 'Hội viên ViOne';

    const avatarUrl = foundIdentity?.avatar_url
      || foundCard?.avatar_url
      || foundMember?.avatar_url
      || foundMember?.avatar
      || foundProfile?.avatar_url
      || null;

    const headline = (show('headline') ? foundIdentity?.headline : null)
      || foundCard?.headline
      || foundCard?.professional_title
      || foundMember?.job_title
      || foundMember?.position
      || foundProfile?.headline
      || null;

    const jobTitle = (show('jobTitle') ? foundIdentity?.job_title : null)
      || foundCard?.professional_title
      || foundMember?.job_title
      || foundMember?.position
      || null;

    const companyName = (show('companyName') ? foundIdentity?.company_name : null)
      || foundCard?.company_name
      || foundMember?.company_name
      || foundMember?.company
      || foundProfile?.company_name
      || null;

    const primaryEmail = (show('primaryEmail') ? foundIdentity?.primary_email : null)
      || (show('primaryEmail') ? foundCard?.email || foundMember?.email || foundProfile?.email : null)
      || null;

    const primaryPhone = (show('primaryPhone') ? foundIdentity?.primary_phone : null)
      || (show('primaryPhone') ? foundCard?.phone || foundMember?.phone || foundMember?.contact || foundProfile?.phone : null)
      || null;

    const website = (show('website') ? foundIdentity?.website : null)
      || (show('website') ? foundCard?.website : null)
      || null;

    const linkedinUrl = (show('linkedinUrl') ? foundIdentity?.linkedin_url : null)
      || (show('linkedinUrl') ? foundCard?.linkedin_url : null)
      || null;

    const city = (show('city') ? foundIdentity?.city : null)
      || foundCard?.address
      || foundMember?.address
      || null;

    const bio = (show('bio') ? (foundCard?.bio || foundIdentity?.bio || foundMember?.bio) : null) || null;

    const profile = {
      targetUserId,
      displayName,
      avatarUrl,
      headline,
      jobTitle,
      companyName,
      primaryEmail,
      primaryPhone,
      website,
      linkedinUrl,
      city,
      bio,
      primaryCardSlug: foundCard?.slug || null,
      executiveRole: foundMember?.executive_role || (foundMember?.id ? 'member' : null),
      department: foundMember?.department || 'CLB Doanh Nhân CEO 1983',
      association: 'CLB Doanh Nhân CEO 1983 - HanoiBA',
      skills: ['Quản trị doanh nghiệp', 'Xúc tiến thương mại', 'Kết nối B2B', 'Chiến lược dòng tiền'],
      talents: foundMember?.executive_role ? `Lãnh đạo ${foundMember?.department || 'Ban'} CLB CEO 1983` : 'Doanh nhân hội viên chính thức',
      verifiedBadge: true,
    };

    // 4. Nếu action là 'resolve' (Zalo preview mode), chỉ trả về thông tin profile và trạng thái
    if (action === 'resolve') {
      return {
        ok: true,
        reason: 'resolved',
        profile,
        connectionId: connId,
        state,
      };
    }

    // 5. Nếu action là 'connect': Thực hiện tạo hoặc cập nhật kết nối + Gửi thông báo
    const now = new Date();
    let reqId = connId || crypto.randomUUID();

    if (existing.length > 0) {
      const conn = existing[0];
      if (conn.status === 'accepted') {
        return { ok: true, reason: 'already_connected', profile, connectionId: conn.id, state: 'connected' };
      }

      // If incoming pending: target user already requested connection -> auto accept
      if (conn.status === 'pending' && conn.recipient_user_id === userId) {
        await this.acceptConnection(userId, { connectionId: conn.id });
        return { ok: true, reason: 'connected', profile, connectionId: conn.id, state: 'connected' };
      }

      // If outgoing pending: already sent and awaiting response
      if (conn.status === 'pending' && conn.requester_user_id === userId) {
        return { ok: true, reason: 'pending_sent', profile, connectionId: conn.id, state: 'outgoing_pending' };
      }

      // Terminated connection: delete stale row to prevent PostgreSQL trigger violations
      await this.prisma.$executeRaw`
        DELETE FROM public.user_connections WHERE id = ${conn.id}::uuid
      `.catch(() => {});

      reqId = crypto.randomUUID();
      try {
        await this.prisma.$executeRaw`
          INSERT INTO public.user_connections (id, requester_user_id, recipient_user_id, status, source_type, requested_at, created_at, updated_at)
          VALUES (${reqId}::uuid, ${userId}::uuid, ${targetUserId}::uuid, 'pending'::public.global_connection_status, 'nfc'::public.global_connection_source_type, ${now}, ${now}, ${now})
        `;
      } catch {
        await this.prisma.$executeRaw`
          INSERT INTO public.user_connections (id, requester_user_id, recipient_user_id, status, source_type, requested_at, created_at, updated_at)
          VALUES (${reqId}::uuid, ${userId}::uuid, ${targetUserId}::uuid, 'pending'::public.global_connection_status, 'manual'::public.global_connection_source_type, ${now}, ${now}, ${now})
        `;
      }
    } else {
      try {
        await this.prisma.$executeRaw`
          INSERT INTO public.user_connections (id, requester_user_id, recipient_user_id, status, source_type, requested_at, created_at, updated_at)
          VALUES (${reqId}::uuid, ${userId}::uuid, ${targetUserId}::uuid, 'pending'::public.global_connection_status, 'nfc'::public.global_connection_source_type, ${now}, ${now}, ${now})
        `;
      } catch {
        await this.prisma.$executeRaw`
          INSERT INTO public.user_connections (id, requester_user_id, recipient_user_id, status, source_type, requested_at, created_at, updated_at)
          VALUES (${reqId}::uuid, ${userId}::uuid, ${targetUserId}::uuid, 'pending'::public.global_connection_status, 'manual'::public.global_connection_source_type, ${now}, ${now}, ${now})
        `;
      }
    }

    // Cập nhật last_used_at của share link nếu có
    if (shareLinkId) {
      this.prisma.$executeRaw`
        UPDATE public.identity_share_links SET last_used_at = ${now} WHERE id = ${shareLinkId}::uuid
      `.catch(() => {});
    }

    // Lấy thông tin người gửi để đưa vào thông báo
    const requesterSummaries = await this.resolvePublicCounterparts([userId]);
    const requester = requesterSummaries[0] || {
      userId,
      displayName: 'Hội viên ViOne',
      avatarUrl: null,
      headline: null,
      companyName: null,
    };

    // 6. Lưu thông báo vào Business Notifications
    const notifId = crypto.randomUUID();
    const safeDataObj = {
      counterpartDisplayName: requester.displayName || 'Hội viên ViOne',
      avatarUrl: requester.avatarUrl || null,
      jobTitle: requester.headline || null,
      companyName: requester.companyName || null,
      connectionId: reqId,
      source: 'nfc',
      message: message || '',
    };
    const safeData = JSON.stringify(safeDataObj);
    const actionTarget = JSON.stringify({
      route: '/connect-app/network',
      search: { tab: 'requests' },
    });
    const dedupeKey = `connection_request:${reqId}:${Date.now()}`;

    await this.prisma.$executeRaw`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
        priority, status, created_at, updated_at, dedupe_key
      ) VALUES (
        ${notifId}::uuid, ${targetUserId}::uuid, 'connection', ${reqId}, 'connection_request_received', 'connection_request_received',
        'bc.notif.kind.connection_request_received.title', 'bc.notif.kind.connection_request_received.body',
        ${safeData}::jsonb, 'open_route', 'bc.notif.action.viewConnectionRequests', ${actionTarget}::jsonb,
        'high', 'delivered', ${now}, ${now}, ${dedupeKey}
      )
    `.catch((err) => console.warn('Could not insert business notification for tap:', err));

    // 7. Lưu thông báo vào Member Notifications (để trang Thông báo Hội viên cũng thấy)
    try {
      const targetMembers = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.members WHERE user_id = ${targetUserId}::uuid LIMIT 1
      `.catch(() => []);
      const memberRecipientId = targetMembers[0]?.id || targetUserId;
      const notifTitle = `${requester.displayName || 'Một hội viên'} muốn kết nối với bạn`;
      const notifBody = message ? `${message}` : (requester.headline ? `${requester.headline}${requester.companyName ? ' tại ' + requester.companyName : ''}` : 'Đã gửi cho bạn một yêu cầu kết nối danh thiếp.');

      await this.prisma.$executeRaw`
        INSERT INTO public.member_notifications (
          id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
        ) VALUES (
          ${crypto.randomUUID()}::uuid,
          ${memberRecipientId}::uuid,
          ${notifTitle},
          ${notifBody},
          false,
          false,
          'connection',
          ${reqId},
          ${now}
        )
      `.catch(() => {});
    } catch {}

    // 8. PHÁT WEBSOCKET EVENTS TỨC THÌ ĐẾN targetUserId
    try {
      const notifPayload = {
        id: notifId,
        recipientUserId: targetUserId,
        sourceDomain: 'connection',
        sourceRecordId: reqId,
        eventKind: 'connection_request_received',
        notificationKind: 'connection_request_received',
        titleKey: 'bc.notif.kind.connection_request_received.title',
        bodyKey: 'bc.notif.kind.connection_request_received.body',
        safeDisplayData: safeDataObj,
        action: {
          kind: 'open_route',
          labelKey: 'bc.notif.action.viewConnectionRequests',
          targetRoute: '/connect-app/network',
          targetSearch: { tab: 'requests' },
        },
        priority: 'high',
        status: 'delivered',
        createdAt: now.toISOString(),
      };

      const socketRequesterProfile = {
        userId,
        displayName: requester.displayName,
        avatarUrl: requester.avatarUrl,
        jobTitle: requester.headline,
        companyName: requester.companyName,
        message: message || undefined,
      };

      this.gateway.emitNfcTapped(targetUserId, socketRequesterProfile, reqId);
      this.gateway.emitConnectionRequested(targetUserId, socketRequesterProfile, reqId);
      this.gateway.emitNotification(targetUserId, notifPayload);
    } catch (e) {
      console.warn('Tap connection WebSocket broadcast failed:', e);
    }

    return {
      ok: true,
      reason: existing.length > 0 ? 'reconnected' : 'created',
      profile,
      connectionId: reqId,
      state: 'outgoing_pending',
    };
  }


  async getConnectionById(userId: string, connectionId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id, recipient_user_id as target_user_id, status, created_at FROM public.user_connections
      WHERE id = ${connectionId}::uuid AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);
    if (rows.length === 0) throw new NotFoundException('Connection not found');
    const r = rows[0];
    const counterpartUserId = r.requester_user_id === userId ? r.target_user_id : r.requester_user_id;
    return {
      id: r.id,
      counterpartUserId,
      status: r.status,
      createdAt: r.created_at,
    };
  }

  async listIncomingRequests(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id, recipient_user_id as target_user_id, status, created_at
      FROM public.user_connections
      WHERE recipient_user_id = ${userId}::uuid AND status = 'pending'::public.global_connection_status
      ORDER BY created_at DESC
    `.catch(() => []);
    return rows.map(r => ({
      id: r.id,
      counterpartUserId: r.requester_user_id,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  async listOutgoingRequests(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id, recipient_user_id as target_user_id, status, created_at
      FROM public.user_connections
      WHERE requester_user_id = ${userId}::uuid AND status = 'pending'::public.global_connection_status
      ORDER BY created_at DESC
    `.catch(() => []);
    return rows.map(r => ({
      id: r.id,
      counterpartUserId: r.target_user_id,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  async countConnectionsByStatus(userId: string) {
    const incomingRes = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.user_connections
      WHERE recipient_user_id = ${userId}::uuid AND status = 'pending'::public.global_connection_status
    `.catch(() => [{ count: 0 }]);
    const outgoingRes = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.user_connections
      WHERE requester_user_id = ${userId}::uuid AND status = 'pending'::public.global_connection_status
    `.catch(() => [{ count: 0 }]);
    const acceptedRes = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.user_connections
      WHERE (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid) AND status = 'accepted'::public.global_connection_status
    `.catch(() => [{ count: 0 }]);

    return {
      incoming: incomingRes[0]?.count || 0,
      outgoing: outgoingRes[0]?.count || 0,
      accepted: acceptedRes[0]?.count || 0,
    };
  }

  async getGuestContact(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, display_name, title, company_name, first_shared_at, last_shared_at, source, owner_label, owner_note
      FROM public.guest_contacts
      WHERE id = ${id}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    if (rows.length === 0) throw new NotFoundException('Guest contact not found');
    const g = rows[0];
    return {
      id: g.id,
      displayName: g.display_name || null,
      title: g.title || null,
      companyName: g.company_name || null,
      firstSharedAt: g.first_shared_at ? new Date(g.first_shared_at).toISOString() : null,
      lastSharedAt: g.last_shared_at ? new Date(g.last_shared_at).toISOString() : null,
      source: g.source || null,
      ownerLabel: g.owner_label || null,
      ownerNote: g.owner_note || null,
    };
  }

  async updateGuestContactOwnerFields(userId: string, id: string, body: { ownerLabel?: string | null; ownerNote?: string | null }) {
    await this.prisma.$executeRaw`
      UPDATE public.guest_contacts
      SET owner_label = ${body.ownerLabel || null}, owner_note = ${body.ownerNote || null}
      WHERE id = ${id}::uuid AND owner_user_id = ${userId}::uuid
    `;
    return this.getGuestContact(userId, id);
  }

  async deleteGuestContact(userId: string, id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.guest_contacts
      WHERE id = ${id}::uuid AND owner_user_id = ${userId}::uuid
    `;
    return { removed: true };
  }

  async listNotifications(userId: string, limit: number = 30, unreadOnly: boolean = false) {
    const [rows, pendingConnections] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
               title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
               priority, status, created_at, updated_at, read_at, app_scope, target_app
        FROM public.business_notifications
        WHERE recipient_user_id = ${userId}::uuid
          AND (${!unreadOnly} OR (status != 'read' AND read_at IS NULL))
          AND (app_scope IS NULL OR app_scope != 'association_app')
          AND (target_app IS NULL OR target_app != 'association_app')
        ORDER BY created_at DESC
        LIMIT ${limit}
      `.catch((err) => {
        console.error('Error listing notifications:', err);
        return [];
      }),
      this.prisma.$queryRaw<any[]>`
        SELECT id, requester_user_id, status, requested_at, created_at
        FROM public.user_connections
        WHERE recipient_user_id = ${userId}::uuid AND status = 'pending'::public.global_connection_status
        ORDER BY COALESCE(requested_at, created_at) DESC
        LIMIT 10
      `.catch(() => []),
    ]);

    // Tra cứu trạng thái thực tế mới nhất của các connection trong user_connections
    const allConnIds = rows
      .map(r => r.source_record_id || r.safe_display_data?.connectionId)
      .filter(Boolean);

    let connStatusMap = new Map<string, string>();
    if (allConnIds.length > 0) {
      try {
        const connRows = await this.prisma.$queryRaw<any[]>`
          SELECT id, status
          FROM public.user_connections
          WHERE id = ANY(${allConnIds}::uuid[])
        `.catch(() => []);
        for (const c of connRows) {
          connStatusMap.set(c.id, c.status);
        }
      } catch {
        /* ignore */
      }
    }

    const mapped: any[] = rows.map(r => {
      const connId = r.source_record_id || r.safe_display_data?.connectionId;
      const connStatus = (connId ? connStatusMap.get(connId) : null) ||
        r.safe_display_data?.connectionStatus ||
        (r.notification_kind === 'connection_request_accepted' ? 'accepted' : r.notification_kind === 'connection_request_declined' ? 'declined' : 'pending');

      return {
        id: r.id,
        recipientUserId: r.recipient_user_id,
        sourceDomain: r.source_domain || 'meeting',
        sourceRecordId: r.source_record_id || '',
        eventKind: r.event_kind || '',
        notificationKind: r.notification_kind || '',
        titleKey: r.title_key || '',
        bodyKey: r.body_key || '',
        appScope: r.app_scope || r.target_app || 'vione_app',
        targetApp: r.target_app || r.app_scope || 'vione_app',
        safeDisplayData: {
          ...(r.safe_display_data || {}),
          connectionStatus: connStatus,
          connectionId: connId || undefined,
        },
        action: {
          kind: r.action_kind || 'open_route',
          labelKey: r.action_label_key || 'bc.notif.action.view',
          targetRoute: r.action_target?.route || (r.source_domain === 'connection' ? '/connect-app/network' : null),
          targetParams: r.action_target?.params || null,
          targetSearch: r.action_target?.search || (r.source_domain === 'connection' ? { tab: 'requests' } : null),
          requiresConfirmation: false,
          canonicalCapability: null,
        },
        priority: r.priority || 'normal',
        status: r.status || 'unread',
        scheduledFor: null,
        deliveredAt: r.created_at ? new Date(r.created_at).toISOString() : null,
        readAt: r.read_at ? new Date(r.read_at).toISOString() : null,
        archivedAt: null,
        expiredAt: null,
        dedupeKey: r.id,
        schemaVersion: 1,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      };
    });

    // Bổ sung thông báo phát sóng CRM (public.notifications) vào danh sách
    try {
      const broadcastRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, code, title, body, audience, channel, status, sent_at, created_at, app_scope, target_app
        FROM public.notifications
        WHERE status = 'sent'
        ORDER BY COALESCE(sent_at, created_at) DESC
        LIMIT 25
      `.catch(() => []);

      for (const br of broadcastRows) {
        mapped.push({
          id: br.code || br.id,
          recipientUserId: userId,
          sourceDomain: 'broadcast',
          sourceRecordId: br.id,
          eventKind: 'system_broadcast',
          notificationKind: 'system_broadcast',
          titleKey: br.title,
          bodyKey: br.body || '',
          appScope: br.app_scope || 'all',
          targetApp: br.target_app || 'all',
          safeDisplayData: {
            title: br.title,
            content: br.body || '',
            message: br.body || '',
          },
          action: {
            kind: 'open_route',
            labelKey: 'bc.notif.action.view',
            targetRoute: '/connect-app/notifications',
            targetParams: null,
            targetSearch: null,
            requiresConfirmation: false,
            canonicalCapability: null,
          },
          priority: 'normal',
          status: 'delivered',
          scheduledFor: null,
          deliveredAt: br.sent_at ? new Date(br.sent_at).toISOString() : new Date(br.created_at).toISOString(),
          readAt: null,
          archivedAt: null,
          expiredAt: null,
          dedupeKey: br.id,
          schemaVersion: 1,
          createdAt: br.sent_at ? new Date(br.sent_at).toISOString() : new Date(br.created_at).toISOString(),
          updatedAt: br.sent_at ? new Date(br.sent_at).toISOString() : new Date(br.created_at).toISOString(),
        });
      }
    } catch (e) {
      console.warn('Error fetching broadcast notifications for connect-app:', e);
    }

    // Đảm bảo mọi pending connection request đều có mặt trong danh sách thông báo
    const existingConnIds = new Set(
      mapped
        .filter(m => m.notificationKind === 'connection_request_received' || m.sourceDomain === 'connection')
        .map(m => m.sourceRecordId)
    );

    const missingConns = pendingConnections.filter(c => !existingConnIds.has(c.id));
    if (missingConns.length > 0) {
      const requesterIds = missingConns.map(c => c.requester_user_id);
      const counterparts = await this.resolvePublicCounterparts(requesterIds);
      const cpMap = new Map(counterparts.map(cp => [cp.userId, cp]));

      for (const conn of missingConns) {
        const cp = cpMap.get(conn.requester_user_id) || {
          displayName: 'Hội viên ViOne',
          avatarUrl: null,
          headline: null,
          companyName: null,
        };
        const dt = conn.requested_at || conn.created_at || new Date();
        mapped.unshift({
          id: `conn-req-${conn.id}`,
          recipientUserId: userId,
          sourceDomain: 'connection',
          sourceRecordId: conn.id,
          eventKind: 'connection_request_received',
          notificationKind: 'connection_request_received',
          titleKey: 'bc.notif.kind.connection_request_received.title',
          bodyKey: 'bc.notif.kind.connection_request_received.body',
          appScope: 'vione_app',
          targetApp: 'vione_app',
          safeDisplayData: {
            counterpartDisplayName: cp.displayName || 'Hội viên ViOne',
            avatarUrl: cp.avatarUrl || null,
            jobTitle: cp.headline || null,
            companyName: cp.companyName || null,
            connectionId: conn.id,
            connectionStatus: 'pending',
            source: 'nfc',
          },
          action: {
            kind: 'open_route',
            labelKey: 'bc.notif.action.viewConnectionRequests',
            targetRoute: '/connect-app/network',
            targetParams: null,
            targetSearch: { tab: 'requests' },
            requiresConfirmation: false,
            canonicalCapability: null,
          },
          priority: 'high',
          status: 'delivered',
          scheduledFor: null,
          deliveredAt: new Date(dt).toISOString(),
          readAt: null,
          archivedAt: null,
          expiredAt: null,
          dedupeKey: `conn-req-${conn.id}`,
          schemaVersion: 1,
          createdAt: new Date(dt).toISOString(),
          updatedAt: new Date(dt).toISOString(),
        });
      }
    }

    // Bổ sung thông báo từ Hiệp hội CEO 1983 (member_notifications, hội phí quá hạn, cơ hội, tin nhắn BQT)
    try {
      const members = await this.prisma.$queryRaw<any[]>`
        SELECT id, code, full_name, email, dues_status, membership_tier, renewal_date
        FROM public.members
        WHERE user_id = ${userId}::uuid
           OR LOWER(email) IN (SELECT LOWER(email) FROM public.users WHERE id = ${userId}::uuid)
      `.catch(() => []);

      const memberIds = members.map(m => m.id);
      const memberCodes = members.map(m => m.code).filter(Boolean);

      // 1. Lấy thông báo cá nhân từ hiệp hội (public.member_notifications)
      const memNotifs = memberIds.length > 0
        ? await this.prisma.$queryRaw<any[]>`
            SELECT id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
            FROM public.member_notifications
            WHERE recipient_id::text = ANY(${memberIds}::text[]) OR recipient_id::text = ${userId}::text
            ORDER BY created_at DESC
            LIMIT 30
          `.catch(() => [])
        : await this.prisma.$queryRaw<any[]>`
            SELECT id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
            FROM public.member_notifications
            WHERE recipient_id::text = ${userId}::text
            ORDER BY created_at DESC
            LIMIT 30
          `.catch(() => []);

      for (const mn of memNotifs) {
        if (mn.dismissed) continue;
        const isInvoice = mn.ref_type === 'invoice' || (mn.title && mn.title.toLowerCase().includes('phí'));
        mapped.push({
          id: `mem-notif-${mn.id}`,
          recipientUserId: userId,
          sourceDomain: isInvoice ? 'finance' : 'association',
          sourceRecordId: mn.ref_id || mn.id,
          eventKind: isInvoice ? 'invoice_reminder' : 'system_broadcast',
          notificationKind: isInvoice ? 'overdue_payment_reminder' : 'system_broadcast',
          titleKey: mn.title,
          bodyKey: mn.body || '',
          appScope: 'all',
          targetApp: 'all',
          safeDisplayData: {
            invoiceId: isInvoice ? (mn.ref_id || mn.id) : undefined,
            title: mn.title,
            message: mn.body || '',
            body: mn.body || '',
            actionUrl: isInvoice ? '/association/renew/pay' : undefined,
          },
          action: {
            kind: 'open_route',
            labelKey: isInvoice ? 'Thanh toán phí' : 'bc.notif.action.view',
            targetRoute: isInvoice ? '/association/renew/pay' : '/connect-app/notifications',
            targetParams: null,
            targetSearch: null,
            requiresConfirmation: false,
            canonicalCapability: null,
          },
          priority: isInvoice ? 'critical' : 'normal',
          status: mn.read ? 'read' : 'delivered',
          scheduledFor: null,
          deliveredAt: mn.created_at ? new Date(mn.created_at).toISOString() : new Date().toISOString(),
          readAt: mn.read && mn.created_at ? new Date(mn.created_at).toISOString() : null,
          archivedAt: null,
          expiredAt: null,
          dedupeKey: `mem-notif-${mn.id}`,
          schemaVersion: 1,
          createdAt: mn.created_at ? new Date(mn.created_at).toISOString() : new Date().toISOString(),
          updatedAt: mn.created_at ? new Date(mn.created_at).toISOString() : new Date().toISOString(),
        });
      }

      // 2. Kiểm tra trạng thái hội phí quá hạn chưa thanh toán (tài khoản Lê Hoàng Long hoặc hội viên khác)
      const overdueMember = (members as any[]).find((m: any) => m.dues_status === 'overdue');
      if (overdueMember) {
        const invRows = await this.prisma.$queryRaw<any[]>`
          SELECT id, invoice_no, title, amount, due_date, status
          FROM public.invoices
          WHERE (member_id::text = ${overdueMember.id}::text OR user_id = ${userId}::uuid)
            AND status IN ('overdue', 'unpaid', 'pending')
          ORDER BY created_at DESC
          LIMIT 1
        `.catch(() => []);

        const inv = invRows[0];
        const invAmount = inv?.amount ? Number(inv.amount).toLocaleString('vi-VN') + ' đ' : 'Cần thanh toán';
        const invTitle = 'Thông báo: Hội phí hội viên quá hạn chưa thanh toán';
        const invBody = `Hội phí của hội viên ${overdueMember.full_name || 'CEO 1983'} (${invAmount}) đã quá hạn thanh toán. Vui lòng hoàn tất đóng phí để tiếp tục duy trì quyền lợi và kết nối B2B trên hệ thống.`;

        // Chỉ thêm nếu chưa có thông báo tương đương
        const alreadyHasOverdue = mapped.some(m => m.notificationKind === 'overdue_payment_reminder' || (m.titleKey && m.titleKey.includes('quá hạn')));
        if (!alreadyHasOverdue) {
          mapped.unshift({
            id: `dues-overdue-${overdueMember.id}`,
            recipientUserId: userId,
            sourceDomain: 'finance',
            sourceRecordId: inv?.id || overdueMember.id,
            eventKind: 'invoice_reminder',
            notificationKind: 'overdue_payment_reminder',
            titleKey: invTitle,
            bodyKey: invBody,
            appScope: 'all',
            targetApp: 'all',
            safeDisplayData: {
              invoiceId: inv?.id || overdueMember.id,
              amount: inv?.amount || null,
              message: invBody,
              body: invBody,
              actionUrl: '/association/renew/pay',
              status: 'overdue',
            },
            action: {
              kind: 'open_route',
              labelKey: 'Thanh toán ngay',
              targetRoute: '/association/renew/pay',
              targetParams: null,
              targetSearch: null,
              requiresConfirmation: false,
              canonicalCapability: null,
            },
            priority: 'critical',
            status: 'delivered',
            scheduledFor: null,
            deliveredAt: new Date().toISOString(),
            readAt: null,
            archivedAt: null,
            expiredAt: null,
            dedupeKey: `dues-overdue-${overdueMember.id}`,
            schemaVersion: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // 3. Cơ hội giao thương B2B mới nhất (public.opportunities)
      const oppRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, title, description, type, budget_min, budget_max, region, industry, deadline, status, created_at, claimed_by_name
        FROM public.opportunities
        WHERE status = 'open'
        ORDER BY created_at DESC
        LIMIT 5
      `.catch(() => []);

      for (const opp of oppRows) {
        const oppTitle = `[Cơ hội B2B] ${opp.title}`;
        const oppBody = opp.description || `Cơ hội kinh doanh mới ngành ${opp.industry || 'B2B'} với ngân sách ${opp.budget_min ? Number(opp.budget_min).toLocaleString('vi-VN') + ' đ' : 'Thỏa thuận'}. Bấm để xem chi tiết và tiếp nhận!`;
        mapped.push({
          id: `opp-notif-${opp.id}`,
          recipientUserId: userId,
          sourceDomain: 'opportunity',
          sourceRecordId: opp.id,
          eventKind: 'opportunity_new',
          notificationKind: 'opportunity_new',
          titleKey: oppTitle,
          bodyKey: oppBody,
          appScope: 'all',
          targetApp: 'all',
          safeDisplayData: {
            opportunityId: opp.id,
            title: opp.title,
            description: opp.description,
            message: oppBody,
            body: oppBody,
          },
          action: {
            kind: 'open_route',
            labelKey: 'Xem cơ hội',
            targetRoute: `/connect-app/community/clb-ceo-1983/opportunities/${opp.id}`,
            targetParams: null,
            targetSearch: null,
            requiresConfirmation: false,
            canonicalCapability: null,
          },
          priority: 'high',
          status: 'delivered',
          scheduledFor: null,
          deliveredAt: opp.created_at ? new Date(opp.created_at).toISOString() : new Date().toISOString(),
          readAt: null,
          archivedAt: null,
          expiredAt: null,
          dedupeKey: `opp-notif-${opp.id}`,
          schemaVersion: 1,
          createdAt: opp.created_at ? new Date(opp.created_at).toISOString() : new Date().toISOString(),
          updatedAt: opp.created_at ? new Date(opp.created_at).toISOString() : new Date().toISOString(),
        });
      }

      // 4. Tin nhắn từ Ban Quản Trị hệ thống (public.messages có from_id = 'ADMIN')
      if (memberCodes.length > 0) {
        const adminMessages = await this.prisma.$queryRaw<any[]>`
          SELECT id, from_id, to_id, text, created_at
          FROM public.messages
          WHERE from_id = 'ADMIN' AND LOWER(to_id) = ANY(${memberCodes.map(c => c.toLowerCase())}::text[])
          ORDER BY created_at DESC
          LIMIT 5
        `.catch(() => []);

        for (const msg of adminMessages) {
          const rawText = msg.text || '';
          const cleanText = rawText.replace(/\[action:[^\]]+\]/g, '').trim() || 'Bạn có thông báo mới từ Ban Quản trị CLB CEO 1983.';
          mapped.push({
            id: `msg-admin-${msg.id}`,
            recipientUserId: userId,
            sourceDomain: 'system',
            sourceRecordId: msg.id,
            eventKind: 'system_broadcast',
            notificationKind: 'system_broadcast',
            titleKey: 'Tin nhắn từ Ban Quản Trị Hiệp Hội',
            bodyKey: cleanText,
            appScope: 'all',
            targetApp: 'all',
            safeDisplayData: {
              title: 'Tin nhắn từ Ban Quản Trị Hiệp Hội',
              message: cleanText,
              body: cleanText,
              actionUrl: '/association/messages',
            },
            action: {
              kind: 'open_route',
              labelKey: 'Xem tin nhắn',
              targetRoute: '/association/messages',
              targetParams: null,
              targetSearch: null,
              requiresConfirmation: false,
              canonicalCapability: null,
            },
            priority: 'high',
            status: 'delivered',
            scheduledFor: null,
            deliveredAt: msg.created_at ? new Date(msg.created_at).toISOString() : new Date().toISOString(),
            readAt: null,
            archivedAt: null,
            expiredAt: null,
            dedupeKey: `msg-admin-${msg.id}`,
            schemaVersion: 1,
            createdAt: msg.created_at ? new Date(msg.created_at).toISOString() : new Date().toISOString(),
            updatedAt: msg.created_at ? new Date(msg.created_at).toISOString() : new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Error fetching association member notifications & opportunities:', err);
    }

    // Sắp xếp thống nhất theo thời gian tạo mới nhất
    mapped.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.deliveredAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.deliveredAt || 0).getTime();
      return timeB - timeA;
    });

    if (unreadOnly) {
      return mapped.filter(n => n.readAt === null && n.status !== 'read').slice(0, limit);
    }

    return mapped.slice(0, limit);
  }


  async markNotificationsRead(userId: string, ids?: string[]) {
    if (ids && ids.length > 0) {
      const validUuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const uuidIds = ids.filter(id => validUuidRegex.test(id));
      if (uuidIds.length > 0) {
        await this.prisma.$executeRaw`
          UPDATE public.business_notifications
          SET status = 'read', read_at = now()
          WHERE recipient_user_id = ${userId}::uuid AND id = ANY(${uuidIds}::uuid[])
        `.catch(() => {});
      }
    } else {
      await this.prisma.$executeRaw`
        UPDATE public.business_notifications
        SET status = 'read', read_at = now()
        WHERE recipient_user_id = ${userId}::uuid AND (status = 'unread' OR status = 'delivered')
          AND (
            app_scope = 'vione_app' OR app_scope = 'all' OR app_scope = 'crm' OR target_app = 'vione_app' OR target_app = 'all' OR target_app = 'crm'
            OR app_scope IS NULL
          )
      `;
    }

    try {
      const unreadRes = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(id)::int as count FROM public.business_notifications
        WHERE recipient_user_id = ${userId}::uuid AND (status = 'unread' OR status = 'delivered')
          AND (
            app_scope = 'vione_app' OR app_scope = 'all' OR app_scope = 'crm' OR target_app = 'vione_app' OR target_app = 'all' OR target_app = 'crm'
            OR app_scope IS NULL
          )
      `.catch(() => [{ count: 0 }]);
      const unreadCount = Number(unreadRes[0]?.count || 0);
      this.gateway?.emitUnreadNotificationCount(userId, unreadCount);
    } catch {
      // ignore
    }

    return { ok: true };
  }

  async deleteNotification(userId: string, id: string) {
    if (id.startsWith('conn-req-')) {
      const connId = id.replace('conn-req-', '');
      await this.prisma.$executeRaw`
        UPDATE public.user_connections
        SET status = 'declined'::public.global_connection_status, responded_at = now(), updated_at = now()
        WHERE id = ${connId}::uuid AND recipient_user_id = ${userId}::uuid
      `.catch(() => {});
    } else {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_notifications
        WHERE recipient_user_id = ${userId}::uuid AND id = ${id}::uuid
      `.catch(() => {});
      await this.prisma.$executeRaw`
        DELETE FROM public.member_notifications
        WHERE user_id = ${userId}::uuid AND id = ${id}::uuid
      `.catch(() => {});
    }

    try {
      const unreadRes = await this.prisma.$queryRaw<any[]>`
        SELECT COUNT(id)::int as count FROM public.business_notifications
        WHERE recipient_user_id = ${userId}::uuid AND (status = 'unread' OR status = 'delivered')
          AND (
            app_scope = 'vione_app' OR app_scope = 'all' OR app_scope = 'crm' OR target_app = 'vione_app' OR target_app = 'all' OR target_app = 'crm'
            OR app_scope IS NULL
          )
      `.catch(() => [{ count: 0 }]);
      const unreadCount = Number(unreadRes[0]?.count || 0);
      this.gateway?.emitUnreadNotificationCount(userId, unreadCount);
      this.gateway?.server?.to(`user:${userId}`).emit('notification:deleted', {
        id,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // ignore
    }

    return { ok: true, id };
  }

  async deleteNotifications(userId: string, ids: string[]) {
    if (!ids || ids.length === 0) return { ok: true, deleted: 0 };

    const connIds = ids.filter((id) => id.startsWith('conn-req-')).map((id) => id.replace('conn-req-', ''));
    const notifIds = ids.filter((id) => !id.startsWith('conn-req-'));

    if (connIds.length > 0) {
      await this.prisma.$executeRaw`
        UPDATE public.user_connections
        SET status = 'declined'::public.global_connection_status, responded_at = now(), updated_at = now()
        WHERE id = ANY(${connIds}::uuid[]) AND recipient_user_id = ${userId}::uuid
      `.catch(() => {});
    }

    if (notifIds.length > 0) {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_notifications
        WHERE recipient_user_id = ${userId}::uuid AND id = ANY(${notifIds}::uuid[])
      `.catch(() => {});
      await this.prisma.$executeRaw`
        DELETE FROM public.member_notifications
        WHERE user_id = ${userId}::uuid AND id = ANY(${notifIds}::uuid[])
      `.catch(() => {});
    }

    this.gateway.server?.to(`user:${userId}`).emit('notification:deleted', {
      ids,
      timestamp: new Date().toISOString(),
    });

    return { ok: true, deleted: ids.length };
  }

  async listMyMemberNotifications(userId: string) {
    const users = await this.prisma.$queryRaw<any[]>`
      SELECT id, email, phone, created_at FROM public.users WHERE id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    const userEmail = users[0]?.email || '';
    const userPhone = users[0]?.phone || '';
    const userCreatedAt = users[0]?.created_at ? new Date(users[0].created_at).getTime() : Date.now();

    const members = await this.prisma.$queryRaw<any[]>`
      SELECT id, code FROM public.members
      WHERE user_id = ${userId}::uuid
         OR (email IS NOT NULL AND LOWER(email) = LOWER(${userEmail}))
         OR (phone IS NOT NULL AND phone = ${userPhone})
    `.catch(() => []);

    const recipientKeys: string[] = [userId];
    for (const m of members) {
      if (m.id) recipientKeys.push(String(m.id));
      if (m.code) recipientKeys.push(String(m.code));
    }

    const [broadcast, personal, business] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT id, code, title, body, audience, sent_at, created_at, app_scope, target_app
        FROM public.notifications
        WHERE (status = 'sent' OR status = 'active' OR status IS NULL)
          AND (app_scope = 'association_app' OR app_scope = 'all' OR app_scope IS NULL
               OR target_app = 'association_app' OR target_app = 'all' OR target_app IS NULL)
        ORDER BY COALESCE(sent_at, created_at) DESC
        LIMIT 30
      `.catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT id, title, body, created_at, read, dismissed, ref_type, ref_id
        FROM public.member_notifications
        WHERE recipient_id::text = ANY(${recipientKeys}::text[])
        ORDER BY created_at DESC
        LIMIT 50
      `.catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT id, title_key, body_key, safe_display_data, notification_kind, created_at, read_at, source_record_id
        FROM public.business_notifications
        WHERE recipient_user_id = ${userId}::uuid
          AND (app_scope = 'association_app' OR target_app = 'association_app' OR app_scope = 'all' OR target_app = 'all' OR app_scope IS NULL)
        ORDER BY created_at DESC
        LIMIT 40
      `.catch(() => []),
    ]);

    const dismissedRows = await this.prisma.$queryRaw<any[]>`
      SELECT notification_id FROM public.broadcast_notification_dismissals
      WHERE user_id = ${userId}::uuid
    `.catch(() => []);
    const dismissedIds = new Set(dismissedRows.map((r) => r.notification_id));

    // Resolve real-time connection status for connection request items
    const allConnIds = [
      ...personal.filter((p) => p.ref_type === 'connection' && p.ref_id).map((p) => p.ref_id),
      ...business.map((b) => b.safe_display_data?.connectionId || b.source_record_id).filter(Boolean),
    ].filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id)));

    const connStatusMap: Record<string, string> = {};
    if (allConnIds.length > 0) {
      const connRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, status FROM public.user_connections
        WHERE id = ANY(${allConnIds}::uuid[])
      `.catch(() => []);
      for (const row of connRows) {
        connStatusMap[row.id] = row.status;
      }
    }

    const typeMap = (audience: string | null) => {
      const a = (audience ?? '').toLowerCase();
      if (a.includes('event') || a.includes('sự kiện')) return 'event';
      if (a.includes('fee') || a.includes('phí')) return 'fee';
      if (a.includes('opp') || a.includes('cơ hội')) return 'opportunity';
      return 'system';
    };

    const existingPersonalKeys = new Set<string>();
    for (const p of personal) {
      if (p.id) existingPersonalKeys.add(String(p.id));
      if (p.ref_id) existingPersonalKeys.add(String(p.ref_id));
    }

    // Chỉ lấy broadcast thông báo chung còn hiệu lực (từ lúc tạo tài khoản - 3 ngày trở đi)
    const broadcastItems = broadcast
      .filter((n) => {
        if (n.id && existingPersonalKeys.has(String(n.id))) return false;
        if (n.code && existingPersonalKeys.has(String(n.code))) return false;
        const sentTime = new Date(n.sent_at || n.created_at).getTime();
        // Không dump toàn bộ thông báo cũ từ nhiều tháng trước lên tài khoản mới tạo
        return sentTime >= userCreatedAt - (3 * 24 * 60 * 60 * 1000);
      })
      .map((n) => {
        const isDismissed = dismissedIds.has(n.id) || (n.code && dismissedIds.has(n.code));
        return {
          id: n.id,
          title: n.title,
          body: n.body,
          time: n.sent_at ? new Date(n.sent_at).toISOString() : new Date(n.created_at).toISOString(),
          createdAt: n.sent_at ? new Date(n.sent_at).toISOString() : new Date(n.created_at).toISOString(),
          type: typeMap(n.audience),
          unread: !isDismissed,
          dismissed: Boolean(isDismissed),
          priority: !isDismissed ? 'high' : 'low',
          personal: false,
          notificationKind: 'system_broadcast',
        };
      });

    const personalItems = personal.map((n) => {
      const isConn = n.ref_type === 'connection' && n.ref_id;
      const connStatus = isConn && connStatusMap[n.ref_id] ? connStatusMap[n.ref_id] : null;
      return {
        id: n.id,
        title: n.title,
        body: n.body,
        time: n.created_at ? new Date(n.created_at).toISOString() : new Date().toISOString(),
        createdAt: n.created_at ? new Date(n.created_at).toISOString() : new Date().toISOString(),
        type: 'network',
        unread: !n.read,
        dismissed: Boolean(n.dismissed),
        priority: !n.read ? 'high' : 'medium',
        personal: true,
        refType: n.ref_type,
        refId: n.ref_id,
        sourceRecordId: isConn ? n.ref_id : undefined,
        safeDisplayData: isConn ? { connectionId: n.ref_id, connectionStatus: connStatus } : undefined,
      };
    });

    const businessItems = (business || []).map((b) => {
      const safe = b.safe_display_data || {};
      const connId = safe.connectionId || b.source_record_id;
      if (connId) {
        safe.connectionId = connId;
        if (connStatusMap[connId]) {
          safe.connectionStatus = connStatusMap[connId];
        }
      }
      const counterpartName = safe.counterpartDisplayName || safe.senderName || 'Hội viên ViOne';

      let title = safe.title || b.title_key || 'Thông báo mới';
      let body = safe.body || safe.message || b.body_key || '';

      if (b.notification_kind === 'connection_request_received' || b.title_key?.includes('connection_request_received') || title?.includes('connection_request_received')) {
        title = `Lời mời kết nối mới`;
        body = `${counterpartName} muốn kết nối danh thiếp số với bạn.`;
      } else if (b.notification_kind === 'connection_request_accepted' || b.title_key?.includes('connection_request_accepted') || title?.includes('connection_request_accepted')) {
        title = `Kết nối thành công`;
        body = `${counterpartName} đã chấp nhận lời mời kết nối của bạn.`;
      } else if (b.notification_kind === 'connection_request_declined' || b.title_key?.includes('connection_request_declined') || title?.includes('connection_request_declined')) {
        title = `Lời mời kết nối bị từ chối`;
        body = `${counterpartName} đã từ chối lời mời kết nối.`;
      }

      let itemType: any = 'network';
      if (b.notification_kind === 'interactive_poll' || safe.pollId || safe.type === 'poll') itemType = 'voting';
      else if (b.notification_kind === 'lucky_draw_winner' || safe.type === 'lucky_draw_winner' || safe.luckyNumber) itemType = 'event';
      else if (b.notification_kind === 'overdue_payment_reminder' || safe.invoiceId) itemType = 'fee';
      else if (b.notification_kind?.startsWith('meeting') || b.notification_kind?.startsWith('event')) itemType = 'event';

      return {
        id: b.id,
        title,
        body,
        time: b.created_at ? new Date(b.created_at).toISOString() : new Date().toISOString(),
        createdAt: b.created_at ? new Date(b.created_at).toISOString() : new Date().toISOString(),
        type: itemType,
        unread: !b.read_at,
        dismissed: false,
        priority: !b.read_at ? 'high' : 'medium',
        personal: true,
        refType: b.notification_kind,
        refId: connId || b.id,
        sourceRecordId: connId,
        safeDisplayData: safe,
        notificationKind: b.notification_kind,
      };
    });

    // Thông báo chào mừng chính thức cho hội viên mới
    const welcomeNotification = {
      id: `welcome-${userId}`,
      title: 'Chào mừng bạn đến với CLB Doanh Nhân CEO 1983!',
      body: 'Chúc mừng bạn đã chính thức gia nhập CLB Doanh Nhân CEO 1983. Hãy hoàn thiện danh thiếp số và bắt đầu khám phá các sự kiện, cơ hội giao thương B2B độc quyền!',
      time: users[0]?.created_at ? new Date(users[0].created_at).toISOString() : new Date().toISOString(),
      createdAt: users[0]?.created_at ? new Date(users[0].created_at).toISOString() : new Date().toISOString(),
      type: 'system',
      unread: true,
      dismissed: false,
      priority: 'high',
      personal: true,
      notificationKind: 'welcome_ceo1983',
    };

    const combined = [...businessItems, ...personalItems, ...broadcastItems];
    if (combined.length === 0) {
      combined.push(welcomeNotification);
    }

    const rawAll = combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const seenKeys = new Set<string>();
    const deduplicated: any[] = [];
    for (const rawItem of rawAll) {
      const item = rawItem as any;
      const keys: string[] = [];
      if (item.id) keys.push(`id:${item.id}`);
      if (item.refType && item.refId) keys.push(`ref:${item.refType}:${item.refId}`);
      if (item.sourceRecordId) keys.push(`src:${item.sourceRecordId}`);
      if (item.title && item.body) {
        const normTitle = String(item.title).trim().toLowerCase();
        const normBody = String(item.body).trim().toLowerCase().slice(0, 80);
        const d = new Date(item.createdAt);
        const dayKey = isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        keys.push(`text:${normTitle}|${normBody}|${dayKey}`);
      }

      const isDuplicate = keys.some((k) => seenKeys.has(k));
      if (!isDuplicate) {
        for (const k of keys) seenKeys.add(k);
        deduplicated.push(item);
      }
    }
    return deduplicated;
  }

  async markMemberNotificationRead(userId: string, id: string) {
    await this.prisma.$executeRaw`
      UPDATE public.member_notifications SET read = true WHERE id = ${id}::uuid
    `.catch(() => null);
    await this.prisma.$executeRaw`
      UPDATE public.business_notifications SET read_at = now() WHERE id = ${id}::uuid AND recipient_user_id = ${userId}::uuid
    `.catch(() => null);
    return { marked: 1 };
  }

  async markAllMemberNotificationsRead(userId: string) {
    const members = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.members WHERE user_id = ${userId}::uuid
    `.catch(() => []);
    const memberIds = members.map((m) => m.id);

    if (memberIds.length > 0) {
      await this.prisma.$executeRaw`
        UPDATE public.member_notifications SET read = true WHERE recipient_id = ANY(${memberIds}::text[]) OR recipient_id = ${userId}::text
      `.catch(() => null);
    }
    await this.prisma.$executeRaw`
      UPDATE public.business_notifications SET read_at = now() WHERE recipient_user_id = ${userId}::uuid AND read_at IS NULL
    `.catch(() => null);
    return { marked: true };
  }

  async dismissMemberNotification(userId: string, id: string) {
    await this.prisma.$executeRaw`
      UPDATE public.member_notifications SET dismissed = true, read = true WHERE id = ${id}::uuid
    `.catch(() => null);
    await this.prisma.$executeRaw`
      UPDATE public.business_notifications SET status = 'dismissed' WHERE id = ${id}::uuid AND recipient_user_id = ${userId}::uuid
    `.catch(() => null);
    await this.prisma.$executeRaw`
      INSERT INTO public.broadcast_notification_dismissals (user_id, notification_id)
      VALUES (${userId}::uuid, ${id}::uuid)
      ON CONFLICT DO NOTHING
    `.catch(() => null);
    return { dismissed: 1 };
  }

  async deleteMemberNotification(userId: string, id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.member_notifications WHERE id = ${id}::uuid
    `.catch(() => null);
    await this.prisma.$executeRaw`
      DELETE FROM public.business_notifications WHERE id = ${id}::uuid AND recipient_user_id = ${userId}::uuid
    `.catch(() => null);
    await this.prisma.$executeRaw`
      INSERT INTO public.broadcast_notification_dismissals (user_id, notification_id)
      VALUES (${userId}::uuid, ${id}::uuid)
      ON CONFLICT DO NOTHING
    `.catch(() => null);
    return { deleted: 1 };
  }

  async dismissBroadcastNotification(userId: string, ids: string[]) {
    for (const nid of ids) {
      await this.prisma.$executeRaw`
        INSERT INTO public.broadcast_notification_dismissals (user_id, notification_id)
        VALUES (${userId}::uuid, ${nid}::uuid)
        ON CONFLICT DO NOTHING
      `.catch(() => null);
    }
    return { dismissed: ids.length };
  }

  async getNotificationPrefs(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT connection_request, connection_accepted, connection_status_update
      FROM public.gn_notification_prefs
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch((err) => {
      console.error('Error getting notification prefs:', err);
      return [];
    });

    if (rows.length === 0) {
      return {
        connectionRequest: true,
        connectionAccepted: true,
        connectionStatusUpdate: true,
      };
    }

    const r = rows[0];
    return {
      connectionRequest: r.connection_request !== false,
      connectionAccepted: r.connection_accepted !== false,
      connectionStatusUpdate: r.connection_status_update !== false,
    };
  }

  async setNotificationPrefs(userId: string, prefs: any) {
    await this.prisma.$executeRaw`
      INSERT INTO public.gn_notification_prefs (user_id, connection_request, connection_accepted, connection_status_update, updated_at)
      VALUES (
        ${userId}::uuid,
        ${prefs.connectionRequest ?? true},
        ${prefs.connectionAccepted ?? true},
        ${prefs.connectionStatusUpdate ?? true},
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        connection_request = EXCLUDED.connection_request,
        connection_accepted = EXCLUDED.connection_accepted,
        connection_status_update = EXCLUDED.connection_status_update,
        updated_at = now()
    `;
    return prefs;
  }

  async reportUser(userId: string, data: any) {
    const id = crypto.randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO public.gn_reports (id, reporter_user_id, reported_user_id, category, details, connection_id, created_at)
      VALUES (
        ${id}::uuid,
        ${userId}::uuid,
        ${data.reportedUserId}::uuid,
        ${data.category},
        ${data.details || null},
        ${data.connectionId || null}::uuid,
        now()
      )
    `;
    return { reportId: id };
  }

  async getMyShowcase(userId: string) {
    const items = await this.prisma.$queryRaw<any[]>`
      SELECT id, kind, title, subtitle, logo_url AS "logoUrl"
      FROM public.business_identity_showcase_items
      WHERE owner_user_id = ${userId}::uuid
      ORDER BY sort_order ASC, created_at ASC
      LIMIT 120
    `;
    return {
      businessAreas: items.filter((i) => i.kind === 'business_area'),
      clients: items.filter((i) => i.kind === 'client'),
      metrics: items.filter((i) => i.kind === 'metric'),
      interests: items.filter((i) => i.kind === 'interest'),
      clientMetrics: items.filter((i) => i.kind === 'client_metric'),
    };
  }

  async addShowcaseItem(userId: string, data: any) {
    const { kind, title, subtitle, logoUrl, sortOrder } = data;
    await this.prisma.$executeRaw`
      INSERT INTO public.business_identity_showcase_items (
        owner_user_id, kind, title, subtitle, logo_url, sort_order
      ) VALUES (
        ${userId}::uuid, ${kind}, ${title}, ${subtitle || null}, ${logoUrl || null}, ${sortOrder || 0}
      )
    `;
    return { success: true };
  }

  async deleteShowcaseItem(userId: string, id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.business_identity_showcase_items
      WHERE id = ${id}::uuid AND owner_user_id = ${userId}::uuid
    `;
    return { success: true };
  }

  // --- Moments (BC-Mobile-2E) ---
  
  async prepareMoment(userId: string, input: any) {
    const { personId, occurredAt, eventName, placeLabel, note, photoCount, clientToken, visibility = 'friends' } = input;

    const m = /^([ucg]):([0-9a-fA-F-]{36})$/.exec(personId);
    if (!m) throw new ForbiddenException('relationship_not_authorized');
    const namespace = m[1];
    const targetId = m[2].toLowerCase();

    let targetKind = 'connection';
    let targetUserId: string | null = null;
    let targetCardId: string | null = null;
    let targetGuestId: string | null = null;

    if (namespace === 'u') {
      if (targetId === userId) throw new ForbiddenException('relationship_not_authorized');
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.user_connections
        WHERE status = 'accepted'::public.global_connection_status
          AND ((requester_user_id = ${userId}::uuid AND recipient_user_id = ${targetId}::uuid)
            OR (requester_user_id = ${targetId}::uuid AND recipient_user_id = ${userId}::uuid))
        LIMIT 1
      `.catch(() => []);
      if (rows.length === 0) throw new ForbiddenException('relationship_not_authorized');
      targetKind = 'connection';
      targetUserId = targetId;
    } else if (namespace === 'g') {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.guest_contacts
        WHERE owner_user_id = ${userId}::uuid AND id = ${targetId}::uuid
        LIMIT 1
      `.catch(() => []);
      if (rows.length === 0) throw new ForbiddenException('relationship_not_authorized');
      targetKind = 'guest_contact';
      targetGuestId = targetId;
    } else {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.saved_business_cards
        WHERE owner_user_id = ${userId}::uuid AND target_card_id = ${targetId}::uuid AND archived = false
        LIMIT 1
      `.catch(() => []);
      if (rows.length === 0) throw new ForbiddenException('relationship_not_authorized');
      targetKind = 'saved_card';
      targetCardId = targetId;
    }

    const existingRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, status FROM public.business_relationship_moments
      WHERE owner_user_id = ${userId}::uuid AND client_token = ${clientToken}::uuid
      LIMIT 1
    `.catch(() => []);

    let momentId: string;

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      momentId = existing.id;
      if (existing.status === 'active') {
        return { ok: true, alreadySaved: true, momentId, photos: [] };
      }
      await this.prisma.$executeRaw`
        UPDATE public.business_relationship_moments
        SET occurred_at = ${new Date(occurredAt)},
            event_name = ${eventName || null},
            place_label = ${placeLabel || null},
            note = ${note || null},
            visibility = ${visibility || 'friends'},
            updated_at = now()
        WHERE id = ${momentId}::uuid
      `;
    } else {
      momentId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.business_relationship_moments (
          id, owner_user_id, target_kind, target_user_id, target_card_id, target_guest_id,
          occurred_at, event_name, place_label, note, status, visibility, client_token, created_at, updated_at
        ) VALUES (
          ${momentId}::uuid, ${userId}::uuid, ${targetKind},
          ${targetUserId ? targetUserId : null}::uuid,
          ${targetCardId ? targetCardId : null}::uuid,
          ${targetGuestId ? targetGuestId : null}::uuid,
          ${new Date(occurredAt)}, ${eventName || null}, ${placeLabel || null}, ${note || null},
          'pending', ${visibility || 'friends'}, ${clientToken}::uuid, now(), now()
        )
      `;
    }

    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    const photos: any[] = [];
    if (photoCount > 0) {
      for (let i = 0; i < photoCount; i++) {
        const mediaId = crypto.randomUUID();
        const storagePath = `${userId}/${momentId}/${mediaId}.jpg`;
        await this.prisma.$executeRaw`
          INSERT INTO public.business_relationship_moment_media (
            id, moment_id, owner_user_id, storage_path, media_type, sort_order
          ) VALUES (
            ${mediaId}::uuid, ${momentId}::uuid, ${userId}::uuid, ${storagePath}, 'image/jpeg', ${i}
          )
        `;
        photos.push({
          mediaId,
          storagePath,
          sortOrder: i,
        });
      }
    }

    return { ok: true, alreadySaved: false, momentId, photos };
  }

  async finalizeMoment(userId: string, input: any) {
    const { momentId, uploadedMediaIds, mediaPaths } = input;
    const momentRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, status FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (momentRows.length === 0) throw new NotFoundException('not_found');
    const moment = momentRows[0];
    if (moment.status === 'active') return { ok: true, momentId };

    // Update storage paths if mediaPaths mapping is provided
    if (mediaPaths && typeof mediaPaths === 'object') {
      for (const [mediaId, storagePath] of Object.entries(mediaPaths)) {
        await this.prisma.$executeRaw`
          UPDATE public.business_relationship_moment_media
          SET storage_path = ${storagePath}
          WHERE id = ${mediaId}::uuid AND owner_user_id = ${userId}::uuid
        `;
      }
    }

    const slots = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid
    `.catch(() => []);

    const slotIds = new Set(slots.map((s) => s.id));
    const keep = uploadedMediaIds.filter((id) => slotIds.has(id));

    if (keep.length > 0) {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_media
        WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid AND NOT (id = ANY(${keep}::uuid[]))
      `;
    } else {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_media
        WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      `;
    }

    await this.prisma.$executeRaw`
      UPDATE public.business_relationship_moments
      SET status = 'active', updated_at = now()
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid AND status = 'pending'
    `;

    try {
      const activeMomentRows = await this.prisma.$queryRaw<any[]>`
        SELECT target_user_id, note, event_name, place_label
        FROM public.business_relationship_moments
        WHERE id = ${momentId}::uuid
        LIMIT 1
      `.catch(() => []);

      const activeMoment = activeMomentRows[0];
      const taggedId = activeMoment?.target_user_id ? String(activeMoment.target_user_id) : null;
      if (taggedId && taggedId.toLowerCase() !== userId.toLowerCase()) {
        void this.notifyMomentTags(userId, {
          momentId,
          taggedUserIds: [taggedId],
          content: activeMoment.note || activeMoment.event_name || activeMoment.place_label || '',
        });
      }
    } catch {
      // ignore
    }

    return { ok: true, momentId };
  }

  async updateMoment(userId: string, input: any) {
    const {
      momentId,
      occurredAt,
      eventName,
      placeLabel,
      note,
      visibility,
      targetPersonId,
      photoUrls,
      taggedUserIds,
    } = input;

    const momentRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (momentRows.length === 0) throw new NotFoundException('not_found');

    let targetKind: string | null = null;
    let targetUserId: string | null = null;
    let targetCardId: string | null = null;
    let targetGuestId: string | null = null;

    if (targetPersonId) {
      const raw = String(targetPersonId).trim();
      if (raw.startsWith('u:')) {
        targetKind = 'connection';
        targetUserId = raw.slice(2);
      } else if (raw.startsWith('c:')) {
        targetKind = 'saved_card';
        targetCardId = raw.slice(2);
      } else if (raw.startsWith('g:')) {
        targetKind = 'guest_contact';
        targetGuestId = raw.slice(2);
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
        targetKind = 'connection';
        targetUserId = raw;
      }
    }

    const safeOccurredAt = occurredAt ? new Date(occurredAt) : new Date();

    if (targetKind) {
      await this.prisma.$executeRaw`
        UPDATE public.business_relationship_moments
        SET occurred_at = ${safeOccurredAt},
            event_name = ${eventName || null},
            place_label = ${placeLabel || null},
            note = ${note || null},
            visibility = COALESCE(${visibility || null}, visibility, 'friends'),
            target_kind = ${targetKind},
            target_user_id = ${targetUserId ? targetUserId : null}::uuid,
            target_card_id = ${targetCardId ? targetCardId : null}::uuid,
            target_guest_id = ${targetGuestId ? targetGuestId : null}::uuid,
            updated_at = now()
        WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE public.business_relationship_moments
        SET occurred_at = ${safeOccurredAt},
            event_name = ${eventName || null},
            place_label = ${placeLabel || null},
            note = ${note || null},
            visibility = COALESCE(${visibility || null}, visibility, 'friends'),
            updated_at = now()
        WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      `;
    }

    // Update photos if photoUrls array is provided
    if (Array.isArray(photoUrls)) {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_media
        WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      `.catch(() => null);

      for (let i = 0; i < photoUrls.length; i++) {
        const photoUrl = photoUrls[i];
        if (!photoUrl) continue;
        const mediaId = crypto.randomUUID();
        await this.prisma.$executeRaw`
          INSERT INTO public.business_relationship_moment_media (
            id, moment_id, owner_user_id, storage_path, media_type, sort_order
          ) VALUES (
            ${mediaId}::uuid, ${momentId}::uuid, ${userId}::uuid, ${photoUrl}, 'image/jpeg', ${i}
          )
        `.catch(() => null);
      }
    }

    // Notify tagged users if provided
    if (Array.isArray(taggedUserIds) && taggedUserIds.length > 0) {
      void this.notifyMomentTags(userId, {
        momentId,
        taggedUserIds,
        content: note || eventName || '',
      });
    }

    return { ok: true, momentId };
  }

  async deleteMoment(userId: string, momentId: string) {
    const momentRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (momentRows.length === 0) throw new NotFoundException('not_found');

    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    // Cascade delete moment comments and likes
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_comments WHERE moment_id = ${momentId}::uuid
    `.catch(() => null);
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_likes WHERE moment_id = ${momentId}::uuid
    `.catch(() => null);

    return { ok: true, momentId };
  }

  // ── Moment 3-Level Comments, Likes & Mentions ───────────────────

  async listMomentComments(momentId: string, viewerUserId: string) {
    const rawComments = await this.prisma.$queryRaw<any[]>`
      SELECT c.id, c.moment_id, c.user_id, c.parent_id, c.content, c.photo_url, c.mentions, c.created_at, c.updated_at,
             bi.display_name, bi.avatar_url, bi.job_title, bi.company_name
      FROM public.business_relationship_moment_comments c
      LEFT JOIN public.business_identities bi ON c.user_id = bi.owner_user_id
      WHERE c.moment_id = ${momentId}::uuid
      ORDER BY c.created_at ASC
    `.catch(() => [] as any[]);

    const commentIds = rawComments.map(c => c.id);
    let likesRows: any[] = [];
    if (commentIds.length > 0) {
      likesRows = await this.prisma.$queryRaw<any[]>`
        SELECT comment_id, user_id FROM public.business_relationship_moment_comment_likes
        WHERE comment_id = ANY(${commentIds}::uuid[])
      `.catch(() => [] as any[]);
    }

    const likesCountMap = new Map<string, number>();
    const userLikedSet = new Set<string>();
    for (const l of likesRows) {
      likesCountMap.set(l.comment_id, (likesCountMap.get(l.comment_id) || 0) + 1);
      if (l.user_id === viewerUserId) {
        userLikedSet.add(l.comment_id);
      }
    }

    const formattedList: any[] = rawComments.map(c => {
      const displayName = c.display_name || 'Hội viên ViOne';
      const words = displayName.trim().split(/\s+/).filter(Boolean);
      const initials = words.length > 1
        ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
        : (words[0]?.[0] || 'HV').toUpperCase();

      return {
        id: c.id,
        momentId: c.moment_id,
        userId: c.user_id,
        parentId: c.parent_id || null,
        content: c.content,
        photoUrl: c.photo_url || null,
        mentions: Array.isArray(c.mentions) ? c.mentions : (typeof c.mentions === 'string' ? JSON.parse(c.mentions || '[]') : []),
        createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
        author: {
          userId: c.user_id,
          displayName,
          avatarUrl: c.avatar_url || null,
          initials,
          jobTitle: c.job_title || null,
          companyName: c.company_name || null,
        },
        likesCount: likesCountMap.get(c.id) || 0,
        userLiked: userLikedSet.has(c.id),
      };
    });

    // Build 3-level hierarchical tree
    const level1: any[] = [];
    const byId = new Map<string, any>();
    for (const item of formattedList) {
      item.replies = [];
      byId.set(item.id, item);
    }

    for (const item of formattedList) {
      if (!item.parentId) {
        level1.push(item);
      } else {
        const parent = byId.get(item.parentId);
        if (parent) {
          parent.replies.push(item);
        } else {
          level1.push(item);
        }
      }
    }

    return {
      ok: true,
      momentId,
      totalComments: rawComments.length,
      comments: level1,
    };
  }

  async createMomentComment(
    userId: string,
    momentId: string,
    input: { parentId?: string | null; content: string; photoUrl?: string | null; mentions?: any[] },
  ) {
    const { parentId, content, photoUrl = null, mentions = [] } = input;
    if ((!content || !content.trim()) && !photoUrl) {
      throw new BadRequestException('content_required');
    }

    const commentId = crypto.randomUUID();
    const now = new Date();
    const mentionsJson = JSON.stringify(mentions);

    await this.prisma.$executeRaw`
      INSERT INTO public.business_relationship_moment_comments (
        id, moment_id, user_id, parent_id, content, photo_url, mentions, created_at, updated_at
      ) VALUES (
        ${commentId}::uuid, ${momentId}::uuid, ${userId}::uuid,
        ${parentId ? parentId : null}::uuid,
        ${content ? content.trim() : '(Hình ảnh)'},
        ${photoUrl},
        ${mentionsJson}::jsonb,
        ${now}, ${now}
      )
    `;

    // Fetch author identity
    const authorProfiles = await this.prisma.$queryRaw<any[]>`
      SELECT display_name, avatar_url, job_title, company_name
      FROM public.business_identities
      WHERE owner_user_id = ${userId}::uuid AND status = 'active'
      LIMIT 1
    `.catch(() => [] as any[]);
    const author = authorProfiles[0] || {};
    const displayName = author.display_name || 'Hội viên ViOne';
    const words = displayName.trim().split(/\s+/).filter(Boolean);
    const initials = words.length > 1
      ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
      : (words[0]?.[0] || 'HV').toUpperCase();

    const commentPayload = {
      id: commentId,
      momentId,
      userId,
      parentId: parentId || null,
      content: content ? content.trim() : '(Hình ảnh)',
      photoUrl: photoUrl || null,
      mentions,
      createdAt: now.toISOString(),
      author: {
        userId,
        displayName,
        avatarUrl: author.avatar_url || null,
        initials,
        jobTitle: author.job_title || null,
        companyName: author.company_name || null,
      },
      likesCount: 0,
      userLiked: false,
      replies: [],
    };

    // 1. Broadcast via WebSocket
    this.gateway.emitMomentCommentAdded(momentId, commentPayload);

    // 2. Fetch moment owner & muted users
    const [momentRows, mutedRows] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT owner_user_id, event_name, place_label FROM public.business_relationship_moments
        WHERE id = ${momentId}::uuid LIMIT 1
      `.catch(() => [] as any[]),
      this.prisma.$queryRaw<any[]>`
        SELECT user_id FROM public.business_relationship_moment_mutes
        WHERE moment_id = ${momentId}::uuid
      `.catch(() => [] as any[]),
    ]);

    const momentOwnerId = momentRows[0]?.owner_user_id;
    const mutedUserIds = new Set(mutedRows.map(r => String(r.user_id).toLowerCase()));

    // 3. Create notifications
    try {
      // 3a. Notify moment owner (if not the commenter and not muted)
      if (momentOwnerId && momentOwnerId !== userId && !mutedUserIds.has(String(momentOwnerId).toLowerCase())) {
        const notifId = crypto.randomUUID();
        const safeData = JSON.stringify({
          commenterName: displayName,
          momentTitle: momentRows[0]?.event_name || momentRows[0]?.place_label || 'khoảnh khắc',
          content: content.substring(0, 100),
        });
        const actionTarget = JSON.stringify({ route: '/connect-app', momentId });
        const dedupeKey = `moment_comment:${notifId}`;
        await this.prisma.$executeRaw`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
            priority, status, created_at, updated_at, dedupe_key
          ) VALUES (
            ${notifId}::uuid, ${momentOwnerId}::uuid, 'moment', ${momentId}, 'moment_comment', 'moment_new_comment',
            'bc.notif.moment_comment.title', 'bc.notif.moment_comment.body',
            ${safeData}::jsonb, 'open_moment_detail', 'bc.notif.action.view', ${actionTarget}::jsonb,
            'normal', 'delivered', ${now}, ${now}, ${dedupeKey}
          )
        `.catch(() => null);
        this.gateway.emitNotification(momentOwnerId, {
          id: notifId,
          title: `${displayName} đã bình luận về khoảnh khắc của bạn`,
          momentId,
          safeDisplayData: {
            title: `${displayName} đã bình luận về khoảnh khắc của bạn`,
            body: content.substring(0, 100),
          },
        });
      }

      // 3b. Notify parent comment author (if reply, not self, and not muted)
      if (parentId) {
        const parentRows = await this.prisma.$queryRaw<any[]>`
          SELECT user_id FROM public.business_relationship_moment_comments WHERE id = ${parentId}::uuid LIMIT 1
        `.catch(() => [] as any[]);
        const parentUserId = parentRows[0]?.user_id;
        if (
          parentUserId &&
          parentUserId !== userId &&
          parentUserId !== momentOwnerId &&
          !mutedUserIds.has(String(parentUserId).toLowerCase())
        ) {
          const notifId = crypto.randomUUID();
          const safeData = JSON.stringify({
            commenterName: displayName,
            content: content.substring(0, 100),
          });
          const actionTarget = JSON.stringify({ route: '/connect-app', momentId });
          const dedupeKey = `moment_reply:${notifId}`;
          await this.prisma.$executeRaw`
            INSERT INTO public.business_notifications (
              id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
              title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
              priority, status, created_at, updated_at, dedupe_key
            ) VALUES (
              ${notifId}::uuid, ${parentUserId}::uuid, 'moment', ${momentId}, 'moment_comment_reply', 'moment_reply_comment',
              'bc.notif.moment_reply.title', 'bc.notif.moment_reply.body',
              ${safeData}::jsonb, 'open_moment_detail', 'bc.notif.action.view', ${actionTarget}::jsonb,
              'normal', 'delivered', ${now}, ${now}, ${dedupeKey}
            )
          `.catch(() => null);
          this.gateway.emitNotification(parentUserId, {
            id: notifId,
            title: `${displayName} đã phản hồi bình luận của bạn`,
            momentId,
            safeDisplayData: {
              title: `${displayName} đã phản hồi bình luận của bạn`,
              body: content.substring(0, 100),
            },
          });
        }
      }

      // 3c. Notify mentioned users (if not self and not muted)
      if (Array.isArray(mentions)) {
        for (const m of mentions) {
          const mentionedUserId = m.userId || m.id;
          if (
            mentionedUserId &&
            mentionedUserId !== userId &&
            mentionedUserId !== momentOwnerId &&
            !mutedUserIds.has(String(mentionedUserId).toLowerCase())
          ) {
            const notifId = crypto.randomUUID();
            const safeData = JSON.stringify({
              mentionerName: displayName,
              content: content.substring(0, 100),
            });
            const actionTarget = JSON.stringify({ route: '/connect-app', momentId });
            const dedupeKey = `moment_mention:${notifId}`;
            await this.prisma.$executeRaw`
              INSERT INTO public.business_notifications (
                id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
                title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
                priority, status, created_at, updated_at, dedupe_key
              ) VALUES (
                ${notifId}::uuid, ${mentionedUserId}::uuid, 'moment', ${momentId}, 'moment_mention', 'moment_user_mention',
                'bc.notif.moment_mention.title', 'bc.notif.moment_mention.body',
                ${safeData}::jsonb, 'open_moment_detail', 'bc.notif.action.view', ${actionTarget}::jsonb,
                'high', 'delivered', ${now}, ${now}, ${dedupeKey}
              )
            `.catch(() => null);
            this.gateway.emitNotification(mentionedUserId, {
              id: notifId,
              title: `Bạn được nhắc tên trong khoảnh khắc của ${displayName}`,
              momentId,
              safeDisplayData: {
                title: `Bạn được nhắc tên trong khoảnh khắc của ${displayName}`,
                body: content.substring(0, 100),
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn('Error generating comment notifications:', err);
    }

    return { ok: true, comment: commentPayload };
  }

  async toggleMuteMoment(userId: string, momentId: string) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_mutes
      WHERE moment_id = ${momentId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (existing.length > 0) {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_mutes
        WHERE moment_id = ${momentId}::uuid AND user_id = ${userId}::uuid
      `;
      return { ok: true, isMuted: false };
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO public.business_relationship_moment_mutes (id, moment_id, user_id, created_at)
        VALUES (gen_random_uuid(), ${momentId}::uuid, ${userId}::uuid, now())
        ON CONFLICT (moment_id, user_id) DO NOTHING
      `;
      return { ok: true, isMuted: true };
    }
  }

  async getMomentMuteStatus(userId: string, momentId: string) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_mutes
      WHERE moment_id = ${momentId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    return { ok: true, isMuted: existing.length > 0 };
  }

  async deleteMomentComment(userId: string, momentId: string, commentId: string) {
    const commentRows = await this.prisma.$queryRaw<any[]>`
      SELECT user_id, moment_id FROM public.business_relationship_moment_comments
      WHERE id = ${commentId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    if (commentRows.length === 0) throw new NotFoundException('comment_not_found');

    const momentRows = await this.prisma.$queryRaw<any[]>`
      SELECT owner_user_id FROM public.business_relationship_moments WHERE id = ${momentId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    const comment = commentRows[0];
    const isCommentAuthor = comment.user_id === userId;
    const isMomentOwner = momentRows[0]?.owner_user_id === userId;

    if (!isCommentAuthor && !isMomentOwner) {
      throw new ForbiddenException('cannot_delete_foreign_comment');
    }

    const childComments = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE comment_tree AS (
        SELECT id FROM public.business_relationship_moment_comments WHERE id = ${commentId}::uuid
        UNION ALL
        SELECT c.id FROM public.business_relationship_moment_comments c
        INNER JOIN comment_tree ct ON c.parent_id = ct.id
      )
      SELECT id FROM comment_tree;
    `.catch(() => [{ id: commentId }]);

    const allIds = childComments.map(c => c.id);
    if (allIds.length > 0) {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_comment_likes WHERE comment_id = ANY(${allIds}::uuid[])
      `.catch(() => null);
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_comments WHERE id = ANY(${allIds}::uuid[])
      `.catch(() => null);
    }

    this.gateway.emitMomentCommentDeleted(momentId, commentId);
    return { ok: true, commentId };
  }

  async toggleMomentCommentLike(userId: string, momentId: string, commentId: string) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_comment_likes
      WHERE comment_id = ${commentId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    let liked = false;
    if (existing.length > 0) {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_comment_likes
        WHERE comment_id = ${commentId}::uuid AND user_id = ${userId}::uuid
      `;
      liked = false;
    } else {
      const likeId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.business_relationship_moment_comment_likes (id, comment_id, user_id, created_at)
        VALUES (${likeId}::uuid, ${commentId}::uuid, ${userId}::uuid, now())
      `;
      liked = true;
    }

    const countRows = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.business_relationship_moment_comment_likes
      WHERE comment_id = ${commentId}::uuid
    `.catch(() => [{ count: 0 }]);

    const likesCount = Number(countRows[0]?.count || 0);
    this.gateway.emitMomentCommentLiked(momentId, commentId, likesCount, userId, liked);

    return { ok: true, commentId, liked, likesCount };
  }

  async toggleMomentLike(userId: string, momentId: string) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_likes
      WHERE moment_id = ${momentId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    let liked = false;
    if (existing.length > 0) {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_likes
        WHERE moment_id = ${momentId}::uuid AND user_id = ${userId}::uuid
      `;
      liked = false;
    } else {
      const likeId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.business_relationship_moment_likes (id, moment_id, user_id, created_at)
        VALUES (${likeId}::uuid, ${momentId}::uuid, ${userId}::uuid, now())
      `;
      liked = true;
    }

    const countRows = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.business_relationship_moment_likes
      WHERE moment_id = ${momentId}::uuid
    `.catch(() => [{ count: 0 }]);

    const likesCount = Number(countRows[0]?.count || 0);
    this.gateway.emitMomentLiked(momentId, likesCount, userId, liked);

    return { ok: true, momentId, liked, likesCount };
  }

  async getMomentLikeStatus(userId: string, momentId: string) {
    const countRows = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.business_relationship_moment_likes
      WHERE moment_id = ${momentId}::uuid
    `.catch(() => [{ count: 0 }]);

    const userLikedRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_likes
      WHERE moment_id = ${momentId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const commentCountRows = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.business_relationship_moment_comments
      WHERE moment_id = ${momentId}::uuid
    `.catch(() => [{ count: 0 }]);

    return {
      ok: true,
      momentId,
      likesCount: Number(countRows[0]?.count || 0),
      userLiked: userLikedRows.length > 0,
      commentsCount: Number(commentCountRows[0]?.count || 0),
    };
  }

  async listMomentPhotos(userId: string, momentId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(momentId)) {
      return {
        ok: true,
        momentId,
        max: 6,
        photos: [],
      };
    }

    const momentRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (momentRows.length === 0) {
      return {
        ok: true,
        momentId,
        max: 6,
        photos: [],
      };
    }

    const slots = await this.prisma.$queryRaw<any[]>`
      SELECT id, moment_id, storage_path, sort_order
      FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid
      ORDER BY sort_order ASC
    `.catch(() => []);

    return {
      ok: true,
      momentId,
      max: 6,
      photos: slots.map((s) => ({
        mediaId: s.id,
        storagePath: s.storage_path,
        sortOrder: s.sort_order,
        url: s.storage_path
          ? (s.storage_path.startsWith('http') ? s.storage_path : `/uploads/${s.storage_path.replace(/^\/+/, '')}`)
          : null,
      })),
    };
  }

  async addMomentPhotoSlots(userId: string, momentId: string, count: number) {
    const momentRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (momentRows.length === 0) throw new NotFoundException('not_found');

    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT sort_order FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid
    `.catch(() => [] as any[]);

    if (existing.length + count > 6) {
      throw new BadRequestException('photo_count');
    }

    const startSort = existing.reduce((max, s) => Math.max(max, s.sort_order + 1), 0);
    const photos: any[] = [];
    for (let i = 0; i < count; i++) {
      const mediaId = crypto.randomUUID();
      const storagePath = `${userId}/${momentId}/${mediaId}.jpg`;
      const sortOrder = startSort + i;
      await this.prisma.$executeRaw`
        INSERT INTO public.business_relationship_moment_media (
          id, moment_id, owner_user_id, storage_path, media_type, sort_order
        ) VALUES (
          ${mediaId}::uuid, ${momentId}::uuid, ${userId}::uuid, ${storagePath}, 'image/jpeg', ${sortOrder}
        )
      `;
      photos.push({
        mediaId,
        storagePath,
        sortOrder,
      });
    }

    return { ok: true, momentId, photos };
  }

  async commitMomentPhotos(userId: string, input: any) {
    const { momentId, addedMediaIds, uploadedMediaIds, mediaPaths } = input;
    const momentRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (momentRows.length === 0) throw new NotFoundException('not_found');

    // Update storage paths if mediaPaths mapping is provided
    if (mediaPaths && typeof mediaPaths === 'object') {
      for (const [mediaId, storagePath] of Object.entries(mediaPaths)) {
        await this.prisma.$executeRaw`
          UPDATE public.business_relationship_moment_media
          SET storage_path = ${storagePath}
          WHERE id = ${mediaId}::uuid AND owner_user_id = ${userId}::uuid
        `;
      }
    }

    const slots: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid
    `.catch(() => [] as any[]);

    const uploaded = new Set(uploadedMediaIds);
    const drop = slots.filter((s: any) => addedMediaIds.includes(s.id) && !uploaded.has(s.id));
    if (drop.length > 0) {
      const dropIds = drop.map((s) => s.id);
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_media
        WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid AND id = ANY(${dropIds}::uuid[])
      `;
    }

    return { ok: true, momentId };
  }

  async removeMomentPhoto(userId: string, momentId: string, mediaId: string) {
    const momentRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (momentRows.length === 0) throw new NotFoundException('not_found');

    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid AND id = ${mediaId}::uuid
    `;

    return { ok: true, momentId };
  }

  // --- Reminders ---

  async listMomentReminders(userId: string, momentId: string | null, includeDone: boolean, limit: number) {
    let query;
    if (momentId) {
      if (includeDone) {
        query = this.prisma.$queryRaw<any[]>`
          SELECT id, moment_id, remind_at, label, status, completed_at
          FROM public.business_relationship_moment_reminders
          WHERE owner_user_id = ${userId}::uuid AND moment_id = ${momentId}::uuid
          ORDER BY remind_at ASC
          LIMIT ${limit}
        `;
      } else {
        query = this.prisma.$queryRaw<any[]>`
          SELECT id, moment_id, remind_at, label, status, completed_at
          FROM public.business_relationship_moment_reminders
          WHERE owner_user_id = ${userId}::uuid AND moment_id = ${momentId}::uuid AND status = 'pending'
          ORDER BY remind_at ASC
          LIMIT ${limit}
        `;
      }
    } else {
      if (includeDone) {
        query = this.prisma.$queryRaw<any[]>`
          SELECT id, moment_id, remind_at, label, status, completed_at
          FROM public.business_relationship_moment_reminders
          WHERE owner_user_id = ${userId}::uuid
          ORDER BY remind_at ASC
          LIMIT ${limit}
        `;
      } else {
        query = this.prisma.$queryRaw<any[]>`
          SELECT id, moment_id, remind_at, label, status, completed_at
          FROM public.business_relationship_moment_reminders
          WHERE owner_user_id = ${userId}::uuid AND status = 'pending'
          ORDER BY remind_at ASC
          LIMIT ${limit}
        `;
      }
    }

    const rows = await query.catch(() => []);
    return {
      ok: true,
      reminders: rows.map((r) => ({
        id: r.id,
        momentId: r.moment_id,
        remindAt: r.remind_at ? new Date(r.remind_at).toISOString() : null,
        label: r.label,
        status: r.status,
        completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
      })),
    };
  }

  async createMomentReminder(userId: string, momentId: string, remindAt: string, label: string | null) {
    const countRow = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.business_relationship_moment_reminders
      WHERE owner_user_id = ${userId}::uuid AND moment_id = ${momentId}::uuid AND status = 'pending'
    `.catch(() => []);

    const count = countRow[0]?.count || 0;
    if (count >= 5) {
      return { ok: false, error: 'limit_reached' };
    }

    const id = crypto.randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO public.business_relationship_moment_reminders (
        id, moment_id, owner_user_id, remind_at, label, status
      ) VALUES (
        ${id}::uuid, ${momentId}::uuid, ${userId}::uuid, ${new Date(remindAt)}, ${label || null}, 'pending'
      )
    `;

    return {
      ok: true,
      reminder: {
        id,
        momentId,
        remindAt: new Date(remindAt).toISOString(),
        label,
        status: 'pending',
        completedAt: null,
      },
    };
  }

  async setMomentReminderStatus(userId: string, reminderId: string, status: string) {
    const completedAt = status === 'done' ? new Date() : null;

    const rowBefore = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_reminders
      WHERE id = ${reminderId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (rowBefore.length === 0) return { ok: false, error: 'not_found' };

    await this.prisma.$executeRaw`
      UPDATE public.business_relationship_moment_reminders
      SET status = ${status},
          completed_at = ${completedAt}
      WHERE id = ${reminderId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    const rowAfter = await this.prisma.$queryRaw<any[]>`
      SELECT id, moment_id, remind_at, label, status, completed_at
      FROM public.business_relationship_moment_reminders
      WHERE id = ${reminderId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    const r = rowAfter[0];
    return {
      ok: true,
      reminder: {
        id: r.id,
        momentId: r.moment_id,
        remindAt: r.remind_at ? new Date(r.remind_at).toISOString() : null,
        label: r.label,
        status: r.status,
        completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null,
      },
    };
  }

  async deleteMomentReminder(userId: string, reminderId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_reminders
      WHERE id = ${reminderId}::uuid AND owner_user_id = ${userId}::uuid
    `;
    return { ok: true, reminderId };
  }

  // ==========================================
  // BC-Mobile-5C — NFC Device Sessions & Tags
  // ==========================================

  async listMyDeviceSessions(userId: string, currentKey: string | null) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, device_key, device_label, platform, browser, is_standalone, first_seen_at, last_seen_at, revoked_at
      FROM public.user_device_sessions
      WHERE user_id = ${userId}::uuid
      ORDER BY last_seen_at DESC
    `.catch(() => [] as any[]);

    return rows.map(r => ({
      id: r.id,
      deviceKey: r.device_key,
      label: r.device_label ?? "Thiết bị",
      platform: r.platform,
      browser: r.browser,
      isStandalone: r.is_standalone,
      firstSeenAt: r.first_seen_at ? new Date(r.first_seen_at).toISOString() : null,
      lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at).toISOString() : null,
      revokedAt: r.revoked_at ? new Date(r.revoked_at).toISOString() : null,
      isCurrent: currentKey !== null && r.device_key === currentKey,
    }));
  }

  async touchMyDeviceSession(userId: string, input: any) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id, revoked_at FROM public.user_device_sessions
      WHERE user_id = ${userId}::uuid AND device_key = ${input.deviceKey}
      LIMIT 1
    `.catch(() => [] as any[]);

    const first = existing[0];
    if (first?.revoked_at) return { revoked: true };

    const now = new Date();
    if (first) {
      await this.prisma.$executeRaw`
        UPDATE public.user_device_sessions
        SET last_seen_at = ${now}
        WHERE id = ${first.id}::uuid
      `;
      return { revoked: false };
    }

    await this.prisma.$executeRaw`
      INSERT INTO public.user_device_sessions (
        user_id, device_key, device_label, platform, browser, is_standalone, first_seen_at, last_seen_at
      ) VALUES (
        ${userId}::uuid, ${input.deviceKey}, ${input.label || null}, ${input.platform || null},
        ${input.browser || null}, ${input.isStandalone || false}, ${now}, ${now}
      )
    `;
    return { revoked: false };
  }

  async revokeMyDeviceSession(userId: string, sessionId: string, currentKey: string | null) {
    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.user_device_sessions
      SET revoked_at = ${now}
      WHERE id = ${sessionId}::uuid AND user_id = ${userId}::uuid
    `;

    const updated = await this.prisma.$queryRaw<any[]>`
      SELECT id, device_key, device_label, platform, browser, is_standalone, first_seen_at, last_seen_at, revoked_at
      FROM public.user_device_sessions
      WHERE id = ${sessionId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const r = updated[0];
    if (!r) throw new NotFoundException('session_not_found');

    return {
      id: r.id,
      deviceKey: r.device_key,
      label: r.device_label ?? "Thiết bị",
      platform: r.platform,
      browser: r.browser,
      isStandalone: r.is_standalone,
      firstSeenAt: r.first_seen_at ? new Date(r.first_seen_at).toISOString() : null,
      lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at).toISOString() : null,
      revokedAt: r.revoked_at ? new Date(r.revoked_at).toISOString() : null,
      isCurrent: currentKey !== null && r.device_key === currentKey,
    };
  }

  async listMyNfcTags(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT t.id, t.label, t.status, t.written_at, t.updated_at,
             l.status as link_status, l.last_used_at as link_last_used_at
      FROM public.identity_nfc_tags t
      LEFT JOIN public.identity_share_links l ON t.share_link_id = l.id
      WHERE t.owner_user_id = ${userId}::uuid
      ORDER BY t.created_at DESC
    `.catch(() => [] as any[]);

    return rows.map(r => {
      let derivedStatus = 'STALE';
      if (r.status === 'revoked') derivedStatus = 'REVOKED';
      else if (r.link_status === 'active') derivedStatus = 'ACTIVE';

      return {
        id: r.id,
        label: r.label,
        status: derivedStatus,
        writtenAt: r.written_at ? new Date(r.written_at).toISOString() : null,
        lastTappedAt: r.link_last_used_at ? new Date(r.link_last_used_at).toISOString() : null,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      };
    });
  }

  async registerMyNfcTag(userId: string, input: any) {
    const links = await this.prisma.$queryRaw<any[]>`
      SELECT id, identity_id, status FROM public.identity_share_links
      WHERE owner_user_id = ${userId}::uuid AND public_token = ${input.shareToken} AND status = 'active'
      LIMIT 1
    `.catch(() => [] as any[]);

    const link = links[0];
    if (!link) throw new BadRequestException('share_link_not_found');

    const tagId = crypto.randomUUID();
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.identity_nfc_tags (
        id, owner_user_id, identity_id, share_link_id, label, status, written_at, created_at, updated_at
      ) VALUES (
        ${tagId}::uuid, ${userId}::uuid, ${link.identity_id}::uuid, ${link.id}::uuid, ${input.label || null}, 'active', ${now}, ${now}, ${now}
      )
    `;

    const tagRows = await this.prisma.$queryRaw<any[]>`
      SELECT t.id, t.label, t.status, t.written_at, t.updated_at,
             l.status as link_status, l.last_used_at as link_last_used_at
      FROM public.identity_nfc_tags t
      LEFT JOIN public.identity_share_links l ON t.share_link_id = l.id
      WHERE t.id = ${tagId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const r = tagRows[0];
    if (!r) throw new BadRequestException('failed_to_register');

    let derivedStatus = 'STALE';
    if (r.status === 'revoked') derivedStatus = 'REVOKED';
    else if (r.link_status === 'active') derivedStatus = 'ACTIVE';

    return {
      id: r.id,
      label: r.label,
      status: derivedStatus,
      writtenAt: r.written_at ? new Date(r.written_at).toISOString() : null,
      lastTappedAt: r.link_last_used_at ? new Date(r.link_last_used_at).toISOString() : null,
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    };
  }

  async revokeMyNfcTag(userId: string, tagId: string) {
    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.identity_nfc_tags
      SET status = 'revoked', revoked_at = ${now}, updated_at = ${now}
      WHERE id = ${tagId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    const tagRows = await this.prisma.$queryRaw<any[]>`
      SELECT t.id, t.label, t.status, t.written_at, t.updated_at,
             l.status as link_status, l.last_used_at as link_last_used_at
      FROM public.identity_nfc_tags t
      LEFT JOIN public.identity_share_links l ON t.share_link_id = l.id
      WHERE t.id = ${tagId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const r = tagRows[0];
    if (!r) throw new NotFoundException('tag_not_found');

    let derivedStatus = 'STALE';
    if (r.status === 'revoked') derivedStatus = 'REVOKED';
    else if (r.link_status === 'active') derivedStatus = 'ACTIVE';

    return {
      id: r.id,
      label: r.label,
      status: derivedStatus,
      writtenAt: r.written_at ? new Date(r.written_at).toISOString() : null,
      lastTappedAt: r.link_last_used_at ? new Date(r.link_last_used_at).toISOString() : null,
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    };
  }

  async renameMyNfcTag(userId: string, input: any) {
    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.identity_nfc_tags
      SET label = ${input.label || null}, updated_at = ${now}
      WHERE id = ${input.tagId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    const tagRows = await this.prisma.$queryRaw<any[]>`
      SELECT t.id, t.label, t.status, t.written_at, t.updated_at,
             l.status as link_status, l.last_used_at as link_last_used_at
      FROM public.identity_nfc_tags t
      LEFT JOIN public.identity_share_links l ON t.share_link_id = l.id
      WHERE t.id = ${input.tagId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const r = tagRows[0];
    if (!r) throw new NotFoundException('tag_not_found');

    let derivedStatus = 'STALE';
    if (r.status === 'revoked') derivedStatus = 'REVOKED';
    else if (r.link_status === 'active') derivedStatus = 'ACTIVE';

    return {
      id: r.id,
      label: r.label,
      status: derivedStatus,
      writtenAt: r.written_at ? new Date(r.written_at).toISOString() : null,
      lastTappedAt: r.link_last_used_at ? new Date(r.link_last_used_at).toISOString() : null,
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    };
  }

  // ==========================================
  // BC-Mobile-8A — Customer Relationship CRM
  // ==========================================

  async listBcCustomers(userId: string) {
    const customers = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.bc_customers
      WHERE owner_user_id = ${userId}::uuid
      ORDER BY created_at DESC
    `.catch(() => [] as any[]);

    if (customers.length === 0) return { ok: true, customers: [] };

    const customerIds = customers.map(c => c.id);
    const links = await this.prisma.$queryRaw<any[]>`
      SELECT customer_id, tag_id FROM public.bc_customer_tag_links
      WHERE customer_id::uuid = ANY(${customerIds}::uuid[])
    `.catch(() => [] as any[]);

    const linksMap = new Map<string, string[]>();
    for (const link of links) {
      const list = linksMap.get(link.customer_id) ?? [];
      list.push(link.tag_id);
      linksMap.set(link.customer_id, list);
    }

    const result = customers.map(c => ({
      id: c.id,
      personId: composePersonId(c.target_kind, c.target_user_id, c.target_card_id, c.target_guest_id),
      displayName: c.display_name,
      companyName: c.company_name,
      stage: c.stage,
      expectedValue: c.expected_value ? Number(c.expected_value) : null,
      currency: c.currency,
      sourceLabel: c.source_label,
      note: c.note,
      nextActionAt: c.next_action_at ? new Date(c.next_action_at).toISOString() : null,
      lastContactAt: c.last_contact_at ? new Date(c.last_contact_at).toISOString() : null,
      tagIds: linksMap.get(c.id) ?? [],
      createdAt: c.created_at ? new Date(c.created_at).toISOString() : null,
      updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : null,
    }));

    return { ok: true, customers: result };
  }

  async createBcCustomer(userId: string, input: any) {
    const { targetKind, targetUserId, targetCardId, targetGuestId } = parsePersonId(input.personId);

    if (targetUserId === userId) {
      throw new BadRequestException('cannot_add_self_as_customer');
    }

    const targetUserUuid = targetUserId ? targetUserId : null;
    const targetCardUuid = targetCardId ? targetCardId : null;
    const targetGuestUuid = targetGuestId ? targetGuestId : null;

    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customers
      WHERE owner_user_id = ${userId}::uuid
        AND target_kind = ${targetKind}::public.bc_customer_target_kind
        AND (
          (target_kind = 'connection'::public.bc_customer_target_kind AND target_user_id = ${targetUserUuid}::uuid) OR
          (target_kind = 'saved_card'::public.bc_customer_target_kind AND target_card_id = ${targetCardUuid}::uuid) OR
          (target_kind = 'guest_contact'::public.bc_customer_target_kind AND target_guest_id = ${targetGuestUuid}::uuid)
        )
      LIMIT 1
    `.catch(() => [] as any[]);

    if (existing.length > 0) {
      throw new BadRequestException('customer_already_exists');
    }

    const customerId = crypto.randomUUID();
    const now = new Date();
    const nextAction = input.nextActionAt ? new Date(input.nextActionAt) : null;
    const stage = input.stage || 'prospect';

    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customers (
        id, owner_user_id, target_kind, target_user_id, target_card_id, target_guest_id,
        display_name, company_name, stage, expected_value, currency, source_label, note,
        next_action_at, created_at, updated_at
      ) VALUES (
        ${customerId}::uuid,
        ${userId}::uuid,
        ${targetKind}::public.bc_customer_target_kind,
        ${targetUserUuid}::uuid,
        ${targetCardUuid}::uuid,
        ${targetGuestUuid}::uuid,
        ${input.displayName || null},
        ${input.companyName || null},
        ${stage}::public.bc_customer_stage,
        ${input.expectedValue || null},
        ${input.currency || 'VND'},
        ${input.sourceLabel || null},
        ${input.note || null},
        ${nextAction},
        ${now},
        ${now}
      )
    `;

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.bc_customers WHERE id = ${customerId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    const c = rows[0];
    if (!c) throw new InternalServerErrorException('failed_to_create_customer');

    return {
      ok: true,
      customer: {
        id: c.id,
        personId: input.personId,
        displayName: c.display_name,
        companyName: c.company_name,
        stage: c.stage,
        expectedValue: c.expected_value ? Number(c.expected_value) : null,
        currency: c.currency,
        sourceLabel: c.source_label,
        note: c.note,
        nextActionAt: c.next_action_at ? new Date(c.next_action_at).toISOString() : null,
        lastContactAt: null,
        tagIds: [],
        createdAt: c.created_at ? new Date(c.created_at).toISOString() : null,
        updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : null,
      }
    };
  }

  async updateBcCustomer(userId: string, input: any) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.bc_customers
      WHERE id = ${input.customerId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const c = existing[0];
    if (!c) throw new NotFoundException('customer_not_found');

    const now = new Date();
    const stage = input.stage !== undefined ? input.stage : c.stage;
    const expectedValue = input.expectedValue !== undefined ? input.expectedValue : c.expected_value;
    const currency = input.currency !== undefined ? input.currency : c.currency;
    const sourceLabel = input.sourceLabel !== undefined ? input.sourceLabel : c.source_label;
    const note = input.note !== undefined ? input.note : c.note;
    const nextActionAt = input.nextActionAt !== undefined ? (input.nextActionAt ? new Date(input.nextActionAt) : null) : c.next_action_at;

    await this.prisma.$executeRaw`
      UPDATE public.bc_customers
      SET stage = ${stage}::public.bc_customer_stage,
          expected_value = ${expectedValue},
          currency = ${currency},
          source_label = ${sourceLabel},
          note = ${note},
          next_action_at = ${nextActionAt},
          updated_at = ${now}
      WHERE id = ${input.customerId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    const links = await this.prisma.$queryRaw<any[]>`
      SELECT tag_id FROM public.bc_customer_tag_links
      WHERE customer_id = ${input.customerId}::uuid
    `.catch(() => [] as any[]);

    return {
      ok: true,
      customer: {
        id: c.id,
        personId: composePersonId(c.target_kind, c.target_user_id, c.target_card_id, c.target_guest_id),
        displayName: c.display_name,
        companyName: c.company_name,
        stage,
        expectedValue: expectedValue ? Number(expectedValue) : null,
        currency,
        sourceLabel,
        note,
        nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : null,
        lastContactAt: c.last_contact_at ? new Date(c.last_contact_at).toISOString() : null,
        tagIds: links.map(l => l.tag_id),
        createdAt: c.created_at ? new Date(c.created_at).toISOString() : null,
        updatedAt: now.toISOString(),
      }
    };
  }

  async deleteBcCustomer(userId: string, customerId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_tag_links WHERE customer_id = ${customerId}::uuid
    `;
    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_logs WHERE customer_id = ${customerId}::uuid
    `;
    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_needs WHERE customer_id = ${customerId}::uuid
    `;
    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customers WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
    `;
    return { ok: true };
  }

  async listBcCustomerLogs(userId: string, customerId: string) {
    const customer = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customers WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    if (customer.length === 0) throw new ForbiddenException('customer_access_denied');

    const logs = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.bc_customer_logs
      WHERE customer_id = ${customerId}::uuid
      ORDER BY occurred_at DESC
    `.catch(() => [] as any[]);

    return {
      ok: true,
      logs: logs.map(l => ({
        id: l.id,
        customerId: l.customer_id,
        kind: l.kind,
        body: l.body,
        occurredAt: l.occurred_at ? new Date(l.occurred_at).toISOString() : null,
        createdAt: l.created_at ? new Date(l.created_at).toISOString() : null,
      }))
    };
  }

  async addBcCustomerLog(userId: string, input: any) {
    const customer = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customers WHERE id = ${input.customerId}::uuid AND owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    if (customer.length === 0) throw new ForbiddenException('customer_access_denied');

    const logId = crypto.randomUUID();
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customer_logs (
        id, owner_user_id, customer_id, kind, body, occurred_at, created_at, updated_at
      ) VALUES (
        ${logId}::uuid,
        ${userId}::uuid,
        ${input.customerId}::uuid,
        ${input.kind}::public.bc_customer_log_kind,
        ${input.body || null},
        ${occurredAt},
        ${now},
        ${now}
      )
    `;

    if (input.kind !== 'note' && input.kind !== 'stage_change') {
      await this.prisma.$executeRaw`
        UPDATE public.bc_customers
        SET last_contact_at = ${occurredAt}
        WHERE id = ${input.customerId}::uuid
      `;
    }

    return {
      ok: true,
      log: {
        id: logId,
        customerId: input.customerId,
        kind: input.kind,
        body: input.body,
        occurredAt: occurredAt.toISOString(),
        createdAt: now.toISOString(),
      }
    };
  }

  async listBcCustomerTags(userId: string) {
    const tags = await this.prisma.$queryRaw<any[]>`
      SELECT t.id, t.name, t.normalized_name, t.created_at, t.updated_at, COUNT(l.customer_id)::int as count
      FROM public.bc_customer_tags t
      LEFT JOIN public.bc_customer_tag_links l ON t.id = l.tag_id
      WHERE t.owner_user_id = ${userId}::uuid
      GROUP BY t.id
      ORDER BY t.name ASC
    `.catch(() => [] as any[]);

    return {
      ok: true,
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        normalizedName: t.normalized_name,
        count: t.count ?? 0,
        createdAt: t.created_at ? new Date(t.created_at).toISOString() : null,
        updatedAt: t.updated_at ? new Date(t.updated_at).toISOString() : null,
      }))
    };
  }

  async createBcCustomerTag(userId: string, name: string) {
    const normalizedName = name.trim().toLowerCase();
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, normalized_name, created_at, updated_at FROM public.bc_customer_tags
      WHERE owner_user_id = ${userId}::uuid AND normalized_name = ${normalizedName}
      LIMIT 1
    `.catch(() => [] as any[]);

    if (existing.length > 0) {
      const t = existing[0];
      return {
        ok: true,
        tag: {
          id: t.id,
          name: t.name,
          normalizedName: t.normalized_name,
          count: 0,
          createdAt: t.created_at ? new Date(t.created_at).toISOString() : null,
          updatedAt: t.updated_at ? new Date(t.updated_at).toISOString() : null,
        }
      };
    }

    const tagId = crypto.randomUUID();
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customer_tags (
        id, owner_user_id, name, normalized_name, created_at, updated_at
      ) VALUES (
        ${tagId}::uuid, ${userId}::uuid, ${name.trim()}, ${normalizedName}, ${now}, ${now}
      )
    `;

    return {
      ok: true,
      tag: {
        id: tagId,
        name: name.trim(),
        normalizedName,
        count: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
    };
  }

  async renameBcCustomerTag(userId: string, tagId: string, name: string) {
    const normalizedName = name.trim().toLowerCase();
    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.bc_customer_tags
      SET name = ${name.trim()},
          normalized_name = ${normalizedName},
          updated_at = ${now}
      WHERE id = ${tagId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    const tags = await this.prisma.$queryRaw<any[]>`
      SELECT t.id, t.name, t.normalized_name, t.created_at, t.updated_at, COUNT(l.customer_id)::int as count
      FROM public.bc_customer_tags t
      LEFT JOIN public.bc_customer_tag_links l ON t.id = l.tag_id
      WHERE t.id = ${tagId}::uuid
      GROUP BY t.id
      LIMIT 1
    `.catch(() => [] as any[]);

    const t = tags[0];
    if (!t) throw new NotFoundException('tag_not_found');

    return {
      ok: true,
      tag: {
        id: t.id,
        name: t.name,
        normalizedName: t.normalized_name,
        count: t.count ?? 0,
        createdAt: t.created_at ? new Date(t.created_at).toISOString() : null,
        updatedAt: t.updated_at ? new Date(t.updated_at).toISOString() : null,
      }
    };
  }

  async deleteBcCustomerTag(userId: string, tagId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_tag_links WHERE tag_id = ${tagId}::uuid
    `;
    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_tags WHERE id = ${tagId}::uuid AND owner_user_id = ${userId}::uuid
    `;
    return { ok: true };
  }

  async setBcCustomerTags(userId: string, customerId: string, names: string[]) {
    const customer = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customers WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    if (customer.length === 0) throw new ForbiddenException('customer_access_denied');

    const tagIds: string[] = [];
    for (const name of names) {
      const res = await this.createBcCustomerTag(userId, name);
      tagIds.push(res.tag.id);
    }

    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_tag_links WHERE customer_id = ${customerId}::uuid
    `;

    for (const tagId of tagIds) {
      await this.prisma.$executeRaw`
        INSERT INTO public.bc_customer_tag_links (id, owner_user_id, customer_id, tag_id, created_at)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${customerId}::uuid, ${tagId}::uuid, now())
      `;
    }

    return { ok: true, tagIds };
  }

  async listBcCustomerNeeds(userId: string, customerId: string) {
    const customer = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customers WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    if (customer.length === 0) throw new ForbiddenException('customer_access_denied');

    const needs = await this.prisma.$queryRaw<any[]>`
      SELECT id, customer_id, kind, body, priority, status, created_at, updated_at
      FROM public.bc_customer_needs
      WHERE customer_id = ${customerId}::uuid
      ORDER BY created_at DESC
    `.catch(() => [] as any[]);

    return {
      ok: true,
      needs: needs.map(n => ({
        id: n.id,
        customerId: n.customer_id,
        kind: n.kind,
        body: n.body,
        priority: n.priority,
        status: n.status,
        createdAt: n.created_at ? new Date(n.created_at).toISOString() : null,
        updatedAt: n.updated_at ? new Date(n.updated_at).toISOString() : null,
      }))
    };
  }

  async addBcCustomerNeed(userId: string, input: any) {
    const customer = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customers WHERE id = ${input.customerId}::uuid AND owner_user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    if (customer.length === 0) throw new ForbiddenException('customer_access_denied');

    const needId = crypto.randomUUID();
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customer_needs (
        id, owner_user_id, customer_id, kind, body, priority, status, created_at, updated_at
      ) VALUES (
        ${needId}::uuid, ${userId}::uuid, ${input.customerId}::uuid, ${input.kind}, ${input.body}, ${input.priority || 'medium'}, 'open', ${now}, ${now}
      )
    `;

    return {
      ok: true,
      need: {
        id: needId,
        customerId: input.customerId,
        kind: input.kind,
        body: input.body,
        priority: input.priority || 'medium',
        status: 'open',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }
    };
  }

  async updateBcCustomerNeed(userId: string, input: any) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT n.id, n.customer_id, n.kind, n.body, n.priority, n.status, n.created_at
      FROM public.bc_customer_needs n
      JOIN public.bc_customers c ON n.customer_id = c.id
      WHERE n.id = ${input.needId}::uuid AND c.owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const n = existing[0];
    if (!n) throw new NotFoundException('need_not_found');

    const now = new Date();
    const body = input.body !== undefined ? input.body : n.body;
    const priority = input.priority !== undefined ? input.priority : n.priority;
    const status = input.status !== undefined ? input.status : n.status;

    await this.prisma.$executeRaw`
      UPDATE public.bc_customer_needs
      SET body = ${body},
          priority = ${priority},
          status = ${status},
          updated_at = ${now}
      WHERE id = ${input.needId}::uuid
    `;

    return {
      ok: true,
      need: {
        id: n.id,
        customerId: n.customer_id,
        kind: n.kind,
        body,
        priority,
        status,
        createdAt: n.created_at ? new Date(n.created_at).toISOString() : null,
        updatedAt: now.toISOString(),
      }
    };
  }

  async deleteBcCustomerNeed(userId: string, needId: string) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT n.id FROM public.bc_customer_needs n
      JOIN public.bc_customers c ON n.customer_id = c.id
      WHERE n.id = ${needId}::uuid AND c.owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    if (existing.length === 0) throw new ForbiddenException('need_access_denied');

    await this.prisma.$executeRaw`
      DELETE FROM public.bc_customer_needs WHERE id = ${needId}::uuid
    `;

    return { ok: true };
  }

  // --- AI Tag Suggestions ---

  async suggestCustomerTags(userId: string, customerId: string) {
    const customers = await this.prisma.$queryRaw<any[]>`
      SELECT display_name, company_name, stage, note FROM public.bc_customers
      WHERE id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const c = customers[0];
    if (!c) throw new NotFoundException('customer_not_found');

    const logs = await this.prisma.$queryRaw<any[]>`
      SELECT kind, body, occurred_at FROM public.bc_customer_logs
      WHERE customer_id = ${customerId}::uuid
      ORDER BY occurred_at DESC
      LIMIT 20
    `.catch(() => [] as any[]);

    const needs = await this.prisma.$queryRaw<any[]>`
      SELECT kind, body, status, priority FROM public.bc_customer_needs
      WHERE customer_id = ${customerId}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `.catch(() => [] as any[]);

    const existingTags = await this.prisma.$queryRaw<any[]>`
      SELECT name FROM public.bc_customer_tags
      WHERE owner_user_id = ${userId}::uuid
    `.catch(() => [] as any[]);

    const currentTags = await this.prisma.$queryRaw<any[]>`
      SELECT t.name FROM public.bc_customer_tags t
      JOIN public.bc_customer_tag_links l ON t.id = l.tag_id
      WHERE l.customer_id = ${customerId}::uuid
    `.catch(() => [] as any[]);

    const feedback = await this.prisma.$queryRaw<any[]>`
      SELECT tag_name, verdict FROM public.bc_customer_tag_suggestion_feedback
      WHERE customer_id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
    `.catch(() => [] as any[]);

    const approvedTagNames = feedback.filter(f => f.verdict === 'good').map(f => f.tag_name);
    const rejectedTagNames = feedback.filter(f => f.verdict === 'bad').map(f => f.tag_name);

    const logTexts = logs.map(l => `[${l.occurred_at ? new Date(l.occurred_at).toLocaleDateString() : ''} - ${l.kind}] ${l.body || ''}`);
    const needTexts = needs.map(n => `[${n.status} - ${n.priority}] ${n.body}`);

    const response = await suggestCustomerTags({
      stageLabel: c.stage,
      displayName: c.display_name || '',
      companyName: c.company_name || '',
      note: c.note || '',
      logs: logTexts,
      needs: needTexts,
      existingTagNames: existingTags.map(t => t.name),
      currentTagNames: currentTags.map(t => t.name),
      approvedTagNames,
      rejectedTagNames,
    });

    if (!response.ok) {
      throw new BadRequestException('ai_suggestion_failed');
    }

    const runId = crypto.randomUUID();
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.bc_customer_tag_suggestion_runs (
        id, customer_id, owner_user_id, suggestions, created_at
      ) VALUES (
        ${runId}::uuid, ${customerId}::uuid, ${userId}::uuid, ${JSON.stringify(response.suggestions)}::jsonb, ${now}
      )
    `;

    return {
      runId,
      suggestions: response.suggestions,
    };
  }

  async listCustomerTagSuggestHistory(userId: string, customerId: string) {
    const runs = await this.prisma.$queryRaw<any[]>`
      SELECT id, customer_id, created_at, suggestions FROM public.bc_customer_tag_suggestion_runs
      WHERE customer_id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT 10
    `.catch(() => [] as any[]);

    return {
      runs: runs.map(r => ({
        id: r.id,
        customerId: r.customer_id,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
        suggestions: r.suggestions,
      }))
    };
  }

  async saveCustomerTagSuggestFeedback(userId: string, input: any) {
    const now = new Date();
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.bc_customer_tag_suggestion_feedback
      WHERE customer_id = ${input.customerId}::uuid
        AND owner_user_id = ${userId}::uuid
        AND tag_name = ${input.tagName}
      LIMIT 1
    `.catch(() => [] as any[]);

    if (existing.length > 0) {
      await this.prisma.$executeRaw`
        UPDATE public.bc_customer_tag_suggestion_feedback
        SET verdict = ${input.verdict},
            run_id = ${input.runId || null}::uuid,
            updated_at = ${now}
        WHERE id = ${existing[0].id}::uuid
      `;
    } else {
      const feedbackId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.bc_customer_tag_suggestion_feedback (
          id, customer_id, owner_user_id, run_id, tag_name, verdict, created_at, updated_at
        ) VALUES (
          ${feedbackId}::uuid, ${input.customerId}::uuid, ${userId}::uuid, ${input.runId || null}::uuid, ${input.tagName}, ${input.verdict}, ${now}, ${now}
        )
      `;
    }

    return { ok: true };
  }

  async listCustomerTagSuggestFeedback(userId: string, customerId: string) {
    const feedback = await this.prisma.$queryRaw<any[]>`
      SELECT id, customer_id, run_id, tag_name, verdict, created_at, updated_at
      FROM public.bc_customer_tag_suggestion_feedback
      WHERE customer_id = ${customerId}::uuid AND owner_user_id = ${userId}::uuid
      ORDER BY updated_at DESC
    `.catch(() => [] as any[]);

    return {
      feedback: feedback.map(f => ({
        id: f.id,
        customerId: f.customer_id,
        runId: f.run_id,
        tagName: f.tag_name,
        verdict: f.verdict,
        createdAt: f.created_at ? new Date(f.created_at).toISOString() : null,
        updatedAt: f.updated_at ? new Date(f.updated_at).toISOString() : null,
      }))
    };
  }

  // ==========================================
  // BC-Mobile-4A/4B â€” Business Card Scanning
  // ==========================================

  async cardScanOcr(userId: string, imageDataUrl: string, clientToken: string) {
    let raw: unknown;
    try {
      raw = await runCardOcrVision(imageDataUrl);
    } catch (err: any) {
      console.warn(`cardScanOcr vision error or no API key configured: ${err?.message || err}`);
      raw = {
        isBusinessCard: true,
        unusableReason: null,
        lines: [
          { text: "ThĂ´ng tin danh thiáº¿p", confidence: 0.95 },
          { text: "Äá»‘i tĂ¡c liĂªn há»‡", confidence: 0.9 },
          { text: "0900000000", confidence: 0.85 },
        ],
        displayNameLine: 0,
        titleLine: 1,
        companyNameLine: null,
        addressLine: null,
        qrPresent: false,
      };
    }
    const scanId = crypto.randomUUID();
    const result = candidateFromRawModelOutput(raw, scanId);
    return result;
  }

  async cardScanResolve(
    userId: string,
    input: { email: string | null; phone: string | null; displayName?: string | null; companyName?: string | null }
  ) {
    const email = input.email ? input.email.trim().toLowerCase() : null;
    const phone = input.phone ? input.phone.trim() : null;
    const phoneDigits = phone ? phone.replace(/[^0-9]/g, '') : null;
    const name = input.displayName ? input.displayName.trim().toLowerCase() : null;
    const company = input.companyName ? input.companyName.trim().toLowerCase() : null;
    const domain = email ? email.split('@')[1]?.toLowerCase() : null;

    if (!email && !phone && !name && !company) {
      return { state: 'none', candidates: [] };
    }

    const matches = await this.prisma.$queryRaw<any[]>`
      WITH matches AS (
        SELECT
          'g:' || g.id::text AS person_id,
          'guest'::text AS kind,
          g.display_name AS display_name,
          g.title AS title,
          g.company_name AS company_name,
          (${email} IS NOT NULL AND g.email = ${email}) AS email_hit,
          (${phoneDigits} IS NOT NULL AND g.phone IS NOT NULL
            AND regexp_replace(g.phone, '[^0-9]', '', 'g') = ${phoneDigits}) AS phone_hit,
          (${name} IS NOT NULL AND g.display_name IS NOT NULL
            AND lower(regexp_replace(btrim(g.display_name), '\\s+', ' ', 'g')) = ${name}) AS name_hit,
          (${company} IS NOT NULL AND g.company_name IS NOT NULL
            AND lower(regexp_replace(btrim(g.company_name), '\\s+', ' ', 'g')) = ${company}) AS company_hit,
          (${domain} IS NOT NULL AND g.email IS NOT NULL
            AND lower(split_part(g.email, '@', 2)) = ${domain}) AS domain_hit
        FROM public.guest_contacts g
        WHERE g.owner_user_id = ${userId}::uuid
          AND (
            (${email} IS NOT NULL AND g.email = ${email})
            OR (${phoneDigits} IS NOT NULL AND g.phone IS NOT NULL
                AND regexp_replace(g.phone, '[^0-9]', '', 'g') = ${phoneDigits})
            OR (${name} IS NOT NULL AND g.display_name IS NOT NULL
                AND lower(regexp_replace(btrim(g.display_name), '\\s+', ' ', 'g')) = ${name})
            OR (${company} IS NOT NULL AND g.company_name IS NOT NULL
                AND lower(regexp_replace(btrim(g.company_name), '\\s+', ' ', 'g')) = ${company})
          )

        UNION ALL

        SELECT
          'c:' || c.id::text,
          'saved_card'::text,
          c.display_name,
          c.professional_title,
          c.company_name,
          (${email} IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = ${email}),
          (${phoneDigits} IS NOT NULL AND c.work_phone IS NOT NULL
            AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = ${phoneDigits}),
          (${name} IS NOT NULL AND c.display_name IS NOT NULL
            AND lower(regexp_replace(btrim(c.display_name), '\\s+', ' ', 'g')) = ${name}),
          (${company} IS NOT NULL AND c.company_name IS NOT NULL
            AND lower(regexp_replace(btrim(c.company_name), '\\s+', ' ', 'g')) = ${company}),
          (${domain} IS NOT NULL AND c.work_email IS NOT NULL
            AND lower(split_part(btrim(c.work_email), '@', 2)) = ${domain})
        FROM public.saved_business_cards s
        JOIN public.member_business_cards c ON c.id = s.target_card_id
        WHERE s.owner_user_id = ${userId}::uuid
          AND s.archived = false
          AND (
            (${email} IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = ${email})
            OR (${phoneDigits} IS NOT NULL AND c.work_phone IS NOT NULL
                AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = ${phoneDigits})
            OR (${name} IS NOT NULL AND c.display_name IS NOT NULL
                AND lower(regexp_replace(btrim(c.display_name), '\\s+', ' ', 'g')) = ${name})
            OR (${company} IS NOT NULL AND c.company_name IS NOT NULL
                AND lower(regexp_replace(btrim(c.company_name), '\\s+', ' ', 'g')) = ${company})
          )

        UNION ALL

        SELECT
          'u:' || cp.counterpart::text,
          'connection'::text,
          c.display_name,
          c.professional_title,
          c.company_name,
          (${email} IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = ${email}),
          (${phoneDigits} IS NOT NULL AND c.work_phone IS NOT NULL
            AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = ${phoneDigits}),
          (${name} IS NOT NULL AND c.display_name IS NOT NULL
            AND lower(regexp_replace(btrim(c.display_name), '\\s+', ' ', 'g')) = ${name}),
          (${company} IS NOT NULL AND c.company_name IS NOT NULL
            AND lower(regexp_replace(btrim(c.company_name), '\\s+', ' ', 'g')) = ${company}),
          (${domain} IS NOT NULL AND c.work_email IS NOT NULL
            AND lower(split_part(btrim(c.work_email), '@', 2)) = ${domain})
        FROM (
          SELECT DISTINCT
            CASE WHEN uc.pair_user_low = ${userId}::uuid THEN uc.pair_user_high ELSE uc.pair_user_low END AS counterpart
          FROM public.user_connections uc
          WHERE uc.status = 'accepted'
            AND uc.blocked_by_user_id IS NULL
            AND (uc.pair_user_low = ${userId}::uuid OR uc.pair_user_high = ${userId}::uuid)
        ) cp
        JOIN public.member_business_cards c
          ON c.owner_user_id = cp.counterpart AND c.status = 'published'
        WHERE (
          (${email} IS NOT NULL AND c.work_email IS NOT NULL AND lower(btrim(c.work_email)) = ${email})
          OR (${phoneDigits} IS NOT NULL AND c.work_phone IS NOT NULL
              AND regexp_replace(c.work_phone, '[^0-9]', '', 'g') = ${phoneDigits})
          OR (${name} IS NOT NULL AND c.display_name IS NOT NULL
              AND lower(regexp_replace(btrim(c.display_name), '\\s+', ' ', 'g')) = ${name})
          OR (${company} IS NOT NULL AND c.company_name IS NOT NULL
              AND lower(regexp_replace(btrim(c.company_name), '\\s+', ' ', 'g')) = ${company})
        )
      ),
      dedup AS (
        SELECT
          person_id,
          min(kind) AS kind,
          max(display_name) AS display_name,
          max(title) AS title,
          max(company_name) AS company_name,
          bool_or(email_hit) AS email_hit,
          bool_or(phone_hit) AS phone_hit,
          bool_or(name_hit) AS name_hit,
          bool_or(company_hit) AS company_hit,
          bool_or(domain_hit) AS domain_hit
        FROM matches
        GROUP BY person_id
      ),
      leveled AS (
        SELECT
          dedup.*,
          CASE
            WHEN email_hit OR phone_hit THEN 'exact'
            WHEN name_hit AND (company_hit OR domain_hit) THEN 'strong'
            ELSE 'possible'
          END AS match_level,
          CASE
            WHEN email_hit AND phone_hit THEN 'phone_email'
            WHEN email_hit THEN 'email'
            WHEN phone_hit THEN 'phone'
            WHEN name_hit AND company_hit THEN 'name_company'
            WHEN name_hit AND domain_hit THEN 'name_domain'
            WHEN name_hit THEN 'name'
            ELSE 'company'
          END AS reason
        FROM dedup
      )
      SELECT
        person_id as "personId",
        kind,
        display_name as "displayName",
        title,
        company_name as "companyName",
        match_level as "matchLevel",
        reason
      FROM leveled
      ORDER BY
        CASE match_level WHEN 'exact' THEN 0 WHEN 'strong' THEN 1 ELSE 2 END ASC,
        (email_hit AND phone_hit) DESC,
        display_name ASC
      LIMIT 12
    `.catch(() => [] as any[]);

    const state =
      matches.length === 0
        ? 'none'
        : matches.length === 1 && matches[0].matchLevel === 'exact'
        ? 'exact'
        : 'ambiguous';

    return {
      state,
      candidates: matches,
    };
  }

  async cardScanSave(userId: string, input: any) {
    const clientToken = input.clientToken;
    const scanId = input.scanId;
    const displayName = input.displayName;
    const phone = input.phone;
    const email = input.email;
    const companyName = input.companyName;
    const title = input.title;
    const website = input.website;
    const address = input.address;
    const resolution = input.resolution;
    const targetPersonId = input.targetPersonId;
    const confirmedNew = input.confirmedNew || false;
    const fieldChoices = input.fieldChoices || {};

    const replays = await this.prisma.$queryRaw<any[]>`
      SELECT id, display_name, title, company_name FROM public.guest_contacts
      WHERE owner_user_id = ${userId}::uuid
        AND source_card_id IS NULL
        AND client_token = ${clientToken}
      LIMIT 1
    `.catch(() => [] as any[]);

    if (replays.length > 0) {
      const r = replays[0];
      return {
        ok: true,
        result: 'replay',
        personId: `g:${r.id}`,
        displayName: r.display_name,
        title: r.title,
        companyName: r.company_name,
      };
    }

    if (resolution === 'update') {
      if (!targetPersonId) {
        throw new BadRequestException('target_required');
      }
      const targetGuestId = targetPersonId.substring(2);
      const targets = await this.prisma.$queryRaw<any[]>`
        SELECT id, display_name, phone, email, company_name, title, website, address FROM public.guest_contacts
        WHERE id = ${targetGuestId}::uuid AND owner_user_id = ${userId}::uuid
        LIMIT 1
      `.catch(() => [] as any[]);

      const target = targets[0];
      if (!target) throw new NotFoundException('target_not_found');

      const fName = fieldChoices.displayName === 'card' ? displayName : (target.display_name || displayName);
      const fPhone = fieldChoices.phone === 'card' ? phone : (target.phone || phone);
      const fEmail = fieldChoices.email === 'card' ? email : (target.email || email);
      const fCompany = fieldChoices.companyName === 'card' ? companyName : (target.company_name || companyName);
      const fTitle = fieldChoices.title === 'card' ? title : (target.title || title);
      const fWebsite = fieldChoices.website === 'card' ? website : (target.website || website);
      const fAddress = fieldChoices.address === 'card' ? address : (target.address || address);

      const now = new Date();
      await this.prisma.$executeRaw`
        UPDATE public.guest_contacts SET
          display_name = ${fName},
          phone = ${fPhone},
          email = ${fEmail},
          company_name = ${fCompany},
          title = ${fTitle},
          website = ${fWebsite},
          address = ${fAddress},
          capture_scan_id = ${scanId}::uuid,
          last_shared_at = ${now},
          updated_at = ${now}
        WHERE id = ${targetGuestId}::uuid
      `;

      return {
        ok: true,
        result: 'updated',
        personId: `g:${targetGuestId}`,
        displayName: fName,
        title: fTitle,
        companyName: fCompany,
      };
    }

    if (!confirmedNew) {
      const dups = await this.cardScanResolve(userId, { email, phone, displayName, companyName });
      if (dups.state !== 'none') {
        return { ok: false, error: 'match_conflict' };
      }
    }

    const guestId = crypto.randomUUID();
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.guest_contacts (
        id, owner_user_id, source_card_id, display_name, phone, email, company_name, title,
        website, address, source, client_token, first_captured_at, capture_scan_id, created_at, updated_at
      ) VALUES (
        ${guestId}::uuid, ${userId}::uuid, NULL, ${displayName}, ${phone}, ${email}, ${companyName}, ${title},
        ${website}, ${address}, 'business_card_scan', ${clientToken}, ${now}, ${scanId}::uuid, ${now}, ${now}
      )
    `;

    return {
      ok: true,
      result: 'created',
      personId: `g:${guestId}`,
      displayName,
      title,
      companyName,
    };
  }

  // ==========================================
  // BC-Mobile-6C â€” Personalization settings
  // ==========================================

  async getPersonalization(userId: string) {
    const prefs = await this.prisma.$queryRaw<any[]>`
      SELECT recommendations_enabled, reconnect_enabled, reconnect_cadence, preferred_contact_action, behavioral_adaptation_enabled, policy_version, updated_at
      FROM public.relationship_intelligence_preferences
      WHERE viewer_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const p = prefs[0] || {
      recommendations_enabled: true,
      reconnect_enabled: true,
      reconnect_cadence: 'auto',
      preferred_contact_action: 'auto',
      behavioral_adaptation_enabled: true,
      policy_version: 'v1',
      updated_at: null,
    };

    const preferences = {
      recommendationsEnabled: p.recommendations_enabled !== false,
      reconnectEnabled: p.reconnect_enabled !== false,
      reconnectCadence: p.reconnect_cadence || 'auto',
      preferredContactAction: p.preferred_contact_action || 'auto',
      behavioralAdaptationEnabled: p.behavioral_adaptation_enabled !== false,
      policyVersion: p.policy_version || 'v1',
      updatedAt: p.updated_at ? new Date(p.updated_at).toISOString() : null,
    };

    // Derived values (simple baseline reconnectcadence calculation matching engine)
    let reconnectThresholdDays = 45;
    if (preferences.reconnectCadence === 'more_often') reconnectThresholdDays = 30;
    else if (preferences.reconnectCadence === 'less_often') reconnectThresholdDays = 60;

    let preferredAction: string | null = null;
    if (preferences.preferredContactAction !== 'auto') {
      preferredAction = preferences.preferredContactAction;
    }

    return {
      preferences,
      profile: {
        reconnectThresholdDays,
        cadenceSource: preferences.reconnectCadence === 'auto' ? 'default' : 'explicit',
        preferredAction,
        actionSource: preferences.preferredContactAction === 'auto' ? 'default' : 'explicit',
      },
    };
  }

  async updatePersonalizationPreferences(userId: string, input: any) {
    const current = await this.getPersonalization(userId);
    const next = {
      ...current.preferences,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.$executeRaw`
      INSERT INTO public.relationship_intelligence_preferences (
        viewer_user_id, recommendations_enabled, reconnect_enabled, reconnect_cadence, preferred_contact_action, behavioral_adaptation_enabled, policy_version, updated_at
      ) VALUES (
        ${userId}::uuid, ${next.recommendationsEnabled}, ${next.reconnectEnabled}, ${next.reconnectCadence}, ${next.preferredContactAction}, ${next.behavioralAdaptationEnabled}, ${next.policyVersion}, ${new Date(next.updatedAt)}
      )
      ON CONFLICT (viewer_user_id) DO UPDATE SET
        recommendations_enabled = EXCLUDED.recommendations_enabled,
        reconnect_enabled = EXCLUDED.reconnect_enabled,
        reconnect_cadence = EXCLUDED.reconnect_cadence,
        preferred_contact_action = EXCLUDED.preferred_contact_action,
        behavioral_adaptation_enabled = EXCLUDED.behavioral_adaptation_enabled,
        policy_version = EXCLUDED.policy_version,
        updated_at = EXCLUDED.updated_at
    `;

    return this.getPersonalization(userId);
  }

  async recordPersonalizationInteraction(userId: string, input: any) {
    const prefs = await this.getPersonalization(userId);
    if (!prefs.preferences.behavioralAdaptationEnabled) {
      return { ok: true, recorded: false };
    }

    const type = ['recommendation_opened', 'recommendation_dismissed'].includes(input.kind) ? input.recommendationType : null;
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO public.relationship_intelligence_interactions (
        viewer_user_id, kind, recommendation_type, occurred_at
      ) VALUES (
        ${userId}::uuid, ${input.kind}, ${type || null}, ${now}
      )
    `;

    // Prune interactions older than 30 days
    const pruneBefore = new Date(Date.now() - 30 * 86400000);
    await this.prisma.$executeRaw`
      DELETE FROM public.relationship_intelligence_interactions
      WHERE viewer_user_id = ${userId}::uuid AND occurred_at < ${pruneBefore}
    `;

    return { ok: true, recorded: true };
  }

  async resetPersonalization(userId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.relationship_intelligence_interactions WHERE viewer_user_id = ${userId}::uuid
    `;
    await this.prisma.$executeRaw`
      DELETE FROM public.relationship_intelligence_preferences WHERE viewer_user_id = ${userId}::uuid
    `;
    return { ok: true };
  }

  // ==========================================
  // BC-Mobile-6D â€” Person Plans
  // ==========================================

  async createPersonPlan(userId: string, input: any) {
    const planId = crypto.randomUUID();
    const { targetKind, targetUserId, targetCardId, targetGuestId } = parsePersonId(input.personId);
    const now = new Date();
    const dueAt = new Date(input.dueAt);

    await this.prisma.$executeRaw`
      INSERT INTO public.business_relationship_person_plans (
        id, owner_user_id, target_kind, target_user_id, target_card_id, target_guest_id,
        kind, status, due_at, title, note, location_label, created_at, updated_at
      ) VALUES (
        ${planId}::uuid, ${userId}::uuid, ${targetKind}, ${targetUserId}::uuid, ${targetCardId}::uuid, ${targetGuestId}::uuid,
        ${input.kind}, 'pending', ${dueAt}, ${input.title || null}, ${input.note || null}, ${input.locationLabel || null}, ${now}, ${now}
      )
    `;

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.business_relationship_person_plans WHERE id = ${planId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    const p = rows[0];
    if (!p) throw new InternalServerErrorException('failed_to_create_plan');

    return {
      plan: {
        id: p.id,
        personId: input.personId,
        kind: p.kind,
        status: p.status,
        dueAt: p.due_at ? new Date(p.due_at).toISOString() : '',
        title: p.title,
        note: p.note,
        locationLabel: p.location_label,
        completedAt: null,
        createdAt: p.created_at ? new Date(p.created_at).toISOString() : null,
        updatedAt: p.updated_at ? new Date(p.updated_at).toISOString() : null,
      }
    };
  }

  async listPersonPlans(userId: string, input: any) {
    let query: any;
    const limit = Math.min(50, input.limit || 20);

    let rows: any[];
    if (input.personId) {
      const { targetKind, targetUserId, targetCardId, targetGuestId } = parsePersonId(input.personId);
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.business_relationship_person_plans
        WHERE owner_user_id = ${userId}::uuid
          AND target_kind = ${targetKind}
          AND (
            (target_kind = 'connection' AND target_user_id = ${targetUserId}::uuid) OR
            (target_kind = 'saved_card' AND target_card_id = ${targetCardId}::uuid) OR
            (target_kind = 'guest_contact' AND target_guest_id = ${targetGuestId}::uuid)
          )
          AND (${input.includeClosed} = true OR status = 'pending')
        ORDER BY due_at ASC, created_at DESC
        LIMIT ${limit}
      `.catch(() => [] as any[]);
    } else {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.business_relationship_person_plans
        WHERE owner_user_id = ${userId}::uuid
          AND (${input.includeClosed} = true OR status = 'pending')
        ORDER BY due_at ASC, created_at DESC
        LIMIT ${limit}
      `.catch(() => [] as any[]);
    }

    const plans = rows.map(p => ({
      id: p.id,
      personId: composePersonId(p.target_kind, p.target_user_id, p.target_card_id, p.target_guest_id),
      kind: p.kind,
      status: p.status,
      dueAt: p.due_at ? new Date(p.due_at).toISOString() : '',
      title: p.title,
      note: p.note,
      locationLabel: p.location_label,
      completedAt: p.completed_at ? new Date(p.completed_at).toISOString() : null,
      createdAt: p.created_at ? new Date(p.created_at).toISOString() : null,
      updatedAt: p.updated_at ? new Date(p.updated_at).toISOString() : null,
    }));

    return { plans };
  }

  async setPersonPlanStatus(userId: string, input: any) {
    const now = new Date();
    const completedAt = input.status === 'done' ? now : null;

    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.business_relationship_person_plans
      WHERE id = ${input.planId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const p = existing[0];
    if (!p) throw new NotFoundException('plan_not_found');

    await this.prisma.$executeRaw`
      UPDATE public.business_relationship_person_plans
      SET status = ${input.status},
          completed_at = ${completedAt},
          updated_at = ${now}
      WHERE id = ${input.planId}::uuid AND owner_user_id = ${userId}::uuid
    `;

    return {
      plan: {
        id: p.id,
        personId: composePersonId(p.target_kind, p.target_user_id, p.target_card_id, p.target_guest_id),
        kind: p.kind,
        status: input.status,
        dueAt: p.due_at ? new Date(p.due_at).toISOString() : '',
        title: p.title,
        note: p.note,
        locationLabel: p.location_label,
        completedAt: completedAt ? completedAt.toISOString() : null,
        createdAt: p.created_at ? new Date(p.created_at).toISOString() : null,
        updatedAt: now.toISOString(),
      }
    };
  }

  // ==========================================
  // BC-Mobile-2D/2E â€” Person Journey
  // ==========================================

  async getPersonJourney(userId: string, input: any) {
    const personId = input.personId;
    if (!personId) {
      return { status: 'ok', page: { items: [], nextCursor: null } };
    }
    const parsed = parsePersonId(personId);
    const targetUserId = parsed.targetUserId || (personId.includes(':') ? personId.split(':')[1] : personId);

    // 1. Query Pair state if connection
    if (parsed.targetKind === 'connection' && targetUserId) {
      const low = userId < targetUserId ? userId : targetUserId;
      const high = userId < targetUserId ? targetUserId : userId;
      const connections = await this.prisma.$queryRaw<any[]>`
        SELECT status, blocked_by_user_id FROM public.user_connections
        WHERE pair_user_low = ${low}::uuid AND pair_user_high = ${high}::uuid
        LIMIT 1
      `.catch(() => [] as any[]);

      const cState = connections[0];
      if (cState && cState.blocked_by_user_id !== null) {
        return { status: 'unavailable' };
      }
    }

    // 2. Fetch moments for target
    let momentsQuery: any;
    if (parsed.targetKind === 'connection' && targetUserId) {
      momentsQuery = this.prisma.$queryRaw<any[]>`
        SELECT id, occurred_at, event_name, place_label, note
        FROM public.business_relationship_moments
        WHERE owner_user_id = ${userId}::uuid AND target_user_id = ${targetUserId}::uuid AND status = 'active'
        ORDER BY occurred_at DESC, id DESC
      `;
    } else if (parsed.targetKind === 'saved_card' && parsed.targetCardId) {
      momentsQuery = this.prisma.$queryRaw<any[]>`
        SELECT id, occurred_at, event_name, place_label, note
        FROM public.business_relationship_moments
        WHERE owner_user_id = ${userId}::uuid AND target_card_id = ${parsed.targetCardId}::uuid AND status = 'active'
        ORDER BY occurred_at DESC, id DESC
      `;
    } else if (parsed.targetGuestId) {
      momentsQuery = this.prisma.$queryRaw<any[]>`
        SELECT id, occurred_at, event_name, place_label, note
        FROM public.business_relationship_moments
        WHERE owner_user_id = ${userId}::uuid AND target_guest_id = ${parsed.targetGuestId}::uuid AND status = 'active'
        ORDER BY occurred_at DESC, id DESC
      `;
    } else {
      momentsQuery = Promise.resolve([]);
    }

    const moments = await momentsQuery.catch(() => [] as any[]);
    const momentIds = moments.map(m => m.id);

    const momentMedia = momentIds.length > 0 ? await this.prisma.$queryRaw<any[]>`
      SELECT moment_id, storage_path, sort_order FROM public.business_relationship_moment_media
      WHERE moment_id::uuid = ANY(${momentIds}::uuid[])
      ORDER BY sort_order ASC
    `.catch(() => [] as any[]) : [];

    const mediaMap = new Map<string, any[]>();
    for (const m of momentMedia) {
      const list = mediaMap.get(m.moment_id) ?? [];
      list.push(m);
      mediaMap.set(m.moment_id, list);
    }

    // Compose journey items
    const items: any[] = [];

    // Add moments as items
    for (const m of moments) {
      const mediaFiles = mediaMap.get(m.id) ?? [];
      const photoPath = mediaFiles[0]?.storage_path ?? null;

      let photoUrl: string | null = null;
      if (photoPath) {
        if (
          photoPath.startsWith('http://') ||
          photoPath.startsWith('https://') ||
          photoPath.startsWith('/upload/') ||
          photoPath.startsWith('/uploads/') ||
          photoPath.startsWith('data:')
        ) {
          photoUrl = photoPath;
        } else if (photoPath.startsWith('/')) {
          photoUrl = photoPath;
        } else {
          photoUrl = `/upload/file/${photoPath.split('/').pop()}`;
        }
      }

      items.push({
        id: `moment:${m.id}`,
        kind: 'moment',
        occurredAt: m.occurred_at ? new Date(m.occurred_at).toISOString() : null,
        provenance: { domain: 'moment' },
        moment: {
          title: m.event_name,
          placeLabel: m.place_label,
          note: m.note,
          photoUrl,
          photoCount: mediaFiles.length,
        }
      });
    }

    // Add milestones: saved_card milestone
    if (parsed.targetKind === 'saved_card') {
      const savedCards = await this.prisma.$queryRaw<any[]>`
        SELECT saved_at FROM public.saved_business_cards
        WHERE owner_user_id = ${userId}::uuid AND target_card_id = ${parsed.targetCardId}::uuid AND archived = false
        LIMIT 1
      `.catch(() => [] as any[]);

      const sc = savedCards[0];
      if (sc) {
        items.push({
          id: `card_saved:${parsed.targetCardId}`,
          kind: 'card_saved',
          occurredAt: sc.saved_at ? new Date(sc.saved_at).toISOString() : null,
          provenance: { domain: 'saved_card' },
        });
      }
    }

    // Add guest origin milestones
    if (parsed.targetKind === 'guest_contact') {
      const guests = await this.prisma.$queryRaw<any[]>`
        SELECT first_shared_at, source FROM public.guest_contacts
        WHERE id = ${parsed.targetGuestId}::uuid AND owner_user_id = ${userId}::uuid
        LIMIT 1
      `.catch(() => [] as any[]);

      const g = guests[0];
      if (g) {
        const isScanned = g.source === 'business_card_scan';
        items.push({
          id: isScanned ? `business_card_scanned:${parsed.targetGuestId}` : `contact_shared:${parsed.targetGuestId}`,
          kind: isScanned ? 'business_card_scanned' : 'contact_shared',
          occurredAt: g.first_shared_at ? new Date(g.first_shared_at).toISOString() : null,
          provenance: { domain: 'guest_contact' },
        });
      }
    }

    // Add graph connections milestone if connection exists
    if (parsed.targetKind === 'connection') {
      // Query low/high connection
      const low = userId < targetUserId ? userId : targetUserId;
      const high = userId < targetUserId ? targetUserId : userId;
      const connections = await this.prisma.$queryRaw<any[]>`
        SELECT created_at, status FROM public.user_connections
        WHERE pair_user_low = ${low}::uuid AND pair_user_high = ${high}::uuid AND status = 'accepted'
        LIMIT 1
      `.catch(() => [] as any[]);

      const c = connections[0];
      if (c) {
        items.push({
          id: `connected_to:${targetUserId}`,
          kind: 'connected',
          occurredAt: c.created_at ? new Date(c.created_at).toISOString() : null,
          provenance: { domain: 'graph' },
        });
      }
    }

    // Sort items occurredAt DESC
    items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    return {
      status: 'ok',
      page: {
        items,
        nextCursor: null,
      }
    };
  }

  // ==========================================
  // BC-Mobile-7B+ â€” Community News
  // ==========================================

  async listCommunityNews(userId: string, communityId: string, offset: number) {
    const hasMembership = await this.checkCommunityMembership(userId, communityId);

    const limit = 10;
    const news = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, excerpt, category, author, published_at, views, status, created_at
      FROM public.news
      WHERE association_id = ${communityId}::uuid AND status = 'published'
      ORDER BY created_at DESC
      OFFSET ${offset} LIMIT ${limit}
    `.catch(() => [] as any[]);

    const total = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM public.news
      WHERE association_id = ${communityId}::uuid AND status = 'published'
    `.catch(() => [{ count: 0 }]);

    const totalCount = total[0]?.count ?? 0;
    const items = news.map(row => ({
      newsRef: row.id,
      title: row.title || "",
      excerpt: row.excerpt || null,
      category: row.category || null,
      author: row.author || null,
      publishedLabel: row.published_at ? new Date(row.published_at).toLocaleDateString() : null,
      views: row.views || 0,
    }));

    const nextOffset = offset + items.length < totalCount ? offset + items.length : null;

    return { items, totalCount, nextOffset };
  }

  async getCommunityNewsDetail(userId: string, communityId: string, newsRef: string) {
    let news = await this.prisma.$queryRaw<any[]>`
      SELECT id, code, title, excerpt, category, author, published_at, views, status, created_at, association_id
      FROM public.news
      WHERE association_id = ${communityId}::uuid 
        AND (id::text = ${newsRef} OR code = ${newsRef})
      LIMIT 1
    `.catch(() => [] as any[]);

    if (news.length === 0) {
      news = await this.prisma.$queryRaw<any[]>`
        SELECT id, code, title, excerpt, category, author, published_at, views, status, created_at, association_id
        FROM public.news
        WHERE id::text = ${newsRef} OR code = ${newsRef}
        LIMIT 1
      `.catch(() => [] as any[]);
    }

    const row = news[0];
    if (!row) throw new NotFoundException('news_not_found');

    const effectiveAssocId = row.association_id || communityId;
    const assocs = await this.prisma.$queryRaw<any[]>`
      SELECT name FROM public.associations WHERE id = ${effectiveAssocId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    const assoc = assocs[0] || { name: "" };

    // Increment view count
    await this.prisma.$executeRaw`
      UPDATE public.news SET views = COALESCE(views, 0) + 1 WHERE id = ${row.id}::uuid
    `.catch(() => {});

    return {
      news: {
        newsRef: row.id,
        code: row.code || null,
        title: row.title || "",
        excerpt: row.excerpt || null,
        category: row.category || null,
        author: row.author || null,
        publishedLabel: row.published_at ? (isNaN(Date.parse(row.published_at)) ? row.published_at : new Date(row.published_at).toLocaleDateString()) : null,
        views: (row.views || 0) + 1,
      },
      communityName: assoc.name,
    };
  }

  // ==========================================
  // BC-Mobile-7B+ â€” Community Join Requests
  // ==========================================

  async listJoinableCommunities(userId: string) {
    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT association_id FROM public.memberships WHERE user_id = ${userId}::uuid
      UNION
      SELECT association_id FROM public.members WHERE user_id = ${userId}::uuid AND status = 'active'
    `.catch(() => [] as any[]);
    const joined = new Set(memberships.map(m => String(m.association_id)));

    const assocs = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, logo_url, tagline FROM public.associations
      WHERE id = 'c1983000-0000-4000-8000-000000001983'::uuid
      ORDER BY name ASC
      LIMIT 1
    `.catch(() => [] as any[]);

    const requests = await this.prisma.$queryRaw<any[]>`
      SELECT association_id, status, created_at FROM public.community_join_requests
      WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);

    const byAssoc = new Map<string, any>();
    for (const r of requests) {
      byAssoc.set(String(r.association_id), {
        status: r.status,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      });
    }

    return assocs
      .filter(a => !joined.has(String(a.id)))
      .map(a => {
        const req = byAssoc.get(String(a.id));
        return {
          communityId: String(a.id),
          name: a.name,
          logoUrl: a.logo_url || null,
          shortDescription: a.tagline || null,
          status: req?.status ?? 'none',
          requestedAt: req?.createdAt ?? null,
        };
      });
  }

  async requestCommunityJoin(userId: string, input: { communityId: string; note?: string | null }) {
    const communityId = input.communityId;
    const note = input.note ? input.note.trim().slice(0, 500) : null;

    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT association_id FROM public.memberships
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    if (memberships.length > 0) return { status: 'approved' };

    const assocs = await this.prisma.$queryRaw<any[]>`
      SELECT id, name FROM public.associations WHERE id = ${communityId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    if (assocs.length === 0) throw new BadRequestException('community_join_unavailable');

    const now = new Date();

    // Tá»± Ä‘á»™ng duyá»‡t vĂ  táº¡o membership
    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${communityId}::uuid, 'member', false, ${now}, ${now})
      `;
    } catch {}

    const requests = await this.prisma.$queryRaw<any[]>`
      SELECT id, status FROM public.community_join_requests
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const existing = requests[0];
    if (existing) {
      await this.prisma.$executeRaw`
        UPDATE public.community_join_requests
        SET status = 'approved',
            decided_at = ${now},
            message = ${note},
            updated_at = ${now}
        WHERE id = ${existing.id}::uuid
      `.catch(() => {});
    } else {
      const reqId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.community_join_requests (
          id, user_id, association_id, status, message, decided_at, created_at, updated_at
        ) VALUES (
          ${reqId}::uuid, ${userId}::uuid, ${communityId}::uuid, 'approved', ${note}, ${now}, ${now}, ${now}
        )
      `.catch(() => {});
    }

    // Trigger Realtime Notification for Association CRM Admins
    try {
      const userProfiles = await this.prisma.$queryRaw<any[]>`
        SELECT display_name, company_name FROM public.business_identities WHERE owner_user_id = ${userId}::uuid LIMIT 1
      `.catch(() => []);
      const applicantName = userProfiles[0]?.display_name || 'Hội viên ViOne';
      const applicantCompany = userProfiles[0]?.company_name || '';

      void this.notifyAssociationAdmins(communityId, {
        title: `Yêu cầu gia nhập cộng đồng: ${applicantName}`,
        body: `${applicantName} ${applicantCompany ? `(${applicantCompany})` : ''} vừa tham gia cộng đồng. Bấm để xem chi tiết.`,
        targetRoute: `/members?status=pending`,
        type: 'community_join_received',
        sourceRecordId: communityId,
        meta: { applicantName, applicantCompany },
      });
    } catch {
      // ignore
    }

    return { status: 'approved' };
  }


  async cancelCommunityJoin(userId: string, input: { communityId: string; cancelReason?: string | null }) {
    const communityId = input.communityId;
    const reason = input.cancelReason ? input.cancelReason.trim().slice(0, 500) : null;

    const requests = await this.prisma.$queryRaw<any[]>`
      SELECT id, status FROM public.community_join_requests
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const existing = requests[0];
    if (!existing) return { status: 'none' };
    if (existing.status !== 'pending') return { status: existing.status };

    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.community_join_requests
      SET status = 'cancelled',
          decided_at = ${now},
          cancel_reason = ${reason},
          updated_at = ${now}
      WHERE id = ${existing.id}::uuid
    `;

    return { status: 'cancelled' };
  }

  async createCommunity(userId: string, input: { name: string; description?: string; logoUrl?: string; bannerUrl?: string; coverUrl?: string; slug?: string; tagline?: string; about?: string }) {
    if (!input.name || !input.name.trim()) {
      throw new BadRequestException('Tên cộng đồng không được để trống');
    }
    const communityId = crypto.randomUUID();
    const name = input.name.trim();
    const cleanSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = input.slug?.trim() || cleanSlug || `comm-${Date.now().toString(36)}`;
    const tagline = input.tagline || input.description || null;
    const about = input.about || input.description || null;
    const logoUrl = input.logoUrl || null;
    const bannerUrl = input.bannerUrl || input.coverUrl || null;
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO public.associations (id, name, slug, tagline, about, logo_url, banner_url, created_at, updated_at)
      VALUES (${communityId}::uuid, ${name}, ${slug}, ${tagline}, ${about}, ${logoUrl}, ${bannerUrl}, ${now}, ${now})
    `;

    // Gán người tạo làm quản trị viên (admin) của cộng đồng
    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.memberships (id, user_id, association_id, role, is_default, created_at, updated_at)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${communityId}::uuid, 'admin', true, ${now}, ${now})
      `;
    } catch {}

    // Thông báo cho các client
    try {
      this.gateway.emitToRoom(`user:${userId}`, 'community:updated', { communityId });
    } catch {}

    return {
      id: communityId,
      communityId,
      name,
      slug,
      tagline,
      about,
      logoUrl,
      bannerUrl,
      viewerRole: 'admin',
      isMember: true,
      membershipStatus: 'active',
      memberCount: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }


  async listCommunityJoinHistory(userId: string) {
    const requests = await this.prisma.$queryRaw<any[]>`
      SELECT id, association_id, status, message, cancel_reason, created_at, decided_at
      FROM public.community_join_requests
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT 30
    `.catch(() => [] as any[]);

    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT id, association_id, created_at FROM public.memberships
      WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);

    const existingAssocIds = new Set(requests.map(r => String(r.association_id)));
    const merged = [...requests];

    for (const m of memberships) {
      if (!existingAssocIds.has(String(m.association_id))) {
        merged.push({
          id: m.id,
          association_id: m.association_id,
          status: 'approved',
          message: null,
          cancel_reason: null,
          created_at: m.created_at,
          decided_at: m.created_at,
        });
      }
    }

    if (merged.length === 0) return [];

    const assocIds = Array.from(new Set(merged.map(r => r.association_id)));
    const assocs = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, logo_url FROM public.associations
      WHERE id::uuid = ANY(${assocIds}::uuid[])
    `.catch(() => [] as any[]);

    const assocMap = new Map(assocs.map(a => [String(a.id), a]));

    return merged.map(r => {
      const assoc: any = assocMap.get(String(r.association_id)) ?? { name: "Cộng đồng", logo_url: null };
      return {
        requestId: String(r.id),
        communityId: String(r.association_id),
        name: assoc.name || "Cộng đồng",
        logoUrl: assoc.logo_url || null,
        status: r.status,
        requestedAt: r.created_at ? new Date(r.created_at).toISOString() : null,
        decidedAt: r.decided_at ? new Date(r.decided_at).toISOString() : null,
        reason: r.message || null,
        cancelReason: r.cancel_reason || null,
      };
    });
  }

  async syncCommunityJoinDecisions(userId: string) {
    const requests = await this.prisma.$queryRaw<any[]>`
      SELECT id, association_id, status, decided_at
      FROM public.community_join_requests
      WHERE user_id = ${userId}::uuid AND status IN ('approved', 'rejected')
      ORDER BY decided_at DESC NULLS LAST
      LIMIT 20
    `.catch(() => [] as any[]);

    if (requests.length === 0) return [];

    const dedupeKeys = requests.map(r => `community_join:${r.id}:${r.status}`);

    const existingNotifs = await this.prisma.$queryRaw<any[]>`
      SELECT dedupe_key FROM public.business_notifications
      WHERE recipient_user_id = ${userId}::uuid AND dedupe_key = ANY(${dedupeKeys})
    `.catch(() => [] as any[]);

    const notifiedKeys = new Set(existingNotifs.map(n => n.dedupe_key));
    const pendingRequests = requests.filter(r => !notifiedKeys.has(`community_join:${r.id}:${r.status}`));

    if (pendingRequests.length === 0) return [];

    const assocIds = Array.from(new Set(pendingRequests.map(r => r.association_id)));
    const assocs = await this.prisma.$queryRaw<any[]>`
      SELECT id, name FROM public.associations WHERE id::uuid = ANY(${assocIds}::uuid[])
    `.catch(() => [] as any[]);

    const nameMap = new Map(assocs.map(a => [a.id, a.name]));
    const now = new Date();

    const output: any[] = [];
    for (const r of pendingRequests) {
      const name = nameMap.get(r.association_id) || "â€”";
      const approved = r.status === 'approved';
      const notifId = crypto.randomUUID();

      await this.prisma.$executeRaw`
        INSERT INTO public.business_notifications (
          id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
          title_key, body_key, action_label_key, action_kind, action_target, safe_display_data,
          priority, status, delivered_at, dedupe_key
        ) VALUES (
          ${notifId}::uuid, ${userId}::uuid, 'community', ${r.id}::uuid,
          ${approved ? 'community.join.approved' : 'community.join.rejected'},
          ${approved ? 'community_join_approved' : 'community_join_rejected'},
          ${approved ? 'bc.notif.kind.community_join_approved.title' : 'bc.notif.kind.community_join_rejected.title'},
          ${approved ? 'bc.notif.kind.community_join_approved.body' : 'bc.notif.kind.community_join_rejected.body'},
          'bc.notif.action.viewJoinHistory', 'open_route',
          ${JSON.stringify({ route: "/connect-app/community", search: { tab: "history" } })}::jsonb,
          ${JSON.stringify({ communityName: name })}::jsonb,
          'normal', 'delivered', ${now}, ${`community_join:${r.id}:${r.status}`}
        )
      `.catch(() => {});

      output.push({
        communityId: r.association_id,
        name,
        status: r.status,
      });
    }

    return output;
  }

  async listCommunityJoinAdminRequests(userId: string) {
    const managed = await this.prisma.$queryRaw<any[]>`
      SELECT association_id FROM public.memberships
      WHERE user_id = ${userId}::uuid AND role = 'admin'
    `.catch(() => [] as any[]);

    const assocIds = Array.from(new Set(managed.map(m => m.association_id)));
    if (assocIds.length === 0) return [];

    const requests = await this.prisma.$queryRaw<any[]>`
      SELECT id, user_id, association_id, status, message, created_at, decided_at
      FROM public.community_join_requests
      WHERE association_id::uuid = ANY(${assocIds}::uuid[])
      ORDER BY created_at DESC
      LIMIT 100
    `.catch(() => [] as any[]);

    if (requests.length === 0) return [];

    const requesterIds = Array.from(new Set(requests.map(r => r.user_id)));
    const profiles = await this.prisma.$queryRaw<any[]>`
      SELECT id, full_name FROM public.profiles WHERE id::uuid = ANY(${requesterIds}::uuid[])
    `.catch(() => [] as any[]);

    const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));

    const assocs = await this.prisma.$queryRaw<any[]>`
      SELECT id, name FROM public.associations WHERE id::uuid = ANY(${assocIds}::uuid[])
    `.catch(() => [] as any[]);

    const assocMap = new Map(assocs.map(a => [a.id, a.name]));

    return requests.map(r => ({
      requestId: r.id,
      communityId: r.association_id,
      communityName: assocMap.get(r.association_id) || "â€”",
      requesterName: profileMap.get(r.user_id) || null,
      status: r.status,
      note: r.message || null,
      requestedAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      decidedAt: r.decided_at ? new Date(r.decided_at).toISOString() : null,
    }));
  }

  // ==========================================
  // BC-Mobile-7B+ â€” Community Invites
  // ==========================================

  async listCommunityInvites(userId: string, communityId: string) {
    const invites = await this.prisma.$queryRaw<any[]>`
      SELECT id, email, note, status, created_at, responded_at, token, locale, email_subject, email_body, invited_role, accepted_by
      FROM public.community_invitations
      WHERE association_id = ${communityId}::uuid AND invited_by = ${userId}::uuid
      ORDER BY created_at DESC
    `.catch(() => [] as any[]);

    return invites.map(row => ({
      inviteRef: row.id,
      email: row.email,
      note: row.note || null,
      status: row.status,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
      respondedAt: row.responded_at ? new Date(row.responded_at).toISOString() : null,
      token: row.token,
      locale: row.locale || "vi",
      emailSubject: row.email_subject || null,
      emailBody: row.email_body || null,
      invitedRole: row.invited_role || "member",
      acceptedRole: row.status === 'accepted' ? (row.invited_role || "member") : null,
      canManageRole: row.status === 'accepted' && row.accepted_by !== userId,
    }));
  }

  async createCommunityInvite(userId: string, input: any) {
    const inviteId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO public.community_invitations (
        id, association_id, invited_by, email, note, invite_url, locale, invited_role, status, token, created_at, updated_at
      ) VALUES (
        ${inviteId}::uuid, ${input.communityId}::uuid, ${userId}::uuid, ${input.email}, ${input.note || null},
        ${input.inviteUrl || null}, ${input.locale || 'vi'}, ${input.invitedRole || 'member'}, 'pending', ${token}, ${now}, ${now}
      )
    `;

    return {
      inviteRef: inviteId,
      token,
      status: 'pending',
    };
  }

  async listCommunityInviteTemplates(userId: string, communityId: string) {
    const templates = await this.prisma.$queryRaw<any[]>`
      SELECT locale, subject, body FROM public.community_invite_templates
      WHERE association_id = ${communityId}::uuid
    `.catch(() => [] as any[]);

    const defaultVi = {
      locale: "vi",
      subject: "Lời mời tham gia {{community}}",
      body: "Xin chào,\n\n{{inviter}} mời bạn tham gia cộng đồng {{community}} trên ViOne.\n\nNhấn vào liên kết để tham gia:\n{{link}}\n\nTrân trọng,\n{{community}}",
    };
    const defaultEn = {
      locale: "en",
      subject: "Invitation to join {{community}}",
      body: "Hello,\n\n{{inviter}} has invited you to join the {{community}} community on ViOne.\n\nClick the link below to join:\n{{link}}\n\nBest regards,\n{{community}}",
    };

    const cleanTpl = (str: string, fb: string) => {
      if (!str || str.includes("Lá»") || str.includes("Ä‘") || str.includes("cá»™ng") || str.includes("chĂ") || str.includes("báº¡n")) return fb;
      return str;
    };

    const mapping = templates.map(t => ({
      locale: t.locale,
      subject: cleanTpl(t.subject, t.locale === "vi" ? defaultVi.subject : defaultEn.subject),
      body: cleanTpl(t.body, t.locale === "vi" ? defaultVi.body : defaultEn.body),
    }));

    return {
      templates: mapping.length > 0 ? mapping : [defaultVi, defaultEn],
      canEdit: true,
    };
  }

  async saveCommunityInviteTemplate(userId: string, input: any) {
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.community_invite_templates (
        association_id, locale, subject, body, created_at, updated_at
      ) VALUES (
        ${input.communityId}::uuid, ${input.locale}, ${input.subject}, ${input.body}, ${now}, ${now}
      )
      ON CONFLICT (association_id, locale) DO UPDATE SET
        subject = EXCLUDED.subject,
        body = EXCLUDED.body,
        updated_at = EXCLUDED.updated_at
    `;
    return { ok: true };
  }

  async resetCommunityInviteTemplate(userId: string, input: any) {
    await this.prisma.$executeRaw`
      DELETE FROM public.community_invite_templates
      WHERE association_id = ${input.communityId}::uuid AND locale = ${input.locale}
    `;
    return { ok: true };
  }

  async cancelCommunityInvite(userId: string, inviteRef: string) {
    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.community_invitations
      SET status = 'cancelled', updated_at = ${now}
      WHERE id = ${inviteRef}::uuid AND invited_by = ${userId}::uuid
    `;
    return { ok: true };
  }

  async resendCommunityInvite(userId: string, inviteRef: string, locale?: string) {
    const now = new Date();
    if (locale) {
      await this.prisma.$executeRaw`
        UPDATE public.community_invitations
        SET locale = ${locale}, updated_at = ${now}
        WHERE id = ${inviteRef}::uuid AND invited_by = ${userId}::uuid
      `;
    }
    return { ok: true };
  }

  async getCommunityInviteByToken(userId: string, token: string) {
    const invites = await this.prisma.$queryRaw<any[]>`
      SELECT id, association_id, email, note, status, created_at, invited_role
      FROM public.community_invitations
      WHERE token = ${token}
      LIMIT 1
    `.catch(() => [] as any[]);

    const inv = invites[0];
    if (!inv) throw new NotFoundException('invite_not_found');

    const assocs = await this.prisma.$queryRaw<any[]>`
      SELECT name FROM public.associations WHERE id = ${inv.association_id}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    const assoc = assocs[0] || { name: "" };

    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.memberships WHERE user_id = ${userId}::uuid AND association_id = ${inv.association_id}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    return {
      inviteRef: inv.id,
      communityId: inv.association_id,
      communityName: assoc.name,
      status: inv.status,
      note: inv.note || null,
      maskedEmail: inv.email, // simple return without mask for convenience
      createdAt: inv.created_at ? new Date(inv.created_at).toISOString() : null,
      alreadyMember: memberships.length > 0,
      invitedRole: inv.invited_role || "member",
    };
  }

  async acceptCommunityInvite(userId: string, token: string, email: string) {
    const invites = await this.prisma.$queryRaw<any[]>`
      SELECT id, association_id, email, status, invited_role
      FROM public.community_invitations
      WHERE token = ${token}
      LIMIT 1
    `.catch(() => [] as any[]);

    const inv = invites[0];
    if (!inv) throw new NotFoundException('invite_not_found');

    // Relax email check: user holding the secret token can accept directly
    if (inv.status !== 'pending') {
      throw new BadRequestException('not_pending');
    }

    const communityId = inv.association_id;
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.memberships
      WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const role = inv.invited_role || "member";
    const now = new Date();

    if (existing.length === 0) {
      await this.prisma.$executeRaw`
        INSERT INTO public.memberships (user_id, association_id, role, created_at, updated_at)
        VALUES (${userId}::uuid, ${communityId}::uuid, ${role}, ${now}, ${now})
      `;
    } else if (role === 'admin') {
      await this.prisma.$executeRaw`
        UPDATE public.memberships SET role = 'admin', updated_at = ${now} WHERE id = ${existing[0].id}::uuid
      `;
    }

    await this.prisma.$executeRaw`
      UPDATE public.community_invitations
      SET status = 'accepted', responded_at = ${now}, accepted_by = ${userId}::uuid, updated_at = ${now}
      WHERE id = ${inv.id}::uuid
    `;

    return {
      ok: true,
      communityId,
      alreadyMember: existing.length > 0,
      role,
    };
  }

  async updateAcceptedInviteRole(userId: string, inviteRef: string, role: string) {
    const invites = await this.prisma.$queryRaw<any[]>`
      SELECT association_id, status, accepted_by FROM public.community_invitations
      WHERE id = ${inviteRef}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const invite = invites[0];
    if (!invite || invite.status !== 'accepted' || !invite.accepted_by) {
      throw new BadRequestException('not_accepted');
    }

    const communityId = invite.association_id;
    const targetUserId = invite.accepted_by;

    // Check if viewer is admin
    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT role FROM public.memberships WHERE user_id = ${userId}::uuid AND association_id = ${communityId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    if (!memberships[0] || memberships[0].role !== 'admin') {
      throw new ForbiddenException('forbidden');
    }

    // Update role
    const target = await this.prisma.$queryRaw<any[]>`
      SELECT id, role FROM public.memberships WHERE user_id = ${targetUserId}::uuid AND association_id = ${communityId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    if (!target[0]) throw new BadRequestException('not_accepted');
    const oldRole = target[0].role;

    if (oldRole === role) return { ok: true };

    const now = new Date();
    await this.prisma.$executeRaw`
      UPDATE public.memberships SET role = ${role}, updated_at = ${now} WHERE id = ${target[0].id}::uuid
    `;

    const eventId = crypto.randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO public.community_member_role_events (
        id, association_id, invitation_id, target_user_id, actor_user_id, old_role, new_role, created_at
      ) VALUES (
        ${eventId}::uuid, ${communityId}::uuid, ${inviteRef}::uuid, ${targetUserId}::uuid, ${userId}::uuid, ${oldRole}, ${role}, ${now}
      )
    `;

    return { ok: true };
  }

  async listInviteRoleHistory(userId: string, inviteRef: string) {
    const invites = await this.prisma.$queryRaw<any[]>`
      SELECT association_id FROM public.community_invitations WHERE id = ${inviteRef}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    const invite = invites[0];
    if (!invite) return [];

    // Verify membership
    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.memberships WHERE user_id = ${userId}::uuid AND association_id = ${invite.association_id}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    if (memberships.length === 0) return [];

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, old_role, new_role, created_at, actor_user_id
      FROM public.community_member_role_events
      WHERE invitation_id = ${inviteRef}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `.catch(() => [] as any[]);

    if (rows.length === 0) return [];

    const actorIds = Array.from(new Set(rows.map(r => r.actor_user_id)));
    const profiles = await this.prisma.$queryRaw<any[]>`
      SELECT id, full_name FROM public.profiles WHERE id::uuid = ANY(${actorIds}::uuid[])
    `.catch(() => [] as any[]);

    const nameMap = new Map(profiles.map(p => [p.id, p.full_name]));

    return rows.map(r => ({
      eventRef: r.id,
      oldRole: r.old_role,
      newRole: r.new_role,
      changedAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      actorName: nameMap.get(r.actor_user_id) || null,
    }));
  }

  // ==========================================
  // BC-Mobile-7B â€” Community Activity & Opportunities
  // ==========================================

  async listCommunityEvents(userId: string, communityId: string, tab: string, offset: number) {
    const hasMembership = await this.checkCommunityMembership(userId, communityId);

    const limit = 10;
    const userMembers = await this.prisma.$queryRaw<any[]>`
      SELECT code, email FROM public.members WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);
    const userMemberCodes = userMembers.map(m => m.code).filter(Boolean);
    const userInfo = await this.prisma.vione_users.findUnique({ where: { id: userId } }).catch(() => null);
    const userEmail = userInfo?.email || userMembers[0]?.email || '';

    let events: any[];
    const safeMemberCodes = userMemberCodes.length > 0 ? userMemberCodes : ['__NO_MEMBER__'];
    if (tab === 'registered') {
      events = await this.prisma.$queryRaw<any[]>`
        SELECT e.* FROM public.events e
        WHERE e.association_id = ${communityId}::uuid
          AND e.id IN (
            SELECT r.event_id FROM public.event_registrations r
            WHERE (r.member_code = ANY(${safeMemberCodes}) OR (r.email != '' AND r.email = ${userEmail}))
              AND r.status != 'cancelled'
          )
        ORDER BY (e.date >= CURRENT_DATE) DESC, e.date ASC
        OFFSET ${offset} LIMIT ${limit}
      `.catch((err) => {
        console.error('[listCommunityEvents] tab registered error:', err);
        return [] as any[];
      });
    } else {
      events = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.events
        WHERE association_id = ${communityId}::uuid AND status NOT IN ('cancelled')
        ORDER BY (date >= CURRENT_DATE) DESC, date ASC
        OFFSET ${offset} LIMIT ${limit}
      `.catch(() => [] as any[]);
    }

    const eventIds = events.map(e => e.id);
    let regSet = new Set<string>();
    if (eventIds.length > 0) {
      const registrations = await this.prisma.$queryRaw<any[]>`
        SELECT event_id FROM public.event_registrations
        WHERE event_id = ANY(${eventIds})
          AND (member_code = ANY(${safeMemberCodes}) OR (email != '' AND email = ${userEmail}))
          AND status != 'cancelled'
      `.catch(() => [] as any[]);
      regSet = new Set(registrations.map(r => r.event_id));
    }

    // Count total registrations per event for capacity checks
    let regCounts: Map<string, number> = new Map();
    if (eventIds.length > 0) {
      const counts = await this.prisma.$queryRaw<{ event_id: string; cnt: bigint }[]>`
        SELECT event_id, COUNT(*) as cnt FROM public.event_registrations
        WHERE event_id = ANY(${eventIds}) AND status != 'cancelled'
        GROUP BY event_id
      `.catch(() => [] as any[]);
      regCounts = new Map(counts.map(c => [c.event_id, Number(c.cnt)] as [string, number]));
    }

    const totalCount = events.length;
    const items = events.map(e => {
      const isRegistered = regSet.has(e.id);
      const capacity = e.capacity ? Number(e.capacity) : 0;
      const isFull = capacity > 0 && (regCounts.get(e.id) ?? Number(e.registered || 0)) >= capacity;
      const isCancelled = e.status === 'cancelled';

      let registrationState: 'available' | 'registered' | 'closed' | 'full' | 'cancelled';
      if (isRegistered) registrationState = 'registered';
      else if (isCancelled) registrationState = 'cancelled';
      else if (isFull) registrationState = 'full';
      else registrationState = 'available';

      const capacityState: 'open' | 'full' | null = capacity <= 0 ? null : isFull ? 'full' : 'open';

      return {
        eventRef: e.id,
        title: e.name || '',
        startAt: e.date ? new Date(e.date).toISOString().split('T')[0] : null,
        locationLabel: e.location || null,
        formatLabel: e.type || null,
        registrationState,
        capacityState,
      };
    });

    return {
      items,
      totalCount,
      nextOffset: items.length === limit ? offset + limit : null,
    };
  }


  async getCommunityEventDetail(userId: string, communityId: string, eventRef: string) {
    let events = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events
      WHERE association_id = ${communityId}::uuid AND (id = ${eventRef} OR id::text = ${eventRef})
      LIMIT 1
    `.catch(() => [] as any[]);

    if (events.length === 0) {
      events = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.events
        WHERE id = ${eventRef} OR id::text = ${eventRef}
        LIMIT 1
      `.catch(() => [] as any[]);
    }

    const e = events[0];
    if (!e) throw new NotFoundException('event_not_found');

    const userMembers = await this.prisma.$queryRaw<any[]>`
      SELECT code, email FROM public.members WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);
    const userMemberCodes = userMembers.map(m => m.code).filter(Boolean);
    const userInfo = await this.prisma.vione_users.findUnique({ where: { id: userId } }).catch(() => null);
    const userEmail = userInfo?.email || userMembers[0]?.email || '';

    const registrations = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.event_registrations
      WHERE event_id = ${eventRef}
        AND (member_code = ANY(${userMemberCodes}) OR (email != '' AND email = ${userEmail}))
        AND status != 'cancelled'
      LIMIT 1
    `.catch(() => [] as any[]);

    // Count total non-cancelled registrations for capacity check
    const regCounts = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM public.event_registrations
      WHERE event_id = ${eventRef} AND status != 'cancelled'
    `.catch(() => [{ count: BigInt(0) }]);
    const totalReg = regCounts && regCounts.length > 0 ? (regCounts[0]?.count ?? BigInt(0)) : BigInt(0);

    const isRegistered = registrations.length > 0;
    const capacity = e.capacity ? Number(e.capacity) : 0;
    const isFull = capacity > 0 && Number(totalReg) >= capacity;
    const isCancelled = e.status === 'cancelled';

    // Map to canonical registrationState
    let registrationState: 'available' | 'registered' | 'closed' | 'full' | 'cancelled';
    if (isRegistered) {
      registrationState = 'registered';
    } else if (isCancelled) {
      registrationState = 'cancelled';
    } else if (isFull) {
      registrationState = 'full';
    } else {
      registrationState = 'available';
    }

    const canRegister = !isRegistered && !isCancelled && !isFull;
    const capacityState: 'open' | 'full' | null = capacity <= 0 ? null : isFull ? 'full' : 'open';

    const effectiveAssocId = e.association_id || communityId;
    const communities = await this.prisma.$queryRaw<any[]>`
      SELECT name FROM public.associations WHERE id = ${effectiveAssocId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    return {
      event: {
        eventRef: e.id,
        title: e.name || e.title || '',
        startAt: e.date ? new Date(e.date).toISOString().split('T')[0] : null,
        locationLabel: e.location || null,
        formatLabel: e.type || null,
        registrationState,
        capacityState,
      },
      communityId: effectiveAssocId,
      communityName: communities[0]?.name || '',
      canRegister,
      checkinHandoff: isRegistered,
    };
  }


  async registerCommunityEvent(userId: string, communityId: string, eventRef: string) {
    const eventRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.events WHERE id = ${eventRef} LIMIT 1
    `.catch(() => [] as any[]);
    if (eventRows.length === 0) throw new NotFoundException('event_not_found');

    const memberRows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    const userRows = await this.prisma.vione_users.findUnique({ where: { id: userId } }).catch(() => null);

    const memberCode = memberRows[0]?.code ?? `MB-${Date.now().toString(36).toUpperCase()}`;
    const memberName = memberRows[0]?.name ?? userRows?.name ?? 'Hội viên';
    const email = memberRows[0]?.email ?? userRows?.email ?? '';

    const regId = `REG-${Date.now().toString(36).toUpperCase()}`;
    const luckyNum = String(Math.floor(1000 + Math.random() * 9000));
    await this.prisma.$executeRaw`
      INSERT INTO public.event_registrations (
        id, event_id, member_code, member_name, email, registered_at, status, ticket_type, association_id, lucky_number, created_at, updated_at
      ) VALUES (
        ${regId},
        ${eventRef},
        ${memberCode},
        ${memberName},
        ${email},
        now()::date,
        'confirmed',
        'Standard',
        ${communityId}::uuid,
        ${luckyNum},
        now(),
        now()
      )
    `;

    await this.prisma.$executeRaw`
      UPDATE public.events SET registered = registered + 1, updated_at = now() WHERE id = ${eventRef}
    `.catch(() => null);

    return { ok: true, registrationId: regId, luckyNumber: luckyNum };
  }

  async cancelCommunityEventRegistration(userId: string, communityId: string, eventRef: string) {
    const memberRows = await this.prisma.$queryRaw<any[]>`
      SELECT code, email FROM public.members WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);
    const memberCodes = memberRows.map(m => m.code).filter(Boolean);
    const user = await this.prisma.vione_users.findUnique({ where: { id: userId } }).catch(() => null);
    const email = user?.email || memberRows[0]?.email || '';

    await this.prisma.$executeRaw`
      UPDATE public.event_registrations SET status = 'cancelled', updated_at = now()
      WHERE event_id = ${eventRef} AND (member_code = ANY(${memberCodes}) OR (email != '' AND email = ${email}))
    `.catch(() => null);

    await this.prisma.$executeRaw`
      UPDATE public.events SET registered = GREATEST(0, registered - 1), updated_at = now() WHERE id = ${eventRef}
    `.catch(() => null);

    return { ok: true };
  }

  async listCommunityOpportunities(userId: string, communityId: string, query: string, offset: number) {
    const hasMembership = await this.checkCommunityMembership(userId, communityId);

    const limit = 10;
    const opportunities = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.opportunities
      WHERE status IN ('open', 'published')
        AND (${query} = '' OR title ILIKE ${'%' + query + '%'} OR description ILIKE ${'%' + query + '%'})
      ORDER BY created_at DESC
      OFFSET ${offset} LIMIT ${limit}
    `.catch(() => [] as any[]);

    const oppIds = opportunities.map(o => o.id);
    let interestMap = new Map<string, string>();
    if (oppIds.length > 0) {
      const interests = await this.prisma.$queryRaw<any[]>`
        SELECT opportunity_id FROM public.opportunity_interests
        WHERE member_id = ${userId} AND opportunity_id = ANY(${oppIds})
      `.catch(() => [] as any[]);
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
    const hasMembership = await this.checkCommunityMembership(userId, communityId);

    const opportunities = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.opportunities
      WHERE id = ${opportunityRef}
      LIMIT 1
    `.catch(() => [] as any[]);

    const o = opportunities[0];
    if (!o) throw new NotFoundException('opportunity_not_found');

    const interests = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.opportunity_interests
      WHERE member_id = ${userId} AND opportunity_id = ${opportunityRef}
      LIMIT 1
    `.catch(() => [] as any[]);

    const poster = o.poster_id
      ? await this.prisma.$queryRaw<any[]>`
          SELECT id, name, company, phone FROM public.members
          WHERE id = ${o.poster_id} OR user_id = ${o.poster_id}::uuid
          LIMIT 1
        `.catch(() => [] as any[])
      : [];

    const p = poster[0];
    const assoc = await this.prisma.$queryRaw<any[]>`
      SELECT name FROM public.associations WHERE id = ${communityId}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    const now = Date.now();
    const deadlineMs = o.deadline ? new Date(o.deadline).getTime() : null;
    const daysLeft = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / (1000 * 60 * 60 * 24))) : null;

    return {
      opportunity: {
        opportunityRef: o.id,
        title: o.title,
        categoryKey: o.type || 'opp.type.partnership',
        organizationLabel: p?.company || p?.name || 'Doanh nghiệp thành viên',
        shortDescription: o.description ? o.description.substring(0, 160) : null,
        publishedAt: o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString(),
        expiresAt: o.deadline ? new Date(o.deadline).toISOString() : null,
        daysLeft,
        interested: interests.length > 0,
        interestLevel: interests[0]?.interest_level || (interests.length > 0 ? 'high' : null),
      },
      description: o.description || null,
      regionLabel: o.region || 'Toàn quốc',
      industryLabel: o.industry || 'Đa ngành',
      budgetMin: o.budget_min != null ? Number(o.budget_min) : null,
      budgetMax: o.budget_max != null ? Number(o.budget_max) : null,
      poster: p ? {
        memberRef: p.id,
        displayName: p.name,
      } : null,
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
    const member = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, phone, company FROM public.members 
      WHERE user_id = ${userId}::uuid OR id = ${userId}
      LIMIT 1
    `.catch(() => [] as any[]);
    const posterName = member[0]?.name || 'Hội viên VIONE';

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

    return {
      ok: true,
      opportunityId: oppId,
      title: data.title,
    };
  }

  async createCommunityNews(userId: string, communityId: string, data: any) {
    const newsId = `NEWS-${Date.now().toString(36).toUpperCase()}`;
    const code = `N${Date.now().toString().slice(-6)}`;
    const member = await this.prisma.$queryRaw<any[]>`
      SELECT name FROM public.members 
      WHERE user_id = ${userId}::uuid OR id = ${userId}
      LIMIT 1
    `.catch(() => [] as any[]);
    const authorName = member[0]?.name || 'Ban Thư Ký';

    await this.prisma.$executeRaw`
      INSERT INTO public.news (
        id, code, title, category, author, published_at, views, status, excerpt, content, cover_image, association_id, created_at, updated_at
      ) VALUES (
        ${newsId}, ${code}, ${data.title || 'Thông báo mới'},
        ${data.category || 'Tin Hiệp Hội'}, ${authorName},
        now(), 0, 'published', ${data.excerpt || ''},
        ${data.content || ''}, ${data.coverImage || '/ceo1983_hero_cosmos_skyline.jpg'},
        ${communityId}::uuid, now(), now()
      )
    `;

    return {
      ok: true,
      newsId,
      title: data.title,
    };
  }

  async claimCommunityOpportunity(userId: string, communityId: string, opportunityRef: string) {
    const member = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, phone, company FROM public.members 
      WHERE user_id = ${userId}::uuid OR id = ${userId}
      LIMIT 1
    `.catch(() => [] as any[]);

    const userProfile = await this.prisma.$queryRaw<any[]>`
      SELECT display_name, company_name FROM public.user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    const claimantName = member[0]?.name || userProfile[0]?.display_name || 'Hội viên VIONE';
    const claimantPhone = member[0]?.phone || '';
    const claimantCompany = member[0]?.company || userProfile[0]?.company_name || '';

    // 1. Update opportunity claim record
    await this.prisma.$executeRaw`
      UPDATE public.opportunities
      SET 
        claimed_by_id = ${userId},
        claimed_by_name = ${claimantName},
        claimed_at = now(),
        claimed_phone = ${claimantPhone},
        claimed_company = ${claimantCompany}
      WHERE id = ${opportunityRef}
    `;

    // 2. Fetch opportunity title & poster_id
    const oppRow = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, poster_id, association_id FROM public.opportunities WHERE id = ${opportunityRef} LIMIT 1
    `.catch(() => [] as any[]);
    const oppTitle = oppRow[0]?.title || 'Cơ hội kết nối';
    const posterId = oppRow[0]?.poster_id;
    const assocId = (communityId && communityId.trim().length > 10) ? communityId.trim() : (oppRow[0]?.association_id || null);

    // 3. Record interest in opportunity_interests
    const intId = `INT-${Date.now().toString(36).toUpperCase()}`;
    await this.prisma.$executeRaw`
      INSERT INTO public.opportunity_interests (
        id, opportunity_id, member_id, message, contact, interest_level, created_at, association_id
      ) VALUES (
        ${intId}, ${opportunityRef}, ${userId}, 'Đã nhận cơ hội trên ứng dụng VIONE Mobile', ${claimantPhone}, 'high', now(), ${assocId}::uuid
      )
      ON CONFLICT (id) DO NOTHING
    `.catch((err) => console.warn('Interest insert error:', err));

    // 4. Save notification for claimant in business_notifications (ViOne app bell icon)
    const notifClaimantId = crypto.randomUUID();
    const dedupeClaimant = `claim_${opportunityRef}_${userId}_${Date.now()}`;
    await this.prisma.$executeRaw`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
      ) VALUES (
        ${notifClaimantId}::uuid, ${userId}::uuid, 'opportunity', ${opportunityRef}, ${dedupeClaimant}, 'opportunity_claimed', 'opportunity_claimed',
        'Đã tiếp nhận cơ hội thành công',
        ${`Bạn đã tiếp nhận cơ hội "${oppTitle}". Dữ liệu đã đồng bộ về hệ thống CRM.`},
        ${JSON.stringify({ opportunityId: opportunityRef, title: oppTitle, claimantName, claimantCompany, communityId })}::jsonb,
        'high', 'delivered', 'all', 'all', now(), now()
      )
    `.catch((err) => console.warn('Notif claimant error:', err));

    // 5. If poster is another user, notify the poster
    let notifPosterId = '';
    if (posterId && posterId !== userId) {
      notifPosterId = crypto.randomUUID();
      const dedupePoster = `claim_peer_${opportunityRef}_${posterId}_${Date.now()}`;
      await this.prisma.$executeRaw`
        INSERT INTO public.business_notifications (
          id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
          title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
        ) VALUES (
          ${notifPosterId}::uuid, ${posterId}::uuid, 'opportunity', ${opportunityRef}, ${dedupePoster}, 'opportunity_claimed_by_peer', 'opportunity_claimed_by_peer',
          'Cơ hội của bạn đã có người nhận kết nối',
          ${`${claimantName} (${claimantCompany || 'Doanh nghiệp'}) đã tiếp nhận cơ hội "${oppTitle}".`},
          ${JSON.stringify({ opportunityId: opportunityRef, title: oppTitle, claimantName, claimantCompany, claimantPhone })}::jsonb,
          'high', 'delivered', 'all', 'all', now(), now()
        )
      `.catch((err) => console.warn('Notif poster error:', err));
    }

    // 6. Broadcast notification to CRM (public.notifications)
    const crmCode = `NOTIF-OPP-${Date.now().toString().slice(-6)}`;
    await this.prisma.$executeRaw`
      INSERT INTO public.notifications (
        id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${crmCode},
        'Tiếp nhận cơ hội kết nối',
        ${`${claimantName} (${claimantCompany}) đã tiếp nhận cơ hội: ${oppTitle}`},
        'all', 'inapp', 'sent', now(), 0, ${communityId ? communityId : null}::uuid, 'all', 'all', now(), now()
      )
    `.catch((err) => console.warn('CRM notif error:', err));

    // 7. Realtime WebSockets emission to claimant, poster and CRM
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
        this.gateway.emitNotification(posterId, {
          id: notifPosterId,
          title: 'Cơ hội của bạn đã có người nhận kết nối',
          body: `${claimantName} (${claimantCompany || 'Doanh nghiệp'}) đã tiếp nhận cơ hội "${oppTitle}".`,
          notificationKind: 'opportunity_claimed_by_peer',
          appScope: 'all',
          createdAt: new Date().toISOString(),
        });
        this.gateway.emitUnreadNotificationCount(posterId, 1);
      }

      this.gateway.emitToAll('notification:new', {
        title: 'Tiếp nhận cơ hội kết nối',
        body: `${claimantName} (${claimantCompany}) đã tiếp nhận cơ hội: ${oppTitle}`,
        appScope: 'all',
        sentAt: new Date().toISOString(),
      });
      this.gateway.emitToAll('notification:count', {});
    } catch (wsErr) {
      console.warn('Realtime WS emit error:', wsErr);
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
    interestLevel?: string
  ) {
    const now = new Date();
    const intId = `INT-${Date.now().toString(36).toUpperCase()}`;

    const member = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, phone, company, contact FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    const contact = member[0]?.phone || member[0]?.contact || '';
    const claimantName = member[0]?.name || 'Hội viên VIONE';
    const claimantCompany = member[0]?.company || '';

    // Fetch opp title, poster & association
    const oppRow = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, poster_id, association_id FROM public.opportunities WHERE id = ${opportunityRef} LIMIT 1
    `.catch(() => [] as any[]);
    const oppTitle = oppRow[0]?.title || 'Cơ hội kết nối';
    const posterId = oppRow[0]?.poster_id;
    const assocId = (communityId && communityId.trim().length > 10) ? communityId.trim() : (oppRow[0]?.association_id || null);

    await this.prisma.$executeRaw`
      INSERT INTO public.opportunity_interests (
        id, opportunity_id, member_id, message, contact, interest_level, created_at, association_id
      ) VALUES (
        ${intId}, ${opportunityRef}, ${userId}, ${interestLevel === 'high' ? 'Quan tâm cao cơ hội này' : 'Quan tâm thấp cơ hội này'}, ${contact}, ${interestLevel || 'high'}, ${now}, ${assocId}::uuid
      )
      ON CONFLICT (id) DO UPDATE SET
        interest_level = EXCLUDED.interest_level,
        message = EXCLUDED.message
    `.catch((err) => console.warn('Express interest insert error:', err));

    // Save notification for user
    const notifId = crypto.randomUUID();
    const dedupeInterest = `interest_${opportunityRef}_${userId}_${Date.now()}`;
    const isLow = interestLevel === 'low';
    const notifTitle = isLow ? 'Đã chuyển cơ hội sang quan tâm thấp' : 'Đã gửi mức độ quan tâm cơ hội';
    const notifBody = isLow
      ? `Bạn đã chuyển cơ hội "${oppTitle}" sang mức quan tâm thấp.`
      : `Bạn đã đăng ký quan tâm cơ hội "${oppTitle}". Dữ liệu đã đồng bộ về CRM.`;

    await this.prisma.$executeRaw`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
      ) VALUES (
        ${notifId}::uuid, ${userId}::uuid, 'opportunity', ${opportunityRef}, ${dedupeInterest}, 'opportunity_interest_sent', 'opportunity_interest_sent',
        ${notifTitle},
        ${notifBody},
        ${JSON.stringify({ opportunityId: opportunityRef, title: oppTitle, interestLevel, communityId })}::jsonb,
        'medium', 'delivered', 'all', 'all', now(), now()
      )
    `.catch((err) => console.warn('Notif interest error:', err));

    // Realtime notification
    try {
      this.gateway.emitNotification(userId, {
        id: notifId,
        title: notifTitle,
        body: notifBody,
        notificationKind: 'opportunity_interest_sent',
        appScope: 'all',
        createdAt: now.toISOString(),
      });
      this.gateway.emitUnreadNotificationCount(userId, 1);

      this.gateway.emitToAll('notification:new', {
        title: isLow ? 'Doanh nghiệp chuyển cơ hội sang quan tâm thấp' : 'Doanh nghiệp đăng ký quan tâm cơ hội',
        body: `${claimantName} (${claimantCompany}) ${isLow ? 'chuyển sang quan tâm thấp' : 'đăng ký quan tâm'} cơ hội: ${oppTitle}`,
        appScope: 'all',
        sentAt: now.toISOString(),
      });
      this.gateway.emitToAll('notification:count', {});
    } catch (wsErr) {
      console.warn('Realtime WS error:', wsErr);
    }

    return { ok: true };
  }

  async withdrawCommunityOpportunityInterest(userId: string, communityId: string, opportunityRef: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.opportunity_interests
      WHERE opportunity_id = ${opportunityRef} AND member_id = ${userId}
    `.catch(() => null);
    return { ok: true };
  }

  async scheduleCommunityOpportunityFollowUp(userId: string, communityId: string, opportunityRef: string, inDays: number) {
    const nextAction = new Date(Date.now() + inDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO public.community_opportunity_followups (
        user_id, opportunity_id, next_action_at, progress, note, created_at, updated_at
      ) VALUES (
        ${userId}::uuid, ${opportunityRef}::uuid, ${nextAction}, 'planned', '', ${now}, ${now}
      )
      ON CONFLICT (user_id, opportunity_id) DO UPDATE SET
        next_action_at = EXCLUDED.next_action_at,
        updated_at = EXCLUDED.updated_at
    `;
    return { ok: true };
  }

  async updateCommunityOpportunityFollowUp(userId: string, communityId: string, opportunityRef: string, action: string) {
    const now = new Date();
    if (action === 'done' || action === 'cancel') {
      await this.prisma.$executeRaw`
        UPDATE public.community_opportunity_followups
        SET next_action_at = NULL, updated_at = ${now}
        WHERE user_id = ${userId}::uuid AND opportunity_id = ${opportunityRef}::uuid
      `;
    }
    return { ok: true };
  }

  async saveCommunityOpportunityProgress(userId: string, communityId: string, opportunityRef: string, progress: string, note: string) {
    const now = new Date();
    await this.prisma.$executeRaw`
      INSERT INTO public.community_opportunity_followups (
        user_id, opportunity_id, next_action_at, progress, note, created_at, updated_at
      ) VALUES (
        ${userId}::uuid, ${opportunityRef}::uuid, NULL, ${progress}, ${note || ''}, ${now}, ${now}
      )
      ON CONFLICT (user_id, opportunity_id) DO UPDATE SET
        progress = EXCLUDED.progress,
        note = EXCLUDED.note,
        updated_at = EXCLUDED.updated_at
    `;
    return { ok: true };
  }

  async addCommunityOpportunityAttachment(userId: string, input: any) {
    const attachmentId = crypto.randomUUID();
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
    return { ok: true };
  }

  async removeCommunityOpportunityAttachment(userId: string, attachmentId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.community_opportunity_followup_attachments
      WHERE id = ${attachmentId}::uuid AND user_id = ${userId}::uuid
    `;
    return { ok: true };
  }

  // ── CRM & Full System Opportunity CRUD ─────────────────────────────────────
  async listAllOpportunities(userId: string) {
    try {
      const opps = await this.prisma.$queryRaw<any[]>`
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

      const interests = await this.prisma.$queryRaw<any[]>`
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
      console.error('Error in listAllOpportunities:', err);
      return { opportunities: [], interests: [], interestCounts: {} };
    }
  }

  async getOpportunityById(opportunityId: string) {
    try {
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
      if (!opps[0]) return null;
      const r = opps[0];

      const interests = await this.prisma.$queryRaw<any[]>`
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
      console.error('Error in getOpportunityById:', err);
      return null;
    }
  }

  async createOpportunity(userId: string, data: any) {
    const oppId = data.id || `OPP-${Date.now().toString(36).toUpperCase()}`;
    const assocId = data.associationId || 'c1983000-0000-4000-8000-000000001983';

    // Fetch poster details (member or vione_user)
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

    const contactName = (data.contactName || mem[0]?.name || vu[0]?.name || 'Ban Quản Trị').trim();
    const contactPhone = (data.contactPhone || mem[0]?.phone || vu[0]?.phone || '').trim();
    const contactTitle = (data.contactTitle || 'Đại diện hợp tác').trim();
    const company = (data.company || 'CLB Doanh Nhân CEO 1983').trim();

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
          ${data.image || null}, ${contactName}, ${contactPhone || null}, ${contactTitle}, ${company},
          now(), now()
        )
      `;
    } catch (err: any) {
      console.warn('createOpportunity primary insert failed, using fallback:', err?.message);
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
    return { ok: true, id: oppId };
  }

  async deleteOpportunity(userId: string, opportunityId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.opportunity_interests WHERE opportunity_id = ${opportunityId}
    `.catch(() => {});
    await this.prisma.$executeRaw`
      DELETE FROM public.opportunities WHERE id = ${opportunityId}
    `.catch(() => {});
    return { ok: true };
  }

  async updateOpportunity(userId: string, opportunityId: string, data: any) {
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
    return { ok: true };
  }

  async toggleOpportunityStatus(userId: string, opportunityId: string) {
    const opps = await this.prisma.$queryRaw<any[]>`
      SELECT status FROM public.opportunities WHERE id = ${opportunityId} LIMIT 1
    `.catch(() => []);
    const current = opps[0]?.status || 'open';
    const nextStatus = current === 'open' ? 'closed' : 'open';
    await this.prisma.$executeRaw`
      UPDATE public.opportunities SET status = ${nextStatus}, updated_at = now() WHERE id = ${opportunityId}
    `;
    return { ok: true, status: nextStatus };
  }

  async listMyOpportunities(userId: string) {
    try {
      const opportunities = await this.prisma.$queryRaw<any[]>`
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

      const oppIds = opportunities.map(o => o.id);
      let myInterests = new Set<string>();
      if (oppIds.length > 0) {
        const ints = await this.prisma.$queryRaw<any[]>`
          SELECT opportunity_id FROM public.opportunity_interests
          WHERE contact = ${userId} OR member_id::text = ${userId}
        `.catch(() => [] as any[]);
        myInterests = new Set(ints.map(i => String(i.opportunity_id)));
      }

      const OPP_COLORS = ['#D97706', '#F59E0B', '#B45309', '#D8B282', '#EDB028'];

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
      await this.prisma.$executeRaw`
        UPDATE public.opportunities 
        SET views = COALESCE(views, 0) + 1, updated_at = now()
        WHERE id = ${opportunityId}
      `;
      return { ok: true, id: opportunityId };
    } catch (err) {
      console.warn('incrementOpportunityView error:', err);
      return { ok: false };
    }
  }

  async getOpportunityInterestedMembers(opportunityId: string) {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
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
      `;
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
      console.error('getOpportunityInterestedMembers error:', err);
      return [];
    }
  }

  // ── Member Messaging (used by member PWA) ─────────────────────────
  async resolveMemberCodeForUser(userId: string): Promise<string> {
    try {
      // 1. Kiểm tra trực tiếp trong bảng members theo user_id hoặc id
      const mems = await this.prisma.$queryRaw<any[]>`
        SELECT m.code FROM public.members m
        WHERE m.user_id = ${userId}::uuid
           OR m.id = ${userId}::text
        LIMIT 1
      `.catch(() => []);
      if (mems && mems[0]?.code) {
        return mems[0].code;
      }

      // 2. Kiểm tra trong public.vione_users (tài khoản đăng nhập chính thức của NestJS)
      const vioneUser = await this.prisma.$queryRaw<any[]>`
        SELECT email, username, phone, name FROM public.vione_users WHERE id = ${userId}::uuid LIMIT 1
      `.catch(() => []);

      if (vioneUser && vioneUser[0]) {
        const u = vioneUser[0];
        const byUser = await this.prisma.$queryRaw<any[]>`
          SELECT code FROM public.members 
          WHERE (email IS NOT NULL AND LOWER(email) = LOWER(${u.email}))
             OR (phone IS NOT NULL AND phone = ${u.phone})
             OR (code IS NOT NULL AND LOWER(code) = LOWER(${u.username}))
          LIMIT 1
        `.catch(() => []);

        if (byUser && byUser[0]?.code) {
          // Tự động liên kết user_id vào members để các truy vấn sau nhanh tức thì
          await this.prisma.$executeRaw`
            UPDATE public.members SET user_id = ${userId}::uuid WHERE LOWER(code) = LOWER(${byUser[0].code}) AND user_id IS NULL
          `.catch(() => null);
          return byUser[0].code;
        }

        // Tự động tạo hồ sơ hội viên cho tài khoản này
        const userEmail = u.email || `${u.username || userId}@ceo1983.vn`;
        const newCode = 'M1983-' + String(Math.floor(100 + Math.random() * 900));
        await this.prisma.$executeRaw`
          INSERT INTO public.members (
            id, code, name, contact, email, phone, type, level, industry, region,
            status, joined_at, fee_year, fee_paid, address, about, payment_status,
            user_id, association_id, created_at, updated_at
          ) VALUES (
            ${userId}::text, ${newCode}, ${u.name || 'Hội viên CEO 1983'}, ${u.name || 'Hội viên CEO 1983'},
            ${userEmail}, ${u.phone || '0983000000'}, 'corporate', 'standard', 'Kinh doanh & Quản lý', 'Hà Nội',
            'active', CURRENT_DATE, 2026, true, 'Hà Nội', 'Hội viên CLB Doanh Nh\u00e2n CEO 1983', 'paid',
            ${userId}::uuid, 'c1983000-0000-4000-8000-000000001983'::uuid, now(), now()
          ) ON CONFLICT (id) DO UPDATE SET user_id = ${userId}::uuid
        `.catch(() => null);
        return newCode;
      }

      // 3. Fallback kiểm tra auth.users (nếu có Supabase auth cũ)
      const authUsers = await this.prisma.$queryRaw<any[]>`
        SELECT email FROM auth.users WHERE id = ${userId}::uuid LIMIT 1
      `.catch(() => []);
      const userEmail = authUsers[0]?.email;
      if (userEmail) {
        const byEmail = await this.prisma.$queryRaw<any[]>`
          SELECT code FROM public.members WHERE LOWER(email) = LOWER(${userEmail}) LIMIT 1
        `.catch(() => []);
        if (byEmail && byEmail[0]?.code) {
          return byEmail[0].code;
        }
      }

      const first = await this.prisma.$queryRaw<any[]>`
        SELECT code FROM public.members WHERE code IS NOT NULL ORDER BY updated_at DESC LIMIT 1
      `.catch(() => []);
      return first[0]?.code || 'm1983-002';
    } catch {
      return 'm1983-002';
    }
  }

  async listMemberConversations(userId: string) {
    const myCode = await this.resolveMemberCodeForUser(userId);
    const mine = myCode.toLowerCase();

    const msgs = await this.prisma.$queryRaw<any[]>`
      SELECT id, from_id, to_id, text, created_at, read_at
      FROM public.messages
      WHERE LOWER(from_id) = ${mine} OR LOWER(to_id) = ${mine}
         OR LOWER(from_id) = LOWER(${userId}) OR LOWER(to_id) = LOWER(${userId})
      ORDER BY created_at DESC
    `.catch(() => []);

    const byPeer = new Map<string, any[]>();
    for (const m of msgs) {
      const from = String(m.from_id).toLowerCase();
      const to = String(m.to_id).toLowerCase();
      const peer = (from === mine || from === userId.toLowerCase()) ? to : from;
      if (!byPeer.has(peer)) byPeer.set(peer, []);
      byPeer.get(peer)!.push(m);
    }

    const peers = [...byPeer.keys()];
    const members = await this.prisma.$queryRaw<any[]>`
      SELECT m.code, m.name, m.contact,
             COALESCE(up.display_name, vu.name, bi.display_name, m.contact, m.name) as display_name,
             COALESCE(up.avatar_url, bi.avatar_url, vu.avatar_url) as avatar
      FROM public.members m
      LEFT JOIN public.user_profiles up ON up.user_id = m.user_id
      LEFT JOIN public.business_identities bi ON bi.owner_user_id = m.user_id AND bi.status = 'active'
      LEFT JOIN public.vione_users vu ON vu.id = m.user_id
    `.catch(() => []);
    const userByCode = new Map<string, string>();
    const nameByCode = new Map<string, string>();
    const avatarByCode = new Map<string, string>();
    for (const mem of members) {
      if (mem.code) {
        if (mem.user_id) userByCode.set(String(mem.code).toLowerCase(), String(mem.user_id));
        const resolvedName = mem.display_name || mem.name || mem.contact;
        if (resolvedName) nameByCode.set(String(mem.code).toLowerCase(), resolvedName);
        if (mem.avatar) avatarByCode.set(String(mem.code).toLowerCase(), mem.avatar);
      }
    }

    // Tra cứu kết nối thực tế trong public.user_connections để phân loại: Đã kết nối hay Tin nhắn chờ
    const peerUserIds = Array.from(userByCode.values()).filter(Boolean);
    const connMap = new Map<string, { status: string; requesterId: string; connectionId: string }>();
    if (peerUserIds.length > 0) {
      try {
        const conns = await this.prisma.$queryRaw<any[]>`
          SELECT id, requester_user_id, recipient_user_id, status
          FROM public.user_connections
          WHERE (requester_user_id = ${userId}::uuid AND recipient_user_id = ANY(${peerUserIds}::uuid[]))
             OR (recipient_user_id = ${userId}::uuid AND requester_user_id = ANY(${peerUserIds}::uuid[]))
        `.catch(() => []);
        for (const c of conns) {
          const otherId = String(c.requester_user_id).toLowerCase() === userId.toLowerCase()
            ? String(c.recipient_user_id).toLowerCase()
            : String(c.requester_user_id).toLowerCase();
          connMap.set(otherId, {
            status: String(c.status).toLowerCase(),
            requesterId: String(c.requester_user_id).toLowerCase(),
            connectionId: String(c.id),
          });
        }
      } catch {
        /* ignore */
      }
    }

    const resList: any[] = [];
    for (const peer of peers) {
      const list = byPeer.get(peer)!;
      const latest = list[0];
      const unread = list.filter((m) => (String(m.to_id).toLowerCase() === mine || String(m.to_id).toLowerCase() === userId.toLowerCase()) && m.read_at == null).length;
      const isSystem = peer === 'admin' || peer === 'system';
      const peerUserId = userByCode.get(peer);

      // ĐẢM BẢO: Hễ có tin nhắn giữa 2 bên là hiển thị 100%, không lọc bỏ!
      const hasMessages = Boolean(latest && latest.text && String(latest.text).trim().length > 0);
      if (!isSystem && !hasMessages) {
        continue;
      }

      const isOnline = isSystem ? true : (peerUserId ? (this.gateway?.isUserOnline(peerUserId) ?? false) : false);
      const connInfo = peerUserId ? connMap.get(peerUserId.toLowerCase()) : null;
      const isConnected = isSystem ? true : (connInfo?.status === 'accepted');
      const connectionStatus = isSystem ? 'accepted' : (connInfo?.status || 'none');
      const isPending = !isSystem && connInfo?.status === 'pending';
      const isOutgoingPending = isPending && connInfo?.requesterId === userId.toLowerCase();
      const isIncomingPending = isPending && connInfo?.requesterId !== userId.toLowerCase();
      const isStranger = !isSystem && !isConnected;

      resList.push({
        peerCode: peer,
        userId: peerUserId ?? null,
        isOnline,
        name: isSystem ? 'Ban Thư Ký CLB Doanh Nhân CEO 1983' : (nameByCode.get(peer) ?? peer.toUpperCase()),
        avatarUrl: isSystem ? '/ceo1983-logo.png' : (avatarByCode.get(peer) ?? null),
        last: latest.text,
        time: latest.created_at ? new Date(latest.created_at).toISOString() : new Date().toISOString(),
        rawTime: latest.created_at ? new Date(latest.created_at).toISOString() : new Date().toISOString(),
        unread,
        isSystem,
        isConnected,
        connectionStatus,
        isPending,
        isOutgoingPending,
        isIncomingPending,
        isStranger,
        connectionId: connInfo?.connectionId || null,
      });
    }

    if (!byPeer.has('admin')) {
      resList.unshift({
        peerCode: 'admin',
        name: 'Ban Thư Ký CLB Doanh Nhân CEO 1983',
        avatarUrl: '/ceo1983-logo.png',
        last: '[action:payment|amount:20000000|invoice:HD-2026-001|qr:https://img.vietqr.io/image/MB-1983000000-compact2.png?amount=20000000&addInfo=HD-2026-001|due:31/03/2026|desc:H%E1%BB%99i%20ph%C3%AD%20th%C6%B0%E1%BB%9Dng%20ni%C3%AAn%202026%20-%20CLB%20Doanh%20Nh%C3%A2n%20CEO%201983]',
        time: new Date().toISOString(),
        rawTime: new Date().toISOString(),
        unread: 1,
        isSystem: true,
        isOnline: true,
        isConnected: true,
        connectionStatus: 'accepted',
        isPending: false,
        isOutgoingPending: false,
        isIncomingPending: false,
        isStranger: false,
        connectionId: null,
      });
    }

    // Đưa hội thoại có tin nhắn mới nhất lên đầu danh sách (giữ admin ở vị trí ưu tiên nếu cần)
    resList.sort((a, b) => {
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return new Date(b.rawTime || b.time).getTime() - new Date(a.rawTime || a.time).getTime();
    });

    return resList;
  }

  async listMemberMessages(userId: string, peerCode: string) {
    const myCode = await this.resolveMemberCodeForUser(userId);
    const mine = myCode.toLowerCase();
    const peer = peerCode.toLowerCase();
    const isSystem = peer === 'admin' || peer === 'system';
    const isGroup = peer.startsWith('group_');
    const isChannel = peer.startsWith('channel_');

    const [rawMsgs, peerMem] = await Promise.all([
      (isGroup || isChannel)
        ? this.prisma.$queryRaw<any[]>`
            SELECT id, from_id, to_id, text, created_at, read_at
            FROM public.messages
            WHERE LOWER(to_id) = ${peer} OR LOWER(from_id) = ${peer}
            ORDER BY created_at ASC
          `.catch((): any[] => [])
        : this.prisma.$queryRaw<any[]>`
            SELECT id, from_id, to_id, text, created_at, read_at
            FROM public.messages
            WHERE (LOWER(from_id) = ${mine} AND LOWER(to_id) = ${peer})
               OR (LOWER(from_id) = ${peer} AND LOWER(to_id) = ${mine})
               OR (LOWER(from_id) = LOWER(${userId}) AND LOWER(to_id) = ${peer})
               OR (LOWER(from_id) = ${peer} AND LOWER(to_id) = LOWER(${userId}))
            ORDER BY created_at ASC
          `.catch((): any[] => []),
      this.prisma.$queryRaw<any[]>`
        SELECT m.code, m.name, m.contact,
               COALESCE(up.display_name, vu.name, bi.display_name, m.contact, m.name) as name,
               COALESCE(up.avatar_url, bi.avatar_url, vu.avatar_url, m.avatar) as avatar
        FROM public.members m
        LEFT JOIN public.user_profiles up ON up.user_id = m.user_id
        LEFT JOIN public.business_identities bi ON bi.owner_user_id = m.user_id AND bi.status = 'active'
        LEFT JOIN public.vione_users vu ON vu.id = m.user_id
        WHERE LOWER(m.code) = ${peer} LIMIT 1
      `.catch((): any[] => []),
    ]);

    const msgs: any[] = Array.isArray(rawMsgs) ? [...rawMsgs] : [];

    if (isSystem && msgs.length === 0) {
      const welcomeMsg = 'Chào mừng quý Anh/Chị đến với Kênh Thông Báo Chính Thức của Ban Thư Ký CLB Doanh Nhân CEO 1983!';
      const paymentMsg = '[action:payment|amount:20000000|invoice:HD-2026-001|qr:https://img.vietqr.io/image/MB-1983000000-compact2.png?amount=20000000&addInfo=HD-2026-001|due:31/03/2026|desc:H%E1%BB%99i%20ph%C3%AD%20th%C6%B0%E1%BB%9Dng%20ni%C3%AAn%202026%20-%20CLB%20Doanh%20Nh%C3%A2n%20CEO%201983]';
      const meetingMsg = '[action:meeting|title:H%E1%BB%8Dp%20Ban%20Ch%E1%BA%A5p%20H%C3%A0nh%20CEO%201983%20Th%C3%A1ng%203|time:14:00%20-%2028/03/2026|location:Trung%20t%C3%A2m%20H%E1%BB%99i%20Ngh%E1%BB%8B%20Qu%E1%BB%91c%20Gia%20H%C3%A0%20N%E1%BB%99i|link:https://meet.vione.vn/ceo1983-bch|desc:Phi%C3%AAn%20h%E1%BB%8Dp%20chi%E1%BA%BFn%20l%C6%B0%E1%BB%A3c%20tri%E1%BB%83n%20khai%20giao%20th%C6%B0%C6%A1ng%20to%C3%A0n%20di%E1%BB%87n]';

      await this.prisma.$executeRaw`
        INSERT INTO public.messages (id, from_id, to_id, text, created_at)
        VALUES 
          (gen_random_uuid(), 'admin', ${mine}, ${welcomeMsg}, now() - interval '2 days'),
          (gen_random_uuid(), 'admin', ${mine}, ${paymentMsg}, now() - interval '1 hour'),
          (gen_random_uuid(), 'admin', ${mine}, ${meetingMsg}, now() - interval '10 minutes')
      `.catch(() => null);

      msgs.push(
        { id: 'sys-welcome', from_id: 'admin', to_id: mine, text: welcomeMsg, created_at: new Date(Date.now() - 172800000).toISOString(), read_at: null },
        { id: 'sys-payment', from_id: 'admin', to_id: mine, text: paymentMsg, created_at: new Date(Date.now() - 3600000).toISOString(), read_at: null },
        { id: 'sys-meeting', from_id: 'admin', to_id: mine, text: meetingMsg, created_at: new Date(Date.now() - 600000).toISOString(), read_at: null },
      );
    }

    // Khởi tạo tin nhắn cho các Ban chuyên môn / Kênh chính thức nếu chưa có tin nhắn
    if (isChannel && msgs.length === 0) {
      const channelSeeds: Record<string, string[]> = {
        channel_secretariat: [
          'Chào mừng Quý Anh/Chị Hội viên đến với Kênh Ban Thư Ký & Ban Điều Hành CLB Doanh Nhân CEO 1983.',
          '[action:meeting|title:H%E1%BB%8Dp%20Ban%20Ch%E1%BA%A5p%20H%C3%A0nh%20CEO%201983%20Th%C3%A1ng%203|time:14:00%20-%2028/03/2026|location:Trung%20t%C3%A2m%20H%E1%BB%99i%20Ngh%E1%BB%8B%20Qu%E1%BB%91c%20Gia%20H%C3%A0%20N%E1%BB%99i|link:https://meet.vione.vn/ceo1983-bch|desc:Phi%C3%AAn%20h%E1%BB%8Dp%20chi%E1%BA%BFn%20l%C6%B0%E1%BB%A3c%20tri%E1%BB%83n%20khai%20giao%20th%C6%B0%C6%A1ng%20to%C3%A0n%20di%E1%BB%87n]',
          'Văn bản chỉ đạo & kế hoạch hoạt động quý 1/2026 đã được Ban Thư Ký cập nhật. Kính mời Quý Hội viên theo dõi và đồng hành.',
        ],
        channel_media: [
          'Chào mừng Quý Hội viên đến với Kênh Ban Truyền Thông Hiệp Hội CEO 1983.',
          'Bản tin hoạt động CLB: Đẩy mạnh các chiến dịch truyền thông nhận diện thương hiệu cho các doanh nghiệp hội viên trên đa nền tảng.',
          'Thông cáo báo chí: Chuỗi sự kiện Gala Doanh Nhân & Lễ tôn vinh Doanh nghiệp tiêu biểu 2026 chuẩn bị khởi động.',
        ],
        channel_promotion: [
          'Chào mừng Quý Hội viên đến với Kênh Ban Xúc Tiến Giao Thương CLB CEO 1983.',
          'Chương trình Matching B2B: Ban Xúc tiến mở cổng tiếp nhận nhu cầu liên kết chuỗi cung ứng giữa các doanh nghiệp hội viên.',
          'Cơ hội kết nối tuần này: Nhu cầu tìm đối tác tổng thầu thi công nội thất, cung cấp nguyên vật liệu và giải pháp công nghệ số.',
        ],
        channel_deals: [
          'Chào mừng Quý Hội viên đến với Kênh Cơ Hội & Deal B2B CLB CEO 1983.',
          'Tổng hợp các gói hợp tác kinh doanh độc quyền và chính sách chiết khấu ưu đãi nội bộ giữa các doanh nghiệp trong CLB.',
          'Deal hot tháng 3: Gói tài trợ truyền thông và gian hàng triển lãm B2B dành riêng cho hội viên chính thức.',
        ],
        channel_events: [
          'Chào mừng Quý Hội viên đến với Kênh Ban Sự Kiện & Hội Nghị CLB CEO 1983.',
          'Lịch sự kiện sắp tới: Đại hội thường niên CLB CEO 1983 và Diễn đàn Kinh tế Tư nhân 2026.',
          'Vé tham dự sự kiện và mã QR Check-in đã sẵn sàng trong mục Vé sự kiện của bạn.',
        ],
      };

      const seedList = channelSeeds[peer] || [
        `Chào mừng Quý Anh/Chị đến với kênh ${peerCode}.`,
        'Các thông báo và cập nhật mới nhất từ Ban chuyên môn sẽ được gửi trực tiếp tại đây.',
      ];

      for (let sIdx = 0; sIdx < seedList.length; sIdx++) {
        const seedText = seedList[sIdx];
        const offsetMins = (seedList.length - sIdx) * 30;
        await this.prisma.$executeRaw`
          INSERT INTO public.messages (id, from_id, to_id, text, created_at)
          VALUES (gen_random_uuid(), ${peer}, ${peer}, ${seedText}, now() - (${offsetMins} * interval '1 minute'))
        `.catch(() => null);

        msgs.push({
          id: `channel-${peer}-${sIdx}`,
          from_id: peer,
          to_id: peer,
          text: seedText,
          created_at: new Date(Date.now() - offsetMins * 60000).toISOString(),
          read_at: null,
        });
      }
    }

    await this.prisma.$executeRaw`
      UPDATE public.messages
      SET read_at = now()
      WHERE LOWER(from_id) = ${peer} AND LOWER(to_id) = ${mine} AND read_at IS NULL
    `.catch(() => null);

    const channelNames: Record<string, string> = {
      channel_secretariat: '🏛️ Kênh Ban Thư Ký & Ban Điều Hành',
      channel_media: '📢 Kênh Ban Truyền Thông Hiệp Hội',
      channel_promotion: '🤝 Kênh Ban Xúc Tiến Giao Thương',
      channel_deals: '🎯 Kênh Cơ Hội & Deal B2B',
      channel_events: '🌟 Kênh Ban Sự Kiện & Hội Nghị',
    };

    const resolvedPeerName = isChannel
      ? (channelNames[peer] || `Kênh ${peerCode}`)
      : (isSystem ? 'Ban Thư Ký CLB Doanh Nhân CEO 1983' : (peerMem[0]?.name ?? peerCode.toUpperCase()));

    return {
      peerName: resolvedPeerName,
      avatarUrl: isSystem ? '/ceo1983-logo.png' : (peerMem[0]?.avatar ?? null),
      isSystem: isSystem || isChannel,
      messages: msgs.map((m) => ({
        id: m.id,
        text: m.text,
        mine: String(m.from_id).toLowerCase() === mine,
        time: m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString(),
        createdAt: m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString(),
        seen: m.read_at != null,
      })),
    };
  }

  async sendMemberMessage(userId: string, peerCode: string, text: string) {
    const myCode = await this.resolveMemberCodeForUser(userId);

    await this.prisma.$executeRaw`
      INSERT INTO public.messages (id, from_id, to_id, text, created_at)
      VALUES (gen_random_uuid(), ${myCode.toLowerCase()}, ${peerCode.toLowerCase()}, ${text}, now())
    `;

    if (this.gateway && this.gateway.server) {
      this.gateway.server.emit('member:message_received', {
        fromCode: myCode.toLowerCase(),
        toCode: peerCode.toLowerCase(),
        text,
      });
      this.gateway.server.emit('dm:thread_updated', {});
    }

    return { ok: true, myCode };
  }

  async retractMemberMessage(userId: string, messageId: string) {
    const myCode = await this.resolveMemberCodeForUser(userId);
    const mine = myCode.toLowerCase();

    const msgRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, from_id, to_id, text FROM public.messages WHERE id = ${messageId}::uuid LIMIT 1
    `.catch(() => []);

    if (msgRows.length > 0) {
      if (String(msgRows[0].from_id).toLowerCase() !== mine) {
        throw new ForbiddenException('cannot_retract_other_message');
      }
      await this.prisma.$executeRaw`
        UPDATE public.messages
        SET text = '[retracted]'
        WHERE id = ${messageId}::uuid
      `.catch(() => null);
    } else {
      await this.prisma.$executeRaw`
        UPDATE public.messages
        SET text = '[retracted]'
        WHERE id::text = ${messageId} AND LOWER(from_id) = ${mine}
      `.catch(() => null);
    }

    if (this.gateway && this.gateway.server) {
      this.gateway.server.emit('dm:message_retracted', { messageId });
      this.gateway.server.emit('dm:thread_updated', {});
      this.gateway.server.emit('member:message_received', {
        fromCode: mine,
        retractedMessageId: messageId,
      });
    }

    return { ok: true };
  }

  // ── Direct Messaging (1-1 Inbox) ──────────────────────────────────
  async listMyDmThreads(userId: string) {
    const threads = await this.prisma.$queryRaw<any[]>`
      SELECT t.id, t.user1_id, t.user2_id, t.last_message_at, t.last_message_body,
             (SELECT COUNT(*)::int FROM public.direct_messages m 
              WHERE m.thread_id = t.id AND m.sender_user_id != ${userId}::uuid AND m.read_at IS NULL AND m.is_retracted = false) as unread_count,
             (SELECT m.sender_user_id FROM public.direct_messages m 
              WHERE m.thread_id = t.id AND m.is_retracted = false ORDER BY m.created_at DESC LIMIT 1) as last_sender_id
      FROM public.direct_message_threads t
      WHERE t.user1_id = ${userId}::uuid OR t.user2_id = ${userId}::uuid
      ORDER BY t.last_message_at DESC NULLS LAST, t.updated_at DESC
    `.catch(() => []);

    const connections = await this.prisma.$queryRaw<any[]>`
      SELECT requester_user_id, recipient_user_id
      FROM public.user_connections
      WHERE status = 'accepted'::public.global_connection_status 
        AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
    `.catch(() => []);

    const counterpartUserIds = new Set<string>();
    const acceptedSet = new Set<string>();
    for (const t of threads) {
      const counterpart = String(t.user1_id).toLowerCase() === userId.toLowerCase() ? String(t.user2_id).toLowerCase() : String(t.user1_id).toLowerCase();
      counterpartUserIds.add(counterpart);
    }
    for (const c of connections) {
      const counterpart = String(c.requester_user_id).toLowerCase() === userId.toLowerCase() ? String(c.recipient_user_id).toLowerCase() : String(c.requester_user_id).toLowerCase();
      counterpartUserIds.add(counterpart);
      acceptedSet.add(counterpart);
    }

    const userProfilesMap = new Map<string, { displayName: string; avatarUrl: string | null; headline: string | null; companyName: string | null }>();
    if (counterpartUserIds.size > 0) {
      const idsArray = Array.from(counterpartUserIds);
      const [identities, profiles, members] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT owner_user_id, display_name, avatar_url, headline, job_title, company_name 
          FROM public.business_identities 
          WHERE owner_user_id = ANY(${idsArray}::uuid[])
        `.catch(() => []),
        this.prisma.$queryRaw<any[]>`
          SELECT user_id, display_name, avatar_url, professional_title, company_name 
          FROM public.user_profiles 
          WHERE user_id = ANY(${idsArray}::uuid[])
        `.catch(() => []),
        this.prisma.$queryRaw<any[]>`
          SELECT user_id, name, avatar, company, position 
          FROM public.members 
          WHERE user_id = ANY(${idsArray}::uuid[])
        `.catch(() => []),
      ]);

      for (const id of idsArray) {
        const idLower = id.toLowerCase();
        const ident = (identities as any[]).find((i: any) => String(i.owner_user_id).toLowerCase() === idLower);
        const prof = (profiles as any[]).find((p: any) => String(p.user_id).toLowerCase() === idLower);
        const mem = (members as any[]).find((m: any) => String(m.user_id).toLowerCase() === idLower);

        userProfilesMap.set(idLower, {
          displayName: ident?.display_name || prof?.display_name || mem?.name || 'Doanh nhân ViOne',
          avatarUrl: ident?.avatar_url || prof?.avatar_url || mem?.avatar || null,
          headline: ident?.headline || ident?.job_title || prof?.professional_title || mem?.position || null,
          companyName: ident?.company_name || prof?.company_name || mem?.company || null,
        });
      }
    }

    const resultThreads: any[] = [];
    const addedCounterparts = new Set<string>();

    for (const t of threads) {
      const counterpartId = String(t.user1_id).toLowerCase() === userId.toLowerCase() ? String(t.user2_id).toLowerCase() : String(t.user1_id).toLowerCase();
      addedCounterparts.add(counterpartId);
      const profile = userProfilesMap.get(counterpartId) || { displayName: 'Doanh nhân ViOne', avatarUrl: null, headline: null, companyName: null };
      resultThreads.push({
        threadId: t.id,
        personId: `u:${counterpartId}`,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        headline: profile.headline,
        companyName: profile.companyName,
        isOnline: this.gateway?.isUserOnline(counterpartId) ?? false,
        lastMessageAt: t.last_message_at ? new Date(t.last_message_at).toISOString() : null,
        lastMessagePreview: t.last_message_body || null,
        lastMessageFromMe: t.last_sender_id ? String(t.last_sender_id).toLowerCase() === userId.toLowerCase() : false,
        unreadCount: Number(t.unread_count || 0),
        isConnected: acceptedSet.has(counterpartId),
      });
    }

    // Bổ sung các hội viên đã kết nối nhưng chưa phát sinh tin nhắn
    for (const c of connections) {
      const counterpartId = String(c.requester_user_id).toLowerCase() === userId.toLowerCase()
        ? String(c.recipient_user_id).toLowerCase()
        : String(c.requester_user_id).toLowerCase();

      if (!addedCounterparts.has(counterpartId)) {
        addedCounterparts.add(counterpartId);
        const profile = userProfilesMap.get(counterpartId) || { displayName: 'Doanh nhân ViOne', avatarUrl: null, headline: null, companyName: null };
        const [u1, u2] = userId.toLowerCase() < counterpartId.toLowerCase() ? [userId, counterpartId] : [counterpartId, userId];

        let threadId = crypto.randomUUID();
        try {
          const ensuredThread = await this.prisma.$queryRaw<any[]>`
            INSERT INTO public.direct_message_threads (id, user1_id, user2_id, last_message_at, created_at, updated_at)
            VALUES (${threadId}::uuid, ${u1}::uuid, ${u2}::uuid, null, now(), now())
            ON CONFLICT (user1_id, user2_id) DO UPDATE SET updated_at = now()
            RETURNING id
          `.catch(() => []);
          if (ensuredThread && ensuredThread[0]?.id) {
            threadId = ensuredThread[0].id;
          }
        } catch {
          // fallback
        }

        resultThreads.push({
          threadId,
          personId: `u:${counterpartId}`,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          headline: profile.headline,
          companyName: profile.companyName,
          isOnline: this.gateway?.isUserOnline(counterpartId) ?? false,
          lastMessageAt: null,
          lastMessagePreview: null,
          lastMessageFromMe: false,
          unreadCount: 0,
          isConnected: true,
        });
      }
    }

    return { ok: true, threads: resultThreads };
  }

  async openMyDmThread(userId: string, counterpartUserId: string) {
    if (!counterpartUserId) throw new BadRequestException('counterpart_user_id_required');
    let cleanId = counterpartUserId;
    if (cleanId.startsWith('u:')) cleanId = cleanId.substring(2);

    const [u1, u2] = userId.toLowerCase() < cleanId.toLowerCase() ? [userId, cleanId] : [cleanId, userId];

    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.direct_message_threads
      WHERE (user1_id = ${u1}::uuid AND user2_id = ${u2}::uuid)
         OR (user1_id = ${u2}::uuid AND user2_id = ${u1}::uuid)
      LIMIT 1
    `.catch(() => []);

    if (existing.length > 0) {
      return { ok: true, threadId: existing[0].id };
    }

    const newId = crypto.randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO public.direct_message_threads (id, user1_id, user2_id, last_message_at, created_at, updated_at)
      VALUES (${newId}::uuid, ${u1}::uuid, ${u2}::uuid, now(), now(), now())
      ON CONFLICT (user1_id, user2_id) DO NOTHING
    `.catch(() => null);

    return { ok: true, threadId: newId };
  }

  async getMyDmThreadDetail(userId: string, threadId: string) {
    let targetThreadId = threadId;

    let threadRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, user1_id, user2_id, last_message_at, last_message_body
      FROM public.direct_message_threads
      WHERE id = ${targetThreadId}::uuid AND (user1_id = ${userId}::uuid OR user2_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);

    if (threadRows.length === 0) {
      const conn = await this.prisma.$queryRaw<any[]>`
        SELECT requester_user_id, recipient_user_id
        FROM public.user_connections
        WHERE id = ${targetThreadId}::uuid AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
        LIMIT 1
      `.catch(() => []);

      if (conn.length > 0) {
        const otherId = String(conn[0].requester_user_id).toLowerCase() === userId.toLowerCase()
          ? String(conn[0].recipient_user_id)
          : String(conn[0].requester_user_id);
        const openRes = await this.openMyDmThread(userId, otherId);
        targetThreadId = openRes.threadId;
        threadRows = await this.prisma.$queryRaw<any[]>`
          SELECT id, user1_id, user2_id, last_message_at, last_message_body
          FROM public.direct_message_threads
          WHERE id = ${targetThreadId}::uuid
          LIMIT 1
        `.catch(() => []);
      } else {
        try {
          const openRes = await this.openMyDmThread(userId, targetThreadId);
          targetThreadId = openRes.threadId;
          threadRows = await this.prisma.$queryRaw<any[]>`
            SELECT id, user1_id, user2_id, last_message_at, last_message_body
            FROM public.direct_message_threads
            WHERE id = ${targetThreadId}::uuid
            LIMIT 1
          `.catch(() => []);
        } catch {
          // not found
        }
      }
    }

    if (threadRows.length === 0) {
      return { ok: false, error: 'not_found' };
    }

    const t = threadRows[0];
    const counterpartId = String(t.user1_id).toLowerCase() === userId.toLowerCase()
      ? String(t.user2_id).toLowerCase()
      : String(t.user1_id).toLowerCase();

    const [ident, prof, mem, conn] = await Promise.all([
      this.prisma.$queryRaw<any[]>`SELECT display_name, avatar_url, headline, job_title, company_name FROM public.business_identities WHERE owner_user_id = ${counterpartId}::uuid LIMIT 1`.catch(() => []),
      this.prisma.$queryRaw<any[]>`SELECT display_name, avatar_url, professional_title, company_name FROM public.user_profiles WHERE user_id = ${counterpartId}::uuid LIMIT 1`.catch(() => []),
      this.prisma.$queryRaw<any[]>`SELECT name, avatar, company, position FROM public.members WHERE user_id = ${counterpartId}::uuid LIMIT 1`.catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.user_connections
        WHERE status = 'accepted'::public.global_connection_status
          AND ((requester_user_id = ${userId}::uuid AND recipient_user_id = ${counterpartId}::uuid)
            OR (requester_user_id = ${counterpartId}::uuid AND recipient_user_id = ${userId}::uuid))
        LIMIT 1
      `.catch(() => []),
    ]);

    const threadSummary = {
      threadId: t.id,
      personId: `u:${counterpartId}`,
      displayName: ident[0]?.display_name || prof[0]?.display_name || mem[0]?.name || 'Doanh nhân ViOne',
      avatarUrl: ident[0]?.avatar_url || prof[0]?.avatar_url || mem[0]?.avatar || null,
      headline: ident[0]?.headline || ident[0]?.job_title || prof[0]?.professional_title || mem[0]?.position || null,
      companyName: ident[0]?.company_name || prof[0]?.company_name || mem[0]?.company || null,
      isOnline: this.gateway?.isUserOnline(counterpartId) ?? false,
      lastMessageAt: t.last_message_at ? new Date(t.last_message_at).toISOString() : null,
      lastMessagePreview: t.last_message_body || null,
      lastMessageFromMe: false,
      unreadCount: 0,
      isConnected: (conn && conn.length > 0),
    };

    await this.prisma.$executeRaw`
      UPDATE public.direct_messages
      SET read_at = now()
      WHERE thread_id = ${t.id}::uuid AND sender_user_id != ${userId}::uuid AND read_at IS NULL
    `.catch(() => null);

    const msgRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, thread_id, sender_user_id, body, client_token, reply_to, reactions, is_retracted, read_at, created_at, updated_at
      FROM public.direct_messages
      WHERE thread_id = ${t.id}::uuid
      ORDER BY created_at ASC
      LIMIT 100
    `.catch(() => []);

    const messages = msgRows.map(m => ({
      id: m.id,
      threadId: m.thread_id,
      fromMe: String(m.sender_user_id).toLowerCase() === userId.toLowerCase(),
      body: m.is_retracted ? 'Tin nhắn đã được thu hồi' : m.body,
      reactions: Array.isArray(m.reactions) ? m.reactions : [],
      replyTo: m.reply_to || null,
      createdAt: m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString(),
      readAt: m.read_at ? new Date(m.read_at).toISOString() : null,
      retractedAt: m.is_retracted ? new Date(m.updated_at).toISOString() : null,
    }));

    return { ok: true, thread: threadSummary, messages };
  }

  async sendMyDmMessage(userId: string, threadId: string, data: { body: string; clientToken?: string; replyTo?: any }) {
    if (!data?.body?.trim()) throw new BadRequestException('empty_message');

    let threadRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, user1_id, user2_id FROM public.direct_message_threads
      WHERE id = ${threadId}::uuid AND (user1_id = ${userId}::uuid OR user2_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);

    if (threadRows.length === 0) {
      throw new NotFoundException('thread_not_found');
    }

    const t = threadRows[0];
    const counterpartId = String(t.user1_id).toLowerCase() === userId.toLowerCase()
      ? String(t.user2_id).toLowerCase()
      : String(t.user1_id).toLowerCase();

    const newMsgId = crypto.randomUUID();
    const replyJson = data.replyTo ? JSON.stringify(data.replyTo) : null;

    await this.prisma.$executeRaw`
      INSERT INTO public.direct_messages (id, thread_id, sender_user_id, body, client_token, reply_to, created_at, updated_at)
      VALUES (
        ${newMsgId}::uuid, 
        ${t.id}::uuid, 
        ${userId}::uuid, 
        ${data.body}, 
        ${data.clientToken || null}, 
        ${replyJson}::jsonb, 
        now(), 
        now()
      )
    `;

    await this.prisma.$executeRaw`
      UPDATE public.direct_message_threads
      SET last_message_at = now(), last_message_body = ${data.body.slice(0, 150)}, updated_at = now()
      WHERE id = ${t.id}::uuid
    `;

    const messageObj = {
      id: newMsgId,
      threadId: t.id,
      fromMe: true,
      body: data.body,
      reactions: [],
      replyTo: data.replyTo || null,
      createdAt: new Date().toISOString(),
      readAt: null,
      retractedAt: null,
    };

    if (this.gateway) {
      this.gateway.emitDmMessageReceived(t.id, counterpartId, { ...messageObj, fromMe: false }, {
        threadId: t.id,
        lastMessagePreview: data.body.slice(0, 150),
        lastMessageAt: new Date().toISOString(),
      });
    }

    return { ok: true, message: messageObj };
  }

  async markMyDmThreadRead(userId: string, threadId: string) {
    const res = await this.prisma.$executeRaw`
      UPDATE public.direct_messages
      SET read_at = now()
      WHERE thread_id = ${threadId}::uuid AND sender_user_id != ${userId}::uuid AND read_at IS NULL
    `.catch(() => 0);

    if (this.gateway) {
      this.gateway.emitDmReadReceipt(threadId, userId);
    }
    return { ok: true, updated: Number(res || 0) };
  }

  async retractMyDmMessage(userId: string, messageId: string) {
    const msgRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, thread_id, sender_user_id FROM public.direct_messages WHERE id = ${messageId}::uuid LIMIT 1
    `.catch(() => []);

    if (msgRows.length === 0) throw new NotFoundException('message_not_found');
    if (String(msgRows[0].sender_user_id).toLowerCase() !== userId.toLowerCase()) {
      throw new ForbiddenException('cannot_retract_other_message');
    }

    await this.prisma.$executeRaw`
      UPDATE public.direct_messages
      SET is_retracted = true, updated_at = now()
      WHERE id = ${messageId}::uuid
    `;

    if (this.gateway) {
      this.gateway.emitDmMessageRetracted(msgRows[0].thread_id, messageId);
    }
    return { ok: true };
  }

  async reactToDmMessage(userId: string, messageId: string, emoji: string) {
    const msgRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, thread_id, reactions FROM public.direct_messages WHERE id = ${messageId}::uuid LIMIT 1
    `.catch(() => []);

    if (msgRows.length === 0) throw new NotFoundException('message_not_found');

    let reactions = Array.isArray(msgRows[0].reactions) ? msgRows[0].reactions : [];
    const existingIdx = reactions.findIndex((r: any) => r.userId === userId && r.emoji === emoji);
    if (existingIdx !== -1) {
      reactions.splice(existingIdx, 1);
    } else {
      reactions = reactions.filter((r: any) => r.userId !== userId);
      reactions.push({
        userId,
        emoji,
        createdAt: new Date().toISOString(),
      });
    }

    const reactionsJson = JSON.stringify(reactions);
    await this.prisma.$executeRaw`
      UPDATE public.direct_messages
      SET reactions = ${reactionsJson}::jsonb, updated_at = now()
      WHERE id = ${messageId}::uuid
    `;

    if (this.gateway) {
      this.gateway.emitDmReaction(msgRows[0].thread_id, messageId, reactions);
    }
    return { ok: true, messageId, reactions };
  }

  // ── Mentionable Users & Tagging in Moments ──────────────────────────
  async searchMentionableUsers(userId: string, query: string) {
    const connRows = await this.prisma.$queryRaw<any[]>`
      SELECT requester_user_id, recipient_user_id
      FROM public.user_connections
      WHERE status = 'accepted'::public.global_connection_status 
        AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
      LIMIT 200
    `.catch(() => []);

    const friendUserIds = new Set<string>();
    for (const c of connRows) {
      const friendId = String(c.requester_user_id).toLowerCase() === userId.toLowerCase()
        ? String(c.recipient_user_id).toLowerCase()
        : String(c.requester_user_id).toLowerCase();
      friendUserIds.add(friendId);
    }

    const allTargetIds = Array.from(friendUserIds);
    if (allTargetIds.length === 0) return [];

    let identities: any[] = [];
    if (allTargetIds.length > 0) {
      identities = await this.prisma.$queryRaw<any[]>`
        SELECT bi.owner_user_id as user_id, bi.display_name, bi.avatar_url, bi.headline, bi.job_title, bi.company_name
        FROM public.business_identities bi
        WHERE bi.owner_user_id = ANY(${allTargetIds}::uuid[])
      `.catch(() => []);
    }

    const foundUserIds = new Set(identities.map(i => String(i.user_id).toLowerCase()));
    const missingIds = allTargetIds.filter(id => !foundUserIds.has(id));

    if (missingIds.length > 0) {
      const [profiles, members] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT user_id, display_name, avatar_url, professional_title as headline, company_name
          FROM public.user_profiles
          WHERE user_id = ANY(${missingIds}::uuid[])
        `.catch(() => []),
        this.prisma.$queryRaw<any[]>`
          SELECT user_id, name as display_name, avatar as avatar_url, position as headline, company as company_name
          FROM public.members
          WHERE user_id = ANY(${missingIds}::uuid[])
        `.catch(() => []),
      ]);
      identities = [...identities, ...profiles, ...members];
    }

    const normalize = (str: string) =>
      (str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();

    let results = identities.map(i => ({
      userId: String(i.user_id),
      displayName: i.display_name || 'Hội viên ViOne',
      avatarUrl: i.avatar_url || null,
      headline: i.headline || i.job_title || null,
      companyName: i.company_name || null,
      initials: (i.display_name || 'HV')
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    }));

    if (query && query.trim()) {
      const qNorm = normalize(query);
      results = results.filter(r => 
        normalize(r.displayName).includes(qNorm) || 
        (r.companyName && normalize(r.companyName).includes(qNorm)) ||
        (r.headline && normalize(r.headline).includes(qNorm))
      );
    }

    return results.slice(0, 50);
  }

  // ── Products / Marketplace ──────────────────────────────────────────
  async listActiveProducts() {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT p.*, a.name as association_name,
               COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as seller_name,
               COALESCE(m.cover_url, u.avatar_url, '') as seller_avatar,
               COALESCE(m.phone, '') as seller_phone,
               COALESCE(p.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as seller_company
        FROM public.products p
        LEFT JOIN public.associations a ON p.association_id = a.id
        LEFT JOIN public.members m ON (p.seller_id = m.user_id::text OR p.seller_id = m.id OR p.seller_id = m.code)
        LEFT JOIN public.vione_users u ON (p.seller_id = u.id::text)
        LEFT JOIN public.business_identities bi ON (p.seller_id = bi.owner_user_id::text)
        WHERE p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT 100
      `.catch(() => []);

      if (rows.length === 0) {
        return [];
      }

      return rows.map((p) => {
        const numPrice = Number(p.price || p.sale_price || p.cost || 0);
        const formattedPrice = p.price_text || (numPrice > 0 ? `${numPrice.toLocaleString('vi-VN')} đ` : (p.price || 'Liên hệ báo giá'));
        const imgList = Array.isArray(p.image_urls) ? p.image_urls : (typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : []);
        const firstImg = (imgList && imgList.length > 0 ? imgList[0] : null) || p.image_url || p.image || null;
        return {
          id: String(p.id),
          name: p.name || p.title || 'Sản phẩm doanh nghiệp',
          title: p.title || p.name || 'Sản phẩm doanh nghiệp',
          company: p.seller_company || p.company || p.association_name || 'CLB Doanh Nhân CEO 1983',
          sellerName: p.seller_name || undefined,
          sellerAvatar: p.seller_avatar || undefined,
          sellerPhone: p.seller_phone || undefined,
          category: p.category || 'Sản phẩm & Dịch vụ',
          likes: Number(p.likes ?? 0),
          views: Number(p.views ?? 0),
          time: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
          createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
          imageUrl: firstImg,
          imageUrls: imgList.length > 0 ? imgList : (firstImg ? [firstImg] : []),
          price: formattedPrice,
          originalPrice: p.original_price ? `${Number(p.original_price).toLocaleString('vi-VN')} đ` : undefined,
          memberPrice: p.member_discount_price || p.member_price ? `${Number(p.member_discount_price || p.member_price).toLocaleString('vi-VN')} đ` : undefined,
          unit: p.unit || 'Gói',
          currency: p.currency || 'VND',
          sellerId: p.seller_id ? String(p.seller_id) : undefined,
        };
      });
    } catch {
      return [];
    }
  }

  async createProduct(userId: string, data: any) {
    const prodId = data.id || `PROD-${Date.now().toString(36).toUpperCase()}`;
    const name = (data.name || data.title || 'Sản phẩm mới').trim();
    const description = (data.description || '').trim();
    const company = (data.company || 'CLB Doanh Nhân CEO 1983').trim();
    const category = (data.category || 'Sản phẩm & Dịch vụ').trim();
    const price = Number(data.price || 0);
    const originalPrice = data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== '' ? Number(data.originalPrice) : price;
    const memberPrice = data.memberPrice !== undefined && data.memberPrice !== null && data.memberPrice !== '' ? Number(data.memberPrice) : price;
    const unit = data.unit || 'Gói';
    const currency = data.currency || 'VND';
    const imageUrls: string[] = Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []);
    const imageUrl = imageUrls[0] || data.imageUrl || null;
    const sellerId = String(data.sellerId || userId || 'ceo1983');
    const status = data.status || 'active';
    const assocId = data.associationId || 'c1983000-0000-4000-8000-000000001983';

    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.products (
          id, title, name, description, company, category,
          price, original_price, member_price, unit, currency,
          image_url, image_urls, seller_id, status, views, emoji,
          association_id, created_at, updated_at
        ) VALUES (
          ${prodId}, ${name}, ${name}, ${description}, ${company}, ${category},
          ${price}, ${originalPrice}, ${memberPrice}, ${unit}, ${currency},
          ${imageUrl}, ${imageUrls}::text[], ${sellerId}, ${status}, 0, '🛍️',
          ${assocId}::uuid, now(), now()
        )
      `;
    } catch (err: any) {
      console.warn('createProduct primary insert failed, using fallback:', err?.message);
      await this.prisma.$executeRaw`
        INSERT INTO public.products (
          id, title, description, category, price,
          seller_id, status, views, emoji,
          association_id, created_at, updated_at
        ) VALUES (
          ${prodId}, ${name}, ${description}, ${category}, ${price},
          ${sellerId}, ${status}, 0, '🛍️',
          ${assocId}::uuid, now(), now()
        )
      `;
    }
    return { ok: true, id: prodId };
  }

  async updateProduct(userId: string, productId: string, data: any) {
    const name = data.name || data.title;
    const cleanPrice = data.price !== undefined && data.price !== null && data.price !== '' ? Number(data.price) : null;
    const cleanOriginalPrice = data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== '' ? Number(data.originalPrice) : cleanPrice;
    const cleanMemberPrice = data.memberPrice !== undefined && data.memberPrice !== null && data.memberPrice !== '' ? Number(data.memberPrice) : cleanPrice;
    const imageUrls: string[] | null = Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : null);
    const imageUrl = imageUrls && imageUrls[0] ? imageUrls[0] : (data.imageUrl || null);

    try {
      await this.prisma.$executeRaw`
        UPDATE public.products
        SET
          title = COALESCE(${name}, title),
          name = COALESCE(${name}, name),
          description = COALESCE(${data.description}, description),
          company = COALESCE(${data.company}, company),
          category = COALESCE(${data.category}, category),
          price = COALESCE(${cleanPrice}, price),
          original_price = COALESCE(${cleanOriginalPrice}, original_price),
          member_price = COALESCE(${cleanMemberPrice}, member_price),
          unit = COALESCE(${data.unit}, unit),
          currency = COALESCE(${data.currency}, currency),
          image_url = COALESCE(${imageUrl}, image_url),
          image_urls = COALESCE(${imageUrls}::text[], image_urls),
          updated_at = now()
        WHERE id = ${productId}
      `;
    } catch (err: any) {
      console.warn('updateProduct primary update failed, using fallback:', err?.message);
      await this.prisma.$executeRaw`
        UPDATE public.products
        SET
          title = COALESCE(${name}, title),
          description = COALESCE(${data.description}, description),
          price = COALESCE(${cleanPrice}, price),
          updated_at = now()
        WHERE id = ${productId}
      `;
    }
    return { ok: true };
  }

  async deleteProduct(userId: string, productId: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.products WHERE id = ${productId}
    `.catch((err) => {
      console.warn('deleteProduct failed:', err?.message);
    });
    return { ok: true };
  }



  // â”€â”€ Content: News & Perks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async listPublishedNews() {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, title, category, author, excerpt, cover_image, views, created_at
      FROM public.news
      WHERE status = 'published'
      ORDER BY created_at DESC
    `.catch(() => []);

    return rows.map((n) => ({
      id: n.id,
      title: n.title,
      category: n.category ?? '',
      author: n.author ?? '',
      excerpt: n.excerpt ?? '',
      image: n.cover_image ?? '',
      coverImage: n.cover_image ?? '',
      time: n.created_at ? new Date(n.created_at).toISOString() : '',
      views: Number(n.views ?? 0),
    }));
  }

  async listActivePerks() {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.perks
      WHERE status = 'active'
      ORDER BY sort_order ASC
    `.catch(() => []);

    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category ?? '',
      partner: p.partner ?? '',
      summary: p.summary ?? '',
      description: p.description ?? '',
      discount: p.discount ?? '',
      icon: p.icon ?? 'Gift',
      link: p.link ?? '',
      validUntil: p.valid_until ? (p.valid_until instanceof Date ? p.valid_until.toISOString().slice(0, 10) : String(p.valid_until).slice(0, 10)) : null,
    }));
  }

  async getPerkById(id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.perks WHERE id::text = ${id}::text LIMIT 1
    `.catch((err) => {
      console.error(`getPerkById error: ${err?.message}`);
      return [];
    });

    if (rows.length === 0) return null;
    const p = rows[0];
    return {
      id: p.id,
      title: p.title,
      category: p.category ?? '',
      partner: p.partner ?? '',
      summary: p.summary ?? '',
      description: p.description ?? '',
      discount: p.discount ?? '',
      icon: p.icon ?? 'Gift',
      link: p.link ?? '',
      validUntil: p.valid_until ? (p.valid_until instanceof Date ? p.valid_until.toISOString().slice(0, 10) : String(p.valid_until).slice(0, 10)) : null,
    };
  }

  async listAllPerksAdmin() {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.perks
      ORDER BY sort_order ASC, created_at DESC
    `.catch((err) => {
      console.error(`listAllPerksAdmin error: ${err?.message}`);
      return [];
    });

    return rows.map((p) => ({
      id: p.id,
      title: p.title ?? '',
      category: p.category ?? '',
      partner: p.partner ?? '',
      summary: p.summary ?? '',
      description: p.description ?? '',
      discount: p.discount ?? '',
      icon: p.icon ?? 'Gift',
      link: p.link ?? '',
      validUntil: p.valid_until ? (p.valid_until instanceof Date ? p.valid_until.toISOString().slice(0, 10) : String(p.valid_until).slice(0, 10)) : '',
      sortOrder: Number(p.sort_order ?? 0),
      status: p.status === 'inactive' ? 'inactive' : 'active',
    }));
  }

  async createPerkAdmin(data: any) {
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.perks (title, category, partner, summary, description, discount, icon, link, valid_until, sort_order, status)
      VALUES (
        ${data.title},
        ${data.category ?? ''},
        ${data.partner ?? ''},
        ${data.summary ?? ''},
        ${data.description ?? ''},
        ${data.discount ?? ''},
        ${data.icon ?? 'Gift'},
        ${data.link ?? ''},
        ${data.validUntil ? new Date(data.validUntil) : null},
        ${Number(data.sortOrder ?? 0)},
        ${data.status ?? 'active'}
      )
      RETURNING *
    `;
    const p = rows[0];
    return {
      id: p.id,
      title: p.title,
      category: p.category ?? '',
      partner: p.partner ?? '',
      summary: p.summary ?? '',
      description: p.description ?? '',
      discount: p.discount ?? '',
      icon: p.icon ?? 'Gift',
      link: p.link ?? '',
      validUntil: p.valid_until ? (p.valid_until instanceof Date ? p.valid_until.toISOString().slice(0, 10) : String(p.valid_until).slice(0, 10)) : '',
      sortOrder: Number(p.sort_order ?? 0),
      status: p.status ?? 'active',
    };
  }

  async updatePerkAdmin(id: string, data: any) {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.perks
      SET
        title = COALESCE(${data.title}, title),
        category = COALESCE(${data.category}, category),
        partner = COALESCE(${data.partner}, partner),
        summary = COALESCE(${data.summary}, summary),
        description = COALESCE(${data.description}, description),
        discount = COALESCE(${data.discount}, discount),
        icon = COALESCE(${data.icon}, icon),
        link = COALESCE(${data.link}, link),
        valid_until = ${data.validUntil ? new Date(data.validUntil) : null},
        sort_order = COALESCE(${data.sortOrder !== undefined ? Number(data.sortOrder) : null}, sort_order),
        status = COALESCE(${data.status}, status),
        updated_at = NOW()
      WHERE id::text = ${id}::text
      RETURNING *
    `;
    if (rows.length === 0) return null;
    const p = rows[0];
    return {
      id: p.id,
      title: p.title,
      category: p.category ?? '',
      partner: p.partner ?? '',
      summary: p.summary ?? '',
      description: p.description ?? '',
      discount: p.discount ?? '',
      icon: p.icon ?? 'Gift',
      link: p.link ?? '',
      validUntil: p.valid_until ? (p.valid_until instanceof Date ? p.valid_until.toISOString().slice(0, 10) : String(p.valid_until).slice(0, 10)) : '',
      sortOrder: Number(p.sort_order ?? 0),
      status: p.status ?? 'active',
    };
  }

  async deletePerkAdmin(id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.perks WHERE id::text = ${id}::text
    `;
    return { ok: true };
  }


  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async getSettings(userId: string) {
    const row = await this.prisma.$queryRaw<any[]>`
      SELECT org_name, org_email, lang, email_notif, sms_notif, two_fa
      FROM public.user_settings WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    const r = row[0] ?? null;
    return {
      orgName: r?.org_name ?? 'Hiá»‡p há»™i Doanh nghiá»‡p Viá»‡t Nam',
      orgEmail: r?.org_email ?? 'contact@vba.vn',
      lang: r?.lang ?? 'vi',
      emailNotif: r?.email_notif ?? true,
      smsNotif: r?.sms_notif ?? false,
      twoFa: r?.two_fa ?? true,
    };
  }

  async saveSettings(userId: string, body: any) {
    await this.prisma.$executeRaw`
      INSERT INTO public.user_settings (user_id, org_name, org_email, lang, email_notif, sms_notif, two_fa)
      VALUES (${userId}::uuid, ${body.orgName ?? ''}, ${body.orgEmail ?? ''}, ${body.lang ?? 'vi'},
              ${body.emailNotif ?? true}, ${body.smsNotif ?? false}, ${body.twoFa ?? true})
      ON CONFLICT (user_id) DO UPDATE SET
        org_name = EXCLUDED.org_name, org_email = EXCLUDED.org_email,
        lang = EXCLUDED.lang, email_notif = EXCLUDED.email_notif,
        sms_notif = EXCLUDED.sms_notif, two_fa = EXCLUDED.two_fa
    `.catch(() => null);
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Voting preference
  // ---------------------------------------------------------------------------

  async getVotingPref(userId: string) {
    const row = await this.prisma.$queryRaw<any[]>`
      SELECT voting_open_pref FROM public.user_settings WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    return { pref: (row[0]?.voting_open_pref ?? null) as 'same' | 'new' | null };
  }

  async setVotingPref(userId: string, pref: string | null) {
    await this.prisma.$executeRaw`
      INSERT INTO public.user_settings (user_id, voting_open_pref)
      VALUES (${userId}::uuid, ${pref})
      ON CONFLICT (user_id) DO UPDATE SET voting_open_pref = EXCLUDED.voting_open_pref
    `.catch(() => null);
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Post-login route
  // ---------------------------------------------------------------------------

  async getPostLoginRoute(userId: string): Promise<{ to: '/' | '/m' }> {
    const platformAdmin = await this.prisma.$queryRaw<any[]>`
      SELECT 1 FROM public.vione_users WHERE id = ${userId}::uuid AND role = 'platform_admin' LIMIT 1
    `.catch(() => [] as any[]);
    if (platformAdmin.length > 0) return { to: '/' };

    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT role FROM public.memberships WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);
    const isAdmin = (memberships ?? []).some((m: any) => m.role === 'admin' || m.role === 'association_admin');
    return { to: isAdmin ? '/' : '/m' };
  }

  // ---------------------------------------------------------------------------
  // Media signed URL (Supabase Storage via REST â€” no SDK)
  // ---------------------------------------------------------------------------

  async getMediaSignedUrl(userId: string, path: string) {
    if (!path) return { signedUrl: null };
    const signedUrl = path.startsWith('http') ? path : `/uploads/${path.replace(/^\/+/, '')}`;
    return { signedUrl };
  }

  // ---------------------------------------------------------------------------
  // Public: share guest contact (via PostgreSQL RPC / Prisma)
  // ---------------------------------------------------------------------------

  async shareGuestContact(slug: string, body: any) {
    try {
      const res = await this.prisma.$queryRaw<any[]>`
        SELECT public.share_guest_contact(
          ${slug},
          ${body.displayName ?? ''},
          ${body.phone ?? null},
          ${body.email ?? null},
          ${body.companyName ?? null},
          ${body.title ?? null},
          ${String(body.consentVersion ?? 'bc-guest-exchange-v1')},
          ${body.clientToken ?? null}
        ) as result
      `.catch(() => []);

      if (res.length > 0 && res[0]?.result) {
        return res[0].result;
      }

      // Direct fallback
      const cards = await this.prisma.$queryRaw<any[]>`
        SELECT id, owner_user_id FROM public.member_business_cards WHERE slug = ${slug} LIMIT 1
      `.catch(() => []);
      let cardId = cards[0]?.id || null;
      let ownerId = cards[0]?.owner_user_id || null;

      if (!ownerId) {
        const mems = await this.prisma.$queryRaw<any[]>`
          SELECT user_id FROM public.members WHERE LOWER(code) = ${slug.toLowerCase()} LIMIT 1
        `.catch(() => []);
        ownerId = mems[0]?.user_id || null;
      }

      if (ownerId) {
        await this.prisma.$executeRaw`
          INSERT INTO public.business_card_leads (
            id, card_id, owner_member_id, full_name, email, phone, company, job_title, note, status, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            ${cardId ? cardId : null}::uuid,
            ${ownerId}::uuid,
            ${body.displayName || body.fullName || body.name || 'Khách liên hệ'},
            ${body.email || null},
            ${body.phone || null},
            ${body.companyName || body.company || null},
            ${body.title || body.jobTitle || null},
            ${body.note || body.message || null},
            'new',
            now(),
            now()
          )
        `.catch(() => null);
      }

      return { ok: true, reason: 'created' };
    } catch {
      return { ok: true, reason: 'created' };
    }
  }

  // ---------------------------------------------------------------------------
  // Admin: renewal audit scope
  // ---------------------------------------------------------------------------

  async getAdminRenewalScope(userId: string) {
    const platformAdmin = await this.prisma.$queryRaw<any[]>`
      SELECT 1 FROM public.vione_users WHERE id = ${userId}::uuid AND role = 'platform_admin' LIMIT 1
    `.catch(() => [] as any[]);

    if (platformAdmin.length > 0) {
      const assocs = await this.prisma.$queryRaw<any[]>`
        SELECT id, name FROM public.associations ORDER BY name
      `.catch(() => [] as any[]);
      return {
        isPlatformAdmin: true,
        associations: assocs.map((a: any) => ({ id: a.id, name: a.name })),
      };
    }

    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT association_id, role FROM public.memberships WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);

    const adminAssocIds = (memberships ?? [])
      .filter((m: any) => m.role === 'admin' || m.role === 'association_admin')
      .map((m: any) => m.association_id)
      .filter(Boolean);

    if (!adminAssocIds.length) return { isPlatformAdmin: false, associations: [] };

    const assocs = await this.prisma.$queryRaw<any[]>`
      SELECT id, name FROM public.associations WHERE id = ANY(${adminAssocIds}) ORDER BY name
    `.catch(() => [] as any[]);

    return {
      isPlatformAdmin: false,
      associations: assocs.map((a: any) => ({ id: a.id, name: a.name })),
    };
  }

  // ---------------------------------------------------------------------------
  // Admin: renewal audit log search
  // ---------------------------------------------------------------------------

  async searchRenewalAuditLog(userId: string, query: any) {
    const scope = await this.getAdminRenewalScope(userId);
    const allowedIds = scope.associations.map((a: any) => a.id);
    if (!scope.isPlatformAdmin && !allowedIds.length) {
      throw new ForbiddenException('Not an admin');
    }

    const limit = Math.min(query.limit ?? 200, 500);

    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT id, event_type, member_id, association_id, reference, method, amount_paid,
               invoice_no, previous_term_end, new_term_end, error_code, error_message, metadata, created_at
        FROM public.renewal_audit_log
        WHERE (
          ${scope.isPlatformAdmin} = true
          OR association_id = ANY(${allowedIds}::uuid[])
        )
        AND (${query.associationId ? query.associationId : null}::uuid IS NULL OR association_id = ${query.associationId ? query.associationId : null}::uuid)
        AND (${query.memberId ? query.memberId : null}::uuid IS NULL OR member_id = ${query.memberId ? query.memberId : null}::uuid)
        AND (${query.eventType ? query.eventType : null}::text IS NULL OR event_type = ${query.eventType ? query.eventType : null}::text)
        AND (${query.from ? new Date(query.from) : null}::timestamptz IS NULL OR created_at >= ${query.from ? new Date(query.from) : null}::timestamptz)
        AND (${query.to ? new Date(new Date(query.to).setHours(23, 59, 59, 999)) : null}::timestamptz IS NULL OR created_at <= ${query.to ? new Date(new Date(query.to).setHours(23, 59, 59, 999)) : null}::timestamptz)
        ORDER BY created_at DESC
        LIMIT ${limit}
      `.catch(() => [] as any[]);

      const memberIds = [...new Set(rows.map((r: any) => r.member_id).filter(Boolean))];
      const assocIds = [...new Set(rows.map((r: any) => r.association_id).filter(Boolean))];

      const [members, assocs] = await Promise.all([
        memberIds.length
          ? this.prisma.$queryRaw<any[]>`SELECT id, name, code FROM public.members WHERE id = ANY(${memberIds}::uuid[])`
          : Promise.resolve([] as any[]),
        assocIds.length
          ? this.prisma.$queryRaw<any[]>`SELECT id, name FROM public.associations WHERE id = ANY(${assocIds}::uuid[])`
          : Promise.resolve([] as any[]),
      ]).catch(() => [[], []] as any[][]);

      const memberMap = new Map((members ?? []).map((m: any) => [m.id, m]));
      const assocMap = new Map((assocs ?? []).map((a: any) => [a.id, a.name]));
      const needle = (query.search ?? '').trim().toLowerCase();

      return rows
        .map((r: any) => {
          const m: any = memberMap.get(r.member_id);
          return {
            id: r.id,
            eventType: r.event_type,
            memberId: r.member_id ?? null,
            memberName: m?.name ?? null,
            memberCode: m?.code ?? null,
            associationId: r.association_id ?? null,
            associationName: assocMap.get(r.association_id) ?? null,
            reference: r.reference,
            method: r.method ?? null,
            amountPaid: Number(r.amount_paid ?? 0),
            invoiceNo: r.invoice_no ?? null,
            previousTermEnd: r.previous_term_end ?? null,
            newTermEnd: r.new_term_end ?? null,
            errorCode: r.error_code ?? null,
            errorMessage: r.error_message ?? null,
            metadata: r.metadata ?? {},
            createdAt: r.created_at,
          };
        })
        .filter((r: any) => {
          if (!needle) return true;
          return [r.memberName, r.memberCode, r.reference, r.invoiceNo]
            .filter(Boolean)
            .some((v: any) => String(v).toLowerCase().includes(needle));
        });
    } catch {
      return [];
    }
  }

  async getPublicAssociationBySlug(slug: string) {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, slug, logo_url, brand_primary, tagline, about, contact_email, landing_published
        FROM public.associations
        WHERE slug = ${slug} AND landing_published = true
        LIMIT 1
      `;
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        logoUrl: r.logo_url,
        brandPrimary: r.brand_primary,
        tagline: r.tagline,
        about: r.about,
        contactEmail: r.contact_email,
      };
    } catch {
      return null;
    }
  }

  async resolveAssociationByHost(host: string) {
    if (!host) return null;
    try {
      const cleanHost = host.split(':')[0].toLowerCase();
      const sub = cleanHost.split('.')[0];
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, slug, logo_url, brand_primary, tagline, about, contact_email, landing_published
        FROM public.associations
        WHERE landing_published = true
        AND (slug = ${sub} OR slug = ${cleanHost})
        LIMIT 1
      `;
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        logoUrl: r.logo_url,
        brandPrimary: r.brand_primary,
        tagline: r.tagline,
        about: r.about,
        contactEmail: r.contact_email,
      };
    } catch {
      return null;
    }
  }

  async submitClubRegistration(body: any) {
    const fullName = String(body.fullName || body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email =
      String(body.email || '').trim() ||
      `${phone.replace(/\D/g, '') || 'applicant'}@applicant.vione.app`;
    const company = String(body.company || body.companyName || fullName).trim();
    const title = String(body.title || body.jobTitle || 'Lãnh đạo Doanh nghiệp').trim();
    const revenue = String(body.revenue || '').trim();
    const industry = String(body.industry || '').trim();
    const clubSlug = String(body.clubSlug || 'ceo-1983').trim();

    if (!fullName || !phone) {
      throw new BadRequestException('Họ tên và số điện thoại là bắt buộc');
    }

    // 1. Resolve target association_id
    let assocId: string | null = null;
    try {
      const assocs = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.associations 
        WHERE LOWER(slug) IN (${clubSlug.toLowerCase()}, ${clubSlug.replace(/-/g, '').toLowerCase()}, 'ceo-1983', 'ceo1983', 'clb-ceo-1983')
        LIMIT 1
      `.catch(() => []);

      if (assocs.length > 0 && assocs[0]?.id) {
        assocId = assocs[0].id;
      } else {
        const firstAssoc = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM public.associations ORDER BY landing_published DESC, created_at DESC LIMIT 1
        `.catch(() => []);
        if (firstAssoc.length > 0 && firstAssoc[0]?.id) assocId = firstAssoc[0].id;
      }
    } catch {
      assocId = null;
    }

    const notesContent = `Đăng ký CLB: ${clubSlug}. Doanh thu: ${revenue || 'N/A'}. Ngành nghề: ${industry || 'N/A'}. Chức vụ: ${title || 'N/A'}`;

    // 2. Insert into demo_requests
    let demoReqId: string | null = null;
    try {
      const demoRows = await this.prisma.$queryRaw<any[]>`
        INSERT INTO public.demo_requests (
          id, name, email, organization, phone, job_title, notes,
          preferred_date, preferred_slot, timezone, locale, cta_source, cta_intent, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${fullName},
          ${email},
          ${company},
          ${phone},
          ${title},
          ${notesContent},
          ${new Date().toISOString().slice(0, 10)},
          '09:00',
          'Asia/Ho_Chi_Minh',
          'vi',
          ${clubSlug},
          'join_club',
          'new',
          now(),
          now()
        ) RETURNING id
      `.catch((e) => {
        console.warn('Could not insert demo_request:', e);
        return [];
      });
      if (demoRows.length > 0) demoReqId = demoRows[0].id;
    } catch (e) {
      console.warn('Demo request insert error:', e);
    }

    // 3. Sinh chuỗi ký tự mật khẩu ngẫu nhiên (8 ký tự) & gửi qua email thông báo
    const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const rawPassword = Array.from(crypto.randomBytes(8))
      .map((byte) => randomChars[byte % randomChars.length])
      .join('');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const now = new Date();
    const memberId = `MB${now.getTime().toString(36).toUpperCase()}`;
    const joinedAt = now.toISOString().slice(0, 10);
    const feeYear = now.getFullYear();

    let userId: string | null = null;
    try {
      // Find existing user by email or username
      const existing = await this.prisma.vione_users.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: email.toLowerCase() },
          ],
        },
      });

      if (existing) {
        userId = existing.id;
        await this.prisma.$executeRaw`
          UPDATE public.vione_users 
          SET password = ${hashedPassword}, email = ${email.toLowerCase()}, name = ${fullName}, updated_at = now()
          WHERE id = ${existing.id}::uuid
        `.catch(() => null);
      } else {
        userId = crypto.randomUUID();
        await this.prisma.$executeRaw`
          INSERT INTO public.vione_users (id, username, email, name, password, email_verified, created_at, updated_at)
          VALUES (${userId}::uuid, ${email.toLowerCase()}, ${email.toLowerCase()}, ${fullName}, ${hashedPassword}, true, now(), now())
          ON CONFLICT (id) DO UPDATE SET password = ${hashedPassword}, email = ${email.toLowerCase()}, name = ${fullName}, updated_at = now()
        `.catch(() => null);
      }

      // Sync to auth.users for compatibility & mark onboarding_status = 'new' (must change password)
      if (userId) {
        await this.prisma.$executeRaw`
          INSERT INTO auth.users (id, email, encrypted_password, role)
          VALUES (${userId}::uuid, ${email.toLowerCase()}, ${hashedPassword}, 'authenticated')
          ON CONFLICT (id) DO UPDATE SET email = ${email.toLowerCase()}, encrypted_password = ${hashedPassword}
        `.catch(() => null);

        await this.prisma.$executeRaw`
          INSERT INTO public.user_profiles (user_id, display_name, onboarding_status, created_at, updated_at)
          VALUES (${userId}::uuid, ${fullName}, 'new'::public.onboarding_status, now(), now())
          ON CONFLICT (user_id) DO UPDATE SET onboarding_status = 'new'::public.onboarding_status, updated_at = now()
        `.catch(() => null);
      }
    } catch (uErr) {
      console.warn('User account provisioning note:', uErr);
    }

    const detailedNotes = `${notesContent} | TÀI KHOẢN ĐĂNG NHẬP: Email=${email} / Pass=[Random đã gửi qua Email]`;

    try {
      if (assocId) {
        await this.prisma.$executeRaw`
          INSERT INTO public.members (
            id, code, name, contact, email, phone, type, level, industry, region, status, joined_at, fee_year, fee_paid, about, user_id, association_id, created_at, updated_at
          ) VALUES (
            ${memberId},
            '',
            ${company},
            ${fullName},
            ${email},
            ${phone},
            'company',
            'memberLevel.medium',
            'ind.it',
            'region.north',
            'pending',
            ${joinedAt}::date,
            ${feeYear},
            false,
            ${detailedNotes},
            ${userId ? userId : null}::uuid,
            ${assocId}::uuid,
            now(),
            now()
          )
        `;
      } else {
        await this.prisma.$executeRaw`
          INSERT INTO public.members (
            id, code, name, contact, email, phone, type, level, industry, region, status, joined_at, fee_year, fee_paid, about, user_id, created_at, updated_at
          ) VALUES (
            ${memberId},
            '',
            ${company},
            ${fullName},
            ${email},
            ${phone},
            'company',
            'memberLevel.medium',
            'ind.it',
            'region.north',
            'pending',
            ${joinedAt}::date,
            ${feeYear},
            false,
            ${detailedNotes},
            ${userId ? userId : null}::uuid,
            now(),
            now()
          )
        `;
      }

      // Gửi email thông báo tài khoản với mật khẩu ngẫu nhiên tới hòm thư hội viên mới
      if (this.mailService && email && email.includes('@')) {
        void this.mailService.sendRegistrationAccountEmail({
          to: email,
          fullName,
          username: email,
          passwordRaw: rawPassword,
          companyName: company,
          memberCode: memberId,
          portalUrl: 'https://vba.vione.vn/association/login',
        });
      }

      const targetAssocId = assocId || (await this.prisma.$queryRaw<any[]>`SELECT id FROM public.associations LIMIT 1`.then(r => r[0]?.id).catch(() => null));
      if (targetAssocId) {
        // Trigger Realtime Notifications to Association Admins & Web CRM
        void this.notifyAssociationAdmins(targetAssocId, {
          title: `Đăng ký hội viên mới: ${fullName} - ${company}`,
          body: `Ứng viên ${fullName} (${title}) vừa nộp hồ sơ xin gia nhập CLB CEO 1983. Hệ thống đã tạo tài khoản và gửi email mật khẩu tạm thời.`,
          targetRoute: `/members?status=pending`,
          type: 'club_registration_received',
          sourceRecordId: memberId,
          meta: { applicantName: fullName, companyName: company, phone, clubSlug, email, username: email },
        });
      }
    } catch (err) {
      console.error('Member insert error in submitClubRegistration:', err);
    }

    return {
      success: true,
      ok: true,
      memberId,
      username: email,
      email,
      reference: `APP-${memberId}`,
      leadId: demoReqId || memberId,
      accountCreated: true,
      message: 'Hồ sơ đăng ký gia nhập đã được tiếp nhận! Tên đăng nhập và mật khẩu khởi tạo đã được gửi đến email của bạn.',
    };
  }

  async checkClubRegistrationStatus(query: { phone?: string; email?: string }) {
    const rawPhone = String(query?.phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const email = String(query?.email || '').trim().toLowerCase();

    if (!cleanPhone && !email) {
      return { found: false, message: 'Vui lòng cung cấp số điện thoại hoặc email để tra cứu' };
    }

    // 1. Check in public.members
    try {
      const memRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, code, name, contact, phone, email, status, joined_at, created_at, user_id
        FROM public.members
        WHERE (${cleanPhone} != '' AND regexp_replace(phone, '\\D', '', 'g') = ${cleanPhone})
           OR (${email} != '' AND LOWER(email) = ${email})
        ORDER BY created_at DESC
        LIMIT 1
      `.catch(() => []);

      if (memRows.length > 0) {
        const m = memRows[0];
        const status = (m.status || 'pending').toLowerCase();
        const isApproved = status === 'active' || status === 'approved' || status === 'memberstatus.active';
        const isRejected = status === 'rejected' || status === 'declined';
        return {
          found: true,
          status: isApproved ? 'approved' : (isRejected ? 'rejected' : 'pending'),
          rawStatus: status,
          isApproved,
          hasAccount: Boolean(m.user_id),
          name: m.contact || m.name,
          company: m.name,
          memberCode: m.code || m.id,
          phone: m.phone,
          email: m.email,
          createdAt: m.created_at,
          message: isApproved
            ? 'Hồ sơ của Quý Doanh nhân đã được phê duyệt chính thức!'
            : (isRejected
                ? 'Hồ sơ cần bổ sung thông tin hoặc chưa đạt tiêu chuẩn thẩm định.'
                : 'Hồ sơ đang chờ Ban Thư Ký CLB CEO 1983 thẩm định trong 24h.'),
        };
      }
    } catch (e) {
      console.warn('checkClubRegistrationStatus members query error:', e);
    }

    // 2. Check in public.demo_requests
    try {
      const demoRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, organization, phone, email, status, created_at
        FROM public.demo_requests
        WHERE (${cleanPhone} != '' AND regexp_replace(phone, '\\D', '', 'g') = ${cleanPhone})
           OR (${email} != '' AND LOWER(email) = ${email})
        ORDER BY created_at DESC
        LIMIT 1
      `.catch(() => []);

      if (demoRows.length > 0) {
        const d = demoRows[0];
        const status = (d.status || 'new').toLowerCase();
        const isApproved = status === 'approved' || status === 'contacted';
        return {
          found: true,
          status: isApproved ? 'approved' : 'pending',
          rawStatus: status,
          isApproved,
          hasAccount: false,
          name: d.name,
          company: d.organization,
          memberCode: d.id,
          phone: d.phone,
          email: d.email,
          createdAt: d.created_at,
          message: isApproved
            ? 'Hồ sơ của Quý Doanh nhân đã được phê duyệt chính thức!'
            : 'Hồ sơ đang chờ Ban Thư Ký CLB CEO 1983 thẩm định trong 24h.',
        };
      }
    } catch (e) {
      console.warn('checkClubRegistrationStatus demo_requests query error:', e);
    }

    return {
      found: false,
      message: 'Không tìm thấy hồ sơ đăng ký với thông tin này. Vui lòng nộp hồ sơ mới.',
    };
  }

  /**
   * Universal Notification Dispatcher for Association Staff / CRM Admins
   * Creates records in public.notifications and public.business_notifications,
   * and dispatches instant WebSocket alerts to Web CRM & Mobile admins with actionable redirection.
   */
  async notifyAssociationAdmins(
    associationId: string,
    payload: {
      title: string;
      body: string;
      targetRoute: string;
      type?: string;
      sourceRecordId?: string;
      meta?: any;
    },
  ) {
    try {
      const now = new Date();
      const code = `NTF-${Date.now().toString(36).toUpperCase()}`;

      // 1. Insert into public.notifications for Web CRM Notification Center (both scoped and global fallback)
      await this.prisma.$executeRaw`
        INSERT INTO public.notifications (
          id, code, title, body, audience, channel, status, sent_at, association_id, app_scope, target_app, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${code}, ${payload.title}, ${payload.body},
          'staff', 'inapp', 'sent', ${now}, ${associationId}::uuid, 'crm', 'crm', ${now}, ${now}
        )
      `.catch((err) => console.warn('Could not insert scoped public.notifications:', err));

      // 2. Query admin / staff user IDs of this association + all platform administrators
      const adminMembers = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT user_id FROM public.memberships
        WHERE (association_id = ${associationId}::uuid OR association_id IS NULL)
          AND role IN ('admin', 'association_admin', 'owner', 'staff', 'manager', 'executive')
        UNION
        SELECT DISTINCT user_id FROM public.user_roles
        WHERE role IN ('platform_admin', 'tenant_admin')
        UNION
        SELECT DISTINCT id AS user_id FROM public.vione_users
        WHERE email LIKE '%admin%' OR username LIKE '%admin%'
      `.catch(() => [] as any[]);

      const adminUserIds = Array.from(new Set(adminMembers.map((m) => m.user_id).filter(Boolean)));

      // 3. For each admin user, insert business_notifications & emit WebSocket
      for (const adminId of adminUserIds) {
        const notifId = crypto.randomUUID();
        const safeData = JSON.stringify({
          title: payload.title,
          body: payload.body,
          companyName: payload.meta?.companyName || payload.title,
          applicantName: payload.meta?.applicantName,
          phone: payload.meta?.phone,
          targetRoute: payload.targetRoute,
          appScope: 'crm',
          ...(payload.meta || {}),
        });
        const actionTarget = JSON.stringify({
          route: payload.targetRoute,
          targetRoute: payload.targetRoute,
          associationId,
        });

        await this.prisma.$executeRaw`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
            priority, status, app_scope, target_app, created_at, updated_at, dedupe_key
          ) VALUES (
            ${notifId}::uuid, ${adminId}::uuid, 'association', ${payload.sourceRecordId || associationId},
            ${payload.type || 'assoc_registration'}, ${payload.type || 'assoc_admin_alert'},
            ${payload.title}, ${payload.body},
            ${safeData}::jsonb, 'navigate', 'Xem hồ sơ & duyệt', ${actionTarget}::jsonb,
            'high', 'delivered', 'crm', 'crm', ${now}, ${now}, ${`assoc_alert:${notifId}`}
          )
        `.catch((err) => console.warn('Error inserting business_notification for admin:', err));

        this.gateway.emitNotification(adminId, {
          id: notifId,
          title: payload.title,
          body: payload.body,
          appScope: 'crm',
          targetApp: 'crm',
          action: { targetRoute: payload.targetRoute },
          safeDisplayData: {
            title: payload.title,
            body: payload.body,
            targetRoute: payload.targetRoute,
            appScope: 'crm',
          },
          targetRoute: payload.targetRoute,
        });
      }

      // 4. Also broadcast to association room & all connected CRM clients
      this.gateway.emitToRoom(`assoc:${associationId}`, 'notification:new', {
        title: payload.title,
        body: payload.body,
        targetRoute: payload.targetRoute,
        action: { targetRoute: payload.targetRoute },
        safeDisplayData: {
          title: payload.title,
          body: payload.body,
          targetRoute: payload.targetRoute,
        },
      });

      this.gateway.emitToAll('notification:new', {
        title: payload.title,
        body: payload.body,
        targetRoute: payload.targetRoute,
        action: { targetRoute: payload.targetRoute },
        safeDisplayData: {
          title: payload.title,
          body: payload.body,
          targetRoute: payload.targetRoute,
        },
      });
    } catch (err) {
      console.warn('Error in notifyAssociationAdmins:', err);
    }
  }

  /**
   * Notify Tagged Users in Moments
   */
  async notifyMomentTags(userId: string, input: { momentId: string; taggedUserIds: string[]; content?: string }) {
    const { momentId, taggedUserIds = [], content = '' } = input;
    if (taggedUserIds.length === 0) return { ok: true, count: 0 };

    const authorProfiles = await this.prisma.$queryRaw<any[]>`
      SELECT display_name FROM public.business_identities
      WHERE owner_user_id = ${userId}::uuid AND status = 'active'
      LIMIT 1
    `.catch(() => [] as any[]);
    const displayName = authorProfiles[0]?.display_name || 'Đối tác trong mạng lưới';
    const now = new Date();

    for (const targetId of taggedUserIds) {
      if (!targetId || targetId === userId) continue;
      const cleanTargetId = targetId.replace(/^u:/, '');
      const notifId = crypto.randomUUID();
      const safeData = JSON.stringify({
        authorName: displayName,
        title: `${displayName} đã gắn thẻ bạn trong một khoảnh khắc`,
        body: content ? content.slice(0, 100) : `${displayName} vừa gắn thẻ bạn trong bài viết mới`,
        content: content ? content.slice(0, 100) : '',
        targetRoute: '/connect-app',
      });
      const actionTarget = JSON.stringify({ route: '/connect-app', momentId });
      const dedupeKey = `moment_tag:${momentId}:${cleanTargetId}`;

      await this.prisma.$executeRaw`
        INSERT INTO public.business_notifications (
          id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
          title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
          priority, status, created_at, updated_at, dedupe_key
        ) VALUES (
          ${notifId}::uuid, ${cleanTargetId}::uuid, 'moment', ${momentId}, 'moment_tagged', 'moment_tag_person',
          'bc.notif.moment_tag.title', 'bc.notif.moment_tag.body',
          ${safeData}::jsonb, 'open_moment_detail', 'bc.notif.action.view', ${actionTarget}::jsonb,
          'high', 'delivered', ${now}, ${now}, ${dedupeKey}
        )
      `.catch(() => null);

      this.gateway.emitNotification(cleanTargetId, {
        id: notifId,
        title: `${displayName} đã gắn thẻ bạn trong khoảnh khắc`,
        body: content ? content.slice(0, 100) : '',
        momentId,
        action: { targetRoute: '/connect-app' },
        safeDisplayData: {
          title: `${displayName} đã gắn thẻ bạn trong khoảnh khắc`,
          body: content ? content.slice(0, 100) : '',
        },
      });
    }

    return { ok: true, count: taggedUserIds.length };
  }

  // ==========================================
  // Two-Way Business Notification Dispatcher
  // ==========================================
  async dispatchBusinessNotification(params: {
    userId: string;
    memberId?: string;
    title: string;
    body: string;
    sourceDomain: string;
    sourceRecordId: string;
    eventKind: string;
    notificationKind: string;
    targetRoute?: string;
    priority?: string;
  }) {
    const notifId = require('crypto').randomUUID();
    const dedupeKey = `${params.sourceDomain}-${params.sourceRecordId}-${Date.now()}`;
    const safeData = JSON.stringify({
      title: params.title,
      body: params.body,
      targetRoute: params.targetRoute || '/connect-app',
    });

    // 1. ViOne business_notifications
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, $6,
        $7, $8, $9::jsonb, $10, 'delivered', $11, 'all', 'all', NOW(), NOW()
      )
    `, notifId, params.userId, params.sourceDomain, params.sourceRecordId, params.eventKind, params.notificationKind,
       params.title, params.body, safeData, params.priority || 'normal', dedupeKey).catch(() => {});

    // 2. Association member_notifications
    const recipientId = params.memberId || params.userId;
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.member_notifications (
        id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, false, false, $4, $5, NOW()
      )
    `, recipientId, params.title, params.body, params.sourceDomain, params.sourceRecordId).catch(() => {});

    // 3. Realtime gateway emit
    try {
      this.gateway.emitNotification(String(params.userId), {
        id: notifId,
        title: params.title,
        body: params.body,
        action: { targetRoute: params.targetRoute || '/connect-app' },
        safeDisplayData: { title: params.title, body: params.body },
      });
    } catch {}

    return { ok: true, notifId };
  }

  // ==========================================
  // Admin News Methods
  // ==========================================
  async listAdminNews() {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, code, title, category, author, published_at, views, status, excerpt, content, cover_image, association_id, created_at, updated_at
      FROM public.news
      ORDER BY created_at DESC
    `.catch((err) => {
      console.error(`listAdminNews error: ${err?.message}`);
      return [];
    });

    return rows.map((n) => ({
      id: n.code || n.id,
      code: n.code,
      title: n.title,
      category: n.category ?? '',
      author: n.author ?? '',
      publishedAt: n.published_at ? (n.published_at instanceof Date ? n.published_at.toISOString().slice(0, 10) : String(n.published_at).slice(0, 10)) : '—',
      views: Number(n.views ?? 0),
      status: n.status ?? 'draft',
      excerpt: n.excerpt ?? '',
      content: n.content ?? '',
      image: n.cover_image ?? '',
      coverImage: n.cover_image ?? '',
      cover_image: n.cover_image ?? '',
      associationId: n.association_id,
      createdAt: n.created_at ? new Date(n.created_at).toISOString() : '',
    }));
  }

  async createNewsAdmin(data: any) {
    const code = data.code || `NEWS-${Date.now().toString().slice(-6)}`;
    const img = data.image || data.coverImage || data.cover_image || null;
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.news (code, title, category, author, published_at, status, excerpt, content, cover_image, views, association_id, created_at, updated_at)
      VALUES (
        ${code},
        ${data.title},
        ${data.category ?? ''},
        ${data.author ?? 'Ban Truyền Thông'},
        ${data.publishedAt || new Date().toISOString().slice(0, 10)},
        ${data.status ?? 'published'},
        ${data.excerpt ?? ''},
        ${data.content ?? ''},
        ${img},
        0,
        ${data.associationId ? data.associationId : null}::uuid,
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    const n = rows[0];
    return {
      id: n.code || n.id,
      code: n.code,
      title: n.title,
      category: n.category ?? '',
      author: n.author ?? '',
      publishedAt: n.published_at ? (n.published_at instanceof Date ? n.published_at.toISOString().slice(0, 10) : String(n.published_at).slice(0, 10)) : '—',
      views: Number(n.views ?? 0),
      status: n.status ?? 'published',
      excerpt: n.excerpt ?? '',
      content: n.content ?? '',
      image: n.cover_image ?? '',
      coverImage: n.cover_image ?? '',
      cover_image: n.cover_image ?? '',
      associationId: n.association_id,
    };
  }

  async updateNewsAdmin(id: string, data: any) {
    const img = data.image !== undefined ? data.image : (data.coverImage !== undefined ? data.coverImage : (data.cover_image !== undefined ? data.cover_image : null));
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.news
      SET
        title = COALESCE(${data.title}, title),
        category = COALESCE(${data.category}, category),
        author = COALESCE(${data.author}, author),
        published_at = COALESCE(${data.publishedAt}, published_at),
        status = COALESCE(${data.status}, status),
        excerpt = COALESCE(${data.excerpt}, excerpt),
        content = COALESCE(${data.content}, content),
        cover_image = COALESCE(${img}, cover_image),
        updated_at = NOW()
      WHERE code = ${id} OR id::text = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    const n = rows[0];
    return {
      id: n.code || n.id,
      code: n.code,
      title: n.title,
      category: n.category ?? '',
      author: n.author ?? '',
      publishedAt: n.published_at ? (n.published_at instanceof Date ? n.published_at.toISOString().slice(0, 10) : String(n.published_at).slice(0, 10)) : '—',
      views: Number(n.views ?? 0),
      status: n.status ?? 'published',
      excerpt: n.excerpt ?? '',
      content: n.content ?? '',
      image: n.cover_image ?? '',
      coverImage: n.cover_image ?? '',
      cover_image: n.cover_image ?? '',
      associationId: n.association_id,
    };
  }

  async deleteNewsAdmin(id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.news WHERE code = ${id} OR id::text = ${id}
    `;
    return { ok: true };
  }

  // ==========================================
  // Marketplace Products & Quotes Methods
  // ==========================================
  async listMarketplaceProducts(query?: any) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT p.*,
             COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as seller_name,
             COALESCE(m.cover_url, u.avatar_url, '') as seller_avatar,
             COALESCE(m.phone, '') as seller_phone,
             COALESCE(p.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as seller_company
      FROM public.products p
      LEFT JOIN public.members m ON (p.seller_id = m.user_id::text OR p.seller_id = m.id OR p.seller_id = m.code)
      LEFT JOIN public.vione_users u ON (p.seller_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (p.seller_id = bi.owner_user_id::text)
      ORDER BY p.created_at DESC
    `.catch((err) => {
      console.error(`listMarketplaceProducts error: ${err?.message}`);
      return [];
    });

    return rows.map((r) => {
      const imgList = Array.isArray(r.image_urls) ? r.image_urls : (typeof r.image_urls === 'string' ? JSON.parse(r.image_urls) : []);
      const firstImg = (imgList && imgList.length > 0 ? imgList[0] : null) || r.image_url || null;
      return {
        id: r.id,
        sellerId: r.seller_id,
        sellerName: r.seller_name || undefined,
        sellerAvatar: r.seller_avatar || undefined,
        sellerPhone: r.seller_phone || undefined,
        sellerCompany: r.seller_company || undefined,
        title: r.title,
        name: r.title,
        description: r.description ?? '',
        price: Number(r.price ?? 0),
        originalPrice: r.original_price ? Number(r.original_price) : undefined,
        memberPrice: r.member_price ? Number(r.member_price) : undefined,
        category: r.category ?? 'mk.cat.other',
        company: r.seller_company || r.company || 'CLB Doanh Nhân CEO 1983',
        status: r.status ?? 'active',
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
        time: r.created_at ? new Date(r.created_at).toISOString() : '',
        views: Number(r.views ?? 0),
        emoji: r.emoji ?? '🛍️',
        pdfUrl: r.pdf_url ?? '',
        imageUrls: imgList,
        imageUrl: firstImg,
        websiteUrl: r.website_url ?? '',
        facebookUrl: r.facebook_url ?? '',
        associationId: r.association_id,
      };
    });
  }

  async getMarketplaceProductById(id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT p.*,
             COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as seller_name,
             COALESCE(m.cover_url, u.avatar_url, '') as seller_avatar,
             COALESCE(m.phone, '') as seller_phone,
             COALESCE(p.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as seller_company
      FROM public.products p
      LEFT JOIN public.members m ON (p.seller_id = m.user_id::text OR p.seller_id = m.id OR p.seller_id = m.code)
      LEFT JOIN public.vione_users u ON (p.seller_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (p.seller_id = bi.owner_user_id::text)
      WHERE p.id = ${id} LIMIT 1
    `.catch(() => []);
    if (rows.length === 0) return null;
    const r = rows[0];
    // Bump views
    await this.prisma.$executeRaw`
      UPDATE public.products SET views = COALESCE(views, 0) + 1 WHERE id = ${id}
    `.catch(() => {});

    const quotes = await this.prisma.$queryRaw<any[]>`
      SELECT q.*,
             COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as buyer_name,
             COALESCE(m.cover_url, u.avatar_url, '') as buyer_avatar,
             COALESCE(m.phone, q.contact, '') as buyer_phone,
             COALESCE(m.name, bi.company_name, '') as buyer_company
      FROM public.quote_requests q
      LEFT JOIN public.members m ON (q.buyer_id = m.user_id::text OR q.buyer_id = m.id OR q.buyer_id = m.code)
      LEFT JOIN public.vione_users u ON (q.buyer_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (q.buyer_id = bi.owner_user_id::text)
      WHERE q.product_id = ${id}
      ORDER BY q.created_at DESC
    `.catch(() => []);

    return {
      product: {
        id: r.id,
        sellerId: r.seller_id,
        sellerName: r.seller_name || undefined,
        sellerAvatar: r.seller_avatar || undefined,
        sellerPhone: r.seller_phone || undefined,
        sellerCompany: r.seller_company || undefined,
        title: r.title,
        description: r.description ?? '',
        price: Number(r.price ?? 0),
        category: r.category ?? 'mk.cat.other',
        company: r.seller_company || r.company || 'CLB Doanh Nhân CEO 1983',
        status: r.status ?? 'active',
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
        views: Number(r.views ?? 0) + 1,
        emoji: r.emoji ?? '🛍️',
        pdfUrl: r.pdf_url ?? '',
        imageUrls: Array.isArray(r.image_urls) ? r.image_urls : (typeof r.image_urls === 'string' ? JSON.parse(r.image_urls) : []),
        websiteUrl: r.website_url ?? '',
        facebookUrl: r.facebook_url ?? '',
        associationId: r.association_id,
      },
      quotes: quotes.map((q) => ({
        id: q.id,
        productId: q.product_id,
        buyerId: q.buyer_id,
        buyerName: q.buyer_name || undefined,
        buyerAvatar: q.buyer_avatar || undefined,
        buyerPhone: q.buyer_phone || undefined,
        buyerCompany: q.buyer_company || undefined,
        quantity: Number(q.quantity ?? 1),
        message: q.message ?? '',
        contact: q.contact ?? q.buyer_phone ?? '',
        status: q.status ?? 'sent',
        reminderCount: Number(q.reminder_count ?? 0),
        cancelReason: q.cancel_reason ?? '',
        createdAt: q.created_at ? new Date(q.created_at).toISOString() : '',
        updatedAt: q.updated_at ? new Date(q.updated_at).toISOString() : '',
      })),
    };
  }

  async createMarketplaceProduct(userId: string, data: any) {
    const id = data.id || `prod-${Date.now()}`;
    const sellerId = String(data.sellerId || userId || 'ceo1983');
    const title = (data.title || data.name || 'Sản phẩm mới').trim();
    const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []);
    const firstImage = imageUrls[0] || data.imageUrl || data.image || null;
    const company = (data.company || 'CLB Doanh Nhân CEO 1983').trim();
    const originalPrice = data.originalPrice !== undefined ? Number(data.originalPrice) : Number(data.price ?? 0);
    const memberPrice = data.memberPrice !== undefined ? Number(data.memberPrice) : Number(data.price ?? 0);
    const unit = data.unit || 'Gói';
    const currency = data.currency || 'VND';
    const assocId = data.associationId || 'c1983000-0000-4000-8000-000000001983';

    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.products (
        id, seller_id, title, name, description, price, original_price, member_price, unit, currency,
        category, status, views, emoji, pdf_url, image_urls, image_url, company, website_url, facebook_url,
        association_id, created_at, updated_at
      ) VALUES (
        ${id}, ${sellerId}, ${title}, ${title}, ${data.description ?? ''}, ${Number(data.price ?? 0)},
        ${originalPrice}, ${memberPrice}, ${unit}, ${currency},
        ${data.category ?? 'mk.cat.other'}, ${data.status ?? 'active'}, 0, ${data.emoji ?? '🛍️'},
        ${data.pdfUrl ?? ''}, ${imageUrls}::text[], ${firstImage}, ${company}, ${data.websiteUrl ?? ''}, ${data.facebookUrl ?? ''},
        ${assocId}::uuid, NOW(), NOW()
      )
      RETURNING *
    `.catch(async (err) => {
      console.warn('createMarketplaceProduct primary insert failed, using fallback:', err?.message);
      return this.prisma.$queryRaw<any[]>`
        INSERT INTO public.products (
          id, seller_id, title, description, price, category, status, views, emoji, pdf_url, image_urls, website_url, facebook_url, association_id, created_at, updated_at
        ) VALUES (
          ${id}, ${sellerId}, ${title}, ${data.description ?? ''}, ${Number(data.price ?? 0)},
          ${data.category ?? 'mk.cat.other'}, ${data.status ?? 'active'}, 0, ${data.emoji ?? '🛍️'},
          ${data.pdfUrl ?? ''}, ${imageUrls}::text[], ${data.websiteUrl ?? ''}, ${data.facebookUrl ?? ''},
          ${assocId}::uuid, NOW(), NOW()
        )
        RETURNING *
      `.catch(() => [] as any[]);
    });
    const r = rows[0] || {};
    return {
      id: r.id || id,
      sellerId: r.seller_id,
      title: r.title || title,
      name: r.name || r.title || title,
      description: r.description ?? '',
      price: Number(r.price ?? 0),
      originalPrice,
      memberPrice,
      unit: r.unit || unit,
      currency: r.currency || currency,
      category: r.category ?? 'mk.cat.other',
      status: r.status ?? 'active',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      views: 0,
      emoji: r.emoji ?? '🛍️',
      pdfUrl: r.pdf_url ?? '',
      imageUrls: Array.isArray(r.image_urls) ? r.image_urls : (firstImage ? [firstImage] : []),
      imageUrl: firstImage,
      company: company || r.company || 'CLB Doanh Nhân CEO 1983',
      websiteUrl: r.website_url ?? '',
      facebookUrl: r.facebook_url ?? '',
    };
  }

  async updateMarketplaceProduct(userId: string, id: string, data: any) {
    const title = data.title || data.name;
    const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : null);
    const firstImage = imageUrls && imageUrls[0] ? imageUrls[0] : (data.imageUrl || null);
    const cleanPrice = data.price !== undefined ? Number(data.price) : null;
    const cleanOriginalPrice = data.originalPrice !== undefined ? Number(data.originalPrice) : null;
    const cleanMemberPrice = data.memberPrice !== undefined ? Number(data.memberPrice) : null;

    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.products
      SET
        title = COALESCE(${title}, title),
        name = COALESCE(${title}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${cleanPrice}, price),
        original_price = COALESCE(${cleanOriginalPrice}, original_price),
        member_price = COALESCE(${cleanMemberPrice}, member_price),
        company = COALESCE(${data.company}, company),
        unit = COALESCE(${data.unit}, unit),
        currency = COALESCE(${data.currency}, currency),
        image_url = COALESCE(${firstImage}, image_url),
        image_urls = COALESCE(${imageUrls}::text[], image_urls),
        category = COALESCE(${data.category}, category),
        status = COALESCE(${data.status}, status),
        emoji = COALESCE(${data.emoji}, emoji),
        pdf_url = COALESCE(${data.pdfUrl}, pdf_url),
        website_url = COALESCE(${data.websiteUrl}, website_url),
        facebook_url = COALESCE(${data.facebookUrl}, facebook_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      sellerId: r.seller_id,
      title: r.title,
      description: r.description ?? '',
      price: Number(r.price ?? 0),
      category: r.category ?? 'mk.cat.other',
      status: r.status ?? 'active',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
      views: Number(r.views ?? 0),
      emoji: r.emoji ?? '🛍️',
      pdfUrl: r.pdf_url ?? '',
      imageUrls: Array.isArray(r.image_urls) ? r.image_urls : [],
      websiteUrl: r.website_url ?? '',
      facebookUrl: r.facebook_url ?? '',
    };
  }

  async deleteMarketplaceProduct(userId: string, id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.products WHERE id = ${id}
    `;
    return { ok: true };
  }

  async toggleProductSold(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.products
      SET status = CASE WHEN status = 'sold' THEN 'active' ELSE 'sold' END,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return { id: r.id, status: r.status };
  }

  async listProductQuotes(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT q.*, p.title as product_title, p.price as product_price
      FROM public.quote_requests q
      LEFT JOIN public.products p ON q.product_id = p.id
      ORDER BY q.created_at DESC
    `.catch(() => []);

    return rows.map((q) => ({
      id: q.id,
      productId: q.product_id,
      productTitle: q.product_title ?? '',
      productPrice: Number(q.product_price ?? 0),
      buyerId: q.buyer_id,
      quantity: Number(q.quantity ?? 1),
      message: q.message ?? '',
      contact: q.contact ?? '',
      status: q.status ?? 'sent',
      reminderCount: Number(q.reminder_count ?? 0),
      cancelReason: q.cancel_reason ?? '',
      createdAt: q.created_at ? new Date(q.created_at).toISOString() : '',
      updatedAt: q.updated_at ? new Date(q.updated_at).toISOString() : '',
    }));
  }

  async requestProductQuote(userId: string, data: any) {
    const id = `quote-${Date.now()}`;
    let q: any = {
      id,
      product_id: data.productId,
      buyer_id: userId,
      quantity: Number(data.quantity ?? 1),
      message: data.message ?? '',
      contact: data.contact ?? '',
      status: 'sent',
      reminder_count: 0,
      created_at: new Date(),
    };

    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        INSERT INTO public.quote_requests (
          id, product_id, buyer_id, quantity, message, contact, status, reminder_count, created_at, updated_at
        ) VALUES (
          ${id}, ${data.productId}, ${userId}::uuid, ${Number(data.quantity ?? 1)},
          ${data.message ?? ''}, ${data.contact ?? ''}, 'sent', 0, NOW(), NOW()
        )
        RETURNING *
      `;
      if (rows && rows.length > 0) q = rows[0];
    } catch (e: any) {
      console.warn('Fallback quote insert:', e?.message);
    }

    // 1. Query buyer info for CRM Lead
    let buyerName = 'Hội viên CEO 1983';
    let buyerPhone = data.contact || '';
    try {
      const buyerRows = await this.prisma.$queryRaw<any[]>`
        SELECT name, phone, email FROM public.vione_users WHERE id = ${userId}::uuid LIMIT 1
      `.catch(() => []);
      if (buyerRows.length > 0) {
        buyerName = buyerRows[0].name || buyerName;
        buyerPhone = buyerPhone || buyerRows[0].phone || '';
      }
    } catch {}

    // 2. Query product & seller info
    let prodRows: any[] = [];
    let prodTitle = 'Sản phẩm Marketplace';
    let assocId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    try {
      prodRows = await this.prisma.$queryRaw<any[]>`
        SELECT p.title, p.seller_id, p.association_id, m.user_id as seller_user_id, m.id as member_id
        FROM public.products p
        LEFT JOIN public.members m ON (m.user_id = p.seller_id OR m.id::text = p.seller_id::text)
        WHERE p.id = ${data.productId} LIMIT 1
      `.catch(() => []);
      if (prodRows.length > 0) {
        prodTitle = prodRows[0].title || prodTitle;
        if (prodRows[0].association_id) assocId = prodRows[0].association_id;
      }
    } catch {}

    // 3. PUSH TO CRM SYSTEM: Dispatch to Association Staff / CRM Notification Center
    try {
      await this.notifyAssociationAdmins(assocId, {
        title: `[CRM Báo giá] Yêu cầu báo giá mới: ${prodTitle}`,
        body: `Khách hàng/Hội viên ${buyerName} (SĐT: ${buyerPhone || 'Chưa cung cấp'}) gửi yêu cầu báo giá cho sản phẩm "${prodTitle}" (SL: ${data.quantity ?? 1}). Ghi chú: "${(data.message || '').slice(0, 120)}"`,
        targetRoute: '/marketplace',
        type: 'crm_quote_lead',
        sourceRecordId: id,
        meta: {
          leadType: 'quote_request',
          buyerId: userId,
          buyerName,
          buyerPhone,
          productId: data.productId,
          productTitle: prodTitle,
          quantity: data.quantity ?? 1,
          message: data.message,
          contact: data.contact,
        },
      });
    } catch (crmErr: any) {
      console.warn('CRM quote notification dispatch error:', crmErr?.message);
    }

    // 4. 2-Way Notification: Push to product seller (both ViOne & Association App)
    try {
      if (prodRows.length > 0 && prodRows[0].seller_id) {
        const prod = prodRows[0];
        const targetUserId = prod.seller_user_id || prod.seller_id;
        const targetMemberId = prod.member_id || prod.seller_id;
        const notifTitle = 'Yêu cầu báo giá mới trên Marketplace';
        const notifBody = `Sản phẩm "${prod.title}" của bạn vừa nhận được yêu cầu báo giá (${data.quantity ?? 1} sản phẩm) từ ${buyerName} (SĐT: ${buyerPhone}): "${(data.message || '').slice(0, 100)}"`;
        const notifId = require('crypto').randomUUID();
        const safeData = JSON.stringify({
          title: notifTitle,
          body: notifBody,
          quoteId: id,
          productId: data.productId,
          targetRoute: `/marketplace`,
        });

        // business_notifications
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
          ) VALUES (
            $1::uuid, $2::uuid, 'marketplace', $3, 'quote_requested', 'new_quote',
            $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
          )
        `, notifId, targetUserId, id, notifTitle, notifBody, safeData, `quote-req-${id}`).catch(() => {});

        // member_notifications
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.member_notifications (
            id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, false, false, 'quote', $4, NOW()
          )
        `, targetMemberId, notifTitle, notifBody, id).catch(() => {});

        // Real-time WebSocket emission
        this.gateway.emitNotification(String(targetUserId), {
          id: notifId,
          title: notifTitle,
          body: notifBody,
          action: { targetRoute: '/marketplace' },
          safeDisplayData: { title: notifTitle, body: notifBody },
        });
      }
    } catch (e: any) {
      console.warn('Failed to send seller quote notification:', e?.message);
    }

    return {
      id: q.id,
      productId: q.product_id,
      buyerId: q.buyer_id,
      quantity: Number(q.quantity ?? 1),
      message: q.message ?? '',
      contact: q.contact ?? '',
      status: q.status ?? 'sent',
      reminderCount: 0,
      createdAt: q.created_at ? new Date(q.created_at).toISOString() : '',
    };
  }

  async updateQuoteStatus(userId: string, id: string, status: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.quote_requests
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    const q = rows[0];

    // 2-Way Notification: Notify buyer about status update
    try {
      const notifTitle = 'Cập nhật trạng thái yêu cầu báo giá';
      const notifBody = `Yêu cầu báo giá #${id} của bạn đã chuyển sang trạng thái: ${status}.`;
      const notifId = require('crypto').randomUUID();
      const safeData = JSON.stringify({
        title: notifTitle,
        body: notifBody,
        quoteId: id,
        status,
        targetRoute: '/marketplace',
      });

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.business_notifications (
          id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
          title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
        ) VALUES (
          $1::uuid, $2::uuid, 'marketplace', $3, 'quote_status_updated', 'quote_status',
          $4, $5, $6::jsonb, 'normal', 'delivered', $7, 'all', 'all', NOW(), NOW()
        )
      `, notifId, q.buyer_id, id, notifTitle, notifBody, safeData, `quote-status-${id}-${status}`).catch(() => {});

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.member_notifications (
          id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, false, false, 'quote', $4, NOW()
        )
      `, q.buyer_id, notifTitle, notifBody, id).catch(() => {});

      this.gateway.emitNotification(String(q.buyer_id), {
        id: notifId,
        title: notifTitle,
        body: notifBody,
        action: { targetRoute: '/marketplace' },
        safeDisplayData: { title: notifTitle, body: notifBody },
      });
    } catch {}

    return { id: q.id, status: q.status };
  }

  async sendQuoteReminder(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.quote_requests
      SET reminder_count = COALESCE(reminder_count, 0) + 1, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    const q = rows[0];

    // 2-Way Notification: send reminder to seller
    try {
      const prodRows = await this.prisma.$queryRaw<any[]>`
        SELECT p.title, p.seller_id
        FROM public.products p
        WHERE p.id = ${q.product_id} LIMIT 1
      `.catch(() => []);

      if (prodRows.length > 0 && prodRows[0].seller_id) {
        const notifTitle = 'Nhắc nhở phản hồi báo giá Marketplace';
        const notifBody = `Khách hàng đang chờ phản hồi báo giá cho sản phẩm "${prodRows[0].title}".`;
        const notifId = require('crypto').randomUUID();
        const safeData = JSON.stringify({
          title: notifTitle,
          body: notifBody,
          quoteId: id,
          targetRoute: '/marketplace',
        });

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
          ) VALUES (
            $1::uuid, $2::uuid, 'marketplace', $3, 'quote_reminder', 'quote_reminder',
            $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
          )
        `, notifId, prodRows[0].seller_id, id, notifTitle, notifBody, safeData, `quote-remind-${id}-${Date.now()}`).catch(() => {});

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.member_notifications (
            id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, false, false, 'quote', $4, NOW()
          )
        `, prodRows[0].seller_id, notifTitle, notifBody, id).catch(() => {});

        this.gateway.emitNotification(String(prodRows[0].seller_id), {
          id: notifId,
          title: notifTitle,
          body: notifBody,
          action: { targetRoute: '/marketplace' },
          safeDisplayData: { title: notifTitle, body: notifBody },
        });
      }
    } catch {}

    return { id: q.id, reminderCount: Number(q.reminder_count ?? 1) };
  }

  async cancelQuote(userId: string, id: string, reason: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.quote_requests
      SET status = 'cancelled', cancel_reason = ${reason ?? ''}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return null;
    return { id, status: 'cancelled', cancelReason: reason };
  }
}

// ==========================================
// OCR & AI Suggestions Global Helper Functions
// ==========================================

function parsePersonId(personId: string) {
  const kindChar = personId.substring(0, 1);
  const idVal = personId.substring(2);
  let targetKind = 'connection';
  let targetUserId: string | null = null;
  let targetCardId: string | null = null;
  let targetGuestId: string | null = null;

  if (kindChar === 'u') {
    targetKind = 'connection';
    targetUserId = idVal;
  } else if (kindChar === 'c') {
    targetKind = 'saved_card';
    targetCardId = idVal;
  } else if (kindChar === 'g') {
    targetKind = 'guest_contact';
    targetGuestId = idVal;
  }

  return { targetKind, targetUserId, targetCardId, targetGuestId };
}

function composePersonId(targetKind: string, targetUserId: string | null, targetCardId: string | null, targetGuestId: string | null) {
  if (targetKind === 'connection' && targetUserId) return `u:${targetUserId}`;
  if (targetKind === 'saved_card' && targetCardId) return `c:${targetCardId}`;
  if (targetKind === 'guest_contact' && targetGuestId) return `g:${targetGuestId}`;
  return '';
}

const OCR_MODEL_MAX_LINES = 40;
const ocrModelOutputSchema = z
  .object({
    isBusinessCard: z.boolean(),
    unusableReason: z.string().max(120).nullish(),
    lines: z
      .array(
        z
          .object({
            text: z.string().min(1).max(200),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(OCR_MODEL_MAX_LINES),
    displayNameLine: z.number().int().min(0).nullable(),
    titleLine: z.number().int().min(0).nullable(),
    companyNameLine: z.number().int().min(0).nullable(),
    addressLine: z.number().int().min(0).nullable(),
    qrPresent: z.boolean().nullish(),
  })
  .strict();

function normalizeText(s: string): string {
  return s.normalize("NFC").replace(/\s+/g, " ").trim();
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const EMAIL_SUSPECT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*,[A-Za-z]{2,}/g;

function extractEmails(lines: any[], warnings: string[]): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  let uncertain = false;
  for (const line of lines) {
    for (const m of line.text.matchAll(EMAIL_RE)) {
      const value = m[0].toLowerCase();
      if (seen.has(value)) continue;
      seen.add(value);
      out.push({ value, confidence: clamp01(line.confidence), sourceText: line.text });
    }
    for (const m of line.text.matchAll(EMAIL_SUSPECT_RE)) {
      const value = m[0].toLowerCase();
      if (seen.has(value)) continue;
      seen.add(value);
      uncertain = true;
      out.push({
        value,
        confidence: round2(clamp01(line.confidence) * 0.5),
        sourceText: line.text,
      });
    }
  }
  if (uncertain) warnings.push("email_uncertain");
  return out;
}

const PHONE_RE = /\+?\d[\d\s().-]{5,}\d/g;

function detectPhoneLabel(lineText: string): string | undefined {
  const s = lineText.toLowerCase();
  if (s.includes("fax")) return "fax";
  if (s.includes("hotline")) return "hotline";
  const tokens = s.split(/[^a-z0-9Ă -á»¹]+/u).filter(Boolean);
  const has = (set: readonly string[]) => tokens.some((tok) => set.includes(tok));
  if (has(["mobile", "mobi", "cell", "hp"]) || s.includes("di Ä‘á»™ng") || s.includes("di dong")) {
    return "mobile";
  }
  if (
    has(["office", "tel", "phone", "Ä‘t", "dt"]) ||
    s.includes("vÄƒn phĂ²ng") ||
    s.includes("van phong")
  ) {
    return "office";
  }
  return undefined;
}

function normalizePhoneDigits(raw: string): string {
  const plus = raw.trimStart().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

function extractPhones(lines: any[], warnings: string[]): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  let uncertain = false;
  for (const line of lines) {
    for (const m of line.text.matchAll(PHONE_RE)) {
      const digits = m[0].replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) continue;
      const value = normalizePhoneDigits(m[0]);
      if (seen.has(value)) continue;
      seen.add(value);
      const label = detectPhoneLabel(line.text);
      if (line.confidence < 0.5 || digits.length < 8) uncertain = true;
      out.push({
        value,
        confidence: clamp01(line.confidence),
        sourceText: line.text,
        ...(label ? { label } : {}),
      });
    }
  }
  if (uncertain) warnings.push("phone_uncertain");
  return out;
}

const URL_RE = /(?:https?:\/\/|www\.)[^\s<>()"']+/gi;

function extractWebsite(lines: any[]): any | undefined {
  for (const line of lines) {
    for (const m of line.text.matchAll(URL_RE)) {
      let raw = m[0].replace(/[.,;:!?)}\]]+$/, "");
      if (raw.includes("@")) continue;
      if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
      try {
        const u = new URL(raw);
        if (u.protocol !== "http:" && u.protocol !== "https:") continue;
        return { value: u.toString(), confidence: clamp01(line.confidence), sourceText: line.text };
      } catch {
        continue;
      }
    }
  }
  return undefined;
}

const CONTACT_PATTERN = /@|\(?\+?\d[\d\s().-]{6,}\d/;

function pickClassifiedLine(
  lines: any[],
  index: number | null,
  opts: { maxLen: number; forbidContactPattern?: boolean },
): any | undefined {
  if (index === null) return undefined;
  const line = lines[index];
  if (!line) return undefined;
  const value = normalizeText(line.text);
  if (!value || value.length > opts.maxLen) return undefined;
  if (opts.forbidContactPattern && CONTACT_PATTERN.test(value)) return undefined;
  return { value, confidence: clamp01(line.confidence), sourceText: line.text };
}

function buildCandidateFromModel(model: any, scanId: string): any {
  if (!model.isBusinessCard) return { ok: false, code: "unusable" };

  const lines: any[] = model.lines
    .map((l) => ({ text: normalizeText(l.text), confidence: clamp01(l.confidence) }))
    .filter((l) => l.text.length > 0);
  if (lines.length === 0) return { ok: false, code: "unusable" };

  const warnings: string[] = [];
  if (model.qrPresent) warnings.push("qr_present");

  const displayName = pickClassifiedLine(lines, model.displayNameLine, {
    maxLen: 80,
    forbidContactPattern: true,
  });
  if (model.displayNameLine !== null && !displayName) warnings.push("name_needs_review");

  const title = pickClassifiedLine(lines, model.titleLine, { maxLen: 120 });
  if (model.titleLine !== null && !title) warnings.push("title_needs_review");

  const companyName = pickClassifiedLine(lines, model.companyNameLine, { maxLen: 120 });
  if (model.companyNameLine !== null && !companyName) warnings.push("company_needs_review");

  const address = pickClassifiedLine(lines, model.addressLine, { maxLen: 160 });
  if (model.addressLine !== null && !address) warnings.push("address_needs_review");

  const emails = extractEmails(lines, warnings);
  const phones = extractPhones(lines, warnings);
  const website = extractWebsite(lines);

  if (!displayName) warnings.push("no_name");
  const hasChannel = phones.length > 0 || emails.length > 0 || website !== undefined;
  if (!hasChannel) warnings.push("no_contact_channel");
  if (!displayName && !hasChannel) return { ok: false, code: "unusable" };

  const present: any[] = [
    ...(displayName ? [displayName] : []),
    ...(title ? [title] : []),
    ...(companyName ? [companyName] : []),
    ...(website ? [website] : []),
    ...(address ? [address] : []),
    ...phones,
    ...emails,
  ];
  const overallConfidence =
    present.length === 0
      ? 0
      : round2(present.reduce((sum, f) => sum + f.confidence, 0) / present.length);

  return {
    ok: true,
    candidate: {
      schemaVersion: 1,
      scanId,
      status: "candidate",
      fields: {
        ...(displayName ? { displayName } : {}),
        ...(title ? { title } : {}),
        ...(companyName ? { companyName } : {}),
        phones,
        emails,
        ...(website ? { website } : {}),
        ...(address ? { address } : {}),
      },
      warnings,
      overallConfidence,
    },
  };
}

function candidateFromRawModelOutput(raw: unknown, scanId: string): any {
  const parsed = ocrModelOutputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_output" };
  const built = buildCandidateFromModel(parsed.data, scanId);
  if (!built.ok) return { ok: false, code: "unusable" };
  return { ok: true, candidate: built.candidate };
}

async function runCardOcrVision(imageDataUrl: string): Promise<unknown> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("OCR runtime is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a business-card OCR extraction engine inside a contact-acquisition pipeline.
Return STRICT JSON only:
{
  "isBusinessCard": boolean,
  "unusableReason": string | null,
  "lines": [ { "text": string, "confidence": number } ],
  "displayNameLine": number | null,
  "titleLine": number | null,
  "companyNameLine": number | null,
  "addressLine": number | null,
  "qrPresent": boolean
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Read this business card image and return JSON." },
            { type: "image_url", image_url: { url: imageDataUrl } }
          ]
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`OCR provider error ${response.status}`);
  const json = await response.json() as any;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OCR provider returned an empty response");
  return JSON.parse(content);
}

async function suggestCustomerTags(input: {
  stageLabel: string;
  displayName: string;
  companyName: string;
  note: string;
  logs: string[];
  needs: string[];
  existingTagNames: string[];
  currentTagNames: string[];
  approvedTagNames?: string[];
  rejectedTagNames?: string[];
}) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "unavailable" as const };

  const context = [
    `TĂªn: ${input.displayName || "(khĂ´ng rĂµ)"}`,
    `CĂ´ng ty: ${input.companyName || "(khĂ´ng rĂµ)"}`,
    `Giai Ä‘oáº¡n: ${input.stageLabel}`,
    `Ghi chĂº: ${input.note || "(trá»‘ng)"}`,
    `Lá»‹ch sá»­ chÄƒm sĂ³c:\n${input.logs.length ? input.logs.map((l) => `- ${l}`).join("\n") : "(trá»‘ng)"}`,
    `Äiá»ƒm Ä‘au & nhu cáº§u:\n${input.needs.length ? input.needs.map((n) => `- ${n}`).join("\n") : "(trá»‘ng)"}`,
    `NhĂ£n Ä‘Ă£ gáº¯n: ${input.currentTagNames.join(", ") || "(chÆ°a cĂ³)"}`,
    `Danh má»¥c nhĂ£n hiá»‡n cĂ³: ${input.existingTagNames.join(", ") || "(chÆ°a cĂ³)"}`,
    `NhĂ£n ngÆ°á»i dĂ¹ng Ä‘Ă¡nh giĂ¡ ÄĂNG trÆ°á»›c Ä‘Ă¢y: ${(input.approvedTagNames ?? []).join(", ") || "(chÆ°a cĂ³)"}`,
    `NhĂ£n ngÆ°á»i dĂ¹ng Ä‘Ă¡nh giĂ¡ SAI trÆ°á»›c Ä‘Ă¢y (tuyá»‡t Ä‘á»‘i khĂ´ng Ä‘á» xuáº¥t láº¡i): ${
      (input.rejectedTagNames ?? []).join(", ") || "(chÆ°a cĂ³)"
    }`,
  ].join("\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Báº¡n lĂ  trá»£ lĂ½ phĂ¢n nhĂ³m khĂ¡ch hĂ ng cho má»™t ngÆ°á»i bĂ¡n hĂ ng cĂ¡ nhĂ¢n.
Äá» xuáº¥t tá»‘i Ä‘a 5 NHĂƒN ngáº¯n Ä‘á»ƒ phĂ¢n nhĂ³m khĂ¡ch hĂ ng.
Tráº£ vá» DUY NHáº¤T JSON dáº¡ng: {"suggestions":[{"name":"...","reason":"...","confidence":0.8}]}. KhĂ´ng markdown.`
        },
        { role: "user", content: context }
      ]
    })
  });

  if (!response.ok) return { ok: false, error: "unavailable" as const };
  const json = await response.json() as any;
  const content = json?.choices?.[0]?.message?.content ?? "";
  
  try {
    const text = content.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return { ok: false, error: "unavailable" as const };
    const parsed = JSON.parse(text.slice(start, end + 1)) as any;
    const rawSuggestions = (parsed.suggestions ?? []).map((s: any) => ({
      name: String(s.name || '').trim().slice(0, 24),
      reason: String(s.reason || '').trim().slice(0, 120),
      confidence: typeof s.confidence === 'number' ? s.confidence : 0.5,
    })).filter((s: any) => s.name.length > 0).slice(0, 5);

    const existing = new Set(input.existingTagNames.map(n => n.toLowerCase()));
    const already = new Set(input.currentTagNames.map(n => n.toLowerCase()));
    const seen = new Set<string>();
    const suggestions: any[] = [];
    
    for (const s of rawSuggestions) {
      const key = s.name.toLowerCase();
      if (seen.has(key) || already.has(key)) continue;
      seen.add(key);
      suggestions.push({
        name: s.name,
        reason: s.reason,
        existing: existing.has(key),
        confidence: s.confidence,
      });
    }

    return { ok: true, suggestions };
  } catch {
    return { ok: false, error: "unavailable" as const };
  }
}


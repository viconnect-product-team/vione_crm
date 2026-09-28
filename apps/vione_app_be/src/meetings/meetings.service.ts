import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Summary view for Meeting Workspace
   */
  async getWorkspaceSummary(userId: string) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      // 1. Get counts
      let countsRaw: any[] = [];
      if (isUuid) {
        countsRaw = await this.prisma.$queryRaw<any[]>`
          SELECT 
            COUNT(DISTINCT m.id) FILTER (WHERE m.status IN ('confirmed', 'scheduled')) as upcoming,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'draft' OR m.confirmed_proposal_id IS NULL) as unscheduled,
            COUNT(DISTINCT m.id) FILTER (WHERE p.response_status = 'pending' AND m.status != 'cancelled') as needs_action,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status IN ('completed', 'cancelled')) as history
          FROM public.business_meetings m
          LEFT JOIN public.business_meeting_participants p ON p.meeting_id = m.id
          WHERE p.user_id = ${userId}::uuid OR m.created_by_user_id = ${userId}::uuid OR m.organizer_user_id = ${userId}::uuid
        `.catch(() => []);
      } else {
        countsRaw = await this.prisma.$queryRaw<any[]>`
          SELECT 
            COUNT(DISTINCT m.id) FILTER (WHERE m.status IN ('confirmed', 'scheduled')) as upcoming,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'draft' OR m.confirmed_proposal_id IS NULL) as unscheduled,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'pending' AND m.status != 'cancelled') as needs_action,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status IN ('completed', 'cancelled')) as history
          FROM public.business_meetings m
        `.catch(() => []);
      }

      const upcomingCount = Number(countsRaw[0]?.upcoming ?? 0);
      const unscheduledCount = Number(countsRaw[0]?.unscheduled ?? 0);
      const needsActionCount = Number(countsRaw[0]?.needs_action ?? 0);
      const historyCount = Number(countsRaw[0]?.history ?? 0);

      const counts = {
        upcoming: upcomingCount,
        unscheduled: unscheduledCount,
        needsAction: needsActionCount,
        history: historyCount,
      };

      // 2. Fetch upcoming meetings
      let upcomingMeetings: any[] = [];
      if (isUuid) {
        upcomingMeetings = await this.prisma.$queryRaw<any[]>`
          SELECT 
            m.id, m.title, m.description, m.meeting_type, m.status, m.timezone,
            m.location_type, m.scheduling_mode, m.scheduled_start_at, m.scheduled_end_at,
            m.created_at, m.updated_at, COALESCE(p.role, 'organizer') as viewer_role
          FROM public.business_meetings m
          LEFT JOIN public.business_meeting_participants p ON p.meeting_id = m.id
          WHERE (p.user_id = ${userId}::uuid OR m.created_by_user_id = ${userId}::uuid OR m.organizer_user_id = ${userId}::uuid)
            AND m.status IN ('confirmed', 'scheduled')
          ORDER BY m.created_at DESC
          LIMIT 5
        `.catch(() => []);
      } else {
        upcomingMeetings = await this.prisma.$queryRaw<any[]>`
          SELECT 
            m.id, m.title, m.description, m.meeting_type, m.status, m.timezone,
            m.location_type, m.scheduling_mode, m.scheduled_start_at, m.scheduled_end_at,
            m.created_at, m.updated_at, 'organizer' as viewer_role
          FROM public.business_meetings m
          WHERE m.status IN ('confirmed', 'scheduled')
          ORDER BY m.created_at DESC
          LIMIT 5
        `.catch(() => []);
      }

      // 3. Fetch needs-action meetings
      let needsActionMeetings: any[] = [];
      if (isUuid) {
        needsActionMeetings = await this.prisma.$queryRaw<any[]>`
          SELECT 
            m.id, m.title, m.description, m.meeting_type, m.status, m.timezone,
            m.location_type, m.scheduling_mode, m.scheduled_start_at, m.scheduled_end_at,
            m.created_at, m.updated_at, COALESCE(p.role, 'required') as viewer_role
          FROM public.business_meetings m
          JOIN public.business_meeting_participants p ON p.meeting_id = m.id
          WHERE p.user_id = ${userId}::uuid
            AND p.response_status = 'pending'
            AND m.status != 'cancelled'
          ORDER BY m.created_at DESC
          LIMIT 5
        `.catch(() => []);
      }

      return {
        needsActionCount,
        upcomingCount,
        unscheduledCount,
        completedRecentlyCount: historyCount,
        thisMonthCount: upcomingCount + unscheduledCount + historyCount,
        generatedAt: new Date().toISOString(),
        counts,
        upcomingMeetings: upcomingMeetings.map((r) => this.formatMeetingItem(r)),
        needsActionMeetings: needsActionMeetings.map((r) => this.formatMeetingItem(r)),
      };
    } catch (err) {
      console.error('getWorkspaceSummary error:', err);
      return {
        needsActionCount: 0,
        upcomingCount: 0,
        unscheduledCount: 0,
        completedRecentlyCount: 0,
        thisMonthCount: 0,
        generatedAt: new Date().toISOString(),
        counts: { upcoming: 0, unscheduled: 0, needsAction: 0, history: 0 },
        upcomingMeetings: [],
        needsActionMeetings: [],
      };
    }
  }

  /**
   * List meetings by workspace bucket
   */
  async listWorkspaceMeetings(userId: string, filters: any) {
    const limit = Math.min(Math.max(Number(filters.limit || 20), 1), 50);
    const bucket = filters.bucket || 'upcoming';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    try {
      let statusFilter = `m.status IN ('confirmed', 'scheduled')`;
      if (bucket === 'unscheduled') {
        statusFilter = `(m.status = 'draft' OR m.confirmed_proposal_id IS NULL)`;
      } else if (bucket === 'needs_action') {
        statusFilter = `(p.response_status = 'pending' AND m.status != 'cancelled')`;
      } else if (bucket === 'history') {
        statusFilter = `m.status IN ('completed', 'cancelled')`;
      }

      let whereClause = `WHERE ${statusFilter}`;
      if (isUuid) {
        whereClause = `WHERE (p.user_id = '${userId}'::uuid OR m.created_by_user_id = '${userId}'::uuid OR m.organizer_user_id = '${userId}'::uuid) AND ${statusFilter}`;
      }

      const rows = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          m.id, m.title, m.description, m.meeting_type, m.status, m.timezone,
          m.location_type, m.scheduling_mode, m.scheduled_start_at, m.scheduled_end_at,
          m.created_at, m.updated_at, COALESCE(p.role, 'organizer') as viewer_role
        FROM public.business_meetings m
        LEFT JOIN public.business_meeting_participants p ON p.meeting_id = m.id
        ${whereClause}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `).catch(() => []);

      const items = rows.map((row) => this.formatMeetingItem(row));

      return {
        items,
        nextCursor: null,
      };
    } catch (err) {
      console.error('listWorkspaceMeetings error:', err);
      return { items: [], nextCursor: null };
    }
  }

  /**
   * Single meeting detail in workspace shape
   */
  async getMeetingWorkspaceDetail(userId: string, meetingId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        m.id, m.title, m.description, m.meeting_type, m.status, m.timezone,
        m.created_at, m.updated_at, p.role as viewer_role
      FROM public.business_meetings m
      JOIN public.business_meeting_participants p ON p.meeting_id = m.id
      WHERE m.id = ${meetingId}::uuid AND p.user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (!rows.length) {
      throw new NotFoundException('Meeting not found or access denied');
    }

    const row = rows[0];
    const outcome = await this.getOutcome(meetingId);
    const followUps = await this.listFollowUps(meetingId);

    return {
      meeting: {
        id: row.id,
        title: row.title,
        description: row.description,
        meetingType: row.meeting_type,
        status: row.status,
        timezone: row.timezone,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      viewerRole: row.viewer_role,
      outcome,
      followUps,
    };
  }

  /**
   * Outcome handling
   */
  async getOutcome(meetingId: string) {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT *
        FROM public.business_meeting_outcomes
        WHERE meeting_id = ${meetingId}::uuid
        LIMIT 1
      `.catch(() => []);
      return rows[0] || null;
    } catch {
      return null;
    }
  }

  async saveOutcome(userId: string, meetingId: string, data: any) {
    const outcomeType = data.outcomeType || 'positive_progress';
    const outcomeStatus = data.outcomeStatus || 'draft';
    const summary = data.summary || '';
    const finalizedAt = outcomeStatus === 'finalized' ? new Date().toISOString() : null;

    await this.prisma.$queryRawUnsafe(`
      INSERT INTO public.business_meeting_outcomes (
        meeting_id, recorded_by_user_id, outcome_type, outcome_status, summary, finalized_at
      ) VALUES (
        '${meetingId}'::uuid,
        '${userId}'::uuid,
        '${outcomeType}',
        '${outcomeStatus}',
        '${summary.replace(/'/g, "''")}',
        ${finalizedAt ? `'${finalizedAt}'::timestamptz` : 'NULL'}
      )
      ON CONFLICT (meeting_id) DO UPDATE SET
        outcome_type = EXCLUDED.outcome_type,
        outcome_status = EXCLUDED.outcome_status,
        summary = EXCLUDED.summary,
        finalized_at = EXCLUDED.finalized_at,
        updated_at = now()
    `);

    return this.getOutcome(meetingId);
  }

  /**
   * Follow-ups handling
   */
  async listFollowUps(meetingId: string) {
    try {
      return await this.prisma.$queryRaw<any[]>`
        SELECT *
        FROM public.business_meeting_follow_ups
        WHERE meeting_id = ${meetingId}::uuid
        ORDER BY created_at ASC
      `.catch(() => []);
    } catch {
      return [];
    }
  }

  async createFollowUp(userId: string, meetingId: string, data: any) {
    const title = data.title || 'Follow-up task';
    const description = data.description || '';
    const dueDate = data.dueDate ? `'${data.dueDate}'::timestamptz` : 'NULL';

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO public.business_meeting_follow_ups (
        meeting_id, assigned_to_user_id, created_by_user_id, title, description, due_date, status
      ) VALUES (
        '${meetingId}'::uuid,
        '${userId}'::uuid,
        '${userId}'::uuid,
        '${title.replace(/'/g, "''")}',
        '${description.replace(/'/g, "''")}',
        ${dueDate},
        'pending'
      )
      RETURNING *
    `);

    return rows[0];
  }

  async updateFollowUpStatus(userId: string, followUpId: string, status: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.business_meeting_follow_ups
      SET status = ${status}, updated_at = now()
      WHERE id = ${followUpId}::uuid
      RETURNING *
    `;
    return rows[0];
  }

  private formatMeetingItem(row: any) {
    const isScheduled = ['confirmed', 'scheduled'].includes(row.status);
    return {
      meeting: {
        id: row.id,
        title: row.title || 'Cuộc gặp',
        meetingType: row.meeting_type || 'one_on_one',
        status: row.status || 'draft',
        locationType: row.location_type || 'online',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        cancelledAt: row.cancelled_at || null,
        completedAt: row.completed_at || null,
      },
      viewer: {
        role: row.viewer_role || 'organizer',
        invitationResponseStatus: row.response_status || 'accepted',
        canRespondToMeeting: false,
        hasPendingTimeProposalResponse: false,
        canSelectFinalTime: false,
      },
      action: {
        kind: 'view_detail',
        priority: 4,
        labelKey: 'bc.meetings.workspace.action.viewDetail',
        target: 'detail',
        reasonCode: 'viewer_meeting_scheduled',
      },
      scheduleSummary: {
        isScheduled,
        schedulingMode: row.scheduling_mode || (isScheduled ? 'scheduled' : 'unscheduled'),
        startAt: row.scheduled_start_at || row.start_at || null,
        endAt: row.scheduled_end_at || row.end_at || null,
        timezone: row.timezone || 'Asia/Ho_Chi_Minh',
        durationMinutes: row.duration_minutes || 60,
      },
      invitationSummary: {
        requiredCount: 1,
        acceptedCount: 1,
        declinedCount: 0,
        tentativeCount: 0,
        pendingCount: 0,
      },
      proposalSummary: {
        activeProposalCount: 0,
        selectedProposalId: null,
        viewerPendingResponseCount: 0,
        selectableProposalCount: 0,
        latestProposalAt: null,
      },
      participantSummary: {
        participantCount: 1,
        requiredCount: 1,
        acceptedCount: 1,
        visibleParticipants: [],
      },
      calendarSyncSummary: {
        totalProjectionCount: 0,
        syncedCount: 0,
        pendingCount: 0,
        retryScheduledCount: 0,
        failedCount: 0,
        hasUserActionableIssue: false,
      },
      sourceContextSummary: {
        type: 'direct',
        label: 'Trực tiếp',
        canNavigate: false,
        target: null,
      },
      latestTimelineSummary: {
        latestEventKind: null,
        occurredAt: null,
        summaryKey: null,
      },
    };
  }

  async getAvailabilityPreferences(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.business_availability_preferences
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: String(r.id),
      userId: String(r.user_id),
      timezone: String(r.timezone || 'Asia/Ho_Chi_Minh'),
      workingDays: r.working_days || [1, 2, 3, 4, 5],
      workingHours: r.working_hours || [],
      minimumNoticeMinutes: Number(r.minimum_notice_minutes || 60),
      defaultMeetingDurationMinutes: Number(r.default_meeting_duration_minutes || 30),
      bufferBeforeMinutes: Number(r.buffer_before_minutes || 0),
      bufferAfterMinutes: Number(r.buffer_after_minutes || 0),
      version: Number(r.version || 1),
    };
  }

  async updateAvailabilityPreferences(userId: string, data: any) {
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.business_availability_preferences (
        user_id, timezone, working_days, working_hours, minimum_notice_minutes,
        default_meeting_duration_minutes, buffer_before_minutes, buffer_after_minutes,
        version, updated_at
      )
      VALUES (
        ${userId}::uuid,
        ${data.timezone},
        ${data.workingDays}::int[],
        ${JSON.stringify(data.workingHours)}::jsonb,
        ${data.minimumNoticeMinutes},
        ${data.defaultMeetingDurationMinutes},
        ${data.bufferBeforeMinutes},
        ${data.bufferAfterMinutes},
        1,
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        timezone = EXCLUDED.timezone,
        working_days = EXCLUDED.working_days,
        working_hours = EXCLUDED.working_hours,
        minimum_notice_minutes = EXCLUDED.minimum_notice_minutes,
        default_meeting_duration_minutes = EXCLUDED.default_meeting_duration_minutes,
        buffer_before_minutes = EXCLUDED.buffer_before_minutes,
        buffer_after_minutes = EXCLUDED.buffer_after_minutes,
        version = public.business_availability_preferences.version + 1,
        updated_at = now()
      RETURNING *
    `.catch(() => []);

    if (rows.length === 0) {
      return {
        id: `pref-${userId}`,
        userId,
        timezone: data.timezone,
        workingDays: data.workingDays,
        workingHours: data.workingHours,
        minimumNoticeMinutes: data.minimumNoticeMinutes,
        defaultMeetingDurationMinutes: data.defaultMeetingDurationMinutes,
        bufferBeforeMinutes: data.bufferBeforeMinutes,
        bufferAfterMinutes: data.bufferAfterMinutes,
        version: 1,
      };
    }
    const r = rows[0];
    return {
      id: String(r.id),
      userId: String(r.user_id),
      timezone: String(r.timezone),
      workingDays: r.working_days || [],
      workingHours: r.working_hours || [],
      minimumNoticeMinutes: Number(r.minimum_notice_minutes),
      defaultMeetingDurationMinutes: Number(r.default_meeting_duration_minutes),
      bufferBeforeMinutes: Number(r.buffer_before_minutes),
      bufferAfterMinutes: Number(r.buffer_after_minutes),
      version: Number(r.version || 1),
    };
  }

  async listTimeProposals(meetingId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.business_meeting_time_proposals
      WHERE meeting_id = ${meetingId}::uuid
      ORDER BY start_at ASC
    `.catch(() => []);

    return rows.map((r) => ({
      id: String(r.id),
      meetingId: String(r.meeting_id),
      proposedByUserId: String(r.proposed_by_user_id),
      startAt: String(r.start_at),
      endAt: String(r.end_at),
      timezone: String(r.timezone),
      status: r.status,
      version: Number(r.version ?? 1),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  }

  async createTimeProposals(userId: string, data: any) {
    const meetingId = data.meetingId;
    const proposals = data.proposals || [];
    const results: any[] = [];

    for (const p of proposals) {
      const rows = await this.prisma.$queryRaw<any[]>`
        INSERT INTO public.business_meeting_time_proposals (
          meeting_id, proposed_by_user_id, start_at, end_at, timezone, status, created_at, updated_at
        )
        VALUES (
          ${meetingId}::uuid,
          ${userId}::uuid,
          ${p.startAt}::timestamptz,
          ${p.endAt}::timestamptz,
          ${p.timezone},
          'proposed',
          now(),
          now()
        )
        RETURNING *
      `.catch(() => []);
      if (rows.length > 0) {
        const r = rows[0];
        results.push({
          id: String(r.id),
          meetingId: String(r.meeting_id),
          proposedByUserId: String(r.proposed_by_user_id),
          startAt: String(r.start_at),
          endAt: String(r.end_at),
          timezone: String(r.timezone),
          status: r.status,
          version: Number(r.version ?? 1),
          createdAt: String(r.created_at),
          updatedAt: String(r.updated_at),
        });
      }
    }
    return results;
  }

  async respondToTimeProposal(userId: string, proposalId: string, response: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.business_meeting_time_proposal_responses (
        proposal_id, participant_id, response, responded_at
      )
      VALUES (
        ${proposalId}::uuid,
        ${userId}::uuid,
        ${response},
        now()
      )
      ON CONFLICT (proposal_id, participant_id) DO UPDATE SET
        response = EXCLUDED.response,
        responded_at = now()
      RETURNING *
    `.catch(() => []);

    if (rows.length === 0) {
      return {
        id: `resp-${Date.now()}`,
        proposalId,
        participantId: userId,
        response,
        respondedAt: new Date().toISOString(),
      };
    }
    const r = rows[0];
    return {
      id: String(r.id),
      proposalId: String(r.proposal_id),
      participantId: String(r.participant_id),
      response: r.response,
      respondedAt: String(r.responded_at),
    };
  }

  async selectTimeProposal(userId: string, proposalId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.business_meeting_time_proposals
      SET status = 'selected', updated_at = now()
      WHERE id = ${proposalId}::uuid
      RETURNING *
    `.catch(() => []);

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy đề xuất thời gian');
    }
    const r = rows[0];
    return {
      id: String(r.id),
      meetingId: String(r.meeting_id),
      proposedByUserId: String(r.proposed_by_user_id),
      startAt: String(r.start_at),
      endAt: String(r.end_at),
      timezone: String(r.timezone),
      status: r.status,
      version: Number(r.version ?? 1),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }

  async listProjections(meetingId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.business_meeting_calendar_projections
      WHERE meeting_id = ${meetingId}::uuid
    `.catch(() => []);

    return rows.map((r) => ({
      id: String(r.id),
      meetingId: String(r.meeting_id),
      participantUserId: String(r.participant_user_id),
      provider: r.provider,
      syncStatus: r.sync_status,
      lastSyncedAt: r.last_synced_at ? String(r.last_synced_at) : null,
      lastErrorCode: r.last_error_code ? String(r.last_error_code) : null,
      retryCount: Number(r.retry_count ?? 0),
    }));
  }

  async createMeeting(userId: string, data: any) {
    const title = data.title || 'Cuộc gặp kết nối 1-on-1';
    const hostName = data.hostName || 'Hội viên chủ trì';
    const partnerName = data.partnerName || 'Đối tác kết nối';
    const partnerPhone = data.partnerPhone || '';
    const partnerCompany = data.partnerCompany || '';
    const date = data.date || new Date().toISOString().split('T')[0];
    const time = data.time || '09:00';
    const venue = data.venue || '';
    const venueType = data.venueType || 'offline';
    const onlineUrl = data.onlineUrl || (venueType === 'online' ? venue : '');
    const notes = data.notes || '';
    const assocId = data.associationId || 'c1983000-0000-4000-8000-000000001983';

    // 1. Lưu vào bảng public.meetings
    const code = `MEET-${Date.now().toString().slice(-6)}`;
    const targetMembers = {
      hostName,
      partnerName,
      partnerPhone,
      partnerCompany,
      partnerUserId: data.partnerUserId || null,
      notes,
      venueType,
      onlineUrl,
    };

    const insertedMeetings = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.meetings (
        code, title, type, date, time, location, attendees, status, 
        association_id, department, target_members, zoom_url, created_at, updated_at
      ) VALUES (
        ${code}, ${title}, '1on1', ${date}::date, ${time}, ${venue}, 2, 'scheduled',
        ${assocId}::uuid, 'Ban Kết Nối', ${JSON.stringify(targetMembers)}::jsonb, ${onlineUrl}, NOW(), NOW()
      )
      RETURNING *
    `.catch((err) => {
      console.error('Error inserting into public.meetings:', err);
      return [];
    });

    const meeting = insertedMeetings[0] || null;

    // 2. Tìm kiếm đối tác kết nối để gửi thông báo
    let recipientUserId: string | null = data.partnerUserId || null;
    if (!recipientUserId && (partnerPhone || partnerName)) {
      const foundUsers = await this.prisma.$queryRaw<any[]>`
        SELECT id, user_id FROM public.members 
        WHERE (phone = ${partnerPhone} AND ${partnerPhone} != '') 
           OR (name ILIKE ${'%' + partnerName + '%'} AND ${partnerName} != '')
        LIMIT 1
      `.catch(() => []);

      if (foundUsers.length > 0) {
        recipientUserId = foundUsers[0].user_id || foundUsers[0].id;
      } else {
        const vUsers = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM public.vione_users
          WHERE (phone = ${partnerPhone} AND ${partnerPhone} != '')
             OR (name ILIKE ${'%' + partnerName + '%'} AND ${partnerName} != '')
          LIMIT 1
        `.catch(() => []);
        if (vUsers.length > 0) {
          recipientUserId = vUsers[0].id;
        }
      }
    }

    // 3. Tạo thông báo trong public.business_notifications nếu tìm được người nhận
    if (recipientUserId) {
      const notifTitle = `Lời mời hẹn gặp kết nối từ ${hostName}`;
      const notifBody = `${hostName} đã gửi lời mời hẹn gặp kết nối với bạn: "${title}" vào ${date} lúc ${time}. Địa điểm: ${venue}.`;
      const displayData = {
        meetingId: meeting?.id || code,
        title,
        hostName,
        partnerName,
        date,
        time,
        venue,
        venueType,
      };

      await this.prisma.$executeRaw`
        INSERT INTO public.business_notifications (
          recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
          title_key, body_key, safe_display_data, action_kind, action_target, priority,
          status, app_scope, target_app, created_at, updated_at
        ) VALUES (
          ${recipientUserId}::uuid, 'meetings', ${meeting?.id ? String(meeting.id) : code}, 'meeting_invite', 'meeting',
          ${notifTitle}, ${notifBody}, ${JSON.stringify(displayData)}::jsonb, 'open_meeting',
          ${JSON.stringify({ url: '/business-connect/meetings' })}::jsonb, 'high',
          'delivered', 'ceo1983', 'mobile_ceo1983', NOW(), NOW()
        )
      `.catch((err) => {
        console.error('Error inserting into business_notifications:', err);
      });
    }

    // 4. Đồng thời tạo thông báo chung trong public.notifications
    await this.prisma.$executeRaw`
      INSERT INTO public.notifications (
        code, title, body, audience, channel, status, sent_at, reach,
        association_id, target_app, created_at, updated_at
      ) VALUES (
        ${'NOTIF-' + Date.now().toString().slice(-6)},
        ${`Lời mời hẹn gặp kết nối: ${title}`},
        ${`${hostName} đã lên lịch hẹn gặp kết nối 1-on-1 với ${partnerName} vào ngày ${date} lúc ${time}.`},
        'targeted', 'in_app', 'sent', NOW(), 1,
        ${assocId}::uuid, 'mobile_ceo1983', NOW(), NOW()
      )
    `.catch(() => null);

    return {
      ok: true,
      meeting: meeting || { id: code, title, status: 'scheduled' },
      notifiedUser: Boolean(recipientUserId),
    };
  }
}

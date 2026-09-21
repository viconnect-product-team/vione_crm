import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export class CreatePollDto {
  title!: string;
  description?: string;
  associationId?: string;
  options!: string[];
  startDate?: string;
  endDate?: string;
  targetAudience?: string; // 'all' | 'members' | 'non_members'
}

export class CastVoteDto {
  optionId!: string;
  sourceApp?: string; // 'vione_app' | 'association_app' | 'crm'
}

@Injectable()
export class VotingService {
  constructor(private prisma: PrismaService) {}

  private computeOptionsWithStats(rawOptions: any[]): any[] {
    const opts = (rawOptions || []).map((o) => ({
      id: String(o.id),
      title: String(o.title || ''),
      votesCount: Number(o.votes_count || 0),
      vioneVotes: Number(o.vione_votes || 0),
      associationVotes: Number(o.association_votes || 0),
      crmVotes: Number(o.crm_votes || 0),
      percentage: 0,
      isLeading: false,
    }));

    const totalVotes = opts.reduce((sum, o) => sum + o.votesCount, 0);
    const maxVotes = opts.length > 0 ? Math.max(...opts.map((o) => o.votesCount)) : 0;

    return opts.map((o) => ({
      ...o,
      percentage: totalVotes > 0 ? Number(((o.votesCount / totalVotes) * 100).toFixed(1)) : 0,
      isLeading: totalVotes > 0 && o.votesCount === maxVotes && maxVotes > 0,
    }));
  }

  async listPolls(userId: string, associationId?: string) {
    const rows: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT p.*,
        (SELECT json_agg(json_build_object(
          'id', o.id,
          'title', o.title,
          'votes_count', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.option_id = o.id),
          'vione_votes', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.option_id = o.id AND (pv.source_app = 'vione_app' OR pv.source_app IS NULL)),
          'association_votes', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.option_id = o.id AND pv.source_app = 'association_app'),
          'crm_votes', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.option_id = o.id AND pv.source_app = 'crm')
        ))
         FROM public.poll_options o WHERE o.poll_id = p.id) as options,
        (SELECT v.option_id FROM public.poll_votes v WHERE v.poll_id = p.id AND v.user_id = ${userId}::uuid LIMIT 1) as my_vote,
        (SELECT v.source_app FROM public.poll_votes v WHERE v.poll_id = p.id AND v.user_id = ${userId}::uuid LIMIT 1) as my_vote_source,
        (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.poll_id = p.id) as calculated_total_votes,
        json_build_object(
          'vioneApp', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.poll_id = p.id AND (pv.source_app = 'vione_app' OR pv.source_app IS NULL)),
          'associationApp', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.poll_id = p.id AND pv.source_app = 'association_app'),
          'crm', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.poll_id = p.id AND pv.source_app = 'crm')
        ) as source_stats
      FROM public.polls p
      ORDER BY p.created_at DESC
    `.catch(async () => {
      return this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.polls ORDER BY created_at DESC
      `.catch(() => [] as any[]);
    });

    return rows.map((r) => {
      const options = this.computeOptionsWithStats(r.options || []);
      const totalVotes = options.reduce((sum, o) => sum + o.votesCount, 0);
      const sourceStats = r.source_stats || {
        vioneApp: options.reduce((sum, o) => sum + o.vioneVotes, 0),
        associationApp: options.reduce((sum, o) => sum + o.associationVotes, 0),
        crm: options.reduce((sum, o) => sum + o.crmVotes, 0),
      };

      return {
        id: r.id,
        title: r.title,
        description: r.description || '',
        status: r.status || 'open',
        options,
        myVote: r.my_vote || null,
        myVoteSource: r.my_vote_source || null,
        totalVotes,
        sourceStats,
        createdAt: r.created_at,
        endDate: r.end_date || null,
      };
    });
  }

  async getPollById(userId: string, id: string) {
    const rows: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT p.*,
        (SELECT json_agg(json_build_object(
          'id', o.id,
          'title', o.title,
          'votes_count', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.option_id = o.id),
          'vione_votes', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.option_id = o.id AND (pv.source_app = 'vione_app' OR pv.source_app IS NULL)),
          'association_votes', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.option_id = o.id AND pv.source_app = 'association_app'),
          'crm_votes', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.option_id = o.id AND pv.source_app = 'crm')
        ))
         FROM public.poll_options o WHERE o.poll_id = p.id) as options,
        (SELECT v.option_id FROM public.poll_votes v WHERE v.poll_id = p.id AND v.user_id = ${userId}::uuid LIMIT 1) as my_vote,
        (SELECT v.source_app FROM public.poll_votes v WHERE v.poll_id = p.id AND v.user_id = ${userId}::uuid LIMIT 1) as my_vote_source,
        (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.poll_id = p.id) as calculated_total_votes,
        json_build_object(
          'vioneApp', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.poll_id = p.id AND (pv.source_app = 'vione_app' OR pv.source_app IS NULL)),
          'associationApp', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.poll_id = p.id AND pv.source_app = 'association_app'),
          'crm', (SELECT COUNT(*)::int FROM public.poll_votes pv WHERE pv.poll_id = p.id AND pv.source_app = 'crm')
        ) as source_stats
      FROM public.polls p
      WHERE p.id = ${id}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);

    if (rows.length === 0) throw new NotFoundException('Poll not found');
    const r = rows[0];
    const options = this.computeOptionsWithStats(r.options || []);
    const totalVotes = options.reduce((sum, o) => sum + o.votesCount, 0);
    const sourceStats = r.source_stats || {
      vioneApp: options.reduce((sum, o) => sum + o.vioneVotes, 0),
      associationApp: options.reduce((sum, o) => sum + o.associationVotes, 0),
      crm: options.reduce((sum, o) => sum + o.crmVotes, 0),
    };

    return {
      id: r.id,
      title: r.title,
      description: r.description || '',
      status: r.status || 'open',
      options,
      myVote: r.my_vote || null,
      myVoteSource: r.my_vote_source || null,
      totalVotes,
      sourceStats,
      createdAt: r.created_at,
      endDate: r.end_date || null,
    };
  }

  async castVote(userId: string, pollId: string, optionId: string, sourceApp: string = 'vione_app') {
    if (!pollId || !optionId) {
      throw new BadRequestException('pollId and optionId are required');
    }

    const validSource = sourceApp === 'association_app' || sourceApp === 'crm' ? sourceApp : 'vione_app';
    const voteId = crypto.randomUUID();

    await this.prisma.$executeRaw`
      INSERT INTO public.poll_votes (id, poll_id, option_id, user_id, source_app, created_at)
      VALUES (${voteId}::uuid, ${pollId}::uuid, ${optionId}::uuid, ${userId}::uuid, ${validSource}, now())
      ON CONFLICT (poll_id, user_id) DO UPDATE SET option_id = ${optionId}::uuid, source_app = ${validSource}, created_at = now()
    `.catch(async () => {
      // If table lacks unique constraint on (poll_id, user_id), delete old vote first
      await this.prisma.$executeRaw`
        DELETE FROM public.poll_votes WHERE poll_id = ${pollId}::uuid AND user_id = ${userId}::uuid
      `.catch(() => {});
      await this.prisma.$executeRaw`
        INSERT INTO public.poll_votes (id, poll_id, option_id, user_id, source_app, created_at)
        VALUES (${voteId}::uuid, ${pollId}::uuid, ${optionId}::uuid, ${userId}::uuid, ${validSource}, now())
      `.catch(() => {});
    });

    // Recalculate votes_count for all options in this poll
    await this.prisma.$executeRaw`
      UPDATE public.poll_options
      SET votes_count = (SELECT COUNT(*)::int FROM public.poll_votes WHERE option_id = public.poll_options.id)
      WHERE poll_id = ${pollId}::uuid
    `.catch(() => {});

    return this.getPollById(userId, pollId);
  }

  async createPoll(userId: string, data: CreatePollDto) {
    if (!data.title || !Array.isArray(data.options) || data.options.length < 2) {
      throw new BadRequestException('Title and at least 2 options are required');
    }

    const pollId = crypto.randomUUID();
    const startDate = (data as any).startsAt || data.startDate || null;
    const endDate = (data as any).endsAt || data.endDate || null;

    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.polls (id, title, description, status, start_date, end_date, created_at, updated_at)
        VALUES (${pollId}::uuid, ${data.title}, ${data.description || null}, 'open', ${startDate ? new Date(startDate) : null}, ${endDate ? new Date(endDate) : null}, now(), now())
      `;
    } catch (e: any) {
      await this.prisma.$executeRaw`
        INSERT INTO public.polls (id, title, description, status, created_at, updated_at)
        VALUES (${pollId}::uuid, ${data.title}, ${data.description || null}, 'open', now(), now())
      `.catch(() => {});
    }

    const createdOptions: Array<{ id: string; title: string }> = [];
    for (const optTitle of data.options) {
      const optId = crypto.randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO public.poll_options (id, poll_id, title, votes_count, created_at)
        VALUES (${optId}::uuid, ${pollId}::uuid, ${optTitle}, 0, now())
      `.catch(() => {});
      createdOptions.push({ id: optId, title: optTitle });
    }

    // Broadcast in-app interactive poll notification to relevant members and users
    try {
      let users: any[] = [];
      const audience = data.targetAudience || 'all';

      if (audience === 'members') {
        users = await this.prisma.$queryRaw<any[]>`
          SELECT DISTINCT user_id as id FROM public.members WHERE user_id IS NOT NULL
        `.catch(() => [] as any[]);
      } else if (audience === 'non_members') {
        users = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM public.vione_users 
          WHERE id NOT IN (SELECT user_id FROM public.members WHERE user_id IS NOT NULL)
        `.catch(async () => {
          return this.prisma.$queryRaw<any[]>`SELECT id FROM public.vione_users LIMIT 50`.catch(() => [] as any[]);
        });
      } else {
        users = await this.prisma.$queryRaw<any[]>`
          SELECT DISTINCT u.id FROM (
            SELECT id FROM public.vione_users
            UNION
            SELECT user_id as id FROM public.members WHERE user_id IS NOT NULL
          ) u
        `.catch(() => [] as any[]);
      }

      const notifTitle = `[Biểu quyết mới] ${data.title}`;
      const notifBody = data.description || 'Tham gia biểu quyết ý kiến ngay trên ứng dụng ViOne & Hiệp hội.';
      const safeDisplayData = JSON.stringify({
        title: data.title,
        body: notifBody,
        pollId,
        options: createdOptions,
        type: 'poll',
        targetRoute: '/voting',
        status: 'open',
      });

      for (const u of users) {
        if (!u.id) continue;
        const dedupeKey = `poll-notif-${pollId}-${u.id}`;
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, 'voting', $2, 'poll_created', 'interactive_poll',
            $3, $4, $5::jsonb, 'high', 'delivered', $6, 'all', 'all', NOW(), NOW()
          )
        `, u.id, pollId, notifTitle, notifBody, safeDisplayData, dedupeKey).catch(() => {});

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.member_notifications (
            id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, false, false, 'voting', $4, NOW()
          )
        `, u.id, notifTitle, notifBody, pollId).catch(() => {});
      }
    } catch (err: any) {
      console.warn('[VotingService] Error broadcasting poll notification:', err?.message);
    }

    return this.getPollById(userId, pollId);
  }

  async closePoll(userId: string, id: string) {
    if (!id) throw new BadRequestException('ID is required');

    // 1. Mark poll as closed
    await this.prisma.$executeRaw`
      UPDATE public.polls
      SET status = 'closed', updated_at = now()
      WHERE id = ${id}::uuid
    `.catch(() => {});

    // 2. Fetch finalized poll details with options & source stats
    const poll = await this.getPollById(userId, id);
    const leadingOption = poll.options.find((o: any) => o.isLeading) || poll.options[0] || null;

    // 3. Broadcast final results to both ViOne App and Association App
    try {
      const users = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT u.id FROM (
          SELECT id FROM public.vione_users
          UNION
          SELECT user_id as id FROM public.members WHERE user_id IS NOT NULL
        ) u
      `.catch(() => [] as any[]);

      const notifTitle = `[Kết quả biểu quyết] ${poll.title}`;
      const notifBody = `Biểu quyết đã kết thúc. Phương án dẫn đầu: "${leadingOption?.title || 'Đã đóng'}" (${leadingOption?.percentage || 0}%). Tổng số: ${poll.totalVotes} lượt (${poll.sourceStats?.vioneApp || 0} ViOne, ${poll.sourceStats?.associationApp || 0} Hiệp hội).`;

      const safeDisplayData = JSON.stringify({
        title: poll.title,
        body: notifBody,
        pollId: id,
        status: 'closed',
        winner: leadingOption,
        options: poll.options,
        totalVotes: poll.totalVotes,
        sourceStats: poll.sourceStats,
        type: 'poll_result',
        targetRoute: '/voting',
      });

      for (const u of users) {
        if (!u.id) continue;
        const dedupeKey = `poll-result-${id}-${u.id}`;
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, 'voting', $2, 'poll_closed', 'poll_result',
            $3, $4, $5::jsonb, 'high', 'delivered', $6, 'all', 'all', NOW(), NOW()
          )
        `, u.id, id, notifTitle, notifBody, safeDisplayData, dedupeKey).catch(() => {});

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.member_notifications (
            id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, false, false, 'poll_result', $4, NOW()
          )
        `, u.id, notifTitle, notifBody, id).catch(() => {});
      }
    } catch (err: any) {
      console.warn('[VotingService] Error broadcasting poll close notification:', err?.message);
    }

    return poll;
  }

  async updatePoll(userId: string, id: string, data: any) {
    if (!id) throw new BadRequestException('ID is required');
    await this.prisma.$executeRaw`
      UPDATE public.polls
      SET title = COALESCE(${data.title}, title),
          description = COALESCE(${data.description || null}, description),
          status = COALESCE(${data.status || null}, status),
          updated_at = now()
      WHERE id = ${id}::uuid
    `.catch(() => {});
    return this.getPollById(userId, id);
  }

  async deletePoll(userId: string, id: string) {
    if (!id) throw new BadRequestException('ID is required');
    await this.prisma.$executeRaw`
      DELETE FROM public.poll_votes WHERE poll_id = ${id}::uuid
    `.catch(() => {});
    await this.prisma.$executeRaw`
      DELETE FROM public.poll_options WHERE poll_id = ${id}::uuid
    `.catch(() => {});
    await this.prisma.$executeRaw`
      DELETE FROM public.polls WHERE id = ${id}::uuid
    `.catch(() => {});
    return { ok: true, id };
  }

  async notifyLuckyDrawWinner(userId: string, data: {
    winnerName: string;
    winnerCompany?: string;
    winnerCode?: string;
    luckyNumber?: string;
    prize: string;
    eventName?: string;
    eventId?: string;
  }) {
    const title = `🎉 Chúc mừng bạn đã trúng ${data.prize}!`;
    const body = `Ban Tổ chức CLB Doanh Nhân CEO 1983 xin trân trọng chúc mừng Anh/Chị ${data.winnerName} (${data.winnerCompany || 'Hội viên'}, Số may mắn: #${data.luckyNumber || 'LUCKY'}) đã xuất sắc trúng giải thưởng "${data.prize}" tại sự kiện "${data.eventName || 'Sự kiện CEO 1983'}". Vui lòng liên hệ Ban Thư Ký để nhận giải!`;

    // 1. Tìm thông tin người nhận
    let recipients: any[] = [];
    if (data.winnerCode) {
      recipients = await this.prisma.$queryRaw<any[]>`
        SELECT user_id as id, code, name FROM public.members 
        WHERE code = ${data.winnerCode} OR id = ${data.winnerCode}
        LIMIT 1
      `.catch(() => []);
    }
    if (recipients.length === 0 && data.winnerName) {
      recipients = await this.prisma.$queryRaw<any[]>`
        SELECT user_id as id, code, name FROM public.members 
        WHERE LOWER(name) LIKE ${'%' + data.winnerName.toLowerCase() + '%'}
        LIMIT 1
      `.catch(() => []);
    }

    const safeDisplayData = JSON.stringify({
      winnerName: data.winnerName,
      winnerCompany: data.winnerCompany,
      winnerCode: data.winnerCode,
      luckyNumber: data.luckyNumber,
      prize: data.prize,
      eventName: data.eventName,
      eventId: data.eventId,
      type: 'lucky_draw_winner',
      targetRoute: '/association/events',
    });

    const targetUserId = recipients[0]?.id || userId;
    const targetMemberCode = recipients[0]?.code || data.winnerCode;

    // Gửi business_notifications (chuông thông báo app)
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'events', $2, 'lucky_draw_won', 'lucky_draw_winner',
        $3, $4, $5::jsonb, 'high', 'delivered', $6, 'association_app', 'association_app', NOW(), NOW()
      )
    `, targetUserId, data.eventId || 'lucky-draw', title, body, safeDisplayData, `lucky-win-${Date.now()}`).catch(() => {});

    // Gửi member_notifications
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.member_notifications (
        id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, false, false, 'lucky_draw', $4, NOW()
      )
    `, targetUserId, title, body, data.eventId || 'lucky-draw').catch(() => {});

    // Broadcast vào notifications hiệp hội
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.notifications (
        id, code, title, body, audience, channel, status, sent_at, reach, association_id, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'members', 'official_events', 'sent', NOW(), 1,
        'c1983000-0000-4000-8000-000000001983'::uuid, 'association_app', 'association_app', NOW(), NOW()
      )
    `, `NOTIF-WIN-${Date.now().toString().slice(-6)}`, title, body).catch(() => {});

    // Gửi tin nhắn chat 1-1 từ ADMIN
    if (targetMemberCode) {
      await this.prisma.$executeRaw`
        INSERT INTO public.messages (id, from_id, to_id, text, created_at)
        VALUES (gen_random_uuid(), 'ADMIN', ${String(targetMemberCode).toLowerCase()}, ${body}, NOW())
      `.catch(() => {});
    }

    return { ok: true, recipient: data.winnerName, prize: data.prize };
  }
}

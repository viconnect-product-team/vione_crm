import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ConnectDmRepository — Data Access Layer for Direct Messaging, Chat Threads, Messages & Reactions.
 * Encapsulates 100% of database interactions for DMs, Chat Threads, and Legacy Messages.
 */
@Injectable()
export class ConnectDmRepository {
  private readonly logger = new Logger(ConnectDmRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Member Code & User Resolution ──────────────────────────────────
  async findMemberCode(userId: string): Promise<string | null> {
    const mems = await this.prisma.$queryRaw<any[]>`
      SELECT m.code FROM public.members m
      WHERE m.user_id = ${userId}::uuid
         OR m.id = ${userId}::text
      LIMIT 1
    `.catch(() => []);
    return mems?.[0]?.code || null;
  }

  async findVioneUser(userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, email, username, name FROM public.vione_users WHERE id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    return rows?.[0] || null;
  }

  async findMemberByEmailOrCode(email: string, username: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT code FROM public.members 
      WHERE (email IS NOT NULL AND LOWER(email) = LOWER(${email}))
         OR (code IS NOT NULL AND LOWER(code) = LOWER(${username}))
      LIMIT 1
    `.catch(() => []);
    return rows?.[0] || null;
  }

  async linkMemberUserId(code: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.members SET user_id = ${userId}::uuid WHERE LOWER(code) = LOWER(${code})
    `.catch(() => null);
  }

  async insertMemberProfile(userId: string, code: string, name: string, email: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region,
        status, joined_at, fee_year, fee_paid, address, about, payment_status,
        user_id, association_id, created_at, updated_at
      ) VALUES (
        ${userId}::text, ${code}, ${name}, ${name},
        ${email}, '0983000000', 'corporate', 'standard', 'Kinh doanh & Quản lý', 'Hà Nội',
        'active', CURRENT_DATE, 2026, true, 'Hà Nội', 'Hội viên CLB Doanh Nhân CEO 1983', 'paid',
        ${userId}::uuid, 'c1983000-0000-4000-8000-000000001983'::uuid, now(), now()
      ) ON CONFLICT (id) DO UPDATE SET user_id = ${userId}::uuid
    `.catch(() => null);
  }

  // ── Member / Legacy Conversations ──────────────────────────────────
  async findMemberMessages(mine: string, myUserId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, from_id, to_id, text, created_at, read_at
      FROM public.messages
      WHERE LOWER(from_id) = ${mine} OR LOWER(to_id) = ${mine}
         OR LOWER(from_id) = ${myUserId} OR LOWER(to_id) = ${myUserId}
      ORDER BY created_at DESC
    `.catch(() => []);
  }

  async findMemberProfiles(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT m.id, m.code, m.user_id, m.name, m.contact,
             COALESCE(up.display_name, vu.name, bi.display_name, m.contact, m.name) as display_name,
             COALESCE(up.avatar_url, bi.avatar_url, vu.avatar_url, m.avatar) as avatar
      FROM public.members m
      LEFT JOIN public.user_profiles up ON up.user_id = m.user_id
      LEFT JOIN public.business_identities bi ON bi.owner_user_id = m.user_id AND bi.status = 'active'
      LEFT JOIN public.vione_users vu ON vu.id = m.user_id
    `.catch(() => []);
  }

  async findUserConnections(userId: string, peerUserIds: string[]): Promise<any[]> {
    if (peerUserIds.length === 0) return [];
    return this.prisma.$queryRaw<any[]>`
      SELECT id, requester_user_id, recipient_user_id, status
      FROM public.user_connections
      WHERE (requester_user_id = ${userId}::uuid AND recipient_user_id = ANY(${peerUserIds}::uuid[]))
         OR (recipient_user_id = ${userId}::uuid AND requester_user_id = ANY(${peerUserIds}::uuid[]))
    `.catch(() => []);
  }

  async findPeerMember(peer: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT m.id, m.code, m.user_id, m.name, m.contact,
             COALESCE(up.display_name, vu.name, bi.display_name, m.contact, m.name) as name,
             COALESCE(up.avatar_url, bi.avatar_url, vu.avatar_url, m.avatar) as avatar
      FROM public.members m
      LEFT JOIN public.user_profiles up ON up.user_id = m.user_id
      LEFT JOIN public.business_identities bi ON bi.owner_user_id = m.user_id AND bi.status = 'active'
      LEFT JOIN public.vione_users vu ON vu.id = m.user_id
      WHERE LOWER(m.code) = ${peer.toLowerCase()}
         OR m.user_id::text = ${peer}
         OR m.id = ${peer}
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async findMessagesBetween(myList: string[], peerList: string[]): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, from_id, to_id, text, created_at, read_at
      FROM public.messages
      WHERE (LOWER(from_id) = ANY(${myList}::text[]) AND LOWER(to_id) = ANY(${peerList}::text[]))
         OR (LOWER(from_id) = ANY(${peerList}::text[]) AND LOWER(to_id) = ANY(${myList}::text[]))
      ORDER BY created_at ASC
    `.catch(() => []);
  }

  async findChannelMessages(channelId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, from_id, to_id, text, created_at, read_at
      FROM public.messages
      WHERE LOWER(to_id) = ${channelId.toLowerCase()} OR LOWER(from_id) = ${channelId.toLowerCase()}
      ORDER BY created_at ASC
    `.catch(() => []);
  }

  async insertAdminSeedMessages(mine: string, welcomeMsg: string, paymentMsg: string, meetingMsg: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.messages (id, from_id, to_id, text, created_at)
      VALUES 
        (gen_random_uuid(), 'admin', ${mine}, ${welcomeMsg}, now() - interval '2 days'),
        (gen_random_uuid(), 'admin', ${mine}, ${paymentMsg}, now() - interval '1 hour'),
        (gen_random_uuid(), 'admin', ${mine}, ${meetingMsg}, now() - interval '10 minutes')
    `.catch(() => null);
  }

  async insertChannelSeedMessage(channelId: string, seedText: string, offsetMins: number): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.messages (id, from_id, to_id, text, created_at)
      VALUES (gen_random_uuid(), ${channelId}, ${channelId}, ${seedText}, now() - (${offsetMins} * interval '1 minute'))
    `.catch(() => null);
  }

  async markMessagesRead(peerList: string[], myList: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.messages
      SET read_at = now()
      WHERE LOWER(from_id) = ANY(${peerList}::text[]) AND LOWER(to_id) = ANY(${myList}::text[]) AND read_at IS NULL
    `.catch(() => null);
  }

  async findMemberByCodeOrId(peerCode: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT m.code, m.user_id FROM public.members m
      WHERE LOWER(m.code) = LOWER(${peerCode}) OR m.user_id::text = LOWER(${peerCode}) OR m.id = LOWER(${peerCode})
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async insertMessage(fromCode: string, toCode: string, text: string): Promise<any> {
    const res = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.messages (id, from_id, to_id, text, created_at)
      VALUES (gen_random_uuid(), ${fromCode}, ${toCode}, ${text}, now())
      RETURNING id, from_id, to_id, text, created_at
    `.catch(async () => {
      await this.prisma.$executeRaw`
        INSERT INTO public.messages (id, from_id, to_id, text, created_at)
        VALUES (gen_random_uuid(), ${fromCode}, ${toCode}, ${text}, now())
      `.catch(() => null);
      return [{ id: 'msg-' + Date.now(), text, created_at: new Date() }];
    });
    return res?.[0] || { id: 'msg-' + Date.now(), text, created_at: new Date() };
  }

  async findMessageById(messageId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, from_id, to_id, text FROM public.messages WHERE id = ${messageId}::uuid LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async retractMessage(messageId: string, mine: string, isUuid: boolean): Promise<void> {
    if (isUuid) {
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
  }

  // ── Direct Messaging Threads (1-1 Inbox) ───────────────────────────
  async findDmThreads(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT t.id, t.user1_id, t.user2_id, t.last_message_at, t.last_message_body,
             (SELECT COUNT(*)::int FROM public.direct_messages m 
              WHERE m.thread_id = t.id AND m.sender_user_id != ${userId}::uuid AND m.read_at IS NULL AND m.is_retracted = false) as unread_count,
             (SELECT m.sender_user_id FROM public.direct_messages m 
              WHERE m.thread_id = t.id AND m.is_retracted = false ORDER BY m.created_at DESC LIMIT 1) as last_sender_id
      FROM public.direct_message_threads t
      WHERE t.user1_id = ${userId}::uuid OR t.user2_id = ${userId}::uuid
      ORDER BY t.last_message_at DESC NULLS LAST, t.updated_at DESC
    `.catch(() => []);
  }

  async findAcceptedConnections(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT requester_user_id, recipient_user_id
      FROM public.user_connections
      WHERE status = 'accepted'::public.global_connection_status 
        AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
    `.catch(() => []);
  }

  async findCounterpartProfiles(idsArray: string[]): Promise<{ identities: any[]; profiles: any[]; members: any[]; vUsers: any[] }> {
    if (idsArray.length === 0) return { identities: [], profiles: [], members: [], vUsers: [] };
    const [identities, profiles, members, vUsers] = await Promise.all([
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
        SELECT user_id, code, name, avatar, company, position 
        FROM public.members 
        WHERE user_id = ANY(${idsArray}::uuid[])
      `.catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT id, name, username, avatar_url 
        FROM public.vione_users 
        WHERE id = ANY(${idsArray}::uuid[])
      `.catch(() => []),
    ]);
    return { identities, profiles, members, vUsers };
  }

  async findLegacyMessagesForKeys(myKeys: string[]): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, from_id, to_id, text, created_at, read_at
      FROM public.messages
      WHERE LOWER(from_id) = ANY(${myKeys}::text[]) OR LOWER(to_id) = ANY(${myKeys}::text[])
      ORDER BY created_at DESC
    `.catch(() => []);
  }

  async findAllMembersWithProfiles(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT m.id, m.code, m.user_id, m.name, m.avatar, m.company, m.position,
             COALESCE(up.display_name, vu.name, bi.display_name, m.name) as display_name,
             COALESCE(up.avatar_url, bi.avatar_url, vu.avatar_url, m.avatar) as avatar_url,
             COALESCE(bi.headline, bi.job_title, up.professional_title, m.position) as headline,
             COALESCE(bi.company_name, up.company_name, m.company) as company_name
      FROM public.members m
      LEFT JOIN public.user_profiles up ON up.user_id = m.user_id
      LEFT JOIN public.business_identities bi ON bi.owner_user_id = m.user_id AND bi.status = 'active'
      LEFT JOIN public.vione_users vu ON vu.id = m.user_id
    `.catch(() => []);
  }

  async upsertDmThreadWithLastMessage(threadId: string, u1: string, u2: string, lastMessageAt: Date | string, lastMessageBody: string): Promise<string | null> {
    try {
      const ensured = await this.prisma.$queryRaw<any[]>`
        INSERT INTO public.direct_message_threads (id, user1_id, user2_id, last_message_at, last_message_body, created_at, updated_at)
        VALUES (${threadId}::uuid, ${u1}::uuid, ${u2}::uuid, ${lastMessageAt || new Date()}, ${lastMessageBody || ''}, now(), now())
        ON CONFLICT (user1_id, user2_id) DO UPDATE 
        SET last_message_at = EXCLUDED.last_message_at, last_message_body = EXCLUDED.last_message_body, updated_at = now()
        RETURNING id
      `.catch(() => []);
      return ensured?.[0]?.id || null;
    } catch {
      return null;
    }
  }

  async upsertEmptyDmThread(threadId: string, u1: string, u2: string): Promise<string | null> {
    try {
      const ensured = await this.prisma.$queryRaw<any[]>`
        INSERT INTO public.direct_message_threads (id, user1_id, user2_id, last_message_at, created_at, updated_at)
        VALUES (${threadId}::uuid, ${u1}::uuid, ${u2}::uuid, null, now(), now())
        ON CONFLICT (user1_id, user2_id) DO UPDATE SET updated_at = now()
        RETURNING id
      `.catch(() => []);
      return ensured?.[0]?.id || null;
    } catch {
      return null;
    }
  }

  // ── Open & Detail DM Threads ─────────────────────────────────────────
  async findUserByEmailOrUsernameOrMemberCode(cleanId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT u.id FROM public.users u
      LEFT JOIN public.members m ON m.user_id = u.id
      WHERE LOWER(u.email) = LOWER(${cleanId})
         OR LOWER(u.username) = LOWER(${cleanId})
         OR LOWER(m.code) = LOWER(${cleanId})
         OR LOWER(m.id) = LOWER(${cleanId})
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async findDmThreadBetween(u1: string, u2: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.direct_message_threads
      WHERE (user1_id = ${u1}::uuid AND user2_id = ${u2}::uuid)
         OR (user1_id = ${u2}::uuid AND user2_id = ${u1}::uuid)
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async createDmThread(threadId: string, u1: string, u2: string): Promise<string> {
    try {
      const inserted = await this.prisma.$queryRaw<any[]>`
        INSERT INTO public.direct_message_threads (id, user1_id, user2_id, last_message_at, created_at, updated_at)
        VALUES (${threadId}::uuid, ${u1}::uuid, ${u2}::uuid, null, now(), now())
        ON CONFLICT (user1_id, user2_id) DO UPDATE SET updated_at = now()
        RETURNING id
      `;
      if (inserted && inserted.length > 0 && inserted[0].id) {
        return inserted[0].id;
      }
    } catch {
      const fallback = await this.findDmThreadBetween(u1, u2);
      if (fallback) return fallback.id;
    }
    return threadId;
  }

  async findDmThreadByIdAndUser(threadId: string, userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, user1_id, user2_id, last_message_at, last_message_body
      FROM public.direct_message_threads
      WHERE id = ${threadId}::uuid AND (user1_id = ${userId}::uuid OR user2_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async findDmThreadBetweenOrdered(cleanTarget: string, userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, user1_id, user2_id, last_message_at, last_message_body
      FROM public.direct_message_threads
      WHERE (user1_id = ${cleanTarget}::uuid AND user2_id = ${userId}::uuid)
         OR (user1_id = ${userId}::uuid AND user2_id = ${cleanTarget}::uuid)
      ORDER BY last_message_at DESC NULLS LAST
      LIMIT 1
    `.catch(() => []);
  }

  async findUserConnectionById(connectionId: string, userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT requester_user_id, recipient_user_id
      FROM public.user_connections
      WHERE id = ${connectionId}::uuid AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async findThreadUserProfile(counterpartId: string): Promise<{
    ident: any | null;
    prof: any | null;
    mem: any | null;
    conn: any | null;
    counterpartUser: any | null;
  }> {
    const [ident, prof, mem, conn, cpUser] = await Promise.all([
      this.prisma.$queryRaw<any[]>`SELECT display_name, avatar_url, headline, job_title, company_name FROM public.business_identities WHERE owner_user_id = ${counterpartId}::uuid LIMIT 1`.catch(() => []),
      this.prisma.$queryRaw<any[]>`SELECT display_name, avatar_url, professional_title, company_name FROM public.user_profiles WHERE user_id = ${counterpartId}::uuid LIMIT 1`.catch(() => []),
      this.prisma.$queryRaw<any[]>`SELECT name, avatar, company, position, code FROM public.members WHERE user_id = ${counterpartId}::uuid LIMIT 1`.catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.user_connections
        WHERE status = 'accepted'::public.global_connection_status
          AND (requester_user_id = ${counterpartId}::uuid OR recipient_user_id = ${counterpartId}::uuid)
        LIMIT 1
      `.catch(() => []),
      this.prisma.$queryRaw<any[]>`SELECT email, username FROM public.users WHERE id = ${counterpartId}::uuid LIMIT 1`.catch(() => []),
    ]);
    return {
      ident: ident[0] || null,
      prof: prof[0] || null,
      mem: mem[0] || null,
      conn: conn[0] || null,
      counterpartUser: cpUser[0] || null,
    };
  }

  async checkConnectionAccepted(userId: string, counterpartId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.user_connections
      WHERE status = 'accepted'::public.global_connection_status
        AND ((requester_user_id = ${userId}::uuid AND recipient_user_id = ${counterpartId}::uuid)
          OR (requester_user_id = ${counterpartId}::uuid AND recipient_user_id = ${userId}::uuid))
      LIMIT 1
    `.catch(() => []);
    return rows.length > 0;
  }

  async findUserAccount(userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT email, username FROM public.users WHERE id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async markDirectMessagesRead(threadId: string, userId: string): Promise<number> {
    const res = await this.prisma.$executeRaw`
      UPDATE public.direct_messages
      SET read_at = now()
      WHERE thread_id = ${threadId}::uuid AND sender_user_id != ${userId}::uuid AND read_at IS NULL
    `.catch(() => 0);
    return Number(res || 0);
  }

  async findDirectMessagesByThread(threadId: string, limit = 100): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, thread_id, sender_user_id, body, client_token, reply_to, reactions, is_retracted, read_at, created_at, updated_at
      FROM public.direct_messages
      WHERE thread_id = ${threadId}::uuid
      ORDER BY created_at ASC
      LIMIT ${limit}
    `.catch(() => []);
  }

  async findLegacyMessagesBetweenKeys(myKeys: string[], counterpartKeys: string[], limit = 100): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, from_id, to_id, text, created_at, read_at
      FROM public.messages
      WHERE ((LOWER(from_id) = ANY(${myKeys}::text[]) AND LOWER(to_id) = ANY(${counterpartKeys}::text[]))
         OR (LOWER(to_id) = ANY(${myKeys}::text[]) AND LOWER(from_id) = ANY(${counterpartKeys}::text[])))
      ORDER BY created_at ASC
      LIMIT ${limit}
    `.catch(() => []);
  }

  // ── Send & Modify Direct Messages ──────────────────────────────────
  async insertDirectMessage(id: string, threadId: string, senderUserId: string, body: string, clientToken?: string, replyTo?: any): Promise<void> {
    const replyJson = replyTo ? JSON.stringify(replyTo) : null;
    await this.prisma.$executeRaw`
      INSERT INTO public.direct_messages (id, thread_id, sender_user_id, body, client_token, reply_to, created_at, updated_at)
      VALUES (
        ${id}::uuid, 
        ${threadId}::uuid, 
        ${senderUserId}::uuid, 
        ${body}, 
        ${clientToken || null}, 
        ${replyJson}::jsonb, 
        now(), 
        now()
      )
    `;
  }

  async updateDmThreadLastMessage(threadId: string, body: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.direct_message_threads
      SET last_message_at = now(), last_message_body = ${body.slice(0, 150)}, updated_at = now()
      WHERE id = ${threadId}::uuid
    `.catch(() => null);
  }

  async syncDirectMessageToLegacy(id: string, fromId: string, toId: string, text: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.messages (id, from_id, to_id, text, created_at)
      VALUES (${id}::uuid, ${fromId}, ${toId}, ${text}, now())
    `.catch(() => null);
  }

  async checkMemberConnectionExists(userId: string, counterpartId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 1 FROM public.member_connections
      WHERE (user_id = ${userId}::uuid AND peer_user_id = ${counterpartId}::uuid)
         OR (user_id = ${counterpartId}::uuid AND peer_user_id = ${userId}::uuid)
      LIMIT 1
    `.catch(() => []);
    return rows.length > 0;
  }

  async findMemberNameCompany(userId: string): Promise<{ name: string; company: string } | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT name, company FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async insertBusinessNotification(data: {
    id: string;
    recipientUserId: string;
    threadId: string;
    newMsgId: string;
    title: string;
    body: string;
    safeDisplayData: any;
  }): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, dedupe_key, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, app_scope, target_app, created_at, updated_at
      ) VALUES (
        ${data.id}::uuid, ${data.recipientUserId}::uuid, 'dm', ${data.threadId}, ${`dm_notif_${data.newMsgId}`}, 'dm_message_received', 'dm_message_received',
        ${data.title},
        ${data.body},
        ${JSON.stringify(data.safeDisplayData)}::jsonb,
        'high', 'delivered', 'all', 'all', now(), now()
      )
    `.catch(() => null);
  }

  async insertActivityLog(id: string, code: string, userId: string, summary: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.activity_log (id, code, "user", action, target, category, at, ip, created_at, updated_at)
      VALUES (${id}::uuid, ${code}, ${userId}, 'Tin nhắn đa kênh', ${summary}, 'message', now(), '127.0.0.1', now(), now())
    `.catch(() => null);
  }

  async findDirectMessageById(messageId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, thread_id, sender_user_id FROM public.direct_messages WHERE id = ${messageId}::uuid LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async retractDirectMessage(messageId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.direct_messages
      SET is_retracted = true, updated_at = now()
      WHERE id = ${messageId}::uuid
    `.catch(() => null);
  }

  async findDirectMessageWithReactions(messageId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, thread_id, reactions FROM public.direct_messages WHERE id = ${messageId}::uuid LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async updateDirectMessageReactions(messageId: string, reactions: any[]): Promise<void> {
    const reactionsJson = JSON.stringify(reactions);
    await this.prisma.$executeRaw`
      UPDATE public.direct_messages
      SET reactions = ${reactionsJson}::jsonb, updated_at = now()
      WHERE id = ${messageId}::uuid
    `.catch(() => null);
  }

  // ── Mentionable Users & Tagging ─────────────────────────────────────
  async findAcceptedConnectionFriends(userId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT requester_user_id, recipient_user_id
      FROM public.user_connections
      WHERE status = 'accepted'::public.global_connection_status 
        AND (requester_user_id = ${userId}::uuid OR recipient_user_id = ${userId}::uuid)
      LIMIT 200
    `.catch(() => []);
  }

  async findIdentitiesByUserIds(userIds: string[]): Promise<any[]> {
    if (userIds.length === 0) return [];
    return this.prisma.$queryRaw<any[]>`
      SELECT bi.owner_user_id as user_id, bi.display_name, bi.avatar_url, bi.headline, bi.job_title, bi.company_name
      FROM public.business_identities bi
      WHERE bi.owner_user_id = ANY(${userIds}::uuid[])
    `.catch(() => []);
  }

  async findProfilesAndMembersByUserIds(missingIds: string[]): Promise<{ profiles: any[]; members: any[] }> {
    if (missingIds.length === 0) return { profiles: [], members: [] };
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
    return { profiles, members };
  }
}

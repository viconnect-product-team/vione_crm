import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ConnectMomentRepository — Data Access Layer for Business Relationship Moments, Comments, Likes, Media, and Reminders.
 * Encapsulates 100% of raw SQL and database interactions for moments.
 */
@Injectable()
export class ConnectMomentRepository {
  private readonly logger = new Logger(ConnectMomentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkUserConnection(userId: string, targetId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.user_connections
      WHERE status = 'accepted'::public.global_connection_status
        AND ((requester_user_id = ${userId}::uuid AND recipient_user_id = ${targetId}::uuid)
          OR (requester_user_id = ${targetId}::uuid AND recipient_user_id = ${userId}::uuid))
      LIMIT 1
    `.catch(() => []);
    return rows.length > 0;
  }

  async checkGuestContact(userId: string, targetId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.guest_contacts
      WHERE owner_user_id = ${userId}::uuid AND id = ${targetId}::uuid
      LIMIT 1
    `.catch(() => []);
    return rows.length > 0;
  }

  async checkSavedCard(userId: string, targetId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.saved_business_cards
      WHERE owner_user_id = ${userId}::uuid AND target_card_id = ${targetId}::uuid AND archived = false
      LIMIT 1
    `.catch(() => []);
    return rows.length > 0;
  }

  async findMomentByClientToken(userId: string, clientToken: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, status FROM public.business_relationship_moments
      WHERE owner_user_id = ${userId}::uuid AND client_token = ${clientToken}::uuid
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async updateMomentDetails(momentId: string, data: any): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.business_relationship_moments
      SET occurred_at = ${data.occurredAt},
          event_name = ${data.eventName || null},
          place_label = ${data.placeLabel || null},
          note = ${data.note || null},
          visibility = ${data.visibility || 'friends'},
          updated_at = now()
      WHERE id = ${momentId}::uuid
    `;
  }

  async insertPendingMoment(data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_relationship_moments (
        id, owner_user_id, target_kind, target_user_id, target_card_id, target_guest_id,
        occurred_at, event_name, place_label, note, status, visibility, client_token, created_at, updated_at
      ) VALUES (
        ${data.id}::uuid, ${data.ownerUserId}::uuid, ${data.targetKind},
        ${data.targetUserId ? data.targetUserId : null}::uuid,
        ${data.targetCardId ? data.targetCardId : null}::uuid,
        ${data.targetGuestId ? data.targetGuestId : null}::uuid,
        ${data.occurredAt}, ${data.eventName || null}, ${data.placeLabel || null}, ${data.note || null},
        'pending', ${data.visibility || 'friends'}, ${data.clientToken}::uuid, now(), now()
      )
    `;
  }

  async deleteMomentMedia(momentId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
    `;
  }

  async insertMomentMedia(media: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_relationship_moment_media (
        id, moment_id, owner_user_id, storage_path, media_type, sort_order
      ) VALUES (
        ${media.id}::uuid, ${media.momentId}::uuid, ${media.ownerUserId}::uuid, ${media.storagePath}, 'image/jpeg', ${media.sortOrder}
      )
    `.catch(() => null);
  }

  async findMomentByIdAndOwner(momentId: string, userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, status FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async updateMediaStoragePath(mediaId: string, userId: string, storagePath: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.business_relationship_moment_media
      SET storage_path = ${storagePath}
      WHERE id = ${mediaId}::uuid AND owner_user_id = ${userId}::uuid
    `;
  }

  async findMomentMediaSlots(momentId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid
    `.catch(() => []);
  }

  async deleteMomentMediaExcept(momentId: string, userId: string, keepIds: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid AND NOT (id = ANY(${keepIds}::uuid[]))
    `;
  }

  async activateMoment(momentId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.business_relationship_moments
      SET status = 'active', updated_at = now()
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid AND status = 'pending'
    `;
  }

  async findActiveMomentDetails(momentId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT target_user_id, note, event_name, place_label
      FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async updateMomentComplete(momentId: string, userId: string, data: any): Promise<void> {
    if (data.targetKind) {
      await this.prisma.$executeRaw`
        UPDATE public.business_relationship_moments
        SET occurred_at = ${data.safeOccurredAt},
            event_name = ${data.eventName || null},
            place_label = ${data.placeLabel || null},
            note = ${data.note || null},
            visibility = COALESCE(${data.visibility || null}, visibility, 'friends'),
            target_kind = ${data.targetKind},
            target_user_id = ${data.targetUserId ? data.targetUserId : null}::uuid,
            target_card_id = ${data.targetCardId ? data.targetCardId : null}::uuid,
            target_guest_id = ${data.targetGuestId ? data.targetGuestId : null}::uuid,
            updated_at = now()
        WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE public.business_relationship_moments
        SET occurred_at = ${data.safeOccurredAt},
            event_name = ${data.eventName || null},
            place_label = ${data.placeLabel || null},
            note = ${data.note || null},
            visibility = COALESCE(${data.visibility || null}, visibility, 'friends'),
            updated_at = now()
        WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
      `;
    }
  }

  async deleteMomentCascade(momentId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
    `;
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moments
      WHERE id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid
    `;
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_comments WHERE moment_id = ${momentId}::uuid
    `.catch(() => null);
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_likes WHERE moment_id = ${momentId}::uuid
    `.catch(() => null);
  }

  async listMomentComments(momentId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT c.id, c.moment_id, c.user_id, c.parent_id, c.content, c.photo_url, c.mentions, c.created_at, c.updated_at,
             bi.display_name, bi.avatar_url, bi.job_title, bi.company_name
      FROM public.business_relationship_moment_comments c
      LEFT JOIN public.business_identities bi ON c.user_id = bi.owner_user_id
      WHERE c.moment_id = ${momentId}::uuid
      ORDER BY c.created_at ASC
    `.catch(() => [] as any[]);
  }

  async findCommentLikes(commentIds: string[]): Promise<any[]> {
    if (commentIds.length === 0) return [];
    return this.prisma.$queryRaw<any[]>`
      SELECT comment_id, user_id FROM public.business_relationship_moment_comment_likes
      WHERE comment_id = ANY(${commentIds}::uuid[])
    `.catch(() => [] as any[]);
  }

  async insertComment(data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_relationship_moment_comments (
        id, moment_id, user_id, parent_id, content, photo_url, mentions, created_at, updated_at
      ) VALUES (
        ${data.id}::uuid, ${data.momentId}::uuid, ${data.userId}::uuid,
        ${data.parentId ? data.parentId : null}::uuid,
        ${data.content},
        ${data.photoUrl},
        ${data.mentionsJson}::jsonb,
        ${data.createdAt}, ${data.updatedAt}
      )
    `;
  }

  async findAuthorIdentity(userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT display_name, avatar_url, job_title, company_name
      FROM public.business_identities
      WHERE owner_user_id = ${userId}::uuid AND status = 'active'
      LIMIT 1
    `.catch(() => [] as any[]);
    return rows[0] || null;
  }

  async findMomentOwnerAndMutes(momentId: string): Promise<{ momentOwnerId: string | null; eventName: string; placeLabel: string; mutedUserIds: Set<string> }> {
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

    const momentOwnerId = momentRows[0]?.owner_user_id || null;
    const eventName = momentRows[0]?.event_name || '';
    const placeLabel = momentRows[0]?.place_label || '';
    const mutedUserIds = new Set(mutedRows.map((r) => String(r.user_id).toLowerCase()));

    return { momentOwnerId, eventName, placeLabel, mutedUserIds };
  }

  async insertBusinessNotification(notif: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
        priority, status, created_at, updated_at, dedupe_key
      ) VALUES (
        ${notif.id}::uuid, ${notif.recipientUserId}::uuid, ${notif.sourceDomain}, ${notif.sourceRecordId}, ${notif.eventKind}, ${notif.notificationKind},
        ${notif.titleKey}, ${notif.bodyKey},
        ${notif.safeDisplayData}::jsonb, ${notif.actionKind}, ${notif.actionLabelKey}, ${notif.actionTarget}::jsonb,
        ${notif.priority || 'normal'}, 'delivered', now(), now(), ${notif.dedupeKey}
      )
    `.catch(() => null);
  }

  async findParentCommentAuthor(parentId: string): Promise<string | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT user_id FROM public.business_relationship_moment_comments WHERE id = ${parentId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    return rows[0]?.user_id || null;
  }

  async toggleMute(userId: string, momentId: string): Promise<boolean> {
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
      return false;
    } else {
      await this.prisma.$executeRaw`
        INSERT INTO public.business_relationship_moment_mutes (id, moment_id, user_id, created_at)
        VALUES (gen_random_uuid(), ${momentId}::uuid, ${userId}::uuid, now())
        ON CONFLICT (moment_id, user_id) DO NOTHING
      `;
      return true;
    }
  }

  async isMomentMuted(userId: string, momentId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.business_relationship_moment_mutes
      WHERE moment_id = ${momentId}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    return rows.length > 0;
  }

  async findCommentWithMomentOwner(commentId: string, momentId: string): Promise<{ comment: any | null; momentOwnerId: string | null }> {
    const [commentRows, momentRows] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT user_id, moment_id FROM public.business_relationship_moment_comments
        WHERE id = ${commentId}::uuid LIMIT 1
      `.catch(() => [] as any[]),
      this.prisma.$queryRaw<any[]>`
        SELECT owner_user_id FROM public.business_relationship_moments WHERE id = ${momentId}::uuid LIMIT 1
      `.catch(() => [] as any[]),
    ]);
    return {
      comment: commentRows[0] || null,
      momentOwnerId: momentRows[0]?.owner_user_id || null,
    };
  }

  async deleteCommentAndReplies(commentId: string): Promise<void> {
    const childComments = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE comment_tree AS (
        SELECT id FROM public.business_relationship_moment_comments WHERE id = ${commentId}::uuid
        UNION ALL
        SELECT c.id FROM public.business_relationship_moment_comments c
        INNER JOIN comment_tree ct ON c.parent_id = ct.id
      )
      SELECT id FROM comment_tree;
    `.catch(() => [{ id: commentId }]);

    const allIds = childComments.map((c) => c.id);
    if (allIds.length > 0) {
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_comment_likes WHERE comment_id = ANY(${allIds}::uuid[])
      `.catch(() => null);
      await this.prisma.$executeRaw`
        DELETE FROM public.business_relationship_moment_comments WHERE id = ANY(${allIds}::uuid[])
      `.catch(() => null);
    }
  }

  async toggleCommentLike(userId: string, commentId: string): Promise<{ liked: boolean; count: number }> {
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

    return { liked, count: Number(countRows[0]?.count || 0) };
  }

  async toggleMomentLike(userId: string, momentId: string): Promise<{ liked: boolean; count: number }> {
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

    return { liked, count: Number(countRows[0]?.count || 0) };
  }

  async getMomentLikeStatus(userId: string, momentId: string): Promise<{ likesCount: number; userLiked: boolean; commentsCount: number }> {
    const [countRows, userLikedRows, commentCountRows] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(id)::int as count FROM public.business_relationship_moment_likes
        WHERE moment_id = ${momentId}::uuid
      `.catch(() => [{ count: 0 }]),
      this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.business_relationship_moment_likes
        WHERE moment_id = ${momentId}::uuid AND user_id = ${userId}::uuid
        LIMIT 1
      `.catch(() => [] as any[]),
      this.prisma.$queryRaw<any[]>`
        SELECT COUNT(id)::int as count FROM public.business_relationship_moment_comments
        WHERE moment_id = ${momentId}::uuid
      `.catch(() => [{ count: 0 }]),
    ]);

    return {
      likesCount: Number(countRows[0]?.count || 0),
      userLiked: userLikedRows.length > 0,
      commentsCount: Number(commentCountRows[0]?.count || 0),
    };
  }

  async findMomentPhotos(momentId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT id, moment_id, storage_path, sort_order
      FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid
      ORDER BY sort_order ASC
    `.catch(() => []);
  }

  async findExistingSortOrders(momentId: string): Promise<number[]> {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT sort_order FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid
    `.catch(() => [] as any[]);
    return existing.map((s) => s.sort_order);
  }

  async deleteMediaByIds(momentId: string, userId: string, dropIds: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid AND id = ANY(${dropIds}::uuid[])
    `;
  }

  async deleteSingleMedia(momentId: string, userId: string, mediaId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_media
      WHERE moment_id = ${momentId}::uuid AND owner_user_id = ${userId}::uuid AND id = ${mediaId}::uuid
    `;
  }

  async findReminders(userId: string, momentId: string | null, includeDone: boolean, limit: number): Promise<any[]> {
    if (momentId) {
      if (includeDone) {
        return this.prisma.$queryRaw<any[]>`
          SELECT id, moment_id, remind_at, label, status, completed_at
          FROM public.business_relationship_moment_reminders
          WHERE owner_user_id = ${userId}::uuid AND moment_id = ${momentId}::uuid
          ORDER BY remind_at ASC
          LIMIT ${limit}
        `.catch(() => []);
      } else {
        return this.prisma.$queryRaw<any[]>`
          SELECT id, moment_id, remind_at, label, status, completed_at
          FROM public.business_relationship_moment_reminders
          WHERE owner_user_id = ${userId}::uuid AND moment_id = ${momentId}::uuid AND status = 'pending'
          ORDER BY remind_at ASC
          LIMIT ${limit}
        `.catch(() => []);
      }
    } else {
      if (includeDone) {
        return this.prisma.$queryRaw<any[]>`
          SELECT id, moment_id, remind_at, label, status, completed_at
          FROM public.business_relationship_moment_reminders
          WHERE owner_user_id = ${userId}::uuid
          ORDER BY remind_at ASC
          LIMIT ${limit}
        `.catch(() => []);
      } else {
        return this.prisma.$queryRaw<any[]>`
          SELECT id, moment_id, remind_at, label, status, completed_at
          FROM public.business_relationship_moment_reminders
          WHERE owner_user_id = ${userId}::uuid AND status = 'pending'
          ORDER BY remind_at ASC
          LIMIT ${limit}
        `.catch(() => []);
      }
    }
  }

  async countPendingReminders(userId: string, momentId: string): Promise<number> {
    const countRow = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(id)::int as count FROM public.business_relationship_moment_reminders
      WHERE owner_user_id = ${userId}::uuid AND moment_id = ${momentId}::uuid AND status = 'pending'
    `.catch(() => []);
    return countRow[0]?.count || 0;
  }

  async insertReminder(id: string, momentId: string, userId: string, remindAt: Date, label: string | null): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_relationship_moment_reminders (
        id, moment_id, owner_user_id, remind_at, label, status
      ) VALUES (
        ${id}::uuid, ${momentId}::uuid, ${userId}::uuid, ${remindAt}, ${label || null}, 'pending'
      )
    `;
  }

  async findReminder(reminderId: string, userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, moment_id, remind_at, label, status, completed_at
      FROM public.business_relationship_moment_reminders
      WHERE id = ${reminderId}::uuid AND owner_user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async updateReminderStatus(reminderId: string, userId: string, status: string, completedAt: Date | null): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.business_relationship_moment_reminders
      SET status = ${status},
          completed_at = ${completedAt}
      WHERE id = ${reminderId}::uuid AND owner_user_id = ${userId}::uuid
    `;
  }

  async deleteReminder(reminderId: string, userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.business_relationship_moment_reminders
      WHERE id = ${reminderId}::uuid AND owner_user_id = ${userId}::uuid
    `;
  }
}

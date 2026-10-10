import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConnectAppGateway } from '../connect-app.gateway';
import { ConnectMomentRepository } from '../repositories/connect-moment.repository';
import * as crypto from 'crypto';

/**
 * ConnectMomentService — Business logic service for moments, comments, reactions, and media.
 * 100% separated from SQL & database access via ConnectMomentRepository.
 */
@Injectable()
export class ConnectMomentService {
  private readonly logger = new Logger(ConnectMomentService.name);

  constructor(
    private readonly repo: ConnectMomentRepository,
    private readonly gateway: ConnectAppGateway,
  ) {}

  async prepareMoment(userId: string, input: any) {
    const { personId, occurredAt, eventName, placeLabel, note, photoCount, clientToken, visibility = 'friends' } = input;

    let targetKind = 'general';
    let targetUserId: string | null = null;
    let targetCardId: string | null = null;
    let targetGuestId: string | null = null;

    if (personId && personId !== 'general' && personId !== 'all') {
      let normPersonId = String(personId).trim();
      try {
        normPersonId = decodeURIComponent(normPersonId);
      } catch {}
      if (/^[0-9a-fA-F-]{36}$/.test(normPersonId)) {
        normPersonId = `u:${normPersonId}`;
      } else if (!/^([ucg]):/.test(normPersonId)) {
        const match = normPersonId.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
        if (match) {
          normPersonId = `u:${match[0]}`;
        }
      }

      const m = /^([ucg]):([0-9a-fA-F-]{36})$/.exec(normPersonId);
      if (!m) {
        targetKind = 'general';
      } else {
        const namespace = m[1];
        const targetId = m[2].toLowerCase();

        if (namespace === 'u') {
          if (targetId === userId) {
            targetKind = 'general';
          } else {
            const isConn = await this.repo.checkUserConnection(userId, targetId);
            targetKind = isConn ? 'connection' : 'general';
            targetUserId = targetId;
          }
        } else if (namespace === 'g') {
          const isGuest = await this.repo.checkGuestContact(userId, targetId);
          targetKind = isGuest ? 'guest_contact' : 'general';
          targetGuestId = targetId;
        } else {
          const isCard = await this.repo.checkSavedCard(userId, targetId);
          targetKind = isCard ? 'saved_card' : 'general';
          targetCardId = targetId;
        }
      }
    } else {
      targetKind = 'general';
    }

    if (targetKind === 'general') {
      targetUserId = null;
      targetCardId = null;
      targetGuestId = null;
    }

    const parsedOccurredAt = occurredAt ? new Date(occurredAt) : new Date();
    const safeOccurredAt = isNaN(parsedOccurredAt.getTime()) ? new Date() : parsedOccurredAt;
    const safeClientToken = (clientToken && /^[0-9a-fA-F-]{36}$/.test(String(clientToken)))
      ? String(clientToken)
      : crypto.randomUUID();

    const existing = await this.repo.findMomentByClientToken(userId, safeClientToken);

    let momentId: string;

    if (existing) {
      momentId = existing.id;
      if (existing.status === 'active') {
        return { ok: true, alreadySaved: true, momentId, photos: [] };
      }
      await this.repo.updateMomentDetails(momentId, {
        occurredAt: safeOccurredAt,
        eventName,
        placeLabel,
        note,
        visibility,
      });
    } else {
      momentId = crypto.randomUUID();
      await this.repo.insertPendingMoment({
        id: momentId,
        ownerUserId: userId,
        targetKind,
        targetUserId,
        targetCardId,
        targetGuestId,
        occurredAt: safeOccurredAt,
        eventName,
        placeLabel,
        note,
        visibility,
        clientToken: safeClientToken,
      });
    }

    await this.repo.deleteMomentMedia(momentId, userId);

    const photos: any[] = [];
    const directUrls: string[] = Array.isArray(input?.photoUrls) ? input.photoUrls : [];
    const effectiveCount = Math.max(photoCount || 0, directUrls.length);

    if (effectiveCount > 0) {
      for (let i = 0; i < effectiveCount; i++) {
        const mediaId = crypto.randomUUID();
        const storagePath = directUrls[i] || `${userId}/${momentId}/${mediaId}.jpg`;
        await this.repo.insertMomentMedia({
          id: mediaId,
          momentId,
          ownerUserId: userId,
          storagePath,
          sortOrder: i,
        });
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
    const moment = await this.repo.findMomentByIdAndOwner(momentId, userId);

    if (!moment) throw new NotFoundException('not_found');
    if (moment.status === 'active') return { ok: true, momentId };

    if (mediaPaths && typeof mediaPaths === 'object') {
      for (const [mediaId, storagePath] of Object.entries(mediaPaths)) {
        await this.repo.updateMediaStoragePath(mediaId, userId, String(storagePath));
      }
    }

    const slots = await this.repo.findMomentMediaSlots(momentId);
    const slotIds = new Set(slots.map((s) => s.id));
    const keep = Array.isArray(uploadedMediaIds) ? uploadedMediaIds.filter((id) => slotIds.has(id)) : [];

    if (Array.isArray(uploadedMediaIds) && uploadedMediaIds.length > 0) {
      if (keep.length > 0) {
        await this.repo.deleteMomentMediaExcept(momentId, userId, keep);
      }
    }

    await this.repo.activateMoment(momentId, userId);

    try {
      const activeMoment = await this.repo.findActiveMomentDetails(momentId);
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

    const moment = await this.repo.findMomentByIdAndOwner(momentId, userId);
    if (!moment) throw new NotFoundException('not_found');

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

    await this.repo.updateMomentComplete(momentId, userId, {
      safeOccurredAt,
      eventName,
      placeLabel,
      note,
      visibility,
      targetKind,
      targetUserId,
      targetCardId,
      targetGuestId,
    });

    if (Array.isArray(photoUrls)) {
      await this.repo.deleteMomentMedia(momentId, userId);

      for (let i = 0; i < photoUrls.length; i++) {
        const photoUrl = photoUrls[i];
        if (!photoUrl) continue;
        const mediaId = crypto.randomUUID();
        await this.repo.insertMomentMedia({
          id: mediaId,
          momentId,
          ownerUserId: userId,
          storagePath: photoUrl,
          sortOrder: i,
        });
      }
    }

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
    const moment = await this.repo.findMomentByIdAndOwner(momentId, userId);
    if (!moment) throw new NotFoundException('not_found');

    await this.repo.deleteMomentCascade(momentId, userId);

    return { ok: true, momentId };
  }

  // ── Moment 3-Level Comments, Likes & Mentions ───────────────────

  async listMomentComments(momentId: string, viewerUserId: string) {
    const rawComments = await this.repo.listMomentComments(momentId);
    const commentIds = rawComments.map(c => c.id);
    const likesRows = await this.repo.findCommentLikes(commentIds);

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

    await this.repo.insertComment({
      id: commentId,
      momentId,
      userId,
      parentId,
      content: content ? content.trim() : '(Hình ảnh)',
      photoUrl,
      mentionsJson,
      createdAt: now,
      updatedAt: now,
    });

    const author = (await this.repo.findAuthorIdentity(userId)) || {};
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

    this.gateway.emitMomentCommentAdded(momentId, commentPayload);

    const { momentOwnerId, eventName, placeLabel, mutedUserIds } = await this.repo.findMomentOwnerAndMutes(momentId);

    try {
      if (momentOwnerId && momentOwnerId !== userId && !mutedUserIds.has(String(momentOwnerId).toLowerCase())) {
        const notifId = crypto.randomUUID();
        const safeData = JSON.stringify({
          commenterName: displayName,
          momentTitle: eventName || placeLabel || 'khoảnh khắc',
          content: content.substring(0, 100),
        });
        const actionTarget = JSON.stringify({ route: '/connect-app', momentId });
        const dedupeKey = `moment_comment:${notifId}`;
        await this.repo.insertBusinessNotification({
          id: notifId,
          recipientUserId: momentOwnerId,
          sourceDomain: 'moment',
          sourceRecordId: momentId,
          eventKind: 'moment_comment',
          notificationKind: 'moment_new_comment',
          titleKey: 'bc.notif.moment_comment.title',
          bodyKey: 'bc.notif.moment_comment.body',
          safeDisplayData: safeData,
          actionKind: 'open_moment_detail',
          actionLabelKey: 'bc.notif.action.view',
          actionTarget,
          dedupeKey,
        });
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

      if (parentId) {
        const parentUserId = await this.repo.findParentCommentAuthor(parentId);
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
          await this.repo.insertBusinessNotification({
            id: notifId,
            recipientUserId: parentUserId,
            sourceDomain: 'moment',
            sourceRecordId: momentId,
            eventKind: 'moment_comment_reply',
            notificationKind: 'moment_reply_comment',
            titleKey: 'bc.notif.moment_reply.title',
            bodyKey: 'bc.notif.moment_reply.body',
            safeDisplayData: safeData,
            actionKind: 'open_moment_detail',
            actionLabelKey: 'bc.notif.action.view',
            actionTarget,
            dedupeKey,
          });
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
            await this.repo.insertBusinessNotification({
              id: notifId,
              recipientUserId: mentionedUserId,
              sourceDomain: 'moment',
              sourceRecordId: momentId,
              eventKind: 'moment_mention',
              notificationKind: 'moment_user_mention',
              titleKey: 'bc.notif.moment_mention.title',
              bodyKey: 'bc.notif.moment_mention.body',
              safeDisplayData: safeData,
              actionKind: 'open_moment_detail',
              actionLabelKey: 'bc.notif.action.view',
              actionTarget,
              priority: 'high',
              dedupeKey,
            });
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
      this.logger.warn('Error generating comment notifications:', err);
    }

    return { ok: true, comment: commentPayload };
  }

  async toggleMuteMoment(userId: string, momentId: string) {
    const isMuted = await this.repo.toggleMute(userId, momentId);
    return { ok: true, isMuted };
  }

  async getMomentMuteStatus(userId: string, momentId: string) {
    const isMuted = await this.repo.isMomentMuted(userId, momentId);
    return { ok: true, isMuted };
  }

  async deleteMomentComment(userId: string, momentId: string, commentId: string) {
    const { comment, momentOwnerId } = await this.repo.findCommentWithMomentOwner(commentId, momentId);

    if (!comment) throw new NotFoundException('comment_not_found');

    const isCommentAuthor = comment.user_id === userId;
    const isMomentOwner = momentOwnerId === userId;

    if (!isCommentAuthor && !isMomentOwner) {
      throw new ForbiddenException('cannot_delete_foreign_comment');
    }

    await this.repo.deleteCommentAndReplies(commentId);
    this.gateway.emitMomentCommentDeleted(momentId, commentId);
    return { ok: true, commentId };
  }

  async toggleMomentCommentLike(userId: string, momentId: string, commentId: string) {
    const { liked, count } = await this.repo.toggleCommentLike(userId, commentId);
    this.gateway.emitMomentCommentLiked(momentId, commentId, count, userId, liked);
    return { ok: true, commentId, liked, likesCount: count };
  }

  async toggleMomentLike(userId: string, momentId: string) {
    const { liked, count } = await this.repo.toggleMomentLike(userId, momentId);
    this.gateway.emitMomentLiked(momentId, count, userId, liked);
    return { ok: true, momentId, liked, likesCount: count };
  }

  async getMomentLikeStatus(userId: string, momentId: string) {
    const stats = await this.repo.getMomentLikeStatus(userId, momentId);
    return {
      ok: true,
      momentId,
      likesCount: stats.likesCount,
      userLiked: stats.userLiked,
      commentsCount: stats.commentsCount,
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

    const moment = await this.repo.findMomentByIdAndOwner(momentId, userId);
    if (!moment) {
      return {
        ok: true,
        momentId,
        max: 6,
        photos: [],
      };
    }

    const slots = await this.repo.findMomentPhotos(momentId);
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
    const moment = await this.repo.findMomentByIdAndOwner(momentId, userId);
    if (!moment) throw new NotFoundException('not_found');

    const existingSortOrders = await this.repo.findExistingSortOrders(momentId);
    if (existingSortOrders.length + count > 6) {
      throw new BadRequestException('photo_count');
    }

    const startSort = existingSortOrders.reduce((max, s) => Math.max(max, s + 1), 0);
    const photos: any[] = [];
    for (let i = 0; i < count; i++) {
      const mediaId = crypto.randomUUID();
      const storagePath = `${userId}/${momentId}/${mediaId}.jpg`;
      const sortOrder = startSort + i;
      await this.repo.insertMomentMedia({
        id: mediaId,
        momentId,
        ownerUserId: userId,
        storagePath,
        sortOrder,
      });
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
    const moment = await this.repo.findMomentByIdAndOwner(momentId, userId);
    if (!moment) throw new NotFoundException('not_found');

    if (mediaPaths && typeof mediaPaths === 'object') {
      for (const [mediaId, storagePath] of Object.entries(mediaPaths)) {
        await this.repo.updateMediaStoragePath(mediaId, userId, String(storagePath));
      }
    }

    const slots = await this.repo.findMomentPhotos(momentId);
    const uploaded = new Set(uploadedMediaIds);
    const drop = slots.filter((s: any) => addedMediaIds.includes(s.id) && !uploaded.has(s.id));
    if (drop.length > 0) {
      const dropIds = drop.map((s) => s.id);
      await this.repo.deleteMediaByIds(momentId, userId, dropIds);
    }

    return { ok: true, momentId };
  }

  async removeMomentPhoto(userId: string, momentId: string, mediaId: string) {
    const moment = await this.repo.findMomentByIdAndOwner(momentId, userId);
    if (!moment) throw new NotFoundException('not_found');

    await this.repo.deleteSingleMedia(momentId, userId, mediaId);
    return { ok: true, momentId };
  }

  // --- Reminders ---

  async listMomentReminders(userId: string, momentId: string | null, includeDone: boolean, limit: number) {
    const rows = await this.repo.findReminders(userId, momentId, includeDone, limit);
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
    const count = await this.repo.countPendingReminders(userId, momentId);
    if (count >= 5) {
      return { ok: false, error: 'limit_reached' };
    }

    const id = crypto.randomUUID();
    await this.repo.insertReminder(id, momentId, userId, new Date(remindAt), label);

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

    const rowBefore = await this.repo.findReminder(reminderId, userId);
    if (!rowBefore) return { ok: false, error: 'not_found' };

    await this.repo.updateReminderStatus(reminderId, userId, status, completedAt);

    const r = await this.repo.findReminder(reminderId, userId);
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
    await this.repo.deleteReminder(reminderId, userId);
    return { ok: true, reminderId };
  }

  async notifyMomentTags(userId: string, input: { momentId: string; taggedUserIds: string[]; content?: string }) {
    const { momentId, taggedUserIds = [], content = '' } = input;
    if (taggedUserIds.length === 0) return { ok: true, count: 0 };

    const authorProfile = await this.repo.findAuthorIdentity(userId);
    const displayName = authorProfile?.display_name || 'Đối tác trong mạng lưới';

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

      await this.repo.insertBusinessNotification({
        id: notifId,
        recipientUserId: cleanTargetId,
        sourceDomain: 'moment',
        sourceRecordId: momentId,
        eventKind: 'moment_tagged',
        notificationKind: 'moment_tag_person',
        titleKey: 'bc.notif.moment_tag.title',
        bodyKey: 'bc.notif.moment_tag.body',
        safeDisplayData: safeData,
        actionKind: 'open_moment_detail',
        actionLabelKey: 'bc.notif.action.view',
        actionTarget,
        priority: 'high',
        dedupeKey,
      });

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
}

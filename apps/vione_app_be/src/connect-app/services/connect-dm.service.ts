import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConnectDmRepository } from '../repositories/connect-dm.repository';
import { ConnectAppGateway } from '../connect-app.gateway';
import * as crypto from 'crypto';

@Injectable()
export class ConnectDmService {
  private readonly logger = new Logger(ConnectDmService.name);

  constructor(
    private readonly repo: ConnectDmRepository,
    private readonly gateway: ConnectAppGateway,
  ) {}

  async resolveMemberCodeForUser(userId: string): Promise<string> {
    try {
      // 1. Kiểm tra trực tiếp trong bảng members theo user_id hoặc id
      const code = await this.repo.findMemberCode(userId);
      if (code) {
        return code;
      }

      // 2. Kiểm tra trong public.vione_users (tài khoản đăng nhập chính thức của NestJS)
      const u = await this.repo.findVioneUser(userId);
      if (u) {
        const byUser = await this.repo.findMemberByEmailOrCode(u.email, u.username);
        if (byUser && byUser.code) {
          // Tự động liên kết user_id vào members để các truy vấn sau nhanh tức thì
          await this.repo.linkMemberUserId(byUser.code, userId);
          return byUser.code;
        }

        // Tự động tạo hồ sơ hội viên cho tài khoản này
        const userEmail = u.email || `${u.username || userId}@ceo1983.vn`;
        const newCode = 'M1983-' + String(Math.floor(100 + Math.random() * 900));
        await this.repo.insertMemberProfile(userId, newCode, u.name || 'Hội viên CEO 1983', userEmail);
        return newCode;
      }

      return `M1983-${String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
    } catch {
      return `M1983-${String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
    }
  }

  async listMemberConversations(userId: string) {
    const myCode = await this.resolveMemberCodeForUser(userId);
    const mine = myCode.toLowerCase();
    const myUserId = userId.toLowerCase();
    const myKeys = [mine, myUserId];

    const msgs = await this.repo.findMemberMessages(mine, myUserId);
    const members = await this.repo.findMemberProfiles();

    const memberByCode = new Map<string, any>();
    const memberByUserId = new Map<string, any>();
    for (const mem of members) {
      if (mem.code) memberByCode.set(String(mem.code).toLowerCase(), mem);
      if (mem.user_id) memberByUserId.set(String(mem.user_id).toLowerCase(), mem);
      if (mem.id) memberByCode.set(String(mem.id).toLowerCase(), mem);
    }

    const byPeer = new Map<string, any[]>();
    for (const m of msgs) {
      const from = String(m.from_id).toLowerCase();
      const to = String(m.to_id).toLowerCase();
      const rawPeer = myKeys.includes(from) ? to : from;

      // Chuẩn hóa định danh peer về member code nếu tìm thấy trong members
      const mem = memberByUserId.get(rawPeer) || memberByCode.get(rawPeer);
      const peerKey = mem?.code ? String(mem.code).toLowerCase() : rawPeer;

      if (!byPeer.has(peerKey)) byPeer.set(peerKey, []);
      byPeer.get(peerKey)!.push(m);
    }

    const peers = [...byPeer.keys()];

    // Tra cứu kết nối thực tế trong public.user_connections để phân loại: Đã kết nối hay Tin nhắn chờ
    const peerUserIds = Array.from(memberByUserId.keys()).filter(Boolean);
    const connMap = new Map<string, { status: string; requesterId: string; connectionId: string }>();
    if (peerUserIds.length > 0) {
      try {
        const conns = await this.repo.findUserConnections(userId, peerUserIds);
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
      const unread = list.filter((m) => (myKeys.includes(String(m.to_id).toLowerCase())) && m.read_at == null).length;
      const isSystem = peer === 'admin' || peer === 'system';
      const mem = memberByCode.get(peer) || memberByUserId.get(peer);
      const peerUserId = mem?.user_id ? String(mem.user_id) : null;

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
        peerCode: mem?.code || peer,
        userId: peerUserId ?? null,
        isOnline,
        name: isSystem ? 'Ban Quản Trị Gia Đình ViOne' : (mem?.display_name || mem?.name || mem?.contact || peer.toUpperCase()),
        avatarUrl: isSystem ? '/vione-logo-gold.png' : (mem?.avatar ?? null),
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
      resList.push({
        peerCode: 'admin',
        name: 'Ban Quản Trị Gia Đình ViOne',
        avatarUrl: '/vione-logo-gold.png',
        last: 'Chào mừng Quý Anh/Chị đến với Kênh Thông Báo Chính Thức của Ban Quản Trị Gia Đình ViOne!',
        time: new Date(Date.now() - 3600000).toISOString(),
        rawTime: new Date(Date.now() - 3600000).toISOString(),
        unread: 0,
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

    // Đưa hội thoại có tin nhắn mới nhất lên đầu danh sách chuẩn Messenger
    resList.sort((a, b) => {
      const timeA = new Date(a.rawTime || a.time).getTime() || 0;
      const timeB = new Date(b.rawTime || b.time).getTime() || 0;
      return timeB - timeA;
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

    // Tra cứu hội viên đối tác để lấy tất cả các alias (code, user_id, id)
    const peerMem = await this.repo.findPeerMember(peer);
    const peerAliases = new Set<string>([peer]);
    if (peerMem?.code) peerAliases.add(String(peerMem.code).toLowerCase());
    if (peerMem?.user_id) peerAliases.add(String(peerMem.user_id).toLowerCase());
    if (peerMem?.id) peerAliases.add(String(peerMem.id).toLowerCase());

    const myAliases = new Set<string>([mine, userId.toLowerCase()]);
    const peerList = Array.from(peerAliases);
    const myList = Array.from(myAliases);

    const rawMsgs = await (
      (isGroup || isChannel)
        ? this.repo.findChannelMessages(peer)
        : this.repo.findMessagesBetween(myList, peerList)
    );

    const msgs: any[] = Array.isArray(rawMsgs) ? [...rawMsgs] : [];

    if (isSystem && msgs.length === 0) {
      const welcomeMsg = 'Chào mừng quý Anh/Chị đến với Kênh Thông Báo Chính Thức của Ban Thư Ký CLB Doanh Nhân CEO 1983!';
      const paymentMsg = '[action:payment|amount:20000000|invoice:HD-2026-001|qr:https://img.vietqr.io/image/MB-1983000000-compact2.png?amount=20000000&addInfo=HD-2026-001|due:31/03/2026|desc:H%E1%BB%99i%20ph%C3%AD%20th%C6%B0%E1%BB%9Dng%20ni%C3%AAn%202026%20-%20CLB%20Doanh%20Nh%C3%A2n%20CEO%201983]';
      const meetingMsg = '[action:meeting|title:H%E1%BB%8Dp%20Ban%20Ch%E1%BA%A5p%20H%C3%A0nh%20CEO%201983%20Th%C3%A1ng%203|time:14:00%20-%2028/03/2026|location:Trung%20t%C3%A2m%20H%E1%BB%99i%20Ngh%E1%BB%8B%20Qu%E1%BB%91c%20Gia%20H%C3%A0%20N%E1%BB%99i|link:https://meet.vione.vn/ceo1983-bch|desc:Phi%C3%AAn%20h%E1%BB%8Dp%20chi%E1%BA%BFn%20l%C6%B0%E1%BB%A3c%20tri%E1%BB%83n%20khai%20giao%20th%C6%B0%C6%A1ng%20to%C3%A0n%20di%E1%BB%87n]';

      await this.repo.insertAdminSeedMessages(mine, welcomeMsg, paymentMsg, meetingMsg);

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
        await this.repo.insertChannelSeedMessage(peer, seedText, offsetMins);

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

    // Đánh dấu đã đọc tất cả tin nhắn gửi đến mình từ peer
    await this.repo.markMessagesRead(peerList, myList);

    const channelNames: Record<string, string> = {
      channel_secretariat: '🏛️ Kênh Ban Thư Ký & Ban Điều Hành',
      channel_media: '📢 Kênh Ban Truyền Thông Hiệp Hội',
      channel_promotion: '🤝 Kênh Ban Xúc Tiến Giao Thương',
      channel_deals: '🎯 Kênh Cơ Hội & Deal B2B',
      channel_events: '🌟 Kênh Ban Sự Kiện & Hội Nghị',
    };

    const resolvedPeerName = isChannel
      ? (channelNames[peer] || `Kênh ${peerCode}`)
      : (isSystem ? 'Ban Thư Ký ViOne Connect' : (peerMem?.name ?? peerCode.toUpperCase()));

    return {
      peerName: resolvedPeerName,
      avatarUrl: isSystem ? '/vione-wordmark.png' : (peerMem?.avatar ?? null),
      isSystem: isSystem || isChannel,
      messages: msgs.map((m) => ({
        id: m.id,
        text: m.text,
        mine: myList.includes(String(m.from_id).toLowerCase()),
        time: m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString(),
        createdAt: m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString(),
        seen: m.read_at != null,
      })),
    };
  }

  async sendMemberMessage(userId: string, peerCode: string, text: string) {
    const myCode = await this.resolveMemberCodeForUser(userId);

    // Chuẩn hóa peerCode sang member code chính thức nếu có
    const peerMem = await this.repo.findMemberByCodeOrId(peerCode);
    const targetPeerCode = peerMem?.code?.toLowerCase() || peerCode.toLowerCase();
    const targetUserId = peerMem?.user_id ? String(peerMem.user_id) : null;

    const res = await this.repo.insertMessage(myCode.toLowerCase(), targetPeerCode, text);

    if (this.gateway && this.gateway.server) {
      const payload = {
        fromCode: myCode.toLowerCase(),
        toCode: targetPeerCode,
        fromUserId: userId,
        toUserId: targetUserId,
        text,
        createdAt: new Date().toISOString(),
        message: res,
      };
      this.gateway.server.emit('member:message_received', payload);
      this.gateway.server.emit('dm:message_received', { message: { body: text }, fromCode: myCode.toLowerCase() });
      this.gateway.server.emit('dm:thread_updated', {});
    }

    return { ok: true, myCode, targetPeerCode, message: res };
  }

  async retractMemberMessage(userId: string, messageId: string) {
    const myCode = await this.resolveMemberCodeForUser(userId);
    const mine = myCode.toLowerCase();

    const msg = await this.repo.findMessageById(messageId);
    if (msg) {
      if (String(msg.from_id).toLowerCase() !== mine) {
        throw new ForbiddenException('cannot_retract_other_message');
      }
      await this.repo.retractMessage(messageId, mine, true);
    } else {
      await this.repo.retractMessage(messageId, mine, false);
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
    const myCode = await this.resolveMemberCodeForUser(userId).catch(() => '');
    const mine = (myCode || '').toLowerCase();
    const myUserId = userId.toLowerCase();
    const myKeys = [mine, myUserId].filter(Boolean);

    const threads = await this.repo.findDmThreads(userId);
    const connections = await this.repo.findAcceptedConnections(userId);

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

    const userProfilesMap = new Map<string, { displayName: string; avatarUrl: string | null; headline: string | null; companyName: string | null; code?: string | null }>();
    if (counterpartUserIds.size > 0) {
      const idsArray = Array.from(counterpartUserIds);
      const { identities, profiles, members, vUsers } = await this.repo.findCounterpartProfiles(idsArray);

      for (const id of idsArray) {
        const idLower = id.toLowerCase();
        const ident = (identities as any[]).find((i: any) => String(i.owner_user_id).toLowerCase() === idLower);
        const prof = (profiles as any[]).find((p: any) => String(p.user_id).toLowerCase() === idLower);
        const mem = (members as any[]).find((m: any) => String(m.user_id).toLowerCase() === idLower);
        const vu = (vUsers as any[]).find((u: any) => String(u.id).toLowerCase() === idLower);

        userProfilesMap.set(idLower, {
          displayName: ident?.display_name || prof?.display_name || mem?.name || vu?.name || vu?.username || 'Doanh nhân ViOne',
          avatarUrl: ident?.avatar_url || prof?.avatar_url || mem?.avatar || vu?.avatar_url || null,
          headline: ident?.headline || ident?.job_title || prof?.professional_title || mem?.position || 'Doanh nhân ViOne',
          companyName: ident?.company_name || prof?.company_name || mem?.company || 'Hệ sinh thái ViOne',
          code: mem?.code || null,
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
        counterpartUserId: counterpartId,
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

    // ── Đồng bộ & hiển thị tin nhắn từ bảng public.messages ──
    const legacyMsgs = await this.repo.findLegacyMessagesForKeys(myKeys);

    if (legacyMsgs && legacyMsgs.length > 0) {
      const allMembers = await this.repo.findAllMembersWithProfiles();

      const legacyByPeer = new Map<string, any[]>();
      for (const m of legacyMsgs) {
        const from = String(m.from_id).toLowerCase();
        const to = String(m.to_id).toLowerCase();
        const isFromMe = myKeys.includes(from);
        const rawPeer = isFromMe ? to : from;
        if (!legacyByPeer.has(rawPeer)) legacyByPeer.set(rawPeer, []);
        legacyByPeer.get(rawPeer)!.push({ ...m, isFromMe });
      }

      for (const [peerKey, pMsgs] of legacyByPeer.entries()) {
        const latest = pMsgs[0];
        const isSystem = peerKey === 'admin' || peerKey === 'system';
        const mem = allMembers.find((m: any) =>
          (m.code && String(m.code).toLowerCase() === peerKey) ||
          (m.user_id && String(m.user_id).toLowerCase() === peerKey) ||
          (m.id && String(m.id).toLowerCase() === peerKey)
        );
        const peerUserId = mem?.user_id ? String(mem.user_id).toLowerCase() : null;

        // Nếu đối tác đã có thread trong resultThreads: cập nhật nếu tin nhắn legacy mới hơn
        const existingIdx = resultThreads.findIndex((rt) =>
          (peerUserId && rt.personId === `u:${peerUserId}`) ||
          rt.threadId === peerKey
        );

        if (existingIdx >= 0) {
          const existing = resultThreads[existingIdx];
          const existTime = existing.lastMessageAt ? new Date(existing.lastMessageAt).getTime() : 0;
          const legacyTime = latest.created_at ? new Date(latest.created_at).getTime() : 0;
          if (legacyTime >= existTime) {
            existing.lastMessageAt = latest.created_at ? new Date(latest.created_at).toISOString() : existing.lastMessageAt;
            existing.lastMessagePreview = latest.text || existing.lastMessagePreview;
            existing.lastMessageFromMe = latest.isFromMe;
          }
        } else {
          // Chưa có thread: tạo mới và đảm bảo hiển thị
          const targetCounterpartId = peerUserId || peerKey;
          addedCounterparts.add(targetCounterpartId);

          let ensuredThreadId: string = crypto.randomUUID();
          if (peerUserId) {
            const [u1, u2] = userId.toLowerCase() < peerUserId.toLowerCase() ? [userId, peerUserId] : [peerUserId, userId];
            const created = await this.repo.upsertDmThreadWithLastMessage(ensuredThreadId, u1, u2, latest.created_at || new Date(), latest.text || '');
            if (created) ensuredThreadId = created;
          }

          const unread = pMsgs.filter((m) => !m.isFromMe && m.read_at == null).length;
          resultThreads.push({
            threadId: ensuredThreadId,
            personId: peerUserId ? `u:${peerUserId}` : `code:${peerKey}`,
            counterpartUserId: peerUserId || peerKey,
            displayName: isSystem
              ? 'Ban Hỗ Trợ Gia Đình ViOne'
              : (mem?.display_name || mem?.name || `Hội viên ${peerKey.toUpperCase()}`),
            avatarUrl: isSystem ? '/vione-logo.png' : (mem?.avatar_url || mem?.avatar || null),
            headline: isSystem ? 'Hỗ trợ hội viên ViOne' : (mem?.headline || mem?.position || null),
            companyName: isSystem ? 'Gia Đình ViOne' : (mem?.company_name || mem?.company || null),
            isOnline: isSystem ? true : (peerUserId ? (this.gateway?.isUserOnline(peerUserId) ?? false) : false),
            lastMessageAt: latest.created_at ? new Date(latest.created_at).toISOString() : null,
            lastMessagePreview: latest.text || null,
            lastMessageFromMe: latest.isFromMe,
            unreadCount: unread,
            isConnected: isSystem ? true : (peerUserId ? acceptedSet.has(peerUserId) : false),
          });
        }
      }
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

        let threadId: string = crypto.randomUUID();
        const created = await this.repo.upsertEmptyDmThread(threadId, u1, u2);
        if (created) threadId = created;

        resultThreads.push({
          threadId,
          personId: `u:${counterpartId}`,
          counterpartUserId: counterpartId,
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

    // Sắp xếp các hội viên có tin nhắn gần nhất lên đầu danh sách
    resultThreads.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    return { ok: true, threads: resultThreads };
  }

  async openMyDmThread(userId: string, counterpartUserId: string) {
    if (!counterpartUserId) throw new BadRequestException('counterpart_user_id_required');
    let cleanId = String(counterpartUserId).trim();
    if (cleanId.startsWith('u:')) cleanId = cleanId.substring(2);
    if (cleanId.startsWith('p:')) cleanId = cleanId.substring(2);

    let resolvedCounterpartId = cleanId;
    if (!/^[0-9a-fA-F-]{36}$/.test(resolvedCounterpartId)) {
      // Phân giải từ member code, email, username
      const foundUser = await this.repo.findUserByEmailOrUsernameOrMemberCode(cleanId);
      if (foundUser?.id) {
        resolvedCounterpartId = String(foundUser.id);
      } else {
        throw new BadRequestException('counterpart_user_not_found');
      }
    }

    const [u1, u2] = userId.toLowerCase() < resolvedCounterpartId.toLowerCase()
      ? [userId, resolvedCounterpartId]
      : [resolvedCounterpartId, userId];

    const existing = await this.repo.findDmThreadBetween(u1, u2);
    if (existing) {
      return { ok: true, threadId: existing.id };
    }

    const newId = crypto.randomUUID();
    const finalThreadId = await this.repo.createDmThread(newId, u1, u2);

    return { ok: true, threadId: finalThreadId };
  }

  async getMyDmThreadDetail(userId: string, threadId: string) {
    let targetThreadId = String(threadId || '').trim();
    try {
      targetThreadId = decodeURIComponent(targetThreadId);
    } catch {}

    // 1. Thử tìm theo direct_message_threads ID
    let threadRows: any[] = [];
    if (/^[0-9a-fA-F-]{36}$/.test(targetThreadId)) {
      const found = await this.repo.findDmThreadByIdAndUser(targetThreadId, userId);
      if (found) threadRows = [found];
    }

    // 2. Nếu không tìm thấy bằng thread ID, targetThreadId có thể là userId đối phương, hoặc connection ID, hoặc u:userId
    if (threadRows.length === 0) {
      let cleanTarget = targetThreadId;
      if (cleanTarget.startsWith('u:')) cleanTarget = cleanTarget.substring(2);
      if (cleanTarget.startsWith('p:')) cleanTarget = cleanTarget.substring(2);
      if (cleanTarget.startsWith('th-')) cleanTarget = cleanTarget.substring(3);

      // 2.1. Tra cứu trực tiếp trong direct_message_threads xem đã có cuộc trò chuyện nào giữa 2 người này chưa
      if (/^[0-9a-fA-F-]{36}$/.test(cleanTarget)) {
        const directByUser = await this.repo.findDmThreadBetweenOrdered(cleanTarget, userId);
        if (directByUser.length > 0) {
          threadRows = directByUser;
          targetThreadId = directByUser[0].id;
        } else {
          // Tự động mở thread cho 2 người nếu đối phương là user UUID hợp lệ
          const opened = await this.openMyDmThread(userId, cleanTarget).catch(() => null);
          if (opened?.threadId) {
            targetThreadId = opened.threadId;
            const th = await this.repo.findDmThreadByIdAndUser(opened.threadId, userId);
            if (th) threadRows = [th];
          }
        }
      }

      // 2.2. Thử xem có phải ID của user_connections không
      if (threadRows.length === 0 && /^[0-9a-fA-F-]{36}$/.test(cleanTarget)) {
        const conn = await this.repo.findUserConnectionById(cleanTarget, userId);
        if (conn) {
          const otherId = String(conn.requester_user_id).toLowerCase() === userId.toLowerCase()
            ? String(conn.recipient_user_id)
            : String(conn.requester_user_id);
          const openRes = await this.openMyDmThread(userId, otherId).catch(() => null);
          if (openRes?.threadId) {
            targetThreadId = openRes.threadId;
            const th = await this.repo.findDmThreadByIdAndUser(targetThreadId, userId);
            if (th) threadRows = [th];
          }
        }
      }

      // 2.3. Thử mở thread với cleanTarget như một counterpart userId/code
      if (threadRows.length === 0) {
        try {
          const openRes = await this.openMyDmThread(userId, cleanTarget);
          if (openRes?.threadId) {
            targetThreadId = openRes.threadId;
            const th = await this.repo.findDmThreadByIdAndUser(targetThreadId, userId);
            if (th) threadRows = [th];
          }
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

    const { ident, prof, mem, counterpartUser } = await this.repo.findThreadUserProfile(counterpartId);
    const isConnAccepted = await this.repo.checkConnectionAccepted(userId, counterpartId);
    const myUser = await this.repo.findUserAccount(userId);

    const peerDisplayName = ident?.display_name || prof?.display_name || mem?.name || counterpartUser?.username || 'Doanh nhân ViOne';

    const threadSummary = {
      threadId: t.id,
      personId: `u:${counterpartId}`,
      displayName: peerDisplayName,
      avatarUrl: ident?.avatar_url || prof?.avatar_url || mem?.avatar || null,
      headline: ident?.headline || ident?.job_title || prof?.professional_title || mem?.position || null,
      companyName: ident?.company_name || prof?.company_name || mem?.company || null,
      isOnline: this.gateway?.isUserOnline(counterpartId) ?? false,
      lastMessageAt: t.last_message_at ? new Date(t.last_message_at).toISOString() : null,
      lastMessagePreview: t.last_message_body || null,
      lastMessageFromMe: false,
      unreadCount: 0,
      isConnected: isConnAccepted,
    };

    await this.repo.markDirectMessagesRead(t.id, userId);

    const msgRows = await this.repo.findDirectMessagesByThread(t.id, 100);

    let messages = msgRows.map(m => ({
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

    // Tra cứu bổ sung từ public.messages (hỗ trợ cả các tin nhắn legacy/kết nối trước đây)
    const myCode = await this.resolveMemberCodeForUser(userId).catch(() => '');
    const myKeys = [
      myCode?.toLowerCase(),
      userId.toLowerCase(),
      myUser?.email?.toLowerCase(),
      myUser?.username?.toLowerCase(),
    ].filter(Boolean) as string[];

    const counterpartMember = mem?.code ? String(mem.code).toLowerCase() : null;
    const counterpartKeys = [
      counterpartMember,
      counterpartId.toLowerCase(),
      counterpartUser?.email?.toLowerCase(),
      counterpartUser?.username?.toLowerCase(),
    ].filter(Boolean) as string[];

    const legacyMsgs = await this.repo.findLegacyMessagesBetweenKeys(myKeys, counterpartKeys, 100);

    if (legacyMsgs && legacyMsgs.length > 0) {
      const existingBodies = new Set(messages.map(m => m.body));
      const formattedLegacy = legacyMsgs
        .filter(m => !existingBodies.has(m.text))
        .map(m => ({
          id: m.id,
          threadId: t.id,
          fromMe: myKeys.includes(String(m.from_id).toLowerCase()),
          body: m.text,
          reactions: [],
          replyTo: null,
          createdAt: m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString(),
          readAt: m.read_at ? new Date(m.read_at).toISOString() : null,
          retractedAt: null,
        }));
      messages = [...messages, ...formattedLegacy].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      threadSummary.lastMessageAt = lastMsg.createdAt;
      threadSummary.lastMessagePreview = lastMsg.body;
      threadSummary.lastMessageFromMe = lastMsg.fromMe;
    }

    return { ok: true, thread: threadSummary, messages };
  }

  async sendMyDmMessage(userId: string, threadId: string, data: { body: string; clientToken?: string; replyTo?: any }) {
    if (!data?.body?.trim()) throw new BadRequestException('empty_message');

    let targetThreadId = String(threadId || '').trim();
    try {
      targetThreadId = decodeURIComponent(targetThreadId);
    } catch {}

    let threadRows: any[] = [];
    if (/^[0-9a-fA-F-]{36}$/.test(targetThreadId)) {
      const found = await this.repo.findDmThreadByIdAndUser(targetThreadId, userId);
      if (found) threadRows = [found];
    }

    if (threadRows.length === 0) {
      let cleanTarget = targetThreadId;
      if (cleanTarget.startsWith('u:')) cleanTarget = cleanTarget.substring(2);
      if (cleanTarget.startsWith('p:')) cleanTarget = cleanTarget.substring(2);
      if (cleanTarget.startsWith('th-')) cleanTarget = cleanTarget.substring(3);

      if (/^[0-9a-fA-F-]{36}$/.test(cleanTarget)) {
        const existingByUser = await this.repo.findDmThreadBetweenOrdered(cleanTarget, userId);
        if (existingByUser.length > 0) {
          threadRows = existingByUser;
        } else {
          const opened = await this.openMyDmThread(userId, cleanTarget).catch(() => null);
          if (opened?.threadId) {
            const found = await this.repo.findDmThreadByIdAndUser(opened.threadId, userId);
            if (found) threadRows = [found];
          }
        }
      }
    }

    if (threadRows.length === 0) {
      throw new NotFoundException('thread_not_found');
    }

    const t = threadRows[0];
    const counterpartId = String(t.user1_id).toLowerCase() === userId.toLowerCase()
      ? String(t.user2_id).toLowerCase()
      : String(t.user1_id).toLowerCase();

    const newMsgId = crypto.randomUUID();

    await this.repo.insertDirectMessage(newMsgId, t.id, userId, data.body, data.clientToken, data.replyTo);
    await this.repo.updateDmThreadLastMessage(t.id, data.body);

    // Đồng bộ tin nhắn sang bảng public.messages
    try {
      const myCode = await this.resolveMemberCodeForUser(userId).catch(() => '');
      const peerCode = await this.repo.findMemberCode(counterpartId);
      await this.repo.syncDirectMessageToLegacy(newMsgId, myCode || userId, peerCode || counterpartId, data.body);
    } catch {
      // ignore
    }

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

    // Gửi thông báo tương tác cụ thể đến người nhận
    try {
      const isMeetingProposal = data.body.includes('[VIONE_MEETING_PROPOSAL]');
      const isFriend = await this.repo.checkMemberConnectionExists(userId, counterpartId);
      const senderProfile = await this.repo.findMemberNameCompany(userId);
      const senderName = senderProfile?.name || 'Một thành viên ViOne';

      const dmNotifId = crypto.randomUUID();
      const dmTitle = isMeetingProposal
        ? 'Có người muốn hẹn gặp trao đổi cơ hội với bạn'
        : (!isFriend ? 'Có người muốn nhắn tin cho bạn' : `Tin nhắn mới từ ${senderName}`);
      const dmBody = isMeetingProposal
        ? `${senderName} vừa gửi đề xuất hẹn gặp trao đổi cơ hội kinh doanh. Vui lòng vào tin nhắn để phản hồi [Đồng ý] hoặc [Từ chối].`
        : (!isFriend
            ? `${senderName} (chưa có trong danh bạ) vừa nhắn tin cho bạn: "${data.body.slice(0, 70)}${data.body.length > 70 ? '...' : ''}"`
            : `${senderName}: "${data.body.slice(0, 70)}${data.body.length > 70 ? '...' : ''}"`);

      await this.repo.insertBusinessNotification({
        id: dmNotifId,
        recipientUserId: counterpartId,
        threadId: t.id,
        newMsgId,
        title: dmTitle,
        body: dmBody,
        safeDisplayData: { threadId: t.id, senderId: userId, senderName, isMeetingProposal, isFriend },
      });

      if (this.gateway) {
        this.gateway.emitNotification(counterpartId, {
          id: dmNotifId,
          title: dmTitle,
          body: dmBody,
          notificationKind: 'dm_message_received',
          appScope: 'all',
          createdAt: new Date().toISOString(),
        });
        this.gateway.emitUnreadNotificationCount(counterpartId, 1);
      }
    } catch (notifErr) {
      console.warn('sendMyDmMessage notification error:', notifErr);
    }

    // Bidirectional Activity Log for CRM
    try {
      const actId = crypto.randomUUID();
      const actCode = `ACT-${Date.now().toString().slice(-6)}`;
      await this.repo.insertActivityLog(actId, actCode, userId, `Gửi tin nhắn: ${data.body.slice(0, 45)}`);
    } catch {}

    return { ok: true, message: messageObj };
  }

  async markMyDmThreadRead(userId: string, threadId: string) {
    const res = await this.repo.markDirectMessagesRead(threadId, userId);

    if (this.gateway) {
      this.gateway.emitDmReadReceipt(threadId, userId);
    }
    return { ok: true, updated: res };
  }

  async retractMyDmMessage(userId: string, messageId: string) {
    const msg = await this.repo.findDirectMessageById(messageId);

    if (!msg) throw new NotFoundException('message_not_found');
    if (String(msg.sender_user_id).toLowerCase() !== userId.toLowerCase()) {
      throw new ForbiddenException('cannot_retract_other_message');
    }

    await this.repo.retractDirectMessage(messageId);

    if (this.gateway) {
      this.gateway.emitDmMessageRetracted(msg.thread_id, messageId);
    }
    return { ok: true };
  }

  async reactToDmMessage(userId: string, messageId: string, emoji: string) {
    const msg = await this.repo.findDirectMessageWithReactions(messageId);

    if (!msg) throw new NotFoundException('message_not_found');

    let reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
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

    await this.repo.updateDirectMessageReactions(messageId, reactions);

    if (this.gateway) {
      this.gateway.emitDmReaction(msg.thread_id, messageId, reactions);
    }
    return { ok: true, messageId, reactions };
  }

  // ── Mentionable Users & Tagging in Moments ──────────────────────────
  async searchMentionableUsers(userId: string, query: string) {
    const connRows = await this.repo.findAcceptedConnectionFriends(userId);

    const friendUserIds = new Set<string>();
    for (const c of connRows) {
      const friendId = String(c.requester_user_id).toLowerCase() === userId.toLowerCase()
        ? String(c.recipient_user_id).toLowerCase()
        : String(c.requester_user_id).toLowerCase();
      friendUserIds.add(friendId);
    }

    const allTargetIds = Array.from(friendUserIds);
    if (allTargetIds.length === 0) return [];

    let identities = await this.repo.findIdentitiesByUserIds(allTargetIds);
    const foundUserIds = new Set(identities.map(i => String(i.user_id).toLowerCase()));
    const missingIds = allTargetIds.filter(id => !foundUserIds.has(id));

    if (missingIds.length > 0) {
      const { profiles, members } = await this.repo.findProfilesAndMembersByUserIds(missingIds);
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
}

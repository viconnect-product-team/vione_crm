import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import {
  listMessages,
  sendMessage,
  retractMemberMessage,
  listMembers,
  requestMemberConnectionFn,
  respondMemberConnectionFn,
  disconnectMemberConnectionFn,
  getMyMember,
  type MyMember,
  type MyConversation,
  type ChatMessage,
  type DirectoryMember,
} from "@/lib/member-app.functions";
import { useAuth } from "@/context/AuthContext";
import { fetchNestApi } from "@/lib/api-client";
import { useT, useFmt } from "@/lib/i18n";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  Ticket,
  User,
  Users,
  Video,
  X,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  RotateCcw,
  MoreHorizontal,
  Smile,
  CornerUpLeft,
  Share2,
  Check,
  Reply,
  UserPlus,
  UserMinus,
  UserCheck,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  ArrowDownAZ,
  ArrowUpAZ,
  Paperclip,
  Trash2,
  Pin,
  BellOff,
  Bell,
  Megaphone,
  Handshake,
  Building2,
  Sparkles,
} from "lucide-react";
import { uploadChatAttachment } from "@/lib/upload-media";
import { toast } from "sonner";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import {
  ZaloTransactionCard,
  type ZaloTransactionData,
} from "@/components/business-connect/mobile/ZaloTransactionCard";
import { MemberProfileModal } from "@/components/member/MemberProfileModal";
import { GroupMembersModal } from "@/components/member/GroupMembersModal";
import { EventTicketCard } from "./EventTicketCard";
import { MessengerCallModal } from "./MessengerCallModal";
import { ForwardMessageModal } from "./ForwardMessageModal";
import {
  isSelfUser,
  QUICK_REACTIONS,
  formatMessageTime,
  formatDateSeparator,
  initialsOf,
  cleanPersonName,
  getShortName,
  formatFileSize,
  getFileBadgeInfo,
  type ActionPaymentData,
  type ActionMeetingData,
  type ActionTicketData,
  type ReplyQuoteData,
  type ParsedContent,
  parseMessageContent,
  resolveMediaUrl,
  formatMessagePreview,
  saveRecentConversation,
} from "./types";

export interface ChatThreadProps {
  peer: MyConversation;
  onBack: () => void;
  members?: DirectoryMember[];
}

export function ChatThread({
  peer,
  onBack,
  members = [],
}: {
  peer: MyConversation;
  onBack: () => void;
  members?: DirectoryMember[];
}) {
  const t = useT();
  const fmt = useFmt();
  const { data, loading, error, reload } = useServerData(
    () => listMessages({ data: { peerCode: peer.peerCode } }),
    { peerName: peer.name, messages: [] as Awaited<ReturnType<typeof listMessages>>["messages"] },
  );
  const send = useServerFn(sendMessage);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<ActionPaymentData | null>(null);
  const [profileMember, setProfileMember] = useState<DirectoryMember | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; text: string } | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<ChatMessage | null>(null);
  const [activeContextMenuMsgId, setActiveContextMenuMsgId] = useState<string | null>(null);
  const isGroup = Boolean(peer.isGroup || peer.peerCode?.startsWith("group_"));
  const [groupMembersOpen, setGroupMembersOpen] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const triggerHaptic = (ms = 20) => {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const handleBubbleTouchStart = (e: React.TouchEvent, msg: ChatMessage) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      triggerHaptic(30);
      setActiveContextMenuMsgId(msg.id);
    }, 380);
  };

  const handleBubbleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const diffY = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (diffX > 10 || diffY > 10) {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    }
  };

  const handleBubbleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleForwardMessage = async (targetPeerCode: string, targetName: string) => {
    if (!forwardingMsg) return;
    try {
      await send({ data: { peerCode: targetPeerCode, text: forwardingMsg.text } });
      toast.success(`Đã chuyển tiếp tin nhắn đến ${targetName}!`);
      setForwardingMsg(null);
    } catch {
      toast.error("Không thể chuyển tiếp tin nhắn");
    }
  };

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(`vba.chat.${peer.peerCode}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [isPeerOnline, setIsPeerOnline] = useState<boolean>(() => Boolean(peer.isOnline));

  useEffect(() => {
    setIsPeerOnline(Boolean(peer.isOnline));
  }, [peer.isOnline]);

  useEffect(() => {
    if (isGroup || peer.isSystem || peer.peerCode === "admin" || peer.peerCode === "system") return;
    const socket = getConnectAppSocket();
    if (!socket.connected) {
      socket.connect();
    }
    const handleOnline = (data: { userId?: string }) => {
      const peerCodeLower = String(peer.peerCode || "").toLowerCase();
      if (
        data?.userId &&
        (data.userId === peer.userId ||
          String(data.userId).toLowerCase() === peerCodeLower)
      ) {
        setIsPeerOnline(true);
      }
    };
    const handleOffline = (data: { userId?: string }) => {
      const peerCodeLower = String(peer.peerCode || "").toLowerCase();
      if (
        data?.userId &&
        (data.userId === peer.userId ||
          String(data.userId).toLowerCase() === peerCodeLower)
      ) {
        setIsPeerOnline(false);
      }
    };
    socket.on("presence:user_online", handleOnline);
    socket.on("presence:user_offline", handleOffline);
    return () => {
      socket.off("presence:user_online", handleOnline);
      socket.off("presence:user_offline", handleOffline);
    };
  }, [peer.userId, peer.peerCode, peer.isSystem, isGroup]);

  // Realtime Socket listener for incoming messages
  useEffect(() => {
    const socket = getConnectAppSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const handleNewMessage = (payload: any) => {
      const fromCode = String(payload?.fromCode || "").toLowerCase();
      const toCode = String(payload?.toCode || "").toLowerCase();
      const currentPeer = String(peer.peerCode || "").toLowerCase();

      if (fromCode === currentPeer || toCode === currentPeer) {
        if (payload?.retractedMessageId) {
          setLocalMessages((prev) =>
            prev.map((m) =>
              m.id === payload.retractedMessageId
                ? { ...m, retracted: true, text: "[retracted]" }
                : m
            )
          );
        } else if (payload?.text) {
          const newMsg: ChatMessage = {
            id: `sock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text: payload.text,
            mine: fromCode !== currentPeer,
            time: "Vừa xong",
            createdAt: new Date().toISOString(),
            seen: true,
          };
          setLocalMessages((prev) => [...prev, newMsg]);
          saveRecentConversation(peer, payload.text);
        }
        try {
          reload();
        } catch {}
      }
    };

    socket.on("member:message_received", handleNewMessage);
    socket.on("dm:message_received", (p: any) => {
      if (p?.message?.body) {
        handleNewMessage({
          fromCode: peer.peerCode,
          text: p.message.body,
        });
      }
    });

    return () => {
      socket.off("member:message_received", handleNewMessage);
      socket.off("dm:message_received");
    };
  }, [peer.peerCode, reload]);

  const peerCodeLower = String(peer.peerCode || "").toLowerCase();
  const matchedMember = (members || []).find((m) => m?.code && String(m.code).toLowerCase() === peerCodeLower);
  const resolvedAvatar = peer.avatarUrl || matchedMember?.avatar || null;
  const displayName =
    isGroup
      ? peer.name || "Nhóm trò chuyện"
      : peer.name && String(peer.name).trim().toLowerCase() !== peerCodeLower
        ? peer.name
        : matchedMember?.personName || matchedMember?.contact || matchedMember?.name || data.peerName || peer.name || peer.peerCode;

  const handleOpenPeerProfile = () => {
    if (isGroup) {
      setGroupMembersOpen(true);
      return;
    }
    if (peer.isSystem || peer.peerCode === "admin" || peer.peerCode === "system") return;
    const found = (members || []).find((m) => m?.code && String(m.code).toLowerCase() === peerCodeLower);
    if (found) {
      setProfileMember(found);
    } else {
      setProfileMember({
        code: peer.peerCode,
        name: displayName,
        personName: displayName,
        contact: displayName,
        personTitle: "Hội viên ViOne Connect",
        industry: "Kinh doanh & Quản lý",
        region: "Hà Nội",
        type: "individual",
        verified: true,
        avatar: resolvedAvatar,
      });
    }
  };

  const [callModal, setCallModal] = useState<{ open: boolean; type: "audio" | "video" }>({
    open: false,
    type: "audio",
  });
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const [retractedMsgIds, setRetractedMsgIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(`vba.chat.retracted.${peer.peerCode}`) || "[]");
      return new Set(saved);
    } catch {
      return new Set();
    }
  });
  const [deletedForMeMsgIds, setDeletedForMeMsgIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(`vba.chat.deleted_for_me.${peer.peerCode}`) || "[]");
      return new Set(saved);
    } catch {
      return new Set();
    }
  });
  const [msgReactions, setMsgReactions] = useState<Record<string, { emoji: string; count: number }[]>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(`vba.chat.reactions.${peer.peerCode}`) || "{}");
    } catch {
      return {};
    }
  });

  const mergedMessages = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of data.messages) {
      map.set(m.id, m);
    }
    for (const m of localMessages) {
      if (!map.has(m.id)) {
        map.set(m.id, m);
      }
    }
    const all = Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.createdAt || a.time).getTime() - new Date(b.createdAt || b.time).getTime(),
    );

    // Nếu là Kênh Ban chuyên môn của Hiệp hội và chưa có tin nhắn, tự động nạp tin tức chính thức
    if (all.length === 0 && peer.peerCode.startsWith("channel_")) {
      const channelDefaults: Record<string, string[]> = {
        channel_secretariat: [
          "Chào mừng Quý Anh/Chị Hội viên đến với Kênh Ban Thư Ký & Ban Điều Hành ViOne Connect.",
          "[action:meeting|title:H%E1%BB%8Dp%20Ban%20Ch%E1%BA%A5p%20H%C3%A0nh%20CEO%201983%20Th%C3%A1ng%203|time:14:00%20-%2028/03/2026|location:Trung%20t%C3%A2m%20H%E1%BB%99i%20Ngh%E1%BB%8B%20Qu%E1%BB%91c%20Gia%20H%C3%A0%20N%E1%BB%99i|link:https://meet.vione.vn/vione-bch|desc:Phi%C3%AAn%20h%E1%BB%8Dp%20chi%E1%BA%BFn%20l%C6%B0%E1%BB%A3c%20tri%E1%BB%83n%20khai%20giao%20th%C6%B0%C6%A1ng%20to%C3%A0n%20di%E1%BB%87n]",
          "Văn bản chỉ đạo & kế hoạch hoạt động năm 2026 đã được Ban Thư Ký cập nhật. Kính mời Quý Hội viên theo dõi và đồng hành.",
        ],
        channel_media: [
          "Chào mừng Quý Hội viên đến với Kênh Ban Truyền Thông Hiệp Hội ViOne Connect.",
          "Bản tin hoạt động CLB: Đẩy mạnh các chiến dịch truyền thông nhận diện thương hiệu cho các doanh nghiệp hội viên trên đa nền tảng.",
          "Thông cáo báo chí: Chuỗi sự kiện Gala Doanh Nhân & Lễ tôn vinh Doanh nghiệp tiêu biểu 2026 chuẩn bị khởi động.",
        ],
        channel_promotion: [
          "Chào mừng Quý Hội viên đến với Kênh Ban Xúc Tiến Giao Thương CLB ViOne Connect.",
          "Chương trình Matching B2B: Ban Xúc tiến mở cổng tiếp nhận nhu cầu liên kết chuỗi cung ứng giữa các doanh nghiệp hội viên.",
          "Cơ hội kết nối tuần này: Nhu cầu tìm đối tác tổng thầu thi công nội thất, cung cấp nguyên vật liệu và giải pháp công nghệ số.",
        ],
        channel_deals: [
          "Chào mừng Quý Hội viên đến với Kênh Cơ Hội & Deal B2B CLB ViOne Connect.",
          "Tổng hợp các gói hợp tác kinh doanh độc quyền và chính sách chiết khấu ưu đãi nội bộ giữa các doanh nghiệp trong CLB.",
          "Deal hot tháng 3: Gói tài trợ truyền thông và gian hàng triển lãm B2B dành riêng cho hội viên chính thức.",
        ],
        channel_events: [
          "Chào mừng Quý Hội viên đến với Kênh Ban Sự Kiện & Hội Nghị CLB ViOne Connect.",
          "Lịch sự kiện sắp tới: Đại hội thường niên CLB ViOne Connect và Diễn đàn Kinh tế Tư nhân 2026.",
          "Vé tham dự sự kiện và mã QR Check-in đã sẵn sàng trong mục Sự kiện & Vé của bạn.",
        ],
      };
      const seeds = channelDefaults[peer.peerCode] || [
        `Chào mừng Quý Hội viên đến với Kênh ${peer.name}.`,
        "Thông báo và tài liệu mới từ Ban chuyên môn sẽ được gửi trực tiếp tại đây.",
      ];
      return seeds.map((s, idx) => ({
        id: `channel-seed-${peer.peerCode}-${idx}`,
        text: s,
        mine: false,
        time: idx === 0 ? "2 ngày trước" : idx === 1 ? "Hôm qua" : "Hôm nay",
        createdAt: new Date(Date.now() - (seeds.length - idx) * 3600000).toISOString(),
        seen: true,
      }));
    }

    // Chống duplicate tin nhắn (cùng nội dung, cùng người gửi trong khoảng 15s)
    const deduped: ChatMessage[] = [];
    const seenSignatures = new Set<string>();

    for (const m of all) {
      const timeMs = new Date(m.createdAt || m.time).getTime();
      const timeSlot = isNaN(timeMs) ? '0' : Math.floor(timeMs / 15000);
      const cleanText = (m.text || '').trim();
      const sig = `${Boolean(m.mine)}|${cleanText}|${timeSlot}`;

      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        deduped.push(m);
      }
    }

    return deduped.filter((m) => !deletedForMeMsgIds.has(m.id));
  }, [data.messages, localMessages, deletedForMeMsgIds, peer.peerCode, peer.name]);

  const handleToggleReaction = (msgId: string, emoji: string) => {
    setMsgReactions((prev) => {
      const list = prev[msgId] ? [...prev[msgId]] : [];
      const existingIdx = list.findIndex((r) => r.emoji === emoji);
      if (existingIdx !== -1) {
        list.splice(existingIdx, 1);
      } else {
        list.push({ emoji, count: 1 });
      }
      const next = { ...prev, [msgId]: list };
      try {
        localStorage.setItem(`vba.chat.reactions.${peer.peerCode}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    setActiveReactionPickerMsgId(null);
  };

  const retractMsgServer = useServerFn(retractMemberMessage);

  const handleRetractMessage = async (msgId: string) => {
    setRetractedMsgIds((prev) => {
      const next = new Set(prev);
      next.add(msgId);
      try {
        localStorage.setItem(`vba.chat.retracted.${peer.peerCode}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, retracted: true, text: "[retracted]" } : m))
    );
    saveRecentConversation(peer, "Bạn đã thu hồi một tin nhắn");
    setActiveMenuMsgId(null);
    toast.success("Đã thu hồi tin nhắn");
    try {
      await retractMsgServer({ data: { messageId: msgId } });
    } catch {}
  };

  const handleDeleteMessageForMe = (msgId: string) => {
    setDeletedForMeMsgIds((prev) => {
      const next = new Set(prev);
      next.add(msgId);
      try {
        localStorage.setItem(`vba.chat.deleted_for_me.${peer.peerCode}`, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setLocalMessages((prev) => {
      const next = prev.filter((m) => m.id !== msgId);
      try {
        localStorage.setItem(`vba.chat.${peer.peerCode}`, JSON.stringify(next.slice(-50)));
      } catch {}
      return next;
    });
    setActiveContextMenuMsgId(null);
    setActiveMenuMsgId(null);
    toast.success("Đã xóa tin nhắn ở phía bạn");
  };

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Đã sao chép nội dung tin nhắn");
    setActiveMenuMsgId(null);
  };

  const requestConnFn = useServerFn(requestMemberConnectionFn);
  const respondConnFn = useServerFn(respondMemberConnectionFn);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connState, setConnState] = useState({
    isConnected: Boolean(peer.isConnected),
    isPending: Boolean(peer.isPending),
    isOutgoingPending: Boolean(peer.isOutgoingPending),
    isIncomingPending: Boolean(peer.isIncomingPending),
    connectionId: peer.connectionId || null,
  });

  const handleSendConnectionRequest = async () => {
    if (!peer.userId) {
      toast.error("Không tìm thấy mã định danh tài khoản để gửi yêu cầu kết nối.");
      return;
    }
    setIsConnecting(true);
    try {
      await requestConnFn({ data: { targetUserId: peer.userId, message: "Muốn kết nối giao thương cùng bạn trên CLB ViOne Connect" } });
      setConnState((prev) => ({ ...prev, isConnected: false, isPending: true, isOutgoingPending: true, isIncomingPending: false }));
      toast.success(`Đã gửi lời mời kết nối tới ${displayName}`);
      window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
    } catch (e: any) {
      toast.error(e?.message || "Không thể gửi lời mời kết nối.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connState.connectionId) {
      toast.error("Không tìm thấy mã lời mời kết nối.");
      return;
    }
    setIsConnecting(true);
    try {
      await respondConnFn({ data: { connectionId: connState.connectionId, action: "accept" } });
      setConnState((prev) => ({ ...prev, isConnected: true, isPending: false, isOutgoingPending: false, isIncomingPending: false }));
      peer.isConnected = true;
      toast.success(`Đã đồng ý kết nối với ${displayName}`);
      window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
      reload();
    } catch (e: any) {
      toast.error(e?.message || "Không thể chấp nhận kết nối.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeclineConnection = async () => {
    if (!connState.connectionId) return;
    setIsConnecting(true);
    try {
      await respondConnFn({ data: { connectionId: connState.connectionId, action: "decline" } });
      setConnState((prev) => ({ ...prev, isConnected: false, isPending: false, isOutgoingPending: false, isIncomingPending: false }));
      toast.info(`Đã từ chối yêu cầu kết nối từ ${displayName}`);
      window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
    } catch (e: any) {
      toast.error(e?.message || "Không thể từ chối lời mời.");
    } finally {
      setIsConnecting(false);
    }
  };

  const bottomRef = useRef<HTMLDivElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, []);

  useEffect(() => {
    const socket = getConnectAppSocket();
    if (!socket.connected) {
      socket.connect();
    }
    const handleUpdate = () => reload();
    socket.on("dm:message_received", handleUpdate);
    socket.on("dm:thread_updated", handleUpdate);
    socket.on("dm:message_retracted", (data: any) => {
      if (data?.messageId) {
        setRetractedMsgIds((prev) => {
          const next = new Set(prev);
          next.add(data.messageId);
          return next;
        });
      }
      reload();
    });
    socket.on("dm:read_receipt", handleUpdate);
    socket.on("dm:reaction_updated", handleUpdate);
    socket.on("member:message_received", handleUpdate);

    const handleFocus = () => reload();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      socket.off("dm:message_received", handleUpdate);
      socket.off("dm:thread_updated", handleUpdate);
      socket.off("dm:message_retracted", handleUpdate);
      socket.off("dm:read_receipt", handleUpdate);
      socket.off("dm:reaction_updated", handleUpdate);
      socket.off("member:message_received", handleUpdate);
    };
  }, [reload, peer.peerCode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mergedMessages.length]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(
      isImage ? `Đang tải ảnh "${file.name}"...` : `Đang tải tệp "${file.name}"...`,
    );
    setUploadMenuOpen(false);

    try {
      const uploaded = await uploadChatAttachment(file);
      let payload = "";
      if (uploaded.isImage) {
        payload = text.trim()
          ? `${text.trim()}\n[image:${uploaded.url}|${uploaded.name}]`
          : `[image:${uploaded.url}|${uploaded.name}]`;
      } else {
        payload = text.trim()
          ? `${text.trim()}\n[file:${uploaded.url}|${uploaded.name}|${uploaded.size}]`
          : `[file:${uploaded.url}|${uploaded.name}|${uploaded.size}]`;
      }

      // Optimistic file message
      const tempId = "local-file-" + Date.now();
      const optimisticMsg: ChatMessage = {
        id: tempId,
        text: payload,
        mine: true,
        time: "Vừa xong",
        createdAt: new Date().toISOString(),
        seen: false,
      };
      const nextLocal = [...localMessages, optimisticMsg];
      setLocalMessages(nextLocal);
      try {
        localStorage.setItem(`vba.chat.${peer.peerCode}`, JSON.stringify(nextLocal.slice(-50)));
      } catch {}
      setText("");

      saveRecentConversation(peer, payload);
      await send({ data: { peerCode: peer.peerCode, text: payload } });
      reload();
    } catch {
      toast.error("Tải tệp đính kèm thất bại");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleSendLocation = () => {
    setUploadMenuOpen(false);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    toast.info("Đang định vị GPS...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const payload = `[location:${lat},${lng}|name:Vị trí hiện tại của tôi]`;

        const tempId = "local-loc-" + Date.now();
        const optimisticMsg: ChatMessage = {
          id: tempId,
          text: payload,
          mine: true,
          time: "Vừa xong",
          createdAt: new Date().toISOString(),
          seen: false,
        };
        const nextLocal = [...localMessages, optimisticMsg];
        setLocalMessages(nextLocal);
        try {
          localStorage.setItem(`vba.chat.${peer.peerCode}`, JSON.stringify(nextLocal.slice(-50)));
        } catch {}

        saveRecentConversation(peer, "📍 [Vị trí hiện tại]");
        try {
          await send({ data: { peerCode: peer.peerCode, text: payload } });
          toast.success("Đã chia sẻ vị trí hiện tại thành công!");
          reload();
        } catch {
          toast.error("Không thể gửi tin nhắn vị trí");
        }
      },
      (err) => {
        toast.error(`Không thể lấy vị trí: ${err.message || "Quyền truy cập vị trí bị từ chối"}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sendCallLogMessage = async (callPayload: string) => {
    const tempId = "local-call-" + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      text: callPayload,
      mine: true,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
      seen: false,
    };
    const nextLocal = [...localMessages, optimisticMsg];
    setLocalMessages(nextLocal);
    try {
      localStorage.setItem(`vba.chat.${peer.peerCode}`, JSON.stringify(nextLocal.slice(-50)));
    } catch {}

    saveRecentConversation(peer, callPayload);
    try {
      await send({ data: { peerCode: peer.peerCode, text: callPayload } });
      reload();
    } catch (e) {
      console.warn("sendCallLogMessage fallback:", e);
    }
  };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending || isUploading) return;
    setSending(true);

    let finalPayload = value;
    if (replyingTo) {
      finalPayload = `[reply:${replyingTo.id}|name:${encodeURIComponent(replyingTo.senderName)}|text:${encodeURIComponent(replyingTo.text)}]${value}`;
      setReplyingTo(null);
    }

    // Optimistic instant message
    const tempId = "local-" + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      text: finalPayload,
      mine: true,
      time: "Vừa xong",
      createdAt: new Date().toISOString(),
      seen: false,
    };
    const nextLocal = [...localMessages, optimisticMsg];
    setLocalMessages(nextLocal);
    try {
      localStorage.setItem(`vba.chat.${peer.peerCode}`, JSON.stringify(nextLocal.slice(-50)));
    } catch {}
    setText("");
    saveRecentConversation(peer, finalPayload);

    try {
      await send({ data: { peerCode: peer.peerCode, text: finalPayload } });
      reload();
    } catch (err) {
      console.warn("Send message sync notice:", err);
      // Still kept in local messages
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-[#0c121e] text-slate-900 dark:text-white overflow-hidden max-w-[480px] mx-auto shadow-2xl"
      onClick={() => setUploadMenuOpen(false)}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFileSelected(e, true)}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
        className="hidden"
        onChange={(e) => void handleFileSelected(e, false)}
      />

      {/* Lightbox Modal for Images & VietQR */}
      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <a
              href={previewImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={(e) => e.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Tải ảnh về máy"
            >
              <Download className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <img
            src={previewImageUrl}
            alt="Xem ảnh lớn"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      {/* VietQR Payment Modal - Centered on Mobile */}
      {paymentModalData && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setPaymentModalData(null)}
        >
          <div
            className="w-full max-w-[380px] rounded-3xl bg-[var(--vba-surface)] border border-[var(--vba-gold)]/40 p-5 shadow-2xl text-center space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--vba-border-soft)]">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[var(--vba-gold)]" />
                <span className="text-[14px] font-bold text-[var(--vba-text)]">
                  Thanh toán VietQR
                </span>
              </div>
              <button
                onClick={() => setPaymentModalData(null)}
                className="text-[var(--vba-text-dim)] hover:text-[var(--vba-text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[12px] text-[var(--vba-text-muted)]">Số tiền cần thanh toán</p>
              <p className="text-[24px] font-extrabold text-[var(--vba-gold)]">
                {paymentModalData.amount.toLocaleString("vi-VN")} ₫
              </p>
              <p className="text-[12px] font-medium text-[var(--vba-text-dim)]">
                Mã hóa đơn: {paymentModalData.invoiceNo}
              </p>
            </div>

            <div className="relative mx-auto w-56 h-56 rounded-2xl bg-white p-2 shadow-inner overflow-hidden border border-black/10">
              <img
                src={paymentModalData.qrUrl}
                alt="VietQR"
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-[11px] text-[var(--vba-text-muted)] leading-relaxed">
              Mở ứng dụng ngân hàng bất kỳ để quét mã QR và xác nhận giao dịch. Thông tin người nhận
              và nội dung đã được điền tự động.
            </p>

            <div className="flex gap-2 pt-2">
              <a
                href={paymentModalData.qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={`vietqr-${paymentModalData.invoiceNo}.png`}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface-2)] py-2 text-[12px] font-semibold text-[var(--vba-text)] hover:border-[var(--vba-gold)]"
              >
                <Download className="h-3.5 w-3.5" />
                Lưu mã QR
              </a>
              <button
                onClick={() => {
                  toast.success("Hệ thống đang kiểm tra trạng thái thanh toán!");
                  setPaymentModalData(null);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--vba-gold)] py-2 text-[12px] font-bold text-slate-950 hover:brightness-110 shadow-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã thanh toán
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header with Call & Video Call Actions - Safe Area Insets & High z-index */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0c121e]/95 px-4 pb-2.5 shrink-0 backdrop-blur-md shadow-xs"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 16px)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="grid h-9 w-9 place-items-center rounded-full text-[#003B95] dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-white/10 active:scale-95 transition-all shrink-0 -ml-1 mr-0.5 cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
          </button>
          <div
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-90 transition"
            onClick={handleOpenPeerProfile}
            title={isGroup ? "Bấm để xem danh sách thành viên nhóm" : "Bấm để xem profile hội viên"}
          >
            <div className="relative shrink-0">
              {isGroup ? (
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-[#003B95] via-[#1E40AF] to-indigo-600 text-white text-base shadow-sm ring-1 ring-indigo-500/40">
                  {peer.groupAvatar || "👥"}
                </div>
              ) : peer.isSystem || peer.peerCode === "admin" ? (
                <img
                  src="/landing_web_vione/vione-logo.png"
                  alt="ViOne Connect"
                  className="h-9 w-9 rounded-full object-contain p-0.5 bg-white ring-1 ring-amber-500/40 shadow-xs"
                />
              ) : resolvedAvatar ? (
                <img
                  src={resolveMediaUrl(resolvedAvatar) || resolvedAvatar}
                  alt={displayName}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-amber-500/70 shadow-xs"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-amber-300 text-xs font-bold ring-2 ring-amber-500/70 shadow-xs">
                  {initialsOf(displayName)}
                </div>
              )}
              {!isGroup && isPeerOnline && (
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c121e]"
                  title="Đang hoạt động"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[14.5px] font-bold text-slate-900 dark:text-white">
                  {displayName}
                </span>
                {isGroup ? (
                  <span className="shrink-0 rounded-md bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700/50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {peer.memberCount || (peer.members?.length ? peer.members.length + 1 : 2)} TV
                  </span>
                ) : (peer.isSystem || peer.peerCode === "admin" || peer.peerCode === "system" || peer.peerCode?.startsWith("channel_")) && (
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                )}
              </div>
              <div className="truncate text-[11.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                {isGroup ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {peer.memberCount || (peer.members?.length ? peer.members.length + 1 : 2)} thành viên · Chi tiết ›
                  </span>
                ) : peer.peerCode?.startsWith("channel_") ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-amber-500 shrink-0" />
                    Kênh chính thức CLB
                  </span>
                ) : peer.isSystem || peer.peerCode === "admin" || peer.peerCode === "system" ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-amber-500 shrink-0" />
                    Kênh thông báo hệ thống
                  </span>
                ) : (
                  <>
                    <span
                      className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                        connState.isConnected
                          ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                          : "bg-slate-400 dark:bg-slate-500"
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        connState.isConnected
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {connState.isConnected ? "Đã kết nối" : "Chưa kết nối"}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className={isPeerOnline ? "text-emerald-500 font-medium" : "text-slate-400"}>
                      {isPeerOnline ? "Đang hoạt động" : "Không trực tuyến"}
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenPeerProfile}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      · Xem profile ›
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions (Group vs Direct Call) */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {!isGroup && !connState.isConnected && !peer.isSystem && !peer.peerCode?.startsWith("channel_") && peer.peerCode !== "admin" && peer.peerCode !== "system" && (
            connState.isIncomingPending ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleAcceptConnection}
                  disabled={isConnecting}
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-[#003B95] hover:bg-[#002B70] transition shadow-2xs cursor-pointer"
                >
                  {isConnecting ? "..." : "Đồng ý"}
                </button>
                <button
                  type="button"
                  onClick={handleDeclineConnection}
                  disabled={isConnecting}
                  className="px-2 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition cursor-pointer"
                >
                  Từ chối
                </button>
              </div>
            ) : connState.isOutgoingPending ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                Chờ đồng ý
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSendConnectionRequest}
                disabled={isConnecting}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-[#003B95] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition border border-blue-200 dark:border-blue-800 cursor-pointer active:scale-95"
                title="Gửi lời mời kết nối"
              >
                <UserPlus className="h-3 w-3" />
                <span>{isConnecting ? "Đang gửi..." : "Kết nối"}</span>
              </button>
            )
          )}
          {isGroup ? (
            <button
              type="button"
              onClick={() => setGroupMembersOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 active:scale-95 transition cursor-pointer text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/40 shadow-2xs"
              title="Danh sách thành viên nhóm"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Thành viên</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCallModal({ open: true, type: "audio" })}
                className="grid h-9 w-9 place-items-center rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
                title="Gọi thoại Messenger"
              >
                <Phone className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setCallModal({ open: true, type: "video" })}
                className="grid h-9 w-9 place-items-center rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/10 active:scale-95 transition cursor-pointer"
                title="Gọi video Messenger"
              >
                <Video className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messenger Call Modal */}
      {callModal.open && (
        <MessengerCallModal
          type={callModal.type}
          peerName={displayName}
          peerAvatar={peer.avatarUrl}
          onClose={() => setCallModal({ open: false, type: "audio" })}
          onEndCall={(result) => {
            const callPayload = `[call:${result.type}|duration:${result.duration}|status:${result.status}]`;
            void sendCallLogMessage(callPayload);
          }}
        />
      )}

      {/* Message List */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">

        {loading && (
          <p className="py-8 text-center text-[13px] text-slate-400">{t("m.messages.loading")}</p>
        )}
        {error && <p className="py-8 text-center text-[13px] text-rose-500">{error}</p>}
        {!loading && mergedMessages.length === 0 && (
          <p className="py-8 text-center text-[13px] text-slate-400">
            {t("m.messages.emptyThread")}
          </p>
        )}
        {(() => {
          return mergedMessages.map((m, idx) => {
            const prevMsg = idx > 0 ? mergedMessages[idx - 1] : null;
            const isNewDay =
              !prevMsg ||
              new Date(m.createdAt || m.time).toDateString() !==
                new Date(prevMsg.createdAt || prevMsg.time).toDateString();
            const isRetracted = (m as any).retracted || retractedMsgIds.has(m.id);
            const reactions = msgReactions[m.id] || (m as any).reactions || [];
            const content = parseMessageContent(m.text);

            return (
              <div key={m.id} className="space-y-1.5">
                {isNewDay && (
                  <div className="flex items-center justify-center my-3">
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-0.5 text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 shadow-2xs">
                      {formatDateSeparator(m.createdAt || m.time)}
                    </span>
                  </div>
                )}

                {m.text?.startsWith("[system]") ? (
                  <div className="flex items-center justify-center my-3 w-full">
                    <span className="rounded-full bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/40 dark:border-slate-700/50 px-4 py-1.5 text-[11.5px] font-medium text-slate-700 dark:text-slate-300 text-center max-w-[85%] shadow-2xs">
                      {m.text.replace("[system]", "").trim()}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`flex w-full ${
                      m.mine ? "justify-end" : "justify-start"
                    } items-end gap-2 group mb-2.5`}
                  >
                  {/* Avatar đối phương bên trái cho tin nhắn đến (chuẩn Messenger) */}
                  {!m.mine && (
                    <div
                      className="shrink-0 mb-0.5 cursor-pointer"
                      onClick={handleOpenPeerProfile}
                      title="Xem hồ sơ hội viên"
                    >
                      {peer.isSystem ? (
                        <img
                          src="/landing_web_vione/vione-logo.png"
                          alt="ViOne Connect"
                          className="h-7 w-7 rounded-full object-contain p-0.5 bg-white ring-1 ring-amber-500/40"
                        />
                      ) : resolvedAvatar ? (
                        <img
                          src={resolveMediaUrl(resolvedAvatar) || resolvedAvatar}
                          alt={displayName}
                          className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-zinc-700"
                        />
                      ) : (
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-[10px] font-bold text-white">
                          {initialsOf(displayName)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Item Container: bubble row + seen avatar strictly OUTSIDE the border */}
                  <div
                    className={`flex flex-col ${
                      m.mine ? "items-end" : "items-start"
                    } max-w-[85%] sm:max-w-[76%]`}
                  >
                    {/* Horizontal container: bubble + hover action buttons */}
                    <div
                      className={`flex items-center gap-1.5 ${
                        m.mine ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* The Message Bubble */}
                      {isRetracted ? (
                        <div className="rounded-2xl border border-slate-300/80 dark:border-zinc-700/80 bg-transparent px-3.5 py-2 text-[13px] italic text-slate-500 dark:text-zinc-400 select-none inline-flex items-center gap-1.5">
                          {m.mine ? "Bạn đã thu hồi một tin nhắn" : "Tin nhắn đã được thu hồi"}
                        </div>
                      ) : (
                        <div
                          onTouchStart={(e) => handleBubbleTouchStart(e, m)}
                          onTouchMove={handleBubbleTouchMove}
                          onTouchEnd={handleBubbleTouchEnd}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setActiveContextMenuMsgId(activeContextMenuMsgId === m.id ? null : m.id);
                          }}
                          className={`relative rounded-2xl shadow-xs transition-all select-none ${
                            content.type === "action_payment"
                              ? "rounded-2xl bg-transparent border-0 shadow-none p-0 max-w-full"
                              : content.type === "action_meeting"
                                ? "max-w-full overflow-hidden border border-amber-500/30"
                                : content.type === "call"
                                  ? "rounded-2xl bg-transparent border-0 shadow-none p-0 max-w-full"
                                  : m.mine
                                    ? "bg-[#0084FF] text-white rounded-tr-xs"
                                    : "bg-[#F0F2F5] dark:bg-[#303030] text-[#050505] dark:text-[#E4E6EB] rounded-tl-xs"
                          }`}
                        >
                          {/* Reply Quote Header Inside Bubble */}
                          {content.replyQuote && (
                            <div
                              className={`mx-2.5 mt-2 mb-1 rounded-xl p-2 text-[12px] border-l-2 select-none ${
                                m.mine
                                  ? "bg-white/20 text-white/95 border-white"
                                  : "bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-[#0084FF]"
                              }`}
                            >
                              <div className="font-semibold text-[10.5px] opacity-85 flex items-center gap-1">
                                <Reply className="h-3 w-3 inline" />
                                {content.replyQuote.senderName || "Người gửi"}
                              </div>
                              <div className="truncate text-[11.5px] opacity-95 mt-0.5">
                                {content.replyQuote.text}
                              </div>
                            </div>
                          )}

                          {/* Messenger Call Log Bubble Card */}
                          {content.type === "call" ? (
                            <div
                              className={`p-3.5 space-y-2.5 rounded-2xl min-w-[230px] max-w-xs ${
                                m.mine
                                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20"
                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-md"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                                    content.status === "missed"
                                      ? "bg-rose-500/20 text-rose-500"
                                      : m.mine
                                        ? "bg-white/20 text-white"
                                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                  }`}
                                >
                                  {content.callType === "video" ? (
                                    <Video className="h-5 w-5" />
                                  ) : (
                                    <Phone className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[13.5px] font-bold leading-tight">
                                    {content.callType === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại"}
                                    {content.status === "missed" && (
                                      <span className="text-rose-400 text-xs ml-1 font-semibold">(Nhỡ)</span>
                                    )}
                                  </h4>
                                  <p
                                    className={`text-[11.5px] font-medium mt-0.5 ${
                                      m.mine ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                                    }`}
                                  >
                                    {content.status === "missed"
                                      ? "Không trả lời"
                                      : `${Math.floor(content.duration / 60)
                                          .toString()
                                          .padStart(2, "0")}:${(content.duration % 60)
                                          .toString()
                                          .padStart(2, "0")}`}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-1.5 border-t border-white/20 dark:border-slate-700/50 flex justify-end">
                                <button
                                  type="button"
                                  onClick={(evt) => {
                                    evt.stopPropagation();
                                    setCallModal({ open: true, type: content.callType });
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                                    m.mine
                                      ? "bg-white text-blue-700 hover:bg-white/90"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  }`}
                                >
                                  {content.callType === "video" ? (
                                    <Video className="h-3.5 w-3.5" />
                                  ) : (
                                    <Phone className="h-3.5 w-3.5" />
                                  )}
                                  <span>Gọi lại</span>
                                </button>
                              </div>
                            </div>
                          ) : content.type === "action_payment" ? (
                            <ZaloTransactionCard data={content.data} isFromMe={m.mine} />
                          ) : content.type === "action_ticket" ? (
                            <EventTicketCard data={content.data} isFromMe={m.mine} />
                          ) : content.type === "action_meeting" ? (
                            /* Action Card: Meeting Invitation */
                            <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-l-4 border-amber-500 rounded-2xl">
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-amber-50 dark:bg-amber-950/50 p-1 text-[#003B95] dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  <Calendar className="h-4 w-4" />
                                </span>
                                <div>
                                  <p className="text-[12px] font-bold text-[#003B95] dark:text-amber-400 tracking-wide uppercase">
                                    Thư mời tham dự cuộc họp
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    ViOne Connect
                                  </p>
                                </div>
                              </div>

                              <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-snug">
                                {content.data.title}
                              </h4>

                              <div className="space-y-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-2.5 text-[11px] border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-[#003B95] dark:text-amber-400 shrink-0" />
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {content.data.time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                  <span className="truncate text-slate-700 dark:text-slate-300">
                                    {content.data.location}
                                  </span>
                                </div>
                              </div>

                              {content.data.desc && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {content.data.desc}
                                </p>
                              )}

                              <div className="flex gap-2 pt-1">
                                {content.data.link && (
                                  <a
                                    href={content.data.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 py-2 text-[11.5px] font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  >
                                    <Video className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    Vào phòng họp
                                  </a>
                                )}
                                <button
                                  onClick={() => toast.success("Đã ghi nhận xác nhận tham dự của bạn!")}
                                  style={{ color: "#ffffff" }}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] py-2 text-[11.5px] font-bold text-white active:scale-95 transition-all cursor-pointer shadow-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Xác nhận tham dự
                                </button>
                              </div>
                            </div>
                          ) : content.type === "image" ? (
                            <div className="p-1 space-y-1">
                              <div
                                onClick={() => setPreviewImageUrl(content.url)}
                                className="group relative cursor-pointer overflow-hidden rounded-xl border border-black/10 dark:border-white/10"
                              >
                                <img
                                  src={content.url}
                                  alt={content.name || "Hình ảnh"}
                                  className="max-h-60 max-w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    Xem ảnh
                                  </span>
                                </div>
                              </div>
                              {content.caption ? (
                                <p className={`px-2 pb-1 text-[13px] leading-relaxed ${m.mine ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                                  {content.caption}
                                </p>
                              ) : null}
                            </div>
                          ) : content.type === "file" ? (
                            <div className="p-2 space-y-1.5">
                              {(() => {
                                const badge = getFileBadgeInfo(content.name);
                                return (
                                  <a
                                    href={content.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center gap-3 rounded-xl p-2.5 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                                  >
                                    <div
                                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border font-bold text-[11px] ${badge.color}`}
                                    >
                                      {badge.label}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-white">
                                        {content.name}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {content.size ? (
                                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {formatFileSize(content.size)}
                                          </span>
                                        ) : null}
                                        <span className="flex items-center gap-0.5 text-[11px] font-medium underline text-[#003B95] dark:text-amber-400">
                                          <Download className="h-3 w-3" />
                                          Tải về
                                        </span>
                                      </div>
                                    </div>
                                  </a>
                                );
                              })()}
                              {content.caption ? (
                                <p className={`px-2 text-[13px] leading-relaxed ${m.mine ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                                  {content.caption}
                                </p>
                              ) : null}
                            </div>
                          ) : content.type === "location" ? (
                            <div className="p-3 space-y-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 min-w-[220px]">
                              <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0 border border-rose-200 dark:border-rose-900/40 shadow-xs">
                                  <MapPin className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12.5px] font-bold text-slate-900 dark:text-white truncate">
                                    {content.name || "Vị trí đã chia sẻ"}
                                  </p>
                                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                                    {content.lat}, {content.lng}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={`https://www.google.com/maps?q=${content.lat},${content.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 py-2 text-[11.5px] font-bold text-[#003B95] dark:text-blue-400 border border-[#003B95]/20 transition shadow-2xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Mở trên Google Maps
                              </a>
                            </div>
                          ) : (
                            <div className="px-3.5 py-2 text-[14px]">
                              <p
                                className={`whitespace-pre-wrap break-words leading-relaxed font-normal ${
                                  m.mine ? "text-white" : "text-[#050505] dark:text-[#E4E6EB]"
                                }`}
                              >
                                {content.text}
                              </p>
                              <div
                                className={`flex items-center justify-end gap-1.5 pt-0.5 text-[10px] font-medium leading-none select-none ${
                                  m.mine ? "text-white/80" : "text-slate-400 dark:text-zinc-400"
                                }`}
                              >
                                <span>{formatMessageTime(m.createdAt || m.time)}</span>
                              </div>
                            </div>
                          )}

                          {/* Floating Reactions Pill on Bubble Corner */}
                          {reactions.length > 0 && !isRetracted && (
                            <div
                              className={`absolute -bottom-2.5 z-10 flex items-center gap-0.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-1.5 py-0.5 shadow-sm text-[11px] ${
                                m.mine ? "right-2" : "left-2"
                              }`}
                            >
                              {reactions.map((r, i) => (
                                <span key={i} className="inline-flex items-center gap-0.5 font-bold">
                                  <span>{r.emoji}</span>
                                  {r.count && r.count > 1 && (
                                    <span className="text-[9.5px] text-slate-600 dark:text-zinc-300">
                                      {r.count}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Messenger Long Press Menu & Reactions Popover (Dí liền hiện chuẩn Messenger) */}
                          {activeContextMenuMsgId === m.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveContextMenuMsgId(null);
                                }}
                              />
                              <div
                                className={`absolute z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150 ${
                                  m.mine ? "right-0" : "left-0"
                                } -top-20`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* 1. Emoji Reaction Bar */}
                                <div className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 shadow-2xl backdrop-blur-md">
                                  {QUICK_REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        handleToggleReaction(m.id, emoji);
                                        setActiveContextMenuMsgId(null);
                                      }}
                                      className="flex h-8 w-8 items-center justify-center rounded-full text-[17px] hover:scale-125 active:scale-95 transition-transform cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>

                                {/* 2. Messenger Quick Actions (Trả lời, Chuyển tiếp, Sao chép, Thu hồi) */}
                                <div className="flex items-center gap-0.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 shadow-2xl backdrop-blur-md">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rawTxt = "text" in content ? (content as any).text : m.text;
                                      setReplyingTo({
                                        id: m.id,
                                        senderName: m.mine ? "Bạn" : displayName,
                                        text: rawTxt,
                                      });
                                      setActiveContextMenuMsgId(null);
                                      chatInputRef.current?.focus();
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer transition"
                                  >
                                    <Reply className="h-3.5 w-3.5 text-[#0084FF]" />
                                    <span>Trả lời</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setForwardingMsg(m);
                                      setActiveContextMenuMsgId(null);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer transition"
                                  >
                                    <Share2 className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Chuyển tiếp</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rawTxt = "text" in content ? (content as any).text : m.text;
                                      handleCopyText(rawTxt);
                                      setActiveContextMenuMsgId(null);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer transition"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Sao chép</span>
                                  </button>

                                  {m.mine && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleRetractMessage(m.id);
                                        setActiveContextMenuMsgId(null);
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                      <span>Thu hồi</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteMessageForMe(m.id);
                                      setActiveContextMenuMsgId(null);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Xóa ở phía tôi</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Action buttons (Reply & Reaction & Menu) inline beside the bubble (hidden on mobile, uses long-press) */}
                      {!isRetracted && (
                        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {/* Quick Reply button */}
                          <button
                            type="button"
                            onClick={() => {
                              const rawTxt = "text" in content ? (content as any).text : m.text;
                              setReplyingTo({
                                id: m.id,
                                senderName: m.mine ? "Bạn" : displayName,
                                text: rawTxt,
                              });
                              chatInputRef.current?.focus();
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-500 hover:text-[#0084FF] hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 shadow-xs cursor-pointer text-[12px]"
                            title="Trả lời tin nhắn"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </button>

                          {/* Reaction Picker Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveReactionPickerMsgId(
                                  activeReactionPickerMsgId === m.id ? null : m.id,
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 shadow-xs cursor-pointer text-[12px]"
                              title="Thả cảm xúc"
                            >
                              <Smile className="h-3.5 w-3.5" />
                            </button>
                            {activeReactionPickerMsgId === m.id && (
                              <div
                                className={`absolute bottom-8 z-30 flex items-center gap-1 rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 ${
                                  m.mine ? "right-0" : "left-0"
                                }`}
                              >
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleToggleReaction(m.id, emoji)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-[15px] hover:scale-125 transition-transform cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* More Menu (...) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuMsgId(activeMenuMsgId === m.id ? null : m.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 shadow-xs cursor-pointer"
                              title="Tùy chọn"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                            {activeMenuMsgId === m.id && (
                              <div
                                className={`absolute bottom-8 z-30 min-w-[140px] rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 ${
                                  m.mine ? "right-0" : "left-0"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rawTxt = "text" in content ? (content as any).text : m.text;
                                    setReplyingTo({
                                      id: m.id,
                                      senderName: m.mine ? "Bạn" : displayName,
                                      text: rawTxt,
                                    });
                                    setActiveMenuMsgId(null);
                                    chatInputRef.current?.focus();
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                                >
                                  <Reply className="h-3.5 w-3.5 text-[#0084FF]" />
                                  <span>Trả lời</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForwardingMsg(m);
                                    setActiveMenuMsgId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                                >
                                  <Share2 className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Chuyển tiếp</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText("text" in content ? (content as any).text : m.text)}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Sao chép</span>
                                </button>
                                {m.mine && (
                                  <button
                                    type="button"
                                    onClick={() => handleRetractMessage(m.id)}
                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>Thu hồi tin nhắn</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessageForMe(m.id)}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer font-medium"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Xóa ở phía tôi</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Icon đã xem / đã gửi nằm hoàn toàn NGOÀI border tin nhắn (chuẩn Messenger 100%) */}
                    {m.mine && (
                      <div className="flex justify-end items-center gap-1 mt-0.5 pr-0.5 select-none">
                        {m.seen ? (
                          <div className="flex items-center gap-1" title="Đã xem">
                            {resolvedAvatar ? (
                              <img
                                src={resolveMediaUrl(resolvedAvatar) || resolvedAvatar}
                                alt="Đã xem"
                                className="h-3.5 w-3.5 rounded-full object-cover ring-1 ring-slate-300 dark:ring-zinc-700"
                              />
                            ) : (
                              <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-300 dark:bg-zinc-700 text-[8px] font-bold text-slate-700 dark:text-zinc-200">
                                {initialsOf(displayName)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 flex items-center gap-0.5">
                            <Check className="h-3 w-3 text-slate-400" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            );
          });
        })()}
        <div ref={bottomRef} />
      </div>

      {isUploading ? (
        <div className="flex items-center gap-2 border-t border-amber-500/20 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-[12px] text-[#003B95] dark:text-amber-400 animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span className="truncate">{uploadProgress || "Đang tải tệp lên..."}</span>
        </div>
      ) : null}

      {/* Replying Preview Banner (Chuẩn Messenger) */}
      {replyingTo && (
        <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-white/10 bg-slate-100/95 dark:bg-[#1e293b]/95 px-3.5 py-2 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Reply className="h-4 w-4 text-[#0084FF] shrink-0" />
            <div className="min-w-0 flex-1 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Đang trả lời {replyingTo.senderName}:
              </span>{" "}
              <span className="truncate text-slate-500 dark:text-slate-400 italic">
                {replyingTo.text}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="grid h-6 w-6 place-items-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer ml-2 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar - Safe Area Insets to avoid mobile navigation bar overlap */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-1.5 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0f172a]/95 px-2.5 pt-2.5 shrink-0 backdrop-blur-md"
        style={{
          marginBottom: `${keyboardOffset}px`,
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)",
        }}
      >
        {/* Quick action: Expander (+) menu for Attachments, Photos & Location */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUploadMenuOpen((prev) => !prev);
            }}
            disabled={isUploading}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
              uploadMenuOpen
                ? "bg-[#003B95] text-white rotate-45"
                : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15"
            }`}
            title="Đính kèm phương tiện & vị trí"
          >
            <Plus className="h-5 w-5 transition-transform" />
          </button>

          {/* Expander Menu Popup */}
          {uploadMenuOpen && (
            <div
              className="absolute bottom-12 left-0 z-50 flex flex-col gap-1 w-44 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setUploadMenuOpen(false);
                  imageInputRef.current?.click();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <span>Gửi hình ảnh</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUploadMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Paperclip className="h-4 w-4" />
                </div>
                <span>Gửi tài liệu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUploadMenuOpen(false);
                  handleSendLocation();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>Chia sẻ vị trí</span>
              </button>
            </div>
          )}
        </div>

        <input
          ref={chatInputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyingTo ? `Trả lời ${replyingTo.senderName}...` : "Nhập tin nhắn..."}
          className="flex-1 rounded-2xl border-0 border-none bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2 text-[13px] text-slate-900 dark:text-white outline-none focus:outline-none focus:ring-0 ring-0 hover:border-0 hover:outline-none focus:border-0 placeholder:text-slate-400 shadow-none"
          style={{ border: "none", outline: "none", boxShadow: "none" }}
        />

        <button
          type="submit"
          disabled={!text.trim() || sending || isUploading}
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#003B95] hover:bg-[#002B70] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
          title="Gửi tin nhắn"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {/* Member Profile Modal in Chat */}
      <MemberProfileModal
        member={profileMember}
        onClose={() => setProfileMember(null)}
        onMessage={() => setProfileMember(null)}
      />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        open={Boolean(forwardingMsg)}
        onClose={() => setForwardingMsg(null)}
        messageText={forwardingMsg?.text || ""}
        members={members}
        onForward={handleForwardMessage}
      />

      {/* Group Members Modal */}
      {isGroup && (
        <GroupMembersModal
          open={groupMembersOpen}
          onClose={() => setGroupMembersOpen(false)}
          group={peer}
          allMembers={members}
          onSelectMember={(m) => {
            setGroupMembersOpen(false);
            setProfileMember(m);
          }}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import {
  listConversations,
  listMembers,
  getMyMember,
  requestMemberConnectionFn,
  respondMemberConnectionFn,
  disconnectMemberConnectionFn,
  type MyMember,
  type MyConversation,
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
import { toast } from "sonner";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import { MemberProfileModal } from "@/components/member/MemberProfileModal";
import { CreateGroupChatModal } from "@/components/member/CreateGroupChatModal";
import { GroupMembersModal } from "@/components/member/GroupMembersModal";
import {
  isSelfUser,
  formatMessageTime,
  initialsOf,
  cleanPersonName,
  getShortName,
  resolveMediaUrl,
  formatMessagePreview,
  saveRecentConversation,
  type ConvFilter,
  type ConvSortMode,
  ALPHABET_LETTERS,
  getNormalizedFirstChar,
} from "./types";

export interface ConversationListProps {
  onOpen: (c: MyConversation) => void;
  members?: DirectoryMember[];
}

export function ConversationList({ onOpen, members: propMembers }: { onOpen: (c: MyConversation) => void; members?: DirectoryMember[] }) {
  const { user } = useAuth();
  const { data: myMember } = useServerData<MyMember | null>(() => getMyMember(), null, "vba_my_member");
  const t = useT();
  const fmt = useFmt();
  const {
    data: conversations,
    loading,
    error,
    reload,
  } = useServerData<MyConversation[]>(() => listConversations(), [], "vba_conversations");

  // Client-side direct fetch từ NestJS /dm/member/conversations bằng Bearer token cho môi trường Mobile APK
  const [directConversations, setDirectConversations] = useState<MyConversation[] | null>(null);

  const fetchDirectConversations = useCallback(() => {
    fetchNestApi<any[]>("/dm/member/conversations")
      .then((items: any) => {
        if (Array.isArray(items)) {
          setDirectConversations(items.map((c: any) => ({
            peerCode: c.peerCode,
            name: c.name,
            last: c.last,
            time: c.time,
            rawTime: c.rawTime || c.time,
            unread: c.unread ?? 0,
            avatarUrl: c.avatarUrl ?? null,
            isSystem: Boolean(c.isSystem),
            isOnline: Boolean(c.isOnline),
            userId: c.userId ?? null,
            isConnected: Boolean(c.isConnected),
            connectionStatus: c.connectionStatus || (c.isSystem ? "accepted" : "none"),
            isPending: Boolean(c.isPending),
            isOutgoingPending: Boolean(c.isOutgoingPending),
            isIncomingPending: Boolean(c.isIncomingPending),
            isStranger: Boolean(c.isStranger),
            connectionId: c.connectionId ?? null,
            isGroup: Boolean(c.isGroup),
            memberCount: c.memberCount,
            members: c.members,
            groupAvatar: c.groupAvatar,
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchDirectConversations();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchDirectConversations();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchDirectConversations]);

  const [localRecents, setLocalRecents] = useState<MyConversation[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("vba.recent_conversations");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [localGroups, setLocalGroups] = useState<MyConversation[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("vba.group_conversations");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [swipedConvCode, setSwipedConvCode] = useState<string | null>(null);
  const [selectedConvForAction, setSelectedConvForAction] = useState<MyConversation | null>(null);
  const [pinnedConvs, setPinnedConvs] = useState<Record<string, boolean>>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("vba_pinned_convs") || "{}");
      return (parsed && typeof parsed === "object") ? parsed : {};
    } catch {
      return {};
    }
  });
  const [mutedConvs, setMutedConvs] = useState<Record<string, boolean>>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("vba_muted_convs") || "{}");
      return (parsed && typeof parsed === "object") ? parsed : {};
    } catch {
      return {};
    }
  });

  const rowTouchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const rowLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRowTouchStart = (e: React.TouchEvent, conv: MyConversation) => {
    const touch = e.touches[0];
    rowTouchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    if (rowLongPressTimerRef.current) clearTimeout(rowLongPressTimerRef.current);
    rowLongPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate(35); } catch {}
      }
      setSelectedConvForAction(conv);
    }, 450);
  };

  const handleRowTouchMove = (e: React.TouchEvent, conv: MyConversation) => {
    const touch = e.touches[0];
    const diffX = touch.clientX - rowTouchStartRef.current.x;
    const diffY = Math.abs(touch.clientY - rowTouchStartRef.current.y);
    if (Math.abs(diffX) > 10 || diffY > 10) {
      if (rowLongPressTimerRef.current) {
        clearTimeout(rowLongPressTimerRef.current);
        rowLongPressTimerRef.current = null;
      }
    }
    if (diffX < -45 && diffY < 25) {
      setSwipedConvCode(conv.peerCode);
    } else if (diffX > 30) {
      if (swipedConvCode === conv.peerCode) {
        setSwipedConvCode(null);
      }
    }
  };

  const handleRowTouchEnd = () => {
    if (rowLongPressTimerRef.current) {
      clearTimeout(rowLongPressTimerRef.current);
      rowLongPressTimerRef.current = null;
    }
  };

  const togglePinConv = (code: string) => {
    setPinnedConvs((prev) => {
      const next = { ...prev, [code]: !prev[code] };
      try {
        localStorage.setItem("vba_pinned_convs", JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedConvForAction(null);
    toast.success(pinnedConvs[code] ? "Đã bỏ ghim cuộc trò chuyện" : "Đã ghim cuộc trò chuyện lên đầu");
  };

  const toggleMuteConv = (code: string) => {
    setMutedConvs((prev) => {
      const next = { ...prev, [code]: !prev[code] };
      try {
        localStorage.setItem("vba_muted_convs", JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedConvForAction(null);
    toast.success(mutedConvs[code] ? "Đã bật thông báo" : "Đã tắt thông báo cuộc trò chuyện");
  };

  const handleDeleteConversation = (peerCode: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetKey = String(peerCode || "").toLowerCase();
    if (!targetKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem("vba_deleted_convs") || "[]");
      const list: string[] = Array.isArray(stored) ? stored : [];
      if (!list.includes(targetKey)) {
        list.push(targetKey);
        localStorage.setItem("vba_deleted_convs", JSON.stringify(list));
      }
    } catch {}

    setLocalRecents((prev) => {
      const next = prev.filter((c) => c?.peerCode && String(c.peerCode).toLowerCase() !== targetKey);
      try {
        localStorage.setItem("vba.recent_conversations", JSON.stringify(next));
      } catch {}
      return next;
    });
    setLocalGroups((prev) => {
      const next = prev.filter((c) => c?.peerCode && String(c.peerCode).toLowerCase() !== targetKey);
      try {
        localStorage.setItem("vba.group_conversations", JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      localStorage.removeItem(`vba.chat.${peerCode}`);
    } catch {}
    setSwipedConvCode(null);
    setSelectedConvForAction(null);
    window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
    toast.success("Đã xóa cuộc trò chuyện");
  };

  useEffect(() => {
    const syncLocal = () => {
      try {
        const raw = localStorage.getItem("vba.recent_conversations");
        if (raw) setLocalRecents(JSON.parse(raw));
        const rawGroups = localStorage.getItem("vba.group_conversations");
        if (rawGroups) setLocalGroups(JSON.parse(rawGroups));
        reload();
      } catch {}
    };
    window.addEventListener("focus", syncLocal);
    window.addEventListener("storage", syncLocal);
    window.addEventListener("vba:conversation_updated", syncLocal);
    return () => {
      window.removeEventListener("focus", syncLocal);
      window.removeEventListener("storage", syncLocal);
      window.removeEventListener("vba:conversation_updated", syncLocal);
    };
  }, []);

  const fetchMembers = useServerFn(listMembers);
  const { data: fetchedMembers = [] } = useServerData<DirectoryMember[]>(() => fetchMembers(), [], "vba_directory_members");
  const members = propMembers && propMembers.length > 0 ? propMembers : fetchedMembers;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ConvFilter>("all");
  const [sortMode, setSortMode] = useState<ConvSortMode>("newest");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showAlphabetStrip, setShowAlphabetStrip] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [selectedMemberModal, setSelectedMemberModal] = useState<DirectoryMember | null>(null);
  const [selectedMemberIsConnected, setSelectedMemberIsConnected] = useState<boolean>(false);

  const handleAvatarClick = (c: any) => {
    if (c.isGroup || c.peerCode?.startsWith("group_") || c.isSystem || c.peerCode === "admin" || c.peerCode === "system") {
      onOpen(c);
      return;
    }
    setSelectedMemberIsConnected(Boolean(c.isConnected));
    const found = members.find((m) => m.code === c.peerCode);
    if (found) {
      setSelectedMemberModal(found);
    } else {
      setSelectedMemberModal({
        code: c.peerCode,
        name: c.name,
        personName: c.name,
        personTitle: "Hội viên ViOne Connect",
        industry: "Kinh doanh & Quản lý",
        region: "Hà Nội",
        type: "individual",
        verified: true,
        avatar: c.avatarUrl,
      });
    }
  };

  const [onlineUserMap, setOnlineUserMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!conversations || conversations.length === 0) return;
    setOnlineUserMap((prev) => {
      const next = { ...prev };
      for (const c of conversations) {
        if (c?.userId) {
          if (next[c.userId] === undefined) next[c.userId] = Boolean(c.isOnline);
        }
        if (c?.peerCode) {
          const codeKey = String(c.peerCode).toLowerCase();
          if (next[codeKey] === undefined) next[codeKey] = Boolean(c.isOnline);
        }
      }
      return next;
    });
  }, [conversations]);

  useEffect(() => {
    const socket = getConnectAppSocket();
    if (!socket.connected) {
      socket.connect();
    }
    const handleUpdate = () => {
      reload();
      try {
        const raw = localStorage.getItem("vba.recent_conversations");
        if (raw) setLocalRecents(JSON.parse(raw));
      } catch {}
    };
    const handleOnline = (data: { userId?: string }) => {
      if (data?.userId) {
        const uid = String(data.userId);
        setOnlineUserMap((prev) => ({
          ...prev,
          [uid]: true,
          [uid.toLowerCase()]: true,
        }));
      }
    };
    const handleOffline = (data: { userId?: string }) => {
      if (data?.userId) {
        const uid = String(data.userId);
        setOnlineUserMap((prev) => ({
          ...prev,
          [uid]: false,
          [uid.toLowerCase()]: false,
        }));
      }
    };
    socket.on("dm:message_received", handleUpdate);
    socket.on("dm:thread_updated", handleUpdate);
    socket.on("member:message_received", handleUpdate);
    socket.on("presence:user_online", handleOnline);
    socket.on("presence:user_offline", handleOffline);

    const handleFocus = () => handleUpdate();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      socket.off("dm:message_received", handleUpdate);
      socket.off("dm:thread_updated", handleUpdate);
      socket.off("member:message_received", handleUpdate);
      socket.off("presence:user_online", handleOnline);
      socket.off("presence:user_offline", handleOffline);
    };
  }, [reload]);

  const checkOnline = (c: MyConversation) => {
    if (c.isSystem || c.peerCode === "admin" || c.peerCode === "system") return false;
    if (c.userId && onlineUserMap[c.userId] !== undefined) {
      return onlineUserMap[c.userId];
    }
    const codeKey = c.peerCode?.toLowerCase();
    if (codeKey && onlineUserMap[codeKey] !== undefined) {
      return onlineUserMap[codeKey];
    }
    return Boolean(c.isOnline);
  };

  const allConversations = useMemo(() => {
    const deletedConvs = new Set<string>();
    try {
      const stored = JSON.parse(localStorage.getItem("vba_deleted_convs") || "[]");
      if (Array.isArray(stored)) {
        stored.forEach((k: string) => {
          if (k) deletedConvs.add(String(k).toLowerCase());
        });
      }
    } catch {}

    const memberMap = new Map<string, DirectoryMember>();
    if (Array.isArray(members)) {
      for (const m of members) {
        if (m?.code) memberMap.set(String(m.code).toLowerCase(), m);
      }
    }

    const map = new Map<string, MyConversation>();
    // First, map server conversations enriched with directory member details
    const convSource = (directConversations && directConversations.length > 0) ? directConversations : (conversations || []);
    if (Array.isArray(convSource)) {
      for (const c of convSource) {
        if (!c) continue;
        const cPeer = String(c.peerCode || "");
        if (!cPeer) continue;
        const key = cPeer.toLowerCase();
        if (deletedConvs.has(key)) {
          continue;
        }
        if (!c.isSystem && key !== "admin" && key !== "system" && (!c.last || !String(c.last).trim())) {
          continue;
        }
        const mem = memberMap.get(key);
        const enriched: MyConversation = {
          ...c,
          peerCode: cPeer,
          name:
            c.name && c.name.trim().toLowerCase() !== key
              ? c.name
              : mem?.personName || mem?.contact || mem?.name || c.name || key.toUpperCase(),
          avatarUrl: c.avatarUrl || mem?.avatar || null,
          isOnline: Boolean(c.isOnline),
          userId: c.userId || null,
        };
        map.set(key, enriched);
      }
    }
    // Next, merge any local recent conversations, preserving avatars and names
    if (Array.isArray(localRecents)) {
      for (const rec of localRecents) {
        if (!rec) continue;
        const recPeer = String(rec.peerCode || "");
        if (!recPeer) continue;
        const key = recPeer.toLowerCase();
        if (deletedConvs.has(key)) {
          continue;
        }
        if (!rec.isSystem && key !== "admin" && key !== "system" && (!rec.last || !String(rec.last).trim())) {
          continue;
        }
        const mem = memberMap.get(key);
        if (!map.has(key)) {
          map.set(key, {
            ...rec,
            peerCode: recPeer,
            name:
              rec.name && rec.name.trim().toLowerCase() !== key
                ? rec.name
                : mem?.personName || mem?.contact || mem?.name || rec.name || key.toUpperCase(),
            avatarUrl: rec.avatarUrl || mem?.avatar || null,
          });
        } else {
          const serv = map.get(key)!;
          const getTs = (obj: any) => {
            if (obj?.rawTime) {
              const t = new Date(obj.rawTime).getTime();
              if (!isNaN(t)) return t;
            }
            if (obj?.time) {
              const t = new Date(obj.time).getTime();
              if (!isNaN(t)) return t;
            }
            return 0;
          };
          const servTime = getTs(serv);
          const recTime = getTs(rec);
          const recIsNewer = recTime >= servTime || (rec.last && String(rec.last).includes("thu hồi"));
          map.set(key, {
            ...serv,
            peerCode: recPeer,
            name:
              serv.name && serv.name.trim().toLowerCase() !== key
                ? serv.name
                : rec.name && rec.name.trim().toLowerCase() !== key
                  ? rec.name
                  : mem?.personName || mem?.contact || mem?.name || serv.name,
            avatarUrl: serv.avatarUrl || rec.avatarUrl || mem?.avatar || null,
            last: recIsNewer ? rec.last : serv.last || rec.last,
            time: recIsNewer ? rec.time : serv.time || rec.time,
            rawTime: recIsNewer ? (rec.rawTime || rec.time) : (serv.rawTime || serv.time),
          });
        }
      }
    }

    // Next, merge any local group conversations
    if (Array.isArray(localGroups)) {
      for (const grp of localGroups) {
        if (!grp) continue;
        const grpPeer = String(grp.peerCode || "");
        if (!grpPeer) continue;
        const key = grpPeer.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { ...grp, peerCode: grpPeer });
        } else {
          const existing = map.get(key)!;
          map.set(key, {
            ...existing,
            peerCode: grpPeer,
            isGroup: true,
            groupAvatar: grp.groupAvatar || existing.groupAvatar,
            memberCount: grp.memberCount || existing.memberCount,
            members: grp.members || existing.members,
          });
        }
      }
    }

    // Merge connected members from QR scan (vba_connected_members)
    try {
      const rawConn = localStorage.getItem("vba_connected_members");
      const connList: string[] = rawConn ? JSON.parse(rawConn) : [];
      if (Array.isArray(connList)) {
        for (const rawCode of connList) {
          if (!rawCode) continue;
          const key = String(rawCode).toLowerCase();
          if (deletedConvs.has(key)) continue;
          const mem = memberMap.get(key) || (members || []).find((m) => (m?.code && String(m.code).toLowerCase() === key) || (m?.userId && String(m.userId).toLowerCase() === key));
          const finalKey = mem?.code ? String(mem.code).toLowerCase() : key;
          if (deletedConvs.has(finalKey)) continue;

          if (!map.has(finalKey)) {
            map.set(finalKey, {
              peerCode: mem?.code || rawCode,
              name: mem?.personName || mem?.contact || mem?.name || "Hội viên kết nối QR",
              last: "Đã kết nối qua mã QR. Bắt đầu trò chuyện!",
              time: "Vừa xong",
              rawTime: new Date().toISOString(),
              unread: 0,
              avatarUrl: mem?.avatar || null,
              isSystem: false,
              isOnline: true,
              userId: mem?.userId || null,
              isConnected: true,
            });
          } else {
            const existing = map.get(finalKey)!;
            existing.isConnected = true;
          }
        }
      }
    } catch {}

    // CÁC KÊNH THÔNG TIN CHÍNH THỨC HIỆP HỘI (Req 7: Kênh truyền thông, xúc tiến, thư ký, deal B2B, sự kiện)
    const officialChannels: MyConversation[] = [
      {
        peerCode: "channel_media",
        name: "📢 Kênh Truyền Thông Hiệp Hội",
        last: "Bản tin hoạt động CLB ViOne Connect, thông cáo báo chí & sự kiện mới",
        time: "Hôm nay",
        rawTime: new Date().toISOString(),
        unread: 0,
        isSystem: true,
        avatarUrl: null,
      },
      {
        peerCode: "channel_promotion",
        name: "🤝 Kênh Xúc Tiến Giao Thương",
        last: "Cơ hội giao thương B2B, liên kết chuỗi cung ứng doanh nghiệp",
        time: "Hôm nay",
        rawTime: new Date().toISOString(),
        unread: 0,
        isSystem: true,
        avatarUrl: null,
      },
      {
        peerCode: "channel_secretariat",
        name: "🏛️ Kênh Ban Thư Ký & Ban Điều Hành",
        last: "Văn bản chỉ đạo, nghị quyết, thông báo hội phí & điều lệ CLB",
        time: "Hôm qua",
        rawTime: new Date(Date.now() - 86400000).toISOString(),
        unread: 0,
        isSystem: true,
        avatarUrl: null,
      },
      {
        peerCode: "channel_deals",
        name: "🎯 Kênh Cơ Hội & Deal B2B",
        last: "Đơn hàng B2B độc quyền, chào mua cung ứng vật tư & dịch vụ",
        time: "Hôm qua",
        rawTime: new Date(Date.now() - 86400000).toISOString(),
        unread: 0,
        isSystem: true,
        avatarUrl: null,
      },
      {
        peerCode: "channel_events",
        name: "🌟 Kênh Sự Kiện & Hội Nghị",
        last: "Lễ hội giao thương, Gala thường niên & các giải đấu thể thao CLB",
        time: "2 ngày trước",
        rawTime: new Date(Date.now() - 172800000).toISOString(),
        unread: 0,
        isSystem: true,
        avatarUrl: null,
      },
    ];

    for (const chan of officialChannels) {
      const chanPeer = String(chan.peerCode || "");
      const key = chanPeer.toLowerCase();
      try {
        const chanHistory = localStorage.getItem(`vba.chat.${chan.peerCode}`);
        if (chanHistory) {
          const parsed = JSON.parse(chanHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const lastMsg = parsed[parsed.length - 1];
            chan.last = lastMsg.text || lastMsg.body || chan.last;
            chan.time = lastMsg.time || chan.time;
            chan.rawTime = lastMsg.createdAt || chan.rawTime;
          }
        }
      } catch {}
      if (!map.has(key)) {
        map.set(key, chan);
      } else {
        const existing = map.get(key)!;
        map.set(key, {
          ...chan,
          last: existing.last || chan.last,
          time: existing.time || chan.time,
          rawTime: existing.rawTime || chan.rawTime,
        });
      }
    }

    // Kiểm tra nếu có tin nhắn bị thu hồi gần đây trong local storage
    for (const [k, c] of map.entries()) {
      try {
        const retracted = localStorage.getItem(`vba.chat.retracted.${k}`);
        if (retracted) {
          const arr = JSON.parse(retracted);
          if (Array.isArray(arr) && arr.length > 0) {
            const rec = Array.isArray(localRecents) ? localRecents.find((r) => r?.peerCode && String(r.peerCode).toLowerCase() === k) : undefined;
            if (rec?.last && String(rec.last).includes("thu hồi")) {
              c.last = rec.last;
              c.time = rec.time || c.time;
            }
          }
        }
      } catch {}
    }

    const list = Array.from(map.values()).filter((c) => {
      if (!c) return false;
      const pCode = String(c.peerCode || "");
      if (!pCode) return false;
      // 1. Loại bỏ chính tài khoản của mình khỏi danh sách tin nhắn
      if (isSelfUser(c, user, myMember)) return false;
      if (c.isSystem || pCode === "admin" || pCode === "system" || c.isGroup || pCode.startsWith("group_")) return true;
      if (c.isConnected) return true;
      return Boolean(c.last && String(c.last).trim().length > 0);
    });

    list.sort((a, b) => {
      // Cuộc trò chuyện được ghim luôn nằm trên cùng (bảo vệ an toàn không crash nếu pinnedConvs là null/undefined)
      const safePinned = (pinnedConvs && typeof pinnedConvs === "object") ? pinnedConvs : {};
      const isPinnedA = Boolean(a?.peerCode && safePinned[a.peerCode]);
      const isPinnedB = Boolean(b?.peerCode && safePinned[b.peerCode]);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;

      const getTimestamp = (conv: MyConversation) => {
        if (conv?.rawTime) {
          const t = new Date(conv.rawTime).getTime();
          if (!isNaN(t)) return t;
        }
        if (conv?.time) {
          const t = new Date(conv.time).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      // Cuộc trò chuyện có tin nhắn / tương tác mới nhất luôn lên đầu (chuẩn Messenger)
      if (timeA !== timeB) return timeB - timeA;
      if (a?.isSystem && !b?.isSystem) return -1;
      if (!a?.isSystem && b?.isSystem) return 1;
      return 0;
    });
    return list;
  }, [conversations, directConversations, localRecents, localGroups, members, user, myMember, pinnedConvs]);

  const filteredMembers = (members || []).filter((m) => {
    if (!m) return false;
    // Không hiển thị chính mình trong danh sách chọn người nhắn mới
    if (isSelfUser(m, user, myMember)) return false;
    const q = pickerQ.trim().toLowerCase();
    if (!q) return true;
    return Boolean(
      (m.name && String(m.name).toLowerCase().includes(q)) ||
      (m.code && String(m.code).toLowerCase().includes(q)) ||
      (m.industry && String(m.industry).toLowerCase().includes(q)) ||
      (m.personName && String(m.personName).toLowerCase().includes(q))
    );
  });

  const isGroupConv = (c: MyConversation) => Boolean(c?.isGroup || (c?.peerCode && String(c.peerCode).startsWith("group_")));
  const isChannelConv = (c: MyConversation) => Boolean(c?.peerCode && String(c.peerCode).startsWith("channel_"));

  const channelsCount = allConversations.filter(isChannelConv).length;
  const groupsCount = allConversations.filter(isGroupConv).length;
  const pendingCount = allConversations.filter(
    (c) => !isGroupConv(c) && !isChannelConv(c) && !c?.isSystem && c?.peerCode !== "admin" && c?.peerCode !== "system" && !c?.isConnected
  ).length;
  const friendsCount = allConversations.filter(
    (c) => !isGroupConv(c) && !isChannelConv(c) && c?.isConnected && !c?.isSystem && c?.peerCode !== "admin" && c?.peerCode !== "system"
  ).length;
  const systemCount = allConversations.filter(
    (c) => (c?.isSystem || c?.peerCode === "admin" || c?.peerCode === "system") && !isChannelConv(c)
  ).length;
  const unreadCount = allConversations.filter((c) => (c?.unread || 0) > 0).length;
  const allCount = allConversations.filter(
    (c) => isGroupConv(c) || isChannelConv(c) || c?.isSystem || c?.peerCode === "admin" || c?.peerCode === "system" || Boolean(c?.last && String(c.last).trim())
  ).length;

  const baseConvs = useMemo(() => {
    let list = allConversations;
    if (activeTab === "channels") {
      // Kênh Hiệp Hội chính thức (Req 7)
      list = allConversations.filter(isChannelConv);
    } else if (activeTab === "groups") {
      // Nhóm trò chuyện (Messenger Style)
      list = allConversations.filter(isGroupConv);
    } else if (activeTab === "pending") {
      // Tin nhắn chờ: Chỉ những người CHƯA KẾT NỐI
      list = allConversations.filter(
        (c) => !isGroupConv(c) && !c?.isSystem && c?.peerCode !== "admin" && c?.peerCode !== "system" && !c?.isConnected
      );
    } else if (activeTab === "system") {
      // Hệ thống
      list = allConversations.filter(
        (c) => c?.isSystem || c?.peerCode === "admin" || c?.peerCode === "system"
      );
    } else if (activeTab === "friends") {
      // Bạn bè (đã kết nối)
      list = allConversations.filter(
        (c) => !isGroupConv(c) && c?.isConnected && !c?.isSystem && c?.peerCode !== "admin" && c?.peerCode !== "system"
      );
    } else if (activeTab === "unread") {
      // Chưa đọc
      list = allConversations.filter((c) => (c?.unread || 0) > 0);
    } else {
      // "all" (Tất cả): Có tất cả tin nhắn đã rep lại hoặc tin nhắn hệ thống hoặc nhóm hoặc người đã kết nối hoặc Kênh Hiệp Hội
      list = allConversations.filter(
        (c) => isGroupConv(c) || isChannelConv(c) || c?.isSystem || c?.peerCode === "admin" || c?.peerCode === "system" || c?.isConnected || Boolean(c?.last && String(c.last).trim())
      );
    }

    // Lọc theo người đang trực tuyến (Online)
    if (filterOnlineOnly) {
      list = list.filter((c) => checkOnline(c));
    }

    // Lọc theo ký tự A-Z
    if (selectedLetter) {
      const letterUpper = selectedLetter.toUpperCase();
      list = list.filter((c) => getNormalizedFirstChar(c?.name || "") === letterUpper);
    }

    // Sắp xếp danh sách
    const sorted = [...list];
    sorted.sort((a, b) => {
      const getTimestamp = (conv: MyConversation) => {
        if (conv?.rawTime) {
          const t = new Date(conv.rawTime).getTime();
          if (!isNaN(t)) return t;
        }
        if (conv?.time) {
          const t = new Date(conv.time).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };

      if (sortMode === "oldest") {
        return getTimestamp(a) - getTimestamp(b);
      }
      if (sortMode === "alpha_asc") {
        return String(a?.name || "").localeCompare(String(b?.name || ""), "vi", { sensitivity: "base" });
      }
      if (sortMode === "alpha_desc") {
        return String(b?.name || "").localeCompare(String(a?.name || ""), "vi", { sensitivity: "base" });
      }
      if (sortMode === "unread_first") {
        const diff = (b?.unread || 0) - (a?.unread || 0);
        if (diff !== 0) return diff;
        return getTimestamp(b) - getTimestamp(a);
      }
      // "newest" (Mặc định)
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      if (timeA !== timeB) return timeB - timeA;
      if (a?.isSystem && !b?.isSystem) return -1;
      if (!a?.isSystem && b?.isSystem) return 1;
      return 0;
    });

    return sorted;
  }, [allConversations, activeTab, filterOnlineOnly, selectedLetter, sortMode, onlineUserMap]);

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return baseConvs;
    return baseConvs.filter(
      (c) =>
        (c?.name && String(c.name).toLowerCase().includes(q)) ||
        (c?.peerCode && String(c.peerCode).toLowerCase().includes(q)) ||
        (c?.last && String(c.last).toLowerCase().includes(q)),
    );
  }, [baseConvs, searchTerm]);

  return (
    <div className="vba-animate min-h-full bg-slate-50 dark:bg-[#070D1A] text-slate-900 dark:text-white pb-20">
      <MemberHeader title="Tin nhắn" back />

      {/* Clean Full-width Search Bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 rounded-2xl border-0 bg-slate-100 dark:bg-white/[0.06] px-4 py-2.5 text-[13px] shadow-none">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm người kết nối hoặc nội dung tin nhắn..."
            className="flex-1 bg-transparent text-[13px] border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-none"
            style={{ outline: "none", border: "none", boxShadow: "none" }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messenger-style Online / Active Members Row */}
      <div className="pt-2 pb-1.5 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-3.5 px-4 overflow-x-auto no-scrollbar py-1">
          {/* Compose New Message */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-14 shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-amber-500/60 dark:border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-[#003B95] dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition shadow-xs">
                <Plus className="h-6 w-6" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[56px] text-center">
              Nhắn mới
            </span>
          </button>

          {/* Create New Group Chat Button (Messenger Style) */}
          <button
            type="button"
            onClick={() => setCreateGroupOpen(true)}
            className="w-14 shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-blue-500/60 dark:border-blue-400/50 bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-[#003B95] dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition shadow-xs">
                <Users className="h-6 w-6" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-[#003B95] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                +
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[56px] text-center">
              Tạo nhóm
            </span>
          </button>

          {/* Active / Messaged Members Row with Green Dot ONLY when online */}
          {allConversations
            .filter((c) => !c.isSystem && c.peerCode !== "admin" && c.peerCode !== "system" && !isSelfUser(c, user, myMember) && Boolean(c.last && c.last.trim()))
            .map((c) => {
              const shortName = getShortName(c.name);
              const avatarUrl = c.avatarUrl ? resolveMediaUrl(c.avatarUrl) || c.avatarUrl : null;
              const isOnline = checkOnline(c);
              return (
                <button
                  key={c.peerCode}
                  type="button"
                  onClick={() => onOpen(c)}
                  className="w-14 shrink-0 flex flex-col items-center gap-1 cursor-pointer group"
                  title={`${c.name} (${c.peerCode}) - ${isOnline ? "Đang hoạt động" : "Không trực tuyến"}`}
                >
                  <div className="relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={c.name}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-amber-500/80 p-0.5 group-hover:scale-105 transition-transform duration-150 shadow-xs"
                      />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-amber-300 font-bold text-xs ring-2 ring-amber-500/80 group-hover:scale-105 transition-transform duration-150 shadow-xs">
                        {initialsOf(c.name)}
                      </span>
                    )}
                    {/* Green online dot indicator ONLY when actually online */}
                    {isOnline && (
                      <span
                        className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070D1A]"
                        title="Đang hoạt động"
                      />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[58px] text-center group-hover:text-amber-500 transition-colors">
                    {shortName}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Category Tabs: Tất cả, Nhóm, Bạn bè, Chưa đọc, Hệ thống, Tin nhắn chờ */}
      <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-white/5">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-[#003B95] text-white font-bold shadow-xs"
              : "border-0 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          <span>Tất cả</span>
          <span className="text-[11px] opacity-80">({allCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("channels")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "channels"
              ? "bg-[#003B95] text-white font-bold shadow-xs"
              : "border-0 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          <Megaphone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>Kênh Hiệp Hội</span>
          {channelsCount > 0 && <span className="text-[11px] opacity-80">({channelsCount})</span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("groups")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "groups"
              ? "bg-[#003B95] text-white font-bold shadow-xs"
              : "border-0 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>Nhóm</span>
          {groupsCount > 0 && <span className="text-[11px] opacity-80">({groupsCount})</span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "unread"
              ? "bg-[#003B95] text-white font-bold shadow-xs"
              : "border-0 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          <span>Chưa đọc</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#EA580C] px-1.5 py-0.2 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "friends"
              ? "bg-[#003B95] text-white font-bold shadow-xs"
              : "border-0 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>Bạn bè</span>
          <span className="text-[11px] opacity-80">({friendsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "system"
              ? "bg-[#003B95] text-white font-bold shadow-xs"
              : "border-0 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Hệ thống</span>
          <span className="text-[11px] opacity-80">({systemCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "pending"
              ? "bg-[#003B95] text-white font-bold shadow-xs"
              : "border-0 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>Tin nhắn chờ</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-[#EA580C] px-1.5 py-0.2 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite" data-testid="messages-announcement">
        {loading
          ? t("m.messages.announce.loading")
          : t("m.messages.announce.count", { count: conversations.length })}
      </p>

      {/* Member Picker Modal - Centered on Mobile via Portal */}
      {pickerOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-[390px] sm:max-w-md mx-auto rounded-3xl bg-white dark:bg-[#131a27] border border-slate-200 dark:border-white/10 p-4 max-h-[85vh] flex flex-col shadow-2xl animate-fade-in text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#003B95] dark:text-amber-400" />
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Tin nhắn mới
                </h3>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="pt-3 pb-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-2 text-[13px]">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={pickerQ}
                  onChange={(e) => setPickerQ(e.target.value)}
                  placeholder="Tìm thành viên trong hiệp hội..."
                  className="flex-1 bg-transparent text-[13px] border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 borderless-search-input"
                  style={{ outline: "none", border: "none", boxShadow: "none" }}
                  autoFocus
                />
              </div>

              {/* Option Tạo đoạn chat nhóm (Messenger Style) */}
              <button
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  setCreateGroupOpen(true);
                }}
                className="mt-2.5 flex w-full items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/40 text-left hover:brightness-105 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-white flex items-center justify-center shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Tạo đoạn chat nhóm</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#003B95]/15 text-[#003B95] dark:text-amber-400">
                        Messenger
                      </span>
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      Kết nối và thảo luận nhiều hội viên cùng lúc
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#003B95] dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 pr-1">
              {filteredMembers.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-slate-400">
                  Không tìm thấy thành viên phù hợp
                </p>
              ) : (
                filteredMembers.map((m) => (
                  <button
                    key={m.code}
                    onClick={() => {
                      setPickerOpen(false);
                      onOpen({
                        peerCode: m.code,
                        name: m.name,
                        last: "",
                        time: "Vừa xong",
                        unread: 0,
                      });
                    }}
                    className="flex w-full items-center gap-3 py-2.5 px-2 text-left hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500/10 text-[#003B95] dark:text-amber-300 font-bold text-[12px] ring-1 ring-amber-500/30">
                      {initialsOf(m.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-bold text-slate-900 dark:text-white">
                          {m.name}
                        </span>
                        <span className="rounded bg-[#003B95]/15 px-1.5 py-0.2 text-[9px] font-bold text-[#003B95] dark:text-amber-400 shrink-0">
                          {m.code}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {[m.industry, m.region].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Filter & Sort Modal - Centered on Mobile */}
      {filterModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-[390px] sm:max-w-md mx-auto rounded-3xl bg-white dark:bg-[#131a27] border border-slate-200 dark:border-white/10 p-5 shadow-2xl text-slate-900 dark:text-white space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#003B95] dark:text-amber-400" />
                <h3 className="text-[16px] font-bold">Bộ lọc & Sắp xếp tin nhắn</h3>
              </div>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sắp xếp */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sắp xếp danh sách
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSortMode("newest")}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    sortMode === "newest"
                      ? "bg-[#003B95]/10 border-[#003B95] text-[#003B95] dark:text-amber-400 dark:border-amber-400/50"
                      : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Mới nhất
                  </span>
                  {sortMode === "newest" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("oldest")}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    sortMode === "oldest"
                      ? "bg-[#003B95]/10 border-[#003B95] text-[#003B95] dark:text-amber-400 dark:border-amber-400/50"
                      : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> Cũ nhất
                  </span>
                  {sortMode === "oldest" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("alpha_asc")}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    sortMode === "alpha_asc"
                      ? "bg-[#003B95]/10 border-[#003B95] text-[#003B95] dark:text-amber-400 dark:border-amber-400/50"
                      : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowDownAZ className="h-3.5 w-3.5" /> Tên A → Z
                  </span>
                  {sortMode === "alpha_asc" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("alpha_desc")}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    sortMode === "alpha_desc"
                      ? "bg-[#003B95]/10 border-[#003B95] text-[#003B95] dark:text-amber-400 dark:border-amber-400/50"
                      : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ArrowUpAZ className="h-3.5 w-3.5" /> Tên Z → A
                  </span>
                  {sortMode === "alpha_desc" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("unread_first")}
                  className={`col-span-2 flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                    sortMode === "unread_first"
                      ? "bg-[#003B95]/10 border-[#003B95] text-[#003B95] dark:text-amber-400 dark:border-amber-400/50"
                      : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" /> Ưu tiên tin chưa đọc lên đầu
                  </span>
                  {sortMode === "unread_first" && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Lọc theo chữ cái A-Z */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lọc theo chữ cái bắt đầu
                </label>
                {selectedLetter && (
                  <button
                    type="button"
                    onClick={() => setSelectedLetter(null)}
                    className="text-xs text-[#003B95] dark:text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Bỏ chọn ({selectedLetter})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto p-1 border border-slate-100 dark:border-white/10 rounded-xl">
                {ALPHABET_LETTERS.map((char) => {
                  const isSelected = selectedLetter === char;
                  return (
                    <button
                      key={char}
                      type="button"
                      onClick={() => setSelectedLetter(isSelected ? null : char)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trạng thái hoạt động */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Trạng thái người nhận
              </label>
              <button
                type="button"
                onClick={() => setFilterOnlineOnly((prev) => !prev)}
                className={`flex w-full items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  filterOnlineOnly
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Chỉ hiển thị người đang trực tuyến (Online)</span>
                </div>
                {filterOnlineOnly && <Check className="h-4 w-4 text-emerald-500" />}
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSortMode("newest");
                  setSelectedLetter(null);
                  setFilterOnlineOnly(false);
                  setFilterModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Đặt lại mặc định
              </button>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#003B95] text-white text-xs font-bold shadow-md hover:bg-[#002b6e] cursor-pointer"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Conversation Thread List */}
      <div
        className="space-y-1.5 pb-20 mt-2 px-4"
        role="list"
        aria-live="polite"
        aria-busy={loading}
        aria-label={t("m.messages.title")}
      >
        {loading && (
          <div className="py-12 text-center text-[13px] text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#003B95] dark:text-amber-400" />
            <span>Đang tải danh sách tin nhắn...</span>
          </div>
        )}
        {error && <p className="py-8 text-center text-[13px] text-rose-500">{error}</p>}
        {!loading && !error && filteredConversations.length === 0 && (
          activeTab === "groups" ? (
            <div className="py-16 text-center space-y-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6 mx-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Users className="h-7 w-7" />
              </div>
              <p className="text-[14px] font-bold text-slate-900 dark:text-white">
                Chưa có nhóm trò chuyện nào
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Tạo nhóm để kết nối nhiều hội viên, bàn bạc công việc, dự án hoặc giao lưu cùng lúc.
              </p>
              <button
                type="button"
                onClick={() => setCreateGroupOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] px-4 py-2 text-[12px] font-bold text-white shadow-md shadow-[#003B95]/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4 text-white" />
                Tạo nhóm chat ngay
              </button>
            </div>
          ) : activeTab === "pending" ? (
            <div className="py-24 text-center">
              <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                Bạn không có tin nhắn chờ
              </p>
            </div>
          ) : activeTab === "unread" ? (
            <div className="py-24 text-center">
              <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                Bạn không có tin nhắn nào chưa đọc
              </p>
            </div>
          ) : activeTab === "friends" ? (
            <div className="py-24 text-center space-y-2">
              <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                Chưa có cuộc trò chuyện nào từ bạn bè
              </p>
              <p className="text-[12px] text-slate-400">
                Kết nối thêm hội viên trong mục Danh bạ để bắt đầu trao đổi
              </p>
            </div>
          ) : activeTab === "system" ? (
            <div className="py-24 text-center">
              <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                Không có tin nhắn từ hệ thống
              </p>
            </div>
          ) : selectedLetter ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                Không có cuộc trò chuyện nào bắt đầu bằng chữ "{selectedLetter}"
              </p>
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className="text-xs text-[#003B95] dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Bỏ lọc chữ cái
              </button>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6">
              <MessageSquare className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
                {searchTerm
                  ? "Không tìm thấy cuộc trò chuyện phù hợp"
                  : "Chưa có cuộc trò chuyện nào"}
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {searchTerm
                  ? "Thử tìm kiếm với từ khóa khác hoặc xóa ô tìm kiếm."
                  : "Bấm nút 'Nhắn mới' để kết nối và trao đổi với các hội viên!"}
              </p>
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/20 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  Xóa tìm kiếm
                </button>
              ) : null}
            </div>
          )
        )}

        {filteredConversations.map((c: any) => {
          const peerCode = String(c?.peerCode || "");
          const peerCodeLower = peerCode.toLowerCase();
          const isGroup = c?.isGroup || peerCode.startsWith("group_");
          const isSystem = !isGroup && (c?.isSystem || peerCode === "admin" || peerCode === "system");
          const matchedMember = (members || []).find((m) => m?.code && String(m.code).toLowerCase() === peerCodeLower);
          const resolvedAvatar = c?.avatarUrl || matchedMember?.avatar || null;
          const resolvedName =
            c?.name && String(c.name).trim().toLowerCase() !== peerCodeLower
              ? c.name
              : matchedMember?.personName || matchedMember?.contact || matchedMember?.name || c?.name || peerCode;
          const isSwiped = swipedConvCode === peerCode;
          const isPinned = Boolean(pinnedConvs[peerCode]);
          const isMuted = Boolean(mutedConvs[peerCode]);

          return (
            <div key={c.peerCode} role="listitem" className="relative overflow-hidden rounded-2xl mb-2.5">
              {/* Background Swipe Action (Nút Xóa đỏ lộ ra khi vuốt sang trái) */}
              <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-3 bg-gradient-to-l from-rose-600 to-rose-500 rounded-r-2xl z-0">
                <button
                  type="button"
                  onClick={(e) => handleDeleteConversation(c.peerCode, e)}
                  className="flex flex-col items-center justify-center gap-1 text-white font-bold text-[11px] h-full w-full active:scale-90 transition-transform cursor-pointer"
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 className="h-5 w-5 text-white" />
                  <span>Xóa</span>
                </button>
              </div>

              {/* Foreground Swipable Card with Long-press & Swipe */}
              <div
                onTouchStart={(e) => handleRowTouchStart(e, c)}
                onTouchMove={(e) => handleRowTouchMove(e, c)}
                onTouchEnd={handleRowTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedConvForAction(c);
                }}
                style={{
                  transform: isSwiped ? "translateX(-84px)" : "translateX(0px)",
                  transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="relative z-10 bg-white dark:bg-[#131a27] rounded-2xl"
              >
                <button
                  onClick={() => {
                    if (isSwiped) {
                      setSwipedConvCode(null);
                      return;
                    }
                    onOpen(c);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                    isSystem
                      ? "border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-400/10 dark:border-amber-400/30 shadow-sm"
                      : isGroup
                        ? "border-indigo-200/80 dark:border-indigo-900/40 bg-white dark:bg-[#131a27] hover:border-indigo-400/40 shadow-xs"
                        : isPinned
                          ? "border-amber-400/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs"
                          : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#131a27] hover:border-amber-400/30 shadow-xs"
                  }`}
                >
                  <div
                    className="relative shrink-0 cursor-pointer group/avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAvatarClick(c);
                    }}
                    title={isGroup ? "Nhóm chat" : "Xem thông tin hội viên & Nhắn tin"}
                  >
                    {c.peerCode === "channel_media" ? (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xs">
                        <Megaphone className="h-6 w-6" />
                      </div>
                    ) : c.peerCode === "channel_promotion" ? (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs">
                        <Handshake className="h-6 w-6" />
                      </div>
                    ) : c.peerCode === "channel_secretariat" ? (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#003B95] to-blue-600 text-white shadow-xs">
                        <Building2 className="h-6 w-6" />
                      </div>
                    ) : c.peerCode === "channel_deals" ? (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-xs">
                        <Sparkles className="h-6 w-6" />
                      </div>
                    ) : c.peerCode === "channel_events" ? (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-xs">
                        <Calendar className="h-6 w-6" />
                      </div>
                    ) : isGroup ? (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#003B95] via-[#1E40AF] to-indigo-600 text-white text-xl ring-2 ring-indigo-500/50 shadow-xs group-hover/avatar:scale-105 transition-transform">
                        {c.groupAvatar || "👥"}
                      </div>
                    ) : isSystem ? (
                      <img
                        src="/landing_web_vione/vione-logo.png"
                        alt="ViOne Connect"
                        className="h-12 w-12 rounded-full object-contain p-1 bg-white ring-2 ring-amber-500/40 shadow-xs"
                      />
                    ) : resolvedAvatar ? (
                      <img
                        src={resolveMediaUrl(resolvedAvatar) || resolvedAvatar}
                        alt={resolvedName}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-500/70 shadow-xs group-hover/avatar:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-[14px] font-bold text-amber-300 ring-2 ring-amber-500/70 shadow-xs group-hover/avatar:scale-105 transition-transform">
                        {initialsOf(resolvedName)}
                      </span>
                    )}
                    {c.peerCode?.startsWith("channel_") ? (
                      <span
                        className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs"
                        title="Kênh thông báo"
                      >
                        <Megaphone className="h-2.5 w-2.5" />
                      </span>
                    ) : isGroup ? (
                      <span
                        className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs"
                        title="Nhóm chat"
                      >
                        <Users className="h-2.5 w-2.5" />
                      </span>
                    ) : isSystem ? (
                      <span
                        className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[#071322] shadow-xs font-bold"
                        title="Kênh chính thức"
                      >
                        <ShieldCheck className="h-3 w-3" />
                      </span>
                    ) : checkOnline(c) ? (
                      <span
                        className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#131a27]"
                        title="Đang hoạt động"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isPinned && <Pin className="h-3 w-3 text-amber-500 shrink-0 rotate-45" />}
                        <span className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
                          {resolvedName}
                        </span>
                        {isMuted && <BellOff className="h-3 w-3 text-slate-400 shrink-0" />}
                        {c.peerCode?.startsWith("channel_") ? (
                          <span className="shrink-0 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700/60 px-1.5 py-0.2 text-[9px] font-extrabold text-[#003B95] dark:text-blue-300 uppercase tracking-wide flex items-center gap-0.5">
                            Kênh chính thức
                          </span>
                        ) : isGroup ? (
                          <span className="shrink-0 rounded-md bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700/50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-0.5">
                            <Users className="h-2.5 w-2.5" />
                            {c.memberCount || (c.members?.length ? c.members.length + 1 : 2)} TV
                          </span>
                        ) : isSystem ? (
                          <span className="shrink-0 rounded-md bg-[var(--vba-gold-soft)] border border-[var(--vba-border-accent)] px-1.5 py-0.2 text-[9px] font-extrabold text-[var(--vba-gold)] uppercase tracking-wide">
                            Hệ thống
                          </span>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {fmt.rel(c.time)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="truncate text-[12.5px] text-slate-600 dark:text-slate-300 font-normal">
                        {formatMessagePreview(c.last)}
                      </span>
                      {c.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1.5 text-[10.5px] font-bold text-white shadow-xs">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Sheet when Long-Pressing Conversation - Centered on Mobile via Portal */}
      {selectedConvForAction && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedConvForAction(null)}
        >
          <div
            className="w-full max-w-[360px] sm:max-w-sm rounded-3xl bg-white dark:bg-[#131a27] border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-11 w-11 rounded-full bg-[#003B95] text-white flex items-center justify-center font-bold text-sm">
                {initialsOf(selectedConvForAction.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {selectedConvForAction.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {selectedConvForAction.peerCode}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-1 pt-1">
              <button
                type="button"
                onClick={() => togglePinConv(selectedConvForAction.peerCode)}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <Pin className="h-4 w-4 text-amber-500" />
                <span>{pinnedConvs[selectedConvForAction.peerCode] ? "Bỏ ghim cuộc trò chuyện" : "Ghim cuộc trò chuyện lên đầu"}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMuteConv(selectedConvForAction.peerCode)}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                {mutedConvs[selectedConvForAction.peerCode] ? (
                  <>
                    <Bell className="h-4 w-4 text-blue-500" />
                    <span>Bật thông báo</span>
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 text-slate-400" />
                    <span>Tắt thông báo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteConversation(selectedConvForAction.peerCode)}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 transition cursor-pointer"
              >
                <Trash2 className="h-4 w-4 text-rose-500" />
                <span>Xóa cuộc trò chuyện này</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedConvForAction(null)}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Modal */}
      <MemberProfileModal
        member={selectedMemberModal}
        initialConnected={selectedMemberIsConnected}
        onClose={() => setSelectedMemberModal(null)}
        onMessage={(m) => {
          setSelectedMemberModal(null);
          onOpen({
            peerCode: m.code,
            name: m.personName || m.name,
            last: "",
            time: "Vừa xong",
            unread: 0,
            avatarUrl: m.avatar,
          });
        }}
      />

      {/* Create Group Chat Modal */}
      <CreateGroupChatModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        members={members}
        onGroupCreated={(groupConv) => {
          setLocalGroups((prev) => {
            const next = [groupConv, ...prev.filter((g) => g.peerCode !== groupConv.peerCode)];
            return next;
          });
          onOpen(groupConv);
        }}
      />
    </div>
  );
}

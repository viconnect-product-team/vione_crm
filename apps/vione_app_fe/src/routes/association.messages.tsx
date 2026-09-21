import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import {
  listConversations,
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
import { resolveMediaUrl } from "@/lib/api-client";
import { getConnectAppSocket } from "@/hooks/use-connect-app-socket";
import {
  ZaloTransactionCard,
  type ZaloTransactionData,
} from "@/components/business-connect/mobile/ZaloTransactionCard";
import { MemberProfileModal } from "@/components/member/MemberProfileModal";
import { CreateGroupChatModal } from "@/components/member/CreateGroupChatModal";
import { GroupMembersModal } from "@/components/member/GroupMembersModal";

export function isSelfUser(
  candidate: { peerCode?: string | null; userId?: string | null; name?: string | null; code?: string | null } | null | undefined,
  user: { id?: string | null; username?: string | null; email?: string | null; name?: string | null } | null | undefined,
  member: { code?: string | null; id?: string | null; name?: string | null; email?: string | null } | null | undefined
): boolean {
  if (!candidate || (!user && !member)) return false;
  const candidateCode = (candidate.peerCode || candidate.code || "").trim().toLowerCase();
  const candidateUserId = (candidate.userId || "").trim().toLowerCase();
  const candidateName = (candidate.name || "").trim().toLowerCase();

  // If group or system, never self
  if (candidateCode.startsWith("group_") || candidateCode === "admin" || candidateCode === "system") {
    return false;
  }

  const myCode = (member?.code || "").trim().toLowerCase();
  const myMemberId = (member?.id || "").trim().toLowerCase();
  const myUserId = (user?.id || "").trim().toLowerCase();
  const myEmail = (user?.email || member?.email || "").trim().toLowerCase();
  const myUsername = (user?.username || "").trim().toLowerCase();
  const myName = (member?.name || user?.name || "").trim().toLowerCase();

  if (myCode && candidateCode && candidateCode === myCode) return true;
  if (myUserId && candidateUserId && candidateUserId === myUserId) return true;
  if (myUserId && candidateCode && candidateCode === myUserId) return true;
  if (myMemberId && candidateCode && candidateCode === myMemberId) return true;
  if (myEmail && candidateCode && candidateCode === myEmail) return true;
  if (myUsername && candidateCode && candidateCode === myUsername) return true;
  if (myName && candidateName && candidateName === myName) return true;

  // Check stored custom profile name
  try {
    const rawCustom = localStorage.getItem("vba_custom_profile");
    if (rawCustom) {
      const custom = JSON.parse(rawCustom);
      if (custom?.name && candidateName && custom.name.trim().toLowerCase() === candidateName) return true;
    }
  } catch {}

  return false;
}

const messagesSearchSchema = z.object({
  peerCode: z.string().optional(),
  peerName: z.string().optional(),
});

export const Route = createFileRoute("/association/messages")({
  validateSearch: (search: Record<string, unknown>) => messagesSearchSchema.parse(search),
  component: MessagesScreen,
});

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

function formatMessageTime(isoOrText?: string) {
  if (!isoOrText) return "";
  if (isoOrText === "Vừa xong" || isoOrText === "justNow") return "Vừa xong";
  const d = new Date(isoOrText);
  if (isNaN(d.getTime())) return isoOrText;
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(isoStr?: string) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hôm nay";
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("");
}

function cleanPersonName(fullName?: string | null): string {
  if (!fullName) return "";
  const clean = fullName.split(/\s*[-–—|]\s*/)[0].trim();
  return clean || fullName.trim();
}

function getShortName(fullName?: string | null): string {
  if (!fullName) return "";
  const person = cleanPersonName(fullName);
  const parts = person.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
  }
  return parts[0] || person;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileBadgeInfo(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) {
    return { label: "PDF", color: "bg-red-500/20 text-red-400 border-red-500/30" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { label: "DOC", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return { label: "XLS", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return { label: "PPT", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return { label: "ZIP", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
  }
  return {
    label: ext.toUpperCase().slice(0, 4) || "FILE",
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };
}

export type ActionPaymentData = ZaloTransactionData;

export type ActionMeetingData = {
  title: string;
  time: string;
  location: string;
  link?: string;
  desc?: string;
};

export type ActionTicketData = {
  eventId: string;
  eventTitle: string;
  ticketCode: string;
  luckyNumber?: string;
  time?: string;
  location?: string;
  attendee?: string;
  qrUrl: string;
  ticketType?: string;
  count?: number;
};

export type ReplyQuoteData = {
  id?: string;
  senderName: string;
  text: string;
};

type ParsedContent = {
  replyQuote?: ReplyQuoteData;
} & (
  | { type: "image"; url: string; name?: string; caption?: string }
  | { type: "file"; url: string; name: string; size?: number; caption?: string }
  | { type: "location"; lat: string; lng: string; name: string; caption?: string }
  | { type: "call"; callType: "audio" | "video"; duration: number; status: "completed" | "missed" }
  | { type: "action_payment"; data: ActionPaymentData }
  | { type: "action_meeting"; data: ActionMeetingData }
  | { type: "action_ticket"; data: ActionTicketData }
  | { type: "text"; text: string }
);

function safeDecode(val?: string): string {
  if (!val) return "";
  try {
    return decodeURIComponent(val.replace(/\+/g, " "));
  } catch {
    return val;
  }
}

function parseMessageContent(rawBody: string): ParsedContent {
  let body = rawBody;
  let replyQuote: ReplyQuoteData | undefined;

  // Phát hiện tiền tố trích dẫn trả lời [reply:id|name:Sender|text:Quoted]
  const replyMatch = body.match(/^\[reply:([^|]+)\|name:([^|]+)\|text:([^\]]+)\]([\s\S]*)$/i);
  if (replyMatch) {
    replyQuote = {
      id: replyMatch[1],
      senderName: safeDecode(replyMatch[2]),
      text: safeDecode(replyMatch[3]),
    };
    body = replyMatch[4].trim();
  }

  // Action: Call log [call:audio|duration:145|status:completed] or [call:video|duration:0|status:missed]
  const callMatch = body.match(/\[call:(audio|video)(?:\|duration:(\d+))?(?:\|status:(completed|missed))?\]/i);
  if (callMatch) {
    const callType = (callMatch[1].toLowerCase() === "video" ? "video" : "audio") as "audio" | "video";
    const duration = callMatch[2] ? parseInt(callMatch[2], 10) : 0;
    const status = (callMatch[3] || (duration > 0 ? "completed" : "missed")) as "completed" | "missed";
    return {
      replyQuote,
      type: "call",
      callType,
      duration,
      status,
    };
  }

  // Action: Payment with VietQR
  const payMatch = body.match(
    /\[action:payment\|amount:(\d+)\|invoice:([^|]+)\|qr:([^|]+)(?:\|due:([^|]+))?(?:\|desc:([^\]]*))?\]/i,
  );
  if (payMatch) {
    return {
      replyQuote,
      type: "action_payment",
      data: {
        amount: parseInt(payMatch[1], 10),
        invoiceNo: payMatch[2],
        qrUrl: payMatch[3],
        dueDate: payMatch[4],
        desc: safeDecode(payMatch[5]),
      },
    };
  }

  // Action: Meeting invitation with full safe URL decoding
  const meetMatch = body.match(
    /\[action:meeting\|title:([^|]+)\|time:([^|]+)\|location:([^|]+)(?:\|link:([^|]+))?(?:\|desc:([^\]]*))?\]/i,
  );
  if (meetMatch) {
    return {
      replyQuote,
      type: "action_meeting",
      data: {
        title: safeDecode(meetMatch[1]),
        time: safeDecode(meetMatch[2]),
        location: safeDecode(meetMatch[3]),
        link: meetMatch[4] || undefined,
        desc: safeDecode(meetMatch[5]),
      },
    };
  }

  // Action: Event Ticket with QR Code
  // [action:ticket|eventId:...|eventTitle:...|ticketCode:...|lucky:...|time:...|location:...|attendee:...|qr:...|type:...|count:...]
  const ticketMatch = body.match(
    /\[action:ticket\|eventId:([^|]+)\|eventTitle:([^|]+)\|ticketCode:([^|]+)(?:\|lucky:([^|]+))?(?:\|time:([^|]+))?(?:\|location:([^|]+))?(?:\|attendee:([^|]+))?(?:\|qr:([^|]+))?(?:\|type:([^|]+))?(?:\|count:(\d+))?\]/i,
  );
  if (ticketMatch) {
    return {
      replyQuote,
      type: "action_ticket",
      data: {
        eventId: ticketMatch[1],
        eventTitle: safeDecode(ticketMatch[2]),
        ticketCode: ticketMatch[3],
        luckyNumber: ticketMatch[4] || undefined,
        time: safeDecode(ticketMatch[5]),
        location: safeDecode(ticketMatch[6]),
        attendee: safeDecode(ticketMatch[7]),
        qrUrl: safeDecode(ticketMatch[8]),
        ticketType: safeDecode(ticketMatch[9]) || "Vé sự kiện",
        count: ticketMatch[10] ? parseInt(ticketMatch[10], 10) : 1,
      },
    };
  }

  const imageRegex = /\[image:(https?:\/\/[^|\]]+)(?:\|([^\]]*))?\]/i;
  const imageMatch = body.match(imageRegex);
  if (imageMatch) {
    const url = imageMatch[1];
    const name = imageMatch[2] || "";
    const caption = body.replace(imageRegex, "").trim();
    return { replyQuote, type: "image", url, name, caption: caption || undefined };
  }

  const fileRegex = /\[file:(https?:\/\/[^|\]]+)(?:\|([^|\]]*))?(?:\|(\d+))?\]/i;
  const fileMatch = body.match(fileRegex);
  if (fileMatch) {
    const url = fileMatch[1];
    const name = fileMatch[2] || "Tài liệu đính kèm";
    const size = fileMatch[3] ? parseInt(fileMatch[3], 10) : undefined;
    const caption = body.replace(fileRegex, "").trim();
    return { replyQuote, type: "file", url, name, size, caption: caption || undefined };
  }

  const locationRegex = /\[location:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:\|name:([^\]]*))?\]/i;
  const locationMatch = body.match(locationRegex);
  if (locationMatch) {
    const lat = locationMatch[1];
    const lng = locationMatch[2];
    const name = locationMatch[3] || "Vị trí đã chia sẻ";
    const caption = body.replace(locationRegex, "").trim();
    return { replyQuote, type: "location", lat, lng, name, caption: caption || undefined };
  }

  const isRawImageUrl = /^(https?:\/\/[^\s]+?\.(png|jpe?g|gif|webp|svg))(?:\?.*)?$/i.test(
    body.trim(),
  );
  if (isRawImageUrl) {
    return { replyQuote, type: "image", url: body.trim() };
  }

  return { replyQuote, type: "text", text: body };
}

function formatMessagePreview(raw?: string | null): string {
  if (!raw) return "";
  let text = raw.trim();
  const replyMatch = text.match(/^\[reply:([^|]+)\|name:([^|]+)\|text:([^\]]+)\]([\s\S]*)$/i);
  if (replyMatch) {
    text = replyMatch[4].trim();
  }
  if (
    text === "[retracted]" ||
    /\[retracted\]/i.test(text) ||
    text === "Tin nhắn đã được thu hồi" ||
    text.includes("đã thu hồi một tin nhắn")
  ) {
    return text.includes("Bạn") ? "Bạn đã thu hồi một tin nhắn" : "Tin nhắn đã được thu hồi";
  }
  if (/\[call:video/i.test(text)) {
    return text.includes("missed") ? "📹 Cuộc gọi video nhỡ" : "📹 Cuộc gọi video";
  }
  if (/\[call:audio/i.test(text) || /\[call:/i.test(text)) {
    return text.includes("missed") ? "📞 Cuộc gọi thoại nhỡ" : "📞 Cuộc gọi thoại";
  }
  if (/\[action:payment/i.test(text)) {
    return "💳 [Hóa đơn] Nhắc nhở thanh toán hội phí VietQR";
  }
  if (/\[action:meeting/i.test(text)) {
    return "📅 [Cuộc họp] Thư mời tham dự cuộc họp";
  }
  if (/\[action:ticket/i.test(text)) {
    return "🎟️ [Vé điện tử] Xác nhận vé sự kiện & mã QR Check-in";
  }
  if (
    /\[image:(https?:\/\/[^|\]]+)(?:\|([^\]]*))?\]/i.test(text) ||
    /^(https?:\/\/[^\s]+?\.(png|jpe?g|gif|webp|svg))(?:\?.*)?$/i.test(text)
  ) {
    return "📷 [Hình ảnh]";
  }
  const fileMatch = text.match(/\[file:(https?:\/\/[^|\]]+)(?:\|([^|\]]*))?(?:\|(\d+))?\]/i);
  if (fileMatch) {
    return `📎 [Tệp] ${fileMatch[2] || "Tài liệu"}`;
  }
  if (/\[location:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i.test(text)) {
    return "📍 [Vị trí] Đã chia sẻ vị trí hiện tại";
  }
  if (/\[voice:(https?:\/\/[^|\]]+|data:audio\/[^|\]]+)(?:\|(\d+))?\]/i.test(text)) {
    return "🎙️ [Tin nhắn thoại]";
  }
  return text;
}

function EventTicketCard({ data, isFromMe }: { data: ActionTicketData; isFromMe: boolean }) {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-[#002244] to-slate-950 text-white shadow-xl max-w-sm">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-4 py-2.5 text-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-black text-xs tracking-wider uppercase">
          <Ticket className="h-4 w-4" />
          <span>VÉ ĐIỆN TỬ VIP</span>
        </div>
        <span className="rounded-full bg-slate-950/20 px-2 py-0.5 text-[10px] font-bold">
          {data.ticketType || "Miễn phí"}
        </span>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3.5">
        <div>
          <p className="text-[10px] font-semibold text-amber-400 tracking-wider uppercase">
            CLB DOANH NHÂN CEO 1983
          </p>
          <h4 className="text-[14px] font-bold text-white leading-snug mt-0.5 line-clamp-2">
            {data.eventTitle}
          </h4>
        </div>

        {/* Info Grid */}
        <div className="space-y-2 rounded-xl bg-white/5 p-3 text-[11.5px] border border-white/10 backdrop-blur-sm">
          {data.attendee && (
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-slate-400">Người tham dự:</span>
              <span className="font-bold text-white">{data.attendee}</span>
            </div>
          )}
          {data.time && (
            <div className="flex items-center gap-2 text-slate-200">
              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{data.time}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-2 text-slate-200">
              <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="line-clamp-1">{data.location}</span>
            </div>
          )}
          {data.luckyNumber && (
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-amber-300/80 font-medium">Mã số may mắn (Lucky Draw):</span>
              <span className="font-black text-amber-400 text-sm tracking-wider">#{data.luckyNumber}</span>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        {data.qrUrl && (
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-950 shadow-inner">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <QrCode className="h-3 w-3 text-slate-700" />
              MÃ CHECK-IN TẠI SỰ KIỆN
            </div>
            <img
              src={data.qrUrl}
              alt="QR Check-in"
              className="h-36 w-36 object-contain rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowQrModal(true)}
            />
            <div className="mt-1.5 font-mono text-xs font-black tracking-widest text-slate-800">
              {data.ticketCode}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {data.qrUrl && (
            <button
              onClick={() => setShowQrModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 text-xs transition cursor-pointer shadow"
            >
              <QrCode className="h-3.5 w-3.5" />
              Phóng to mã QR
            </button>
          )}
          <a
            href="/association/events"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3 text-xs border border-white/15 transition"
          >
            Chi tiết
          </a>
        </div>
      </div>

      {/* QR Modal preview */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="relative bg-white text-slate-950 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="font-bold text-sm text-slate-900 mb-1">{data.eventTitle}</div>
            <div className="text-xs text-slate-500 mb-4">Mã vé: {data.ticketCode}</div>
            <img src={data.qrUrl} alt="QR Code" className="w-56 h-56 mx-auto object-contain rounded-xl border border-slate-200 shadow-sm" />
            <p className="mt-4 text-xs text-slate-600 font-medium">
              Vui lòng xuất trình mã này tại quầy check-in sự kiện
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MessagesScreen() {
  const search = Route.useSearch();
  const fetchMembers = useServerFn(listMembers);
  const { data: members = [] } = useServerData<DirectoryMember[]>(() => fetchMembers(), [], "vba_directory_members");

  const [active, setActive] = useState<MyConversation | null>(() => {
    if (search.peerCode) {
      return {
        peerCode: search.peerCode,
        name: search.peerName || search.peerCode.toUpperCase(),
        last: "",
        time: "Vừa xong",
        unread: 0,
      };
    }
    return null;
  });

  useEffect(() => {
    if (search.peerCode) {
      setActive({
        peerCode: search.peerCode,
        name: search.peerName || search.peerCode.toUpperCase(),
        last: "",
        time: "Vừa xong",
        unread: 0,
      });
    }
  }, [search.peerCode, search.peerName]);

  const handleOpenConversation = (c: MyConversation) => {
    c.unread = 0;
    try {
      const raw = localStorage.getItem("vba.recent_conversations");
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((item: any) =>
          item.peerCode?.toLowerCase() === c.peerCode?.toLowerCase()
            ? { ...item, unread: 0 }
            : item
        );
        localStorage.setItem("vba.recent_conversations", JSON.stringify(updated));
      }
    } catch {}
    setActive(c);
  };

  if (active) {
    return <ChatThread peer={active} onBack={() => setActive(null)} members={members} />;
  }
  return <ConversationList onOpen={handleOpenConversation} members={members} />;
}

type ConvFilter = "all" | "channels" | "groups" | "friends" | "unread" | "system" | "pending";
type ConvSortMode = "newest" | "oldest" | "alpha_asc" | "alpha_desc" | "unread_first";

const ALPHABET_LETTERS = [
  "A", "B", "C", "D", "Đ", "E", "G", "H", "I", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y"
];

function getNormalizedFirstChar(str: string): string {
  if (!str) return "#";
  const trimmed = str.trim();
  if (!trimmed) return "#";
  const first = trimmed[0].toUpperCase();
  if (first === "Đ") return "Đ";
  const normalized = first.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/[A-Z]/.test(normalized)) return normalized;
  return "#";
}

function saveRecentConversation(peer: MyConversation, lastText: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("vba.recent_conversations");
    const list: MyConversation[] = raw ? JSON.parse(raw) : [];
    const existing = list.find((c) => c.peerCode.toLowerCase() === peer.peerCode.toLowerCase());
    const nowIso = new Date().toISOString();
    const isGroup = Boolean(peer.isGroup || existing?.isGroup || peer.peerCode.startsWith("group_"));
    const item: MyConversation = {
      peerCode: peer.peerCode,
      name:
        peer.name && peer.name.trim().toLowerCase() !== peer.peerCode.toLowerCase()
          ? peer.name
          : existing?.name || peer.name,
      last: lastText,
      time: nowIso,
      rawTime: nowIso,
      unread: 0,
      avatarUrl: peer.avatarUrl || existing?.avatarUrl || null,
      isSystem: peer.isSystem,
      isGroup,
      memberCount: peer.memberCount || existing?.memberCount,
      members: peer.members || existing?.members,
      groupAvatar: peer.groupAvatar || existing?.groupAvatar,
    };
    const next = [item, ...list.filter((c) => c.peerCode.toLowerCase() !== peer.peerCode.toLowerCase())];
    localStorage.setItem("vba.recent_conversations", JSON.stringify(next.slice(0, 50)));

    if (isGroup) {
      const rawGroups = localStorage.getItem("vba.group_conversations");
      const groupList: MyConversation[] = rawGroups ? JSON.parse(rawGroups) : [];
      const nextGroups = [item, ...groupList.filter((g) => g.peerCode.toLowerCase() !== item.peerCode.toLowerCase())];
      localStorage.setItem("vba.group_conversations", JSON.stringify(nextGroups.slice(0, 50)));
    }

    try {
      const storedDeleted = JSON.parse(localStorage.getItem("vba_deleted_convs") || "[]");
      if (Array.isArray(storedDeleted) && storedDeleted.length > 0) {
        const nextDeleted = storedDeleted.filter((k: string) => String(k).toLowerCase() !== peer.peerCode.toLowerCase());
        localStorage.setItem("vba_deleted_convs", JSON.stringify(nextDeleted));
      }
    } catch {}

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
  } catch {}
}

function ConversationList({ onOpen, members: propMembers }: { onOpen: (c: MyConversation) => void; members?: DirectoryMember[] }) {
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
      return JSON.parse(localStorage.getItem("vba_pinned_convs") || "{}");
    } catch {
      return {};
    }
  });
  const [mutedConvs, setMutedConvs] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("vba_muted_convs") || "{}");
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
    const targetKey = peerCode.toLowerCase();
    try {
      const stored = JSON.parse(localStorage.getItem("vba_deleted_convs") || "[]");
      const list: string[] = Array.isArray(stored) ? stored : [];
      if (!list.includes(targetKey)) {
        list.push(targetKey);
        localStorage.setItem("vba_deleted_convs", JSON.stringify(list));
      }
    } catch {}

    setLocalRecents((prev) => {
      const next = prev.filter((c) => c.peerCode.toLowerCase() !== targetKey);
      try {
        localStorage.setItem("vba.recent_conversations", JSON.stringify(next));
      } catch {}
      return next;
    });
    setLocalGroups((prev) => {
      const next = prev.filter((c) => c.peerCode.toLowerCase() !== targetKey);
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
        personTitle: "Hội viên CEO 1983",
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
        if (c.userId) {
          if (next[c.userId] === undefined) next[c.userId] = Boolean(c.isOnline);
        }
        if (c.peerCode) {
          const codeKey = c.peerCode.toLowerCase();
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
        setOnlineUserMap((prev) => ({
          ...prev,
          [data.userId!]: true,
          [data.userId!.toLowerCase()]: true,
        }));
      }
    };
    const handleOffline = (data: { userId?: string }) => {
      if (data?.userId) {
        setOnlineUserMap((prev) => ({
          ...prev,
          [data.userId!]: false,
          [data.userId!.toLowerCase()]: false,
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
        stored.forEach((k: string) => deletedConvs.add(String(k).toLowerCase()));
      }
    } catch {}

    const memberMap = new Map<string, DirectoryMember>();
    for (const m of members) {
      if (m.code) memberMap.set(m.code.toLowerCase(), m);
    }

    const map = new Map<string, MyConversation>();
    // First, map server conversations enriched with directory member details
    for (const c of conversations) {
      if (deletedConvs.has(c.peerCode.toLowerCase())) {
        continue;
      }
      if (!c.isSystem && c.peerCode !== "admin" && c.peerCode !== "system" && (!c.last || !c.last.trim())) {
        continue;
      }
      const key = c.peerCode.toLowerCase();
      const mem = memberMap.get(key);
      const enriched: MyConversation = {
        ...c,
        name:
          c.name && c.name.trim().toLowerCase() !== key
            ? c.name
            : mem?.personName || mem?.contact || mem?.name || c.name || key.toUpperCase(),
        avatarUrl: c.avatarUrl || mem?.avatar || null,
        isOnline: c.isOnline,
        userId: c.userId || null,
      };
      map.set(key, enriched);
    }
    // Next, merge any local recent conversations, preserving avatars and names
    for (const rec of localRecents) {
      if (deletedConvs.has(rec.peerCode.toLowerCase())) {
        continue;
      }
      if (!rec.isSystem && rec.peerCode !== "admin" && rec.peerCode !== "system" && (!rec.last || !rec.last.trim())) {
        continue;
      }
      const key = rec.peerCode.toLowerCase();
      const mem = memberMap.get(key);
      if (!map.has(key)) {
        map.set(key, {
          ...rec,
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
        const recIsNewer = recTime >= servTime || (rec.last && rec.last.includes("thu hồi"));
        map.set(key, {
          ...serv,
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

    // Next, merge any local group conversations
    for (const grp of localGroups) {
      const key = grp.peerCode.toLowerCase();
      if (!map.has(key)) {
        map.set(key, grp);
      } else {
        const existing = map.get(key)!;
        map.set(key, {
          ...existing,
          isGroup: true,
          groupAvatar: grp.groupAvatar || existing.groupAvatar,
          memberCount: grp.memberCount || existing.memberCount,
          members: grp.members || existing.members,
        });
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
          const mem = memberMap.get(key) || members.find((m) => m.code?.toLowerCase() === key || m.userId?.toLowerCase() === key);
          const finalKey = mem?.code ? mem.code.toLowerCase() : key;
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
        last: "Bản tin hoạt động CLB CEO 1983, thông cáo báo chí & sự kiện mới",
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
      const key = chan.peerCode.toLowerCase();
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
            const rec = localRecents.find((r) => r.peerCode.toLowerCase() === k);
            if (rec?.last && rec.last.includes("thu hồi")) {
              c.last = rec.last;
              c.time = rec.time || c.time;
            }
          }
        }
      } catch {}
    }

    const list = Array.from(map.values()).filter((c) => {
      // 1. Loại bỏ chính tài khoản của mình khỏi danh sách tin nhắn
      if (isSelfUser(c, user, myMember)) return false;
      if (c.isSystem || c.peerCode === "admin" || c.peerCode === "system" || c.isGroup || c.peerCode.startsWith("group_")) return true;
      if (c.isConnected) return true;
      return Boolean(c.last && c.last.trim().length > 0);
    });

    list.sort((a, b) => {
      // Cuộc trò chuyện được ghim luôn nằm trên cùng
      const isPinnedA = Boolean(pinnedConvs[a.peerCode]);
      const isPinnedB = Boolean(pinnedConvs[b.peerCode]);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;

      const getTimestamp = (conv: MyConversation) => {
        if (conv.rawTime) {
          const t = new Date(conv.rawTime).getTime();
          if (!isNaN(t)) return t;
        }
        if (conv.time) {
          const t = new Date(conv.time).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      // Cuộc trò chuyện có tin nhắn / tương tác mới nhất luôn lên đầu (chuẩn Messenger)
      if (timeA !== timeB) return timeB - timeA;
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return 0;
    });
    return list;
  }, [conversations, localRecents, localGroups, members, user, myMember, pinnedConvs]);

  const filteredMembers = members.filter((m) => {
    // Không hiển thị chính mình trong danh sách chọn người nhắn mới
    if (isSelfUser(m, user, myMember)) return false;
    const q = pickerQ.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.industry.toLowerCase().includes(q)
    );
  });

  const isGroupConv = (c: MyConversation) => Boolean(c.isGroup || c.peerCode.startsWith("group_"));
  const isChannelConv = (c: MyConversation) => Boolean(c.peerCode.startsWith("channel_"));

  const channelsCount = allConversations.filter(isChannelConv).length;
  const groupsCount = allConversations.filter(isGroupConv).length;
  const pendingCount = allConversations.filter(
    (c) => !isGroupConv(c) && !isChannelConv(c) && !c.isSystem && c.peerCode !== "admin" && c.peerCode !== "system" && !c.isConnected
  ).length;
  const friendsCount = allConversations.filter(
    (c) => !isGroupConv(c) && !isChannelConv(c) && c.isConnected && !c.isSystem && c.peerCode !== "admin" && c.peerCode !== "system"
  ).length;
  const systemCount = allConversations.filter(
    (c) => (c.isSystem || c.peerCode === "admin" || c.peerCode === "system") && !isChannelConv(c)
  ).length;
  const unreadCount = allConversations.filter((c) => (c.unread || 0) > 0).length;
  const allCount = allConversations.filter(
    (c) => isGroupConv(c) || isChannelConv(c) || c.isSystem || c.peerCode === "admin" || c.peerCode === "system" || Boolean(c.last && c.last.trim())
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
        (c) => !isGroupConv(c) && !c.isSystem && c.peerCode !== "admin" && c.peerCode !== "system" && !c.isConnected
      );
    } else if (activeTab === "system") {
      // Hệ thống
      list = allConversations.filter(
        (c) => c.isSystem || c.peerCode === "admin" || c.peerCode === "system"
      );
    } else if (activeTab === "friends") {
      // Bạn bè (đã kết nối)
      list = allConversations.filter(
        (c) => !isGroupConv(c) && c.isConnected && !c.isSystem && c.peerCode !== "admin" && c.peerCode !== "system"
      );
    } else if (activeTab === "unread") {
      // Chưa đọc
      list = allConversations.filter((c) => (c.unread || 0) > 0);
    } else {
      // "all" (Tất cả): Có tất cả tin nhắn đã rep lại hoặc tin nhắn hệ thống hoặc nhóm hoặc người đã kết nối
      list = allConversations.filter(
        (c) => isGroupConv(c) || c.isSystem || c.peerCode === "admin" || c.peerCode === "system" || c.isConnected || Boolean(c.last && c.last.trim())
      );
    }

    // Lọc theo người đang trực tuyến (Online)
    if (filterOnlineOnly) {
      list = list.filter((c) => checkOnline(c));
    }

    // Lọc theo ký tự A-Z
    if (selectedLetter) {
      const letterUpper = selectedLetter.toUpperCase();
      list = list.filter((c) => getNormalizedFirstChar(c.name) === letterUpper);
    }

    // Sắp xếp danh sách
    const sorted = [...list];
    sorted.sort((a, b) => {
      const getTimestamp = (conv: MyConversation) => {
        if (conv.rawTime) {
          const t = new Date(conv.rawTime).getTime();
          if (!isNaN(t)) return t;
        }
        if (conv.time) {
          const t = new Date(conv.time).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };

      if (sortMode === "oldest") {
        return getTimestamp(a) - getTimestamp(b);
      }
      if (sortMode === "alpha_asc") {
        return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
      }
      if (sortMode === "alpha_desc") {
        return b.name.localeCompare(a.name, "vi", { sensitivity: "base" });
      }
      if (sortMode === "unread_first") {
        const diff = (b.unread || 0) - (a.unread || 0);
        if (diff !== 0) return diff;
        return getTimestamp(b) - getTimestamp(a);
      }
      // "newest" (Mặc định)
      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);
      if (timeA !== timeB) return timeB - timeA;
      if (a.isSystem && !b.isSystem) return -1;
      if (!a.isSystem && b.isSystem) return 1;
      return 0;
    });

    return sorted;
  }, [allConversations, activeTab, filterOnlineOnly, selectedLetter, sortMode, onlineUserMap]);

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return baseConvs;
    return baseConvs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.peerCode.toLowerCase().includes(q) ||
        (c.last && c.last.toLowerCase().includes(q)),
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
          const isGroup = c.isGroup || c.peerCode?.startsWith("group_");
          const isSystem = !isGroup && (c.isSystem || c.peerCode === "admin" || c.peerCode === "system");
          const matchedMember = members.find((m) => m.code.toLowerCase() === c.peerCode.toLowerCase());
          const resolvedAvatar = c.avatarUrl || matchedMember?.avatar || null;
          const resolvedName =
            c.name && c.name.trim().toLowerCase() !== c.peerCode.toLowerCase()
              ? c.name
              : matchedMember?.personName || matchedMember?.contact || matchedMember?.name || c.name || c.peerCode;
          const isSwiped = swipedConvCode === c.peerCode;
          const isPinned = Boolean(pinnedConvs[c.peerCode]);
          const isMuted = Boolean(mutedConvs[c.peerCode]);

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
                        src="/ceo1983-logo.png"
                        alt="CEO 1983"
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

function ChatThread({
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
      if (
        data?.userId &&
        (data.userId === peer.userId ||
          data.userId.toLowerCase() === peer.peerCode.toLowerCase())
      ) {
        setIsPeerOnline(true);
      }
    };
    const handleOffline = (data: { userId?: string }) => {
      if (
        data?.userId &&
        (data.userId === peer.userId ||
          data.userId.toLowerCase() === peer.peerCode.toLowerCase())
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

  const matchedMember = members.find((m) => m.code.toLowerCase() === peer.peerCode.toLowerCase());
  const resolvedAvatar = peer.avatarUrl || matchedMember?.avatar || null;
  const displayName =
    isGroup
      ? peer.name || "Nhóm trò chuyện"
      : peer.name && peer.name.trim().toLowerCase() !== peer.peerCode.toLowerCase()
        ? peer.name
        : matchedMember?.personName || matchedMember?.contact || matchedMember?.name || data.peerName || peer.name || peer.peerCode;

  const handleOpenPeerProfile = () => {
    if (isGroup) {
      setGroupMembersOpen(true);
      return;
    }
    if (peer.isSystem || peer.peerCode === "admin" || peer.peerCode === "system") return;
    const found = members.find((m) => m.code.toLowerCase() === peer.peerCode.toLowerCase());
    if (found) {
      setProfileMember(found);
    } else {
      setProfileMember({
        code: peer.peerCode,
        name: displayName,
        personName: displayName,
        contact: displayName,
        personTitle: "Hội viên CEO 1983",
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
          "Chào mừng Quý Anh/Chị Hội viên đến với Kênh Ban Thư Ký & Ban Điều Hành CLB Doanh Nhân CEO 1983.",
          "[action:meeting|title:H%E1%BB%8Dp%20Ban%20Ch%E1%BA%A5p%20H%C3%A0nh%20CEO%201983%20Th%C3%A1ng%203|time:14:00%20-%2028/03/2026|location:Trung%20t%C3%A2m%20H%E1%BB%99i%20Ngh%E1%BB%8B%20Qu%E1%BB%91c%20Gia%20H%C3%A0%20N%E1%BB%99i|link:https://meet.vione.vn/ceo1983-bch|desc:Phi%C3%AAn%20h%E1%BB%8Dp%20chi%E1%BA%BFn%20l%C6%B0%E1%BB%A3c%20tri%E1%BB%83n%20khai%20giao%20th%C6%B0%C6%A1ng%20to%C3%A0n%20di%E1%BB%87n]",
          "Văn bản chỉ đạo & kế hoạch hoạt động năm 2026 đã được Ban Thư Ký cập nhật. Kính mời Quý Hội viên theo dõi và đồng hành.",
        ],
        channel_media: [
          "Chào mừng Quý Hội viên đến với Kênh Ban Truyền Thông Hiệp Hội CEO 1983.",
          "Bản tin hoạt động CLB: Đẩy mạnh các chiến dịch truyền thông nhận diện thương hiệu cho các doanh nghiệp hội viên trên đa nền tảng.",
          "Thông cáo báo chí: Chuỗi sự kiện Gala Doanh Nhân & Lễ tôn vinh Doanh nghiệp tiêu biểu 2026 chuẩn bị khởi động.",
        ],
        channel_promotion: [
          "Chào mừng Quý Hội viên đến với Kênh Ban Xúc Tiến Giao Thương CLB CEO 1983.",
          "Chương trình Matching B2B: Ban Xúc tiến mở cổng tiếp nhận nhu cầu liên kết chuỗi cung ứng giữa các doanh nghiệp hội viên.",
          "Cơ hội kết nối tuần này: Nhu cầu tìm đối tác tổng thầu thi công nội thất, cung cấp nguyên vật liệu và giải pháp công nghệ số.",
        ],
        channel_deals: [
          "Chào mừng Quý Hội viên đến với Kênh Cơ Hội & Deal B2B CLB CEO 1983.",
          "Tổng hợp các gói hợp tác kinh doanh độc quyền và chính sách chiết khấu ưu đãi nội bộ giữa các doanh nghiệp trong CLB.",
          "Deal hot tháng 3: Gói tài trợ truyền thông và gian hàng triển lãm B2B dành riêng cho hội viên chính thức.",
        ],
        channel_events: [
          "Chào mừng Quý Hội viên đến với Kênh Ban Sự Kiện & Hội Nghị CLB CEO 1983.",
          "Lịch sự kiện sắp tới: Đại hội thường niên CLB CEO 1983 và Diễn đàn Kinh tế Tư nhân 2026.",
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
      await requestConnFn({ data: { targetUserId: peer.userId, message: "Muốn kết nối giao thương cùng bạn trên CLB CEO 1983" } });
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
                  src="/ceo1983-logo.png"
                  alt="CEO 1983"
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
                          src="/ceo1983-logo.png"
                          alt="CEO 1983"
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
                                    CLB Doanh Nhân CEO 1983
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

function MessengerCallModal({
  type,
  peerName,
  peerAvatar,
  onClose,
  onEndCall,
}: {
  type: "audio" | "video";
  peerName: string;
  peerAvatar?: string | null;
  onClose: () => void;
  onEndCall?: (result: { type: "audio" | "video"; duration: number; status: "completed" | "missed" }) => void;
}) {
  const [callStatus, setCallStatus] = useState<"ringing" | "connected">("ringing");
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const ringTimer = setTimeout(() => {
      setCallStatus("connected");
    }, 2000);
    return () => clearTimeout(ringTimer);
  }, []);

  useEffect(() => {
    if (callStatus !== "connected") return;
    const interval = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    const isConnected = callStatus === "connected" && callSeconds > 0;
    const duration = isConnected ? callSeconds : 0;
    const status = isConnected ? "completed" : "missed";
    toast.info(isConnected ? `Cuộc gọi kết thúc (${fmtDuration(duration)})` : "Cuộc gọi đã kết thúc");
    if (onEndCall) {
      onEndCall({ type, duration, status });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 text-white backdrop-blur-2xl animate-fade-in select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pt-6 text-slate-300">
        <span className="text-[12px] font-semibold tracking-wide uppercase flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          {type === "video" ? "Cuộc gọi Video mã hóa E2E" : "Cuộc gọi Thoại mã hóa E2E"}
        </span>
        <button
          onClick={handleEndCall}
          className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Avatar & Caller Info */}
      <div className="flex flex-col items-center justify-center my-auto space-y-5">
        <div className="relative">
          {/* Concentric wave rings when ringing */}
          {callStatus === "ringing" && (
            <>
              <div className="absolute -inset-4 rounded-full bg-blue-500/20 animate-ping opacity-60" />
              <div className="absolute -inset-8 rounded-full bg-blue-500/10 animate-pulse opacity-40" />
            </>
          )}

          {peerAvatar ? (
            <img
              src={resolveMediaUrl(peerAvatar) || peerAvatar}
              alt={peerName}
              className="relative h-28 w-28 rounded-full object-cover ring-4 ring-blue-500/50 shadow-2xl"
            />
          ) : (
            <div className="relative grid h-28 w-28 place-items-center rounded-full bg-blue-600/30 text-blue-300 ring-4 ring-blue-500/50 text-3xl font-black shadow-2xl">
              {initialsOf(peerName)}
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md">{peerName}</h2>
          <p className="text-sm font-medium text-slate-400">
            {callStatus === "ringing" ? "Đang đổ chuông..." : fmtDuration(callSeconds)}
          </p>
        </div>
      </div>

      {/* Call Controls Bar */}
      <div className="w-full max-w-xs flex items-center justify-around pb-8">
        <button
          type="button"
          onClick={() => setIsMuted((m) => !m)}
          className={`flex flex-col items-center gap-1.5 transition active:scale-90 cursor-pointer ${
            isMuted ? "text-rose-400" : "text-white"
          }`}
        >
          <div
            className={`grid h-13 w-13 place-items-center rounded-full border ${
              isMuted
                ? "bg-rose-500/20 border-rose-500"
                : "bg-white/10 border-white/15 hover:bg-white/20"
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </div>
          <span className="text-[11px] font-medium">{isMuted ? "Đã tắt mic" : "Tắt mic"}</span>
        </button>

        {type === "video" && (
          <button
            type="button"
            onClick={() => setIsVideoOff((v) => !v)}
            className={`flex flex-col items-center gap-1.5 transition active:scale-90 cursor-pointer ${
              isVideoOff ? "text-rose-400" : "text-white"
            }`}
          >
            <div
              className={`grid h-13 w-13 place-items-center rounded-full border ${
                isVideoOff
                  ? "bg-rose-500/20 border-rose-500"
                  : "bg-white/10 border-white/15 hover:bg-white/20"
              }`}
            >
              <Video className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-medium">{isVideoOff ? "Bật cam" : "Tắt cam"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsSpeaker((s) => !s)}
          className={`flex flex-col items-center gap-1.5 transition active:scale-90 cursor-pointer ${
            isSpeaker ? "text-blue-400" : "text-white"
          }`}
        >
          <div
            className={`grid h-13 w-13 place-items-center rounded-full border ${
              isSpeaker
                ? "bg-blue-500/20 border-blue-500"
                : "bg-white/10 border-white/15 hover:bg-white/20"
            }`}
          >
            <Volume2 className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-medium">Loa ngoài</span>
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={handleEndCall}
          className="flex flex-col items-center gap-1.5 transition active:scale-90 cursor-pointer text-white"
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-rose-600 hover:bg-rose-700 shadow-[0_0_20px_rgba(244,63,94,0.6)]">
            <PhoneOff className="h-6 w-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-rose-300">Kết thúc</span>
        </button>
      </div>
    </div>
  );
}

function ForwardMessageModal({
  open,
  onClose,
  messageText,
  members = [],
  onForward,
}: {
  open: boolean;
  onClose: () => void;
  messageText: string;
  members: DirectoryMember[];
  onForward: (targetPeerCode: string, targetName: string) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [forwardingCode, setForwardingCode] = useState<string | null>(null);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const filtered = members.filter((m) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      (m.personName && m.personName.toLowerCase().includes(term)) ||
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.code && m.code.toLowerCase().includes(term)) ||
      (m.industry && m.industry.toLowerCase().includes(term))
    );
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[390px] rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="h-4.5 w-4.5 text-[#0084FF] dark:text-amber-400" />
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
              Chuyển tiếp tin nhắn
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic border-l-3 border-l-[#0084FF]">
          "{formatMessagePreview(messageText)}"
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm hội viên để chuyển tiếp..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#0084FF]"
          />
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Không tìm thấy hội viên phù hợp</p>
          ) : (
            filtered.map((m) => {
              const name = m.personName || m.name;
              const isSending = forwardingCode === m.code;
              return (
                <div
                  key={m.code}
                  className="flex items-center justify-between gap-2.5 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {m.avatar ? (
                      <img
                        src={resolveMediaUrl(m.avatar) || m.avatar}
                        alt={name}
                        className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-white/10"
                      />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-[#003B95] text-white text-[10px] font-bold shrink-0">
                        {initialsOf(name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {name}
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                        {m.industry || m.code}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSending}
                    onClick={async () => {
                      setForwardingCode(m.code);
                      try {
                        await onForward(m.code, name);
                      } finally {
                        setForwardingCode(null);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#0084FF] hover:bg-blue-600 text-white px-3 py-1.5 text-[11px] font-bold shadow-xs active:scale-95 transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    <span>Gửi</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

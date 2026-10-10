import { type MyConversation } from "@/lib/member-app.functions";
import { type ZaloTransactionData } from "@/components/business-connect/mobile/ZaloTransactionCard";

export function isSelfUser(
  candidate: { peerCode?: string | null; userId?: string | null; name?: string | null; code?: string | null } | null | undefined,
  user: { id?: string | null; username?: string | null; email?: string | null; name?: string | null } | null | undefined,
  member: { code?: string | null; id?: string | null; name?: string | null; email?: string | null } | null | undefined
): boolean {
  if (!candidate || (!user && !member)) return false;
  const candidateCode = (candidate.peerCode || candidate.code || "").trim().toLowerCase();
  const candidateUserId = (candidate.userId || "").trim().toLowerCase();
  const candidateName = (candidate.name || "").trim().toLowerCase();

  // If group, channel or system, never self
  if (
    candidateCode.startsWith("group_") ||
    candidateCode.startsWith("channel_") ||
    candidateCode === "admin" ||
    candidateCode === "system"
  ) {
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

  try {
    const rawCustom = localStorage.getItem("vba_custom_profile");
    if (rawCustom) {
      const custom = JSON.parse(rawCustom);
      if (custom?.name && candidateName && custom.name.trim().toLowerCase() === candidateName) return true;
    }
  } catch {}

  return false;
}

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export function formatMessageTime(isoOrText?: string) {
  if (!isoOrText) return "";
  if (isoOrText === "Vừa xong" || isoOrText === "justNow") return "Vừa xong";
  const d = new Date(isoOrText);
  if (isNaN(d.getTime())) return isoOrText;
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateSeparator(isoStr?: string) {
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

export function initialsOf(name?: string | null): string {
  if (!name || typeof name !== "string") return "HV";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HV";
  const initials = parts.slice(-2).map((w) => w[0] || "").join("").toUpperCase();
  return initials || "HV";
}

export function cleanPersonName(fullName?: string | null): string {
  if (!fullName || typeof fullName !== "string") return "";
  const clean = fullName.split(/\s*[-–—|]\s*/)[0].trim();
  return clean || fullName.trim();
}

export function getShortName(fullName?: string | null): string {
  if (!fullName || typeof fullName !== "string") return "";
  const person = cleanPersonName(fullName);
  const parts = person.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
  }
  return parts[0] || person;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileBadgeInfo(fileName: string) {
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

export type ParsedContent = {
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

export function safeDecode(val?: string): string {
  if (!val) return "";
  try {
    return decodeURIComponent(val.replace(/\+/g, " "));
  } catch {
    return val;
  }
}

export function parseMessageContent(rawBody: string): ParsedContent {
  let body = rawBody;
  let replyQuote: ReplyQuoteData | undefined;

  const replyMatch = body.match(/^\[reply:([^|]+)\|name:([^|]+)\|text:([^\]]+)\]([\s\S]*)$/i);
  if (replyMatch) {
    replyQuote = {
      id: replyMatch[1],
      senderName: safeDecode(replyMatch[2]),
      text: safeDecode(replyMatch[3]),
    };
    body = replyMatch[4].trim();
  }

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

export function formatMessagePreview(raw?: string | null): string {
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

export type ConvFilter = "all" | "channels" | "groups" | "friends" | "unread" | "system" | "pending";
export type ConvSortMode = "newest" | "oldest" | "alpha_asc" | "alpha_desc" | "unread_first";

export const ALPHABET_LETTERS = [
  "A", "B", "C", "D", "Đ", "E", "G", "H", "I", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y"
];

export function getNormalizedFirstChar(str: string): string {
  if (!str) return "#";
  const trimmed = str.trim();
  if (!trimmed) return "#";
  const first = trimmed[0].toUpperCase();
  if (first === "Đ") return "Đ";
  const normalized = first.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/[A-Z]/.test(normalized)) return normalized;
  return "#";
}

export function saveRecentConversation(peer: MyConversation, lastText: string) {
  if (typeof window === "undefined" || !peer) return;
  const peerCode = String(peer.peerCode || "");
  if (!peerCode) return;
  try {
    const raw = localStorage.getItem("vba.recent_conversations");
    const list: MyConversation[] = raw ? JSON.parse(raw) : [];
    const existing = Array.isArray(list) ? list.find((c) => c?.peerCode && String(c.peerCode).toLowerCase() === peerCode.toLowerCase()) : undefined;
    const nowIso = new Date().toISOString();
    const isGroup = Boolean(peer.isGroup || existing?.isGroup || peerCode.startsWith("group_"));
    const item: MyConversation = {
      peerCode,
      name:
        peer.name && peer.name.trim().toLowerCase() !== peerCode.toLowerCase()
          ? peer.name
          : existing?.name || peer.name,
      last: lastText,
      time: nowIso,
      rawTime: nowIso,
      unread: 0,
      avatarUrl: peer.avatarUrl || existing?.avatarUrl || null,
      isSystem: Boolean(peer.isSystem),
      isGroup,
      memberCount: peer.memberCount || existing?.memberCount,
      members: peer.members || existing?.members,
      groupAvatar: peer.groupAvatar || existing?.groupAvatar,
    };
    const next = [item, ...(Array.isArray(list) ? list.filter((c) => c?.peerCode && String(c.peerCode).toLowerCase() !== peerCode.toLowerCase()) : [])];
    localStorage.setItem("vba.recent_conversations", JSON.stringify(next.slice(0, 50)));

    if (isGroup) {
      const rawGroups = localStorage.getItem("vba.group_conversations");
      const groupList: MyConversation[] = rawGroups ? JSON.parse(rawGroups) : [];
      const nextGroups = [item, ...(Array.isArray(groupList) ? groupList.filter((g) => g?.peerCode && String(g.peerCode).toLowerCase() !== peerCode.toLowerCase()) : [])];
      localStorage.setItem("vba.group_conversations", JSON.stringify(nextGroups.slice(0, 50)));
    }

    try {
      const storedDeleted = JSON.parse(localStorage.getItem("vba_deleted_convs") || "[]");
      if (Array.isArray(storedDeleted) && storedDeleted.length > 0) {
        const nextDeleted = storedDeleted.filter((k: string) => String(k).toLowerCase() !== peerCode.toLowerCase());
        localStorage.setItem("vba_deleted_convs", JSON.stringify(nextDeleted));
      }
    } catch {}

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("vba:conversation_updated"));
  } catch {}
}

export { resolveMediaUrl } from "@/lib/api-client";
export { type DirectoryMember } from "@/lib/member-app.functions";




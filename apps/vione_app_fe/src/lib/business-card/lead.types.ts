// Business Card lead + analytics domain types (BC-2.1D extraction).
//
// Canonical home for the Lead / Reply / Stats shapes. Re-exported from
// "@/lib/business-card.functions" so existing importers keep working unchanged.

export type LeadStatus = "new" | "read" | "contacting" | "responded" | "won" | "lost" | "archived";

export type ReplyChannel = "email" | "phone" | "note";

export type LeadReplyEntry = {
  at: string;
  channel: ReplyChannel;
  templateId: string | null;
  subject: string | null;
  body: string;
};

// Quick-reply templates (client-safe constant). {name}/{card} are simple tokens.
export type ReplyTemplate = {
  id: string;
  channel: ReplyChannel;
  labelVi: string;
  labelEn: string;
  subjectVi?: string;
  subjectEn?: string;
  bodyVi: string;
  bodyEn: string;
};

export const REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: "ack",
    channel: "email",
    labelVi: "Xác nhận đã nhận",
    labelEn: "Acknowledge receipt",
    subjectVi: "Cảm ơn bạn đã liên hệ",
    subjectEn: "Thank you for reaching out",
    bodyVi:
      "Chào {name},\n\nCảm ơn bạn đã liên hệ. Chúng tôi đã nhận được yêu cầu và sẽ phản hồi trong thời gian sớm nhất.\n\nTrân trọng.",
    bodyEn:
      "Hi {name},\n\nThank you for reaching out. We've received your request and will get back to you shortly.\n\nBest regards.",
  },
  {
    id: "meeting",
    channel: "email",
    labelVi: "Đề xuất lịch hẹn",
    labelEn: "Propose a meeting",
    subjectVi: "Sắp xếp cuộc hẹn trao đổi",
    subjectEn: "Scheduling a meeting",
    bodyVi:
      "Chào {name},\n\nRất vui được kết nối. Bạn vui lòng cho biết thời gian phù hợp để chúng ta trao đổi chi tiết hơn nhé.\n\nTrân trọng.",
    bodyEn:
      "Hi {name},\n\nGreat to connect. Please let me know a convenient time so we can discuss in more detail.\n\nBest regards.",
  },
  {
    id: "quote",
    channel: "email",
    labelVi: "Gửi báo giá / thông tin",
    labelEn: "Send quote / info",
    subjectVi: "Thông tin bạn cần",
    subjectEn: "The information you requested",
    bodyVi:
      "Chào {name},\n\nTheo yêu cầu, tôi xin gửi thông tin/báo giá đính kèm. Nếu cần thêm chi tiết, bạn cứ liên hệ lại.\n\nTrân trọng.",
    bodyEn:
      "Hi {name},\n\nAs requested, please find the information/quote below. Feel free to reach out for anything further.\n\nBest regards.",
  },
  {
    id: "call-note",
    channel: "note",
    labelVi: "Ghi chú cuộc gọi",
    labelEn: "Call note",
    bodyVi: "Đã gọi cho {name}. Nội dung trao đổi: ",
    bodyEn: "Called {name}. Discussion notes: ",
  },
];

export type LeadHistoryEntry = {
  at: string;
  from: LeadStatus | null;
  to: LeadStatus;
  note?: string | null;
};

export type BusinessCardLead = {
  id: string;
  cardId: string;
  cardSlug: string | null;
  cardName: string | null;
  requesterName: string;
  requesterEmail: string | null;
  requesterPhone: string | null;
  message: string | null;
  leadType: string;
  status: LeadStatus;
  preferredTime: string | null;
  createdAt: string;
  updatedAt: string;
  history: LeadHistoryEntry[];
  replies: LeadReplyEntry[];
};

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "read",
  "contacting",
  "responded",
  "won",
  "lost",
  "archived",
];

export type DailyPoint = { date: string; leads: number; interactions: number };
export type StatusBreakdown = { status: LeadStatus; count: number };
export type BusinessCardStats = {
  totalLeads: number;
  totalInteractions: number;
  uniqueViews: number;
  respondedLeads: number;
  responseRate: number; // 0..1
  daily: DailyPoint[];
  statusBreakdown: StatusBreakdown[];
  rangeDays: number;
};

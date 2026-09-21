// BC-Mobile-8A — Nhắn tin nội bộ 1-1 (client-safe types).
//
// Ranh giới nghiệp vụ (không được nới rộng ngầm):
// - Chỉ nhắn tin giữa HAI người đã kết nối (user_connections = accepted).
//   Thẻ đã lưu (`c:`) và liên hệ khách (`g:`) KHÔNG có hộp thư — họ chưa
//   chắc là người dùng của hệ thống; những trường hợp đó vẫn dùng tel:/mailto:.
// - Mỗi cặp người dùng có đúng MỘT cuộc trò chuyện.
// - Không nhóm, không đính kèm, không "đang gõ", không chỉnh sửa nội dung.

export const DM_MAX_BODY_LEN = 2000;
export const DM_PAGE_SIZE = 30;

export type BcDmThreadSummary = {
  threadId: string;
  /** personId dạng `u:<uuid>` để tái dùng đúng vốn từ 2C. */
  personId: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  companyName: string | null;
  isOnline?: boolean;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  /** true khi tin cuối do chính người xem gửi. */
  lastMessageFromMe: boolean;
  unreadCount: number;
  /** true nếu 2 bên đã kết nối, false nếu là tin nhắn chờ (người lạ / gợi ý) */
  isConnected?: boolean;
};

export type BcDmMessageReaction = {
  userId: string;
  emoji: string;
  createdAt: string;
};

export type BcDmMessageReply = {
  id: string;
  senderName?: string;
  preview?: string;
};

export type BcDmMessage = {
  id: string;
  threadId: string;
  fromMe: boolean;
  body: string;
  reactions?: BcDmMessageReaction[];
  replyTo?: BcDmMessageReply | null;
  createdAt: string;
  readAt: string | null;
  retractedAt: string | null;
};

export type BcDmErrorCode =
  | "invalid_input"
  | "not_connected"
  | "not_found"
  | "empty_message"
  | "unavailable"
  | "generic";

export type BcDmResult<T> = ({ ok: true } & T) | { ok: false; error: BcDmErrorCode };

export function sanitizeDmBody(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, DM_MAX_BODY_LEN);
}

export function dmPersonIdToUserId(personId: string): string | null {
  const m = /^u:([0-9a-fA-F-]{36})$/.exec(personId);
  return m ? m[1].toLowerCase() : null;
}

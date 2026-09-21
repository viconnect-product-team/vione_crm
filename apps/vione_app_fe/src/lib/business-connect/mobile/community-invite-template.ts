// BC — Mẫu email lời mời cộng đồng (client-safe: mặc định + kết xuất biến).
// Không gọi Supabase, không import server module.

export type InviteLocale = "vi" | "en";

export type CommunityInviteTemplateDTO = {
  locale: InviteLocale;
  subject: string;
  body: string;
  /** true khi cộng đồng chưa lưu mẫu riêng (đang dùng mẫu mặc định). */
  isDefault: boolean;
  updatedAt: string | null;
};

export const INVITE_TEMPLATE_PLACEHOLDERS = [
  "{{community}}",
  "{{inviter}}",
  "{{email}}",
  "{{note}}",
  "{{link}}",
] as const;

export const DEFAULT_INVITE_TEMPLATES: Record<
  InviteLocale,
  { subject: string; body: string }
> = {
  vi: {
    subject: "Lời mời tham gia {{community}}",
    body: [
      "Xin chào,",
      "",
      "{{inviter}} mời bạn tham gia cộng đồng {{community}} trên Business Connect.",
      "",
      "{{note}}",
      "",
      "Nhấn vào liên kết sau để nhận lời mời:",
      "{{link}}",
      "",
      "Trân trọng,",
      "{{community}}",
    ].join("\n"),
  },
  en: {
    subject: "Invitation to join {{community}}",
    body: [
      "Hello,",
      "",
      "{{inviter}} has invited you to join the {{community}} community on Business Connect.",
      "",
      "{{note}}",
      "",
      "Use the link below to accept the invitation:",
      "{{link}}",
      "",
      "Best regards,",
      "{{community}}",
    ].join("\n"),
  },
};

export function normalizeInviteLocale(value: unknown): InviteLocale {
  return value === "en" ? "en" : "vi";
}

/** Thay thế biến trong mẫu và dọn dòng trống thừa khi thiếu lời nhắn. */
export function renderInviteTemplate(
  template: { subject: string; body: string },
  vars: { community: string; inviter: string; email: string; note: string; link: string },
): { subject: string; body: string } {
  const apply = (input: string) =>
    input
      .replace(/\{\{\s*community\s*\}\}/g, vars.community)
      .replace(/\{\{\s*inviter\s*\}\}/g, vars.inviter)
      .replace(/\{\{\s*email\s*\}\}/g, vars.email)
      .replace(/\{\{\s*note\s*\}\}/g, vars.note)
      .replace(/\{\{\s*link\s*\}\}/g, vars.link)
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  return { subject: apply(template.subject).replace(/\n/g, " ").slice(0, 200), body: apply(template.body) };
}

// Public card messaging channels (Zalo / WhatsApp / Telegram / Viber).
//
// Deterministic, presentation-only link builders. Nothing here contacts the
// network or invents data: a channel is offered ONLY when the public card
// projection already exposes the underlying field (an explicit channel URL, or
// a work phone the owner chose to publish). All hrefs are built from a
// normalized digit string, so a crafted field can never smuggle a
// javascript:/data: URL into the DOM.

export type MessagingChannel = "zalo" | "whatsapp" | "telegram" | "viber";

export type MessagingLink = {
  channel: MessagingChannel;
  href: string;
  /** Native app schemes must not open in a new browser tab. */
  external: boolean;
};

/** Keep digits only, then normalize Vietnamese local format to E.164 digits. */
export function normalizePhoneDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D+/g, "");
  if (!digits) return null;
  if (!hasPlus) {
    if (digits.startsWith("00")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = `84${digits.slice(1)}`;
  }
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

function safeHttpsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Build the messaging channel list for a public card.
 * `zaloUrl` wins over the phone-derived Zalo link when the owner published one.
 */
export function buildMessagingLinks(input: {
  phone: string | null | undefined;
  zaloUrl?: string | null;
}): MessagingLink[] {
  const digits = normalizePhoneDigits(input.phone);
  const links: MessagingLink[] = [];

  const zaloExplicit = safeHttpsUrl(input.zaloUrl);
  if (zaloExplicit) {
    links.push({ channel: "zalo", href: zaloExplicit, external: true });
  } else if (digits) {
    links.push({ channel: "zalo", href: `https://zalo.me/${digits}`, external: true });
  }

  if (digits) {
    links.push({ channel: "whatsapp", href: `https://wa.me/${digits}`, external: true });
    links.push({ channel: "telegram", href: `https://t.me/+${digits}`, external: true });
    links.push({ channel: "viber", href: `viber://chat?number=%2B${digits}`, external: false });
  }

  return links;
}

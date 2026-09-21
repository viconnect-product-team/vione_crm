// BC-Mobile — mô hình kênh liên hệ nhanh của chủ sở hữu (client-safe).
// Chỉ trả về kênh đã cấu hình, href dựng bằng builder an toàn.

import { Globe, Linkedin, Mail, MessageCircle, Phone, Send } from "lucide-react";
import type { TKey } from "@/lib/i18n";
import {
  safeMailtoHref,
  safeTelHref,
  safeWebHref,
} from "@/lib/business-connect/mobile/public-actions";
import { buildMessagingLinks } from "@/lib/business-card/messaging-links";
import type { BusinessIdentity } from "@/lib/business-connect/mobile/identity.types";

export type Channel = {
  key: string;
  labelKey: TKey;
  icon: typeof Phone;
  href: string;
  external: boolean;
};

export function buildQuickContactChannels(identity: BusinessIdentity | null): Channel[] {
  if (!identity) return [];
  const channels: Channel[] = [];

  const tel = safeTelHref(identity.primaryPhone);
  if (tel) {
    channels.push({
      key: "call",
      labelKey: "bc.mobile.me.contact.call",
      icon: Phone,
      href: tel,
      external: false,
    });
  }

  const mail = safeMailtoHref(identity.primaryEmail);
  if (mail) {
    channels.push({
      key: "email",
      labelKey: "bc.mobile.me.contact.email",
      icon: Mail,
      href: mail,
      external: false,
    });
  }

  const messaging = buildMessagingLinks({ phone: identity.primaryPhone });
  const order = ["viber", "whatsapp", "telegram", "zalo"] as const;
  const labels: Record<(typeof order)[number], TKey> = {
    viber: "bc.mobile.me.contact.viber",
    whatsapp: "bc.mobile.me.contact.whatsapp",
    telegram: "bc.mobile.me.contact.telegram",
    zalo: "bc.mobile.me.contact.zalo",
  };
  const icons: Record<(typeof order)[number], typeof Phone> = {
    viber: MessageCircle,
    whatsapp: MessageCircle,
    telegram: Send,
    zalo: MessageCircle,
  };
  for (const name of order) {
    const link = messaging.find((m) => m.channel === name);
    if (!link) continue;
    channels.push({
      key: name,
      labelKey: labels[name],
      icon: icons[name],
      href: link.href,
      external: link.external,
    });
  }

  const linkedin = safeWebHref(identity.linkedinUrl);
  if (linkedin) {
    channels.push({
      key: "linkedin",
      labelKey: "bc.mobile.me.contact.linkedin",
      icon: Linkedin,
      href: linkedin,
      external: true,
    });
  }

  const website = safeWebHref(identity.website);
  if (website) {
    channels.push({
      key: "website",
      labelKey: "bc.mobile.me.contact.website",
      icon: Globe,
      href: website,
      external: true,
    });
  }

  return channels;
}

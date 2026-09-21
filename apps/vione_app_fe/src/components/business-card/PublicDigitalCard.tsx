// BC-Mobile-3A — PublicDigitalCard: the guest-facing public business card.
//
// Renders ONLY the whitelist `PublicBusinessCard` DTO — the record has
// already been visibility-gated server-side (hidden sections arrive as
// null / empty lists). All outbound hrefs are re-sanitized at render time
// (tel:/mailto:/https: allowlist) so a crafted field can never smuggle a
// javascript:/data: URL into the DOM.
//
// Primary action: "Lưu liên hệ" downloads a server-generated .vcf built from
// the SAME public projection — privacy parity between page and vCard.

import {
  Briefcase,
  Building2,
  Facebook,
  Globe,
  Lightbulb,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Phone,
  PhoneCall,
  Send,
  Sparkles,
  UserRound,
  Youtube,
} from "lucide-react";
import type { PublicBusinessCard } from "@/lib/business-card/public-card";
import { buildMessagingLinks, type MessagingChannel } from "@/lib/business-card/messaging-links";
import {
  sanitizeEmailHref,
  sanitizeHttpUrl,
  sanitizePhoneHref,
} from "@/hooks/use-business-connect-person";
import { SaveCardButton } from "@/components/business-card/SaveCardButton";
import { ShareContactPanel } from "@/components/business-card/ShareContactPanel";
import { BusinessProfileRelationshipActions } from "@/components/connect/BusinessProfileRelationshipActions";
import { useT } from "@/lib/i18n";
import { resolveMediaUrl } from "@/lib/api-client";

export function publicCardVcfHref(slug: string): string {
  return `/api/public/card/${encodeURIComponent(slug)}.vcf`;
}

export function PublicDigitalCard({ card }: { card: PublicBusinessCard }) {
  const t = useT();
  const name = card.displayName?.trim() || card.slug;
  const resolvedCover = resolveMediaUrl(card.coverUrl) || card.coverUrl;
  const resolvedAvatar = resolveMediaUrl(card.avatarUrl) || card.avatarUrl;

  const phoneHref = sanitizePhoneHref(card.workPhone);
  const emailHref = sanitizeEmailHref(card.workEmail);
  const websiteHref = sanitizeHttpUrl(card.website);
  const mapHref = sanitizeHttpUrl(card.mapUrl);
  const social: { type: string; href: string; Icon: SocialIcon }[] = [];
  const pushSocial = (type: string, raw: string | null, Icon: SocialIcon) => {
    const href = sanitizeHttpUrl(raw);
    if (href) social.push({ type, href, Icon });
  };
  pushSocial("LinkedIn", card.linkedinUrl, Linkedin);
  pushSocial("Facebook", card.facebookUrl, Facebook);
  pushSocial("YouTube", card.youtubeUrl, Youtube);
  pushSocial("TikTok", card.tiktokUrl, Sparkles);

  // Zalo / WhatsApp / Telegram / Viber — derived only from data the public
  // projection already exposes (published phone or explicit Zalo link).
  const messaging = buildMessagingLinks({ phone: card.workPhone, zaloUrl: card.zaloUrl });

  const hasContact =
    !!websiteHref || !!emailHref || !!phoneHref || !!(card.address?.trim() || mapHref);

  return (
    <article className="vba-card overflow-hidden" aria-label={name}>
      <div className="relative h-24 bg-[var(--vba-gold-soft)]">
        {resolvedCover ? (
          <img src={resolvedCover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="vba-gold-grad h-full w-full opacity-30" />
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="-mt-10 flex items-end gap-3">
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt={name}
              className="h-20 w-20 rounded-2xl border-2 border-[var(--vba-bg-2)] object-cover"
              width={80}
              height={80}
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-[var(--vba-bg-2)] bg-[var(--vba-gold-soft)] text-[24px] font-bold text-[var(--vba-gold)]"
            >
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <h1 className="mt-3 text-[19px] font-bold text-[var(--vba-text)]">{name}</h1>
        {card.professionalTitle ? (
          <p className="text-[13px] text-[var(--vba-text-muted)]">{card.professionalTitle}</p>
        ) : null}
        {card.companyName ? (
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--vba-gold)]">
            <Building2 className="h-3.5 w-3.5" />
            {card.companyName}
          </p>
        ) : null}
        {card.headline ? (
          <p className="mt-2 text-[13px] italic text-[var(--vba-text-muted)]">“{card.headline}”</p>
        ) : null}
        {card.bio ? (
          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-[var(--vba-text)]">
            {card.bio}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={publicCardVcfHref(card.slug)}
            download
            className="focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] inline-flex items-center gap-2 rounded-xl bg-[var(--vba-gold)] px-4 py-2 text-[13px] font-semibold text-foreground transition hover:opacity-90"
          >
            <UserRound className="h-4 w-4" />
            {t("bc.public.saveContact")}
          </a>
          <SaveCardButton slug={card.slug} />
          {/* BC-Mobile-3B — guest shares their own contact back (consent-gated). */}
          {card.allowContactExchange ? (
            <ShareContactPanel slug={card.slug} ownerName={name} />
          ) : null}
        </div>

        <BusinessProfileRelationshipActions cardSlug={card.slug} />

        {messaging.length > 0 && (
          <div className="mt-4" aria-label={t("bc.public.messaging")}>
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--vba-text-muted)]">
              {t("bc.public.messaging")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {messaging.map(({ channel, href, external }) => {
                const Icon = CHANNEL_ICON[channel];
                const label = t(CHANNEL_LABEL[channel]);
                return (
                  <a
                    key={channel}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    aria-label={label}
                    className="focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] inline-flex items-center gap-2 rounded-xl border border-[var(--vba-border-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--vba-text)] transition hover:bg-card/5"
                  >
                    <Icon className="h-4 w-4 text-[var(--vba-gold)]" />
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {hasContact && (
          <div className="mt-4 space-y-2" aria-label={t("bc.public.contact")}>
            {websiteHref ? (
              <ContactRow
                icon={Globe}
                label={t("bc.public.website")}
                value={hostLabel(websiteHref) ?? websiteHref}
                href={websiteHref}
              />
            ) : null}
            {emailHref && card.workEmail ? (
              <ContactRow
                icon={Mail}
                label={t("bc.public.email")}
                value={card.workEmail}
                href={emailHref}
              />
            ) : null}
            {phoneHref && card.workPhone ? (
              <ContactRow
                icon={Phone}
                label={t("bc.public.call")}
                value={card.workPhone}
                href={phoneHref}
              />
            ) : null}
            {card.address?.trim() ? (
              <ContactRow
                icon={MapPin}
                label={t("bc.public.address")}
                value={card.address}
                href={mapHref}
              />
            ) : null}
          </div>
        )}

        {social.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label={t("bc.public.social")}>
            {social.map(({ type, href, Icon }) => (
              <a
                key={type}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={type}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--vba-border-soft)] text-[var(--vba-text)] hover:bg-card/5"
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        )}

        {card.skills.length > 0 && (
          <Block title={t("bc.public.skills")}>
            <div className="flex flex-wrap gap-2">
              {card.skills.map((s, i) => (
                <span
                  key={`${s.label}-${i}`}
                  className="rounded-full bg-[var(--vba-gold-soft)] px-3 py-1 text-[12px] font-medium text-[var(--vba-gold)]"
                >
                  {s.label}
                </span>
              ))}
            </div>
          </Block>
        )}

        {card.services.length > 0 && (
          <Block title={t("bc.public.services")} icon={Briefcase}>
            <ItemList items={card.services} />
          </Block>
        )}

        {card.needs.length > 0 && (
          <Block title={t("bc.public.needs")} icon={Lightbulb}>
            <ItemList items={card.needs} />
          </Block>
        )}
      </div>
    </article>
  );
}

type SocialIcon = React.ComponentType<{ className?: string }>;

const CHANNEL_ICON: Record<MessagingChannel, SocialIcon> = {
  zalo: MessageCircle,
  whatsapp: MessagesSquare,
  telegram: Send,
  viber: PhoneCall,
};

const CHANNEL_LABEL = {
  zalo: "bc.public.messaging.zalo",
  whatsapp: "bc.public.messaging.whatsapp",
  telegram: "bc.public.messaging.telegram",
  viber: "bc.public.messaging.viber",
} as const;

function hostLabel(href: string): string | null {
  try {
    return new URL(href).host || null;
  } catch {
    return null;
  }
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: SocialIcon;
  label: string;
  value: string;
  href: string | null;
}) {
  const inner = (
    <span className="inline-flex items-center gap-2.5 text-[13px] text-[var(--vba-text)]">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]"
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 truncate">{value}</span>
    </span>
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="block hover:opacity-80"
    >
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  );
}

function Block({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: SocialIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h2 className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--vba-text)]">
        {Icon ? <Icon className="h-4 w-4 text-[var(--vba-gold)]" /> : null}
        {title}
      </h2>
      {children}
    </div>
  );
}

function ItemList({ items }: { items: { title: string; description: string | null }[] }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-[var(--vba-border-soft)] p-3">
          <div className="text-[13px] font-semibold text-[var(--vba-text)]">{it.title}</div>
          {it.description ? (
            <p className="mt-0.5 text-[12px] text-[var(--vba-text-muted)]">{it.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

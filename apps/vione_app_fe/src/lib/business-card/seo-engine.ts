// Business Profile SEO & Discovery Engine (BC-2.3).
//
// A pure, client-safe module that turns a public Business Card DTO into a fully
// optimized Business Profile: Schema.org JSON-LD, SEO meta, OpenGraph/Twitter
// previews, canonical/robots/hreflang and AI-discovery metadata.
//
// It is behavior-free and deterministic: no network, no supabase, no window.
// The public route and sitemap consume it; it NEVER exposes private data —
// it only ever receives the already-projected public DTO.

import type { PublicBusinessCard } from "./public-card";

export type HeadMeta = {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
};
export type HeadLink = { rel: string; href: string; hrefLang?: string; type?: string };
export type HeadScript = { type: string; children: string };
export type ProfileHead = {
  meta: HeadMeta[];
  links: HeadLink[];
  scripts: HeadScript[];
};

export type SeoContext = {
  origin: string;
  slug: string;
  /** Primary content locale (BCP-47). Defaults to "vi". */
  locale?: string;
  /** Alternate locales exposed via hreflang (defaults to ["en"]). */
  alternateLocales?: string[];
  /** Whether the profile may be indexed (published + public only). */
  indexable: boolean;
  /** Optional Apple App Store id for the smart app banner. */
  appleAppId?: string;
};

const DEFAULT_LOCALE = "vi";
const MAX_DESCRIPTION = 160;
const MAX_TITLE = 70;

// ── URL helpers ──────────────────────────────────────────────────────────────

function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/** Canonical profile URL. Contract-stable: always `/b/{slug}`. */
export function profileUrl(origin: string, slug: string): string {
  return `${trimTrailingSlash(origin)}/b/${encodeURIComponent(slug)}`;
}

/** Resolve a possibly-relative asset URL to an absolute one for crawlers. */
export function absoluteAsset(origin: string, url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  return `${trimTrailingSlash(origin)}/${url.replace(/^\/+/, "")}`;
}

// ── Text helpers ─────────────────────────────────────────────────────────────

function clean(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function truncate(s: string, max: number): string {
  const c = clean(s);
  if (c.length <= max) return c;
  return `${c.slice(0, max - 1).trimEnd()}…`;
}

export function buildTitle(card: PublicBusinessCard, slug: string): string {
  const name = clean(card.displayName) || slug;
  const sub = clean(card.professionalTitle) || clean(card.companyName);
  return truncate(sub ? `${name} — ${sub}` : name, MAX_TITLE);
}

export function buildDescription(card: PublicBusinessCard, slug: string): string {
  const name = clean(card.displayName) || slug;
  const raw =
    clean(card.headline) ||
    clean(card.bio) ||
    [clean(card.professionalTitle), clean(card.companyName)].filter(Boolean).join(" · ");
  const fallback = `Hồ sơ doanh nghiệp của ${name}.`;
  return truncate(raw || fallback, MAX_DESCRIPTION);
}

/** Deduplicated keyword list derived from title/company/services/skills. */
export function buildKeywords(card: PublicBusinessCard): string[] {
  const parts: string[] = [];
  const push = (v: string | null | undefined) => {
    const c = clean(v);
    if (c) parts.push(c);
  };
  push(card.displayName);
  push(card.companyName);
  push(card.professionalTitle);
  for (const s of card.skills) push(s.label);
  for (const s of card.services) push(s.title);
  for (const s of card.services) push(s.category);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(p);
    }
  }
  return out.slice(0, 15);
}

// ── Schema.org type selection ────────────────────────────────────────────────

export type ProfileSchemaKind = "Person" | "Organization" | "ProfessionalService" | "LocalBusiness";

/**
 * Choose the primary Schema.org type automatically from the profile shape:
 * - Services + address → ProfessionalService (a service business with a place)
 * - Services only → ProfessionalService
 * - Company, no personal name → Organization (LocalBusiness if it has an address)
 * - Otherwise → Person
 */
export function selectSchemaKind(card: PublicBusinessCard): ProfileSchemaKind {
  const hasServices = card.services.length > 0;
  const hasAddress = !!clean(card.address);
  const hasPerson = !!clean(card.displayName);
  const hasCompany = !!clean(card.companyName);

  if (hasServices) return "ProfessionalService";
  if (!hasPerson && hasCompany) return hasAddress ? "LocalBusiness" : "Organization";
  return "Person";
}

// ── Social profiles (sameAs) ─────────────────────────────────────────────────

export function socialProfiles(card: PublicBusinessCard): string[] {
  return [
    card.linkedinUrl,
    card.facebookUrl,
    card.youtubeUrl,
    card.tiktokUrl,
    card.zaloUrl,
    card.website,
  ]
    .map((u) => clean(u))
    .filter((u) => /^https?:\/\//i.test(u));
}

// ── Structured data (JSON-LD) ────────────────────────────────────────────────

type Json = Record<string, unknown>;

function contactPoint(card: PublicBusinessCard): Json | null {
  const email = clean(card.workEmail);
  const phone = clean(card.workPhone);
  if (!email && !phone) return null;
  const cp: Json = { "@type": "ContactPoint", contactType: "business" };
  if (email) cp.email = email;
  if (phone) cp.telephone = phone;
  return cp;
}

function imageObject(origin: string, card: PublicBusinessCard): Json | null {
  const url = absoluteAsset(origin, card.avatarUrl || card.coverUrl);
  if (!url) return null;
  return { "@type": "ImageObject", url, caption: clean(card.displayName) || card.slug };
}

function offers(card: PublicBusinessCard): Json[] {
  return card.services.map((s) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: clean(s.title),
      ...(clean(s.description) ? { description: clean(s.description) } : {}),
      ...(clean(s.category) ? { category: clean(s.category) } : {}),
    },
  }));
}

/**
 * Build the full JSON-LD graph for a profile: primary entity (auto-selected)
 * + ProfilePage + BreadcrumbList + WebSite. Returns one `@graph` object.
 */
export function buildJsonLd(card: PublicBusinessCard, ctx: SeoContext): Json {
  const url = profileUrl(ctx.origin, ctx.slug);
  const name = clean(card.displayName) || clean(card.companyName) || ctx.slug;
  const kind = selectSchemaKind(card);
  const sameAs = socialProfiles(card);
  const cp = contactPoint(card);
  const img = imageObject(ctx.origin, card);
  const desc = buildDescription(card, ctx.slug);

  const primary: Json = {
    "@type": kind,
    "@id": `${url}#entity`,
    name,
    url,
    description: desc,
  };
  if (clean(card.professionalTitle)) primary.jobTitle = clean(card.professionalTitle);
  if (clean(card.headline)) primary.slogan = clean(card.headline);
  if (img) primary.image = img;
  if (sameAs.length) primary.sameAs = sameAs;
  if (cp) primary.contactPoint = cp;
  if (clean(card.workEmail)) primary.email = clean(card.workEmail);
  if (clean(card.workPhone)) primary.telephone = clean(card.workPhone);
  if (clean(card.address)) {
    primary.address = { "@type": "PostalAddress", streetAddress: clean(card.address) };
  }
  if (kind === "Person" && clean(card.companyName)) {
    primary.worksFor = { "@type": "Organization", name: clean(card.companyName) };
  }
  if (kind !== "Person") {
    const off = offers(card);
    if (off.length) primary.makesOffer = off;
  }

  const profilePage: Json = {
    "@type": "ProfilePage",
    "@id": url,
    url,
    name: buildTitle(card, ctx.slug),
    description: desc,
    inLanguage: ctx.locale ?? DEFAULT_LOCALE,
    mainEntity: { "@id": `${url}#entity` },
    // BC-Mobile-3A — no datePublished/dateModified: publish/update timestamps
    // are internal metadata and never cross the public DTO boundary.
  };

  const breadcrumb: Json = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Hồ sơ doanh nghiệp",
        item: `${trimTrailingSlash(ctx.origin)}/b`,
      },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  };

  const website: Json = {
    "@type": "WebSite",
    "@id": `${trimTrailingSlash(ctx.origin)}/#website`,
    url: `${trimTrailingSlash(ctx.origin)}/`,
    name: "ViOne Business Connect",
    inLanguage: ctx.locale ?? DEFAULT_LOCALE,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [primary, profilePage, breadcrumb, website],
  };
}

// ── Head assembly (meta + links + scripts) ───────────────────────────────────

function robotsValue(indexable: boolean): string {
  return indexable
    ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    : "noindex, nofollow";
}

/**
 * Build the complete `head()` payload (meta + links + scripts) for a public
 * Business Profile: title/description/keywords, canonical, robots, OpenGraph,
 * Twitter Card, Apple smart banner, hreflang/alternate and JSON-LD.
 */
export function buildProfileHead(card: PublicBusinessCard, ctx: SeoContext): ProfileHead {
  const url = profileUrl(ctx.origin, ctx.slug);
  const title = buildTitle(card, ctx.slug);
  const description = buildDescription(card, ctx.slug);
  const keywords = buildKeywords(card);
  const image = absoluteAsset(ctx.origin, card.avatarUrl || card.coverUrl);
  const locale = ctx.locale ?? DEFAULT_LOCALE;
  const alternates = ctx.alternateLocales ?? ["en"];

  const meta: HeadMeta[] = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: robotsValue(ctx.indexable) },
    { name: "googlebot", content: robotsValue(ctx.indexable) },
    // OpenGraph — Facebook, LinkedIn, Zalo, Telegram, WhatsApp, Messenger, Discord, Slack.
    { property: "og:type", content: "profile" },
    { property: "og:site_name", content: "ViOne Business Connect" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:locale", content: locale.replace("-", "_") },
    // Twitter / X.
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (keywords.length) meta.push({ name: "keywords", content: keywords.join(", ") });
  if (clean(card.displayName)) meta.push({ property: "profile:username", content: card.slug });

  if (image) {
    meta.push({ property: "og:image", content: image });
    meta.push({ property: "og:image:alt", content: title });
    meta.push({ name: "twitter:image", content: image });
    meta.push({ name: "twitter:image:alt", content: title });
  }

  // Apple smart app banner (only when an app id is configured).
  if (ctx.appleAppId) {
    meta.push({
      name: "apple-itunes-app",
      content: `app-id=${ctx.appleAppId}, app-argument=${url}`,
    });
  }
  meta.push({ name: "apple-mobile-web-app-title", content: title });
  meta.push({ name: "apple-mobile-web-app-capable", content: "yes" });

  // AI discovery: explicit, public-only signals for AI crawlers.
  meta.push({ name: "ai-content-type", content: "business-profile" });
  meta.push({
    name: "ai-crawlable",
    content: ctx.indexable ? "true" : "false",
  });

  const links: HeadLink[] = [
    { rel: "canonical", href: url },
    { rel: "alternate", href: url, hrefLang: locale },
    ...alternates.map((l: any) => ({
      rel: "alternate",
      href: `${url}?lang=${encodeURIComponent(l)}`,
      hrefLang: l,
    })),
    { rel: "alternate", href: url, hrefLang: "x-default" },
  ];

  const scripts: HeadScript[] = ctx.indexable
    ? [{ type: "application/ld+json", children: JSON.stringify(buildJsonLd(card, ctx)) }]
    : [];

  return { meta, links, scripts };
}

// ── Sitemap ──────────────────────────────────────────────────────────────────

export type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
};

export function buildProfileSitemapEntry(
  origin: string,
  slug: string,
  lastmod?: string | null,
): SitemapEntry {
  return {
    loc: profileUrl(origin, slug),
    ...(lastmod ? { lastmod: new Date(lastmod).toISOString() } : {}),
    changefreq: "weekly",
    priority: "0.7",
  };
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e: any) =>
      [
        "  <url>",
        `    <loc>${escapeXml(e.loc)}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
  ].join("\n");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

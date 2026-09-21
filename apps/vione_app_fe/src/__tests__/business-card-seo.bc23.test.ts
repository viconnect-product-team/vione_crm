import { describe, it, expect } from "vitest";
import type { BusinessCard } from "@/lib/business-card/business-card.types";
import {
  buildProfileHead,
  buildJsonLd,
  buildTitle,
  buildDescription,
  buildKeywords,
  selectSchemaKind,
  socialProfiles,
  profileUrl,
  absoluteAsset,
  buildProfileSitemapEntry,
  renderSitemapXml,
  type HeadMeta,
} from "@/lib/business-card/seo-engine";

// ---------------------------------------------------------------------------
// BC-2.3 — Business Profile SEO & Discovery Engine.
// Pure, deterministic. Verifies structured data (Schema.org), metadata,
// canonical, OpenGraph, Twitter, hreflang, robots and sitemap generation.
// No private data is ever emitted (only the already-public DTO is consumed).
// ---------------------------------------------------------------------------

const ORIGIN = "https://qlhh.lovable.app";

function makeCard(over: Partial<BusinessCard> = {}): BusinessCard {
  return {
    id: "c1",
    ownerUserId: null,
    slug: "nguyen-an-ab12cd",
    cardKind: "primary",
    status: "published",
    publicMode: "public",
    allowContactExchange: true,
    visibilitySettings: {
      mode: "public",
      showContact: true,
      showSocial: true,
      showServices: true,
      showNeeds: true,
    },
    displayName: "Nguyen An",
    professionalTitle: "CEO",
    companyName: "Acme Co",
    companyLogoUrl: null,
    avatarUrl: "https://cdn.example.com/a.jpg",
    coverUrl: null,
    headline: "Chuyên gia tư vấn chuyển đổi số",
    bio: "Hơn 10 năm kinh nghiệm.",
    displayNameEn: null,
    professionalTitleEn: null,
    companyNameEn: null,
    headlineEn: null,
    bioEn: null,
    website: "https://acme.example.com",
    workEmail: "an@acme.example.com",
    workPhone: "+84900000000",
    zaloUrl: null,
    linkedinUrl: "https://linkedin.com/in/an",
    facebookUrl: "https://facebook.com/an",
    youtubeUrl: null,
    tiktokUrl: null,
    address: "12 Le Loi, HCMC",
    mapUrl: null,
    themeId: "classic",
    customBrandColor: null,
    qrOptions: null,
    publishedAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-10T00:00:00.000Z",
    skills: [{ label: "Strategy" }],
    services: [{ title: "Consulting", description: "Advisory", category: "Business" }],
    needs: [],
    ...over,
  };
}

function findMeta(meta: HeadMeta[], key: "name" | "property", val: string) {
  return meta.find((m) => m[key] === val);
}
function ctx(indexable = true) {
  return { origin: ORIGIN, slug: "nguyen-an-ab12cd", indexable };
}

describe("URL + text helpers", () => {
  it("builds a canonical profile URL on the /b/{slug} contract", () => {
    expect(profileUrl(ORIGIN, "abc")).toBe(`${ORIGIN}/b/abc`);
    expect(profileUrl(ORIGIN + "/", "abc")).toBe(`${ORIGIN}/b/abc`);
  });

  it("resolves relative assets to absolute, leaves absolute untouched", () => {
    expect(absoluteAsset(ORIGIN, "/img/x.png")).toBe(`${ORIGIN}/img/x.png`);
    expect(absoluteAsset(ORIGIN, "https://cdn/x.png")).toBe("https://cdn/x.png");
    expect(absoluteAsset(ORIGIN, null)).toBeNull();
  });

  it("builds title, truncated description and deduped keywords", () => {
    const card = makeCard();
    expect(buildTitle(card, card.slug)).toBe("Nguyen An — CEO");
    expect(buildDescription(card, card.slug)).toBe("Chuyên gia tư vấn chuyển đổi số");
    const kw = buildKeywords(card);
    expect(kw).toContain("Nguyen An");
    expect(kw).toContain("Consulting");
    expect(new Set(kw).size).toBe(kw.length);
  });

  it("truncates long descriptions to <=160 chars", () => {
    const long = "x".repeat(400);
    const d = buildDescription(makeCard({ headline: long }), "s");
    expect(d.length).toBeLessThanOrEqual(160);
  });
});

describe("schema selection + sameAs", () => {
  it("selects ProfessionalService when services exist", () => {
    expect(selectSchemaKind(makeCard())).toBe("ProfessionalService");
  });
  it("selects Person when no services and a personal name", () => {
    expect(selectSchemaKind(makeCard({ services: [] }))).toBe("Person");
  });
  it("selects LocalBusiness for a company with an address and no person/services", () => {
    expect(selectSchemaKind(makeCard({ displayName: null, services: [], address: "1 St" }))).toBe(
      "LocalBusiness",
    );
  });
  it("selects Organization for a company with no address/person/services", () => {
    expect(selectSchemaKind(makeCard({ displayName: null, services: [], address: null }))).toBe(
      "Organization",
    );
  });
  it("collects only absolute social URLs in sameAs", () => {
    const s = socialProfiles(makeCard());
    expect(s).toContain("https://linkedin.com/in/an");
    expect(s.every((u) => /^https?:\/\//.test(u))).toBe(true);
  });
});

describe("JSON-LD structured data", () => {
  it("emits a valid @graph with ProfilePage, Breadcrumb and WebSite", () => {
    const g = buildJsonLd(makeCard(), ctx()) as {
      "@context": string;
      "@graph": Record<string, unknown>[];
    };
    expect(g["@context"]).toBe("https://schema.org");
    const types = g["@graph"].map((n: any) => n["@type"]);
    expect(types).toContain("ProfilePage");
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("WebSite");
    expect(types).toContain("ProfessionalService");
  });

  it("wires contactPoint, image, offers and canonical @id", () => {
    const g = buildJsonLd(makeCard(), ctx()) as { "@graph": Record<string, unknown>[] };
    const primary = g["@graph"][0];
    expect((primary.contactPoint as Record<string, unknown>)["@type"]).toBe("ContactPoint");
    expect((primary.image as Record<string, unknown>)["@type"]).toBe("ImageObject");
    expect(Array.isArray(primary.makesOffer)).toBe(true);
    const page = g["@graph"][1];
    expect(page["@id"]).toBe(`${ORIGIN}/b/nguyen-an-ab12cd`);
  });

  it("is JSON-serializable", () => {
    expect(() => JSON.stringify(buildJsonLd(makeCard(), ctx()))).not.toThrow();
  });
});

describe("head assembly (meta/links/scripts)", () => {
  it("emits title, description, canonical, robots index and JSON-LD when indexable", () => {
    const head = buildProfileHead(makeCard(), ctx(true));
    expect(head.meta.find((m) => m.title)?.title).toBe("Nguyen An — CEO");
    expect(findMeta(head.meta, "name", "robots")?.content).toContain("index");
    expect(head.links.find((l) => l.rel === "canonical")?.href).toBe(
      `${ORIGIN}/b/nguyen-an-ab12cd`,
    );
    expect(head.scripts.some((s) => s.type === "application/ld+json")).toBe(true);
  });

  it("emits OpenGraph + Twitter tags with an image", () => {
    const head = buildProfileHead(makeCard(), ctx());
    expect(findMeta(head.meta, "property", "og:type")?.content).toBe("profile");
    expect(findMeta(head.meta, "property", "og:image")?.content).toBe(
      "https://cdn.example.com/a.jpg",
    );
    expect(findMeta(head.meta, "name", "twitter:card")?.content).toBe("summary_large_image");
  });

  it("falls back to summary card when no image is present", () => {
    const head = buildProfileHead(makeCard({ avatarUrl: null, coverUrl: null }), ctx());
    expect(findMeta(head.meta, "name", "twitter:card")?.content).toBe("summary");
    expect(findMeta(head.meta, "property", "og:image")).toBeUndefined();
  });

  it("emits hreflang alternates including x-default", () => {
    const head = buildProfileHead(makeCard(), ctx());
    const langs = head.links.filter((l) => l.rel === "alternate").map((l) => l.hrefLang);
    expect(langs).toContain("vi");
    expect(langs).toContain("en");
    expect(langs).toContain("x-default");
  });

  it("emits noindex and NO JSON-LD when not indexable (no crawl leakage)", () => {
    const head = buildProfileHead(makeCard(), ctx(false));
    expect(findMeta(head.meta, "name", "robots")?.content).toContain("noindex");
    expect(findMeta(head.meta, "name", "ai-crawlable")?.content).toBe("false");
    expect(head.scripts.length).toBe(0);
  });

  it("adds an Apple smart app banner only when an app id is configured", () => {
    const withApp = buildProfileHead(makeCard(), { ...ctx(), appleAppId: "123" });
    expect(findMeta(withApp.meta, "name", "apple-itunes-app")?.content).toContain("app-id=123");
    const without = buildProfileHead(makeCard(), ctx());
    expect(findMeta(without.meta, "name", "apple-itunes-app")).toBeUndefined();
  });
});

describe("sitemap generation", () => {
  it("builds an entry with absolute loc + lastmod", () => {
    const e = buildProfileSitemapEntry(ORIGIN, "abc", "2026-07-10T00:00:00.000Z");
    expect(e.loc).toBe(`${ORIGIN}/b/abc`);
    expect(e.lastmod).toBe("2026-07-10T00:00:00.000Z");
  });

  it("renders valid urlset XML and escapes special characters in loc", () => {
    const xml = renderSitemapXml([
      { loc: `${ORIGIN}/b/a?x=1&y=2`, changefreq: "weekly", priority: "0.7" },
      buildProfileSitemapEntry(ORIGIN, "c"),
    ]);
    expect(xml).toContain("<urlset");
    expect(xml).toContain("&amp;");
    expect(xml.match(/<url>/g)?.length).toBe(2);
  });
});

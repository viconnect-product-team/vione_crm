// Business Card Template Registry — 12 curated, industry-mapped templates.
// Each template is a superset of CardTheme (surface/accent/text/border) with
// added: industries, layout variant, typography pair, and a subtle motif hint.
//
// Data-driven only: templates are addressed by string id stored in
// business_cards.theme_id. Backward compatible with the legacy 7-theme set in
// card-themes.ts (both registries are consulted via resolveTheme).

import type { CardTheme } from "@/lib/card-themes";

export type CardIndustry =
  | "finance"
  | "law"
  | "insurance"
  | "luxury"
  | "hospitality"
  | "tech"
  | "saas"
  | "editorial"
  | "consulting"
  | "architecture"
  | "design"
  | "creative"
  | "photography"
  | "fashion"
  | "beauty"
  | "medical"
  | "healthcare"
  | "education"
  | "academia"
  | "realestate"
  | "government"
  | "nonprofit"
  | "manufacturing"
  | "logistics";

export type CardLayout = "classic" | "centered" | "sidebar" | "split" | "minimal";

export type CardTemplate = CardTheme & {
  industries: CardIndustry[];
  layout: CardLayout;
  /** Google Font family for headings (must be loaded in __root.tsx). */
  headingFont: string;
  /** Google Font family for body / labels. */
  bodyFont: string;
  /** Short marketing tagline shown in the gallery. */
  tagline: { vi: string; en: string };
  /** Subtle background motif (SVG pattern hint). */
  motif?: "hairline" | "diagonal" | "grid" | "dot" | "arc" | "none";
};

export const CARD_TEMPLATES: Record<string, CardTemplate> = {
  "navy-trust": {
    id: "navy-trust" as never,
    label: "Navy Trust",
    surface: "linear-gradient(160deg,#0f1b3d 0%,#122554 55%,#0a133a 100%)",
    accent: "#c9a84c",
    accentSoft: "rgba(201,168,76,0.18)",
    text: "#eef1f8",
    textMuted: "#9aa6c4",
    border: "rgba(201,168,76,0.28)",
    shine: false,
    industries: ["finance", "law", "insurance", "consulting"],
    layout: "classic",
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    tagline: { vi: "Uy tín, chuẩn mực tài chính – luật", en: "Institutional trust" },
    motif: "hairline",
  },
  "noir-gold": {
    id: "noir-gold" as never,
    label: "Noir & Gold",
    surface: "linear-gradient(160deg,#0b0b0d 0%,#161615 55%,#050505 100%)",
    accent: "#d9b26a",
    accentSoft: "rgba(217,178,106,0.22)",
    text: "#f5efe1",
    textMuted: "#b8ac93",
    border: "rgba(217,178,106,0.3)",
    shine: true,
    industries: ["luxury", "hospitality", "fashion"],
    layout: "centered",
    headingFont: "Cormorant Garamond",
    bodyFont: "Manrope",
    tagline: { vi: "Sang trọng, editorial cao cấp", en: "Editorial luxury" },
    motif: "arc",
  },
  "midnight-tech": {
    id: "midnight-tech" as never,
    label: "Midnight Tech",
    surface: "linear-gradient(160deg,#0a0f24 0%,#111a3d 55%,#060a1a 100%)",
    accent: "#67e8f9",
    accentSoft: "rgba(103,232,249,0.16)",
    text: "#eaf2ff",
    textMuted: "#8fa2c6",
    border: "rgba(103,232,249,0.22)",
    shine: false,
    industries: ["tech", "saas"],
    layout: "minimal",
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
    tagline: { vi: "Startup & SaaS hiện đại", en: "Modern SaaS" },
    motif: "grid",
  },
  "paper-ink": {
    id: "paper-ink" as never,
    label: "Paper & Ink",
    surface: "linear-gradient(180deg,#f7f4ec 0%,#efeadd 100%)",
    accent: "#111111",
    accentSoft: "rgba(17,17,17,0.08)",
    text: "#111111",
    textMuted: "#5a544a",
    border: "rgba(17,17,17,0.14)",
    shine: false,
    industries: ["editorial", "consulting"],
    layout: "split",
    headingFont: "Instrument Serif",
    bodyFont: "Inter",
    tagline: { vi: "Editorial, in ấn, tư vấn", en: "Editorial & consulting" },
    motif: "hairline",
  },
  "arch-mono": {
    id: "arch-mono" as never,
    label: "Architect Mono",
    surface: "linear-gradient(180deg,#1c1a17 0%,#0f0e0c 100%)",
    accent: "#c4653f",
    accentSoft: "rgba(196,101,63,0.2)",
    text: "#f0ece3",
    textMuted: "#a89e8c",
    border: "rgba(196,101,63,0.28)",
    shine: false,
    industries: ["architecture", "design"],
    layout: "sidebar",
    headingFont: "Space Grotesk",
    bodyFont: "JetBrains Mono",
    tagline: { vi: "Kiến trúc, studio thiết kế", en: "Architecture studio" },
    motif: "grid",
  },
  "studio-cream": {
    id: "studio-cream" as never,
    label: "Studio Cream",
    surface: "linear-gradient(180deg,#faf5ea 0%,#f0e6d2 100%)",
    accent: "#2a2a2a",
    accentSoft: "rgba(42,42,42,0.08)",
    text: "#1a1a1a",
    textMuted: "#6b6355",
    border: "rgba(42,42,42,0.14)",
    shine: false,
    industries: ["creative", "photography", "design"],
    layout: "centered",
    headingFont: "DM Serif Display",
    bodyFont: "Manrope",
    tagline: { vi: "Sáng tạo, nhiếp ảnh, art director", en: "Creative & photo" },
    motif: "none",
  },
  "couture-blush": {
    id: "couture-blush" as never,
    label: "Couture Blush",
    surface: "linear-gradient(160deg,#f6e2e0 0%,#efd0cb 55%,#e6bdb6 100%)",
    accent: "#8a3a3a",
    accentSoft: "rgba(138,58,58,0.14)",
    text: "#3a1a1a",
    textMuted: "#8a5c5c",
    border: "rgba(138,58,58,0.22)",
    shine: true,
    industries: ["fashion", "beauty"],
    layout: "centered",
    headingFont: "Cormorant Garamond",
    bodyFont: "Manrope",
    tagline: { vi: "Thời trang, làm đẹp cao cấp", en: "Fashion & beauty" },
    motif: "arc",
  },
  "clinical-white": {
    id: "clinical-white" as never,
    label: "Clinical White",
    surface: "linear-gradient(180deg,#ffffff 0%,#f2f6fb 100%)",
    accent: "#1f5aa8",
    accentSoft: "rgba(31,90,168,0.1)",
    text: "#0e1b2d",
    textMuted: "#5b6b82",
    border: "rgba(31,90,168,0.18)",
    shine: false,
    industries: ["medical", "healthcare"],
    layout: "classic",
    headingFont: "Manrope",
    bodyFont: "Inter",
    tagline: { vi: "Y tế, dược, phòng khám", en: "Medical & healthcare" },
    motif: "none",
  },
  "campus-oxford": {
    id: "campus-oxford" as never,
    label: "Campus Oxford",
    surface: "linear-gradient(160deg,#0d1b3d 0%,#111f47 55%,#3a0f1a 100%)",
    accent: "#e6c06a",
    accentSoft: "rgba(230,192,106,0.18)",
    text: "#f4efdc",
    textMuted: "#b9b19a",
    border: "rgba(230,192,106,0.24)",
    shine: false,
    industries: ["education", "academia"],
    layout: "split",
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    tagline: { vi: "Giáo dục, học thuật", en: "Education & academia" },
    motif: "hairline",
  },
  "emerald-estate": {
    id: "emerald-estate" as never,
    label: "Emerald Estate",
    surface: "linear-gradient(160deg,#062a26 0%,#0a3b34 55%,#03201c 100%)",
    accent: "#d4b171",
    accentSoft: "rgba(212,177,113,0.18)",
    text: "#eef7f3",
    textMuted: "#9fc0b6",
    border: "rgba(212,177,113,0.26)",
    shine: true,
    industries: ["realestate", "luxury"],
    layout: "sidebar",
    headingFont: "Playfair Display",
    bodyFont: "Manrope",
    tagline: { vi: "Bất động sản cao cấp", en: "Premium real estate" },
    motif: "arc",
  },
  "civic-navy": {
    id: "civic-navy" as never,
    label: "Civic Navy",
    surface: "linear-gradient(160deg,#0b2545 0%,#0f2f5a 55%,#05132a 100%)",
    accent: "#a7c4ee",
    accentSoft: "rgba(167,196,238,0.14)",
    text: "#eef4ff",
    textMuted: "#9db4d6",
    border: "rgba(167,196,238,0.2)",
    shine: false,
    industries: ["government", "nonprofit"],
    layout: "classic",
    headingFont: "Manrope",
    bodyFont: "Inter",
    tagline: { vi: "Cơ quan, tổ chức phi lợi nhuận", en: "Government & NGO" },
    motif: "hairline",
  },
  "industrial-slate": {
    id: "industrial-slate" as never,
    label: "Industrial Slate",
    surface: "linear-gradient(160deg,#1e242c 0%,#2b333e 55%,#12161c 100%)",
    accent: "#f0a24b",
    accentSoft: "rgba(240,162,75,0.18)",
    text: "#eef2f7",
    textMuted: "#9aa6b5",
    border: "rgba(240,162,75,0.24)",
    shine: false,
    industries: ["manufacturing", "logistics"],
    layout: "minimal",
    headingFont: "Space Grotesk",
    bodyFont: "JetBrains Mono",
    tagline: { vi: "Công nghiệp, sản xuất, logistics", en: "Industrial & logistics" },
    motif: "diagonal",
  },
};

export const CARD_TEMPLATE_LIST: CardTemplate[] = Object.values(CARD_TEMPLATES);

export const CARD_INDUSTRIES: CardIndustry[] = [
  "finance",
  "law",
  "insurance",
  "luxury",
  "hospitality",
  "tech",
  "saas",
  "editorial",
  "consulting",
  "architecture",
  "design",
  "creative",
  "photography",
  "fashion",
  "beauty",
  "medical",
  "healthcare",
  "education",
  "academia",
  "realestate",
  "government",
  "nonprofit",
  "manufacturing",
  "logistics",
];

export function getTemplate(id: string | null | undefined): CardTemplate | null {
  if (!id) return null;
  return CARD_TEMPLATES[id] ?? null;
}

export function templatesForIndustry(industry: CardIndustry | "all"): CardTemplate[] {
  if (industry === "all") return CARD_TEMPLATE_LIST;
  return CARD_TEMPLATE_LIST.filter((t) => t.industries.includes(industry));
}

/** Recommend the best template for a free-text industry hint (fuzzy match). */
export function recommendTemplate(hint: string | null | undefined): CardTemplate {
  const q = (hint ?? "").toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/(bank|finance|invest|kế toán|tài chính|ngân hàng|chứng khoán)/, "navy-trust"],
    [/(law|luật|attorney|counsel|legal)/, "navy-trust"],
    [/(insur|bảo hiểm)/, "navy-trust"],
    [/(luxury|hạng sang|resort|hotel|hospitality|khách sạn)/, "noir-gold"],
    [/(tech|dev|engineer|software|startup|saas|it)/, "midnight-tech"],
    [/(edit|publish|magazine|báo|tạp chí)/, "paper-ink"],
    [/(consult|tư vấn|advisor)/, "paper-ink"],
    [/(architect|kiến trúc|interior|nội thất)/, "arch-mono"],
    [/(design|studio|thiết kế|creative|sáng tạo|art)/, "studio-cream"],
    [/(photo|nhiếp ảnh|video|film)/, "studio-cream"],
    [/(fashion|thời trang|couture)/, "couture-blush"],
    [/(beauty|làm đẹp|spa|thẩm mỹ|cosmetic)/, "couture-blush"],
    [/(medic|clinic|hospital|y tế|dược|health|phòng khám|bệnh viện)/, "clinical-white"],
    [/(school|university|đại học|giáo dục|academic|research|nghiên cứu)/, "campus-oxford"],
    [/(real ?estate|bất động sản|property|nhà đất|realtor)/, "emerald-estate"],
    [/(government|chính phủ|nhà nước|ngo|non-?profit|phi lợi nhuận|hiệp hội)/, "civic-navy"],
    [/(manufactur|sản xuất|logistic|vận tải|công nghiệp|nhà máy)/, "industrial-slate"],
  ];
  for (const [re, id] of map) {
    if (re.test(q)) return CARD_TEMPLATES[id];
  }
  return CARD_TEMPLATES["navy-trust"];
}

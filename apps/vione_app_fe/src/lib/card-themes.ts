// Digital Membership Identity — theme + state system.
// Themes are data-driven (never hardcoded per member). An association may pin a
// theme; otherwise we derive a sensible default from its brand color.

export type CardThemeId =
  | "classic"
  | "executive"
  | "luxuryGold"
  | "government"
  | "university"
  | "business"
  | "dark";

export type CardTheme = {
  id: CardThemeId;
  label: string;
  /** CSS gradient for the card surface. */
  surface: string;
  /** Accent color (text/badges/QR frame). */
  accent: string;
  /** Softer accent used for glows/soft fills. */
  accentSoft: string;
  /** Primary text color on the card. */
  text: string;
  /** Muted text color on the card. */
  textMuted: string;
  /** Border color. */
  border: string;
  /** Whether the animated shine overlay is enabled. */
  shine: boolean;
};

export const CARD_THEMES: Record<CardThemeId, CardTheme> = {
  classic: {
    id: "classic",
    label: "Classic",
    surface: "linear-gradient(135deg,#0E1626 0%,#141E33 55%,#0B0F19 100%)",
    accent: "#7DD3FC",
    accentSoft: "rgba(125,211,252,0.18)",
    text: "#FFFFFF",
    textMuted: "#94A3B8",
    border: "rgba(125,211,252,0.25)",
    shine: true,
  },
  executive: {
    id: "executive",
    label: "Executive",
    surface: "linear-gradient(135deg,#1c2331 0%,#141a24 55%,#0b0f16 100%)",
    accent: "#c9d4e6",
    accentSoft: "rgba(201,212,230,0.16)",
    text: "#f2f5fa",
    textMuted: "#9aa7bd",
    border: "rgba(201,212,230,0.2)",
    shine: true,
  },
  luxuryGold: {
    id: "luxuryGold",
    label: "Luxury Gold",
    surface: "linear-gradient(135deg,#3a2a08 0%,#5c421a 45%,#1c1405 100%)",
    accent: "#ffd86b",
    accentSoft: "rgba(255,216,107,0.24)",
    text: "#fff7e4",
    textMuted: "#d8c79a",
    border: "rgba(255,216,107,0.4)",
    shine: true,
  },
  government: {
    id: "government",
    label: "Government",
    surface: "linear-gradient(135deg,#0C1A2E 0%,#10223B 55%,#081220 100%)",
    accent: "#7DD3FC",
    accentSoft: "rgba(125,211,252,0.16)",
    text: "#FFFFFF",
    textMuted: "#94A3B8",
    border: "rgba(125,211,252,0.22)",
    shine: false,
  },
  university: {
    id: "university",
    label: "University",
    surface: "linear-gradient(135deg,#3a0f1a 0%,#2a0b16 55%,#160509 100%)",
    accent: "#e6a4b4",
    accentSoft: "rgba(230,164,180,0.18)",
    text: "#fbeef1",
    textMuted: "#d1a3ad",
    border: "rgba(230,164,180,0.24)",
    shine: true,
  },
  business: {
    id: "business",
    label: "Business Association",
    surface: "linear-gradient(135deg,#062a26 0%,#04211d 55%,#021312 100%)",
    accent: "#5fd6b4",
    accentSoft: "rgba(95,214,180,0.18)",
    text: "#eafaf5",
    textMuted: "#9fc9bd",
    border: "rgba(95,214,180,0.22)",
    shine: true,
  },
  dark: {
    id: "dark",
    label: "Dark",
    surface: "linear-gradient(135deg,#1a1a1e 0%,#111114 55%,#08080a 100%)",
    accent: "#e6c06a",
    accentSoft: "rgba(230,192,106,0.16)",
    text: "#f2f2f4",
    textMuted: "#9a9aa6",
    border: "rgba(255,255,255,0.1)",
    shine: false,
  },
};

export const CARD_THEME_LIST: CardTheme[] = Object.values(CARD_THEMES);

/** Derive a default theme from the association brand color when none is pinned. */
export function themeFromBrand(brandPrimary: string | null): CardTheme {
  if (!brandPrimary) return CARD_THEMES.classic;
  const hex = brandPrimary.replace("#", "").slice(0, 6);
  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return CARD_THEMES.classic;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  if (g > r && g > b) return CARD_THEMES.business;
  if (b > r && b > g) return CARD_THEMES.government;
  if (r > 180 && g > 140 && b < 120) return CARD_THEMES.luxuryGold;
  if (r > b && r > g) return CARD_THEMES.university;
  return CARD_THEMES.classic;
}

export function resolveTheme(
  pinned: string | null | undefined,
  brandPrimary: string | null,
): CardTheme {
  if (pinned && pinned in CARD_THEMES) return CARD_THEMES[pinned as CardThemeId];
  return themeFromBrand(brandPrimary);
}

// ---------- Membership states ----------

export type MembershipState =
  | "active"
  | "expired"
  | "suspended"
  | "pendingRenewal"
  | "honorary"
  | "life";

export type StateStyle = {
  id: MembershipState;
  labelVi: string;
  labelEn: string;
  /** Tailwind-independent color for the badge. */
  color: string;
  bg: string;
};

export const STATE_STYLES: Record<MembershipState, StateStyle> = {
  active: {
    id: "active",
    labelVi: "Đang hoạt động",
    labelEn: "Active",
    color: "#3ddc84",
    bg: "rgba(61,220,132,0.16)",
  },
  expired: {
    id: "expired",
    labelVi: "Hết hạn",
    labelEn: "Expired",
    color: "#ef6b6b",
    bg: "rgba(239,107,107,0.16)",
  },
  suspended: {
    id: "suspended",
    labelVi: "Tạm ngưng",
    labelEn: "Suspended",
    color: "#f0a24b",
    bg: "rgba(240,162,75,0.16)",
  },
  pendingRenewal: {
    id: "pendingRenewal",
    labelVi: "Chờ gia hạn",
    labelEn: "Pending Renewal",
    color: "#f0d24b",
    bg: "rgba(240,210,75,0.16)",
  },
  honorary: {
    id: "honorary",
    labelVi: "Danh dự",
    labelEn: "Honorary",
    color: "#c9a4ff",
    bg: "rgba(201,164,255,0.16)",
  },
  life: {
    id: "life",
    labelVi: "Trọn đời",
    labelEn: "Life Member",
    color: "#7fd6ff",
    bg: "rgba(127,214,255,0.16)",
  },
};

/** Map a raw member status string + expiry into a normalized membership state. */
export function resolveState(
  rawStatus: string | null | undefined,
  validUntil: string | null,
): MembershipState {
  const s = (rawStatus ?? "").toLowerCase();
  if (s.includes("honorary") || s.includes("danh dự")) return "honorary";
  if (s.includes("life") || s.includes("trọn đời")) return "life";
  if (s.includes("suspend") || s.includes("ngưng")) return "suspended";
  if (s.includes("pending") || s.includes("renew") || s.includes("gia hạn"))
    return "pendingRenewal";
  if (validUntil) {
    const d = new Date(validUntil);
    if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now()) return "expired";
  }
  if (s.includes("expired") || s.includes("hết hạn")) return "expired";
  if (s === "active" || s.includes("active") || s.includes("hoạt động")) return "active";
  return "active";
}

/**
 * ViOne Platform - Brand Styling Constants
 * Bảng màu Vàng Đồng Champagne Gold Thượng Lưu & Nền Đen Thạch Anh Obsidian
 */

export const VIONE_BRAND_COLORS = {
  // Champagne Gold Palette
  gold: {
    primary: "#DFB76C",
    metallic: "#D4AF37",
    bright: "#F5C542",
    champagne: "#D8B282",
    pale: "#F6E1C3",
    light: "#FFF2DC",
    deep: "#B88E3E",
    darkText: "#996515",
    darkerText: "#8B6508",
  },
  // Obsidian Navy Dark Theme Palette
  obsidian: {
    bg: "#0B0F17",
    card: "#0E1522",
    surface2: "#151D2C",
    border: "rgba(216, 178, 130, 0.18)",
    borderSolid: "#25201A",
    textMuted: "#8E887F",
  },
  // Clean Light Theme Palette
  light: {
    bg: "#FFFFFF",
    card: "#FFFFFF",
    surface2: "#FAF8F5",
    border: "#E2E8F0",
    textMuted: "#64748B",
  },
} as const;

export const VIONE_ASSETS = {
  WORDMARK_PNG: "/vione-wordmark.png",
  DEFAULT_AVATAR: "/placeholder.svg",
  DEFAULT_COVER: "/placeholder.svg",
} as const;

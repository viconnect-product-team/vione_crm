export const darkColors = {
  // Backgrounds - Dark Obsidian luxury
  background: "#0A0A0B",
  backgroundSecondary: "#0F1424",
  backgroundDeep: "#05070A",
  
  // Surfaces & Cards
  surface: "#12151F",
  surface2: "#181D2A",
  surfaceLight: "#1D2436",
  surfaceElevated: "#232B40",
  surfaceBorder: "rgba(255, 255, 255, 0.08)",
  surfaceBorderLight: "rgba(255, 255, 255, 0.05)",
  surfaceBorderGold: "rgba(216, 178, 130, 0.45)",
  surfaceBorderActive: "rgba(216, 178, 130, 0.70)",

  // Luxury Bronze Gold (ViOne brand identity matching responsive PWA)
  gold: "#D8B282",
  goldLight: "#F6E1C3",
  goldDark: "#C29B69",
  goldBrown: "#8C653B",
  goldGradient: ["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"] as const,
  goldSoft: "rgba(216, 178, 130, 0.22)",

  // Royal Cobalt Navy accents
  navy: "#003B95",
  navyLight: "#0284C7",
  navyDark: "#00225A",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#F6E1C3",
  textMuted: "#94A3B8",
  textGold: "#D8B282",
  textDisabled: "#64748B",

  // Status & Utility
  success: "#10B981",
  successSoft: "rgba(16, 185, 129, 0.15)",
  warning: "#F59E0B",
  danger: "#EF4444",
  dangerSoft: "rgba(239, 68, 68, 0.15)",
  info: "#38BDF8",

  // Tab & Navigation
  tabBarBg: "#0A0A0B",
  tabBarBorder: "rgba(216, 178, 130, 0.18)",
  tabActive: "#D8B282",
  tabInactive: "#94A3B8",
};

export const lightColors = {
  // Backgrounds - Luxury Executive Light
  background: "#F8FAFC",
  backgroundSecondary: "#FFFFFF",
  backgroundDeep: "#F1F5F9",
  
  // Surfaces & Cards
  surface: "#FFFFFF",
  surface2: "#F8FAFC",
  surfaceLight: "#F1F5F9",
  surfaceElevated: "#FFFFFF",
  surfaceBorder: "rgba(15, 23, 42, 0.08)",
  surfaceBorderLight: "rgba(15, 23, 42, 0.04)",
  surfaceBorderGold: "rgba(180, 130, 80, 0.40)",
  surfaceBorderActive: "rgba(180, 130, 80, 0.70)",

  // Luxury Bronze Gold (ViOne brand identity on light mode)
  gold: "#A3703C",
  goldLight: "#FDF8F3",
  goldDark: "#7C4E1E",
  goldBrown: "#573512",
  goldGradient: ["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"] as const,
  goldSoft: "rgba(194, 155, 105, 0.16)",

  // Royal Cobalt Navy accents
  navy: "#003B95",
  navyLight: "#0284C7",
  navyDark: "#00225A",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#64748B",
  textGold: "#A3703C",
  textDisabled: "#94A3B8",

  // Status & Utility
  success: "#059669",
  successSoft: "rgba(5, 150, 105, 0.12)",
  warning: "#D97706",
  danger: "#DC2626",
  dangerSoft: "rgba(220, 38, 38, 0.12)",
  info: "#0284C7",

  // Tab & Navigation
  tabBarBg: "#FFFFFF",
  tabBarBorder: "rgba(15, 23, 42, 0.08)",
  tabActive: "#A3703C",
  tabInactive: "#64748B",
};

export type ColorTheme = typeof darkColors;

// Default export Colors points to darkColors for backwards compatibility
export const Colors = darkColors;

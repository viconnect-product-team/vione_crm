export const darkColors = {
  // Backgrounds - Translucent Obsidian Dark Glass & Champagne Gold (matching PWA --bc-mobile-bg)
  background: "#0B0F17",
  backgroundSecondary: "#0E1522",
  backgroundDeep: "#070B12",
  
  // Surfaces & Cards
  surface: "#0E1522",
  surface2: "#151D2C",
  surfaceLight: "#182133",
  surfaceElevated: "#1D283D",
  surfaceBorder: "rgba(255, 255, 255, 0.08)",
  surfaceBorderLight: "rgba(255, 255, 255, 0.05)",
  surfaceBorderGold: "rgba(216, 178, 130, 0.45)",
  surfaceBorderActive: "rgba(216, 178, 130, 0.70)",

  // Luxury Bronze Gold (ViOne brand identity matching responsive PWA)
  gold: "#D8B282",
  goldLight: "#F6E1C3",
  goldDark: "#C29B69",
  goldBrown: "#8C653B",
  goldGradient: ["#F6E1C3", "#E6C59E", "#D8B282", "#C29B69"] as const,
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

  // Tab & Navigation (Matching PWA BusinessConnectBottomNav)
  tabBarBg: "#0B0F17",
  tabBarBorder: "rgba(216, 178, 130, 0.18)",
  tabActive: "#D8B282",
  tabActiveLabel: "#D8B282",
  tabInactive: "#94A3B8",
  tabActivePill: "rgba(216, 178, 130, 0.22)",
  vButtonBorder: "#524128",
  vButtonGradient: ["#C29B69", "#F6E1C3", "#D8B282"] as const,
};

export const lightColors = {
  // Backgrounds - Luxury Executive Light (matching PWA light mode)
  background: "#FFFFFF",
  backgroundSecondary: "#FAF8F5",
  backgroundDeep: "#F8FAFC",
  
  // Surfaces & Cards
  surface: "#FFFFFF",
  surface2: "#FAF8F5",
  surfaceLight: "#F1F5F9",
  surfaceElevated: "#FFFFFF",
  surfaceBorder: "rgba(0, 0, 0, 0.08)",
  surfaceBorderLight: "rgba(0, 0, 0, 0.04)",
  surfaceBorderGold: "rgba(180, 130, 80, 0.40)",
  surfaceBorderActive: "rgba(180, 130, 80, 0.70)",

  // Luxury Bronze Gold (ViOne brand identity on light mode)
  gold: "#A3703C",
  goldLight: "#FDF8F3",
  goldDark: "#7C4E1E",
  goldBrown: "#573512",
  goldGradient: ["#F6E1C3", "#E6C59E", "#D8B282", "#C29B69"] as const,
  goldSoft: "rgba(163, 112, 60, 0.15)",

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

  // Tab & Navigation (Matching PWA BusinessConnectBottomNav)
  tabBarBg: "#FFFFFF",
  tabBarBorder: "#E2E8F0",
  tabActive: "#A3703C",
  tabActiveLabel: "#A3703C",
  tabInactive: "#64748B",
  tabActivePill: "rgba(163, 112, 60, 0.15)",
  vButtonBorder: "#FFF2DC",
  vButtonGradient: ["#C29B69", "#F6E1C3", "#D8B282"] as const,
};

export type ColorTheme = typeof darkColors;

// Default export Colors points to darkColors for backwards compatibility
export const Colors = darkColors;

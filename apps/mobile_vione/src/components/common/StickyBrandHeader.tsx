import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Sun, Moon } from "lucide-react-native";
import { ViOneLogo } from "../ViOneLogo";
import { useTheme } from "../../context/ThemeContext";

export function getVNTimeGreeting(): string {
  const now = new Date();
  const hour = now.getHours();
  const timeStr = `${String(hour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (hour >= 5 && hour < 12) return `Chào buổi sáng, ${timeStr}`;
  if (hour >= 12 && hour < 18) return `Chào buổi chiều, ${timeStr}`;
  return `Chào buổi tối, ${timeStr}`;
}

interface StickyBrandHeaderProps {
  rightActions?: React.ReactNode;
  showThemeToggle?: boolean;
  style?: ViewStyle;
}

export const StickyBrandHeader: React.FC<StickyBrandHeaderProps> = ({
  rightActions,
  showThemeToggle = true,
  style,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: isDark ? "rgba(11, 15, 23, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderBottomColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
        },
        style,
      ]}
    >
      <View style={styles.brandCol}>
        <ViOneLogo width={53} height={20} />
        <Text
          style={[
            styles.greetingText,
            { color: isDark ? "rgba(255, 255, 255, 0.75)" : "#64748B" },
          ]}
        >
          {getVNTimeGreeting()}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        {showThemeToggle && (
          <TouchableOpacity
            style={[
              styles.actionSquareBtn,
              {
                backgroundColor: isDark ? "rgba(22, 32, 50, 0.65)" : "#F1F5F9",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            {isDark ? (
              <Sun size={16} color="#F59E0B" strokeWidth={1.8} />
            ) : (
              <Moon size={16} color="#64748B" strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        )}
        {rightActions}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  brandCol: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 2,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
    letterSpacing: 0.1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionSquareBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
});

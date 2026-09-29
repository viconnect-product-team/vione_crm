import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "../../theme/colors";

interface LuxuryCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  highlight?: boolean;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({ children, style, highlight }) => {
  return (
    <View
      style={[
        styles.card,
        highlight && styles.cardHighlight,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHighlight: {
    borderColor: Colors.gold,
    backgroundColor: Colors.surfaceLight,
  },
});

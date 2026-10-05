import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Network, Users, User } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

interface CustomBottomTabBarProps extends BottomTabBarProps {
  onVPress: () => void;
}

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onVPress,
}) => {
  const { isDark } = useTheme();

  const activeColor = "#D8B282";
  const activeLabelColor = isDark ? "#D8B282" : "#926227";
  const inactiveColor = isDark ? "#94A3B8" : "#64748B";
  const barBg = isDark ? "#0A0A0B" : "#FFFFFF";
  const borderTopColor = isDark ? "rgba(216, 178, 130, 0.18)" : "#E2E8F0";

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? activeColor : inactiveColor;
    const size = 20;
    const strokeWidth = isFocused ? 2.3 : 1.7;

    switch (routeName) {
      case "Home":
        return <Home size={size} color={color} strokeWidth={strokeWidth} />;
      case "Network":
        return <Network size={size} color={color} strokeWidth={strokeWidth} />;
      case "Community":
        return <Users size={size} color={color} strokeWidth={strokeWidth} />;
      case "Me":
        return <User size={size} color={color} strokeWidth={strokeWidth} />;
      default:
        return <Home size={size} color={color} strokeWidth={strokeWidth} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case "Home":
        return "Trang chủ";
      case "Network":
        return "Network";
      case "Community":
        return "Cộng đồng";
      case "Me":
        return "Tôi";
      default:
        return routeName;
    }
  };

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: barBg }]}>
      <View
        style={[
          styles.tabBarInner,
          {
            backgroundColor: barBg,
            borderTopColor: borderTopColor,
            shadowColor: isDark ? "#000000" : "#64748B",
            shadowOpacity: isDark ? 0.6 : 0.08,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Chèn nút V mạ vàng ở chính giữa (giữa index 1 Network và index 2 Community)
          const isMiddle = index === 2;

          return (
            <React.Fragment key={route.key}>
              {isMiddle && (
                <View style={styles.vBtnHolder}>
                  <TouchableOpacity
                    style={styles.vBtnTouch}
                    onPress={onVPress}
                    activeOpacity={0.88}
                  >
                    <View style={styles.vBtnGlowRing}>
                      <LinearGradient
                        colors={["#F6E1C3", "#D8B282", "#C29B69", "#8C653B"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.vBtnGradient}
                      >
                        <Text style={styles.vBtnText}>V</Text>
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                {/* Active Indicator Top Line */}
                {isFocused && <View style={styles.activeIndicator} />}

                <View
                  style={[
                    styles.iconWrap,
                    isFocused && (isDark ? styles.iconWrapActive : { backgroundColor: "rgba(216, 178, 130, 0.2)" }),
                  ]}
                >
                  {getTabIcon(route.name, isFocused)}
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? activeLabelColor : inactiveColor },
                    isFocused && styles.tabLabelActive,
                  ]}
                >
                  {getTabLabel(route.name)}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: "#0A0A0B",
  },
  tabBarInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0A0B",
    borderTopWidth: 1,
    borderTopColor: "rgba(216, 178, 130, 0.18)",
    height: Platform.OS === "ios" ? 84 : 68,
    paddingBottom: Platform.OS === "ios" ? 22 : 8,
    paddingHorizontal: 10,
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -2,
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#D8B282",
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  iconWrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(216, 178, 130, 0.12)",
  },
  tabLabel: {
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "500",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#D8B282",
    fontWeight: "700",
  },
  vBtnHolder: {
    width: 68,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  vBtnTouch: {
    top: -18,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  vBtnGlowRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,
    backgroundColor: "rgba(216, 178, 130, 0.35)",
    borderWidth: 1.5,
    borderColor: "rgba(246, 225, 195, 0.6)",
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 12,
  },
  vBtnGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.8,
    borderColor: "#FFF2DC",
    shadowColor: "#F6E1C3",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  vBtnText: {
    color: "#050C15",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});


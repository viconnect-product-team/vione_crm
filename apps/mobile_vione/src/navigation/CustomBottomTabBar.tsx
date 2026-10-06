import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { VIconMark } from "../components/VIconMark";
import {
  NavHomeIcon,
  NavNetworkIcon,
  NavCommunityIcon,
  NavMeIcon,
} from "../components/NavIcons";

interface CustomBottomTabBarProps extends BottomTabBarProps {
  onVPress: () => void;
}

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onVPress,
}) => {
  const { isDark, colors } = useTheme();

  const activeColor = isDark ? "#D8B282" : "#A3703C";
  const activeLabelColor = isDark ? "#D8B282" : "#A3703C";
  const inactiveColor = isDark ? "#94A3B8" : "#64748B";
  const barBg = isDark ? "#0B0F17" : "#FFFFFF";
  const borderTopColor = isDark ? "rgba(216, 178, 130, 0.18)" : "#E2E8F0";

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? activeColor : inactiveColor;
    const size = 20;

    switch (routeName) {
      case "Home":
        return <NavHomeIcon size={size} color={color} />;
      case "Network":
        return <NavNetworkIcon size={size} color={color} />;
      case "Community":
        return <NavCommunityIcon size={size} color={color} />;
      case "Me":
        return <NavMeIcon size={size} color={color} />;
      default:
        return <NavHomeIcon size={size} color={color} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case "Home":
        return "Trang chủ";
      case "Network":
        return "Kết nối";
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
            shadowOpacity: isDark ? 0.5 : 0.08,
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
                    <LinearGradient
                      colors={["#C29B69", "#F6E1C3", "#D8B282"]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.vBtnGradient,
                        {
                          borderColor: isDark ? "#524128" : "#FFF2DC",
                        },
                      ]}
                    >
                      {/* Lớp phản chiếu ánh kim champagne giống PWA */}
                      <LinearGradient
                        colors={["rgba(255, 255, 255, 0.42)", "transparent"]}
                        start={{ x: 0.15, y: 0.15 }}
                        end={{ x: 0.8, y: 0.8 }}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                      <VIconMark size={32} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                {/* Chỉ báo tab đang chọn (Chỉ báo dải mạ vàng trên đỉnh - khớp PWA) */}
                {isFocused && (
                  <LinearGradient
                    colors={["#F6E1C3", "#E6C59E", "#D8B282", "#C29B69"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activeIndicator}
                  />
                )}

                <View
                  style={[
                    styles.iconWrap,
                    isFocused && {
                      backgroundColor: isDark
                        ? "rgba(216, 178, 130, 0.22)"
                        : "rgba(163, 112, 60, 0.15)",
                    },
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
    backgroundColor: "#0B0F17",
  },
  tabBarInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B0F17",
    borderTopWidth: 1,
    borderTopColor: "rgba(216, 178, 130, 0.18)",
    height: Platform.OS === "ios" ? 84 : 66,
    paddingBottom: Platform.OS === "ios" ? 22 : 6,
    paddingHorizontal: 8,
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: -1,
    width: 24,
    height: 3,
    borderRadius: 2,
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  iconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 28,
  },
  tabLabel: {
    color: "#94A3B8",
    fontSize: 10.5,
    fontWeight: "500",
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  vBtnHolder: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  vBtnTouch: {
    top: -18,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D8B282",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
  },
  vBtnGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    position: "relative",
    overflow: "hidden",
  },
});

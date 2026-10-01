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

interface CustomBottomTabBarProps extends BottomTabBarProps {
  onVPress: () => void;
}

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onVPress,
}) => {
  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? "#B45309" : "#64748B";
    const size = 21;
    const strokeWidth = isFocused ? 2.2 : 1.7;

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
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarInner}>
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
                    activeOpacity={0.85}
                  >
                    <View style={styles.vBtnGlowRing}>
                      <LinearGradient
                        colors={["#F8E7D1", "#D8B282", "#A67A47"]}
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

                <View style={styles.iconWrap}>
                  {getTabIcon(route.name, isFocused)}
                </View>

                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
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
    backgroundColor: "#FFFFFF",
  },
  tabBarInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    height: Platform.OS === "ios" ? 84 : 68,
    paddingBottom: Platform.OS === "ios" ? 22 : 8,
    paddingHorizontal: 10,
    position: "relative",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
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
    backgroundColor: "#B45309",
  },
  iconWrap: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "500",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#B45309",
    fontWeight: "700",
  },
  vBtnHolder: {
    width: 68,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  vBtnTouch: {
    top: -16,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  vBtnGlowRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    padding: 2,
    backgroundColor: "#FEF3C7",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  vBtnGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFBEB",
  },
  vBtnText: {
    color: "#2C1802",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
});

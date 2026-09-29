import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Home, Users, Compass, User } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../theme/colors";

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
    const color = isFocused ? Colors.gold : Colors.tabInactive;
    const size = 20;

    switch (routeName) {
      case "Home":
        return <Home size={size} color={color} />;
      case "Network":
        return <Users size={size} color={color} />;
      case "Community":
        return <Compass size={size} color={color} />;
      case "Me":
        return <User size={size} color={color} />;
      default:
        return <Home size={size} color={color} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case "Home":
        return "Trang chủ";
      case "Network":
        return "Mạng lưới";
      case "Community":
        return "Cộng đồng";
      case "Me":
        return "Hồ sơ";
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

          // Chèn nút V vàng ở chính giữa (giữa index 1 Network và index 2 Community)
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
                    <LinearGradient
                      colors={[Colors.goldLight, Colors.gold, Colors.goldDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.vBtnGradient}
                    >
                      <Text style={styles.vBtnText}>V</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                {/* Active Indicator Line */}
                {isFocused && <View style={styles.activeIndicator} />}

                <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
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
    backgroundColor: Colors.background,
  },
  tabBarInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBarBorder,
    height: Platform.OS === "ios" ? 84 : 68,
    paddingBottom: Platform.OS === "ios" ? 22 : 8,
    paddingHorizontal: 10,
    position: "relative",
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
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  iconWrap: {
    padding: 4,
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: Colors.goldSoft,
  },
  tabLabel: {
    color: Colors.tabInactive,
    fontSize: 10.5,
    fontWeight: "500",
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.gold,
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
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  vBtnGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.goldLight,
  },
  vBtnText: {
    color: "#05070E",
    fontSize: 26,
    fontWeight: "900",
  },
});

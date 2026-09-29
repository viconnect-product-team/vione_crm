import React, { useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

// Screens
import { LoginScreen } from "../screens/auth/LoginScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { NetworkScreen } from "../screens/network/NetworkScreen";
import { CommunityScreen } from "../screens/community/CommunityScreen";
import { ProfileScreen } from "../screens/me/ProfileScreen";

// Navigation & Modals
import { CustomBottomTabBar } from "./CustomBottomTabBar";
import { VActionSheet } from "../components/VActionSheet";
import { MyQrModal } from "../screens/quick-connect/MyQrModal";
import { ScanQrModal } from "../screens/quick-connect/ScanQrModal";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.surfaceBorder,
    primary: Colors.gold,
  },
};

const MainTabs: React.FC<{ onVPress: () => void }> = ({ onVPress }) => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} onVPress={onVPress} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Network" component={NetworkScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Me" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [vSheetVisible, setVSheetVisible] = useState(false);
  const [myQrVisible, setMyQrVisible] = useState(false);
  const [scanQrVisible, setScanQrVisible] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main">
            {() => <MainTabs onVPress={() => setVSheetVisible(true)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>

      {/* Global Quick Action Modals */}
      <VActionSheet
        visible={vSheetVisible}
        onClose={() => setVSheetVisible(false)}
        onOpenMyQr={() => setMyQrVisible(true)}
        onOpenScanQr={() => setScanQrVisible(true)}
      />

      <MyQrModal visible={myQrVisible} onClose={() => setMyQrVisible(false)} />
      <ScanQrModal visible={scanQrVisible} onClose={() => setScanQrVisible(false)} />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, MapPin, SlidersHorizontal, Phone } from "lucide-react-native";
import { styles } from "./home.styles";
import { resolveMediaUrl } from "../../../utils/media";

export interface EntrepreneurCardProps {
  isDark: boolean;
  user: any;
  hasLocationPermission: boolean;
  requestingLocation: boolean;
  handleRequestLocation: () => void;
  setMemberCardModalVisible: (v: boolean) => void;
  setTodayCustomizeVisible: (v: boolean) => void;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  isDark,
  user,
  hasLocationPermission,
  requestingLocation,
  handleRequestLocation,
  setMemberCardModalVisible,
  setTodayCustomizeVisible,
}) => {
  const displayName = user?.name || user?.displayName || "Doanh Nhân ViOne";
  const userPhone = user?.phone || "0988 888 888";
  const avatarInitial = displayName.trim().slice(0, 1).toUpperCase();
  const resolvedCover = resolveMediaUrl(user?.coverUrl);
  const resolvedAvatar = resolveMediaUrl(user?.avatarUrl);

  return (
    <>
        {/* 1. Thẻ Doanh Nhân ViOne (Identity Card with Cover Banner & Avatar) */}
        <TouchableOpacity
          style={[
            styles.identityCard,
            {
              backgroundColor: isDark ? "rgba(14, 21, 34, 0.85)" : "#FFFFFF",
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
            },
          ]}
          onPress={() => setMemberCardModalVisible(true)}
          activeOpacity={0.92}
        >
          {/* Ảnh bìa doanh nhân */}
          <View style={styles.coverBannerWrap}>
            <Image
              source={resolvedCover ? { uri: resolvedCover } : require("../../../../assets/vba-hero.jpg")}
              style={styles.coverBannerImg}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(10, 10, 11, 0.2)", "rgba(10, 10, 11, 0.75)"]}
              style={styles.coverGradient}
            />
          </View>

          {/* Thông tin doanh nhân: Left Info & Right Avatar */}
          <View style={styles.identityBody}>
            <View style={styles.identityLeft}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>DOANH NHÂN VIONE</Text>
              </View>
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.phoneRow}>
                <Phone size={13} color="#D8B282" style={{ marginRight: 5 }} />
                <Text style={styles.phoneText}>{userPhone}</Text>
              </View>
            </View>

            {/* Avatar tròn viền vàng sang trọng */}
            <View style={styles.avatarWrap}>
              {resolvedAvatar ? (
                <Image source={{ uri: resolvedAvatar }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={["#2A2016", "#14110E"]} style={styles.avatarCircle}>
                  <Text style={styles.avatarInitialText}>{avatarInitial}</Text>
                </LinearGradient>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Trạng thái chia sẻ vị trí AI & Định vị xung quanh (Matching 100% PWA) */}
        <View style={styles.locationBanner}>
          <View style={styles.locationLeft}>
            <View style={styles.locationDotWrap}>
              <View
                style={[
                  styles.locationDot,
                  { backgroundColor: hasLocationPermission ? "#10B981" : "#F59E0B" },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.locationTitleRow}>
                <MapPin size={13} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.locationTitle}>
                  {hasLocationPermission ? "Định vị AI: Đang chia sẻ vị trí" : "Định vị AI: Chưa bật vị trí"}
                </Text>
              </View>
              <Text style={styles.locationDesc} numberOfLines={1}>
                {hasLocationPermission
                  ? "Bán kính định vị AI sẵn sàng tìm kiếm đối tác & người dùng ViOne quanh bạn"
                  : "Bật quyền vị trí để AI quét và kết nối doanh nhân ở gần bạn nhất"}
              </Text>
            </View>
          </View>
          {!hasLocationPermission && (
            <TouchableOpacity
              style={[
                styles.enableLocationBtn,
                {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.18)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.6)",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                },
              ]}
              onPress={handleRequestLocation}
              disabled={requestingLocation}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  color: isDark ? "#D8B282" : "#B8860B",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {requestingLocation ? "Đang bật..." : "Bật vị trí"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

    </>
  );
};

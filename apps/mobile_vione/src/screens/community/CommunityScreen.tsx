import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, Calendar, MapPin, CheckCircle, ChevronRight, Award } from "lucide-react-native";
import { Colors } from "../../theme/colors";
import { LuxuryCard } from "../../components/common/LuxuryCard";
import { CommunityItem, B2BEvent } from "../../types";

const MOCK_COMMUNITIES: CommunityItem[] = [
  {
    id: "c-1",
    name: "CLB Doanh Nhân ViOne Global Leaders",
    description: "Cộng đồng quy tụ các Chủ tịch, CEO & Nhà sáng lập doanh nghiệp tiên phong kết nối & phát triển bền vững.",
    memberCount: 320,
    isMember: true,
    role: "Hội viên chính thức",
  },
  {
    id: "c-2",
    name: "ViOne C-Level Enterprise Hub",
    description: "Liên minh Doanh nghiệp Chuyển đổi số & Xúc tiến thương mại đa ngành toàn quốc.",
    memberCount: 450,
    isMember: true,
    role: "Thành viên sáng lập",
  },
  {
    id: "c-3",
    name: "Diễn Đàn Đầu Tư B2B Việt Nam",
    description: "Mạng lưới kết nối các Quỹ đầu tư, Vốn tư nhân và Doanh nghiệp vừa & lớn mở rộng quy mô.",
    memberCount: 310,
    isMember: false,
  },
];

const MOCK_EVENTS: B2BEvent[] = [
  {
    id: "e-1",
    title: "Đại Hội Thượng Đỉnh Giao Thương Doanh Nhân 2026",
    startsAt: "2026-10-15 08:30",
    location: "Trung Tâm Hội Nghị Quốc Gia, Hà Nội",
    category: "Đại Hội Toàn Thể",
    isRegistered: true,
    registeredCount: 185,
  },
  {
    id: "e-2",
    title: "Workshop Chuyên Đề: Ứng Dụng AI & Tự Động Hóa Vận Hành Doanh Nghiệp",
    startsAt: "2026-10-22 14:00",
    location: "Khách Sạn Lotte Hà Nội",
    category: "Hội Thảo Chuyên Đề",
    isRegistered: false,
    registeredCount: 92,
  },
  {
    id: "e-3",
    title: "Coffee CEO: Kết Nối 1-on-1 & Thảo Luận Cơ Hội Đầu Tư Quý 4",
    startsAt: "2026-10-28 09:00",
    location: "ViOne Executive Lounge",
    category: "Gặp Gỡ Định Kỳ",
    isRegistered: false,
    registeredCount: 45,
  },
];

export const CommunityScreen: React.FC = () => {
  const [events, setEvents] = useState<B2BEvent[]>(MOCK_EVENTS);

  const handleRegisterEvent = (id: string, title: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isRegistered: true } : e))
    );
    Alert.alert("Đăng ký thành công", `Bạn đã đăng ký tham gia: ${title}. Thẻ vé điện tử QR đã được lưu.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.screenTitle}>Cộng Đồng & Sự Kiện</Text>
        <Text style={styles.screenSubtitle}>
          Tham gia các liên minh doanh nghiệp và chuỗi sự kiện giao thương B2B
        </Text>

        {/* Communities Section */}
        <Text style={styles.sectionHeader}>CỘNG ĐỒNG CỦA BẠN</Text>
        {MOCK_COMMUNITIES.map((c) => (
          <LuxuryCard key={c.id} style={styles.communityCard}>
            <View style={styles.cardHeader}>
              <View style={styles.clubIconBadge}>
                <Award size={20} color={Colors.gold} />
              </View>
              <View style={styles.clubHeaderMeta}>
                <Text style={styles.clubName}>{c.name}</Text>
                <View style={styles.memberMetaRow}>
                  <Users size={12} color={Colors.goldLight} style={{ marginRight: 4 }} />
                  <Text style={styles.memberCountText}>{c.memberCount} Thành viên C-Level</Text>
                  {c.role && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{c.role}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <Text style={styles.clubDesc}>{c.description}</Text>

            <View style={styles.clubFooter}>
              {c.isMember ? (
                <View style={styles.memberStatus}>
                  <CheckCircle size={14} color={Colors.success} style={{ marginRight: 6 }} />
                  <Text style={styles.memberStatusText}>Đã tham gia</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => Alert.alert("Tham gia cộng đồng", `Đã gửi yêu cầu gia nhập ${c.name}`)}
                >
                  <Text style={styles.joinBtnText}>Gia nhập cộng đồng</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.detailBtn}
                onPress={() => Alert.alert(c.name, c.description || "")}
              >
                <Text style={styles.detailBtnText}>Xem ban điều hành</Text>
                <ChevronRight size={14} color={Colors.gold} />
              </TouchableOpacity>
            </View>
          </LuxuryCard>
        ))}

        {/* B2B Events Section */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>SỰ KIỆN GIAO THƯƠNG TIÊU ĐIỂM</Text>
        {events.map((e) => (
          <LuxuryCard key={e.id} style={styles.eventCard}>
            <View style={styles.eventCategoryRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{e.category}</Text>
              </View>
              <View style={styles.dateTag}>
                <Calendar size={12} color={Colors.gold} style={{ marginRight: 4 }} />
                <Text style={styles.dateText}>{e.startsAt}</Text>
              </View>
            </View>

            <Text style={styles.eventTitle}>{e.title}</Text>

            <View style={styles.eventLocationRow}>
              <MapPin size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={styles.eventLocationText}>{e.location}</Text>
            </View>

            <View style={styles.eventBottomRow}>
              <View style={styles.registeredCountBadge}>
                <Text style={styles.registeredCountText}>
                  🔥 {e.registeredCount} Doanh nhân đã đăng ký
                </Text>
              </View>

              {e.isRegistered ? (
                <View style={styles.registeredPill}>
                  <CheckCircle size={14} color={Colors.success} style={{ marginRight: 4 }} />
                  <Text style={styles.registeredPillText}>Đã có vé QR</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.eventActionBtn}
                  onPress={() => handleRegisterEvent(e.id, e.title)}
                >
                  <Text style={styles.eventActionText}>Đăng ký vé mời</Text>
                </TouchableOpacity>
              )}
            </View>
          </LuxuryCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  screenSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  sectionHeader: {
    color: Colors.goldLight,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
  },
  communityCard: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  clubIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.goldSoft,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  clubHeaderMeta: {
    flex: 1,
  },
  clubName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 6,
  },
  memberCountText: {
    color: Colors.goldLight,
    fontSize: 11,
  },
  roleBadge: {
    backgroundColor: Colors.navyDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.navyLight,
  },
  roleText: {
    color: Colors.info,
    fontSize: 9,
    fontWeight: "700",
  },
  clubDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  clubFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorderLight,
  },
  memberStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberStatusText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: "600",
  },
  joinBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinBtnText: {
    color: "#05070E",
    fontSize: 11,
    fontWeight: "700",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailBtnText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "600",
    marginRight: 2,
  },
  eventCard: {
    marginBottom: 12,
  },
  eventCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  dateTag: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: Colors.goldLight,
    fontSize: 11,
  },
  eventTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 8,
  },
  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventLocationText: {
    color: Colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  eventBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorderLight,
  },
  registeredCountBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  registeredCountText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  registeredPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  registeredPillText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: "700",
  },
  eventActionBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  eventActionText: {
    color: "#05070E",
    fontSize: 12,
    fontWeight: "700",
  },
});

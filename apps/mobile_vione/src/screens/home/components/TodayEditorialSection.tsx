import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Clock,
  MapPin,
  CalendarDays,
  Handshake,
  Video,
  Activity,
  Users,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Layers,
  Phone,
  QrCode,
  CreditCard,
  MessageSquare,
  Briefcase,
  Building2,
  Mic,
  Play,
  Pause,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react-native";
import { VIconMark } from "../../../components/VIconMark";
import { CommunityOpportunityItem } from "../../../components/OpportunityDetailModal";
import { TodayPreferences } from "../../../components/TodayCustomizeSheet";
import { VoiceMomentItem, TodayMeetingItem } from "./home.types";
import { styles } from "./home.styles";
import { resolveMediaUrl } from "../../../utils/media";

export interface TodayEditorialSectionProps {
  isDark: boolean;
  navigation?: any;
  activeTab: "today" | "all" | "upcoming" | "reminders" | "voice_moments";
  setActiveTab: (tab: "today" | "all" | "upcoming" | "reminders" | "voice_moments") => void;
  todayMeetings: any[];
  todayOpportunities: CommunityOpportunityItem[];
  todayPool: any[];
  upcomingEvents: any[];
  remindersList: any[];
  voiceMomentsList: VoiceMomentItem[];
  playingVoiceId: string | null;
  togglePlayVoice: (id: string) => void;
  todayPrefs: TodayPreferences;
  setSelectedEventForDetail: (ev: any) => void;
  setEventDetailModalVisible: (v: boolean) => void;
  setSelectedOpportunity: (opp: CommunityOpportunityItem) => void;
  setOpportunityDetailModalVisible: (v: boolean) => void;
  setSelectedPartnerForMeeting: (partner: { name: string; company: string } | null) => void;
  setScheduleMeetingVisible: (v: boolean) => void;
  setSelectedOpportunityForAi: (opp: any) => void;
  setAiAssistantVisible: (v: boolean) => void;
  setCalendarModalVisible: (v: boolean) => void;
  setPostMomentVisible: (v: boolean) => void;
  setTodayCustomizeVisible: (v: boolean) => void;
  onOpenV?: () => void;
}

export const TodayEditorialSection: React.FC<TodayEditorialSectionProps> = ({
  isDark,
  navigation,
  activeTab,
  setActiveTab,
  todayMeetings,
  todayOpportunities,
  todayPool,
  upcomingEvents,
  remindersList,
  voiceMomentsList,
  playingVoiceId,
  togglePlayVoice,
  todayPrefs,
  setSelectedEventForDetail,
  setEventDetailModalVisible,
  setSelectedOpportunity,
  setOpportunityDetailModalVisible,
  setSelectedPartnerForMeeting,
  setScheduleMeetingVisible,
  setSelectedOpportunityForAi,
  setAiAssistantVisible,
  setCalendarModalVisible,
  setPostMomentVisible,
  setTodayCustomizeVisible,
  onOpenV,
}) => {
  const getFormattedDate = () => {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}`;
  };
  const todayTotalCount = todayMeetings.length + todayOpportunities.length + todayPool.length;
  const allTotalCount = todayMeetings.length + todayOpportunities.length + upcomingEvents.length;
  return (
    <>
        {/* 2. Phân Hệ HÔM NAY (Editorial schedule: 4 TABS Khớp 100% PWA) */}
        <View style={styles.sectionToday}>
          <View style={styles.todayHeaderRow}>
            <Text
              style={[
                styles.todaySectionTitle,
                { color: isDark ? "#D8B282" : "#B8860B" },
              ]}
            >
              {activeTab === "all"
                ? "TẤT CẢ LỊCH TRÌNH & CÔNG VIỆC"
                : activeTab === "today"
                ? "HÔM NAY"
                : activeTab === "upcoming"
                ? "LỊCH TRÌNH SẮP TỚI"
                : activeTab === "reminders"
                ? "NHẮC LỊCH CUỘC GẶP & SỰ KIỆN"
                : "LỊCH SỬ KHOẢNG KHẮC GHI ÂM"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {activeTab === "today" && (
                <TouchableOpacity
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                  }}
                  onPress={() => setTodayCustomizeVisible(true)}
                  activeOpacity={0.7}
                >
                  <SlidersHorizontal size={14} color={isDark ? "#D8B282" : "#8C653B"} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.viewCalendarBtn}
                onPress={() => setCalendarModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.viewCalendarText,
                    { color: isDark ? "#D8B282" : "#8C653B" },
                  ]}
                >
                  Xem lịch
                </Text>
                <ChevronRight size={13} color={isDark ? "#D8B282" : "#8C653B"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ngày tiếng Việt động hoặc Tiêu đề Tab */}
          <Text
            style={[
              styles.todayDateTitle,
              { color: isDark ? "#FFFFFF" : "#0F172A" },
            ]}
          >
            {activeTab === "all"
              ? "Tất cả lịch trình & công việc"
              : activeTab === "today"
              ? getFormattedDate()
              : activeTab === "upcoming"
              ? "Sự kiện sắp diễn ra"
              : activeTab === "reminders"
              ? "Cuộc gặp & Nhắc hẹn"
              : "🎙️ Ghi âm khoảnh khắc"}
          </Text>

          {/* Bộ Segmented Tabs: Mặc định [Tất cả] trước, sau đó [Hôm nay] [Sắp tới] [Nhắc lịch] [Ghi âm] */}
          <View style={styles.tabsRow}>
            {/* Tab 1: Tất cả (MẶC ĐỊNH MỞ ĐẦU TIÊN THEO YÊU CẦU 5) */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "all" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("all")}
              activeOpacity={0.8}
            >
              <View style={styles.tabInactiveInner}>
                <Text
                  style={
                    activeTab === "all"
                      ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                      : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                  }
                >
                  Tất cả
                </Text>
                {allTotalCount > 0 && (
                  <View
                    style={[
                      styles.tabBadgeActive,
                      { backgroundColor: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeTextActive,
                        { color: isDark ? "#050C15" : "#FFFFFF" },
                      ]}
                    >
                      {allTotalCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Tab 2: Hôm nay */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "today" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("today")}
              activeOpacity={0.8}
            >
              <Text
                style={
                  activeTab === "today"
                    ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                    : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                }
              >
                Hôm nay {todayTotalCount > 0 ? `(${todayTotalCount})` : ""}
              </Text>
            </TouchableOpacity>

            {/* Tab 2: Sắp tới */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "upcoming" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("upcoming")}
              activeOpacity={0.8}
            >
              <View style={styles.tabInactiveInner}>
                <Text
                  style={
                    activeTab === "upcoming"
                      ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                      : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                  }
                >
                  Sắp tới
                </Text>
                {upcomingEvents.length > 0 && (
                  <View
                    style={[
                      styles.tabBadgeActive,
                      { backgroundColor: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeTextActive,
                        { color: isDark ? "#050C15" : "#FFFFFF" },
                      ]}
                    >
                      {upcomingEvents.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Tab 3: Nhắc lịch */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "reminders" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("reminders")}
              activeOpacity={0.8}
            >
              <View style={styles.tabInactiveInner}>
                <Text
                  style={
                    activeTab === "reminders"
                      ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                      : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                  }
                >
                  Nhắc lịch
                </Text>
                {remindersList.length > 0 && (
                  <View
                    style={[
                      styles.tabBadgeActive,
                      { backgroundColor: isDark ? "#D8B282" : "#8C653B" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeTextActive,
                        { color: isDark ? "#050C15" : "#FFFFFF" },
                      ]}
                    >
                      {remindersList.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Tab 4: Ghi âm khoảnh khắc (🎙️ Ghi âm) */}
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "voice_moments" && {
                  backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3",
                  borderColor: isDark ? "#D8B282" : "rgba(216, 178, 130, 0.7)",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setActiveTab("voice_moments")}
              activeOpacity={0.8}
            >
              <View style={styles.tabInactiveInner}>
                <Mic size={11} color="#EF4444" style={{ marginRight: 2 }} />
                <Text
                  style={
                    activeTab === "voice_moments"
                      ? [styles.tabPillTextActive, { color: isDark ? "#D8B282" : "#8C653B" }]
                      : [styles.tabPillTextInactive, { color: isDark ? "#94A3B8" : "#64748B" }]
                  }
                >
                  Ghi âm
                </Text>
                {voiceMomentsList.length > 0 && (
                  <View style={[styles.tabBadgeInactive, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                    <Text style={[styles.tabBadgeTextInactive, { color: "#EF4444" }]}>
                      {voiceMomentsList.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Nội dung Tab HÔM NAY (Đầy đủ: Lịch gặp hôm nay + Cơ hội mới cộng đồng + Sự kiện hôm nay) */}
          {activeTab === "today" && (
            todayTotalCount === 0 ? (
              <View style={styles.quietBox}>
                <View style={styles.quietIconWrap}>
                  <CheckCircle2 size={26} color="#D8B282" strokeWidth={1.8} />
                </View>
                <Text style={styles.quietTitle}>Hôm nay thật yên tĩnh</Text>
                <Text style={styles.quietSubtitle}>
                  Không có lịch hẹn, cơ hội mới hay sự kiện cần xử lý ngay. Hãy kết nối thêm doanh nhân mới!
                </Text>
                <TouchableOpacity
                  style={styles.openVBtn}
                  onPress={() => {
                    if (onOpenV) onOpenV();
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.vMiniEmblem}>
                    <VIconMark size={14} />
                  </View>
                  <Text style={styles.openVBtnText}>Mở V để kết nối</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {/* 1. LỊCH GẶP HÔM NAY */}
                {todayMeetings.length > 0 && (
                  <View style={styles.todaySubSection}>
                    <View style={styles.todaySubSectionHeader}>
                      <View style={styles.todaySubSectionTitleRow}>
                        <Handshake size={14} color="#DFB76C" style={{ marginRight: 6 }} />
                        <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          LỊCH GẶP HÔM NAY
                        </Text>
                      </View>
                      <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(223, 183, 108, 0.15)" : "#F6E1C3" }]}>
                        <Text style={[styles.todayCountBadgeText, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          {todayMeetings.length} cuộc hẹn
                        </Text>
                      </View>
                    </View>

                    {todayMeetings.map((meet) => (
                      <View key={meet.id} style={styles.eventCard}>
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.cardTag}>
                            <Handshake size={12} color="#D8B282" style={{ marginRight: 4 }} />
                            <Text style={styles.cardTagText}>Cuộc gặp 1-1 hôm nay</Text>
                          </View>
                          <Text style={styles.cardDate}>{meet.time} · Hôm nay</Text>
                        </View>
                        <Text style={styles.cardTitle}>{meet.title}</Text>

                        <View style={styles.partnerInfoRow}>
                          <Users size={13} color={isDark ? "#D4C3A3" : "#64748B"} style={{ marginRight: 5 }} />
                          <Text style={[styles.partnerInfoText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                            {meet.counterpart}
                          </Text>
                        </View>

                        <View style={styles.cardLocationRow}>
                          {meet.format === "online" ? (
                            <Video size={13} color="#10B981" style={{ marginRight: 4 }} />
                          ) : (
                            <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                          )}
                          <Text style={styles.cardLocationText}>{meet.location}</Text>
                        </View>

                        <View style={styles.todayMeetActionRow}>
                          {meet.format === "online" ? (
                            <TouchableOpacity
                              style={styles.meetPrimaryActionBtn}
                              onPress={() => Linking.openURL("https://meet.google.com/new")}
                              activeOpacity={0.8}
                            >
                              <Video size={13} color="#050C15" style={{ marginRight: 5 }} />
                              <Text style={styles.meetPrimaryActionText}>Vào phòng họp Meet</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.meetPrimaryActionBtn}
                              onPress={() => Linking.openURL("tel:0901234567")}
                              activeOpacity={0.8}
                            >
                              <Phone size={13} color="#050C15" style={{ marginRight: 5 }} />
                              <Text style={styles.meetPrimaryActionText}>Gọi đối tác</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.meetSecondaryActionBtn}
                            onPress={() => {
                              setSelectedPartnerForMeeting({
                                name: meet.counterpart,
                                company: "Doanh nghiệp Đối tác",
                              });
                              setScheduleMeetingVisible(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <CalendarDays size={13} color="#DFB76C" style={{ marginRight: 4 }} />
                            <Text style={styles.meetSecondaryActionText}>Đổi lịch</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 2. CƠ HỘI MỚI TỪ CỘNG ĐỒNG */}
                {todayOpportunities.length > 0 && (
                  <View style={styles.todaySubSection}>
                    <View style={styles.todaySubSectionHeader}>
                      <View style={styles.todaySubSectionTitleRow}>
                        <Briefcase size={14} color="#DFB76C" style={{ marginRight: 6 }} />
                        <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#DFB76C" : "#B8860B" }]}>
                          CƠ HỘI MỚI TỪ CỘNG ĐỒNG
                        </Text>
                      </View>
                      <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(223, 183, 108, 0.15)" : "#F6E1C3" }]}>
                        <Text style={[styles.todayCountBadgeText, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          {todayOpportunities.length} cơ hội mới
                        </Text>
                      </View>
                    </View>

                    {todayOpportunities.map((opp) => (
                      <View key={opp.id} style={styles.opportunityCard}>
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.oppCommunityTag}>
                            <Users size={12} color="#DFB76C" style={{ marginRight: 4 }} />
                            <Text style={styles.oppCommunityTagText}>{opp.communityName}</Text>
                          </View>
                          <View style={styles.oppNewBadge}>
                            <Sparkles size={10} color="#050C15" style={{ marginRight: 3 }} />
                            <Text style={styles.oppNewBadgeText}>CƠ HỘI MỚI</Text>
                          </View>
                        </View>

                        <Text style={styles.cardTitle}>{opp.title}</Text>

                        <View style={styles.oppOrgRow}>
                          <Building2 size={13} color={isDark ? "#D4C3A3" : "#64748B"} style={{ marginRight: 5 }} />
                          <Text style={[styles.oppOrgText, { color: isDark ? "#E2E8F0" : "#334155" }]}>
                            {opp.organization}
                          </Text>
                        </View>

                        <View style={styles.oppMetaRow}>
                          <View style={styles.oppDealBadge}>
                            <Text style={styles.oppDealBadgeText}>{opp.dealValue}</Text>
                          </View>
                          <Text style={[styles.oppCategoryText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                            {opp.category} · {opp.daysLeft}
                          </Text>
                        </View>

                        <View style={[styles.oppActionRow, { flexDirection: "row", gap: 8 }]}>
                          <TouchableOpacity
                            style={[styles.oppDetailBtn, { flex: 1, backgroundColor: "#DFB76C" }]}
                            onPress={() => {
                              setSelectedOpportunityForAi({
                                id: opp.id,
                                title: opp.title,
                                organization: opp.organization,
                                dealValue: opp.dealValue,
                              });
                              setAiAssistantVisible(true);
                            }}
                            activeOpacity={0.85}
                          >
                            <Mic size={13} color="#050C15" style={{ marginRight: 4 }} />
                            <Text style={styles.oppDetailBtnText}>Nhờ AI Gửi Voice</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.oppDetailBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9", borderWidth: 1, borderColor: isDark ? "#334155" : "#E2E8F0", paddingHorizontal: 12 }]}
                            onPress={() => {
                              navigation?.navigate("Community", {
                                communityId: opp.communityId || "c-b2b-leaders",
                                tab: "opportunities",
                                opportunityId: opp.id,
                              });
                            }}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.oppDetailBtnText, { color: isDark ? "#E2E8F0" : "#1E293B" }]}>Chi tiết</Text>
                            <ArrowRight size={13} color={isDark ? "#E2E8F0" : "#1E293B"} style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 3. SỰ KIỆN HÔM NAY */}
                {todayPool.length > 0 && (
                  <View style={styles.todaySubSection}>
                    <View style={styles.todaySubSectionHeader}>
                      <View style={styles.todaySubSectionTitleRow}>
                        <CalendarDays size={14} color="#DFB76C" style={{ marginRight: 6 }} />
                        <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          SỰ KIỆN HÔM NAY
                        </Text>
                      </View>
                      <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(223, 183, 108, 0.15)" : "#F6E1C3" }]}>
                        <Text style={[styles.todayCountBadgeText, { color: isDark ? "#DFB76C" : "#8C653B" }]}>
                          {todayPool.length} sự kiện
                        </Text>
                      </View>
                    </View>

                    {todayPool.map((ev) => (
                      <TouchableOpacity
                        key={ev.id}
                        style={styles.eventCard}
                        onPress={() => {
                          setSelectedEventForDetail(ev);
                          setEventDetailModalVisible(true);
                        }}
                        activeOpacity={0.85}
                      >
                        {ev.imageUrl ? (
                          <Image
                            source={{ uri: resolveMediaUrl(ev.imageUrl) || ev.imageUrl }}
                            style={styles.eventCardImage}
                            resizeMode="cover"
                          />
                        ) : null}
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.cardTag}>
                            <CalendarDays size={12} color="#D8B282" style={{ marginRight: 4 }} />
                            <Text style={styles.cardTagText}>{ev.community}</Text>
                          </View>
                          <Text style={styles.cardDate}>{ev.time} · Hôm nay</Text>
                        </View>
                        <Text style={styles.cardTitle}>{ev.title}</Text>
                        <View style={styles.cardLocationRow}>
                          <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                          <Text style={styles.cardLocationText}>{ev.location}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )
          )}

          {/* Nội dung Tab TẤT CẢ (Cuộc gặp của tài khoản nếu có + Cơ hội tại cộng đồng tham gia + Sự kiện sắp tới) */}
          {activeTab === "all" && (
            <View style={styles.listContainer}>
              {/* 1. CUỘC GẶP CỦA TÀI KHOẢN */}
              <View style={styles.todaySubSection}>
                <View style={styles.todaySubSectionHeader}>
                  <View style={styles.todaySubSectionTitleRow}>
                    <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#D8B282" : "#8C653B", fontWeight: "900" }]}>
                      CUỘC GẶP CỦA TÀI KHOẢN
                    </Text>
                  </View>
                  <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                    <Text style={[styles.todayCountBadgeText, { color: "#050C15", fontWeight: "700" }]}>
                      {todayMeetings.length} cuộc hẹn
                    </Text>
                  </View>
                </View>

                {todayMeetings.length > 0 ? (
                  todayMeetings.map((meet) => (
                    <View
                      key={meet.id}
                      style={[
                        styles.eventCard,
                        { borderColor: "#8C653B", borderWidth: 1, backgroundColor: isDark ? "#181410" : "#FFFDF9" },
                      ]}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.cardTag, { backgroundColor: "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                          <Text style={[styles.cardTagText, { color: "#050C15", fontWeight: "700" }]}>
                            [Cuộc gặp 1-1]
                          </Text>
                        </View>
                        <Text style={[styles.cardDate, { color: "#050C15", fontWeight: "600" }]}>
                          {meet.time} · {meet.date || "Hôm nay"}
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: "#050C15" }]}>{meet.title}</Text>
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 12, color: "#050C15" }}>
                          Đối tác: <Text style={{ fontWeight: "700" }}>{meet.counterpart}</Text>
                        </Text>
                        <Text style={{ fontSize: 12, color: "#050C15", marginTop: 2 }}>
                          Địa điểm: <Text style={{ fontWeight: "700" }}>{meet.location}</Text>
                        </Text>
                      </View>
                      <View style={styles.todayMeetActionRow}>
                        {meet.format === "online" ? (
                          <TouchableOpacity
                            style={[styles.meetPrimaryActionBtn, { backgroundColor: "#8C653B" }]}
                            onPress={() => Linking.openURL("https://meet.google.com/new")}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.meetPrimaryActionText, { color: "#FFFFFF", fontWeight: "700" }]}>
                              Vào phòng họp Meet
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.meetPrimaryActionBtn, { backgroundColor: "#8C653B" }]}
                            onPress={() => Linking.openURL("tel:0901234567")}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.meetPrimaryActionText, { color: "#FFFFFF", fontWeight: "700" }]}>
                              Gọi đối tác
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={[styles.quietBox, { borderColor: "#8C653B", borderWidth: 1, backgroundColor: "#FAF6F0" }]}>
                    <Text style={[styles.quietTitle, { color: "#050C15" }]}>
                      Tài khoản hiện chưa có cuộc gặp nào
                    </Text>
                  </View>
                )}
              </View>

              {/* 2. CƠ HỘI ĐANG CÓ TẠI CỘNG ĐỒNG THAM GIA */}
              <View style={styles.todaySubSection}>
                <View style={styles.todaySubSectionHeader}>
                  <View style={styles.todaySubSectionTitleRow}>
                    <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#D8B282" : "#8C653B", fontWeight: "900" }]}>
                      CƠ HỘI ĐANG CÓ TẠI CỘNG ĐỒNG THAM GIA
                    </Text>
                  </View>
                  <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                    <Text style={[styles.todayCountBadgeText, { color: "#050C15", fontWeight: "700" }]}>
                      {todayOpportunities.length} cơ hội
                    </Text>
                  </View>
                </View>

                {todayOpportunities.map((opp) => (
                  <View
                    key={opp.id}
                    style={[
                      styles.eventCard,
                      { borderColor: "#DFB76C", borderWidth: 1, backgroundColor: isDark ? "#181410" : "#FFFDF9" },
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.cardTag, { backgroundColor: "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                        <Text style={[styles.cardTagText, { color: "#050C15", fontWeight: "700" }]}>
                          {opp.communityName || "Cộng đồng ViOne"}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: "#8C653B", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>CƠ HỘI ĐANG CÓ</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardTitle, { color: "#050C15" }]}>{opp.title}</Text>
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: "#050C15" }}>
                        Đơn vị: <Text style={{ fontWeight: "700" }}>{opp.organization || "Doanh nghiệp thành viên"}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: "#050C15", marginTop: 2 }}>
                        Giá trị: <Text style={{ fontWeight: "800" }}>{opp.dealValue}</Text> · {opp.daysLeft}
                      </Text>
                    </View>
                    <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: isDark ? "rgba(223, 183, 108, 0.2)" : "rgba(223, 183, 108, 0.4)", paddingTop: 8, flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.meetPrimaryActionBtn, { flex: 1, backgroundColor: "#DFB76C" }]}
                        onPress={() => {
                          setSelectedOpportunityForAi({
                            id: opp.id,
                            title: opp.title,
                            organization: opp.organization,
                            dealValue: opp.dealValue,
                          });
                          setAiAssistantVisible(true);
                        }}
                        activeOpacity={0.85}
                      >
                        <Mic size={13} color="#050C15" style={{ marginRight: 4 }} />
                        <Text style={[styles.meetPrimaryActionText, { color: "#050C15", fontWeight: "700" }]}>
                          Nhờ AI Gửi Voice
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.meetPrimaryActionBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9", paddingHorizontal: 14 }]}
                        onPress={() => {
                          navigation.navigate("Community" as any, {
                            communityId: "c-b2b-leaders",
                            tab: "opportunities",
                            opportunityId: opp.id,
                          });
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.meetPrimaryActionText, { color: isDark ? "#E2E8F0" : "#1E293B", fontWeight: "700" }]}>
                          Chi tiết
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* 3. SỰ KIỆN SẮP TỚI */}
              <View style={styles.todaySubSection}>
                <View style={styles.todaySubSectionHeader}>
                  <View style={styles.todaySubSectionTitleRow}>
                    <Text style={[styles.todaySubSectionTitle, { color: isDark ? "#D8B282" : "#8C653B", fontWeight: "900" }]}>
                      SỰ KIỆN SẮP TỚI
                    </Text>
                  </View>
                  <View style={[styles.todayCountBadge, { backgroundColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                    <Text style={[styles.todayCountBadgeText, { color: "#050C15", fontWeight: "700" }]}>
                      {upcomingEvents.length} sự kiện
                    </Text>
                  </View>
                </View>

                {upcomingEvents.map((ev) => (
                  <View
                    key={ev.id}
                    style={[
                      styles.eventCard,
                      { borderColor: "#8C653B", borderWidth: 1, backgroundColor: isDark ? "#181410" : "#FFFDF9" },
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.cardTag, { backgroundColor: "#F6E1C3", borderColor: "#8C653B", borderWidth: 1 }]}>
                        <Text style={[styles.cardTagText, { color: "#050C15", fontWeight: "700" }]}>
                          {ev.community}
                        </Text>
                      </View>
                      <Text style={[styles.cardDate, { color: "#050C15", fontWeight: "600" }]}>
                        {ev.time} · {ev.date}
                      </Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: "#050C15" }]}>{ev.title}</Text>
                    <View style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: "#050C15" }}>
                        Địa điểm: <Text style={{ fontWeight: "700" }}>{ev.location}</Text>
                      </Text>
                    </View>
                    <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: "rgba(140, 101, 59, 0.2)", paddingTop: 8 }}>
                      <TouchableOpacity
                        style={[styles.meetPrimaryActionBtn, { backgroundColor: "#8C653B" }]}
                        onPress={() => {
                          setSelectedEventForDetail({
                            id: ev.id,
                            title: ev.title,
                            startsAt: `${ev.time} · ${ev.date}`,
                            location: ev.location,
                            category: ev.community,
                            isRegistered: true,
                            registeredCount: 88,
                          });
                          setEventDetailModalVisible(true);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.meetPrimaryActionText, { color: "#FFFFFF", fontWeight: "700" }]}>
                          Xem chi tiết sự kiện
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Nội dung Tab SẮP TỚI (Timeline & List sự kiện sắp tới) */}
          {activeTab === "upcoming" && (
            <View style={styles.listContainer}>
              {upcomingEvents.length === 0 ? (
                <View style={styles.quietBox}>
                  <CalendarDays size={28} color="#94A3B8" />
                  <Text style={styles.quietTitle}>Chưa có sự kiện sắp diễn ra</Text>
                </View>
              ) : (
                upcomingEvents.map((ev) => (
                  <TouchableOpacity
                    key={ev.id}
                    style={styles.eventCard}
                    onPress={() => {
                      setSelectedEventForDetail({
                        id: ev.id,
                        title: ev.title,
                        startsAt: `${ev.time} · ${ev.date}`,
                        location: ev.location,
                        category: ev.community,
                        isRegistered: true,
                        registeredCount: 88,
                      });
                      setEventDetailModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    {ev.imageUrl ? (
                      <Image
                        source={{ uri: resolveMediaUrl(ev.imageUrl) || ev.imageUrl }}
                        style={styles.eventCardImage}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardTag}>
                        <CalendarDays size={12} color="#D8B282" style={{ marginRight: 4 }} />
                        <Text style={styles.cardTagText}>{ev.community}</Text>
                      </View>
                      <Text style={styles.cardDate}>{ev.time} · {ev.date}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{ev.title}</Text>
                    <View style={styles.cardLocationRow}>
                      <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                      <Text style={styles.cardLocationText}>{ev.location}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {upcomingEvents.length > 0 && (
                <TouchableOpacity
                  style={styles.viewAllEventsRow}
                  onPress={() => Alert.alert("Lịch sự kiện", "Đang mở toàn bộ lịch hoạt động.")}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <CalendarDays size={15} color="#D8B282" />
                    <Text style={styles.viewAllEventsText}>
                      Xem tất cả ({upcomingEvents.length}) sự kiện trong lịch
                    </Text>
                  </View>
                  <ChevronRight size={15} color="#D8B282" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Nội dung Tab NHẮC LỊCH */}
          {activeTab === "reminders" && (
            <View style={styles.listContainer}>
              {remindersList.map((rem) => (
                <View key={rem.id} style={styles.eventCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTag}>
                      <Handshake size={12} color="#D8B282" style={{ marginRight: 4 }} />
                      <Text style={styles.cardTagText}>Cuộc gặp 1-1 đã hẹn</Text>
                    </View>
                    <Text style={styles.cardDate}>{rem.time} · {rem.date}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{rem.title}</Text>
                  <View style={styles.cardFooterRow}>
                    <View style={styles.cardLocationRow}>
                      {rem.format === "online" ? (
                        <Video size={13} color="#D8B282" style={{ marginRight: 4 }} />
                      ) : (
                        <MapPin size={13} color="#D4C3A3" style={{ marginRight: 4 }} />
                      )}
                      <Text style={styles.cardLocationText} numberOfLines={1}>
                        {rem.location}
                      </Text>
                    </View>

                    {rem.format === "online" ? (
                      <TouchableOpacity
                        style={styles.joinMeetingBtn}
                        onPress={() => Linking.openURL("https://meet.google.com/new")}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.joinMeetingBtnText}>Vào họp</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.confirmedPill}>
                        <Text style={styles.confirmedPillText}>Đã xác nhận</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Nội dung Tab GHI ÂM KHOẢNH KHẮC (Khớp 100% PWA) */}
          {activeTab === "voice_moments" && (
            <View style={styles.listContainer}>
              <View style={styles.voiceSectionHeader}>
                <Text style={styles.voiceSectionHeaderSub}>
                  Lưu vết khoảnh khắc giọng nói đã đồng bộ AI:
                </Text>
                <TouchableOpacity
                  style={styles.newVoiceBtn}
                  onPress={() => setPostMomentVisible(true)}
                  activeOpacity={0.7}
                >
                  <Mic size={12} color="#D8B282" style={{ marginRight: 4 }} />
                  <Text style={styles.newVoiceBtnText}>Ghi âm mới</Text>
                </TouchableOpacity>
              </View>

              {voiceMomentsList.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Mic size={24} color={isDark ? "rgba(255, 255, 255, 0.25)" : "#94A3B8"} />
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 12.5,
                      color: isDark ? "rgba(255, 255, 255, 0.45)" : "#64748B",
                    }}
                  >
                    Chưa có khoảnh khắc ghi âm nào
                  </Text>
                </View>
              ) : (
                voiceMomentsList.map((vm) => {
                  const isPlaying = playingVoiceId === vm.id;
                  return (
                    <View key={vm.id} style={styles.voiceCard}>
                      <View style={styles.voiceCardTop}>
                        <View style={styles.voiceMetaLeft}>
                          <View style={styles.voiceMicIcon}>
                            <Mic size={16} color="#EF4444" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.voiceCardTitle}>{vm.title}</Text>
                            <Text style={styles.voiceCardAuthor}>
                              {vm.author} · {vm.date} · {vm.duration}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.playVoiceBtn,
                            isPlaying ? styles.playVoiceBtnActive : styles.playVoiceBtnNormal,
                          ]}
                          onPress={() => togglePlayVoice(vm.id)}
                          activeOpacity={0.85}
                        >
                          {isPlaying ? (
                            <>
                              <Pause size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                              <Text style={styles.playVoiceBtnActiveText}>Tạm dừng</Text>
                            </>
                          ) : (
                            <>
                              <Play size={12} color="#050C15" style={{ marginRight: 4 }} />
                              <Text style={styles.playVoiceBtnText}>Phát lại</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>

                      {/* AI Transcript */}
                      {vm.transcript ? (
                        <View style={styles.voiceTranscriptBox}>
                          <Text style={styles.voiceTranscriptLabel}>Nội dung ghi âm AI: </Text>
                          <Text style={styles.voiceTranscriptText}>"{vm.transcript}"</Text>
                        </View>
                      ) : null}

                      {/* Waveform indicator when playing */}
                      {isPlaying && (
                        <View style={styles.waveformWrap}>
                          {[10, 16, 8, 20, 12, 18, 14, 8, 22, 10, 15, 6].map((h, i) => (
                            <View
                              key={i}
                              style={[styles.waveformBar, { height: h, backgroundColor: "#EF4444" }]}
                            />
                          ))}
                          <Text style={styles.waveformText}>Đang phát âm thanh gốc...</Text>
                        </View>
                      )}

                      {/* Footer */}
                      <View style={styles.voiceCardFooter}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <MapPin size={11} color="#F59E0B" style={{ marginRight: 4 }} />
                          <Text style={styles.voiceLocationText}>{vm.location}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

    </>
  );
};

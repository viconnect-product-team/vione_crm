import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Users,
  Calendar,
  MapPin,
  ChevronRight,
  Bell,
  Search,
  X,
  Plus,
  Sparkles,
  Briefcase,
  Clock,
  ShieldCheck,
  Handshake,
  Building2,
} from "lucide-react-native";
import { StickyBrandHeader } from "../../../components/common/StickyBrandHeader";
import { B2BEvent } from "../../../types";
import { CommunityOpportunityItem } from "../../../components/OpportunityDetailModal";
import {
  CommunityTab,
  DetailTab,
  CommunityDetailModel,
  getVNTimeGreeting,
  getCommunityVisuals,
} from "./community.types";
import { styles } from "./community.styles";
import { resolveMediaUrl } from "../../../utils/media";

export interface CommunityHomeScreenProps {
  isDark: boolean;
  unreadNotifCount: number;
  onOpenNotifications: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCreateCommunity: () => void;
  activeTab: CommunityTab;
  onChangeTab: (tab: CommunityTab) => void;
  hasAdmin: boolean;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  filteredCommunities: CommunityDetailModel[];
  onSelectCommunity: (id: string, tab?: DetailTab) => void;
  events: B2BEvent[];
  onSelectEvent: (event: B2BEvent) => void;
  onRegisterEvent: (event: B2BEvent) => void;
  opportunities: CommunityOpportunityItem[];
  onSelectOpportunity: (opp: CommunityOpportunityItem) => void;
  onProposeMeeting: (opp: CommunityOpportunityItem) => void;
}

export const CommunityHomeScreen: React.FC<CommunityHomeScreenProps> = ({
  isDark,
  unreadNotifCount,
  onOpenNotifications,
  refreshing,
  onRefresh,
  onOpenCreateCommunity,
  activeTab,
  onChangeTab,
  hasAdmin,
  searchQuery,
  onChangeSearchQuery,
  filteredCommunities,
  onSelectCommunity,
  events,
  onSelectEvent,
  onRegisterEvent,
  opportunities,
  onSelectOpportunity,
  onProposeMeeting,
}) => {
  return (
    <>
      {/* Sticky Header thương hiệu chung matching PWA 1:1 */}
          <StickyBrandHeader
            rightActions={
              <TouchableOpacity
                style={[
                  styles.headerSquareBtn,
                  {
                    backgroundColor: isDark ? "rgba(22, 32, 50, 0.65)" : "#F1F5F9",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
                onPress={() => onOpenNotifications()}
                activeOpacity={0.7}
              >
                <Bell size={16} color={isDark ? "#D8B282" : "#64748B"} strokeWidth={1.8} />
                {unreadNotifCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            }
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#DFB76C"
                colors={["#DFB76C"]}
              />
            }
          >
            {/* Title & Button Tạo cộng đồng */}
            <View style={styles.titleSection}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pageTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  Cộng đồng
                </Text>
                <Text style={[styles.pageSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                  Thành viên · Sự kiện · Cơ hội
                </Text>
              </View>

              <TouchableOpacity
                style={styles.createCommunityBtn}
                onPress={() => onOpenCreateCommunity()}
              >
                <LinearGradient
                  colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createCommunityGrad}
                >
                  <Plus size={16} color="#050C15" strokeWidth={2.5} />
                  <Text style={styles.createCommunityText}>Tạo cộng đồng</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs matching PWA: Tất cả, Doanh nghiệp của tôi, Mạng lưới B2B, Đang quản trị, Đã tham gia, Lịch sử yêu cầu */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
              style={styles.tabsWrapper}
            >
              {[
                { id: "all", label: "Tất cả" },
                { id: "company", label: "🏢 Doanh nghiệp của tôi" },
                { id: "networking", label: "🤝 Mạng lưới B2B" },
                ...(hasAdmin ? [{ id: "admin", label: "Đang quản trị" }] : []),
                { id: "joined", label: "Đã tham gia" },
                { id: "history", label: "Lịch sử yêu cầu" },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onChangeTab(item.id as any)}
                    style={[
                      styles.tabItem,
                      isActive && styles.tabItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isActive
                            ? "#D8B282"
                            : isDark
                            ? "#94A3B8"
                            : "#64748B",
                          fontWeight: isActive ? "800" : "500",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Ô tìm kiếm 100% chiều rộng nằm dưới Tabs */}
            <View
              style={[
                styles.searchBarContainer,
                {
                  backgroundColor: isDark ? "#121824" : "#F8FAFC",
                  borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                },
              ]}
            >
              <Search size={18} color="#D8B282" />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? "#FFFFFF" : "#0F172A" },
                ]}
                placeholder="Tìm cộng đồng, liên minh, sự kiện..."
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={searchQuery}
                onChangeText={onChangeSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => onChangeSearchQuery("")}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Nếu đang ở tab Lịch sử yêu cầu */}
            {activeTab === "history" ? (
              <View style={styles.historyPanel}>
                <View
                  style={[
                    styles.historyCard,
                    {
                      backgroundColor: isDark ? "#121824" : "#F8FAFC",
                      borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                    },
                  ]}
                >
                  <View style={styles.historyRow}>
                    <Building2 size={20} color="#D8B282" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.historyName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                        Diễn Đàn Đầu Tư B2B Việt Nam
                      </Text>
                      <Text style={styles.historyTime}>Yêu cầu gửi lúc 09:30 · Hôm qua</Text>
                    </View>
                    <View style={styles.pendingPill}>
                      <Text style={styles.pendingPillText}>Đang chờ duyệt</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Search result count */}
                {searchQuery.trim().length > 0 && (
                  <Text style={[styles.searchResultCount, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Kết quả tìm kiếm ({filteredCommunities.length})
                  </Text>
                )}

                {/* Danh Sách Thẻ Cộng Đồng */}
                {filteredCommunities.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Users size={36} color="#94A3B8" />
                    <Text style={[styles.emptyTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                      Không tìm thấy cộng đồng phù hợp
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                      Thử tìm kiếm với từ khóa khác hoặc tạo cộng đồng mới của riêng bạn.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.communitiesList}>
                    {filteredCommunities.map((community) => {
                      const visuals = getCommunityVisuals(
                        community.name,
                        community.logoUrl,
                        community.bannerUrl
                      );
                      const isCompany = community.communityType === "company_internal";

                      return (
                        <View
                          key={community.id}
                          style={[
                            styles.communityCard,
                            {
                              backgroundColor: isDark ? "#121824" : "#FFFFFF",
                              borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                            },
                          ]}
                        >
                          {/* Top Cover Banner */}
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                              onSelectCommunity(community.id, isCompany ? "tasks" : "opportunities");
                            }}
                            style={styles.cardBannerWrap}
                          >
                            <Image
                              source={{ uri: resolveMediaUrl(visuals.bannerUrl) || visuals.bannerUrl }}
                              style={styles.cardBannerImg}
                            />
                            <LinearGradient
                              colors={["transparent", "rgba(18, 24, 36, 0.85)"]}
                              style={styles.cardBannerGrad}
                            />

                            {/* Category Pill Tag */}
                            <View style={styles.cardCategoryBadge}>
                              {isCompany ? (
                                <View style={styles.companyPill}>
                                  <Text style={styles.companyPillText}>🏢 CÔNG TY NỘI BỘ</Text>
                                </View>
                              ) : (
                                <View style={styles.b2bPill}>
                                  <Text style={styles.b2bPillText}>🤝 MẠNG LƯỚI B2B</Text>
                                </View>
                              )}
                            </View>

                            {/* Member Status Badge */}
                            <View style={styles.cardRoleBadge}>
                              <Text style={styles.cardRoleText}>
                                {community.viewerRole === "admin" ? "Quản trị viên" : "Đã tham gia"}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Main Content Body */}
                          <View style={styles.cardBody}>
                            {/* Floating Avatar + Community Name */}
                            <View style={styles.cardAvatarRow}>
                              <Image
                                source={{ uri: resolveMediaUrl(visuals.avatarUrl) || visuals.avatarUrl }}
                                style={styles.cardAvatarImg}
                              />
                              <TouchableOpacity
                                style={styles.cardNameCol}
                                onPress={() => {
                                  onSelectCommunity(community.id, isCompany ? "tasks" : "opportunities");
                                }}
                              >
                                <View style={styles.nameChevronRow}>
                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.cardTitle,
                                      { color: isDark ? "#FFFFFF" : "#0F172A" },
                                    ]}
                                  >
                                    {community.name}
                                  </Text>
                                  <ChevronRight size={18} color="#D8B282" />
                                </View>
                                <Text
                                  numberOfLines={2}
                                  style={[
                                    styles.cardDesc,
                                    { color: isDark ? "#94A3B8" : "#64748B" },
                                  ]}
                                >
                                  {community.shortDescription || visuals.descFallback}
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {/* Overlapping Members Row & Quick Badges */}
                            <View
                              style={[
                                styles.cardMetaRow,
                                { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                              ]}
                            >
                              <View style={styles.attendeesGroup}>
                                <View style={styles.avatarStack}>
                                  {visuals.attendees.map((att, idx) => (
                                    <Image
                                      key={idx}
                                      source={{ uri: resolveMediaUrl(att) || att }}
                                      style={[
                                        styles.stackAvatar,
                                        { marginLeft: idx === 0 ? 0 : -8 },
                                      ]}
                                    />
                                  ))}
                                </View>
                                <Text style={styles.membersCountText}>
                                  {community.memberCount} thành viên
                                </Text>
                              </View>

                              <View style={styles.metricBadgesGroup}>
                                {community.upcomingEventsCount > 0 && (
                                  <View style={styles.metricBadgeGold}>
                                    <Text style={styles.metricBadgeGoldText}>
                                      {community.upcomingEventsCount} sự kiện
                                    </Text>
                                  </View>
                                )}
                                {community.openOpportunityCount > 0 && (
                                  <View style={styles.metricBadgeSlate}>
                                    <Text style={styles.metricBadgeSlateText}>
                                      {community.openOpportunityCount} cơ hội
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            {/* 3 Quick Action Buttons */}
                            <View
                              style={[
                                styles.cardActionsGrid,
                                {
                                  backgroundColor: isDark ? "#0B0F17" : "#F8FAFC",
                                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                                },
                              ]}
                            >
                              <TouchableOpacity
                                style={styles.actionCol}
                                onPress={() => {
                                  onSelectCommunity(community.id, "members");
                                }}
                              >
                                <Users size={14} color="#D8B282" />
                                <Text style={[styles.actionColText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                                  Thành viên
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.actionCol,
                                  {
                                    borderLeftWidth: 1,
                                    borderRightWidth: 1,
                                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                                  },
                                ]}
                                onPress={() => {
                                  onSelectCommunity(community.id, "events");
                                }}
                              >
                                <Calendar size={14} color="#D8B282" />
                                <Text style={[styles.actionColText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                                  Sự kiện
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.actionCol}
                                onPress={() => {
                                  onSelectCommunity(community.id, isCompany ? "tasks" : "opportunities");
                                }}
                              >
                                <Briefcase size={14} color="#D8B282" />
                                <Text style={[styles.actionColText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                                  {isCompany ? "Giao việc" : "Cơ hội"}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Sắp diễn ra trong cộng đồng (CommunityUpcomingEvents) */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Sắp diễn ra trong cộng đồng
                  </Text>
                  <TouchableOpacity onPress={() => Alert.alert("Sự kiện", "Đang mở toàn bộ sự kiện.")}>
                    <Text style={styles.sectionMoreText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.upcomingEventsList}>
                  {events.map((ev) => (
                    <TouchableOpacity
                      key={ev.id}
                      style={[
                        styles.upcomingEventCard,
                        {
                          backgroundColor: isDark ? "#121824" : "#FFFFFF",
                          borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => {
                        onSelectEvent(ev);
                      }}
                    >
                      <View style={styles.eventDateBox}>
                        <Text style={styles.eventMonthText}>THÁNG 10</Text>
                        <Text style={styles.eventDayText}>
                          {ev.startsAt.split(" ")[0].split("-")[2] || "15"}
                        </Text>
                      </View>

                      <View style={styles.eventInfoCol}>
                        <Text
                          numberOfLines={1}
                          style={[styles.eventTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                        >
                          {ev.title}
                        </Text>
                        <View style={styles.eventMetaRow}>
                          <Clock size={12} color="#D8B282" />
                          <Text style={styles.eventMetaText}>{ev.startsAt}</Text>
                        </View>
                        <View style={styles.eventMetaRow}>
                          <MapPin size={12} color="#94A3B8" />
                          <Text numberOfLines={1} style={styles.eventMetaText}>
                            {ev.location}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.eventRegisterBtn,
                          ev.isRegistered && styles.eventRegisteredBtn,
                        ]}
                        onPress={() => onRegisterEvent(ev)}
                      >
                        <Text
                          style={[
                            styles.eventRegisterBtnText,
                            ev.isRegistered && styles.eventRegisteredBtnText,
                          ]}
                        >
                          {ev.isRegistered ? "Đã đ.ký" : "Đăng ký"}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Cơ hội kinh doanh trong cộng đồng (CommunityOpportunitiesSection) */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Cơ hội kinh doanh trong cộng đồng
                  </Text>
                  <TouchableOpacity onPress={() => Alert.alert("Cơ hội", "Xem tất cả cơ hội B2B.")}>
                    <Text style={styles.sectionMoreText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.opportunitiesList}>
                  {opportunities.map((opp) => (
                    <TouchableOpacity
                      key={opp.id}
                      style={[
                        styles.opportunityCard,
                        {
                          backgroundColor: isDark ? "#121824" : "#FFFFFF",
                          borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => {
                        onSelectOpportunity(opp);
                      }}
                    >
                      <View style={styles.oppTopRow}>
                        <View style={styles.oppBadge}>
                          <Text style={styles.oppBadgeText}>{opp.category}</Text>
                        </View>
                        <Text style={styles.oppDaysLeft}>{opp.daysLeft}</Text>
                      </View>

                      <Text
                        numberOfLines={2}
                        style={[styles.oppTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                      >
                        {opp.title}
                      </Text>

                      <View style={styles.oppOrgRow}>
                        <Building2 size={13} color="#94A3B8" />
                        <Text numberOfLines={1} style={styles.oppOrgText}>
                          {opp.organization}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.oppFooterRow,
                          { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                        ]}
                      >
                        <View>
                          <Text style={styles.oppValueLabel}>Giá trị dự kiến</Text>
                          <Text style={styles.oppValueText}>{opp.dealValue}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.oppConnectBtn}
                          onPress={() => {
                            onProposeMeeting(opp);
                          }}
                        >
                          <LinearGradient
                            colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                            style={styles.oppConnectGrad}
                          >
                            <Handshake size={13} color="#050C15" />
                            <Text style={styles.oppConnectText}>Đề xuất gặp mặt</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Quản trị yêu cầu tham gia (CommunityJoinAdminEntry) */}
                {hasAdmin && (
                  <TouchableOpacity
                    style={[
                      styles.adminEntryCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => Alert.alert("Yêu cầu tham gia", "Hiện có 2 hồ sơ doanh nghiệp đang chờ bạn xét duyệt.")}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.adminEntryTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                        Quản trị yêu cầu tham gia
                      </Text>
                      <Text style={styles.adminEntrySubtitle}>
                        2 thành viên mới đang chờ phê duyệt
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#D8B282" />
                  </TouchableOpacity>
                )}
              </>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
    </>
  );
};

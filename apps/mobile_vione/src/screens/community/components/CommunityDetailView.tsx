import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Share,
  Linking,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Plus,
  Sparkles,
  Briefcase,
  Clock,
  ShieldCheck,
  Check,
  Phone,
  Mail,
  MessageSquare,
  Handshake,
  Star,
  Settings,
  ArrowLeft,
  UserPlus,
  AlertTriangle,
  Building2,
  Newspaper,
  Target,
  Share2,
  Eye,
} from "lucide-react-native";
import { B2BEvent } from "../../../types";
import { CommunityOpportunityItem } from "../../../components/OpportunityDetailModal";
import { MemberCardData } from "../../../components/MemberCardBottomSheet";
import {
  DetailTab,
  TaskFilterType,
  CommunityDetailModel,
  TaskItem,
  NewsPostItem,
  MemberItem,
  getCommunityVisuals,
  INITIAL_MEMBERS,
} from "./community.types";
import { styles } from "./community.styles";
import { resolveMediaUrl } from "../../../utils/media";

export interface CommunityDetailViewProps {
  isDark: boolean;
  currentCommunity: CommunityDetailModel;
  onBack: () => void;
  onOpenEdit: () => void;
  onOpenShareEvent: () => void;
  onOpenInvite: () => void;
  onJoinCommunity: (id: string) => void;
  detailTab: DetailTab;
  onChangeDetailTab: (tab: DetailTab) => void;
  taskFilter: TaskFilterType;
  onChangeTaskFilter: (filter: TaskFilterType) => void;
  refreshing: boolean;
  onRefresh: () => void;
  tasks: TaskItem[];
  filteredTasks: TaskItem[];
  totalTasks: number;
  myTasksCount: number;
  assignedTasksCount: number;
  inProgressTasksCount: number;
  completedTasksCount: number;
  acceptingTaskId: string | null;
  onAcceptTask: (task: TaskItem) => void;
  onCompleteTask: (task: TaskItem) => void;
  onOpenAssignTask: () => void;
  newsList: NewsPostItem[];
  setNewsList: React.Dispatch<React.SetStateAction<NewsPostItem[]>>;
  onOpenCreateNews: () => void;
  onSelectNews: (news: NewsPostItem) => void;
  opportunities: CommunityOpportunityItem[];
  onOpenCreateOpp: () => void;
  onSelectOpportunity: (opp: CommunityOpportunityItem) => void;
  onProposeMeeting: (opp: CommunityOpportunityItem) => void;
  events: B2BEvent[];
  onSelectEvent: (event: B2BEvent) => void;
  onRegisterEvent: (event: B2BEvent) => void;
  onSelectMember: (member: MemberCardData) => void;
}

export const CommunityDetailView: React.FC<CommunityDetailViewProps> = ({
  isDark,
  currentCommunity,
  onBack,
  onOpenEdit,
  onOpenShareEvent,
  onOpenInvite,
  onJoinCommunity,
  detailTab,
  onChangeDetailTab,
  taskFilter,
  onChangeTaskFilter,
  refreshing,
  onRefresh,
  tasks,
  filteredTasks,
  totalTasks,
  myTasksCount,
  assignedTasksCount,
  inProgressTasksCount,
  completedTasksCount,
  acceptingTaskId,
  onAcceptTask,
  onCompleteTask,
  onOpenAssignTask,
  newsList,
  setNewsList,
  onOpenCreateNews,
  onSelectNews,
  opportunities,
  onOpenCreateOpp,
  onSelectOpportunity,
  onProposeMeeting,
  events,
  onSelectEvent,
  onRegisterEvent,
  onSelectMember,
}) => {
  return (
    <>
      {currentCommunity && (
        <>
          {/* Top Bar with Back Button */}
          <View
            style={[
              styles.detailTopBar,
              {
                backgroundColor: isDark ? "rgba(11, 15, 23, 0.95)" : "rgba(255, 255, 255, 0.95)",
                borderBottomColor: isDark ? "rgba(216, 178, 130, 0.18)" : "#E2E8F0",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => onBack()}
            >
              <ArrowLeft size={20} color="#D8B282" />
              <Text style={styles.backButtonText}>Cộng đồng</Text>
            </TouchableOpacity>

            <Text
              numberOfLines={1}
              style={[styles.detailTopTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
            >
              {currentCommunity.name}
            </Text>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => Alert.alert("Chia sẻ", `Liên kết cộng đồng: ${currentCommunity.name}`)}
            >
              <Share2 size={18} color="#D8B282" />
            </TouchableOpacity>
          </View>

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
            {/* Top Cover Banner */}
            <View style={styles.detailBannerWrap}>
              <Image
                source={{
                  uri:
                    resolveMediaUrl(currentCommunity.bannerUrl) ||
                    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
                }}
                style={styles.detailBannerImg}
              />
              <LinearGradient
                colors={["transparent", "rgba(11, 15, 23, 0.85)"]}
                style={styles.detailBannerGrad}
              />

              {/* Category Pill Tag on Banner */}
              <View style={styles.detailCategoryPill}>
                {currentCommunity.communityType === "company_internal" ? (
                  <View style={styles.companyPill}>
                    <Text style={styles.companyPillText}>🏢 DOANH NGHIỆP NỘI BỘ</Text>
                  </View>
                ) : (
                  <View style={styles.b2bPill}>
                    <Text style={styles.b2bPillText}>🤝 MẠNG LƯỚI DOANH NHÂN B2B</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Overlapping Floating Avatar & Header Info */}
            <View style={styles.detailHeaderSection}>
              <Image
                source={{
                  uri:
                    resolveMediaUrl(currentCommunity.logoUrl) ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                }}
                style={styles.detailAvatarImg}
              />

              <View style={styles.detailInfoCol}>
                <Text style={[styles.detailNameText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                  {currentCommunity.name}
                </Text>
                {currentCommunity.shortDescription && (
                  <Text style={[styles.detailShortDesc, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    {currentCommunity.shortDescription}
                  </Text>
                )}
              </View>
            </View>

            {/* Quick Badges & Admin Actions */}
            <View style={styles.badgesActionRow}>
              <View style={styles.badgesGroup}>
                <View
                  style={[
                    styles.roleBadgePill,
                    {
                      backgroundColor: isDark ? "#151D2C" : "#F1F5F9",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Text style={[styles.roleBadgeText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Vai trò:{" "}
                    {currentCommunity.viewerRole === "admin"
                      ? "Quản trị viên"
                      : currentCommunity.isMember
                      ? "Thành viên chính thức"
                      : "Chưa tham gia"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.roleBadgePill,
                    {
                      backgroundColor: isDark ? "#151D2C" : "#F1F5F9",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Text style={[styles.roleBadgeText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    {currentCommunity.memberCount} thành viên
                  </Text>
                </View>
              </View>

              {/* Nút Mời Thành Viên */}
              <TouchableOpacity
                style={[
                  styles.editCommunityBtn,
                  { borderColor: "rgba(216, 178, 130, 0.4)" },
                ]}
                onPress={() => onOpenInvite()}
              >
                <Share2 size={13} color="#DFB76C" />
                <Text style={styles.editCommunityText}>Mời thành viên</Text>
              </TouchableOpacity>

              {/* Nút Quản Trị Viên: Chỉnh sửa cộng đồng */}
              {(currentCommunity.viewerRole === "admin" || currentCommunity.canEdit) && (
                <TouchableOpacity
                  style={styles.editCommunityBtn}
                  onPress={() => onOpenEdit()}
                >
                  <Settings size={14} color="#DFB76C" />
                  <Text style={styles.editCommunityText}>⚙️ Chỉnh sửa cộng đồng</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3 Nút Hành Động Theo Chuẩn 2 Kiểu Cộng Đồng (PWA 100%) */}
            {currentCommunity.communityType === "company_internal" ? (
              <View style={styles.actionButtons3Col}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    onChangeDetailTab("tasks");
                    onOpenAssignTask();
                  }}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Briefcase size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Giao việc</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    onChangeDetailTab("news");
                    onOpenCreateNews();
                  }}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Newspaper size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Đăng bài</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => onOpenShareEvent()}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Calendar size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Chia sẻ SK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actionButtons3Col}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => onOpenCreateOpp()}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Target size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Đăng cơ hội</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => {
                    onChangeDetailTab("news");
                    onOpenCreateNews();
                  }}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Newspaper size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Đăng bài</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => onOpenShareEvent()}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.actionBtnGrad}
                  >
                    <Calendar size={14} color="#050C15" />
                    <Text style={styles.actionBtnText}>+ Chia sẻ SK</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Gia nhập cộng đồng banner nếu chưa là thành viên */}
            {!currentCommunity.isMember && (
              <View style={styles.joinBannerCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.joinBannerTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Gia nhập cộng đồng
                  </Text>
                  <Text style={[styles.joinBannerSubtitle, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Tham gia để kết nối hội viên và cập nhật tin tức, sự kiện mới nhất.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.joinNowBtn}
                  onPress={() => onJoinCommunity(currentCommunity.id)}
                >
                  <LinearGradient
                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                    style={styles.joinNowGrad}
                  >
                    <UserPlus size={14} color="#050C15" />
                    <Text style={styles.joinNowText}>Tham gia ngay</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* 3 Quick Stat Tiles */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statTile,
                  {
                    backgroundColor: isDark ? "#121824" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                  },
                ]}
              >
                <Text style={styles.statValue}>{currentCommunity.memberCount}</Text>
                <Text style={styles.statLabel}>Thành viên</Text>
              </View>

              <View
                style={[
                  styles.statTile,
                  {
                    backgroundColor: isDark ? "#121824" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                  },
                ]}
              >
                <Text style={styles.statValue}>{currentCommunity.upcomingEventsCount}</Text>
                <Text style={styles.statLabel}>Sự kiện</Text>
              </View>

              <View
                style={[
                  styles.statTile,
                  {
                    backgroundColor: isDark ? "#121824" : "#F8FAFC",
                    borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                  },
                ]}
              >
                <Text style={styles.statValue}>
                  {currentCommunity.communityType === "company_internal"
                    ? tasks.length
                    : currentCommunity.openOpportunityCount}
                </Text>
                <Text style={styles.statLabel}>
                  {currentCommunity.communityType === "company_internal" ? "Việc nội bộ" : "Cơ hội B2B"}
                </Text>
              </View>
            </View>

            {/* Streamlined Navigation Tabs: Phân định rạch ròi 2 kiểu cộng đồng */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.detailTabsScroll}
              style={styles.detailTabsWrapper}
            >
              {(currentCommunity.communityType === "company_internal"
                ? [
                    { id: "tasks", label: "⚡ Giao việc & Nhận việc" },
                    { id: "supervision", label: "👁️ Giám sát CRM & Nhân sự" },
                    { id: "news", label: "Bài viết nội bộ" },
                    { id: "events", label: `Lịch họp & Sự kiện (${events.length})` },
                    { id: "members", label: "Hội viên" },
                  ]
                : [
                    { id: "opportunities", label: `⭐ Cơ hội B2B (${opportunities.length})` },
                    { id: "news", label: "Bài viết & Tin tức" },
                    { id: "events", label: `Sự kiện B2B (${events.length})` },
                    { id: "members", label: "Danh bạ đối tác" },
                  ]
              ).map((tab) => {
                const isSelected = detailTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => onChangeDetailTab(tab.id as any)}
                    style={[
                      styles.detailTabItem,
                      isSelected && styles.detailTabItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailTabLabel,
                        {
                          color: isSelected
                            ? "#DFB76C"
                            : isDark
                            ? "#94A3B8"
                            : "#64748B",
                          fontWeight: isSelected ? "800" : "500",
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {isSelected && <View style={styles.detailActiveIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ================================================================= */}
            {/* TAB: TASKS (CompanyTaskManagement with [⚡ TIẾN HÀNH NHẬN VIỆC]) */}
            {/* ================================================================= */}
            {detailTab === "tasks" && (
              <View style={styles.tasksSection}>
                {/* Top Banner KPI & Nút Giao Việc */}
                <View
                  style={[
                    styles.tasksKpiBanner,
                    {
                      backgroundColor: isDark ? "#121824" : "#FFFFFF",
                      borderColor: isDark ? "rgba(216, 178, 130, 0.3)" : "#E2E8F0",
                    },
                  ]}
                >
                  <View style={styles.tasksKpiHeaderRow}>
                    <View style={styles.tasksIconWrap}>
                      <Briefcase size={20} color="#D8B282" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.tasksBannerTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                        Phân Hệ Giao Việc & Nhận Việc
                      </Text>
                      <Text style={styles.tasksBannerSubtitle}>
                        Cộng đồng nội bộ công ty · Tự động hóa tiến độ 1-chạm
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.tasksNewBtn}
                      onPress={() => onOpenAssignTask()}
                    >
                      <LinearGradient
                        colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                        style={styles.tasksNewGrad}
                      >
                        <Plus size={14} color="#050C15" strokeWidth={2.5} />
                        <Text style={styles.tasksNewBtnText}>Giao việc</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* 4 Thống kê nhanh */}
                  <View
                    style={[
                      styles.tasks4KpiGrid,
                      { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                    ]}
                  >
                    <View style={[styles.kpiTileBox, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F1F5F9" }]}>
                      <Text style={[styles.kpiTileValue, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                        {totalTasks}
                      </Text>
                      <Text style={styles.kpiTileLabel}>Tổng việc</Text>
                    </View>

                    <View style={[styles.kpiTileBox, styles.kpiGoldBox]}>
                      <Text style={[styles.kpiTileValue, { color: "#DFB76C" }]}>
                        {assignedTasksCount}
                      </Text>
                      <Text style={[styles.kpiTileLabel, { color: "#DFB76C", fontWeight: "700" }]}>
                        Chờ nhận
                      </Text>
                    </View>

                    <View style={[styles.kpiTileBox, styles.kpiBlueBox]}>
                      <Text style={[styles.kpiTileValue, { color: "#38BDF8" }]}>
                        {inProgressTasksCount}
                      </Text>
                      <Text style={[styles.kpiTileLabel, { color: "#38BDF8" }]}>Đang làm</Text>
                    </View>

                    <View style={[styles.kpiTileBox, styles.kpiGreenBox]}>
                      <Text style={[styles.kpiTileValue, { color: "#10B981" }]}>
                        {completedTasksCount}
                      </Text>
                      <Text style={[styles.kpiTileLabel, { color: "#10B981" }]}>Đã xong</Text>
                    </View>
                  </View>
                </View>

                {/* Filter Tabs Nhiệm Vụ */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.taskFilterScroll}
                >
                  {[
                    { id: "all", label: `Tất cả (${totalTasks})` },
                    { id: "my_tasks", label: `⭐ Việc của tôi (${myTasksCount})` },
                    { id: "assigned", label: `⚡ Chờ nhận việc (${assignedTasksCount})` },
                    { id: "in_progress", label: `Đang làm (${inProgressTasksCount})` },
                    { id: "completed", label: `Đã xong (${completedTasksCount})` },
                  ].map((filterTab) => {
                    const isSelected = taskFilter === filterTab.id;
                    return (
                      <TouchableOpacity
                        key={filterTab.id}
                        onPress={() => onChangeTaskFilter(filterTab.id as any)}
                        style={[
                          styles.taskFilterPill,
                          {
                            backgroundColor: isSelected
                              ? "#DFB76C"
                              : isDark
                              ? "rgba(255, 255, 255, 0.05)"
                              : "#F1F5F9",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.taskFilterPillText,
                            {
                              color: isSelected
                                ? "#050C15"
                                : isDark
                                ? "#94A3B8"
                                : "#64748B",
                              fontWeight: isSelected ? "800" : "500",
                            },
                          ]}
                        >
                          {filterTab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Danh Sách Task Cards */}
                {filteredTasks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Briefcase size={32} color="#94A3B8" />
                    <Text style={[styles.emptyTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                      Không có công việc nào trong mục này
                    </Text>
                  </View>
                ) : (
                  <View style={styles.tasksListContainer}>
                    {filteredTasks.map((task) => {
                      const isAssigned = task.status === "assigned";
                      const isInProgress = task.status === "in_progress";
                      const isCompleted = task.status === "completed";

                      return (
                        <View
                          key={task.id}
                          style={[
                            styles.taskCard,
                            {
                              backgroundColor: isDark ? "#121824" : "#FFFFFF",
                              borderColor: isAssigned
                                ? "#DFB76C"
                                : isDark
                                ? "rgba(255, 255, 255, 0.1)"
                                : "#E2E8F0",
                            },
                            isAssigned && styles.taskCardAssignedGlow,
                          ]}
                        >
                          {/* Top Row: Priority Badge + Status Badge */}
                          <View style={styles.taskCardTopRow}>
                            <View style={styles.taskPriorityGroup}>
                              <View
                                style={[
                                  styles.priorityBadge,
                                  task.priority === "urgent"
                                    ? styles.priorityUrgent
                                    : task.priority === "high"
                                    ? styles.priorityHigh
                                    : styles.priorityMedium,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.priorityText,
                                    task.priority === "urgent"
                                      ? styles.priorityUrgentText
                                      : task.priority === "high"
                                      ? styles.priorityHighText
                                      : styles.priorityMediumText,
                                  ]}
                                >
                                  {task.priority === "urgent"
                                    ? "Khẩn cấp"
                                    : task.priority === "high"
                                    ? "Ưu tiên cao"
                                    : "Thường"}
                                </Text>
                              </View>

                              <View style={styles.taskDeadlineRow}>
                                <Clock size={11} color="#94A3B8" />
                                <Text style={styles.taskDeadlineText}>Hạn: {task.deadline}</Text>
                              </View>
                            </View>

                            {/* Status Indicator */}
                            <View>
                              {isAssigned && (
                                <View style={styles.statusAssignedPill}>
                                  <AlertTriangle size={11} color="#DFB76C" />
                                  <Text style={styles.statusAssignedText}>CHỜ NHẬN VIỆC</Text>
                                </View>
                              )}
                              {isInProgress && (
                                <View style={styles.statusProgressPill}>
                                  <Clock size={11} color="#38BDF8" />
                                  <Text style={styles.statusProgressText}>ĐANG THỰC HIỆN</Text>
                                </View>
                              )}
                              {isCompleted && (
                                <View style={styles.statusCompletedPill}>
                                  <CheckCircle2 size={11} color="#10B981" />
                                  <Text style={styles.statusCompletedText}>ĐÃ HOÀN THÀNH</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Tiêu đề & Mô tả */}
                          <Text style={[styles.taskTitleText, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                            {task.title}
                          </Text>
                          <Text style={[styles.taskDescText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                            {task.description}
                          </Text>

                          {/* Thông tin Nhân viên & Khách hàng */}
                          <View
                            style={[
                              styles.taskMetaRow,
                              { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                            ]}
                          >
                            <View style={styles.taskAssigneeRow}>
                              <Text style={styles.taskMetaMuted}>Nhân sự:</Text>
                              <Text style={[styles.taskMetaBold, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                                {task.assigneeName}
                              </Text>
                            </View>

                            {task.customerName && (
                              <View style={styles.taskCustomerRow}>
                                <Target size={12} color="#DFB76C" />
                                <Text
                                  numberOfLines={1}
                                  style={[styles.taskMetaBold, { color: isDark ? "#FFFFFF" : "#0F172A" }]}
                                >
                                  {task.customerName}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Timeline nhận việc nếu có */}
                          {task.acceptedAt && (
                            <View style={styles.acceptedAtRow}>
                              <View style={styles.acceptedDot} />
                              <Text style={styles.acceptedAtText}>
                                Đã nhận việc lúc:{" "}
                                {new Date(task.acceptedAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" · "}
                                {new Date(task.acceptedAt).toLocaleDateString("vi-VN")}
                              </Text>
                            </View>
                          )}

                          {/* HÀNG NÚT THAO TÁC THEO TRẠNG THÁI: [⚡ TIẾN HÀNH NHẬN VIỆC] */}
                          <View
                            style={[
                              styles.taskActionBottomRow,
                              { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                            ]}
                          >
                            {isAssigned ? (
                              <>
                                <Text style={styles.acceptPromptText}>
                                  Tài khoản nhân sự hãy xác nhận:
                                </Text>
                                <TouchableOpacity
                                  style={styles.acceptTaskBtn}
                                  disabled={acceptingTaskId === task.id}
                                  onPress={() => onAcceptTask(task)}
                                >
                                  <LinearGradient
                                    colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.acceptTaskGrad}
                                  >
                                    {acceptingTaskId === task.id ? (
                                      <ActivityIndicator size="small" color="#050C15" />
                                    ) : (
                                      <>
                                        <Sparkles size={14} color="#050C15" />
                                        <Text style={styles.acceptTaskBtnText}>
                                          TIẾN HÀNH NHẬN VIỆC
                                        </Text>
                                      </>
                                    )}
                                  </LinearGradient>
                                </TouchableOpacity>
                              </>
                            ) : isInProgress ? (
                              <>
                                <Text style={styles.inProgressPromptText}>
                                  Đang xử lý · Cập nhật khi xong:
                                </Text>
                                <TouchableOpacity
                                  style={styles.completeTaskBtn}
                                  onPress={() => onCompleteTask(task)}
                                >
                                  <Check size={14} color="#050C15" strokeWidth={2.5} />
                                  <Text style={styles.completeTaskBtnText}>Đánh dấu xong</Text>
                                </TouchableOpacity>
                              </>
                            ) : (
                              <View style={styles.completedStatusRow}>
                                <CheckCircle2 size={16} color="#10B981" />
                                <Text style={styles.completedStatusText}>
                                  Đã hoàn thành công việc
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: SUPERVISION (Giám sát CRM & Nhân sự)                         */}
            {/* ================================================================= */}
            {detailTab === "supervision" && (
              <View style={styles.supervisionSection}>
                <View
                  style={[
                    styles.supervisionCard,
                    {
                      backgroundColor: isDark ? "#121824" : "#FFFFFF",
                      borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                    },
                  ]}
                >
                  <Text style={[styles.supervisionTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                    Tổng Quan Hiệu Suất Vận Hành
                  </Text>
                  <View style={styles.supervisionMetricsRow}>
                    <View style={styles.supervisionMetricCol}>
                      <Text style={styles.supervisionMetricVal}>18</Text>
                      <Text style={styles.supervisionMetricLbl}>Nhân sự hoạt động</Text>
                    </View>
                    <View style={styles.supervisionMetricCol}>
                      <Text style={[styles.supervisionMetricVal, { color: "#10B981" }]}>94%</Text>
                      <Text style={styles.supervisionMetricLbl}>Tỷ lệ nhận việc</Text>
                    </View>
                    <View style={styles.supervisionMetricCol}>
                      <Text style={[styles.supervisionMetricVal, { color: "#DFB76C" }]}>5.5 Tỷ</Text>
                      <Text style={styles.supervisionMetricLbl}>Doanh số CRM</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: OPPORTUNITIES (Cơ hội B2B)                                   */}
            {/* ================================================================= */}
            {detailTab === "opportunities" && (
              <View style={styles.opportunitiesDetailSection}>
                {opportunities.map((opp) => (
                  <View
                    key={opp.id}
                    style={[
                      styles.opportunityCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.25)" : "#E2E8F0",
                      },
                    ]}
                  >
                    <View style={styles.oppTopRow}>
                      <View style={styles.oppBadge}>
                        <Text style={styles.oppBadgeText}>{opp.category}</Text>
                      </View>
                      <Text style={styles.oppDaysLeft}>{opp.daysLeft}</Text>
                    </View>

                    <Text style={[styles.oppTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                      {opp.title}
                    </Text>

                    <View style={styles.oppOrgRow}>
                      <Building2 size={13} color="#94A3B8" />
                      <Text style={styles.oppOrgText}>{opp.organization}</Text>
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
                  </View>
                ))}
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: NEWS (Tin tức & Bài viết)                                    */}
            {/* ================================================================= */}
            {detailTab === "news" && (
              <View style={styles.newsSection}>
                {/* Header "+ Đăng bài viết" */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={[styles.sectionHeaderSmall, { marginBottom: 0 }]}>
                    BẢN TIN & THÔNG BÁO ({newsList.length})
                  </Text>
                  <TouchableOpacity
                    style={{ borderRadius: 12, overflow: "hidden" }}
                    onPress={() => onOpenCreateNews()}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#F6E1C3", "#DFB76C", "#C99C47"]}
                      style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, gap: 5 }}
                    >
                      <Plus size={13} color="#050C15" strokeWidth={2.5} />
                      <Text style={{ fontSize: 11.5, fontWeight: "800", color: "#050C15" }}>Đăng bài</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {newsList.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.newsCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => {
                      onSelectNews(item);
                    }}
                    activeOpacity={0.88}
                  >
                    <View style={styles.newsAuthorRow}>
                      <Image source={{ uri: resolveMediaUrl(item.authorAvatar) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" }} style={styles.newsAuthorAvatar} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.newsAuthorName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                          {item.authorName}
                        </Text>
                        <Text style={styles.newsAuthorMeta}>
                          {item.authorTitle} · {item.timeAgo}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.newsTitle, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={3} style={[styles.newsContent, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                      {item.content}
                    </Text>

                    {item.imageUrl && (
                      <Image source={{ uri: resolveMediaUrl(item.imageUrl) || item.imageUrl }} style={styles.newsImage} />
                    )}

                    <View
                      style={[
                        styles.newsFooterRow,
                        { borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9" },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.newsStatBtn}
                        onPress={() => {
                          setNewsList((prev) =>
                            prev.map((n) =>
                              n.id === item.id ? { ...n, likes: n.likes + 1 } : n
                            )
                          );
                        }}
                      >
                        <Star size={14} color="#DFB76C" />
                        <Text style={styles.newsStatText}>{item.likes} Thích</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.newsStatBtn}
                        onPress={() => {
                          onSelectNews(item);
                        }}
                      >
                        <MessageSquare size={14} color="#94A3B8" />
                        <Text style={styles.newsStatText}>{item.comments} Thảo luận</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.newsStatBtn}
                        onPress={() => {
                          Share.share({
                            title: item.title,
                            message: `${item.title}\n\nXem bản tin trên ViOne B2B Network:\nhttps://vione.vn/news/${item.id}`,
                          });
                        }}
                      >
                        <Share2 size={13} color="#D8B282" />
                        <Text style={styles.newsStatText}>Chia sẻ</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: EVENTS (Lịch họp & Sự kiện)                                  */}
            {/* ================================================================= */}
            {detailTab === "events" && (
              <View style={styles.eventsSection}>
                {events.map((ev) => (
                  <View
                    key={ev.id}
                    style={[
                      styles.upcomingEventCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                      },
                    ]}
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
                  </View>
                ))}
              </View>
            )}

            {/* ================================================================= */}
            {/* TAB: MEMBERS (Danh bạ đối tác / Hội viên)                         */}
            {/* ================================================================= */}
            {detailTab === "members" && (
              <View style={styles.membersSection}>
                {INITIAL_MEMBERS.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.memberCard,
                      {
                        backgroundColor: isDark ? "#121824" : "#FFFFFF",
                        borderColor: isDark ? "rgba(216, 178, 130, 0.2)" : "#E2E8F0",
                      },
                    ]}
                    onPress={() => {
                      onSelectMember({
                        id: m.id,
                        name: m.name,
                        title: m.title,
                        company: m.company,
                        phone: m.phone,
                        email: m.email,
                        avatarUrl: m.avatarUrl,
                        role: m.role,
                      });
                    }}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: resolveMediaUrl(m.avatarUrl) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" }} style={styles.memberAvatar} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.memberNameRow}>
                        <Text style={[styles.memberName, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
                          {m.name}
                        </Text>
                        {m.role === "admin" && (
                          <View style={styles.adminRolePill}>
                            <Text style={styles.adminRoleText}>Admin</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberTitle}>{m.title}</Text>
                      <Text numberOfLines={1} style={styles.memberCompany}>
                        {m.company}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => {
                        onSelectMember({
                          id: m.id,
                          name: m.name,
                          title: m.title,
                          company: m.company,
                          phone: m.phone,
                          email: m.email,
                          avatarUrl: m.avatarUrl,
                          role: m.role,
                        });
                      }}
                    >
                      <MessageSquare size={16} color="#D8B282" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        </>
      )}
    </>
  );
};

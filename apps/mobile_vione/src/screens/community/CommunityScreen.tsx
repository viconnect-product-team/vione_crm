import React, { useState, useMemo, useEffect } from "react";
import {
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { B2BEvent } from "../../types";
import { CreateCommunityGroupModal } from "../../components/CreateCommunityGroupModal";
import { EventDetailModal } from "../../components/EventDetailModal";
import {
  OpportunityDetailModal,
  CommunityOpportunityItem,
} from "../../components/OpportunityDetailModal";
import { CreateOpportunityModal } from "../../components/CreateOpportunityModal";
import { ProposeOpportunityMeetingModal } from "../../components/ProposeOpportunityMeetingModal";
import { EditCommunityModal } from "../../components/EditCommunityModal";
import { ShareEventModal } from "../../components/ShareEventModal";
import { AssignTaskModal } from "../../components/AssignTaskModal";
import { CreateNewsModal } from "../../components/CreateNewsModal";
import { CommunityNewsDetailModal } from "../../components/CommunityNewsDetailModal";
import { CommunityInviteModal } from "../../components/CommunityInviteModal";
import { MemberCardBottomSheet, MemberCardData } from "../../components/MemberCardBottomSheet";
import { BusinessNotificationsModal } from "../../components/BusinessNotificationsModal";
import { communityApi, eventsApi, opportunityApi, meApi } from "../../api";
import { apiRequest } from "../../api/client";

import {
  CommunityType,
  CommunityTab,
  DetailTab,
  CommunityDetailModel,
  TaskItem,
  NewsPostItem,
  MemberItem,
  TaskFilterType,
  CommunityScreenProps,
  getVNTimeGreeting,
  getCommunityVisuals,
  INITIAL_COMMUNITIES,
  INITIAL_TASKS,
  INITIAL_OPPORTUNITIES,
  INITIAL_EVENTS,
  INITIAL_NEWS,
  INITIAL_MEMBERS,
} from "./components/community.types";
import { styles } from "./components/community.styles";
import { CommunityHomeScreen } from "./components/CommunityHomeScreen";
import { CommunityDetailView } from "./components/CommunityDetailView";

export {
  CommunityType,
  CommunityTab,
  DetailTab,
  CommunityDetailModel,
  TaskItem,
  NewsPostItem,
  MemberItem,
  TaskFilterType,
  getVNTimeGreeting,
  getCommunityVisuals,
};

export const CommunityScreen: React.FC<CommunityScreenProps> = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Navigation State: null = CommunityHome (Level 1); string = CommunityDetail (Level 2)
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    route?.params?.communityId || null
  );

  // Home Level 1 States
  const [activeTab, setActiveTab] = useState<CommunityTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<CommunityDetailModel[]>(INITIAL_COMMUNITIES);
  const [events, setEvents] = useState<B2BEvent[]>(INITIAL_EVENTS);
  const [opportunities, setOpportunities] = useState<CommunityOpportunityItem[]>(INITIAL_OPPORTUNITIES);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Detail Level 2 States
  const [detailTab, setDetailTab] = useState<DetailTab>(route?.params?.tab || "tasks");
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>(route?.params?.filter || "all");
  const [acceptingTaskId, setAcceptingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (route?.params?.communityId) {
      setSelectedCommunityId(route.params.communityId);
      if (route.params.tab) {
        setDetailTab(route.params.tab);
      }
      if (route.params.filter) {
        setTaskFilter(route.params.filter);
      }
      if (route.params.opportunityId) {
        const found = opportunities.find((o) => o.id === route.params?.opportunityId);
        if (found) {
          setSelectedOpp(found);
          setOppModalVisible(true);
        }
      }
    }
  }, [route?.params, opportunities]);

  // Modals
  const [createCommunityVisible, setCreateCommunityVisible] = useState(false);
  const [editCommunityVisible, setEditCommunityVisible] = useState(false);
  const [shareEventVisible, setShareEventVisible] = useState(false);
  const [assignTaskVisible, setAssignTaskVisible] = useState(false);
  const [createOppVisible, setCreateOppVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<B2BEvent | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<CommunityOpportunityItem | null>(null);
  const [oppModalVisible, setOppModalVisible] = useState(false);
  const [proposeMeetingVisible, setProposeMeetingVisible] = useState(false);
  const [selectedOppForMeeting, setSelectedOppForMeeting] = useState<CommunityOpportunityItem | null>(null);

  // Community News & Announcement states
  const [newsList, setNewsList] = useState<NewsPostItem[]>(INITIAL_NEWS);
  const [createNewsVisible, setCreateNewsVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsPostItem | null>(null);
  const [newsDetailVisible, setNewsDetailVisible] = useState(false);

  // Invite & Member Card Bottom Sheet states
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberCardData | null>(null);
  const [memberSheetVisible, setMemberSheetVisible] = useState(false);

  // Active community in Detail view
  const currentCommunity = useMemo(() => {
    if (!selectedCommunityId) return null;
    return communities.find((c) => c.id === selectedCommunityId) || communities[0];
  }, [selectedCommunityId, communities]);

  // Load backend data
  const loadData = async () => {
    try {
      const commRes = await communityApi.getMyCommunities();
      const commList = Array.isArray(commRes) ? commRes : (commRes as any)?.data || [];
      if (commList.length > 0) {
        setCommunities((prev) => {
          // Merge api items
          const mapped = commList.map((c: any) => {
            const isCompany =
              c.communityType === "company_internal" ||
              c.name?.toLowerCase().includes("công ty") ||
              c.name?.toLowerCase().includes("tập đoàn");
            return {
              id: c.id || c.communityId,
              name: c.name,
              shortDescription: c.shortDescription || c.description,
              description: c.description,
              logoUrl: c.logoUrl,
              bannerUrl: c.bannerUrl,
              communityType: (isCompany ? "company_internal" : "b2b_networking") as CommunityType,
              memberCount: c.memberCount || 24,
              viewerRole: (c.viewerRole || (c.role === "Ban Điều Hành" ? "admin" : "member")) as any,
              isMember: c.isMember ?? true,
              upcomingEventsCount: 2,
              openOpportunityCount: 3,
              canEdit: c.viewerRole === "admin",
            };
          });
          return mapped;
        });
      }
    } catch {
      // Keep initial
    }

    try {
      const eventsRes = await eventsApi.getEvents();
      const eventsList = Array.isArray(eventsRes) ? eventsRes : (eventsRes as any)?.data || [];
      if (eventsList.length > 0) {
        setEvents(eventsList);
      }
    } catch {
      // Keep initial
    }

    try {
      const oppRes = await opportunityApi.getOpportunities();
      const oppList = Array.isArray(oppRes) ? oppRes : (oppRes as any)?.data || [];
      if (oppList.length > 0) {
        setOpportunities(
          oppList.map((op: any, idx: number) => ({
            id: op.id || `opp-${idx}`,
            title: op.title || "Cơ hội kinh doanh B2B",
            organization: op.organization || op.companyName || "Doanh nghiệp ViOne",
            communityName: op.communityName || "Cộng đồng ViOne",
            dealValue: op.budget ? `${op.budget.toLocaleString("vi-VN")} đ` : op.dealValue || "Thỏa thuận",
            category: op.category || "Hợp tác kinh doanh",
            daysLeft: op.duration || "Còn 7 ngày",
            interested: !!op.interested,
          }))
        );
      }
    } catch {
      // Keep initial
    }

    try {
      const notifRes = await meApi.getUnreadNotificationCount();
      if (notifRes?.data?.count !== undefined) {
        setUnreadNotifCount(notifRes.data.count);
      }
    } catch {
      // ignore
    }
  };

  const loadTasks = async (commId: string) => {
    try {
      const res = await communityApi.getCommunityTasks(commId);
      const list = res?.data?.tasks || [];
      if (Array.isArray(list) && list.length > 0) {
        setTasks(
          list.map((t: any) => ({
            id: t.id,
            communityId: t.communityId || commId,
            title: t.title,
            description: t.description || "",
            assigneeId: t.assigneeId || "",
            assigneeName: t.assigneeName || "Nhân sự",
            assignerName: t.assignerName,
            priority: t.priority || "medium",
            status: t.status || "assigned",
            acceptedAt: t.acceptedAt || null,
            completedAt: t.completedAt || null,
            deadline: t.deadline || "Hôm nay",
            customerName: t.customerName,
            customerPhone: t.customerPhone,
            customerRequirements: t.customerRequirements,
            createdAt: t.createdAt || new Date().toISOString(),
          }))
        );
      }
    } catch (e) {
      console.warn("Failed to load community tasks:", e);
    }
  };

  useEffect(() => {
    if (selectedCommunityId) {
      loadTasks(selectedCommunityId);
    }
  }, [selectedCommunityId]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (selectedCommunityId) {
      await loadTasks(selectedCommunityId);
    }
    setRefreshing(false);
  };

  // Event handlers
  const handleRegisterEvent = async (event: B2BEvent) => {
    try {
      await eventsApi.registerEvent(event.id);
    } catch {
      // fallback
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, isRegistered: true } : e))
    );
    Alert.alert("Đăng ký thành công", `Bạn đã đăng ký tham gia: ${event.title}. Thẻ vé điện tử QR đã được cấp.`);
  };

  const handleInterestOpp = async (opp: CommunityOpportunityItem) => {
    try {
      await opportunityApi.expressInterest(opp.id, "high");
    } catch {
      // fallback
    }
    setOpportunities((prev) =>
      prev.map((o) => (o.id === opp.id ? { ...o, interested: true } : o))
    );
    Alert.alert("Quan tâm cơ hội", `Đã gửi hồ sơ năng lực và thông tin kết nối tới ban quản trị dự án: ${opp.title}`);
  };

  // ==========================================
  // [⚡ TIẾN HÀNH NHẬN VIỆC] Action (PWA Synchronized)
  // ==========================================
  const handleAcceptTask = async (task: TaskItem) => {
    setAcceptingTaskId(task.id);
    try {
      if (selectedCommunityId) {
        await communityApi.acceptCommunityTask(selectedCommunityId, task.id);
      }

      const nowStr = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "in_progress", acceptedAt: nowStr }
            : t
        )
      );

      Alert.alert(
        "✓ Nhận Việc Thành Công",
        `Bạn đã tiến hành nhận việc "${task.title}".\n\nHệ thống đã ghi nhận thời gian bắt đầu và thông báo tới Ban Giám Đốc.`,
        [{ text: "Đóng", style: "default" }]
      );
    } catch {
      Alert.alert("Lỗi", "Không thể nhận việc lúc này. Vui lòng thử lại!");
    } finally {
      setAcceptingTaskId(null);
    }
  };

  const handleCompleteTask = async (task: TaskItem) => {
    try {
      if (selectedCommunityId) {
        await communityApi.updateCommunityTaskStatus(selectedCommunityId, task.id, "completed");
      }
      const nowStr = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "completed", completedAt: nowStr }
            : t
        )
      );
      Alert.alert("Hoàn thành việc", `Đã hoàn tất nhiệm vụ: ${task.title}`);
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái nhiệm vụ. Vui lòng thử lại!");
    }
  };

  // Join community
  const handleJoinCommunity = (commId: string) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === commId
          ? { ...c, isMember: true, viewerRole: "member", memberCount: c.memberCount + 1 }
          : c
      )
    );
    Alert.alert("Thành công", "Bạn đã gia nhập cộng đồng thành công!");
  };

  // Filtered communities for Level 1 Home
  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      const isCompany = c.communityType === "company_internal";
      if (activeTab === "company" && !isCompany) return false;
      if (activeTab === "networking" && isCompany) return false;
      if (activeTab === "admin" && c.viewerRole !== "admin") return false;
      if (activeTab === "joined" && !c.isMember) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.shortDescription && c.shortDescription.toLowerCase().includes(q))
      );
    });
  }, [communities, activeTab, searchQuery]);

  const hasAdmin = communities.some((c) => c.viewerRole === "admin");

  // Đếm số lượng việc được giao cho chính tài khoản đang đăng nhập
  const myTasksCount = useMemo(() => {
    if (!user) return 0;
    const userName = (user.name || user.displayName || "").toLowerCase();
    const userEmail = (user.email || "").split("@")[0].toLowerCase();
    return tasks.filter((t) => {
      const taskAssignee = (t.assigneeName || "").toLowerCase();
      return (
        t.assigneeId === user.id ||
        (userName && taskAssignee.includes(userName)) ||
        (userEmail && taskAssignee.includes(userEmail))
      );
    }).length;
  }, [tasks, user]);

  // Filtered tasks in Level 2 Detail (Tất cả, ⭐ Việc của tôi, Chờ nhận việc, Đang làm, Đã xong)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === "all") return true;
      if (taskFilter === "my_tasks") {
        if (!user) return false;
        const userName = (user.name || user.displayName || "").toLowerCase();
        const userEmail = (user.email || "").split("@")[0].toLowerCase();
        const taskAssignee = (t.assigneeName || "").toLowerCase();
        return (
          t.assigneeId === user.id ||
          (userName && taskAssignee.includes(userName)) ||
          (userEmail && taskAssignee.includes(userEmail))
        );
      }
      return t.status === taskFilter;
    });
  }, [tasks, taskFilter, user]);

  const totalTasks = tasks.length;
  const assignedTasksCount = tasks.filter((t) => t.status === "assigned").length;
  const inProgressTasksCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#0B0F17" : "#FFFFFF" },
      ]}
      edges={["top"]}
    >
      {!selectedCommunityId && (
        <CommunityHomeScreen
          isDark={isDark}
          unreadNotifCount={unreadNotifCount}
          onOpenNotifications={() => setNotificationsVisible(true)}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onOpenCreateCommunity={() => setCreateCommunityVisible(true)}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          hasAdmin={hasAdmin}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          filteredCommunities={filteredCommunities}
          onSelectCommunity={(id, tab) => {
            setSelectedCommunityId(id);
            if (tab) setDetailTab(tab);
          }}
          events={events}
          onSelectEvent={(ev) => {
            setSelectedEvent(ev);
            setEventModalVisible(true);
          }}
          onRegisterEvent={handleRegisterEvent}
          opportunities={opportunities}
          onSelectOpportunity={(opp) => {
            setSelectedOpp(opp);
            setOppModalVisible(true);
          }}
          onProposeMeeting={(opp) => {
            setSelectedOppForMeeting(opp);
            setProposeMeetingVisible(true);
          }}
        />
      )}

      {selectedCommunityId && currentCommunity && (
        <CommunityDetailView
          isDark={isDark}
          currentCommunity={currentCommunity}
          onBack={() => setSelectedCommunityId(null)}
          onOpenEdit={() => setEditCommunityVisible(true)}
          onOpenShareEvent={() => setShareEventVisible(true)}
          onOpenInvite={() => setInviteModalVisible(true)}
          onJoinCommunity={handleJoinCommunity}
          detailTab={detailTab}
          onChangeDetailTab={setDetailTab}
          taskFilter={taskFilter}
          onChangeTaskFilter={setTaskFilter}
          refreshing={refreshing}
          onRefresh={onRefresh}
          tasks={tasks}
          filteredTasks={filteredTasks}
          totalTasks={totalTasks}
          myTasksCount={myTasksCount}
          assignedTasksCount={assignedTasksCount}
          inProgressTasksCount={inProgressTasksCount}
          completedTasksCount={completedTasksCount}
          acceptingTaskId={acceptingTaskId}
          onAcceptTask={handleAcceptTask}
          onCompleteTask={handleCompleteTask}
          onOpenAssignTask={() => setAssignTaskVisible(true)}
          newsList={newsList}
          setNewsList={setNewsList}
          onOpenCreateNews={() => setCreateNewsVisible(true)}
          onSelectNews={(item) => {
            setSelectedNews(item);
            setNewsDetailVisible(true);
          }}
          opportunities={opportunities}
          onOpenCreateOpp={() => setCreateOppVisible(true)}
          onSelectOpportunity={(opp) => {
            setSelectedOpp(opp);
            setOppModalVisible(true);
          }}
          onProposeMeeting={(opp) => {
            setSelectedOppForMeeting(opp);
            setProposeMeetingVisible(true);
          }}
          events={events}
          onSelectEvent={(ev) => {
            setSelectedEvent(ev);
            setEventModalVisible(true);
          }}
          onRegisterEvent={handleRegisterEvent}
          onSelectMember={(m) => {
            setSelectedMember(m);
            setMemberSheetVisible(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ALL MODALS (Aligned 100% with PWA)                                        */}
      {/* ========================================================================= */}

      {/* Modal Tạo cộng đồng mới */}
      <CreateCommunityGroupModal
        visible={createCommunityVisible}
        onClose={() => setCreateCommunityVisible(false)}
        onGroupCreated={(newGroup) => {
          const mapped: CommunityDetailModel = {
            id: newGroup.id,
            name: newGroup.name,
            shortDescription: newGroup.description,
            description: newGroup.description,
            communityType: "b2b_networking",
            memberCount: 1,
            viewerRole: "admin",
            isMember: true,
            upcomingEventsCount: 0,
            openOpportunityCount: 0,
            canEdit: true,
          };
          setCommunities((prev) => [mapped, ...prev]);
        }}
      />

      {/* Modal Chỉnh sửa cộng đồng */}
      {currentCommunity && (
        <EditCommunityModal
          visible={editCommunityVisible}
          onClose={() => setEditCommunityVisible(false)}
          communityId={currentCommunity.id}
          currentName={currentCommunity.name}
          currentTagline={currentCommunity.shortDescription}
          currentAbout={currentCommunity.description}
          currentLogoUrl={currentCommunity.logoUrl}
          currentBannerUrl={currentCommunity.bannerUrl}
          currentType={currentCommunity.communityType}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Modal Chia sẻ sự kiện */}
      {currentCommunity && (
        <ShareEventModal
          visible={shareEventVisible}
          onClose={() => setShareEventVisible(false)}
          communityId={currentCommunity.id}
          communityName={currentCommunity.name}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Modal Giao việc nội bộ */}
      {currentCommunity && (
        <AssignTaskModal
          visible={assignTaskVisible}
          onClose={() => setAssignTaskVisible(false)}
          communityId={currentCommunity.id}
          onTaskCreated={(newTask) => {
            setTasks((prev) => [newTask, ...prev]);
          }}
        />
      )}

      {/* Modal Tạo cơ hội mới */}
      <CreateOpportunityModal
        visible={createOppVisible}
        onClose={() => setCreateOppVisible(false)}
        onCreate={(newOpp) => {
          setOpportunities((prev) => [newOpp, ...prev]);
        }}
      />

      {/* Modal Đề xuất gặp mặt 1-1 */}
      {selectedOppForMeeting && (
        <ProposeOpportunityMeetingModal
          visible={proposeMeetingVisible}
          onClose={() => {
            setProposeMeetingVisible(false);
            setSelectedOppForMeeting(null);
          }}
          opportunityId={selectedOppForMeeting.id}
          opportunityTitle={selectedOppForMeeting.title}
          posterName={selectedOppForMeeting.organization}
          onProposed={() => {
            Alert.alert(
              "Thành công",
              `Đã gửi đề xuất gặp mặt 1-1 cho dự án "${selectedOppForMeeting.title}"!`
            );
          }}
        />
      )}

      {/* Modal Chi tiết sự kiện */}
      <EventDetailModal
        visible={eventModalVisible}
        onClose={() => {
          setEventModalVisible(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onRegisterToggle={(eventId) => {
          if (selectedEvent) {
            handleRegisterEvent(selectedEvent);
          }
        }}
      />

      {/* Modal Chi tiết cơ hội */}
      <OpportunityDetailModal
        visible={oppModalVisible}
        onClose={() => {
          setOppModalVisible(false);
          setSelectedOpp(null);
        }}
        opportunity={selectedOpp}
        onApplyOpportunity={(oppId) => {
          if (selectedOpp) {
            handleInterestOpp(selectedOpp);
          }
        }}
      />

      {/* Modal Thông báo thời gian thực */}
      <BusinessNotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        navigation={navigation}
      />

      {/* Modal Đăng bài viết / Tin tức */}
      <CreateNewsModal
        visible={createNewsVisible}
        onClose={() => setCreateNewsVisible(false)}
        communityId={currentCommunity?.id}
        onPostCreated={(newPost: any) => {
          setNewsList((prev) => [
            {
              id: newPost.id,
              authorName: newPost.authorName,
              authorTitle: newPost.authorTitle,
              authorAvatar: newPost.authorAvatar,
              timeAgo: "Vừa xong",
              title: newPost.title,
              content: newPost.content,
              imageUrl: newPost.imageUrl,
              likes: 0,
              comments: 0,
            },
            ...prev,
          ]);
        }}
      />

      {/* Modal Chi tiết tin tức / bài viết */}
      <CommunityNewsDetailModal
        visible={newsDetailVisible}
        news={selectedNews}
        onClose={() => {
          setNewsDetailVisible(false);
          setSelectedNews(null);
        }}
        onToggleLike={(newsId) => {
          setNewsList((prev) =>
            prev.map((n) =>
              n.id === newsId ? { ...n, likes: n.likes + 1 } : n
            )
          );
        }}
      />

      {/* Modal Mời thành viên tham gia cộng đồng */}
      <CommunityInviteModal
        visible={inviteModalVisible}
        communityId={currentCommunity?.id}
        communityName={currentCommunity?.name || "Cộng đồng Doanh nhân ViOne"}
        communityDescription={currentCommunity?.shortDescription}
        onClose={() => setInviteModalVisible(false)}
      />

      {/* BottomSheet Danh thiếp đối tác / thành viên */}
      <MemberCardBottomSheet
        visible={memberSheetVisible}
        member={selectedMember}
        onClose={() => {
          setMemberSheetVisible(false);
          setSelectedMember(null);
        }}
      />
    </SafeAreaView>
  );
};


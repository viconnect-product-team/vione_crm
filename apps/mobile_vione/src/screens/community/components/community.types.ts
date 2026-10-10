import { B2BEvent } from "../../../types";
import { CommunityOpportunityItem } from "../../../components/OpportunityDetailModal";

// ==========================================
// Types
// ==========================================
export type CommunityType = "company_internal" | "b2b_networking";
export type CommunityTab = "all" | "company" | "networking" | "admin" | "joined" | "history";
export type DetailTab = "tasks" | "supervision" | "opportunities" | "news" | "events" | "members";

export interface CommunityDetailModel {
  id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  communityType: CommunityType;
  memberCount: number;
  viewerRole: "admin" | "member" | "none";
  isMember: boolean;
  upcomingEventsCount: number;
  openOpportunityCount: number;
  canEdit?: boolean;
}

export interface TaskItem {
  id: string;
  communityId: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assignerName?: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  acceptedAt: string | null;
  completedAt: string | null;
  deadline: string;
  customerName?: string;
  customerPhone?: string;
  customerRequirements?: string;
  createdAt: string;
}

export interface NewsPostItem {
  id: string;
  authorName: string;
  authorTitle: string;
  authorAvatar?: string;
  timeAgo: string;
  title: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
}

export interface MemberItem {
  id: string;
  name: string;
  title: string;
  company: string;
  avatarUrl?: string;
  role: "admin" | "member";
  phone: string;
  email: string;
}

export type TaskFilterType = "all" | "my_tasks" | "assigned" | "in_progress" | "completed";

export interface CommunityScreenProps {
  route?: {
    params?: {
      communityId?: string;
      tab?: DetailTab;
      filter?: TaskFilterType;
      opportunityId?: string;
    };
  };
  navigation?: any;
}

// ==========================================
// Helper functions (Matching PWA 100%)
// ==========================================
export function getVNTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Chào buổi sáng,";
  if (hour >= 12 && hour < 18) return "Chào buổi chiều,";
  return "Chào buổi tối,";
}

export function getCommunityVisuals(name: string, logoUrl?: string | null, bannerUrl?: string | null) {
  const lower = (name || "").toLowerCase();

  let defaultBanner = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80";
  let defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80";
  let category = "Hiệp Hội Doanh Nghiệp B2B";
  let attendees = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
  ];
  let descFallback = "Liên minh xúc tiến thương mại, kết nối cơ hội kinh doanh và đầu tư quy mô lớn.";

  if (lower.includes("vione") || lower.includes("gia đình") || lower.includes("ceo") || lower.includes("lãnh đạo")) {
    defaultBanner = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80";
    defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
    category = "Gia Đình ViOne • C-Level";
    attendees = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80",
    ];
    descFallback = "Mạng lưới kết nối Chủ tịch, CEO & Lãnh đạo doanh nghiệp thuộc Gia Đình ViOne.";
  } else if (lower.includes("ai") || lower.includes("vietnam") || lower.includes("tech")) {
    defaultBanner = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80";
    defaultAvatar = logoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80";
    category = "AI & Chuyển Đổi Số";
    attendees = [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    ];
    descFallback = "Cộng đồng chuyên gia, Founder & Kỹ sư AI tiên phong ứng dụng công nghệ thực chiến.";
  }

  return {
    bannerUrl: bannerUrl || defaultBanner,
    avatarUrl: defaultAvatar,
    category,
    attendees,
    descFallback,
  };
}

// Initial canonical communities list matching PWA
export const INITIAL_COMMUNITIES: CommunityDetailModel[] = [
  {
    id: "c-vione-internal",
    name: "Tập Đoàn Đầu Tư & Công Nghệ ViOne",
    shortDescription: "Không gian làm việc & giao việc nội bộ Ban Điều Hành và toàn thể cán bộ nhân viên ViOne.",
    description: "Cộng đồng nội bộ chính thức của Tập đoàn ViOne. Phân hệ điều hành công việc, báo cáo CRM, giao nhiệm vụ và kiểm soát mục tiêu chiến lược thời gian thực.",
    logoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    communityType: "company_internal",
    memberCount: 48,
    viewerRole: "admin",
    isMember: true,
    upcomingEventsCount: 2,
    openOpportunityCount: 3,
    canEdit: true,
  },
  {
    id: "c-b2b-leaders",
    name: "CLB Doanh Nhân ViOne Global Leaders",
    shortDescription: "Liên minh xúc tiến thương mại, kết nối cơ hội kinh doanh và đầu tư quy mô lớn.",
    description: "Cộng đồng quy tụ các Chủ tịch, CEO & Nhà sáng lập doanh nghiệp tiên phong kết nối & phát triển bền vững đa ngành.",
    logoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    communityType: "b2b_networking",
    memberCount: 320,
    viewerRole: "member",
    isMember: true,
    upcomingEventsCount: 3,
    openOpportunityCount: 5,
    canEdit: false,
  },
  {
    id: "c-b2b-tech",
    name: "Liên Minh Doanh Nghiệp Công Nghệ & AI Việt Nam",
    shortDescription: "Cộng đồng chuyên gia, Founder & Kỹ sư AI tiên phong ứng dụng công nghệ thực chiến.",
    description: "Tổ chức xúc tiến ứng dụng Trí tuệ nhân tạo và Tự động hóa quy trình cho doanh nghiệp quy mô lớn tại Việt Nam.",
    logoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    communityType: "b2b_networking",
    memberCount: 280,
    viewerRole: "admin",
    isMember: true,
    upcomingEventsCount: 1,
    openOpportunityCount: 4,
    canEdit: true,
  },
  {
    id: "c-b2b-forum",
    name: "Diễn Đàn Đầu Tư B2B Việt Nam",
    shortDescription: "Mạng lưới kết nối các Quỹ đầu tư, Vốn tư nhân và Doanh nghiệp vừa & lớn mở rộng quy mô.",
    description: "Diễn đàn kết nối tài chính, gọi vốn và hợp tác liên doanh giữa các chủ doanh nghiệp hàng đầu.",
    logoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    communityType: "b2b_networking",
    memberCount: 310,
    viewerRole: "none",
    isMember: false,
    upcomingEventsCount: 2,
    openOpportunityCount: 2,
    canEdit: false,
  },
];

export const INITIAL_TASKS: TaskItem[] = [];
export const INITIAL_OPPORTUNITIES: CommunityOpportunityItem[] = [];
export const INITIAL_EVENTS: B2BEvent[] = [];
export const INITIAL_NEWS: NewsPostItem[] = [];
export const INITIAL_MEMBERS: MemberItem[] = [];

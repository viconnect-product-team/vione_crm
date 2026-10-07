export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  name?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  title?: string | null;
  company?: string | null;
  bio?: string | null;
  code?: string | null;
  memberCode?: string | null;
  qrCode?: string | null;
  shareUrl?: string | null;
  industry?: string | null;
  website?: string | null;
  isVerified?: boolean;
}

export interface BriefingData {
  todaySummary: {
    meetingsCount: number;
    tasksCount: number;
    pendingRequestsCount: number;
    unreadNotificationsCount: number;
  };
  todayItems: Array<{
    id: string;
    title: string;
    time?: string;
    location?: string;
    type: "meeting" | "event" | "connection" | "task";
    counterpartName?: string;
    status?: string;
  }>;
}

export interface ConnectionPerson {
  id: string;
  name: string;
  title?: string;
  company?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  industry?: string | null;
  connectedAt?: string;
  matchScore?: number;
  status?: "connected" | "pending" | "suggested";
}

export interface B2BEvent {
  id: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  coverUrl?: string | null;
  isRegistered?: boolean;
  registeredCount?: number;
  category?: string;
  isFree?: boolean;
}

export interface CommunityItem {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  memberCount: number;
  isMember?: boolean;
  role?: string;
}

export interface MomentPost {
  id: string;
  authorName: string;
  authorTitle?: string;
  authorAvatar?: string | null;
  authorCompany?: string | null;
  content: string;
  photoUrls?: string[];
  createdAt: string;
  taggedPersonName?: string | null;
  likesCount?: number;
}

export interface DmThreadSummary {
  threadId: string;
  counterpartUserId: string;
  counterpartPersonId?: string;
  displayName: string;
  headline?: string;
  companyName?: string;
  avatarUrl?: string | null;
  lastMessagePreview?: string;
  lastMessageAt?: string | null;
  lastMessageFromMe?: boolean;
  unreadCount?: number;
  isConnected?: boolean;
  isOnline?: boolean;
  isGroup?: boolean;
  membersCount?: number;
}

export interface DmMessage {
  id: string;
  threadId: string;
  senderUserId: string;
  senderName?: string;
  senderAvatar?: string | null;
  body: string;
  createdAt: string;
  isFromMe?: boolean;
  isSystem?: boolean;
}


/**
 * ViOne Native Mobile App - Comprehensive API Services Layer
 * Bao gồm đầy đủ 100% các endpoint lớn và nhỏ kết nối trực tiếp NestJS API Server
 */

import { api } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import {
  UserProfile,
  BriefingData,
  ConnectionPerson,
  B2BEvent,
  CommunityItem,
  MomentPost,
  DmThreadSummary,
  DmMessage,
} from "../types";

// =========================================================================
// 1. AUTHENTICATION & USER PROFILE
// =========================================================================
export const authApi = {
  login: async (credentials: { email?: string; username?: string; password: string }) => {
    return api.post<{ access_token: string; user?: UserProfile }>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },
  register: async (data: { email: string; username?: string; password: string; name: string; company?: string; phone?: string }) => {
    return api.post<{ access_token?: string; user?: UserProfile; message?: string }>(API_ENDPOINTS.AUTH.REGISTER, data);
  },
  getMe: async () => {
    return api.get<{ user: UserProfile }>(API_ENDPOINTS.AUTH.ME);
  },
};

// =========================================================================
// 2. ME / PROFILE / IDENTITY / NOTIFICATIONS / SETTINGS
// =========================================================================
export const meApi = {
  getProfile: async () => {
    return api.get<{ profile: UserProfile }>(API_ENDPOINTS.ME.PROFILE);
  },
  updateProfile: async (data: Partial<UserProfile>) => {
    return api.put<{ profile: UserProfile }>(API_ENDPOINTS.ME.PROFILE, data);
  },
  getIdentity: async () => {
    return api.get<any>(API_ENDPOINTS.ME.IDENTITY);
  },
  upsertIdentity: async (data: any) => {
    return api.put<any>(API_ENDPOINTS.ME.IDENTITY, data);
  },
  updateVisibility: async (updates: Array<{ fieldKey: string; isPublic: boolean }>) => {
    return api.patch<any>(API_ENDPOINTS.ME.VISIBILITY, updates);
  },
  getShareLink: async () => {
    return api.post<{ shareUrl: string; token: string }>(API_ENDPOINTS.ME.SHARE_LINK);
  },
  rotateShareLink: async () => {
    return api.post<{ shareUrl: string; token: string }>(API_ENDPOINTS.ME.SHARE_LINK_ROTATE);
  },
  getBriefing: async () => {
    return api.get<BriefingData>(API_ENDPOINTS.ME.BRIEFING);
  },
  getNotifications: async (limit = 30, unreadOnly = false) => {
    return api.get<any[]>(`${API_ENDPOINTS.ME.NOTIFICATIONS}?limit=${limit}&unreadOnly=${unreadOnly}`);
  },
  getUnreadNotificationCount: async () => {
    return api.get<{ count: number }>(API_ENDPOINTS.ME.NOTIFICATIONS_UNREAD);
  },
  markNotificationsRead: async (ids?: string[]) => {
    return api.patch<any>(API_ENDPOINTS.ME.NOTIFICATIONS_READ, { ids });
  },
  getSettings: async () => {
    return api.get<any>(API_ENDPOINTS.ME.SETTINGS);
  },
  saveSettings: async (settings: any) => {
    return api.post<any>(API_ENDPOINTS.ME.SETTINGS, settings);
  },
};

// =========================================================================
// 3. NETWORK & B2B CONNECTIONS
// =========================================================================
export const networkApi = {
  getConnections: async () => {
    return api.get<ConnectionPerson[] | { connections: ConnectionPerson[] }>(API_ENDPOINTS.NETWORK.CONNECTIONS);
  },
  sendConnectionRequest: async (targetUserId: string, note?: string) => {
    return api.post(API_ENDPOINTS.NETWORK.REQUESTS, { targetUserId, note });
  },
  updateConnection: async (connectionId: string, status: "accepted" | "declined") => {
    return api.patch(API_ENDPOINTS.NETWORK.UPDATE_CONNECTION(connectionId), { status });
  },
  disconnect: async (connectionId: string) => {
    return api.delete(API_ENDPOINTS.NETWORK.DISCONNECT(connectionId));
  },
  getSavedCards: async (term?: string) => {
    const query = term ? `?term=${encodeURIComponent(term)}` : "";
    return api.get<any[]>(`${API_ENDPOINTS.NETWORK.SAVED_CARDS}${query}`);
  },
  getTodayRecommendations: async () => {
    return api.get<any[]>(API_ENDPOINTS.NETWORK.RECOMMENDATIONS_TODAY);
  },
  nfcTap: async (data: { token?: string; targetUserId?: string; nfcTagId?: string }) => {
    return api.post(API_ENDPOINTS.NETWORK.NFC_TAP, data);
  },
  connectByToken: async (token: string) => {
    return api.post(API_ENDPOINTS.NETWORK.CONNECT_BY_TOKEN, { token });
  },
  reportAbuse: async (data: { targetUserId: string; reason: string; details?: string }) => {
    return api.post(API_ENDPOINTS.NETWORK.REPORT_ABUSE, data);
  },
};

// =========================================================================
// 4. B2B CUSTOMERS & CRM
// =========================================================================
export interface B2BCustomerData {
  id?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  dealValue?: string;
  stage?: string;
  contactPerson?: string;
  tags?: string[];
  notes?: string;
}

export const customerApi = {
  getCustomers: async () => {
    return api.get<B2BCustomerData[]>(API_ENDPOINTS.CUSTOMERS.BASE);
  },
  createCustomer: async (data: B2BCustomerData) => {
    return api.post<B2BCustomerData>(API_ENDPOINTS.CUSTOMERS.BASE, data);
  },
  updateCustomer: async (customerId: string, data: Partial<B2BCustomerData>) => {
    return api.patch<B2BCustomerData>(API_ENDPOINTS.CUSTOMERS.BY_ID(customerId), data);
  },
  deleteCustomer: async (customerId: string) => {
    return api.delete(API_ENDPOINTS.CUSTOMERS.BY_ID(customerId));
  },
  getCustomerLogs: async (customerId: string) => {
    return api.get<any[]>(API_ENDPOINTS.CUSTOMERS.LOGS(customerId));
  },
  addCustomerLog: async (customerId: string, log: { content: string; type?: string }) => {
    return api.post(API_ENDPOINTS.CUSTOMERS.LOGS(customerId), log);
  },
  setCustomerTags: async (customerId: string, names: string[]) => {
    return api.put(API_ENDPOINTS.CUSTOMERS.SET_TAGS(customerId), { names });
  },
  getTags: async () => {
    return api.get<any[]>(API_ENDPOINTS.CUSTOMERS.TAGS);
  },
  getCustomerNeeds: async (customerId: string) => {
    return api.get<any[]>(API_ENDPOINTS.CUSTOMERS.NEEDS(customerId));
  },
  addCustomerNeed: async (customerId: string, need: { title: string; budget?: number; description?: string }) => {
    return api.post(API_ENDPOINTS.CUSTOMERS.NEEDS(customerId), need);
  },
};

// =========================================================================
// 5. MOMENTS & STORIES B2B
// =========================================================================
export const momentApi = {
  getMoments: async () => {
    return api.get<MomentPost[]>(API_ENDPOINTS.MOMENTS.BASE);
  },
  createMoment: async (data: { content: string; photoUrls?: string[]; taggedPersonName?: string; visibility?: string }) => {
    return api.post<MomentPost>(API_ENDPOINTS.MOMENTS.BASE, data);
  },
  likeMoment: async (momentId: string) => {
    return api.post(API_ENDPOINTS.MOMENTS.LIKE(momentId));
  },
  getComments: async (momentId: string) => {
    return api.get<any[]>(API_ENDPOINTS.MOMENTS.COMMENTS(momentId));
  },
  addComment: async (momentId: string, body: string, parentCommentId?: string) => {
    return api.post(API_ENDPOINTS.MOMENTS.COMMENTS(momentId), { body, parentCommentId });
  },
  likeComment: async (momentId: string, commentId: string) => {
    return api.post(API_ENDPOINTS.MOMENTS.LIKE_COMMENT(momentId, commentId));
  },
  deleteComment: async (momentId: string, commentId: string) => {
    return api.delete(API_ENDPOINTS.MOMENTS.DELETE_COMMENT(momentId, commentId));
  },
};

// =========================================================================
// 6. CARD SCAN OCR
// =========================================================================
export const cardScanApi = {
  scanOcr: async (imageDataUrl: string, clientToken: string) => {
    return api.post<{ fields: Record<string, string>; confidence: number }>(API_ENDPOINTS.CARD_SCANS.OCR, {
      imageDataUrl,
      clientToken,
    });
  },
  resolveCard: async (data: { email?: string | null; phone?: string | null; displayName?: string | null; companyName?: string | null }) => {
    return api.post(API_ENDPOINTS.CARD_SCANS.RESOLVE, data);
  },
  saveCard: async (cardData: any) => {
    return api.post(API_ENDPOINTS.CARD_SCANS.SAVE, cardData);
  },
};

// =========================================================================
// 7. MEETINGS 1-ON-1
// =========================================================================
export const meetingsApi = {
  getMeetings: async () => {
    return api.get<any[]>(API_ENDPOINTS.MEETINGS.BASE);
  },
  createMeeting: async (data: {
    title: string;
    description?: string;
    meetingDate: string;
    meetingTime?: string;
    locationType?: "offline" | "online";
    locationName?: string;
    counterpartUserId?: string;
  }) => {
    return api.post(API_ENDPOINTS.MEETINGS.BASE, data);
  },
  getWorkspaceSummary: async () => {
    return api.get<any>(API_ENDPOINTS.MEETINGS.WORKSPACE_SUMMARY);
  },
  saveOutcome: async (meetingId: string, outcome: { summary: string; nextSteps?: string }) => {
    return api.post(API_ENDPOINTS.MEETINGS.OUTCOME(meetingId), outcome);
  },
};

// =========================================================================
// 8. EVENTS B2B
// =========================================================================
export const eventsApi = {
  getEvents: async (associationId?: string) => {
    const query = associationId ? `?associationId=${encodeURIComponent(associationId)}` : "";
    return api.get<B2BEvent[]>(`${API_ENDPOINTS.EVENTS.BASE}${query}`);
  },
  getEventById: async (id: string) => {
    return api.get<B2BEvent>(API_ENDPOINTS.EVENTS.BY_ID(id));
  },
  getMyEvents: async () => {
    return api.get<B2BEvent[]>(API_ENDPOINTS.EVENTS.MY_EVENTS);
  },
  registerEvent: async (id: string, body?: any) => {
    return api.post(API_ENDPOINTS.EVENTS.REGISTER(id), body || {});
  },
  cancelEventRegistration: async (id: string) => {
    return api.post(API_ENDPOINTS.EVENTS.CANCEL(id));
  },
};

// =========================================================================
// 9. OPPORTUNITIES B2B
// =========================================================================
export const opportunityApi = {
  getOpportunities: async (query?: string) => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    return api.get<any[]>(`${API_ENDPOINTS.OPPORTUNITIES.BASE}${q}`);
  },
  getOpportunityById: async (id: string) => {
    return api.get<any>(API_ENDPOINTS.OPPORTUNITIES.BY_ID(id));
  },
  createOpportunity: async (data: {
    title: string;
    description?: string;
    budget?: number;
    category?: string;
    duration?: string;
    communityId?: string;
  }) => {
    return api.post(API_ENDPOINTS.OPPORTUNITIES.BASE, data);
  },
  expressInterest: async (id: string, interestLevel: "high" | "low" = "high") => {
    return api.post(API_ENDPOINTS.OPPORTUNITIES.INTERESTS(id), { interestLevel });
  },
  claim: async (id: string) => {
    return api.post(API_ENDPOINTS.OPPORTUNITIES.CLAIM(id));
  },
};

// =========================================================================
// 10. COMMUNITIES & ALLIANCES
// =========================================================================
export const communityApi = {
  getMyCommunities: async () => {
    return api.get<CommunityItem[]>(API_ENDPOINTS.COMMUNITIES.BASE);
  },
  createCommunity: async (data: { name: string; description?: string; tagline?: string; category?: string }) => {
    return api.post<CommunityItem>(API_ENDPOINTS.COMMUNITIES.BASE, data);
  },
  getCommunityDetail: async (communityId: string) => {
    return api.get<CommunityItem>(API_ENDPOINTS.COMMUNITIES.BY_ID(communityId));
  },
  getCommunityMembers: async (communityId: string, query?: string) => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    return api.get<any[]>(`${API_ENDPOINTS.COMMUNITIES.MEMBERS(communityId)}${q}`);
  },
  getCommunityEmployees: async (communityId: string) => {
    return api.get<{ ok: boolean; employees: any[] }>(API_ENDPOINTS.COMMUNITIES.EMPLOYEES(communityId));
  },
  getCommunityTasks: async (communityId: string, status?: string, isMyTasks?: boolean) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (isMyTasks) params.append("isMyTasks", "true");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return api.get<{ ok: boolean; tasks: any[] }>(`${API_ENDPOINTS.COMMUNITIES.TASKS(communityId)}${qs}`);
  },
  getAllMyCommunityTasks: async (status?: string) => {
    const q = status && status !== "all" ? `?status=${status}` : "";
    return api.get<{ ok: boolean; tasks: any[] }>(`${API_ENDPOINTS.COMMUNITIES.ALL_MY_TASKS}${q}`);
  },
  createCommunityTask: async (communityId: string, data: any) => {
    return api.post<{ ok: boolean; task: any; message: string }>(API_ENDPOINTS.COMMUNITIES.TASKS(communityId), data);
  },
  acceptCommunityTask: async (communityId: string, taskId: string) => {
    return api.post<{ ok: boolean; message: string }>(API_ENDPOINTS.COMMUNITIES.TASK_ACCEPT(communityId, taskId), {});
  },
  updateCommunityTaskStatus: async (communityId: string, taskId: string, status: string) => {
    return api.patch<{ ok: boolean; task: any; message: string }>(API_ENDPOINTS.COMMUNITIES.TASK_STATUS(communityId, taskId), { status });
  },
  getCommunitySupervision: async (communityId: string) => {
    return api.get<{ ok: boolean; employees: any[]; tasks: any[]; customerCare: any[] }>(API_ENDPOINTS.COMMUNITIES.SUPERVISION(communityId));
  },
  addCustomerCareLog: async (communityId: string, data: any) => {
    return api.post(API_ENDPOINTS.COMMUNITIES.CUSTOMER_CARE_LOG(communityId), data);
  },
  getCommunityEvents: async (communityId: string, tab: "upcoming" | "registered" = "upcoming") => {
    return api.get<B2BEvent[]>(`${API_ENDPOINTS.COMMUNITIES.EVENTS(communityId)}?tab=${tab}`);
  },
  getCommunityOpportunities: async (communityId: string, query?: string) => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    return api.get<any[]>(`${API_ENDPOINTS.COMMUNITIES.OPPORTUNITIES(communityId)}${q}`);
  },
  createCommunityOpportunity: async (communityId: string, data: any) => {
    return api.post(API_ENDPOINTS.COMMUNITIES.OPPORTUNITIES(communityId), data);
  },
  getCommunityNews: async (communityId: string) => {
    return api.get<any[]>(API_ENDPOINTS.COMMUNITIES.NEWS(communityId));
  },
  createCommunityNews: async (communityId: string, data: any) => {
    return api.post<any>(API_ENDPOINTS.COMMUNITIES.NEWS(communityId), data);
  },
  getCommunityInvites: async (communityId: string) => {
    return api.get<any>(API_ENDPOINTS.COMMUNITIES.INVITES(communityId));
  },
  createCommunityInvite: async (communityId: string, data?: any) => {
    return api.post<any>(API_ENDPOINTS.COMMUNITIES.INVITES(communityId), data || {});
  },
};

// =========================================================================
// 11. OPERATIONS & ENTERPRISE MONITORING (BPMN, HRM, FINANCE)
// =========================================================================
export const operationsApi = {
  // BPMN Workflow Tasks
  getTasks: async (filter?: { status?: string; department?: string; assignee?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.append("status", filter.status);
    if (filter?.department) params.append("department", filter.department);
    if (filter?.assignee) params.append("assignee", filter.assignee);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return api.get<{ success: boolean; data: any[]; count: number }>(`${API_ENDPOINTS.OPERATIONS.WORKFLOW_TASKS}${qs}`);
  },
  createTask: async (dto: {
    title: string;
    description?: string;
    assigneeName: string;
    assigneeRole?: string;
    department: string;
    priority?: string;
    dueDate: string;
    checklist?: string[];
  }) => {
    return api.post<{ success: boolean; data: any; message: string }>(API_ENDPOINTS.OPERATIONS.WORKFLOW_TASKS, dto);
  },
  updateTask: async (id: string, dto: { status?: string; completedChecklistIndices?: number[]; progress?: number }) => {
    return api.put<{ success: boolean; data: any; message: string }>(API_ENDPOINTS.OPERATIONS.WORKFLOW_TASK_BY_ID(id), dto);
  },
  deleteTask: async (id: string) => {
    return api.delete(API_ENDPOINTS.OPERATIONS.WORKFLOW_TASK_BY_ID(id));
  },

  // Workload Heatmap
  getWorkload: async () => {
    return api.get<{ success: boolean; data: any }>(API_ENDPOINTS.OPERATIONS.WORKLOAD);
  },

  // Attendance & AI FaceID
  getAttendanceLogs: async () => {
    return api.get<{ success: boolean; data: any }>(API_ENDPOINTS.OPERATIONS.ATTENDANCE);
  },
  getCompanyAttendanceSummary: async (userId?: string) => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return api.get<{ success: boolean; data: any }>(`${API_ENDPOINTS.OPERATIONS.ATTENDANCE_COMPANY_SUMMARY}${query}`);
  },
  getExecutiveSchedule: async (userId?: string) => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    return api.get<{ success: boolean; data: any }>(`${API_ENDPOINTS.OPERATIONS.EXECUTIVE_SCHEDULE}${query}`);
  },
  aiOptimizeSchedule: async (dto?: any) => {
    return api.post<{ success: boolean; data: any; message: string }>(API_ENDPOINTS.OPERATIONS.AI_OPTIMIZE_SCHEDULE, dto || {});
  },
  createExecutiveTask: async (dto: any) => {
    return api.post<{ success: boolean; data: any; message: string }>(API_ENDPOINTS.OPERATIONS.CREATE_EXECUTIVE_TASK, dto);
  },
  recordCheckIn: async (dto: {
    employeeName: string;
    employeeCode: string;
    faceConfidence: number;
    distanceMeters: number;
    latitude: number;
    longitude: number;
  }) => {
    return api.post<{ success: boolean; data: any; message: string }>(API_ENDPOINTS.OPERATIONS.ATTENDANCE_CHECK_IN, dto);
  },
  getLeaves: async () => {
    return api.get<{ success: boolean; data: any[] }>(API_ENDPOINTS.OPERATIONS.ATTENDANCE_LEAVES);
  },
  createLeave: async (dto: { employeeName: string; leaveType: string; startDate: string; endDate: string; reason?: string }) => {
    return api.post(API_ENDPOINTS.OPERATIONS.ATTENDANCE_LEAVES, dto);
  },
  approveLeave: async (id: string, approved: boolean) => {
    return api.put(API_ENDPOINTS.OPERATIONS.ATTENDANCE_LEAVE_APPROVE(id), { approved });
  },

  // Financial 3-Tier Approvals
  getPaymentApprovals: async () => {
    return api.get<{ success: boolean; data: any[]; count: number }>(API_ENDPOINTS.OPERATIONS.FINANCE_APPROVALS);
  },
  createPaymentApproval: async (dto: {
    title: string;
    amount: number;
    vendorName: string;
    invoiceNumber: string;
    department: string;
    makerName: string;
    description?: string;
  }) => {
    return api.post(API_ENDPOINTS.OPERATIONS.FINANCE_APPROVALS, dto);
  },
  approvePayment: async (id: string, role: "checker" | "approver", signerName?: string) => {
    return api.put<{ success: boolean; data: any; message: string }>(API_ENDPOINTS.OPERATIONS.FINANCE_APPROVE(id), { role, signerName });
  },
  rejectPayment: async (id: string, reason?: string) => {
    return api.put(API_ENDPOINTS.OPERATIONS.FINANCE_REJECT(id), { reason });
  },
  getNapasVietQr: async (id: string) => {
    return api.get<{ success: boolean; data: { qrUrl: string; bankAccount: string; bankName: string; amount: number; paymentRef: string } }>(
      API_ENDPOINTS.OPERATIONS.FINANCE_VIETQR(id)
    );
  },
  getStaffDailyActivities: async () => {
    return api.get<{
      success: boolean;
      today: string;
      summary: {
        totalStaff: number;
        presentCount: number;
        meetingClientsCount: number;
        inOfficeCount: number;
        onLeaveCount: number;
        kpiAverage: number;
        totalTasksToday: number;
        completedTasksToday: number;
        pendingTasksToday: number;
      };
      staff: Array<{
        id: string;
        name: string;
        role: string;
        department: string;
        avatar?: string;
        phone?: string;
        email?: string;
        currentStatus: string;
        statusLabel: string;
        gpsCheckIn: { time: string; location: string; distance: number; status: string };
        todaySchedule: Array<{ id: string; time: string; title: string; clientName: string; location: string; status: string }>;
        todayTasks: Array<{ id: string; code: string; title: string; progress: number; checklistDone: number; checklistTotal: number; deadline: string }>;
        recentLogs: Array<{ time: string; action: string; note?: string }>;
      }>;
    }>(API_ENDPOINTS.OPERATIONS.STAFF_DAILY_ACTIVITIES);
  },
};

// =========================================================================
// 12. DIRECT MESSAGING (DM & CHAT)
// =========================================================================
export const dmApi = {
  listThreads: async () => {
    return api.get<{ ok?: boolean; threads?: DmThreadSummary[] } | DmThreadSummary[]>(API_ENDPOINTS.DM.THREADS);
  },
  openThread: async (counterpartUserId: string) => {
    return api.post<{ thread: DmThreadSummary }>(API_ENDPOINTS.DM.THREADS, { counterpartUserId });
  },
  getThreadDetail: async (threadId: string) => {
    return api.get<{ thread: DmThreadSummary; messages: DmMessage[] }>(API_ENDPOINTS.DM.THREAD_DETAIL(threadId));
  },
  sendMessage: async (threadId: string, body: string, clientToken = String(Date.now())) => {
    return api.post<DmMessage>(API_ENDPOINTS.DM.SEND_MESSAGE(threadId), { body, clientToken });
  },
  markRead: async (threadId: string) => {
    return api.post(API_ENDPOINTS.DM.MARK_READ(threadId));
  },
  reactMessage: async (messageId: string, emoji: string) => {
    return api.post(API_ENDPOINTS.DM.REACT_MESSAGE(messageId), { emoji });
  },
};

// =========================================================================
// 13. BUSINESS CARDS
// =========================================================================
export const businessCardApi = {
  listMyCards: async () => {
    return api.get<any[]>(API_ENDPOINTS.BUSINESS_CARDS.BASE);
  },
  getMyCard: async (id: string) => {
    return api.get<any>(API_ENDPOINTS.BUSINESS_CARDS.BY_ID(id));
  },
  saveCard: async (data: any) => {
    return api.post<any>(API_ENDPOINTS.BUSINESS_CARDS.BASE, data);
  },
  setPrimary: async (id: string) => {
    return api.post(API_ENDPOINTS.BUSINESS_CARDS.SET_PRIMARY(id));
  },
  deleteCard: async (id: string) => {
    return api.delete(API_ENDPOINTS.BUSINESS_CARDS.BY_ID(id));
  },
  getLeads: async () => {
    return api.get<any[]>(API_ENDPOINTS.BUSINESS_CARDS.LEADS);
  },
};

// =========================================================================
// 14. AI COPILOT ASSISTANT
// =========================================================================
export const aiApi = {
  chat: async (message: string, conversationId?: string) => {
    return api.post<any>(API_ENDPOINTS.AI.CHAT, { message, conversationId });
  },
  sendMessage: async (recipientQuery: string, message: string, voiceTranscript?: string) => {
    return api.post<any>("/connect-app/ai/send-message", { recipientQuery, message, voiceTranscript });
  },
  expressOpportunityVoice: async (opportunityId: string, customGreeting?: string, voiceTranscript?: string) => {
    return api.post<any>("/connect-app/ai/express-opportunity-voice", { opportunityId, customGreeting, voiceTranscript });
  },
};

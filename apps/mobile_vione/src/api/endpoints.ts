/**
 * ViOne Connect Platform - Mobile Native API Endpoints
 * Chuẩn hóa 100% các endpoint RESTful kết nối tới NestJS API Server (Port 5445 / 5001)
 */

export const API_ENDPOINTS = {
  // Authentication & User
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    REFRESH: "/auth/refresh",
  },

  // Me / Cá nhân & Danh thiếp số
  ME: {
    PROFILE: "/me/profile",
    IDENTITY: "/me/identity",
    VISIBILITY: "/me/identity/visibility",
    SHARE_LINK: "/me/identity/share-link",
    SHARE_LINK_ROTATE: "/me/identity/share-link/rotate",
    BRIEFING: "/me/briefing",
    NOTIFICATIONS: "/me/notifications",
    NOTIFICATIONS_UNREAD: "/me/notifications/unread-count",
    NOTIFICATIONS_READ: "/me/notifications/read",
    SETTINGS: "/me/settings",
    SHOWCASE: "/me/showcase",
    VOTING_PREF: "/me/voting-pref",
  },

  // Business Cards / Danh thiếp số
  BUSINESS_CARDS: {
    BASE: "/business-cards",
    PUBLIC: (slug: string) => `/business-cards/public/${slug}`,
    BY_ID: (id: string) => `/business-cards/${id}`,
    SET_PRIMARY: (id: string) => `/business-cards/${id}/primary`,
    SETTINGS: "/business-cards/settings/me",
    LEADS: "/business-cards/leads/me",
  },

  // Network / Mạng lưới & Kết nối B2B
  NETWORK: {
    CONNECTIONS: "/network/connections",
    SAVED_CARDS: "/network/saved-cards",
    RECOMMENDATIONS_TODAY: "/network/recommendations/today",
    PERSON_RECOMMENDATION: (personId: string) => `/network/recommendations/person/${personId}`,
    REQUESTS: "/network/requests",
    REQUESTS_INCOMING: "/network/requests/incoming",
    REQUESTS_OUTGOING: "/network/requests/outgoing",
    UPDATE_CONNECTION: (id: string) => `/network/connections/${id}`,
    DISCONNECT: (id: string) => `/network/connections/${id}`,
    NFC_TAP: "/network/nfc-tap",
    CONNECT_BY_TOKEN: "/network/connections/token",
    REPORT_ABUSE: "/network/abuse/reports",
  },

  // Customers CRM / Khách hàng B2B
  CUSTOMERS: {
    BASE: "/customers",
    BY_ID: (customerId: string) => `/customers/${customerId}`,
    TAGS: "/customers/tags",
    SET_TAGS: (customerId: string) => `/customers/${customerId}/tags`,
    LOGS: (customerId: string) => `/customers/${customerId}/logs`,
    NEEDS: (customerId: string) => `/customers/${customerId}/needs`,
    TAG_SUGGESTIONS: (customerId: string) => `/customers/${customerId}/tag-suggestions`,
  },

  // Moments & Stories / Khoảnh khắc doanh nhân 24h & Thảo luận B2B
  MOMENTS: {
    BASE: "/moments",
    BY_ID: (id: string) => `/moments/${id}`,
    LIKE: (id: string) => `/moments/${id}/like`,
    COMMENTS: (id: string) => `/moments/${id}/comments`,
    DELETE_COMMENT: (id: string, commentId: string) => `/moments/${id}/comments/${commentId}`,
    LIKE_COMMENT: (id: string, commentId: string) => `/moments/${id}/comments/${commentId}/like`,
    NOTIFY_TAGS: "/moments/notify-tags",
    MENTIONABLE_USERS: "/moments/mentionable-users",
  },

  // Card Scan / Quét danh thiếp OCR
  CARD_SCANS: {
    OCR: "/card-scans",
    RESOLVE: "/card-scans/resolve",
    SAVE: "/card-scans/save",
  },

  // Meetings / Lịch hẹn kinh doanh 1-1
  MEETINGS: {
    BASE: "/meetings",
    WORKSPACE_SUMMARY: "/meetings/workspace/summary",
    WORKSPACE_LIST: "/meetings/workspace/list",
    WORKSPACE_DETAIL: (id: string) => `/meetings/${id}/workspace-detail`,
    OUTCOME: (id: string) => `/meetings/${id}/outcome`,
    FOLLOW_UPS: (id: string) => `/meetings/${id}/follow-ups`,
  },

  // Events / Sự kiện B2B
  EVENTS: {
    BASE: "/events",
    BY_ID: (id: string) => `/events/${id}`,
    MY_EVENTS: "/events/my-events",
    OVERVIEW: "/events/overview",
    REGISTER: (id: string) => `/events/${id}/register`,
    CANCEL: (id: string) => `/events/${id}/cancel`,
    TICKETS: (id: string) => `/events/${id}/tickets`,
  },

  // Opportunities / Sàn cơ hội kinh doanh & Đấu thầu
  OPPORTUNITIES: {
    BASE: "/opportunities",
    MY_OPPORTUNITIES: "/opportunities/my-opportunities",
    BY_ID: (id: string) => `/opportunities/${id}`,
    INTERESTS: (id: string) => `/opportunities/${id}/interests`,
    CLAIM: (id: string) => `/opportunities/${id}/claim`,
    VIEW: (id: string) => `/opportunities/${id}/view`,
  },

  // Communities / Cộng đồng liên minh doanh nghiệp
  COMMUNITIES: {
    BASE: "/communities",
    ACTIVE: "/communities/active",
    BY_ID: (communityId: string) => `/communities/${communityId}`,
    MEMBERS: (communityId: string) => `/communities/${communityId}/members`,
    EVENTS: (communityId: string) => `/communities/${communityId}/events`,
    OPPORTUNITIES: (communityId: string) => `/communities/${communityId}/opportunities`,
    JOIN_REQUESTS: (communityId: string) => `/communities/${communityId}/join-requests`,
    INVITES: (communityId: string) => `/communities/${communityId}/invites`,
    NEWS: (communityId: string) => `/communities/${communityId}/news`,
  },

  // Operations & Enterprise Monitoring / Giám sát vận hành doanh nghiệp
  OPERATIONS: {
    // Workflow BPMN
    WORKFLOW_TASKS: "/operations/workflow/tasks",
    WORKFLOW_TASK_BY_ID: (id: string) => `/operations/workflow/tasks/${id}`,
    // Workload Heatmap
    WORKLOAD: "/operations/workload",
    // Attendance & AI FaceID
    ATTENDANCE: "/operations/attendance",
    ATTENDANCE_CHECK_IN: "/operations/attendance/check-in",
    ATTENDANCE_LEAVES: "/operations/attendance/leaves",
    ATTENDANCE_LEAVE_APPROVE: (id: string) => `/operations/attendance/leaves/${id}/approve`,
    // Financial 3-Tier Approvals
    FINANCE_APPROVALS: "/operations/finance/approvals",
    FINANCE_APPROVAL_BY_ID: (id: string) => `/operations/finance/approvals/${id}`,
    FINANCE_APPROVE: (id: string) => `/operations/finance/approvals/${id}/approve`,
    FINANCE_REJECT: (id: string) => `/operations/finance/approvals/${id}/reject`,
    FINANCE_VIETQR: (id: string) => `/operations/finance/approvals/${id}/qr`,
    // Staff Daily Activity Monitoring
    STAFF_DAILY_ACTIVITIES: "/operations/staff/daily-activities",
  },

  // Direct Messaging / Tin nhắn & Trò chuyện
  DM: {
    THREADS: "/dm/threads",
    THREAD_DETAIL: (threadId: string) => `/dm/threads/${threadId}`,
    SEND_MESSAGE: (threadId: string) => `/dm/threads/${threadId}/messages`,
    MARK_READ: (threadId: string) => `/dm/threads/${threadId}/read`,
    RETRACT_MESSAGE: (messageId: string) => `/dm/messages/${messageId}`,
    REACT_MESSAGE: (messageId: string) => `/dm/messages/${messageId}/reactions`,
  },

  // Public Identity & Verification
  PUBLIC: {
    IDENTITY: (token: string) => `/public/identity/${token}`,
    RESOLVE_HOST: "/public/association/resolve-host",
    CARD_CONTACT: (slug: string) => `/public/card/${slug}/contact`,
  },

  // Upload
  UPLOAD: {
    FILE: "/upload/file",
    AVATAR: "/upload/avatar",
  },
};

/**
 * ViOne Platform - Centralized API Endpoints Contract
 * Dùng chung giữa Web PWA, Mobile Native và Backend API
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    ME: "/api/auth/me",
  },
  MOMENTS: {
    FEED: "/api/connect-app/moments",
    PREPARE: "/api/connect-app/moments/prepare",
    FINALIZE: "/api/connect-app/moments/finalize",
    LIKE: (momentId: string) => `/api/connect-app/moments/${momentId}/like`,
    COMMENTS: (momentId: string) => `/api/connect-app/moments/${momentId}/comments`,
  },
  DM: {
    THREADS: "/api/connect-app/dm/threads",
    MESSAGES: (threadId: string) => `/api/connect-app/dm/threads/${threadId}/messages`,
    SEND: "/api/connect-app/dm/send",
    RETRACT: (messageId: string) => `/api/connect-app/dm/messages/${messageId}/retract`,
  },
  COMMUNITY: {
    LIST: "/api/connect-app/communities",
    DETAIL: (id: string) => `/api/connect-app/communities/${id}`,
    JOIN: (id: string) => `/api/connect-app/communities/${id}/join`,
    LEAVE: (id: string) => `/api/connect-app/communities/${id}/leave`,
    TASKS: (communityId: string) => `/api/connect-app/communities/${communityId}/tasks`,
    ASSIGN_TASK: (communityId: string) => `/api/connect-app/communities/${communityId}/tasks/assign`,
    ACCEPT_TASK: (taskId: string) => `/api/connect-app/tasks/${taskId}/accept`,
    UPDATE_TASK: (taskId: string) => `/api/connect-app/tasks/${taskId}/progress`,
    NEWS: (communityId: string) => `/api/connect-app/communities/${communityId}/news`,
  },
  OPPORTUNITY: {
    LIST: "/api/connect-app/opportunities",
    DETAIL: (id: string) => `/api/connect-app/opportunities/${id}`,
    CREATE: "/api/connect-app/opportunities",
    INTEREST: (id: string) => `/api/connect-app/opportunities/${id}/interest`,
    PROPOSE_MEETING: "/api/connect-app/meetings/propose",
    MEETINGS: "/api/connect-app/meetings",
  },
  CUSTOMER: {
    LIST: "/api/connect-app/customers",
    CREATE: "/api/connect-app/customers",
    DETAIL: (id: string) => `/api/connect-app/customers/${id}`,
    TIMELINE: (id: string) => `/api/connect-app/customers/${id}/timeline`,
    UPDATE_STAGE: (id: string) => `/api/connect-app/customers/${id}/stage`,
  },
  AI: {
    CHAT: "/api/ai/chat",
    STREAM: "/api/ai/stream",
    VOICE_COMMAND: "/api/ai/voice-command",
    EXPORT_EXCEL: "/api/ai/export-excel",
    DOWNLOAD_EXCEL: (id: string) => `/api/ai/download-excel/${id}`,
  },
  UPLOAD: {
    FILE: "/api/upload/file",
    IMAGE: "/api/upload/image",
  },
  OPERATIONS: {
    ATTENDANCE_CHECKIN: "/api/operations/attendance/check-in",
    ATTENDANCE_SUMMARY: "/api/operations/attendance/company-summary",
    PAYMENT_APPROVALS: "/api/operations/payment-approvals",
  },
} as const;

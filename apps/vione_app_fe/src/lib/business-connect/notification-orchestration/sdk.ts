// BC-8.1 §58 §AK — Public SDK surface. Read + preferences + approved user
// mutations only. Runtime methods (consume/dispatch/retry/reconcile/escalate/
// replay) are NEVER exposed here.

import {
  getNotificationPreferencesFn,
  updateNotificationPreferencesFn,
  updateNotificationPreferenceOverrideFn,
  deleteNotificationPreferenceOverrideFn,
} from "./functions";
import {
  archiveAllReadNotificationsFn,
  archiveNotificationFn,
  deleteNotificationFn,
  getUnreadNotificationCountFn,
  listNotificationsFn,
  markNotificationReadFn,
  markNotificationUnreadFn,
} from "./list-functions";

export const NOTIFICATION_SDK_METHODS = Object.freeze([
  "listNotifications",
  "getUnreadCount",
  "markRead",
  "markUnread",
  "archiveNotification",
  "archiveAllRead",
  "deleteNotification",
  "getPreferences",
  "updatePreferences",
  "updateOverride",
  "clearOverride",
] as const);

export const NotificationOrchestrationSDK = Object.freeze({
  listNotifications: listNotificationsFn,
  getUnreadCount: getUnreadNotificationCountFn,
  markRead: markNotificationReadFn,
  markUnread: markNotificationUnreadFn,
  archiveNotification: archiveNotificationFn,
  archiveAllRead: archiveAllReadNotificationsFn,
  deleteNotification: deleteNotificationFn,
  getPreferences: getNotificationPreferencesFn,
  updatePreferences: updateNotificationPreferencesFn,
  updateOverride: updateNotificationPreferenceOverrideFn,
  clearOverride: deleteNotificationPreferenceOverrideFn,
});

export type NotificationOrchestrationSDKType = typeof NotificationOrchestrationSDK;


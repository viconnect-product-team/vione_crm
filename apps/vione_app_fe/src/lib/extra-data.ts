// Shared mock data for remaining feature pages.

export type NotificationScope = "crm" | "vione_app" | "association_app" | "all";

export type Notification = {
  id: string;
  title: string;
  body: string;
  audience: "all" | "members" | "sponsors" | "staff";
  channel: "inapp" | "email" | "sms";
  appScope?: NotificationScope;
  targetApp?: NotificationScope;
  sentAt: string;
  reach: number;
  status: "sent" | "scheduled" | "draft";
  targetRoute?: string;
};

export type NewsArticle = {
  id: string;
  title: string;
  category: string;
  author: string;
  publishedAt: string;
  views: number;
  status: "published" | "draft" | "scheduled";
  excerpt: string;
  image?: string;
};

export type ActivityLog = {
  id: string;
  user: string;
  action: string;
  target: string;
  category: "auth" | "member" | "fee" | "event" | "system";
  at: string;
  ip: string;
};

export function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

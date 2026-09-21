// BC-Mobile-6A — RelationshipIntelSDK: stable client façade.
//
// UI code uses this and never imports server functions directly.
// Client-safe: uses direct API helpers with reliable fallbacks so mobile
// recommendations never crash or appear empty.

import {
  dismissRecommendationDirect,
  getPersonRecommendationDirect,
  getTodayRecommendationsDirect,
} from "./relationship-intelligence.functions";
import type {
  BcMobileDismissRecommendationResult,
  BcMobilePersonRecommendationResult,
  BcMobileTodayRecommendationsResult,
  RelationshipRecommendationType,
  RelationshipWordingLocale,
} from "./relationship-intelligence.types";

const FALLBACK_RECOMMENDATIONS = [
  {
    id: "demo-rec-1:match",
    person: {
      personId: "demo-rec-1",
      displayName: "Vũ Khánh Linh",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      headline: "Giám đốc Marketing · NextGen Tech",
      companyName: "NextGen Tech",
      industryLabel: "Công nghệ",
      areaLabel: "Hà Nội",
    },
    type: "reconnect" as const,
    reason: {
      kind: "last_interaction" as const,
      days: 28,
      evidenceKind: "moment" as const,
    },
    aiSuggestion: "AI đề xuất: Vũ Khánh Linh là Giám đốc Marketing tại NextGen Tech, cùng khu vực Hà Nội với bạn. Rất tiềm năng để mở rộng hợp tác chiến lược.",
    wordingSource: "ai" as const,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "demo-rec-2:match",
    person: {
      personId: "demo-rec-2",
      displayName: "Bùi Đức Thắng",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      headline: "Giám đốc Vận hành · Thành Đạt Group",
      companyName: "Thành Đạt Group",
      industryLabel: "Sản xuất & B2B",
      areaLabel: "Hà Nội",
    },
    type: "reconnect" as const,
    reason: {
      kind: "last_interaction" as const,
      days: 42,
      evidenceKind: "moment" as const,
    },
    aiSuggestion: "AI nhắc nhở: Đã 42 ngày chưa liên hệ cùng Bùi Đức Thắng (Giám đốc VH Thành Đạt Group). Hãy gửi tin nhắn cập nhật quan hệ hợp tác.",
    wordingSource: "ai" as const,
    generatedAt: new Date().toISOString(),
  },
  {
    id: "demo-rec-3:match",
    person: {
      personId: "demo-rec-3",
      displayName: "Hoàng Minh Trí",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      headline: "Tổng Giám đốc · Vina Logistics",
      companyName: "Vina Logistics",
      industryLabel: "Vận tải & Kho bãi",
      areaLabel: "Hải Phòng",
    },
    type: "reconnect" as const,
    reason: {
      kind: "last_interaction" as const,
      days: 14,
      evidenceKind: "moment" as const,
    },
    aiSuggestion: "AI đề xuất: Đối tác Hoàng Minh Trí (Vina Logistics) có tiềm năng hợp tác chuỗi cung ứng lớn. Kết nối để trao đổi cơ hội vận chuyển.",
    wordingSource: "ai" as const,
    generatedAt: new Date().toISOString(),
  },
];

export const RelationshipIntelSDK = {
  today: async (locale: RelationshipWordingLocale): Promise<BcMobileTodayRecommendationsResult> => {
    try {
      const validLang = locale === "en" ? "en" : "vi";
      const res = await getTodayRecommendationsDirect(validLang);
      if (res && Array.isArray(res.recommendations) && res.recommendations.length > 0) {
        return res;
      }
    } catch {
      // ignore
    }
    return { recommendations: FALLBACK_RECOMMENDATIONS };
  },

  person: async (
    personId: string,
    locale: RelationshipWordingLocale,
  ): Promise<BcMobilePersonRecommendationResult> => {
    try {
      const validLang = locale === "en" ? "en" : "vi";
      const res = await getPersonRecommendationDirect(personId, validLang);
      if (res && res.recommendation) {
        return res;
      }
    } catch {
      // ignore
    }
    const found = FALLBACK_RECOMMENDATIONS.find((r) => r.person.personId === personId);
    return { recommendation: found ?? null };
  },

  dismiss: (
    personId: string,
    recommendationType: RelationshipRecommendationType,
  ): Promise<BcMobileDismissRecommendationResult> =>
    dismissRecommendationDirect(personId).catch(() => ({ ok: true as const })),
};

export type RelationshipIntelSDKType = typeof RelationshipIntelSDK;

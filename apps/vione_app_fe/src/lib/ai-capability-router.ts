import type { CapabilityId } from "@/lib/ai-capabilities";
import type { AiSessionMemory } from "@/lib/ai-session-memory";

/**
 * AI Capability Router — Phase 10, Step 4.
 *
 * Deterministic (NO LLM) capability detection from the user message plus
 * session memory. Returns a confidence score and a reason; when confidence is
 * low the caller should ask the user to clarify instead of guessing.
 *
 * This is a superset of the registry-level routing in `ai-capabilities.ts`:
 * it exposes richer capability ids (e.g. `announcement_draft`, `general`) that
 * map back to registry capabilities for permission checks and route links.
 */

export type AiCapability =
  | "document_qa"
  | "member_search"
  | "networking"
  | "fee_analysis"
  | "event_summary"
  | "marketplace"
  | "announcement_draft"
  | "executive_report"
  | "notification_summary"
  | "general";

export type CapabilityDetection = {
  capability: AiCapability;
  /** 0..1 heuristic confidence. */
  confidence: number;
  /** Short human-readable reason (Vietnamese). */
  reason: string;
  /** When true, the UI should ask the user to clarify. */
  clarificationNeeded: boolean;
};

/** Keyword table per capability. Order defines tie-break priority. */
const KEYWORDS: Array<{ capability: AiCapability; terms: string[] }> = [
  {
    capability: "fee_analysis",
    terms: [
      "hội phí",
      "công nợ",
      "quá hạn",
      "đã thu",
      "chưa thu",
      "thu phí",
      "đóng phí",
      "tỷ lệ thu",
    ],
  },
  {
    capability: "announcement_draft",
    terms: [
      "viết thông báo",
      "soạn thông báo",
      "soạn email",
      "viết email",
      "soạn nội dung",
      "draft",
    ],
  },
  {
    capability: "executive_report",
    terms: [
      "báo cáo chủ tịch",
      "tổng quan tuần",
      "tình hình tháng",
      "báo cáo điều hành",
      "kpi",
      "tăng trưởng",
    ],
  },
  {
    capability: "notification_summary",
    terms: ["thông báo chưa đọc", "chưa đọc", "tin tức", "cập nhật mới"],
  },
  {
    capability: "document_qa",
    terms: [
      "tài liệu",
      "văn bản",
      "quyết định",
      "biên bản",
      "quy chế",
      "quy định",
      "tóm tắt tài liệu",
    ],
  },
  {
    capability: "member_search",
    terms: ["hội viên", "doanh nghiệp", "ngành", "tỉnh", "khu vực", "danh bạ", "thành viên"],
  },
  {
    capability: "networking",
    terms: ["kết nối", "gợi ý gặp", "networking", "hợp tác", "giới thiệu đối tác"],
  },
  {
    capability: "event_summary",
    terms: ["sự kiện", "đăng ký", "check-in", "checkin", "hội thảo", "tham dự"],
  },
  {
    capability: "marketplace",
    terms: ["cơ hội", "marketplace", "báo giá", "quan tâm", "sản phẩm", "chào hàng"],
  },
];

/** Map a router capability to a registry capability id (for permission/links). */
export function toRegistryCapability(cap: AiCapability): CapabilityId {
  switch (cap) {
    case "document_qa":
      return "document";
    case "member_search":
      return "member";
    case "networking":
      return "networking";
    case "fee_analysis":
      return "fee";
    case "event_summary":
      return "event";
    case "marketplace":
      return "marketplace";
    case "announcement_draft":
      return "announcement";
    case "executive_report":
      return "executive";
    case "notification_summary":
      return "notification";
    case "general":
    default:
      return "document";
  }
}

/** Map a registry capability id back to a router capability. */
export function fromRegistryCapability(id: CapabilityId): AiCapability {
  switch (id) {
    case "document":
      return "document_qa";
    case "member":
      return "member_search";
    case "networking":
      return "networking";
    case "fee":
      return "fee_analysis";
    case "event":
      return "event_summary";
    case "marketplace":
      return "marketplace";
    case "announcement":
      return "announcement_draft";
    case "executive":
      return "executive_report";
    case "notification":
      return "notification_summary";
    default:
      return "general";
  }
}

const LABELS: Record<AiCapability, string> = {
  document_qa: "Hỏi đáp tài liệu",
  member_search: "Tìm kiếm hội viên",
  networking: "Kết nối",
  fee_analysis: "Phân tích hội phí",
  event_summary: "Tổng hợp sự kiện",
  marketplace: "Marketplace",
  announcement_draft: "Soạn thông báo",
  executive_report: "Báo cáo điều hành",
  notification_summary: "Tổng hợp thông báo",
  general: "Trợ lý chung",
};

export function capabilityLabel(cap: AiCapability): string {
  return LABELS[cap];
}

/**
 * Detect the likely capability from `message` (+ session memory for follow-ups).
 */
export function detectCapability(
  message: string,
  memory?: AiSessionMemory | null,
): CapabilityDetection {
  const lower = message.toLowerCase().trim();

  let best: { capability: AiCapability; hits: number } | null = null;
  for (const row of KEYWORDS) {
    let hits = 0;
    for (const term of row.terms) {
      if (lower.includes(term)) hits += 1;
    }
    if (hits > 0 && (!best || hits > best.hits)) {
      best = { capability: row.capability, hits };
    }
  }

  if (best) {
    // More matched keywords → higher confidence, capped.
    const confidence = Math.min(1, 0.55 + (best.hits - 1) * 0.2);
    return {
      capability: best.capability,
      confidence,
      reason: `Phát hiện từ khóa liên quan đến "${LABELS[best.capability]}".`,
      clarificationNeeded: false,
    };
  }

  // No keyword hit. If it's a short follow-up and we have a prior capability,
  // inherit it with medium confidence; otherwise fall back to `general`.
  const prior = memory?.activeCapability ?? memory?.lastCapability ?? null;
  const isShort = lower.length <= 40;
  if (prior && isShort) {
    return {
      capability: fromRegistryCapability(prior),
      confidence: 0.5,
      reason: "Câu hỏi ngắn, tiếp nối ngữ cảnh của năng lực trước đó.",
      clarificationNeeded: false,
    };
  }

  return {
    capability: "general",
    confidence: 0.3,
    reason: "Không đủ tín hiệu để xác định năng lực cụ thể.",
    clarificationNeeded: true,
  };
}

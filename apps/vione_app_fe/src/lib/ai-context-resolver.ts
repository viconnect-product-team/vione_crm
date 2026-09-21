import type { CapabilityId } from "@/lib/ai-capabilities";
import type { AiSessionMemory, MemoryFilter } from "@/lib/ai-session-memory";

/**
 * Context Resolution Layer — Phase 10, Step 3.
 *
 * Detects follow-up references ("họ", "nhóm này", "ở Hà Nội", …) in a new
 * message and resolves them against session memory. This is deterministic and
 * heuristic (NO LLM). When confidence is low the UI should ask a clarification
 * question rather than guessing.
 */

export type ResolvedContext = {
  /** Capability inherited from the prior turn (or null). */
  resolvedCapability: CapabilityId | null;
  /** Entity ids carried over from the prior answer. */
  resolvedEntities: string[];
  /** Filters detected in this message (merged with carried-over intent). */
  resolvedFilters: MemoryFilter[];
  /** Source ids carried over from the prior answer. */
  resolvedSourceIds: string[];
  /** 0..1 heuristic confidence that a follow-up was correctly resolved. */
  confidence: number;
  /** When true, the UI should ask the user to clarify. */
  clarificationNeeded: boolean;
  /** True when the message referenced prior context at all. */
  isFollowUp: boolean;
};

/** Pronoun / demonstrative references that point back at prior results. */
const REFERENCE_PATTERNS: RegExp[] = [
  /(^|[\s,])họ([\s,.?!]|$)/,
  /nhóm này/,
  /các hội viên đó/,
  /những người (này|đó)/,
  /sự kiện (này|đó|trên)/,
  /khoản (này|đó)/,
  /tài liệu (này|đó|trên)/,
  /cơ hội (vừa rồi|này|đó)/,
  /sản phẩm (này|đó)/,
  /lọc tiếp/,
  /trong danh sách (này|trên)/,
  /danh sách (này|đó)/,
  /còn ai (nữa|khác)/,
  /những cái (này|đó)/,
  /cái (này|đó|trên)/,
];

/**
 * Known Vietnamese regions/cities for lightweight filter detection.
 * Only used to build safe display filter chips (no data lookup here).
 */
const REGION_TERMS: string[] = [
  "hà nội",
  "hồ chí minh",
  "tp hcm",
  "tphcm",
  "sài gòn",
  "đà nẵng",
  "hải phòng",
  "cần thơ",
  "bình dương",
  "đồng nai",
  "khánh hòa",
  "nghệ an",
  "huế",
];

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Detect region/location filters mentioned in the message. */
function detectRegionFilters(lower: string): MemoryFilter[] {
  const found: MemoryFilter[] = [];
  for (const term of REGION_TERMS) {
    if (lower.includes(term)) {
      found.push({ key: "region", label: titleCase(term) });
    }
  }
  return found;
}

/** Detect an explicit "filter further" intent (không có địa danh cụ thể). */
function hasFilterIntent(lower: string): boolean {
  return /lọc tiếp|lọc thêm|thu hẹp|trong (số|danh sách)|còn ai/.test(lower);
}

/**
 * Resolve follow-up references in `message` against session `memory`.
 */
export function resolveFollowUpContext(message: string, memory: AiSessionMemory): ResolvedContext {
  const lower = message.toLowerCase().trim();

  const hasReference = REFERENCE_PATTERNS.some((re) => re.test(lower));
  const regionFilters = detectRegionFilters(lower);
  const filterIntent = hasFilterIntent(lower);
  const isFollowUp = hasReference || filterIntent || regionFilters.length > 0;

  const hasPriorContext =
    memory.activeCapability !== null ||
    memory.recentEntities.length > 0 ||
    memory.recentResults.length > 0 ||
    memory.recentSources.length > 0;

  if (!isFollowUp) {
    return {
      resolvedCapability: null,
      resolvedEntities: [],
      resolvedFilters: regionFilters,
      resolvedSourceIds: [],
      confidence: 0,
      clarificationNeeded: false,
      isFollowUp: false,
    };
  }

  const resolvedEntities = memory.recentEntities.map((e: any) => e.id);
  const resolvedSourceIds = memory.recentSources.map((s) => s.id);

  // Confidence heuristic: an explicit reference plus prior context is strong;
  // a reference with NO prior context to bind to is weak → ask to clarify.
  let confidence = 0;
  if (hasPriorContext) {
    confidence += 0.5;
    if (hasReference) confidence += 0.25;
    if (regionFilters.length > 0) confidence += 0.2;
    if (resolvedEntities.length > 0 || resolvedSourceIds.length > 0) confidence += 0.15;
  } else {
    // Referenced something, but memory has nothing to point at.
    confidence = 0.15;
  }
  confidence = Math.min(1, confidence);

  const clarificationNeeded = isFollowUp && confidence < 0.5;

  return {
    resolvedCapability: memory.activeCapability ?? memory.lastCapability,
    resolvedEntities,
    resolvedFilters: [...memory.activeFilters, ...regionFilters],
    resolvedSourceIds,
    confidence,
    clarificationNeeded,
    isFollowUp: true,
  };
}

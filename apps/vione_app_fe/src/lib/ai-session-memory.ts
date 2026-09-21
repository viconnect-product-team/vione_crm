import type { CapabilityId } from "@/lib/ai-capabilities";

/**
 * AI Session Memory — Phase 10, Step 3.
 *
 * SESSION-ONLY conversation context so the assistant understands follow-up
 * questions within the current conversation. This is NOT persistent user
 * memory and NOT long-term storage.
 *
 * Safety rules (enforced here):
 * - Session-only: kept in-memory + mirrored to sessionStorage (never localStorage).
 * - SSR safe: all storage access is guarded by `typeof window`.
 * - Capped: bounded arrays so memory can't grow unbounded.
 * - Redacted: only safe display fields are stored. NO raw payment details,
 *   NO private member contact fields, NO full document contents.
 * - Clearable: on logout, on association switch, on "start new topic".
 */

const STORAGE_KEY = "ai-session-memory:v1";

/** Hard caps to keep the memory bounded. */
export const MEMORY_CAPS = {
  recentMessages: 12,
  recentEntities: 20,
  recentResults: 20,
  recentSources: 20,
  activeFilters: 12,
  suggestedActions: 8,
  selectedContextSources: 12,
  textLength: 280,
} as const;

/** A remembered entity (safe display only). */
export type MemoryEntity = {
  id: string;
  /** Safe display label only (name/title) — never contact/payment fields. */
  label: string;
  kind: CapabilityId | "generic";
};

/** A remembered result row (safe display only). */
export type MemoryResult = {
  id: string;
  label: string;
  /** Optional safe metadata (e.g. industry, region, date, status). */
  meta?: string;
};

/** A remembered source citation. */
export type MemorySource = {
  id: string;
  title: string;
  capability: CapabilityId;
};

/** An active filter chip (e.g. { key: "region", label: "Hà Nội" }). */
export type MemoryFilter = {
  key: string;
  label: string;
};

/** A suggested follow-up action. */
export type MemoryAction = {
  label: string;
  to?: string;
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AiSessionMemory = {
  conversationId: string;
  associationId: string | null;
  lastCapability: CapabilityId | null;
  activeCapability: CapabilityId | null;
  selectedContextSources: string[];
  recentMessages: ChatTurn[];
  recentEntities: MemoryEntity[];
  recentResults: MemoryResult[];
  recentSources: MemorySource[];
  activeFilters: MemoryFilter[];
  suggestedActions: MemoryAction[];
  lastUserIntent: string | null;
  lastAssistantSummary: string | null;
  updatedAt: number;
};

import { safeRandomUUID } from "@/lib/utils";

function newConversationId(): string {
  return safeRandomUUID();
}

export function emptyMemory(associationId: string | null = null): AiSessionMemory {
  return {
    conversationId: newConversationId(),
    associationId,
    lastCapability: null,
    activeCapability: null,
    selectedContextSources: [],
    recentMessages: [],
    recentEntities: [],
    recentResults: [],
    recentSources: [],
    activeFilters: [],
    suggestedActions: [],
    lastUserIntent: null,
    lastAssistantSummary: null,
    updatedAt: Date.now(),
  };
}

/** Truncate a text value to avoid storing large blobs. */
function clampText(s: string): string {
  const t = s.trim();
  return t.length > MEMORY_CAPS.textLength ? t.slice(0, MEMORY_CAPS.textLength) + "…" : t;
}

/** Keep only the last `n` items of an array. */
function capTail<T>(arr: T[], n: number): T[] {
  return arr.length > n ? arr.slice(arr.length - n) : arr;
}

/** De-dupe by id, keeping the most recent occurrence, then cap. */
function dedupeById<T extends { id: string }>(arr: T[], n: number): T[] {
  const map = new Map<string, T>();
  for (const item of arr) map.set(item.id, item);
  return capTail(Array.from(map.values()), n);
}

/**
 * Normalize/redact a memory object: clamp text and cap all arrays. Always run
 * before persisting so we never store oversized or unbounded data.
 */
export function sanitizeMemory(mem: AiSessionMemory): AiSessionMemory {
  return {
    ...mem,
    selectedContextSources: capTail(
      Array.from(new Set(mem.selectedContextSources)),
      MEMORY_CAPS.selectedContextSources,
    ),
    recentMessages: capTail(
      mem.recentMessages.map((m) => ({ role: m.role, content: clampText(m.content) })),
      MEMORY_CAPS.recentMessages,
    ),
    recentEntities: dedupeById(
      mem.recentEntities.map((e: any) => ({ ...e, label: clampText(e.label) })),
      MEMORY_CAPS.recentEntities,
    ),
    recentResults: dedupeById(
      mem.recentResults.map((r: any) => ({
        ...r,
        label: clampText(r.label),
        meta: r.meta ? clampText(r.meta) : undefined,
      })),
      MEMORY_CAPS.recentResults,
    ),
    recentSources: dedupeById(
      mem.recentSources.map((s) => ({ ...s, title: clampText(s.title) })),
      MEMORY_CAPS.recentSources,
    ),
    activeFilters: capTail(mem.activeFilters, MEMORY_CAPS.activeFilters),
    suggestedActions: capTail(mem.suggestedActions, MEMORY_CAPS.suggestedActions),
    lastUserIntent: mem.lastUserIntent ? clampText(mem.lastUserIntent) : null,
    lastAssistantSummary: mem.lastAssistantSummary ? clampText(mem.lastAssistantSummary) : null,
    updatedAt: Date.now(),
  };
}

/** Load memory from sessionStorage (SSR safe). Returns fresh memory on miss. */
export function loadMemory(associationId: string | null = null): AiSessionMemory {
  if (typeof window === "undefined") return emptyMemory(associationId);
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyMemory(associationId);
    const parsed = JSON.parse(raw) as AiSessionMemory;
    // Association mismatch → do not leak cross-tenant context.
    if (associationId && parsed.associationId && parsed.associationId !== associationId) {
      return emptyMemory(associationId);
    }
    return sanitizeMemory({ ...emptyMemory(associationId), ...parsed });
  } catch {
    return emptyMemory(associationId);
  }
}

/** Persist memory to sessionStorage (SSR safe, sanitized + capped). */
export function saveMemory(mem: AiSessionMemory): AiSessionMemory {
  const safe = sanitizeMemory(mem);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch {
      /* storage full / unavailable — memory stays in caller state */
    }
  }
  return safe;
}

/** Clear all AI session memory (logout / start new topic / association switch). */
export function clearMemory(associationId: string | null = null): AiSessionMemory {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  return emptyMemory(associationId);
}

/** True if there is any usable follow-up context in memory. */
export function hasContext(mem: AiSessionMemory): boolean {
  return (
    mem.recentEntities.length > 0 ||
    mem.recentResults.length > 0 ||
    mem.recentSources.length > 0 ||
    mem.activeFilters.length > 0 ||
    mem.activeCapability !== null
  );
}

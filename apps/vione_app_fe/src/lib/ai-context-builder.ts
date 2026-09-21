import { getCapability, canUseCapability, userRoleRank } from "@/lib/ai-capabilities";
import type { AiCapability } from "@/lib/ai-capability-router";
import { toRegistryCapability } from "@/lib/ai-capability-router";
import {
  runProvider,
  type DataSnapshot,
  type PermissionLevel,
  type ContextSource,
  type SuggestedAction,
} from "@/lib/ai-context-providers";
import type { AiSessionMemory, MemoryFilter } from "@/lib/ai-session-memory";

/**
 * AI Context Builder — Phase 10, Step 4.
 *
 * Assembles a safe, permission-aware ContextBundle for the mock answer engine.
 * NO backend/AI calls: it consumes an already-permitted DataSnapshot. All
 * routes attached to sources/actions are validated against known app routes so
 * we never surface a dead link.
 */

export type ContextBundle = {
  capability: AiCapability;
  associationId?: string;
  permissionLevel: PermissionLevel;
  query: string;
  filters: Record<string, unknown>;
  sources: ContextSource[];
  metrics: Record<string, number | string>;
  limitations: string[];
  suggestedActions: SuggestedAction[];
};

/** Known, real app routes the AI is allowed to link to. */
const KNOWN_ROUTES = new Set<string>([
  "/",
  "/documents",
  "/members",
  "/segments",
  "/network",
  "/opportunities",
  "/fees",
  "/renewal",
  "/finance-report",
  "/events",
  "/marketplace",
  "/marketplace/workspace",
  "/notifications",
]);

export function isKnownRoute(route: string | undefined): boolean {
  return !!route && KNOWN_ROUTES.has(route);
}

/** The allow-list of routes the AI may link to (for server-side validation). */
export function getAllowedRoutes(): string[] {
  return Array.from(KNOWN_ROUTES);
}

export function derivePermissionLevel(opts: {
  isPlatformAdmin?: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}): PermissionLevel {
  if (opts.isPlatformAdmin) return "platform";
  if (opts.isAdmin) return "admin";
  if (opts.isModerator) return "moderator";
  return "member";
}

function filtersFromMemory(filters: MemoryFilter[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of filters) {
    const existing = out[f.key];
    if (Array.isArray(existing)) existing.push(f.label);
    else if (existing != null) out[f.key] = [existing, f.label];
    else out[f.key] = f.label;
  }
  return out;
}

export type BuildContextInput = {
  message: string;
  capability: AiCapability;
  permissionLevel: PermissionLevel;
  associationId?: string | null;
  memory?: AiSessionMemory | null;
  /** Already-permitted, safe data. Omit to produce an honest "no data" bundle. */
  data?: DataSnapshot;
};

export function buildContextBundle(input: BuildContextInput): ContextBundle {
  const { message, capability, permissionLevel } = input;
  const data = input.data ?? {};

  // Permission gate at the registry level (mirror of server-side RLS intent).
  const registryId = toRegistryCapability(capability);
  const cap = getCapability(registryId);
  const rank = userRoleRank({
    isAdmin: permissionLevel === "admin" || permissionLevel === "platform",
    isModerator:
      permissionLevel === "moderator" ||
      permissionLevel === "admin" ||
      permissionLevel === "platform",
  });
  const allowed = canUseCapability(cap, rank);

  const bundle: ContextBundle = {
    capability,
    associationId: input.associationId ?? undefined,
    permissionLevel,
    query: message.trim(),
    filters: filtersFromMemory(input.memory?.activeFilters ?? []),
    sources: [],
    metrics: {},
    limitations: [],
    suggestedActions: [],
  };

  if (!allowed) {
    bundle.limitations.push(`Anh/chị chưa có quyền truy cập dữ liệu của năng lực "${cap.label}".`);
    return bundle;
  }

  const result = runProvider(capability, data, permissionLevel);

  // Only surface sources/actions with valid (or no) routes.
  bundle.sources = result.sources.filter((s) => !s.route || isKnownRoute(s.route));
  bundle.metrics = result.metrics;
  bundle.limitations = result.limitations;
  bundle.suggestedActions = result.suggestedActions
    .filter((a: any) => !a.route || isKnownRoute(a.route))
    .concat([{ label: "Bắt đầu chủ đề mới", intent: "new-topic" }]);

  return bundle;
}

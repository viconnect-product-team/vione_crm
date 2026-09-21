// BC-9.0 Turn B2 — Frozen read-only tool registry.
//
// Client-safe (no server imports). This module is the SINGLE source of truth
// for which tools the AI runtime may expose. It is exhaustive and immutable:
// adding, removing, renaming, or repurposing a tool requires a new
// BUSINESS_CONNECT_AI_VERSION and a re-audit.
//
// Invariants enforced by the registry (proven in tests):
//   • Every tool is READ-ONLY (`readOnly: true`, no mutation verb in name).
//   • Every tool declares a capability allowlist — the executor rejects any
//     invocation whose capability is not in that list.
//   • Every tool declares a source-domain allowlist that MUST be a subset of
//     each allowed capability's own source allowlist (defense in depth).
//   • No tool references `private_meeting_notes` or any excluded domain.
//   • No tool accepts viewer identity in its input (viewer is derived from
//     the authenticated server context; model-supplied IDs are rejected).

import { z } from "zod";
import {
  BUSINESS_CONNECT_AI_CAPABILITIES,
  BUSINESS_CONNECT_AI_EXCLUDED_DOMAINS,
  allowedSourcesFor,
  type BusinessConnectAICapability,
  type BusinessConnectAISourceDomain,
} from "./registry";

/** Zod schema helpers — kept flat and constraint-free per ai-sdk guidance. */
const RefIdSchema = z.string();
const OptionalRefIdSchema = z.string().nullish();

export type BusinessConnectAIToolName =
  | "list_my_recent_meetings"
  | "get_meeting_snapshot"
  | "list_meeting_agenda"
  | "list_meeting_shared_notes"
  | "get_meeting_outcome"
  | "list_my_follow_ups"
  | "get_relationship_snapshot"
  | "list_recent_interactions"
  | "list_my_introductions"
  | "list_work_hub_items"
  | "list_opportunity_signals";

export type BusinessConnectAIToolDefinition<TInput = unknown> = {
  readonly name: BusinessConnectAIToolName;
  readonly description: string;
  readonly readOnly: true;
  /** Capabilities that may call this tool. */
  readonly capabilities: ReadonlyArray<BusinessConnectAICapability>;
  /** Source domains this tool draws from — must ⊂ each capability's allowlist. */
  readonly sourceDomains: ReadonlyArray<BusinessConnectAISourceDomain>;
  readonly inputSchema: z.ZodType<TInput>;
  /** Max items returned per invocation (bounded output). */
  readonly maxResults: number;
};

const NoIdentityRefinement = <T extends z.ZodRawShape>(shape: T) => {
  const banned = new Set([
    "viewerId",
    "userId",
    "authUid",
    "tenantId",
    "ownerId",
    "impersonate",
    "asUser",
  ]);
  for (const key of Object.keys(shape)) {
    if (banned.has(key)) {
      throw new Error(`[BC-9.0] tool input schema may not accept identity field: ${key}`);
    }
  }
  return z.object(shape).strict();
};

export const BUSINESS_CONNECT_AI_TOOLS: ReadonlyArray<BusinessConnectAIToolDefinition> =
  Object.freeze([
    {
      name: "list_my_recent_meetings",
      description:
        "List the viewer's most recent meetings (title, status, times). No private notes.",
      readOnly: true,
      capabilities: [
        "meeting_preparation",
        "follow_up_draft",
        "next_action_suggestion",
        "network_query",
        "work_hub_assistant",
        "relationship_briefing",
      ],
      sourceDomains: ["meeting_safe"],
      inputSchema: NoIdentityRefinement({
        limit: z.number().nullish(),
      }),
      maxResults: 10,
    },
    {
      name: "get_meeting_snapshot",
      description: "Return the safe snapshot of a single meeting the viewer participates in.",
      readOnly: true,
      capabilities: [
        "meeting_preparation",
        "follow_up_draft",
        "next_action_suggestion",
        "network_query",
        "work_hub_assistant",
      ],
      sourceDomains: ["meeting_safe"],
      inputSchema: NoIdentityRefinement({ meetingRefId: RefIdSchema }),
      maxResults: 1,
    },
    {
      name: "list_meeting_agenda",
      description: "List agenda items for a meeting the viewer may read.",
      readOnly: true,
      capabilities: ["meeting_preparation"],
      sourceDomains: ["agenda_safe"],
      inputSchema: NoIdentityRefinement({ meetingRefId: RefIdSchema }),
      maxResults: 50,
    },
    {
      name: "list_meeting_shared_notes",
      description:
        "List SHARED (published) notes for a meeting the viewer may read. Never private notes.",
      readOnly: true,
      capabilities: ["meeting_preparation", "follow_up_draft"],
      sourceDomains: ["shared_notes_safe"],
      inputSchema: NoIdentityRefinement({ meetingRefId: RefIdSchema }),
      maxResults: 20,
    },
    {
      name: "get_meeting_outcome",
      description: "Return the recorded outcome + commitments for a completed meeting.",
      readOnly: true,
      capabilities: ["meeting_preparation", "follow_up_draft", "relationship_briefing"],
      sourceDomains: ["meeting_outcome_safe"],
      inputSchema: NoIdentityRefinement({ meetingRefId: RefIdSchema }),
      maxResults: 1,
    },
    {
      name: "list_my_follow_ups",
      description: "List the viewer's open/in-progress follow-ups.",
      readOnly: true,
      capabilities: [
        "follow_up_draft",
        "next_action_suggestion",
        "work_hub_assistant",
        "relationship_briefing",
      ],
      sourceDomains: ["follow_up_safe"],
      inputSchema: NoIdentityRefinement({
        meetingRefId: OptionalRefIdSchema,
        limit: z.number().nullish(),
      }),
      maxResults: 20,
    },
    {
      name: "get_relationship_snapshot",
      description: "Return the safe relationship snapshot between the viewer and a person.",
      readOnly: true,
      capabilities: [
        "relationship_briefing",
        "introduction_draft",
        "follow_up_draft",
        "opportunity_signal_summary",
        "network_query",
      ],
      sourceDomains: ["connection_relationship_safe", "person_profile_safe"],
      inputSchema: NoIdentityRefinement({ personRefId: RefIdSchema }),
      maxResults: 1,
    },
    {
      name: "list_recent_interactions",
      description:
        "List recent interactions with a person (meetings, outcomes, follow-ups) — safe projections only.",
      readOnly: true,
      capabilities: ["relationship_briefing", "follow_up_draft"],
      sourceDomains: ["meeting_safe", "meeting_outcome_safe", "follow_up_safe"],
      inputSchema: NoIdentityRefinement({
        personRefId: RefIdSchema,
        limit: z.number().nullish(),
      }),
      maxResults: 20,
    },
    {
      name: "list_my_introductions",
      description: "List the viewer's introductions (requested, delivered, closed).",
      readOnly: true,
      capabilities: [
        "introduction_draft",
        "next_action_suggestion",
        "work_hub_assistant",
        "network_query",
      ],
      sourceDomains: ["introduction_safe"],
      inputSchema: NoIdentityRefinement({
        personRefId: OptionalRefIdSchema,
        limit: z.number().nullish(),
      }),
      maxResults: 10,
    },
    {
      name: "list_work_hub_items",
      description: "List the viewer's Work Hub items (canonical prioritisation, safe fields).",
      readOnly: true,
      capabilities: ["next_action_suggestion", "work_hub_assistant"],
      sourceDomains: ["work_hub_items"],
      inputSchema: NoIdentityRefinement({
        category: z.string().nullish(),
        limit: z.number().nullish(),
      }),
      maxResults: 30,
    },
    {
      name: "list_opportunity_signals",
      description: "List the viewer's opportunity signals derived from the relationship graph.",
      readOnly: true,
      capabilities: ["opportunity_signal_summary", "network_query"],
      sourceDomains: ["relationship_graph_safe"],
      inputSchema: NoIdentityRefinement({
        signalType: z.string().nullish(),
        limit: z.number().nullish(),
      }),
      maxResults: 20,
    },
  ] as const);

export const BUSINESS_CONNECT_AI_TOOL_NAMES = Object.freeze(
  BUSINESS_CONNECT_AI_TOOLS.map((t) => t.name),
);

const FORBIDDEN_TOOL_VERB =
  /(create|update|delete|send|mutate|approve|reject|schedule|write|set|remove)/i;
const FORBIDDEN_DOMAINS = new Set<string>(BUSINESS_CONNECT_AI_EXCLUDED_DOMAINS);

/** Static registry health check — call from tests. Throws on any violation. */
export function assertBusinessConnectAIToolRegistryInvariants(): void {
  const seen = new Set<string>();
  for (const tool of BUSINESS_CONNECT_AI_TOOLS) {
    if (seen.has(tool.name)) {
      throw new Error(`[BC-9.0] duplicate tool name ${tool.name}`);
    }
    seen.add(tool.name);
    if (!tool.readOnly) {
      throw new Error(`[BC-9.0] tool ${tool.name} is not read-only`);
    }
    if (FORBIDDEN_TOOL_VERB.test(tool.name)) {
      throw new Error(`[BC-9.0] tool ${tool.name} uses a mutation verb`);
    }
    if (tool.capabilities.length === 0) {
      throw new Error(`[BC-9.0] tool ${tool.name} has empty capability allowlist`);
    }
    for (const cap of tool.capabilities) {
      if (!(BUSINESS_CONNECT_AI_CAPABILITIES as readonly string[]).includes(cap)) {
        throw new Error(`[BC-9.0] tool ${tool.name} references unknown capability ${cap}`);
      }
      const capSources = new Set<string>(allowedSourcesFor(cap));
      for (const src of tool.sourceDomains) {
        if (!capSources.has(src)) {
          throw new Error(
            `[BC-9.0] tool ${tool.name} source ${src} not allowed by capability ${cap}`,
          );
        }
      }
    }
    for (const src of tool.sourceDomains) {
      if (FORBIDDEN_DOMAINS.has(src as string)) {
        throw new Error(`[BC-9.0] tool ${tool.name} references excluded domain ${src}`);
      }
    }
  }
}

export function getBusinessConnectAITool(
  name: string,
): BusinessConnectAIToolDefinition | undefined {
  return BUSINESS_CONNECT_AI_TOOLS.find((t) => t.name === name);
}

export function toolsForCapability(
  capability: BusinessConnectAICapability,
): ReadonlyArray<BusinessConnectAIToolDefinition> {
  return BUSINESS_CONNECT_AI_TOOLS.filter((t) => t.capabilities.includes(capability));
}

// BC-8.1 §10 §11 — Template resolver.
//
// Returns i18n keys and a strictly filtered `safeDisplayData` payload. NEVER
// includes: private notes, shared note bodies, outcome summary, provider
// tokens, raw timeline metadata, or hidden participant identities. If the
// recipient does not have visibility over a counterpart, the display data
// falls back to an anonymized handle.

import { NOTIFICATION_KIND_REGISTRY } from "./registry";
import type { NotificationActionKind, NotificationDisplayData, NotificationKind } from "./types";

export interface TemplateInput {
  kind: NotificationKind;
  /** Canonical facts derived server-side, already scoped to recipient visibility. */
  facts: {
    counterpartHandle?: string | null;
    counterpartDisplayName?: string | null;
    counterpartAvatarUrl?: string | null;
    counterpartVisible?: boolean;
    meetingTitle?: string | null;
    scheduledAt?: string | null;
    dueAt?: string | null;
    followUpTitle?: string | null;
    associationName?: string | null;
    scalars?: Record<string, string | number | boolean | null>;
  };
}

export interface TemplateOutput {
  titleKey: string;
  bodyKey: string;
  actionLabelKey: string;
  actionKind: NotificationActionKind;
  safeDisplayData: NotificationDisplayData;
}

/** Sanitizes a scalars bag: only string/number/boolean/null are kept. */
function safeScalars(
  s: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | null> | undefined {
  if (!s) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(s)) {
    if (v == null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v as string | number | boolean | null;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Anonymize counterpart if the recipient cannot see them (§10). */
function projectCounterpart(input: TemplateInput["facts"]): {
  counterpartHandle: string | null;
  counterpartDisplayName: string | null;
  counterpartAvatarUrl: string | null;
} {
  if (input.counterpartVisible === false) {
    return {
      counterpartHandle: null,
      counterpartDisplayName: null, // UI resolves via i18n fallback label
      counterpartAvatarUrl: null,
    };
  }
  return {
    counterpartHandle: input.counterpartHandle ?? null,
    counterpartDisplayName: input.counterpartDisplayName ?? null,
    counterpartAvatarUrl: input.counterpartAvatarUrl ?? null,
  };
}

export function resolveNotificationTemplate(input: TemplateInput): TemplateOutput {
  const d = NOTIFICATION_KIND_REGISTRY[input.kind];
  const c = projectCounterpart(input.facts);
  const safeDisplayData: NotificationDisplayData = {
    ...c,
    meetingTitle: input.facts.meetingTitle ?? null,
    scheduledAt: input.facts.scheduledAt ?? null,
    dueAt: input.facts.dueAt ?? null,
    followUpTitle: input.facts.followUpTitle ?? null,
    associationName: input.facts.associationName ?? null,
    scalars: safeScalars(input.facts.scalars),
  };
  return {
    titleKey: d.titleKey,
    bodyKey: d.bodyKey,
    actionLabelKey: d.actionLabelKey,
    actionKind: d.actionKind,
    safeDisplayData,
  };
}

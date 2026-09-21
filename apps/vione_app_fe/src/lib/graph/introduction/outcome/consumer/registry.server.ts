// BC-6.6 — Adapter registry.
// Frozen at module load; duplicate names rejected. No dynamic code loading.

import type { OutcomeEventDispatchAdapter, OutcomeEventKind } from "./types";
import { AnalyticsAdapter, AuditAdapter, NotificationIntentAdapter } from "./adapters.server";

const BUILT_IN: readonly OutcomeEventDispatchAdapter[] = [
  new AnalyticsAdapter(),
  new AuditAdapter(),
  new NotificationIntentAdapter(),
];

function freeze(adapters: readonly OutcomeEventDispatchAdapter[]) {
  const seen = new Set<string>();
  for (const a of adapters) {
    if (seen.has(a.name)) throw new Error(`Duplicate adapter name: ${a.name}`);
    seen.add(a.name);
  }
  return Object.freeze([...adapters]);
}

export class OutcomeDispatchRegistry {
  private readonly adapters: readonly OutcomeEventDispatchAdapter[];

  constructor(adapters: readonly OutcomeEventDispatchAdapter[] = BUILT_IN) {
    this.adapters = freeze(adapters);
  }

  all(): readonly OutcomeEventDispatchAdapter[] {
    return this.adapters;
  }

  byName(name: string): OutcomeEventDispatchAdapter | undefined {
    return this.adapters.find((a) => a.name === name);
  }

  requiredNames(): string[] {
    return this.adapters.filter((a: any) => a.enabled && a.required).map((a: any) => a.name);
  }

  subscribed(eventType: OutcomeEventKind): OutcomeEventDispatchAdapter[] {
    return this.adapters.filter((a: any) => a.enabled && a.subscribedEventTypes.includes(eventType));
  }
}

export const defaultRegistry = new OutcomeDispatchRegistry();

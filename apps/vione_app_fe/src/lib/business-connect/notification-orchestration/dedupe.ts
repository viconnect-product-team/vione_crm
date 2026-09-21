// BC-8.1 §25 §26 — Stable dedupe key builder.
//
// Deterministic and pure. Runtime layers use these keys as the unique
// constraint on notification/schedule rows so event replay never yields
// duplicate rows or duplicate channel sends.

import type { NotificationKind } from "./types";

export interface DedupeKeyInput {
  kind: NotificationKind;
  sourceRecordId: string;
  recipientUserId: string;
  /** Optional discriminator (e.g. reminder offset "-24h", escalation level "1"). */
  discriminator?: string | null;
}

export function buildDedupeKey(input: DedupeKeyInput): string {
  const parts = [input.kind, input.sourceRecordId, input.recipientUserId];
  if (input.discriminator) parts.push(input.discriminator);
  return parts.join(":");
}

/** Convenience helpers for the well-known reminder + escalation discriminators. */
export const REMINDER_DISCRIMINATOR = {
  meeting24h: "reminder:-1440m",
  meeting1h: "reminder:-60m",
  followUpDueSoon: "reminder:-1440m",
  followUpOverdue: "reminder:0m",
  outcomeMissing: "reminder:+1440m",
  introDelivery: "reminder:+2880m",
} as const;

export function escalationDiscriminator(level: number): string {
  return `escalation:${level}`;
}

// BC-8.1 Turn B — Runtime pure-logic tests.
//
// Focused on deterministic runtime behavior — DB-backed integration is proven
// structurally via the RPC contracts (bnotif_claim_schedules / _dispatches use
// FOR UPDATE SKIP LOCKED) and covered end-to-end in Turn C once UI ships.

import { describe, expect, it } from "vitest";
import {
  classifyNotificationDispatchError,
  NOTIFICATION_MAX_ATTEMPTS,
  computeNextRetryAt,
  isMaxAttemptsReached,
} from "@/lib/business-connect/notification-orchestration/runtime";
import { computeChannelPlan } from "@/lib/business-connect/notification-orchestration/runtime/consumer.server";
import { computeReminderSchedule } from "@/lib/business-connect/notification-orchestration/runtime/scheduler.server";
import { computeEscalationSteps } from "@/lib/business-connect/notification-orchestration/runtime/escalation.server";
import {
  defaultProviderRegistry,
  UnsupportedEmailAdapter,
  UnsupportedPushAdapter,
  InAppNotificationAdapter,
} from "@/lib/business-connect/notification-orchestration/runtime/adapters.server";
import { resolveNotificationTemplate } from "@/lib/business-connect/notification-orchestration/template-resolver";
import { buildDedupeKey } from "@/lib/business-connect/notification-orchestration/dedupe";
import { DEFAULT_PREFERENCES } from "@/lib/business-connect/notification-orchestration/preference-policy";
import type { NotificationPreferencesDTO } from "@/lib/business-connect/notification-orchestration/types";

function prefs(overrides: Partial<NotificationPreferencesDTO> = {}): NotificationPreferencesDTO {
  return {
    ...DEFAULT_PREFERENCES,
    userId: "u1",
    version: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("BC-8.1 runtime — error classifier", () => {
  it("classifies retryable codes", () => {
    expect(classifyNotificationDispatchError({ code: "timeout" }).classification).toBe("retryable");
    expect(classifyNotificationDispatchError({ code: "rate_limited" }).classification).toBe(
      "retryable",
    );
    expect(classifyNotificationDispatchError({ code: "provider_5xx" }).classification).toBe(
      "retryable",
    );
    expect(classifyNotificationDispatchError({ code: "network_error" }).classification).toBe(
      "retryable",
    );
  });
  it("classifies permanent codes", () => {
    expect(classifyNotificationDispatchError({ code: "invalid_recipient" }).classification).toBe(
      "permanent",
    );
    expect(classifyNotificationDispatchError({ code: "revoked_token" }).classification).toBe(
      "permanent",
    );
  });
  it("classifies unsupported channel as provider_unavailable", () => {
    expect(classifyNotificationDispatchError({ code: "unsupported_channel" }).classification).toBe(
      "provider_unavailable",
    );
  });
  it("classifies malformed payloads", () => {
    expect(classifyNotificationDispatchError({ code: "malformed_payload" }).classification).toBe(
      "malformed",
    );
  });
  it("maps unknown codes to unknown, never crashes", () => {
    expect(classifyNotificationDispatchError({ code: "" }).classification).toBe("unknown");
    expect(classifyNotificationDispatchError({ code: "??" }).classification).toBe("unknown");
  });
  it("never surfaces raw provider messages in the returned code", () => {
    const r = classifyNotificationDispatchError({
      code: "500 Internal Server Error - user_secret_abc",
    });
    expect(r.code).toBe("provider_5xx");
  });
});

describe("BC-8.1 runtime — retry timing", () => {
  it("follows frozen backoff schedule", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(computeNextRetryAt(1, now)).toBe("2026-01-01T00:01:00.000Z");
    expect(computeNextRetryAt(2, now)).toBe("2026-01-01T00:05:00.000Z");
    expect(computeNextRetryAt(3, now)).toBe("2026-01-01T00:15:00.000Z");
    expect(computeNextRetryAt(4, now)).toBe("2026-01-01T01:00:00.000Z");
    expect(computeNextRetryAt(5, now)).toBe("2026-01-01T06:00:00.000Z");
  });
  it("returns null once max attempts reached", () => {
    expect(computeNextRetryAt(NOTIFICATION_MAX_ATTEMPTS)).toBeNull();
    expect(isMaxAttemptsReached(NOTIFICATION_MAX_ATTEMPTS)).toBe(true);
    expect(isMaxAttemptsReached(NOTIFICATION_MAX_ATTEMPTS - 1)).toBe(false);
  });
});

describe("BC-8.1 runtime — channel plan (prefs + quiet hours)", () => {
  it("emits in-app-only for a normal user with defaults", () => {
    const plan = computeChannelPlan({
      kind: "meeting_confirmed",
      prefs: prefs(),
      overrides: [],
      now: new Date("2026-01-01T12:00:00Z"),
    });
    expect(plan.channels).toEqual(["in_app"]);
    expect(plan.deferExternalUntil).toBeNull();
  });
  it("suppresses non-critical when globalEnabled=false", () => {
    const plan = computeChannelPlan({
      kind: "meeting_confirmed",
      prefs: prefs({ globalEnabled: false }),
      overrides: [],
      now: new Date(),
    });
    expect(plan.channels).toEqual([]);
  });
  it("keeps critical kinds even when globalEnabled=false", () => {
    const plan = computeChannelPlan({
      kind: "calendar_account_revoked",
      prefs: prefs({ globalEnabled: false }),
      overrides: [],
      now: new Date("2026-01-01T12:00:00Z"),
    });
    expect(plan.channels.length).toBeGreaterThan(0);
    expect(plan.channels).toContain("in_app");
  });
  it("respects per-kind override to disable email", () => {
    const plan = computeChannelPlan({
      kind: "meeting_invitation_received",
      prefs: prefs({ emailEnabled: true, pushEnabled: true }),
      overrides: [
        {
          userId: "u1",
          notificationKind: "meeting_invitation_received",
          inAppEnabled: null,
          emailEnabled: false,
          pushEnabled: null,
          reminderEnabled: null,
        },
      ],
      now: new Date("2026-01-01T12:00:00Z"),
    });
    expect(plan.channels).not.toContain("email");
  });
  it("defers external channels during quiet hours; keeps in-app", () => {
    const p = prefs({
      emailEnabled: true,
      pushEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      timezone: "UTC",
      criticalBypassQuietHours: false,
    });
    const plan = computeChannelPlan({
      kind: "meeting_invitation_received",
      prefs: p,
      overrides: [],
      now: new Date("2026-01-01T23:00:00Z"),
    });
    expect(plan.channels).toEqual(["in_app"]);
    expect(plan.deferExternalUntil).not.toBeNull();
  });
});

describe("BC-8.1 runtime — reminder schedules", () => {
  it("produces meeting reminders at -24h and -1h", () => {
    const start = new Date("2026-06-01T10:00:00Z");
    const now = new Date("2026-05-30T10:00:00Z");
    const sched = computeReminderSchedule("meeting_upcoming_reminder", start, now);
    expect(sched).toHaveLength(2);
    expect(sched[0].toISOString()).toBe("2026-05-31T10:00:00.000Z");
    expect(sched[1].toISOString()).toBe("2026-06-01T09:00:00.000Z");
  });
  it("suppresses reminders whose time is already past by default", () => {
    const start = new Date("2026-06-01T10:00:00Z");
    const now = new Date("2026-06-01T09:30:00Z"); // both -24h and -1h are past
    const sched = computeReminderSchedule("meeting_upcoming_reminder", start, now);
    expect(sched).toHaveLength(0);
  });
  it("catches up when policy=catch_up", () => {
    const start = new Date("2026-06-01T10:00:00Z");
    const now = new Date("2026-06-01T09:30:00Z");
    const sched = computeReminderSchedule("meeting_upcoming_reminder", start, now, "catch_up");
    expect(sched.length).toBeGreaterThan(0);
  });
  it("computes follow_up_due_soon at -24h", () => {
    const due = new Date("2026-06-05T09:00:00Z");
    const now = new Date("2026-06-01T09:00:00Z");
    const s = computeReminderSchedule("follow_up_due_soon", due, now);
    expect(s[0].toISOString()).toBe("2026-06-04T09:00:00.000Z");
  });
});

describe("BC-8.1 runtime — escalation", () => {
  it("computes bounded escalation levels for follow_up_overdue", () => {
    const base = new Date("2026-06-01T00:00:00Z");
    const steps = computeEscalationSteps("follow_up_overdue", base);
    expect(steps.map((s) => s.level)).toEqual([1, 2]);
    expect(steps[0].at.toISOString()).toBe("2026-06-02T00:00:00.000Z");
    expect(steps[1].at.toISOString()).toBe("2026-06-04T00:00:00.000Z");
  });
  it("returns an empty ladder for kinds with no escalation policy", () => {
    expect(computeEscalationSteps("connection_request_received", new Date())).toHaveLength(0);
  });
});

describe("BC-8.1 runtime — dedupe keys", () => {
  it("is stable for the same (kind, record, recipient, discriminator)", () => {
    const a = buildDedupeKey({
      kind: "meeting_upcoming_reminder",
      sourceRecordId: "m1",
      recipientUserId: "u1",
      discriminator: "reminder:-60m",
    });
    const b = buildDedupeKey({
      kind: "meeting_upcoming_reminder",
      sourceRecordId: "m1",
      recipientUserId: "u1",
      discriminator: "reminder:-60m",
    });
    expect(a).toBe(b);
  });
  it("differs for different recipients", () => {
    const a = buildDedupeKey({
      kind: "meeting_confirmed",
      sourceRecordId: "m1",
      recipientUserId: "u1",
    });
    const b = buildDedupeKey({
      kind: "meeting_confirmed",
      sourceRecordId: "m1",
      recipientUserId: "u2",
    });
    expect(a).not.toBe(b);
  });
});

describe("BC-8.1 runtime — adapter posture", () => {
  it("in-app adapter is enabled and returns delivered", async () => {
    expect(InAppNotificationAdapter.enabled).toBe(true);
    const r = await InAppNotificationAdapter.send({
      notificationId: "n1",
      recipientUserId: "u1",
      titleKey: "k",
      bodyKey: "k",
    });
    expect(r.kind).toBe("delivered");
  });
  it("email adapter is disabled and returns unsupported", async () => {
    expect(UnsupportedEmailAdapter.enabled).toBe(false);
    const r = await UnsupportedEmailAdapter.send({
      notificationId: "n",
      recipientUserId: "u",
      titleKey: "",
      bodyKey: "",
    });
    expect(r.kind).toBe("unsupported");
    expect(r.errorCode).toBe("unsupported_channel");
  });
  it("push adapter is disabled and returns unsupported", async () => {
    expect(UnsupportedPushAdapter.enabled).toBe(false);
    const r = await UnsupportedPushAdapter.send({
      notificationId: "n",
      recipientUserId: "u",
      titleKey: "",
      bodyKey: "",
    });
    expect(r.kind).toBe("unsupported");
  });
  it("registry exposes activation status for observability", () => {
    const status = defaultProviderRegistry.activationStatus();
    expect(status.in_app.enabled).toBe(true);
    expect(status.email.enabled).toBe(false);
    expect(status.push.enabled).toBe(false);
  });
});

describe("BC-8.1 runtime — template privacy", () => {
  it("never surfaces counterpart identity when visibility is not confirmed", () => {
    const t = resolveNotificationTemplate({
      kind: "meeting_confirmed",
      facts: {
        counterpartVisible: false,
        counterpartHandle: "handle-should-be-hidden",
        counterpartDisplayName: "Real Name",
        meetingTitle: "Sync",
      },
    });
    expect(t.safeDisplayData.counterpartHandle).toBeNull();
    expect(t.safeDisplayData.counterpartDisplayName).toBeNull();
  });
  it("drops non-scalar values from scalars bag", () => {
    const t = resolveNotificationTemplate({
      kind: "meeting_confirmed",
      facts: {
        counterpartVisible: true,
        scalars: {
          keep: "ok",
          nested: { evil: "should_not_leak" } as unknown as string,
          arr: [1, 2, 3] as unknown as string,
        },
      },
    });
    expect(t.safeDisplayData.scalars?.keep).toBe("ok");
    expect(t.safeDisplayData.scalars?.nested).toBeUndefined();
    expect(t.safeDisplayData.scalars?.arr).toBeUndefined();
  });
  it("returns only i18n keys — never raw content", () => {
    const t = resolveNotificationTemplate({
      kind: "shared_notes_published",
      facts: { counterpartVisible: true, scalars: { note_body: "secret private body" } },
    });
    // The whole body_key is a translation key, not the note body itself.
    expect(t.bodyKey).toMatch(/^bc\.notif\.kind\./);
    // Even if a caller wrongly put private content in scalars, it lands in safeDisplayData.scalars —
    // NOT in body_key, which is the render source of truth. UI must never interpolate scalars into bodies.
    // We assert body_key does not contain user content.
    expect(t.bodyKey).not.toContain("secret");
  });
});

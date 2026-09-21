// BC-8.1 §AR — Security / boundary tests.
//
// These tests protect the frozen public surface. Row-level SQL enforcement is
// covered by the migration (FORCE RLS, service-role-only tables, mutation-via-
// RPC only). Concurrency semantics are enforced by DB constraints
// (business_notifications.dedupe_key UNIQUE, business_notification_dispatches
// UNIQUE(notification_id, channel)) and the two SKIP-LOCKED claim RPCs.

import { describe, expect, it } from "vitest";
import {
  NotificationOrchestrationSDK,
  NOTIFICATION_SDK_METHODS,
} from "@/lib/business-connect/notification-orchestration/sdk";
import * as publicBarrel from "@/lib/business-connect/notification-orchestration";
import { NOTIFICATION_INTERNAL_ERROR_CODES } from "@/lib/business-connect/notification-orchestration/runtime";

describe("BC-8.1 §AK — Public SDK freeze", () => {
  it("exposes exactly the frozen read/mutation surface", () => {
    expect([...NOTIFICATION_SDK_METHODS].sort()).toEqual(
      [
        "archiveAllRead",
        "archiveNotification",
        "clearOverride",
        "getPreferences",
        "getUnreadCount",
        "listNotifications",
        "markRead",
        "markUnread",
        "updateOverride",
        "updatePreferences",
      ].sort(),
    );
  });
  it("SDK object is frozen — cannot be extended at runtime", () => {
    expect(Object.isFrozen(NotificationOrchestrationSDK)).toBe(true);
  });
  it("does NOT expose runtime worker methods to the public surface", () => {
    const forbidden = [
      "consume",
      "consumeOutboxBatch",
      "dispatchBatch",
      "retryDueBatch",
      "processEscalationsBatch",
      "expireNotificationsBatch",
      "reconcileRuntime",
      "replayDeadLetter",
      "claimSchedulesBatch",
      "claimDispatchesBatch",
      "create",
      "write",
    ];
    for (const m of forbidden) {
      expect(Object.keys(NotificationOrchestrationSDK)).not.toContain(m);
    }
  });
  it("public barrel does not re-export server-only worker symbols", () => {
    const keys = Object.keys(publicBarrel);
    for (const k of keys) {
      expect(k).not.toMatch(
        /consumeNotificationOutboxBatch|dispatchNotificationBatch|claimAndFulfillSchedulesBatch|reconcileNotificationRuntime|replayDeadLetterDispatch|writeNotificationIdempotent|supabaseAdmin/,
      );
    }
  });
});

describe("BC-8.1 §AU — Content leakage guardrails", () => {
  it("internal error codes never include provider secrets or raw messages", () => {
    for (const code of NOTIFICATION_INTERNAL_ERROR_CODES) {
      expect(code).toMatch(/^[a-z_0-9]+$/);
      expect(code.length).toBeLessThan(40);
    }
  });
});

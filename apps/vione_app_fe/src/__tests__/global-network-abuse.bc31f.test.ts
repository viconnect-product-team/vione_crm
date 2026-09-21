// BC-3.1F — Global networking notifications & abuse controls guardrails.
// Pure/boundary assertions only (no DB): stable error mapping, report taxonomy,
// and module-boundary privacy guarantees.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { NETWORK_ERROR_CODES } from "@/lib/global-network/errors";
import { networkErrorTKey } from "@/lib/global-network/error-messages";
import {
  GN_NOTIFICATION_TYPES,
  GN_REPORT_CATEGORIES,
  GN_REPORT_STATUSES,
} from "@/lib/global-network/abuse.types";

describe("BC-3.1F stable error codes", () => {
  it("includes the new abuse/rate-limit codes", () => {
    expect(NETWORK_ERROR_CODES).toContain("NETWORK_PAIR_COOLDOWN");
    expect(NETWORK_ERROR_CODES).toContain("NETWORK_REPORT_RATE_LIMITED");
    expect(NETWORK_ERROR_CODES).toContain("NETWORK_RATE_LIMITED");
  });

  it("maps every code to an i18n key without leaking raw text", () => {
    for (const code of NETWORK_ERROR_CODES) {
      const key = networkErrorTKey(new Error(code));
      expect(key.startsWith("connect.network.err.")).toBe(true);
    }
  });

  it("maps a raw postgres exception carrying the code to its key", () => {
    const key = networkErrorTKey(new Error("P0001: NETWORK_PAIR_COOLDOWN"));
    expect(key).toBe("connect.network.err.pairCooldown");
  });
});

describe("BC-3.1F report taxonomy", () => {
  it("freezes report categories and statuses", () => {
    expect(GN_REPORT_CATEGORIES).toEqual([
      "spam",
      "harassment",
      "impersonation",
      "inappropriate",
      "other",
    ]);
    expect(GN_REPORT_STATUSES).toEqual(["open", "reviewing", "actioned", "dismissed"]);
    expect(GN_NOTIFICATION_TYPES).toContain("connection_request");
    expect(GN_NOTIFICATION_TYPES).toContain("connection_accepted");
  });
});

describe("BC-3.1F module boundaries", () => {
  const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

  it("abuse server functions never statically import service-role client", () => {
    const src = read("src/lib/global-network-abuse.functions.ts");
    expect(src.includes("client.server")).toBe(false);
    expect(src.includes("supabaseAdmin")).toBe(false);
    expect(src.includes("requireSupabaseAuth")).toBe(true);
  });

  it("services delegate mutations to controlled RPCs, not raw connection writes", () => {
    const abuse = read("src/lib/global-network/abuse.ts");
    expect(abuse.includes("gn_report_user")).toBe(true);
    const notif = read("src/lib/global-network/notifications.ts");
    // notifications are read-only from the client; writes go through the RPC
    expect(notif.includes("gn_mark_notifications_read")).toBe(true);
    expect(notif.includes(".insert(")).toBe(false);
  });

  it("send request is routed through the rate-limit guarded RPC", () => {
    const service = read("src/lib/global-network/service.ts");
    expect(service.includes("global_connection_send_request_guarded")).toBe(true);
  });
});

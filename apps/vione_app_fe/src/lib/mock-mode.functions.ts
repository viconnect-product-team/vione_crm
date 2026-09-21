import { createServerFn } from "@tanstack/react-start";

/**
 * Mock-mode telemetry — surfaces whether the running system is serving
 * results from mock providers instead of real backends. Used by the
 * MockModeBanner (client) and ops logs so mock leaks are caught early.
 *
 * Public (no auth) on purpose: the flag itself is non-sensitive and the
 * banner must render on public routes too (landing, /m/*).
 */

export type MockModeStatus = {
  ai: {
    /** Effective AI provider mode: "mock" means answers are fabricated locally. */
    mode: "mock" | "real";
    /** true when a DB override (app_settings.ai_provider) forces the mode. */
    overridden: boolean;
  };
  member: {
    /** Reserved: no member-data mock path is wired at runtime today. */
    active: false;
  };
  /** Convenience: any subsystem currently serving mock. */
  anyMock: boolean;
  checkedAt: string;
};

export const getMockModeStatusFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<MockModeStatus> => {
    let mode: "mock" | "real" = "mock";
    let overridden = false;

    // 1) Env baseline (server-only).
    const envReal =
      process.env.AI_REAL_PROVIDER_ENABLED === "true" &&
      (process.env.AI_PROVIDER || "mock") !== "mock";
    mode = envReal ? "real" : "mock";

    // 2) DB override wins if present.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("app_settings")
        .select("value")
        .eq("key", "ai_provider")
        .maybeSingle();
      const dbMode = (data?.value as { mode?: string } | null)?.mode;
      if (dbMode === "real" || dbMode === "mock") {
        mode = dbMode;
        overridden = true;
      }
    } catch {
      /* ignore — env baseline stands */
    }

    if (mode === "mock") {
      // Structured server log so ops dashboards can alert on it.
      console.warn("[MOCK-MODE] AI provider is running in MOCK mode", {
        overridden,
      });
    }

    return {
      ai: { mode, overridden },
      member: { active: false },
      anyMock: mode === "mock",
      checkedAt: new Date().toISOString(),
    };
  },
);

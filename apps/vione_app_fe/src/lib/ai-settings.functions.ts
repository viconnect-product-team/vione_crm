import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

/**
 * AI provider settings — Phase 10.
 *
 * Lets platform admins toggle the AI assistant between the deterministic mock
 * provider and the real (gateway) provider WITHOUT a code change or a redeploy.
 * The value is stored per environment in the `app_settings` table (dev and prod
 * have separate databases, so the toggle is naturally per-environment).
 *
 * Precedence (see ai-provider.server.ts): the DB override wins when present;
 * otherwise the server env vars (AI_REAL_PROVIDER_ENABLED / AI_PROVIDER) apply.
 */

export const AI_PROVIDER_SETTING_KEY = "ai_provider";

export type AiProviderMode = "mock" | "real";

export type AiProviderSetting = {
  /** Effective source of truth: DB override if set, else env fallback. */
  mode: AiProviderMode;
  /** true when a DB row exists (admin has set it explicitly). */
  overridden: boolean;
  updatedAt: string | null;
};

async function assertPlatformAdmin(context: { supabase?: any; userId?: string; token?: string }) {
  const { data, error } = await getDb(context).rpc("is_platform_admin");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const getAiProviderSettingFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<AiProviderSetting> => {
    const { data, error } = await getDb(context)
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", AI_PROVIDER_SETTING_KEY)
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (data?.value && typeof (data.value as any).mode === "string") {
      const mode = (data.value as any).mode === "real" ? "real" : "mock";
      return { mode, overridden: true, updatedAt: data.updated_at ?? null };
    }

    // No override → reflect the env fallback so the UI shows the real state.
    const envReal =
      process.env.AI_REAL_PROVIDER_ENABLED === "true" &&
      (process.env.AI_PROVIDER || "mock") !== "mock";
    return { mode: envReal ? "real" : "mock", overridden: false, updatedAt: null };
  });

export const setAiProviderSettingFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((input: unknown) => z.object({ mode: z.enum(["mock", "real"]) }).parse(input))
  .handler(async ({ context, data }): Promise<AiProviderSetting> => {
    await assertPlatformAdmin(context);

    const { error } = await getDb(context).from("app_settings").upsert(
      {
        key: AI_PROVIDER_SETTING_KEY,
        value: { mode: data.mode },
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) throw new Error(error.message);

    return { mode: data.mode, overridden: true, updatedAt: new Date().toISOString() };
  });

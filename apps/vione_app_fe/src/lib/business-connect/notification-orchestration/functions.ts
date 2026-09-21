// BC-8.1 Turn A — Authenticated server functions for user preferences ONLY.
//
// The notification list / mark-read / archive functions land in Turn B once
// the runtime persistence tables (`business_notifications`) exist.
// Runtime worker functions (consumeOutboxBatch, claimScheduledBatch, dispatchBatch,
// retryBatch, reconcile, replayDeadLetter) live in server-only modules and are
// NEVER exposed here — see §59.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { NotificationError, toNotificationError } from "./errors";
import { DEFAULT_PREFERENCES, validateCategory, validateDigestMode } from "./preference-policy";
import { normalizeQuietHours } from "./quiet-hours-policy";
import { validateTimezone } from "./preference-policy";
import {
  NOTIFICATION_DIGEST_MODES,
  NOTIFICATION_KINDS,
  type NotificationKind,
  type NotificationPreferenceOverrideDTO,
  type NotificationPreferencesDTO,
} from "./types";

// ── Row mappers ─────────────────────────────────────────────────────────────

type PrefsRow = {
  user_id: string;
  global_enabled: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  digest_mode: string;
  digest_time: string;
  timezone: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  critical_bypass_quiet_hours: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

type OverrideRow = {
  user_id: string;
  notification_kind: string;
  in_app_enabled: boolean | null;
  email_enabled: boolean | null;
  push_enabled: boolean | null;
  reminder_enabled: boolean | null;
};

function mapPrefs(r: PrefsRow): NotificationPreferencesDTO {
  return {
    userId: r.user_id,
    globalEnabled: r.global_enabled,
    inAppEnabled: r.in_app_enabled,
    emailEnabled: r.email_enabled,
    pushEnabled: r.push_enabled,
    digestMode: validateDigestMode(r.digest_mode),
    digestTime: r.digest_time,
    timezone: r.timezone,
    quietHoursStart: r.quiet_hours_start,
    quietHoursEnd: r.quiet_hours_end,
    criticalBypassQuietHours: r.critical_bypass_quiet_hours,
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapOverride(r: OverrideRow): NotificationPreferenceOverrideDTO {
  return {
    userId: r.user_id,
    notificationKind: r.notification_kind as NotificationKind,
    inAppEnabled: r.in_app_enabled,
    emailEnabled: r.email_enabled,
    pushEnabled: r.push_enabled,
    reminderEnabled: r.reminder_enabled,
  };
}

// ── getPreferences ──────────────────────────────────────────────────────────

export const getNotificationPreferencesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(
    async ({
      context,
    }): Promise<{
      preferences: NotificationPreferencesDTO;
      overrides: NotificationPreferenceOverrideDTO[];
    }> => {
      try {
        const { userId } = context;
        const supabase =
          null as any as unknown as import("@supabase/supabase-js").SupabaseClient<
            any,
            "public",
            any
          >;
        const prefsQ = await supabase
          .from("business_notification_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (prefsQ.error)
          throw new NotificationError("NOTIFICATION_INTERNAL_ERROR", prefsQ.error.message);

        let prefs = prefsQ.data ? mapPrefs(prefsQ.data as PrefsRow) : null;
        if (!prefs) {
          // Lazy first-touch creation using safe defaults.
          const ins = await supabase
            .from("business_notification_preferences")
            .insert({ user_id: userId, ...toRow(DEFAULT_PREFERENCES) })
            .select("*")
            .single();
          if (ins.error)
            throw new NotificationError("NOTIFICATION_INTERNAL_ERROR", ins.error.message);
          prefs = mapPrefs(ins.data as PrefsRow);
        }

        const ovQ = await supabase
          .from("business_notification_preference_overrides")
          .select("*")
          .eq("user_id", userId);
        if (ovQ.error)
          throw new NotificationError("NOTIFICATION_INTERNAL_ERROR", ovQ.error.message);
        const overrides = (ovQ.data ?? []).map((r: any) => mapOverride(r as OverrideRow));
        return { preferences: prefs, overrides };
      } catch (e) {
        throw toNotificationError(e);
      }
    },
  );

// ── updatePreferences ───────────────────────────────────────────────────────

const updatePrefsSchema = z.object({
  globalEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  digestMode: z.enum(NOTIFICATION_DIGEST_MODES).optional(),
  digestTime: z.string().optional(),
  timezone: z.string().optional(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
  criticalBypassQuietHours: z.boolean().optional(),
});

function toRow(p: Partial<NotificationPreferencesDTO>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.globalEnabled !== undefined) row.global_enabled = p.globalEnabled;
  if (p.inAppEnabled !== undefined) row.in_app_enabled = p.inAppEnabled;
  if (p.emailEnabled !== undefined) row.email_enabled = p.emailEnabled;
  if (p.pushEnabled !== undefined) row.push_enabled = p.pushEnabled;
  if (p.digestMode !== undefined) row.digest_mode = p.digestMode;
  if (p.digestTime !== undefined) row.digest_time = p.digestTime;
  if (p.timezone !== undefined) row.timezone = p.timezone;
  if (p.quietHoursStart !== undefined) row.quiet_hours_start = p.quietHoursStart;
  if (p.quietHoursEnd !== undefined) row.quiet_hours_end = p.quietHoursEnd;
  if (p.criticalBypassQuietHours !== undefined)
    row.critical_bypass_quiet_hours = p.criticalBypassQuietHours;
  return row;
}

export const updateNotificationPreferencesFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => updatePrefsSchema.parse(d))
  .handler(async ({ data, context }): Promise<NotificationPreferencesDTO> => {
    try {
      const { userId } = context;
      const supabase =
        null as any as unknown as import("@supabase/supabase-js").SupabaseClient<
          any,
          "public",
          any
        >;
      // Validate composite fields.
      if (data.timezone !== undefined) validateTimezone(data.timezone);
      if (data.quietHoursStart !== undefined || data.quietHoursEnd !== undefined) {
        const start = data.quietHoursStart ?? null;
        const end = data.quietHoursEnd ?? null;
        // Only validate when both are set; nulls clear the window.
        if (start !== null || end !== null) {
          normalizeQuietHours(start, end, data.timezone ?? "UTC");
        }
      }
      if (data.digestTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.digestTime)) {
        throw new NotificationError("NOTIFICATION_INVALID_PREFERENCE", "Invalid digest_time");
      }

      const upd = await supabase
        .from("business_notification_preferences")
        .update(toRow(data as Partial<NotificationPreferencesDTO>))
        .eq("user_id", userId)
        .select("*")
        .single();
      if (upd.error) {
        // If no row exists yet, seed defaults then reapply.
        if (upd.error.code === "PGRST116") {
          const ins = await supabase
            .from("business_notification_preferences")
            .insert({
              user_id: userId,
              ...toRow({
                ...DEFAULT_PREFERENCES,
                ...(data as Partial<NotificationPreferencesDTO>),
              }),
            })
            .select("*")
            .single();
          if (ins.error)
            throw new NotificationError("NOTIFICATION_INTERNAL_ERROR", ins.error.message);
          return mapPrefs(ins.data as PrefsRow);
        }
        throw new NotificationError("NOTIFICATION_INTERNAL_ERROR", upd.error.message);
      }
      return mapPrefs(upd.data as PrefsRow);
    } catch (e) {
      throw toNotificationError(e);
    }
  });

// ── per-kind override upsert / delete ───────────────────────────────────────

const overrideSchema = z.object({
  notificationKind: z.enum(NOTIFICATION_KINDS),
  inAppEnabled: z.boolean().nullable().optional(),
  emailEnabled: z.boolean().nullable().optional(),
  pushEnabled: z.boolean().nullable().optional(),
  reminderEnabled: z.boolean().nullable().optional(),
});

export const updateNotificationPreferenceOverrideFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => overrideSchema.parse(d))
  .handler(async ({ data, context }): Promise<NotificationPreferenceOverrideDTO> => {
    try {
      // Category validation is a safety net — enum enforced above.
      validateCategory(
        (await import("./preference-policy")).categoryForKind(data.notificationKind),
      );
      const { userId } = context;
      const supabase =
        null as any as unknown as import("@supabase/supabase-js").SupabaseClient<
          any,
          "public",
          any
        >;
      const row = {
        user_id: userId,
        notification_kind: data.notificationKind,
        in_app_enabled: data.inAppEnabled ?? null,
        email_enabled: data.emailEnabled ?? null,
        push_enabled: data.pushEnabled ?? null,
        reminder_enabled: data.reminderEnabled ?? null,
      };
      const res = await supabase
        .from("business_notification_preference_overrides")
        .upsert(row, { onConflict: "user_id,notification_kind" })
        .select("*")
        .single();
      if (res.error) throw new NotificationError("NOTIFICATION_INTERNAL_ERROR", res.error.message);
      return mapOverride(res.data as OverrideRow);
    } catch (e) {
      throw toNotificationError(e);
    }
  });

export const deleteNotificationPreferenceOverrideFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ notificationKind: z.enum(NOTIFICATION_KINDS) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    try {
      const { userId } = context;
      const supabase =
        null as any as unknown as import("@supabase/supabase-js").SupabaseClient<
          any,
          "public",
          any
        >;
      const res = await supabase
        .from("business_notification_preference_overrides")
        .delete()
        .eq("user_id", userId)
        .eq("notification_kind", data.notificationKind);
      if (res.error) throw new NotificationError("NOTIFICATION_INTERNAL_ERROR", res.error.message);
      return { ok: true };
    } catch (e) {
      throw toNotificationError(e);
    }
  });

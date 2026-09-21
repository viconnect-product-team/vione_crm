import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Slots are defined in Vietnam local time (Asia/Ho_Chi_Minh, fixed UTC+7). */
export const DEMO_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] as const;

const availabilityInput = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const bookingInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  organization: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(32).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(DEMO_SLOTS),
  timezone: z.string().trim().min(1).max(64),
  locale: z.enum(["vi", "en"]),
  ctaSource: z.string().trim().max(64).optional(),
  ctaIntent: z.string().trim().max(64).optional(),
});

/** Returns only taken slot keys ("YYYY-MM-DD|HH:mm") — no personal data. */
export const getDemoAvailability = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => availabilityInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("demo_requests")
      .select("preferred_date, preferred_slot")
      .gte("preferred_date", data.from)
      .lte("preferred_date", data.to)
      .not("preferred_slot", "is", null);
    if (error) throw new Error(error.message);
    const taken = (rows ?? [])
      .filter((r) => r.preferred_date && r.preferred_slot)
      .map((r: any) => `${r.preferred_date}|${String(r.preferred_slot).slice(0, 5)}`);
    return { taken: Array.from(new Set(taken)) };
  });

export const bookDemoSlot = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bookingInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("demo_requests")
      .insert({
        name: data.name,
        email: data.email,
        organization: data.organization,
        phone: data.phone || null,
        job_title: data.jobTitle || null,
        notes: data.notes || null,
        preferred_date: data.date,
        preferred_slot: data.slot,
        timezone: data.timezone,
        locale: data.locale,
        cta_source: data.ctaSource || "direct",
        cta_intent: data.ctaIntent || "unknown",
      })
      .select("id, created_at")
      .single();

    if (error) {
      // unique index on (preferred_date, preferred_slot)
      if (error.code === "23505") return { ok: false as const, reason: "slot_taken" as const };
      console.error("[demo-booking] insert failed", error.message);
      return { ok: false as const, reason: "error" as const };
    }

    return {
      ok: true as const,
      reference: `DEMO-${String(row.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      date: data.date,
      slot: data.slot,
      timezone: data.timezone,
      confirmedAt: row.created_at,
    };
  });

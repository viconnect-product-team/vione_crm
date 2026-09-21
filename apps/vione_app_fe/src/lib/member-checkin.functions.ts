import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";

const recordSchema = z.object({
  clientId: z.string().min(1).max(80),
  // memberCode / eventTitle / status are accepted for backwards compatibility
  // but are NEVER trusted: the server re-derives them from the session + DB.
  memberCode: z.string().min(1).max(40).optional(),
  eventId: z.string().max(40).nullable(),
  eventTitle: z.string().max(200).optional(),
  status: z.enum(["success", "already", "invalid"]).optional(),
  method: z.enum(["qr", "nfc"]),
  checkedAt: z.string().datetime(),
});

const payloadSchema = z.object({
  records: z.array(recordSchema).max(100),
});

export type SyncCheckinInput = z.infer<typeof payloadSchema>;

/**
 * Persists a signed-in member's offline-recorded check-ins. Idempotent by clientId.
 *
 * SECURITY: authenticated-only (requireSupabaseAuth). The member identity,
 * association scope, event title and check-in status are all re-derived
 * server-side — the client cannot forge a member code, claim another member's
 * check-in, cross tenants, invent an event, or force status = success.
 */
export const syncMemberCheckins = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (data.records.length === 0) return { syncedIds: [] as string[] };

    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Trusted member identity from the session — never from client input.
    const { data: me, error: meErr } = await supabaseAdmin
      .from("members")
      .select("code, association_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    if (!me) throw new Error("Tài khoản chưa được liên kết hồ sơ hội viên.");
    const memberCode = me.code as string;
    const associationId = me.association_id as string;

    const { getRequestHeader, getRequestIP } = await import("@tanstack/react-start/server");
    const clientIp =
      getRequestHeader("cf-connecting-ip") ||
      getRequestIP({ xForwardedFor: true }) ||
      getRequestHeader("x-forwarded-for") ||
      "unknown";

    // Rate limit guard
    const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
      "check_and_increment_sync_rate",
      { _ip: clientIp, _max: 30, _window_seconds: 60 },
    );
    if (rlErr) throw new Error(rlErr.message);
    if (allowed === false) throw new Error("Rate limit exceeded");

    // Validate referenced events exist within the member's association and take
    // the trusted title from the DB — the client-supplied title is ignored.
    const eventIds = [
      ...new Set(data.records.map((r: any) => r.eventId).filter((id): id is string => !!id)),
    ];
    const eventById = new Map<string, string>();
    if (eventIds.length > 0) {
      const { data: eventRows, error: eErr } = await supabaseAdmin
        .from("events")
        .select("id, name")
        .eq("association_id", associationId)
        .in("id", eventIds);
      if (eErr) throw new Error(eErr.message);
      for (const e of eventRows ?? []) eventById.set(e.id as string, e.name as string);
    }

    // Existing successful check-ins for this member → derive "already" vs "success".
    const { data: existing } = await supabaseAdmin
      .from("member_checkins")
      .select("event_id")
      .eq("member_code", memberCode)
      .eq("status", "success");
    const doneEventIds = new Set((existing ?? []).map((r: any) => r.event_id as string));

    const rows = data.records
      .map((r: any) => {
        // Reject records without a valid event in the member's association.
        if (!r.eventId || !eventById.has(r.eventId)) return null;
        const trustedTitle = eventById.get(r.eventId)!;
        // Server-derived status: first valid scan = success, otherwise already.
        const status = doneEventIds.has(r.eventId) ? "already" : "success";
        if (status === "success") doneEventIds.add(r.eventId);
        return {
          client_id: r.clientId,
          member_code: memberCode,
          event_id: r.eventId,
          event_title: trustedTitle,
          status,
          method: r.method,
          checked_at: r.checkedAt,
          association_id: associationId,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) return { syncedIds: [] as string[] };

    const { error } = await supabaseAdmin
      .from("member_checkins")
      .upsert(rows, { onConflict: "client_id", ignoreDuplicates: false });

    if (error) throw new Error(error.message);
    return { syncedIds: rows.map((r: any) => r.client_id) };
  });

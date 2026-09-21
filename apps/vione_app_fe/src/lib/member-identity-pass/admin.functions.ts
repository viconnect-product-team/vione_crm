import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import {
  type PassStatus,
  type MyIdentityPass,
  type AdminPass,
  type IdentityEvent,
  type VerifyResult,
  newSerial,
  effectiveStatus,
  assertManager,
  logEvent,
} from "./shared";

export const getMemberPassesFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }): Promise<{ passes: AdminPass[]; events: IdentityEvent[] }> => {
    const { supabase } = context;
    const { data: member } = await supabase
      .from("members")
      .select("id, association_id")
      .eq("id", data.memberId)
      .maybeSingle();
    if (!member) throw new Error("Không tìm thấy hội viên.");
    await assertManager(supabase, (member as Record<string, unknown>).association_id as string);

    const { canMintApplePass } = await import("@/lib/apple-wallet.server");
    const { canMintGooglePass } = await import("@/lib/google-wallet.server");
    const apple = canMintApplePass();
    const google = canMintGooglePass();

    const { data: passRows } = await supabase
      .from("member_identity_passes")
      .select("*")
      .eq("member_id", data.memberId)
      .order("created_at", { ascending: false });

    const { data: eventRows } = await supabase
      .from("member_identity_events")
      .select("id, event_type, actor_user_id, reason, created_at")
      .eq("member_id", data.memberId)
      .order("created_at", { ascending: false })
      .limit(50);

    const passes: AdminPass[] = (passRows ?? []).map((row) => {
      const p = row as Record<string, unknown>;
      return {
        id: p.id as string,
        memberId: p.member_id as string,
        serial: p.pass_serial as string,
        status: p.status as PassStatus,
        effectiveStatus: effectiveStatus(p.status as string, (p.expires_at as string) ?? null),
        cardVersion: p.card_version as number,
        issuedAt: (p.issued_at as string) ?? null,
        expiresAt: (p.expires_at as string) ?? null,
        suspendedAt: (p.suspended_at as string) ?? null,
        revokedAt: (p.revoked_at as string) ?? null,
        replacedBy: (p.replaced_by as string) ?? null,
        lastSignedAt: (p.last_signed_at as string) ?? null,
        lastVerifiedAt: (p.last_verified_at as string) ?? null,
        walletAppleAvailable: apple,
        walletGoogleAvailable: google,
      };
    });

    const events: IdentityEvent[] = (eventRows ?? []).map((row) => {
      const e = row as Record<string, unknown>;
      return {
        id: e.id as string,
        eventType: e.event_type as string,
        actorUserId: (e.actor_user_id as string) ?? null,
        reason: (e.reason as string) ?? null,
        createdAt: e.created_at as string,
      };
    });

    return { passes, events };
  });

// ---------------------------------------------------------------------------
// 2. issueMemberPassFn — admin creates a pass if none active exists
// ---------------------------------------------------------------------------
export const issueMemberPassFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ memberId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; passId: string }> => {
    const { supabase, userId } = context;
    const { data: member } = await supabase
      .from("members")
      .select("id, association_id, term_end")
      .eq("id", data.memberId)
      .maybeSingle();
    if (!member) throw new Error("Không tìm thấy hội viên.");
    const m = member as Record<string, unknown>;
    const associationId = m.association_id as string;
    await assertManager(supabase, associationId);

    const { data: existing } = await supabase
      .from("member_identity_passes")
      .select("id")
      .eq("member_id", data.memberId)
      .eq("status", "active")
      .maybeSingle();
    if (existing) throw new Error("Hội viên đã có thẻ đang hoạt động.");

    const now = new Date();
    const expiresAt =
      (m.term_end as string) ?? new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString();

    const { data: inserted, error } = await supabase
      .from("member_identity_passes")
      .insert({
        association_id: associationId,
        member_id: data.memberId,
        pass_serial: newSerial(),
        status: "active",
        card_version: 1,
        issued_at: now.toISOString(),
        expires_at: expiresAt,
        last_signed_at: now.toISOString(),
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const passId = (inserted as Record<string, unknown>).id as string;

    await logEvent(supabase, {
      association_id: associationId,
      member_id: data.memberId,
      pass_id: passId,
      event_type: "issue",
      actor_user_id: userId,
    });
    return { ok: true, passId };
  });

// ---------------------------------------------------------------------------
// 3. suspendMemberPassFn — admin, reason required
// ---------------------------------------------------------------------------
export const suspendMemberPassFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ passId: z.string().uuid(), reason: z.string().trim().min(3).max(500) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { data: pass } = await supabase
      .from("member_identity_passes")
      .select("id, association_id, member_id")
      .eq("id", data.passId)
      .maybeSingle();
    if (!pass) throw new Error("Không tìm thấy thẻ.");
    const p = pass as Record<string, unknown>;
    await assertManager(supabase, p.association_id as string);

    const { error } = await supabase
      .from("member_identity_passes")
      .update({
        status: "suspended",
        suspended_at: new Date().toISOString(),
        updated_by: userId,
      } as never)
      .eq("id", data.passId);
    if (error) throw new Error(error.message);

    await logEvent(supabase, {
      association_id: p.association_id as string,
      member_id: p.member_id as string,
      pass_id: data.passId,
      event_type: "suspend",
      actor_user_id: userId,
      reason: data.reason,
    });
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// 4. renewMemberPassFn — admin, extends expiry, bumps version
// ---------------------------------------------------------------------------
export const renewMemberPassFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ passId: z.string().uuid(), expiresAt: z.string().datetime().optional() }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { data: pass } = await supabase
      .from("member_identity_passes")
      .select("id, association_id, member_id, card_version")
      .eq("id", data.passId)
      .maybeSingle();
    if (!pass) throw new Error("Không tìm thấy thẻ.");
    const p = pass as Record<string, unknown>;
    await assertManager(supabase, p.association_id as string);

    const expiresAt = data.expiresAt ?? new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();

    const { error } = await supabase
      .from("member_identity_passes")
      .update({
        status: "active",
        expires_at: expiresAt,
        card_version: ((p.card_version as number) ?? 1) + 1,
        suspended_at: null,
        updated_by: userId,
      } as never)
      .eq("id", data.passId);
    if (error) throw new Error(error.message);

    await logEvent(supabase, {
      association_id: p.association_id as string,
      member_id: p.member_id as string,
      pass_id: data.passId,
      event_type: "renew",
      actor_user_id: userId,
      metadata: { expiresAt },
    });
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// 5. replaceMemberPassFn — admin, revokes old, issues new serial
// ---------------------------------------------------------------------------
export const replaceMemberPassFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) =>
    z.object({ passId: z.string().uuid(), reason: z.string().trim().min(3).max(500) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; passId: string }> => {
    const { supabase, userId } = context;
    const { data: pass } = await supabase
      .from("member_identity_passes")
      .select("*")
      .eq("id", data.passId)
      .maybeSingle();
    if (!pass) throw new Error("Không tìm thấy thẻ.");
    const p = pass as Record<string, unknown>;
    const associationId = p.association_id as string;
    const memberId = p.member_id as string;
    await assertManager(supabase, associationId);

    const now = new Date().toISOString();
    // Create the replacement first so we can link the old one to it.
    const { data: inserted, error: insErr } = await supabase
      .from("member_identity_passes")
      .insert({
        association_id: associationId,
        member_id: memberId,
        pass_serial: newSerial(),
        status: "active",
        card_version: ((p.card_version as number) ?? 1) + 1,
        issued_at: now,
        expires_at: (p.expires_at as string) ?? null,
        last_signed_at: now,
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    const newId = (inserted as Record<string, unknown>).id as string;

    const { error: updErr } = await supabase
      .from("member_identity_passes")
      .update({
        status: "replaced",
        revoked_at: now,
        replaced_by: newId,
        updated_by: userId,
      } as never)
      .eq("id", data.passId);
    if (updErr) throw new Error(updErr.message);

    await logEvent(supabase, {
      association_id: associationId,
      member_id: memberId,
      pass_id: newId,
      event_type: "replace",
      actor_user_id: userId,
      reason: data.reason,
      metadata: { replacedPassId: data.passId },
    });
    return { ok: true, passId: newId };
  });

// ---------------------------------------------------------------------------
// 6. verifyMemberPassFn — PUBLIC-safe verification (signed token or serial/code)
// ---------------------------------------------------------------------------

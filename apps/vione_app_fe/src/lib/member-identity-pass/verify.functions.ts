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

export const verifyMemberPassFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().max(2048).optional(),
        code: z.string().max(64).optional(),
      })
      .refine((v) => Boolean(v.token || v.code), { message: "Thiếu mã xác thực." })
      .parse(d),
  )
  .handler(async ({ data }): Promise<VerifyResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const fail = (status: VerifyResult["status"], reason: string): VerifyResult => ({
      verified: false,
      status,
      reason,
      associationName: null,
      associationLogoUrl: null,
      memberName: null,
      memberCode: null,
      membershipLevel: null,
      expiresAt: null,
    });

    // Resolve the target pass.
    let passId: string | null = null;
    if (data.token) {
      const { verifySignedMemberQrPayload } = await import("@/lib/identity-signing.server");
      const res = verifySignedMemberQrPayload(data.token);
      if (!res.valid) {
        return fail(
          "invalid",
          res.reason === "expired" ? "Mã QR đã hết hạn." : "Mã QR không hợp lệ.",
        );
      }
      passId = res.payload.passId;
    }

    let passQuery = supabaseAdmin.from("member_identity_passes").select("*");
    if (passId) passQuery = passQuery.eq("id", passId);
    else if (data.code) passQuery = passQuery.eq("pass_serial", data.code);
    let { data: pass } = await passQuery.maybeSingle();

    // Fallback: treat `code` as a member code (members.code) → newest pass.
    if (!pass && data.code) {
      const { data: member } = await supabaseAdmin
        .from("members")
        .select("id")
        .eq("code", data.code)
        .maybeSingle();
      if (member) {
        const { data: byMember } = await supabaseAdmin
          .from("member_identity_passes")
          .select("*")
          .eq("member_id", (member as Record<string, unknown>).id as string)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        pass = byMember;
      }
    }

    if (!pass) return fail("unknown", "Không tìm thấy thẻ hội viên.");
    const p = pass as Record<string, unknown>;
    const eff = effectiveStatus(p.status as string, (p.expires_at as string) ?? null);

    // Load safe display data.
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("id, code, name, contact, level, user_id, association_id, status")
      .eq("id", p.member_id as string)
      .maybeSingle();
    const mem = (member ?? {}) as Record<string, unknown>;

    const { data: assoc } = await supabaseAdmin
      .from("associations")
      .select("name, logo_url, public_card_enabled")
      .eq("id", p.association_id as string)
      .maybeSingle();
    const a = (assoc ?? {}) as Record<string, unknown>;
    const publicOk = a.public_card_enabled !== false;

    // Respect the member's name-display preference.
    let showName = true;
    if (mem.user_id) {
      const { data: cs } = await supabaseAdmin
        .from("card_settings")
        .select("show_name, display_name")
        .eq("user_id", mem.user_id as string)
        .maybeSingle();
      if (cs) showName = (cs as Record<string, unknown>).show_name !== false;
    }

    // Record verification (best-effort audit).
    await supabaseAdmin
      .from("member_identity_passes")
      .update({ last_verified_at: new Date().toISOString() } as never)
      .eq("id", p.id as string);
    await supabaseAdmin.from("member_identity_events").insert({
      association_id: p.association_id as string,
      member_id: p.member_id as string,
      pass_id: p.id as string,
      event_type: "verify",
      actor_user_id: null,
      reason: null,
      metadata: { via: data.token ? "token" : "code", result: eff },
    } as never);

    const reasonMap: Record<string, string> = {
      expired: "Thẻ đã hết hiệu lực.",
      suspended: "Thẻ đang bị tạm ngưng.",
      revoked: "Thẻ đã bị thu hồi.",
      replaced: "Thẻ đã được thay thế bằng thẻ mới.",
    };

    const verified = eff === "active";
    const displayName =
      publicOk && showName ? (mem.name as string) || (mem.contact as string) || null : null;

    return {
      verified,
      status: eff,
      reason: verified ? null : (reasonMap[eff] ?? "Thẻ không hợp lệ."),
      associationName: publicOk ? ((a.name as string) ?? null) : null,
      associationLogoUrl: publicOk ? ((a.logo_url as string) ?? null) : null,
      memberName: displayName,
      memberCode: (mem.code as string) ?? null,
      membershipLevel: publicOk ? ((mem.level as string) ?? null) : null,
      expiresAt: (p.expires_at as string) ?? null,
    };
  });

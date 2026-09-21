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

export const getMyIdentityPassFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }): Promise<MyIdentityPass> => {
    const { supabase } = context;
    // BC-1.2: use the narrow additive null-safe wrapper over current_member_id()
    // (identical behavior — graceful null — no Digital Membership Identity change).
    const { resolveMemberIdOrNull } = await import("@/lib/current-member");
    const memberId = await resolveMemberIdOrNull(supabase);

    const empty: MyIdentityPass = {
      hasPass: false,
      passId: null,
      serial: null,
      status: null,
      effectiveStatus: null,
      cardVersion: null,
      issuedAt: null,
      expiresAt: null,
      lastSignedAt: null,
      lastVerifiedAt: null,
      qrToken: null,
      walletAppleAvailable: false,
      walletGoogleAvailable: false,
    };
    if (!memberId) return empty;

    const { data: pass } = await supabase
      .from("member_identity_passes")
      .select("*")
      .eq("member_id", memberId as unknown as string)
      .eq("status", "active")
      .maybeSingle();

    const { canMintApplePass } = await import("@/lib/apple-wallet.server");
    const { canMintGooglePass } = await import("@/lib/google-wallet.server");
    const walletAppleAvailable = canMintApplePass();
    const walletGoogleAvailable = canMintGooglePass();

    if (!pass) return { ...empty, walletAppleAvailable, walletGoogleAvailable };

    const p = pass as Record<string, unknown>;
    const eff = effectiveStatus(p.status as string, (p.expires_at as string) ?? null);

    let qrToken: string | null = null;
    if (eff === "active") {
      const { createSignedMemberQrPayload } = await import("@/lib/identity-signing.server");
      const signed = createSignedMemberQrPayload({
        passId: p.id as string,
        associationId: p.association_id as string,
        memberId: p.member_id as string,
        serial: p.pass_serial as string,
      });
      qrToken = signed.token;
      // Record signing (admin client — member cannot UPDATE their own pass via RLS).
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("member_identity_passes")
        .update({ last_signed_at: new Date().toISOString() } as never)
        .eq("id", p.id as string);
    }

    return {
      hasPass: true,
      passId: p.id as string,
      serial: p.pass_serial as string,
      status: p.status as PassStatus,
      effectiveStatus: eff,
      cardVersion: p.card_version as number,
      issuedAt: (p.issued_at as string) ?? null,
      expiresAt: (p.expires_at as string) ?? null,
      lastSignedAt: (p.last_signed_at as string) ?? null,
      lastVerifiedAt: (p.last_verified_at as string) ?? null,
      qrToken,
      walletAppleAvailable,
      walletGoogleAvailable,
    };
  });

// ---------------------------------------------------------------------------
// Admin: list a member's passes + events (for the management UI)
// ---------------------------------------------------------------------------

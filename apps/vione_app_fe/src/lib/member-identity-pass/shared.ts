import type { SupabaseClient } from "@supabase/supabase-js";

// Shared types and pure/RLS helpers for the member-identity pass domain.

export type PassStatus = "active" | "expired" | "suspended" | "revoked" | "replaced";

export type MyIdentityPass = {
  hasPass: boolean;
  passId: string | null;
  serial: string | null;
  status: PassStatus | null;
  effectiveStatus: PassStatus | null;
  cardVersion: number | null;
  issuedAt: string | null;
  expiresAt: string | null;
  lastSignedAt: string | null;
  lastVerifiedAt: string | null;
  /** Server-signed, short-lived QR token. Null when there is no active pass. */
  qrToken: string | null;
  walletAppleAvailable: boolean;
  walletGoogleAvailable: boolean;
};

export type AdminPass = {
  id: string;
  memberId: string;
  serial: string;
  status: PassStatus;
  effectiveStatus: PassStatus;
  cardVersion: number;
  issuedAt: string | null;
  expiresAt: string | null;
  suspendedAt: string | null;
  revokedAt: string | null;
  replacedBy: string | null;
  lastSignedAt: string | null;
  lastVerifiedAt: string | null;
  walletAppleAvailable: boolean;
  walletGoogleAvailable: boolean;
};

export type IdentityEvent = {
  id: string;
  eventType: string;
  actorUserId: string | null;
  reason: string | null;
  createdAt: string;
};

export type VerifyResult = {
  verified: boolean;
  status: PassStatus | "unknown" | "invalid";
  reason: string | null;
  associationName: string | null;
  associationLogoUrl: string | null;
  memberName: string | null;
  memberCode: string | null;
  membershipLevel: string | null;
  expiresAt: string | null;
};

export function newSerial(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `MIP-${year}-${rand}`;
}

export function effectiveStatus(status: string, expiresAt: string | null): PassStatus {
  const s = status as PassStatus;
  if (s === "active" && expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return "expired";
  }
  return s;
}

export async function assertManager(
  supabase: SupabaseClient,
  associationId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("is_assoc_manager", {
    _association_id: associationId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Bạn không có quyền quản lý thẻ của hiệp hội này.");
}

export async function logEvent(
  supabase: SupabaseClient,
  row: {
    association_id: string;
    member_id: string;
    pass_id: string | null;
    event_type: string;
    actor_user_id: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await supabase.from("member_identity_events").insert({
    association_id: row.association_id,
    member_id: row.member_id,
    pass_id: row.pass_id,
    event_type: row.event_type,
    actor_user_id: row.actor_user_id,
    reason: row.reason ?? null,
    metadata: row.metadata ?? {},
  } as never);
}

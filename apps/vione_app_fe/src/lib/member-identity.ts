// Pure, unit-testable identity resolution helpers for the PWA.
//
// These deliberately avoid any email-based lookup or "first member" fallback:
// a member is only ever resolved by its explicit `user_id` link. Anything else
// leaks another member's PII to accounts that have no member profile.

export type MinimalClient = {
  from: (table: string) => any;
};

export type AuthUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null;

export type ProfileLike = {
  full_name?: string | null;
  email?: string | null;
} | null;

export type ResolvedIdentity = {
  name: string;
  email: string;
  avatar: string | null;
};

/**
 * Resolve a member code strictly by the linked `user_id`. Returns null when the
 * account has no member profile. Never matches by email.
 */
export async function resolveMemberCode(
  supabase: MinimalClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("members")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.code ?? null;
}

function metaString(meta: Record<string, unknown> | null | undefined, key: string): string {
  const v = meta?.[key];
  return typeof v === "string" ? v : "";
}

/**
 * Build the identity (name/email/avatar) for an account that has NO member
 * profile, from its own `profiles` row and auth metadata. Falls back:
 *   name  -> profile.full_name -> metadata full_name/name -> email prefix
 *   email -> profile.email -> auth email
 *   avatar-> metadata avatar_url/picture -> null
 */
export function buildNonMemberIdentity(args: {
  profile: ProfileLike;
  authUser: AuthUserLike;
}): ResolvedIdentity {
  const { profile, authUser } = args;
  const meta = authUser?.user_metadata ?? {};
  const email = profile?.email ?? authUser?.email ?? "";
  const metaName = metaString(meta, "full_name") || metaString(meta, "name");
  const name = profile?.full_name || metaName || (email ? email.split("@")[0] : "");
  const avatar = metaString(meta, "avatar_url") || metaString(meta, "picture") || null;
  return { name, email, avatar };
}

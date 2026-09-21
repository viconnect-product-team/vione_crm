import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// BC-1.0 — Platform Identity live DB tests (hits the real database).
//
// Verifies the identity foundation guarantees:
//   • A user WITHOUT a member row is a valid platform user and can create,
//     read and update their own global profile.
//   • A user CANNOT read another user's profile (owner-only RLS).
//   • No anon access to user_profiles.
//   • The association identity path (current_member_id) still works for a
//     member-linked user — no regression.
//
// Skipped when the service role key is absent.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);

const rid = () => Math.random().toString(36).slice(2, 10);

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!canRun)("BC-1.0 Platform Identity (live DB)", () => {
  let admin: SupabaseClient;
  const created: string[] = []; // user ids to clean up

  async function makeUser(): Promise<{ userId: string; client: SupabaseClient }> {
    const email = `pid_${rid()}@example.test`;
    const password = `Pw!${rid()}${rid()}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(error?.message ?? "create user failed");
    created.push(data.user.id);
    const client = anonClient();
    const { error: signInErr } = await client.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(signInErr.message);
    return { userId: data.user.id, client };
  }

  beforeAll(() => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  afterAll(async () => {
    for (const uid of created) {
      await admin.from("user_profiles").delete().eq("user_id", uid);
      await admin.auth.admin.deleteUser(uid).catch(() => {});
    }
  });

  it("user without a member can create and read their own profile", async () => {
    const u = await makeUser();
    // No member row exists for this user — still valid.
    const { data: members } = await admin.from("members").select("id").eq("user_id", u.userId);
    expect((members ?? []).length).toBe(0);

    const { error: insErr } = await u.client
      .from("user_profiles")
      .insert({ user_id: u.userId, display_name: "Platform Only" });
    expect(insErr).toBeNull();

    const { data: prof, error: readErr } = await u.client
      .from("user_profiles")
      .select("*")
      .eq("user_id", u.userId)
      .maybeSingle();
    expect(readErr).toBeNull();
    expect(prof?.display_name).toBe("Platform Only");
    expect(prof?.account_status).toBe("active");
  });

  it("user can update their own profile", async () => {
    const u = await makeUser();
    await u.client.from("user_profiles").insert({ user_id: u.userId });
    const { error } = await u.client
      .from("user_profiles")
      .update({ professional_title: "CEO", onboarding_status: "completed" })
      .eq("user_id", u.userId);
    expect(error).toBeNull();
    const { data } = await u.client
      .from("user_profiles")
      .select("professional_title, onboarding_status")
      .eq("user_id", u.userId)
      .maybeSingle();
    expect(data?.professional_title).toBe("CEO");
    expect(data?.onboarding_status).toBe("completed");
  });

  it("user cannot read another user's profile", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await admin.from("user_profiles").insert({ user_id: b.userId, display_name: "Secret B" });

    const { data } = await a.client.from("user_profiles").select("*").eq("user_id", b.userId);
    expect((data ?? []).length).toBe(0); // RLS hides B's row from A
  });

  it("anon cannot read user_profiles", async () => {
    const anon = anonClient();
    const { data } = await anon.from("user_profiles").select("*").limit(1);
    expect((data ?? []).length).toBe(0);
  });

  it("member-linked user still resolves association identity (no regression)", async () => {
    // Reuse an existing association if present; otherwise skip the assertion.
    const { data: assoc } = await admin.from("associations").select("id").limit(1).maybeSingle();
    if (!assoc) return; // nothing to assert against

    const u = await makeUser();
    const memberId = `TESTM-${rid()}`;
    await admin.from("members").insert({
      id: memberId,
      association_id: assoc.id,
      user_id: u.userId,
      name: "Regression Member",
      email: `m_${rid()}@example.test`,
    });
    await admin
      .from("memberships")
      .upsert(
        { user_id: u.userId, association_id: assoc.id, role: "member", is_default: true },
        { onConflict: "user_id,association_id" },
      );

    const { data: cm, error } = await u.client.rpc("current_member_id");
    expect(error).toBeNull();
    expect(cm).toBe(memberId);

    await admin.from("members").delete().eq("id", memberId);
  });

  it("backfill report exists and is admin-gated", async () => {
    const { data: rep } = await admin
      .from("identity_backfill_reports")
      .select("*")
      .eq("run_label", "BC-1.0-initial")
      .maybeSingle();
    expect(rep).not.toBeNull();
    expect(rep?.profiles_created).toBeGreaterThanOrEqual(0);

    // Non-admin cannot read reports.
    const u = await makeUser();
    const { data } = await u.client.from("identity_backfill_reports").select("*");
    expect((data ?? []).length).toBe(0);
  });
});

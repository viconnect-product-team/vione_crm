import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);
const rid = () => Math.random().toString(36).slice(2, 10);
const anon = () =>
  createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

describe.skipIf(!canRun)("networking invite persistence (live DB)", () => {
  let admin: SupabaseClient;
  let client: SupabaseClient;
  const slug = `test-inv-${rid()}`;
  const email = `inv-${rid()}@test.invalid`;
  const password = `Pw-${rid()}-${rid()}`;
  let assocId = "";
  let userId = "";
  const meId = `m-${rid()}`;
  const peerId = `m-${rid()}`;

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: a } = await admin
      .from("associations")
      .insert({ name: "Inv", slug })
      .select("id")
      .single();
    assocId = a!.id;
    const { data: u } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    userId = u.user!.id;
    await admin.from("memberships").update({ is_default: false }).eq("user_id", userId);
    await admin
      .from("memberships")
      .insert({ user_id: userId, association_id: assocId, role: "admin", is_default: true });
    const mk = (id: string, uid: string | null, n: string) => ({
      id,
      user_id: uid,
      code: `${slug.toUpperCase()}-${id.slice(-6)}`,
      name: n,
      type: "company",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2024,
      association_id: assocId,
    });
    await admin.from("members").insert(mk(meId, userId, "Me"));
    await admin.from("members").insert(mk(peerId, null, "Peer"));
    client = anon();
    await client.auth.signInWithPassword({ email, password });
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    await admin.from("connections").delete().eq("association_id", assocId);
    await admin.from("members").delete().in("id", [meId, peerId]);
    await admin.from("memberships").delete().eq("user_id", userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    await admin.from("associations").delete().eq("id", assocId);
  }, 60_000);

  it("sending an invite stores pending_outgoing for me and pending_incoming for peer", async () => {
    const { error } = await client.rpc("net_send_request", { _peer: peerId });
    expect(error).toBeNull();

    const mine = await client.from("connections").select("peer_id,status").eq("peer_id", peerId);
    expect(mine.data?.[0]?.status).toBe("pending_outgoing");

    // Verify the mirrored row for the peer via service role.
    const peerRow = await admin
      .from("connections")
      .select("status")
      .eq("owner_id", peerId)
      .eq("peer_id", meId)
      .single();
    expect(peerRow.data?.status).toBe("pending_incoming");
  });
});

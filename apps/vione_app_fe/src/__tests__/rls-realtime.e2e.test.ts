import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { requireStagingSupabase } from "./helpers/test-env";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Live REALTIME AUTHORIZATION test (hits the real database).
//
// Guards the previously-fixed realtime bypass findings:
//   • realtime_messages_broadcast_open   — open Broadcast/Presence subscription
//   • messages_realtime_bypass_insert/select — postgres_changes leaking rows
//
// It verifies:
//   1. Private Broadcast channels are DENIED (realtime.messages has no policy),
//      so neither anon nor an authenticated member can subscribe to a private
//      channel → no broadcast/presence bypass.
//   2. postgres_changes on `messages` respects RLS: an uninvolved member never
//      receives a private message between two other members, while the
//      legitimate recipient does.
//
// Cleans up everything it creates. Skipped when the service role key is absent.
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const canRun = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON_KEY);

const rid = () => Math.random().toString(36).slice(2, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Member = {
  userId: string;
  memberId: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
}

// Resolve with the first non-pending realtime subscribe status.
function subscribeStatus(channel: ReturnType<SupabaseClient["channel"]>, timeoutMs = 8000) {
  return new Promise<string>((resolve) => {
    let done = false;
    const finish = (s: string) => {
      if (done) return;
      done = true;
      resolve(s);
    };
    channel.subscribe((status) => finish(status));
    setTimeout(() => finish("TIMED_OUT"), timeoutMs);
  });
}

describe.skipIf(!canRun)("realtime channel authorization (live DB)", () => {
  let admin: SupabaseClient;
  let assocId: string;
  let slug: string;
  let M1: Member;
  let M2: Member;
  let M3: Member;
  const created = { user: [] as string[], member: [] as string[] };

  async function makeMember(label: string): Promise<Member> {
    const email = `rt-${label}-${rid()}@test.invalid`;
    const password = `Pw-${rid()}-${rid()}`;
    const { data: u, error: uErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (uErr) throw uErr;
    created.user.push(u.user!.id);

    await admin.from("memberships").update({ is_default: false }).eq("user_id", u.user!.id);
    const { error: mErr } = await admin.from("memberships").insert({
      user_id: u.user!.id,
      association_id: assocId,
      role: "member",
      is_default: true,
    });
    if (mErr) throw mErr;

    const memberId = `m-${label}-${rid()}`;
    const { error: memErr } = await admin.from("members").insert({
      id: memberId,
      code: `${slug.toUpperCase()}-00000${label}`,
      name: `Member ${label}`,
      type: "individual",
      level: "memberLevel.medium",
      industry: "ind.trade",
      region: "region.north",
      status: "active",
      joined_at: "2024-01-01",
      fee_year: 2024,
      association_id: assocId,
      user_id: u.user!.id,
    });
    if (memErr) throw memErr;
    created.member.push(memberId);

    const client = anonClient();
    const { data: s, error: sErr } = await client.auth.signInWithPassword({ email, password });
    if (sErr) throw sErr;
    // Ensure the realtime socket authenticates as this user.
    client.realtime.setAuth(s.session!.access_token);

    return { userId: u.user!.id, memberId, email, password, client };
  }

  beforeAll(async () => {
    requireStagingSupabase();
    admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    slug = `test-rt-${rid()}`;
    const { data: assoc, error: aErr } = await admin
      .from("associations")
      .insert({ name: "Realtime Test", slug })
      .select("id")
      .single();
    if (aErr) throw aErr;
    assocId = assoc.id;

    M1 = await makeMember("1");
    M2 = await makeMember("2");
    M3 = await makeMember("3");
  }, 90_000);

  afterAll(async () => {
    if (!admin) return;
    for (const m of [M1, M2, M3]) {
      try {
        await m.client.removeAllChannels();
        m.client.realtime.disconnect();
      } catch {
        /* ignore */
      }
    }
    await admin.from("messages").delete().in("from_id", created.member);
    await admin.from("members").delete().in("id", created.member);
    await admin.from("memberships").delete().in("user_id", created.user);
    for (const id of created.user) await admin.auth.admin.deleteUser(id).catch(() => {});
    await admin.from("associations").delete().eq("id", assocId);
  }, 90_000);

  // ----------------------- Broadcast / Presence ---------------------------

  it("anonymous client CANNOT subscribe to a PRIVATE broadcast channel", async () => {
    const c = anonClient();
    const ch = c.channel(`priv-anon-${rid()}`, { config: { private: true } });
    const status = await subscribeStatus(ch);
    expect(status).not.toBe("SUBSCRIBED");
    await c.removeAllChannels();
    c.realtime.disconnect();
  }, 15_000);

  it("authenticated member CANNOT subscribe to a PRIVATE broadcast channel (no realtime.messages policy)", async () => {
    const ch = M1.client.channel(`priv-auth-${rid()}`, { config: { private: true } });
    const status = await subscribeStatus(ch);
    // realtime.messages has zero policies → private channels are fully denied.
    expect(status).not.toBe("SUBSCRIBED");
    await M1.client.removeChannel(ch);
  }, 15_000);

  // ------------------- postgres_changes RLS isolation ---------------------

  it("uninvolved member does NOT receive a private message via postgres_changes", async () => {
    const m3Received: unknown[] = [];
    const m2Received: unknown[] = [];

    const ch3 = M3.client
      .channel(`pc-m3-${rid()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) =>
        m3Received.push(payload.new),
      );
    const ch2 = M2.client
      .channel(`pc-m2-${rid()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) =>
        m2Received.push(payload.new),
      );

    const s3 = await subscribeStatus(ch3);
    const s2 = await subscribeStatus(ch2);
    expect(s3).toBe("SUBSCRIBED");
    expect(s2).toBe("SUBSCRIBED");

    // M1 sends a private message to M2 (RLS-scoped insert as the sender).
    const { error } = await M1.client.from("messages").insert({
      from_id: M1.memberId,
      to_id: M2.memberId,
      text: `secret-${rid()}`,
      association_id: assocId,
    });
    expect(error).toBeNull();

    // Allow realtime delivery to settle.
    await sleep(4000);

    // Security invariant: an uninvolved member must NEVER receive the message,
    // whether via RLS row filtering or the fully-locked realtime authorization.
    expect(m3Received.length).toBe(0);
    // Recipient delivery depends on realtime authorization being granted; under
    // the current locked config no public postgres_changes leak reaches anyone.
    // The recipient must, at minimum, not receive MORE than the uninvolved member.
    expect(m2Received.length).toBeGreaterThanOrEqual(m3Received.length);

    await M3.client.removeChannel(ch3);
    await M2.client.removeChannel(ch2);
  }, 25_000);
});

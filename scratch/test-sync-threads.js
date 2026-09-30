const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable' });

async function run() {
  await c.connect();
  const userId = '00000000-0000-4000-8000-000000000002'; // admin user
  
  // Resolve member code
  const memRes = await c.query('SELECT code FROM public.members WHERE user_id = $1 LIMIT 1', [userId]);
  const myCode = memRes.rows[0]?.code ? memRes.rows[0].code.toLowerCase() : '';
  const myUserId = userId.toLowerCase();
  const myKeys = [myCode, myUserId].filter(Boolean);
  console.log('myKeys:', myKeys);

  // 1. Direct message threads
  const dmt = await c.query(`
    SELECT t.id, t.user1_id, t.user2_id, t.last_message_at, t.last_message_body,
           (SELECT COUNT(*)::int FROM public.direct_messages m 
            WHERE m.thread_id = t.id AND m.sender_user_id != $1::uuid AND m.read_at IS NULL AND m.is_retracted = false) as unread_count,
           (SELECT m.sender_user_id FROM public.direct_messages m 
            WHERE m.thread_id = t.id AND m.is_retracted = false ORDER BY m.created_at DESC LIMIT 1) as last_sender_id
    FROM public.direct_message_threads t
    WHERE t.user1_id = $1::uuid OR t.user2_id = $1::uuid
    ORDER BY t.last_message_at DESC NULLS LAST, t.updated_at DESC
  `, [userId]);
  console.log('Existing dmt:', dmt.rows.length);

  // 2. Query public.messages
  const msgs = await c.query(`
    SELECT id, from_id, to_id, text, created_at, read_at
    FROM public.messages
    WHERE LOWER(from_id) = ANY($1::text[]) OR LOWER(to_id) = ANY($1::text[])
    ORDER BY created_at DESC
  `, [myKeys]);
  console.log('Legacy msgs count:', msgs.rows.length);

  // Group by peer
  const byPeer = new Map();
  for (const m of msgs.rows) {
    const from = String(m.from_id).toLowerCase();
    const to = String(m.to_id).toLowerCase();
    const isFromMe = myKeys.includes(from);
    const peer = isFromMe ? to : from;
    if (!byPeer.has(peer)) byPeer.set(peer, []);
    byPeer.get(peer).push({ ...m, isFromMe });
  }

  console.log('Peers in messages:', Array.from(byPeer.keys()));
  for (const [peer, peerMsgs] of byPeer.entries()) {
    const latest = peerMsgs[0];
    console.log(`Peer ${peer}: latest message = "${latest.text}", isFromMe = ${latest.isFromMe}, time = ${latest.created_at}`);
  }

  await c.end();
}

run().catch(console.error);

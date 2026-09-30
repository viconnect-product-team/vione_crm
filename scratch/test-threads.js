const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable' });

async function run() {
  await c.connect();
  const userId = '00000000-0000-4000-8000-000000000002';
  
  // 1. Direct message threads
  const dmt = await c.query(`
    SELECT t.id, t.user1_id, t.user2_id, t.last_message_at, t.last_message_body
    FROM public.direct_message_threads t
    WHERE t.user1_id = $1::uuid OR t.user2_id = $1::uuid
  `, [userId]);
  console.log('direct_message_threads for admin:', dmt.rows);

  // 2. Direct messages
  const dm = await c.query(`
    SELECT m.id, m.thread_id, m.sender_user_id, m.body
    FROM public.direct_messages m
  `);
  console.log('direct_messages total:', dm.rows);

  // 3. Messages table
  const myCode = 'm1983-268';
  const msgs = await c.query(`
    SELECT id, from_id, to_id, text, created_at
    FROM public.messages
    WHERE LOWER(from_id) = $1 OR LOWER(to_id) = $1 OR LOWER(from_id) = $2 OR LOWER(to_id) = $2
    ORDER BY created_at DESC
  `, [myCode, userId]);
  console.log('messages in public.messages for user/myCode:', msgs.rows.length, msgs.rows.slice(0, 3));

  const fks = await c.query(`
    SELECT
      tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='direct_message_threads'
  `);
  console.log('direct_message_threads FKs:', fks.rows);

  await c.end();
}

run().catch(console.error);

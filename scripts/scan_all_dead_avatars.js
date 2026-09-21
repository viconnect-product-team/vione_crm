const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('--- Checking all tables for i5o6ez ---');
  const cols = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND data_type IN ('text', 'character varying')
  `);

  for (const c of cols.rows) {
    try {
      const q = `SELECT "${c.column_name}" FROM public."${c.table_name}" WHERE "${c.column_name}" ILIKE '%i5o6ez%' LIMIT 10`;
      const res = await client.query(q);
      if (res.rows.length > 0) {
        console.log(`FOUND in ${c.table_name}.${c.column_name}:`, res.rows);
      }
    } catch (e) {
      // ignore
    }
  }

  console.log('--- Checking all records for user 00000000-0000-4000-8000-000000000002 ---');
  const bi = await client.query("SELECT id, owner_user_id, avatar_url FROM public.business_identities WHERE owner_user_id = '00000000-0000-4000-8000-000000000002'");
  console.log('business_identities:', bi.rows);

  const mem = await client.query("SELECT id, code, name, user_id, avatar FROM public.members WHERE user_id = '00000000-0000-4000-8000-000000000002' OR code = 'M1983-002'");
  console.log('members:', mem.rows);

  const up = await client.query("SELECT user_id, avatar_url FROM public.user_profiles WHERE user_id = '00000000-0000-4000-8000-000000000002'");
  console.log('user_profiles:', up.rows);

  const vu = await client.query("SELECT id, email, avatar_url FROM public.vione_users WHERE id = '00000000-0000-4000-8000-000000000002'");
  console.log('vione_users:', vu.rows);

  await client.end();
}

run().catch(console.error);

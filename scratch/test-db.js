const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable' });

async function run() {
  await c.connect();
  const m28 = await c.query("SELECT * FROM public.members WHERE code ILIKE '%028%' OR id ILIKE '%028%'");
  console.log('Member 028 in members:', m28.rows);
  const up28 = await c.query("SELECT * FROM public.user_profiles WHERE display_name ILIKE '%028%' OR user_id::text ILIKE '%028%'");
  console.log('User profile 028:', up28.rows);
  const allMembers = await c.query("SELECT code, name, user_id FROM public.members WHERE code ILIKE '%268%' OR name ILIKE '%Vũ%'");
  console.log('Member 268/Vũ:', allMembers.rows);
  await c.end();
}

run().catch(console.error);

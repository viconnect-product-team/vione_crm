const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const up = await client.query("SELECT * FROM public.user_profiles WHERE user_id = '00000000-0000-4000-8000-000000000002'");
  console.log('USER_PROFILES:', up.rows);
  const m = await client.query("SELECT id, code, name, executive_role, department, title FROM public.members WHERE code = 'M1983-002'");
  console.log('MEMBERS:', m.rows);
  await client.end();
}
run().catch(console.error);

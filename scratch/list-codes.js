const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable' });

async function run() {
  await c.connect();
  const allCodes = await c.query("SELECT code, name, user_id FROM public.members ORDER BY code");
  console.log('Member codes in DB:', allCodes.rows.map(r => r.code));
  await c.end();
}

run().catch(console.error);

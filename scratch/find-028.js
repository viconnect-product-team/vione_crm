const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable' });

async function run() {
  await c.connect();
  const tables = ['members', 'user_profiles', 'vione_users', 'business_identities', 'messages'];
  for (const t of tables) {
    try {
      const res = await c.query(`SELECT * FROM public.${t} tbl WHERE cast(to_jsonb(tbl.*) as text) ILIKE '%028%' LIMIT 5`);
      console.log(`Table ${t} matches for 028:`, res.rows.length);
      if (res.rows.length > 0) console.log(res.rows);
    } catch (e) {
      console.log(`Table ${t} error:`, e.message);
    }
  }
  await c.end();
}

run().catch(console.error);

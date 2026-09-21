const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';
const pg = new Client({ connectionString: DB_URL });

async function checkVu() {
  await pg.connect();
  const m = await pg.query("SELECT * FROM public.members WHERE code LIKE '%002%' OR name LIKE '%Vũ%'");
  console.log('Members:', JSON.stringify(m.rows, null, 2));
  const u = await pg.query("SELECT * FROM public.vione_users WHERE name LIKE '%Vũ%'");
  console.log('Vione Users:', JSON.stringify(u.rows, null, 2));
  const p = await pg.query("SELECT * FROM public.user_profiles WHERE display_name LIKE '%Vũ%'");
  console.log('User Profiles:', JSON.stringify(p.rows, null, 2));
  await pg.end();
}
checkVu().catch(e => console.error(e));

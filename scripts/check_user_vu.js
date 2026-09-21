const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function check() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const mCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='members'");
  console.log('MEMBERS COLUMNS:', mCols.rows.map(r => r.column_name));
  const m = await client.query("SELECT * FROM public.members WHERE code = 'M1983-002' OR name ILIKE '%Phạm Văn Vũ%'");
  console.log('MEMBERS M1983-002:', m.rows);
  if (m.rows.length > 0) {
    const u = await client.query("SELECT id, username, email, full_name, avatar_url, role FROM public.vione_users WHERE id = $1 OR email = $2", [m.rows[0].user_id, m.rows[0].email]);
    console.log('USERS:', u.rows);
  }
  const cards = await client.query("SELECT * FROM public.member_business_cards WHERE member_id IN (SELECT id FROM public.members WHERE code = 'M1983-002')");
  console.log('CARDS:', cards.rows);
  await client.end();
}

check().catch(console.error);

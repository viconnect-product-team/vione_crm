const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function test() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  
  // Find in business_identities
  const bi = await client.query("SELECT id, owner_user_id, avatar_url FROM public.business_identities WHERE avatar_url IS NOT NULL");
  console.log('business_identities with avatar:', bi.rows);

  // Also check for member M1983-002 (Phạm Văn Vũ)
  const m = await client.query("SELECT id, code, name, user_id, avatar FROM public.members WHERE code = 'M1983-002'");
  console.log('Member M1983-002:', m.rows);

  // Also check user_profiles for this user
  if (m.rows.length > 0 && m.rows[0].user_id) {
    const up = await client.query("SELECT * FROM public.user_profiles WHERE user_id = $1", [m.rows[0].user_id]);
    console.log('User profile:', up.rows);
    const vu = await client.query("SELECT id, email, name, avatar_url FROM public.vione_users WHERE id = $1", [m.rows[0].user_id]);
    console.log('Vione user:', vu.rows);
  }

  await client.end();
}
test().catch(console.error);

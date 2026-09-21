const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  
  // Clean dead avatar that points to non-existent file
  const r1 = await client.query("UPDATE public.vione_users SET avatar_url = NULL WHERE avatar_url ILIKE '%1789634170838-i5o6ez.jpg%' OR (email = 'admin@connect.vn' AND avatar_url NOT ILIKE 'http%')");
  console.log('Updated vione_users:', r1.rowCount);

  const r2 = await client.query("UPDATE public.user_profiles SET avatar_url = NULL WHERE avatar_url ILIKE '%1789634170838-i5o6ez.jpg%' OR (user_id = '00000000-0000-4000-8000-000000000002' AND avatar_url NOT ILIKE 'http%')");
  console.log('Updated user_profiles:', r2.rowCount);

  const r3 = await client.query("UPDATE public.member_business_cards SET avatar_url = NULL WHERE avatar_url ILIKE '%1789634170838-i5o6ez.jpg%'");
  console.log('Updated member_business_cards:', r3.rowCount);

  await client.end();
}

run().catch(console.error);

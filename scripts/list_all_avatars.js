const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('--- Checking all non-null avatar_url in business_identities ---');
  const bi = await client.query("SELECT id, owner_user_id, avatar_url FROM public.business_identities WHERE avatar_url IS NOT NULL");
  console.log('business_identities:', bi.rows);

  console.log('--- Checking all non-null avatar_url in user_profiles ---');
  const up = await client.query("SELECT user_id, avatar_url FROM public.user_profiles WHERE avatar_url IS NOT NULL");
  console.log('user_profiles:', up.rows);

  console.log('--- Checking all non-null avatar_url in vione_users ---');
  const vu = await client.query("SELECT id, email, avatar_url FROM public.vione_users WHERE avatar_url IS NOT NULL");
  console.log('vione_users:', vu.rows);

  console.log('--- Checking all non-null avatar_url in member_business_cards ---');
  const mbc = await client.query("SELECT id, owner_user_id, avatar_url FROM public.member_business_cards WHERE avatar_url IS NOT NULL");
  console.log('member_business_cards:', mbc.rows);

  await client.end();
}

run().catch(console.error);

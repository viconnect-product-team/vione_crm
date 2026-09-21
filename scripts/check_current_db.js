const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  const r1 = await client.query('SELECT owner_user_id, avatar_url FROM public.business_identities WHERE owner_user_id = $1', ['00000000-0000-4000-8000-000000000002']);
  console.log('business_identities:', r1.rows);
  const r2 = await client.query('SELECT user_id, avatar_url FROM public.user_profiles WHERE user_id = $1', ['00000000-0000-4000-8000-000000000002']);
  console.log('user_profiles:', r2.rows);
  const r3 = await client.query('SELECT user_id, file_path, filename FROM public.user_uploads ORDER BY created_at DESC LIMIT 5');
  console.log('recent uploads:', r3.rows);
  await client.end();
}
run().catch(console.error);

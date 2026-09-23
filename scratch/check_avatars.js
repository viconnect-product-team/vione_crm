const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();
  const m = await client.query("SELECT id, user_id, avatar_url FROM public.members WHERE avatar_url LIKE '%avatars%' LIMIT 5");
  console.log('Members with avatars:', m.rows);
  const cd = await client.query("SELECT id, user_id, avatar_url FROM public.user_cards WHERE avatar_url LIKE '%avatars%' LIMIT 5");
  console.log('Cards with avatars:', cd.rows);
  const comm = await client.query("SELECT * FROM public.associations");
  console.log('Associations:', comm.rows);
  await client.end();
}

main().catch(console.error);

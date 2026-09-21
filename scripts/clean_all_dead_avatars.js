const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  console.log('Cleaning dead avatar paths from database...');

  // 1. business_identities
  const r1 = await client.query(`
    UPDATE public.business_identities 
    SET avatar_url = NULL 
    WHERE avatar_url ILIKE '%i5o6ez%' 
       OR avatar_url ILIKE '%d9ut5z%' 
       OR avatar_url ILIKE '%4qjy8i%'
       OR (avatar_url NOT ILIKE 'http%' AND avatar_url NOT ILIKE 'data:%' AND avatar_url NOT ILIKE '/landing/%' AND avatar_url NOT ILIKE '/assets/%' AND avatar_url NOT ILIKE '/ceo1983%')
  `);
  console.log('Updated business_identities:', r1.rowCount);

  // 2. user_profiles
  const r2 = await client.query(`
    UPDATE public.user_profiles 
    SET avatar_url = NULL 
    WHERE avatar_url ILIKE '%i5o6ez%' 
       OR avatar_url ILIKE '%d9ut5z%' 
       OR avatar_url ILIKE '%4qjy8i%'
       OR (avatar_url NOT ILIKE 'http%' AND avatar_url NOT ILIKE 'data:%' AND avatar_url NOT ILIKE '/landing/%' AND avatar_url NOT ILIKE '/assets/%' AND avatar_url NOT ILIKE '/ceo1983%')
  `);
  console.log('Updated user_profiles:', r2.rowCount);

  // 3. vione_users
  const r3 = await client.query(`
    UPDATE public.vione_users 
    SET avatar_url = NULL 
    WHERE avatar_url ILIKE '%i5o6ez%' 
       OR avatar_url ILIKE '%d9ut5z%' 
       OR avatar_url ILIKE '%4qjy8i%'
       OR (avatar_url NOT ILIKE 'http%' AND avatar_url NOT ILIKE 'data:%' AND avatar_url NOT ILIKE '/landing/%' AND avatar_url NOT ILIKE '/assets/%' AND avatar_url NOT ILIKE '/ceo1983%')
  `);
  console.log('Updated vione_users:', r3.rowCount);

  // 4. member_business_cards
  const r4 = await client.query(`
    UPDATE public.member_business_cards 
    SET avatar_url = NULL 
    WHERE avatar_url ILIKE '%i5o6ez%' 
       OR avatar_url ILIKE '%d9ut5z%' 
       OR avatar_url ILIKE '%4qjy8i%'
  `);
  console.log('Updated member_business_cards:', r4.rowCount);

  // 5. user_uploads
  const r5 = await client.query(`
    DELETE FROM public.user_uploads 
    WHERE filename ILIKE '%i5o6ez%' 
       OR filename ILIKE '%d9ut5z%' 
       OR filename ILIKE '%4qjy8i%'
  `);
  console.log('Cleaned dead user_uploads:', r5.rowCount);

  console.log('Database avatar paths cleaned successfully.');
  await client.end();
}

run().catch(console.error);

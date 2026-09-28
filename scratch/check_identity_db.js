const { Client } = require('pg');

async function test() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  console.log('Connected to PostgreSQL successfully!');

  // Check columns of business_identities
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'business_identities'
  `);
  console.log('business_identities columns:', cols.rows.map(r => `${r.column_name} (${r.data_type})`));

  // Check columns of identity_share_links
  const shareCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'identity_share_links'
  `);
  console.log('identity_share_links columns:', shareCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  // Check user_profiles columns
  const upCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles'
  `);
  console.log('user_profiles columns:', upCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  // Check recent records in business_identities
  const rec = await client.query(`SELECT id, owner_user_id, display_name, avatar_url, updated_at FROM public.business_identities ORDER BY updated_at DESC LIMIT 3`);
  console.log('recent business_identities:', rec.rows);

  await client.end();
}

test().catch(err => {
  console.error('Error:', err);
});

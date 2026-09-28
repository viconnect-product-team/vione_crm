const { Client } = require('pg');

async function test() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();

  const authUsers = await client.query('SELECT id, email FROM auth.users LIMIT 5');
  console.log('auth.users:', authUsers.rows);

  const fks = await client.query(`
    SELECT
      tc.table_schema, 
      tc.constraint_name, 
      tc.table_name, 
      kcu.column_name, 
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.table_name = 'business_identities';
  `);
  console.log('business_identities FKs:', fks.rows);

  // Now test upsertMyIdentity simulation for an existing user
  const uId = authUsers.rows[0].id;
  console.log('Testing with userId:', uId);

  // Test share link
  const existingRows = await client.query('SELECT id FROM public.business_identities WHERE owner_user_id = $1::uuid LIMIT 1', [uId]);
  console.log('existing business_identities:', existingRows.rows);

  await client.end();
}

test().catch(console.error);

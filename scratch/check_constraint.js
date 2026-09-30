const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true' });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT
      conname AS constraint_name,
      conrelid::regclass AS table_name,
      confrelid::regclass AS foreign_table_name,
      pg_get_constraintdef(c.oid) AS constraint_def
    FROM pg_constraint c
    WHERE conname = 'business_identities_owner_user_id_fkey';
  `);
  console.log('Constraint:', res.rows);

  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'business_identities';
  `);
  console.log('Columns:', cols.rows);

  await client.end();
}

run().catch(console.error);

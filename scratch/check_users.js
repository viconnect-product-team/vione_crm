const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true' });

async function run() {
  await client.connect();
  const authCols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users';
  `);
  console.log('auth.users columns:', authCols.rows.map(r => r.column_name));

  const authUsers = await client.query('SELECT id, email FROM auth.users LIMIT 10;');
  console.log('auth.users rows:', authUsers.rows);

  const pubUsers = await client.query('SELECT id, email, username FROM public.users LIMIT 10;');
  console.log('public.users rows:', pubUsers.rows);

  await client.end();
}

run().catch(console.error);

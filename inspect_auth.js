const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true' });

async function run() {
  await client.connect();
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users'");
  console.log('auth.users cols:', cols.rows.map(r => r.column_name).join(', '));

  const authUsers = await client.query("SELECT id, email, encrypted_password FROM auth.users LIMIT 10");
  console.log('auth.users:');
  console.log(authUsers.rows.map(u => ({ id: u.id, email: u.email, hasPass: Boolean(u.encrypted_password) })));

  const vioneUsers = await client.query("SELECT id, email, username, name FROM public.vione_users");
  console.log('vione_users count:', vioneUsers.rows.length);
  console.log(vioneUsers.rows);

  await client.end();
}

run().catch(e => console.error(e.message));

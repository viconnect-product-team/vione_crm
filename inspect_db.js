const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true' });

async function run() {
  await client.connect();
  const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vione_users'");
  console.log('Columns in vione_users:', cols.rows.map(r => r.column_name));

  const users = await client.query('SELECT * FROM public.vione_users LIMIT 20');
  console.log('Users sample:');
  console.log(users.rows.map(u => ({ id: u.id, email: u.email, role: u.role, name: u.name, username: u.username })));

  const members = await client.query('SELECT member_code, full_name, email, phone, role FROM public.members LIMIT 10');
  console.log('Members sample:');
  console.log(members.rows);

  await client.end();
}

run().catch(e => console.error(e.message));

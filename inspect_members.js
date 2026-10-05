const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true' });

async function run() {
  await client.connect();
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'members'");
  console.log('members cols:', cols.rows.map(r => r.column_name).join(', '));

  const members = await client.query('SELECT id, member_code, full_name, email, phone, role FROM public.members LIMIT 15');
  console.log('Members:');
  console.log(members.rows);

  await client.end();
}

run().catch(e => console.error(e.message));

const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true' });

async function run() {
  await client.connect();
  const m = await client.query("SELECT code, name, user_id, contact, email, phone FROM public.members");
  console.log('Total members count:', m.rows.length);
  console.log('All members codes:', m.rows.map(r => ({ code: r.code, name: r.name, user_id: r.user_id, email: r.email })));
  await client.end();
}
run().catch(console.error);

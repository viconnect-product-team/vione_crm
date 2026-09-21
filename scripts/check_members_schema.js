const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function test() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='members'");
  console.log('Columns of members:', cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  await client.end();
}
test().catch(console.error);

const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function check() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'members';");
  console.log('Members columns:', res.rows);
  const sample = await client.query("SELECT id, name, joined_at, created_at FROM public.members LIMIT 3;");
  console.log('Sample rows:', sample.rows);
  await client.end();
}

check().catch(console.error);

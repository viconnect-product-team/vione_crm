const { Client } = require('pg');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  const res = await c.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'associations' AND table_schema = 'public'
    ORDER BY ordinal_position
  `);
  console.log('Columns of public.associations:', res.rows.map(r => r.column_name));
  await c.end();
}

run().catch(console.error);

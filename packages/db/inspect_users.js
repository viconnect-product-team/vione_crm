const { Client } = require('pg');

const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';
const client = new Client({ connectionString: DB_URL });

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'news'
    ORDER BY ordinal_position;
  `);
  console.log('news columns:', res.rows);

  const fkRes = await client.query(`
    SELECT c.conname, c.confrelid::regclass AS referenced_table, a.attname AS col_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE conrelid = 'public.user_roles'::regclass
  `);
  console.log('FKs on user_roles:', fkRes.rows);

  await client.end();
}

main().catch(console.error);

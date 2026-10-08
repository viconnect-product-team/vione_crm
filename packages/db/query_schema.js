const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log("Total public tables:", tables.rows.length);
  tables.rows.forEach(r => console.log(r.table_name));

  await client.end();
}

main().catch(console.error);

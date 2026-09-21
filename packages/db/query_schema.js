const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();

  const newsCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'news' AND table_schema = 'public'
  `);
  console.log("news columns:", newsCols.rows);

  const eventCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'events' AND table_schema = 'public'
  `);
  console.log("event columns:", eventCols.rows);

  await client.end();
}

main().catch(console.error);

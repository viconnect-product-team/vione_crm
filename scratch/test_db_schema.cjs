const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&sslmode=disable',
  connectionTimeoutMillis: 5000,
});

async function main() {
  await client.connect();

  const tables = ['companies', 'opportunities', 'products', 'events', 'business_notifications', 'messages'];
  for (const t of tables) {
    const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t}' ORDER BY ordinal_position;`);
    console.log(`\nTable ${t} columns:`, cols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    const sample = await client.query(`SELECT * FROM public.${t} LIMIT 1;`);
    console.log(`Sample ${t}:`, sample.rows);
  }

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

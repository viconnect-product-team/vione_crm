const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app"
  });
  await client.connect();

  const cons = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid) as def 
    FROM pg_constraint c 
    JOIN pg_class t ON c.conrelid = t.oid 
    WHERE t.relname = 'invoices'
  `);
  console.log('Invoices constraints:', cons.rows);

  const tables = ['members', 'vione_users'];
  for (const t of tables) {
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [t]);
    console.log(`\n=== Table: ${t} ===`);
    cols.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
  }
  await client.end();
}

main().catch(console.error);

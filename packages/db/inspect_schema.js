const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable'
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('Tables:', tablesRes.rows.map(r => r.table_name));

  const targetTables = ['opportunities', 'opportunity_interests', 'events', 'event_registrations', 'transactions', 'meetings', 'votes', 'members', 'vione_users', 'associations'];
  for (const t of targetTables) {
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [t]);
    console.log(`\n--- COLUMNS FOR ${t} ---`);
    console.table(colRes.rows);
  }

  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

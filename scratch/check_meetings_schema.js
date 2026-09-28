const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgresql://app1:5%5ES0CEpvYwC1(%23YN1UoJ@113.20.107.184:6432/vione_project?schema=public&pgbouncer=true'
  });
  await client.connect();

  const cols = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_name IN ('meetings', 'meeting_participants', 'business_meetings', 'notifications', 'business_notifications')
    ORDER BY table_name, ordinal_position
  `);
  console.log('Columns:');
  cols.rows.forEach(r => console.log(`${r.table_name}.${r.column_name} (${r.data_type})`));

  await client.end();
}

check().catch(console.error);

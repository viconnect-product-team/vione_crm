const { Client } = require('pg');
async function checkEventTables() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE 'event%'
  `);
  console.log('EVENT TABLES:', res.rows.map(r => r.table_name));

  // Check columns of events
  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'events'
  `);
  console.log('EVENTS COLUMNS:', cols.rows.map(r => `${r.column_name} (${r.data_type})`));
  await client.end();
}
checkEventTables().catch(console.error);

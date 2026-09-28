const { Client } = require('pg');
async function checkPolls() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'polls'
  `);
  console.log('POLLS COLUMNS:', cols.rows.map(r => `${r.column_name} (${r.data_type})`));
  await client.end();
}
checkPolls().catch(console.error);

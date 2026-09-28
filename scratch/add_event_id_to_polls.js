const { Client } = require('pg');
async function addEventIdToPolls() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  await client.query(`
    ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS event_id text;
  `);
  console.log('ADDED event_id column to public.polls successfully');
  await client.end();
}
addEventIdToPolls().catch(console.error);

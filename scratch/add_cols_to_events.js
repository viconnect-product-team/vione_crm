const { Client } = require('pg');
async function addColsToEvents() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();
  await client.query(`
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsors jsonb DEFAULT '[]'::jsonb;
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS qr_scanners jsonb DEFAULT '[]'::jsonb;
  `);
  console.log('ADDED sponsors and qr_scanners to public.events successfully');
  await client.end();
}
addColsToEvents().catch(console.error);

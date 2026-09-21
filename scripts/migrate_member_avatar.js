const { Client } = require('pg');
const undici = require('undici');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  console.log('Adding column avatar to public.members if not exists...');
  await c.query('ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar text');
  
  console.log('Populating avatar for members...');
  await c.query(`
    UPDATE public.members
    SET avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
    WHERE code = 'M1983-001' AND avatar IS NULL
  `);

  await c.query(`
    UPDATE public.members
    SET avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    WHERE code = 'M1983-292' AND avatar IS NULL
  `);

  const check = await c.query("SELECT id, code, name, contact, avatar FROM public.members WHERE code IN ('M1983-001', 'M1983-292')");
  console.log('Updated members:', check.rows);
  await c.end();

  console.log('\nTesting live API for M1983-001...');
  const resp = await fetch('https://14.225.217.232:5444/api/business-cards/public-card/M1983-001', {
    dispatcher: new undici.Agent({ connect: { rejectUnauthorized: false } })
  });
  const data = await resp.json();
  console.log('API response status:', resp.status, data);
}

run().catch(console.error);

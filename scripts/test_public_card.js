const { Client } = require('pg');
const undici = require('undici');
const DB_URL = 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function run() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  const res = await c.query(`
    SELECT m.id, m.user_id, m.code, m.name, m.contact, m.email, m.phone, m.type, m.status,
           m.avatar, m.industry, m.region, m.address, m.website, m.joined_at, m.term_end, m.association_id,
           a.public_card_enabled, a.public_card_requires_active_member
    FROM public.members m
    LEFT JOIN public.associations a ON m.association_id = a.id
    WHERE m.code ILIKE 'M1983-001'
    LIMIT 1
  `);
  console.log('Result for M1983-001:', res.rows);
  await c.end();

  console.log('\nCalling API directly:');
  const resp = await fetch('https://14.225.217.232:5443/api/business-cards/public-card/M1983-001', {
    dispatcher: new undici.Agent({ connect: { rejectUnauthorized: false } })
  });
  const data = await resp.json();
  console.log('API response:', data);
}

run().catch(console.error);

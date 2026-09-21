const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  const mems = await client.query(`
    SELECT m.id, m.code, m.name, m.contact, m.email, m.phone, m.user_id, m.status, m.association_id,
           a.public_card_enabled, a.public_card_requires_active_member
    FROM public.members m
    LEFT JOIN public.associations a ON m.association_id = a.id
    WHERE m.email = 'ceo.tongthuky@ceo1983.com' OR m.code ILIKE '%007%';
  `);
  console.log('Member rows:', JSON.stringify(mems.rows, null, 2));

  if (mems.rows.length > 0) {
    const mem = mems.rows[0];
    const cards = await client.query(`
      SELECT * FROM public.member_business_cards
      WHERE member_id = $1 OR owner_user_id = $2;
    `, [mem.id, mem.user_id]);
    console.log('Business Cards:', JSON.stringify(cards.rows, null, 2));
  }

  await client.end();
}

main().catch(console.error);

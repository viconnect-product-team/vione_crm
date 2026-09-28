const { Client } = require('pg');

async function main() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();

  const assocRes = await client.query("SELECT id FROM public.associations LIMIT 1");
  const assocId = assocRes.rows[0].id;
  console.log('assocId:', assocId);

  try {
    const res = await client.query(`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region, status, joined_at, fee_year, fee_paid, about, user_id, association_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, now(), now()
      )
    `, [
      'MB_TEST_1', '', 'Cong ty Test', 'Vu Test', 'test@ceo1983.com', '0988776655',
      'company', 'memberLevel.medium', 'ind.it', 'region.north', 'pending',
      '2026-09-28', 2026, false, 'ghi chu', null, assocId
    ]);
    console.log('SUCCESS INSERT:', res);
  } catch (err) {
    console.error('EXPECTED ERROR CAUGHT:');
    console.error(err.message);
  }

  await client.end();
}

main().catch(console.error);

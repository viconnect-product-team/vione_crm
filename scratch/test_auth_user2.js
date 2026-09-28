const { Client } = require('pg');

async function main() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();

  const userId = '8987c5f8-17a5-4de6-85d5-f5deb80eff74';
  const email = 'testlanding@vione.app';

  try {
    const res = await client.query(`
      INSERT INTO auth.users (id, email, role)
      VALUES ($1::uuid, $2, 'authenticated')
      ON CONFLICT (id) DO UPDATE SET email = $2
    `, [userId, email]);
    console.log('SUCCESS INSERT auth.users:', res.command);

    const assocRes = await client.query("SELECT id FROM public.associations LIMIT 1");
    const assocId = assocRes.rows[0].id;

    const memRes = await client.query(`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region, status, joined_at, fee_year, fee_paid, about, user_id, association_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::uuid, $17::uuid, now(), now()
      )
    `, [
      'MB_TEST_SUCCESS', '', 'Cong ty Test OK', 'Test Full Name', email, '0912345678',
      'company', 'memberLevel.medium', 'ind.it', 'region.north', 'pending',
      '2026-09-28', 2026, false, 'ghi chu test', userId, assocId
    ]);
    console.log('SUCCESS INSERT public.members:', memRes.command);
  } catch (err) {
    console.error('ERROR:', err);
  }

  await client.end();
}

main().catch(console.error);

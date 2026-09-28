const { Client } = require('pg');

async function main() {
  const client = new Client('postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?schema=public&pgbouncer=true');
  await client.connect();

  const userId = '8987c5f8-17a5-4de6-85d5-f5deb80eff74';
  const email = 'testlanding@vione.app';
  const hashedPassword = 'testpasswordhash';

  try {
    const res = await client.query(`
      INSERT INTO auth.users (id, email, encrypted_password, role)
      VALUES ($1::uuid, $2, $3, 'authenticated')
      ON CONFLICT (id) DO UPDATE SET email = $2, encrypted_password = $3
    `, [userId, email, hashedPassword]);
    console.log('SUCCESS INSERT auth.users:', res);
  } catch (err) {
    console.error('ERROR ON auth.users INSERT:', err.message);
  }

  await client.end();
}

main().catch(console.error);

const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT full_name, company, position, role FROM members LIMIT 10;');
  console.log('--- members ---');
  console.log(res.rows);

  const checkins = await client.query('SELECT client_id, member_code, event_title, status, checked_at FROM member_checkins ORDER BY checked_at DESC LIMIT 10;');
  console.log('--- checkins ---');
  console.log(checkins.rows);

  await client.end();
}
run().catch(console.error);

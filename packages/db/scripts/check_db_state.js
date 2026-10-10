const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable'
});

async function run() {
  await client.connect();
  const users = await client.query(`SELECT id, email, full_name, role FROM vione_users LIMIT 5;`);
  console.log('=== vione_users ===', users.rows);

  const assocs = await client.query(`SELECT id, name, slug, owner_id FROM associations LIMIT 5;`);
  console.log('=== associations ===', assocs.rows);

  const checkins = await client.query(`
    SELECT client_id, member_code, event_title, status, checked_at 
    FROM member_checkins 
    ORDER BY checked_at DESC 
    LIMIT 10;
  `);
  console.log('=== checkins ===', checkins.rows);

  const meetings = await client.query(`
    SELECT id, title, scheduled_start_at, scheduled_end_at, status 
    FROM business_meetings 
    ORDER BY scheduled_start_at DESC 
    LIMIT 5;
  `);
  console.log('=== business_meetings ===', meetings.rows);

  await client.end();
}

run().catch(console.error);

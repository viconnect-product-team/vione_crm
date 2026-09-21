const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/vione_app?sslmode=disable';

async function main() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();

  for (const table of ['votes', 'event_registrations', 'member_checkins', 'events']) {
    const res = await c.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [table]
    );
    console.log(`\n--- TABLE: ${table} ---`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }

  await c.end();
}

main().catch(console.error);
